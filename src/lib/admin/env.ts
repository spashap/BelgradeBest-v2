import { createHash } from "node:crypto";

// Runtime env that works both in `astro dev` (Vite → import.meta.env) and in
// Vercel serverless functions (process.env). Server-only — never import from a
// prerendered/public component.
export function env(key: string): string | undefined {
  const fromProc = typeof process !== "undefined" ? process.env[key] : undefined;
  return fromProc ?? (import.meta.env as Record<string, string | undefined>)[key];
}

// Admin password — UNSET = admin is open (the chosen "no auth to start"). Set
// ADMIN_ENTRY (preferred) or ADMIN_PASSWORD (legacy) to require a login at
// /admin; nothing else changes. /admin stays reachable on the web either way.
export function adminPassword(): string | undefined {
  const p = env("ADMIN_ENTRY") ?? env("ADMIN_PASSWORD");
  return p && p.length > 0 ? p : undefined;
}

// Cookie value derived from the password (never store the raw password).
export function authToken(pw: string): string {
  return createHash("sha256").update("bb-v2-admin:" + pw).digest("hex");
}

export const AUTH_COOKIE = "bb_admin";
