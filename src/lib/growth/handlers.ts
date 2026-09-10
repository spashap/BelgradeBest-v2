// Request → Response for the three Growth API endpoints. Pure over GrowthDeps
// so tests can drive them with fakes; the Astro routes only wire real deps.
import type { GrowthDeps } from "./types.ts";
import { checkAuth, authErrorResponse } from "./auth.ts";
import { envelope, jsonResponse, badRequest, DataQuality } from "./envelope.ts";
import { resolvePeriod, parseSince, parseLimit } from "./dates.ts";
import { parseChangelog, changesSince } from "./changelog.ts";
import { buildSummary } from "./summary.ts";
import { buildContent } from "./content.ts";

function gate(request: Request, deps: GrowthDeps): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse({ error: "method_not_allowed", message: "Read-only endpoint." }, 405);
  }
  const a = checkAuth(request, deps.token);
  return a.ok ? null : authErrorResponse(a);
}

export async function handleSummary(request: Request, deps: GrowthDeps): Promise<Response> {
  const refused = gate(request, deps);
  if (refused) return refused;
  const now = deps.now();
  const p = resolvePeriod(new URL(request.url).searchParams, now);
  if (!p.ok) return badRequest(p.message);
  try {
    const { quality, data } = await buildSummary(deps, p.period);
    return jsonResponse(envelope({ from: p.period.from, to: p.period.to, now, quality, data }));
  } catch (e) {
    return jsonResponse({ error: "internal", message: (e as Error).message }, 500);
  }
}

export async function handleContent(request: Request, deps: GrowthDeps): Promise<Response> {
  const refused = gate(request, deps);
  if (refused) return refused;
  const now = deps.now();
  const params = new URL(request.url).searchParams;
  const p = resolvePeriod(params, now);
  if (!p.ok) return badRequest(p.message);
  const limit = parseLimit(params.get("limit"));
  try {
    const { quality, data } = await buildContent(deps, p.period, limit);
    return jsonResponse(envelope({ from: p.period.from, to: p.period.to, now, quality, data }));
  } catch (e) {
    return jsonResponse({ error: "internal", message: (e as Error).message }, 500);
  }
}

export async function handleChanges(request: Request, deps: GrowthDeps): Promise<Response> {
  const refused = gate(request, deps);
  if (refused) return refused;
  const now = deps.now();
  const s = parseSince(new URL(request.url).searchParams.get("since"));
  if (!s.ok) return badRequest(s.message);
  const quality = new DataQuality();
  const parsed = parseChangelog(deps.changelogText);
  quality.ok("changelog");
  for (const problem of parsed.problems) quality.warn(`Change log: ${problem}`);
  const entries = changesSince(parsed.entries, s.since);
  const from = s.since ? s.since.toISOString() : (parsed.entries[0]?.timestamp ?? now.toISOString());
  return jsonResponse(
    envelope({
      from,
      to: now.toISOString(),
      now,
      quality,
      data: {
        since: s.since ? s.since.toISOString() : null,
        count: entries.length,
        total_in_log: parsed.entries.length,
        source: "growth/growth_changes.jsonl (bundled at build; updates on deploy)",
        changes: entries,
      },
    }),
  );
}
