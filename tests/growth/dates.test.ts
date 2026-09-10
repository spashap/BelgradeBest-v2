import { test } from "node:test";
import assert from "node:assert/strict";
import { resolvePeriod, gscPeriod, parseSince, parseLimit } from "../../src/lib/growth/dates.ts";
import { handleSummary } from "../../src/lib/growth/handlers.ts";
import { deps, authed, NOW } from "./fakes.ts";

const P = (q: string) => resolvePeriod(new URLSearchParams(q), NOW);

test("default period = 28 days ending yesterday (UTC)", () => {
  const r = P("");
  assert.ok(r.ok);
  if (r.ok) assert.deepEqual(r.period, { from: "2026-08-13", to: "2026-09-09", days: 28 });
});

test("explicit from/to", () => {
  const r = P("from=2026-08-01&to=2026-08-31");
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.period.days, 31);
});

test("invalid dates rejected", () => {
  for (const q of ["from=2026-02-30", "to=nope", "from=2026-09-05&to=2026-09-01", "to=2027-01-01", "from=2025-01-01&to=2026-09-01"]) {
    const r = P(q);
    assert.equal(r.ok, false, q);
  }
});

test("bad dates → 400 from the handler", async () => {
  const res = await handleSummary(authed("https://x/api/growth/summary?from=2026-13-01"), deps());
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, "bad_request");
});

test("GSC window clamps to today-2 and returns null when fully inside the lag", () => {
  const p = { from: "2026-09-01", to: "2026-09-09", days: 9 };
  assert.deepEqual(gscPeriod(p, NOW), { from: "2026-09-01", to: "2026-09-08", days: 8 });
  assert.equal(gscPeriod({ from: "2026-09-09", to: "2026-09-09", days: 1 }, NOW), null);
});

test("since parsing", () => {
  assert.deepEqual(parseSince(null), { ok: true, since: null });
  assert.equal(parseSince("garbage").ok, false);
  const r = parseSince("2026-09-01T00:00:00Z");
  assert.ok(r.ok && r.since instanceof Date);
});

test("limit parsing clamps", () => {
  assert.equal(parseLimit(null), 50);
  assert.equal(parseLimit("0"), 50);
  assert.equal(parseLimit("10"), 10);
  assert.equal(parseLimit("9999"), 200);
});
