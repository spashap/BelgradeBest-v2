// Bearer-token gate for the Growth API (/api/growth/*).
//
// Machine auth only: the admin cookie is NOT accepted here, and this token is
// never used by a browser. GROWTH_AGENT_TOKEN unset → the whole API answers
// 503 "not configured" (safe failure, nothing leaks). Wrong/missing bearer →
// 401. Comparison is constant-time over sha256 digests so neither the token
// length nor its prefix leaks through timing.
import { createHash, timingSafeEqual } from "node:crypto";

export type AuthResult = { ok: true } | { ok: false; status: 401 | 503; error: string; message: string };

const digest = (s: string) => createHash("sha256").update(s, "utf8").digest();

export function bearerFrom(request: Request): string | null {
  const h = request.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1].trim() : null;
}

export function checkAuth(request: Request, configuredToken: string | undefined): AuthResult {
  const token = (configuredToken ?? "").trim();
  if (!token) {
    return {
      ok: false,
      status: 503,
      error: "growth_api_not_configured",
      message: "GROWTH_AGENT_TOKEN is not set on the server.",
    };
  }
  const presented = bearerFrom(request);
  if (!presented || !timingSafeEqual(digest(presented), digest(token))) {
    return { ok: false, status: 401, error: "unauthorized", message: "A valid bearer token is required." };
  }
  return { ok: true };
}

// Error body for a refused request — deliberately terse. Carries the same
// no-store + noindex headers as a successful response (envelope.ts
// jsonResponse), so every /api/growth/* reply is consistent whether it is
// data or a refusal.
export function authErrorResponse(a: Exclude<AuthResult, { ok: true }>): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
  };
  if (a.status === 401) headers["WWW-Authenticate"] = 'Bearer realm="belgradebest-growth"';
  return new Response(JSON.stringify({ error: a.error, message: a.message }), { status: a.status, headers });
}
