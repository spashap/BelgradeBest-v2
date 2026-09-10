// Period parsing for the Growth API. All dates are UTC calendar days.
//
// summary / content: ?from=YYYY-MM-DD&to=YYYY-MM-DD
//   default = the 28 days ending yesterday (today's GA4 numbers are still
//   moving, and Search Console has nothing for today anyway).
// changes: ?since=<ISO-8601> (optional → everything).

const DAY = 864e5;
const MAX_RANGE_DAYS = 366;
// Search Console publishes a day's data ~2 days late (matches gscWindow() in
// lib/admin/analytics.ts).
export const GSC_LAG_DAYS = 2;

export const ymd = (d: Date): string => d.toISOString().slice(0, 10);

export function parseYmd(s: string | null | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || ymd(d) !== s ? null : d;
}

export type Period = { from: string; to: string; days: number };
export type PeriodResult = { ok: true; period: Period } | { ok: false; message: string };

export function resolvePeriod(params: URLSearchParams, now: Date): PeriodResult {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const fromRaw = params.get("from");
  const toRaw = params.get("to");
  let to: Date;
  let from: Date;
  if (toRaw) {
    const d = parseYmd(toRaw);
    if (!d) return { ok: false, message: "`to` must be a valid YYYY-MM-DD date." };
    to = d;
  } else {
    to = new Date(today.getTime() - DAY);
  }
  if (fromRaw) {
    const d = parseYmd(fromRaw);
    if (!d) return { ok: false, message: "`from` must be a valid YYYY-MM-DD date." };
    from = d;
  } else {
    from = new Date(to.getTime() - 27 * DAY);
  }
  if (from.getTime() > to.getTime()) return { ok: false, message: "`from` must not be after `to`." };
  if (to.getTime() > today.getTime()) return { ok: false, message: "`to` must not be in the future." };
  const days = Math.round((to.getTime() - from.getTime()) / DAY) + 1;
  if (days > MAX_RANGE_DAYS) return { ok: false, message: `Period must be at most ${MAX_RANGE_DAYS} days.` };
  return { ok: true, period: { from: ymd(from), to: ymd(to), days } };
}

// Search Console can only answer up to today − GSC_LAG_DAYS. Returns the
// clamped window, or null when the whole period is inside the lag.
export function gscPeriod(period: Period, now: Date): Period | null {
  const latest = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - GSC_LAG_DAYS * DAY);
  const to = parseYmd(period.to)!;
  const from = parseYmd(period.from)!;
  if (from.getTime() > latest.getTime()) return null;
  const clampedTo = to.getTime() > latest.getTime() ? latest : to;
  const days = Math.round((clampedTo.getTime() - from.getTime()) / DAY) + 1;
  return { from: period.from, to: ymd(clampedTo), days };
}

export type SinceResult = { ok: true; since: Date | null } | { ok: false; message: string };

export function parseSince(raw: string | null): SinceResult {
  if (raw === null || raw.trim() === "") return { ok: true, since: null };
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return { ok: false, message: "`since` must be an ISO-8601 timestamp." };
  return { ok: true, since: d };
}

export function parseLimit(raw: string | null, def = 50, max = 200): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return def;
  return Math.min(n, max);
}
