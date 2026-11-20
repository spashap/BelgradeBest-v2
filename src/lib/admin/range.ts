// Date range for /admin/analytics (added 2026-11-20).
//
// The choice lives in the URL — ?from=YYYY-MM-DD&to=YYYY-MM-DD — so a view can
// be bookmarked. Presets are plain links that fill in from/to; the page lights
// a preset up again when its dates match. Every report on the tab (GA4, Search
// Console, Bing, affiliate clicks, CJ) gets the same from/to, and the deltas
// compare against the equally long period right before it.
//
// Pure functions (no env, no I/O) so tests/admin/range.test.ts can pin them.
import { parseYmd, ymd, type Period } from "../growth/dates.ts";

const DAY = 864e5;

// Calendar days are the owner's days (Belgrade), so "today" is the day the
// owner is looking at, also just after midnight when UTC is still on yesterday.
export const ADMIN_TZ = "Europe/Belgrade";
// The GA4 tag went live with V2 in mid-June 2026: nothing earlier to show.
export const DATA_START = "2026-06-01";

export type PresetKey = "today" | "7d" | "28d" | "90d" | "month" | "lastmonth";
export const DEFAULT_PRESET: PresetKey = "28d";
export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "28d", label: "28 days" },
  { key: "90d", label: "90 days" },
  { key: "month", label: "This month" },
  { key: "lastmonth", label: "Last month" },
];

// A period plus the equally long one right before it (for the deltas).
export type ComparedRange = Period & { prevFrom: string; prevTo: string };
export type AdminRange = ComparedRange & {
  today: string; // the owner's today, YYYY-MM-DD
  isToday: boolean; // from = to = today → hourly view vs yesterday
  notice: string | null; // why the URL's range was changed, if it was
};
type Span = { from: string; to: string };

export function todayIn(now: Date, tz = ADMIN_TZ): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export const addDays = (s: string, n: number): string => ymd(new Date(parseYmd(s)!.getTime() + n * DAY));
export const daysBetween = (from: string, to: string): number =>
  Math.round((parseYmd(to)!.getTime() - parseYmd(from)!.getTime()) / DAY) + 1;

// "Last N days" = the N full days ending yesterday, the same as GA4's own
// presets and the Growth API, so the numbers match across tools. Today and
// This month include today (partial day).
export function presetDates(key: PresetKey, today: string): Span {
  const yesterday = addDays(today, -1);
  const firstOfMonth = today.slice(0, 8) + "01";
  switch (key) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: addDays(today, -7), to: yesterday };
    case "28d":
      return { from: addDays(today, -28), to: yesterday };
    case "90d":
      return { from: addDays(today, -90), to: yesterday };
    case "month":
      return { from: firstOfMonth, to: today };
    case "lastmonth": {
      const lastOfPrev = addDays(firstOfMonth, -1);
      return { from: lastOfPrev.slice(0, 8) + "01", to: lastOfPrev };
    }
  }
}

export function compared(span: Span): ComparedRange {
  const days = daysBetween(span.from, span.to);
  const prevTo = addDays(span.from, -1);
  return { from: span.from, to: span.to, days, prevFrom: addDays(prevTo, -(days - 1)), prevTo };
}

// Old links and bookmarks used ?days=1|7|28|90.
const LEGACY_DAYS: Record<string, PresetKey> = { "1": "today", "7": "7d", "28": "28d", "90": "90d" };

export function resolveAdminRange(params: URLSearchParams, now: Date): AdminRange {
  const today = todayIn(now);
  const fallback = presetDates(DEFAULT_PRESET, today);
  const done = (span: Span, notice: string | null): AdminRange => ({
    ...compared(span),
    today,
    isToday: span.from === today && span.to === today,
    notice,
  });
  const reject = (why: string) => done(fallback, `${why} Showing the default (last 28 days) instead.`);

  const fromRaw = params.get("from")?.trim() || null;
  const toRaw = params.get("to")?.trim() || null;
  if (!fromRaw && !toRaw) {
    const legacy = LEGACY_DAYS[params.get("days") ?? ""];
    return done(legacy ? presetDates(legacy, today) : fallback, null);
  }

  // A hand-typed URL may give one side only: a missing "to" means today, a
  // missing "from" means the 28 days ending at "to".
  if (toRaw && !parseYmd(toRaw)) return reject(`"${toRaw}" is not a date (use YYYY-MM-DD).`);
  if (fromRaw && !parseYmd(fromRaw)) return reject(`"${fromRaw}" is not a date (use YYYY-MM-DD).`);
  const to = toRaw ?? today;
  let from = fromRaw ?? addDays(to, -27);

  if (to > today) return reject(`The end date ${to} is in the future.`);
  if (from > to) return reject(`The start date ${from} is after the end date ${to}.`);
  if (to < DATA_START) return reject(`Analytics data starts on ${DATA_START}; ${from} to ${to} is before that.`);
  let notice: string | null = null;
  if (from < DATA_START) {
    notice = `Analytics data starts on ${DATA_START}, so the range starts there instead of ${from}.`;
    from = DATA_START;
  }
  return done({ from, to }, notice);
}

export const rangeHref = (span: Span, base = "/admin/analytics"): string => `${base}?from=${span.from}&to=${span.to}`;

const dm = (s: string, withYear: boolean) =>
  parseYmd(s)!.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });

// "20 Nov 2026" · "22 Oct – 18 Nov 2026" · "28 Dec 2025 – 3 Jan 2026"
export function fmtRange(from: string, to: string): string {
  if (from === to) return dm(from, true);
  return `${dm(from, from.slice(0, 4) !== to.slice(0, 4))} – ${dm(to, true)}`;
}
