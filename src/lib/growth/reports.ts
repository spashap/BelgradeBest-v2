// GA4 / Search Console request definitions + reducers used by the Growth API.
// Pure functions over the adapter types in ./types.ts — no I/O here.
import type { Ga4Request, Ga4Report, Ga4Row, GscRow } from "./types.ts";
import { EXPO_PREFIXES, normalisePath } from "./classify.ts";

export const num = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
export const round = (n: number, dp = 4): number => Math.round(n * 10 ** dp) / 10 ** dp;

// ── GA4 request sets ───────────────────────────────────────────────────────

export const SUMMARY_GA4 = {
  KPI: 0,
  NEW_RETURNING: 1,
  DEVICES: 2,
  COUNTRIES: 3,
  CHANNELS: 4,
  SOURCES: 5,
  LANDING: 6,
  EXPO_PAGES: 7,
  EXPO_LANDING: 8,
} as const;

export function summaryGa4Requests(from: string, to: string): Ga4Request[] {
  const base = { from, to };
  return [
    {
      ...base,
      metrics: [
        "totalUsers",
        "sessions",
        "screenPageViews",
        "engagementRate",
        "userEngagementDuration",
        "screenPageViewsPerSession",
        "newUsers",
      ],
    },
    { ...base, dimensions: ["newVsReturning"], metrics: ["totalUsers"] },
    { ...base, dimensions: ["deviceCategory"], metrics: ["totalUsers", "sessions"], orderByMetricDesc: "totalUsers" },
    { ...base, dimensions: ["country"], metrics: ["totalUsers", "sessions"], orderByMetricDesc: "totalUsers", limit: 15 },
    {
      ...base,
      dimensions: ["sessionDefaultChannelGroup"],
      metrics: ["sessions", "totalUsers"],
      orderByMetricDesc: "sessions",
      limit: 12,
    },
    {
      ...base,
      dimensions: ["sessionSource", "sessionMedium"],
      metrics: ["sessions", "totalUsers"],
      orderByMetricDesc: "sessions",
      limit: 60,
    },
    {
      ...base,
      dimensions: ["landingPage"],
      metrics: ["sessions", "engagementRate", "bounceRate", "userEngagementDuration"],
      orderByMetricDesc: "sessions",
      limit: 25,
    },
    {
      ...base,
      dimensions: ["pagePath"],
      metrics: ["screenPageViews", "totalUsers"],
      orderByMetricDesc: "screenPageViews",
      limit: 60,
      filter: { field: "pagePath", matchType: "BEGINS_WITH", values: EXPO_PREFIXES },
    },
    {
      ...base,
      dimensions: ["landingPage"],
      metrics: ["sessions"],
      orderByMetricDesc: "sessions",
      limit: 60,
      filter: { field: "landingPage", matchType: "BEGINS_WITH", values: EXPO_PREFIXES },
    },
  ];
}

export const CONTENT_GA4 = { PAGES: 0, LANDING: 1, LANDING_CHANNEL: 2 } as const;

export function contentGa4Requests(from: string, to: string): Ga4Request[] {
  const base = { from, to };
  return [
    {
      ...base,
      dimensions: ["pagePath"],
      metrics: ["screenPageViews", "totalUsers", "userEngagementDuration"],
      orderByMetricDesc: "screenPageViews",
      limit: 500,
    },
    {
      ...base,
      dimensions: ["landingPage"],
      metrics: ["sessions", "engagementRate", "bounceRate"],
      orderByMetricDesc: "sessions",
      limit: 500,
    },
    {
      ...base,
      dimensions: ["landingPage", "sessionDefaultChannelGroup"],
      metrics: ["sessions"],
      orderByMetricDesc: "sessions",
      limit: 1500,
    },
  ];
}

// ── Reducers ───────────────────────────────────────────────────────────────

const rows = (r: Ga4Report | undefined): Ga4Row[] => r?.rows ?? [];

export type Kpis = {
  users: number;
  new_users: number;
  sessions: number;
  pageviews: number;
  engagement_rate: number;
  engagement_duration_seconds_total: number;
  engagement_duration_seconds_per_session: number;
  views_per_session: number;
};

export function reduceKpis(r: Ga4Report | undefined): Kpis {
  const m = rows(r)[0]?.metrics ?? [];
  const sessions = num(m[1]);
  const dur = num(m[4]);
  return {
    users: num(m[0]),
    new_users: num(m[6]),
    sessions,
    pageviews: num(m[2]),
    engagement_rate: round(num(m[3])),
    engagement_duration_seconds_total: round(dur, 1),
    engagement_duration_seconds_per_session: sessions > 0 ? round(dur / sessions, 1) : 0,
    views_per_session: round(num(m[5]), 2),
  };
}

export const reduceNamed = (r: Ga4Report | undefined, key: string, metrics: string[]) =>
  rows(r)
    .filter((row) => (row.dims[0] ?? "") !== "(not set)")
    .map((row) => {
      const o: Record<string, string | number> = { [key]: row.dims[0] || "(unknown)" };
      metrics.forEach((mName, i) => (o[mName] = num(row.metrics[i])));
      return o;
    });

export function reduceNewReturning(r: Ga4Report | undefined): { new: number; returning: number } {
  const out = { new: 0, returning: 0 };
  for (const row of rows(r)) {
    const k = (row.dims[0] ?? "").toLowerCase();
    if (k === "new") out.new += num(row.metrics[0]);
    else if (k === "returning") out.returning += num(row.metrics[0]);
  }
  return out;
}

// Source/medium → platform bucket. Keeps the site's real acquisition sources
// legible: social networks by name, search engines by name, the widget
// embeds (utm_medium=embed), AI assistants, and a residual "referral".
export type Platform =
  | "direct"
  | "google"
  | "bing"
  | "duckduckgo"
  | "yahoo"
  | "ecosia"
  | "yandex"
  | "other_search"
  | "facebook"
  | "instagram"
  | "reddit"
  | "x"
  | "linkedin"
  | "pinterest"
  | "youtube"
  | "tiktok"
  | "other_social"
  | "ai_assistant"
  | "embed_widget"
  | "qr"
  | "email"
  | "referral"
  | "other";

const SOCIAL_MEDIA = new Set(["social", "social-network", "social-media", "sm", "social network", "social media"]);

export function platformOf(source: string, medium: string): Platform {
  const s = source.toLowerCase();
  const m = medium.toLowerCase();
  if (s === "(direct)" || (s === "(not set)" && m === "(none)")) return "direct";
  if (m === "embed" || /-widget$/.test(s)) return "embed_widget";
  if (s === "qr" || m === "qr") return "qr";
  if (m === "email" || m === "e-mail" || m === "newsletter") return "email";
  if (/facebook|^fb\b|\bfb\.|messenger|meta\.com/.test(s)) return "facebook";
  if (/instagram/.test(s)) return "instagram";
  if (/reddit/.test(s)) return "reddit";
  if (/^t\.co$|twitter|(^|\.)x\.com$/.test(s)) return "x";
  if (/linkedin|lnkd\.in/.test(s)) return "linkedin";
  if (/pinterest/.test(s)) return "pinterest";
  if (/youtube|youtu\.be/.test(s)) return "youtube";
  if (/tiktok/.test(s)) return "tiktok";
  if (/chatgpt|openai|copilot|perplexity|claude\.ai|anthropic|gemini\.google|bard\.google|you\.com|phind/.test(s))
    return "ai_assistant";
  if (/google/.test(s)) return "google";
  if (/bing/.test(s)) return "bing";
  if (/duckduckgo/.test(s)) return "duckduckgo";
  if (/yahoo/.test(s)) return "yahoo";
  if (/ecosia/.test(s)) return "ecosia";
  if (/yandex/.test(s)) return "yandex";
  if (/qwant|brave|baidu|naver|seznam|startpage/.test(s)) return "other_search";
  if (SOCIAL_MEDIA.has(m)) return "other_social";
  if (m === "organic") return "other_search";
  if (m === "referral") return "referral";
  return "other";
}

export type SourceRow = { source: string; medium: string; platform: Platform; sessions: number; users: number };
export type PlatformRow = { platform: Platform; sessions: number; users: number; sources: string[] };

export function reduceSources(r: Ga4Report | undefined): { sources: SourceRow[]; platforms: PlatformRow[] } {
  const sources: SourceRow[] = rows(r).map((row) => {
    const source = row.dims[0] || "(unknown)";
    const medium = row.dims[1] || "(none)";
    return { source, medium, platform: platformOf(source, medium), sessions: num(row.metrics[0]), users: num(row.metrics[1]) };
  });
  const byPlatform = new Map<Platform, PlatformRow>();
  for (const s of sources) {
    const p = byPlatform.get(s.platform) ?? { platform: s.platform, sessions: 0, users: 0, sources: [] };
    p.sessions += s.sessions;
    p.users += s.users;
    if (!p.sources.includes(s.source) && p.sources.length < 8) p.sources.push(s.source);
    byPlatform.set(s.platform, p);
  }
  const platforms = [...byPlatform.values()].sort((a, b) => b.sessions - a.sessions);
  return { sources, platforms };
}

export type LandingRow = {
  path: string;
  sessions: number;
  engagement_rate: number | null;
  bounce_rate: number | null;
  avg_engagement_seconds: number | null;
};

// Rows are landingPage × [sessions, engagementRate?, bounceRate?,
// userEngagementDuration?]; rates are session-weighted when paths fold
// together (trailing-slash variants). Metrics not requested stay null.
export function reduceLanding(r: Ga4Report | undefined): LandingRow[] {
  const all = rows(r);
  const mlen = all[0]?.metrics.length ?? 0;
  const by = new Map<string, { sessions: number; erw: number; brw: number; dur: number }>();
  for (const row of all) {
    if (row.dims[0] === "(not set)") continue;
    const path = normalisePath(row.dims[0] || "/");
    const sessions = num(row.metrics[0]);
    const cur = by.get(path) ?? { sessions: 0, erw: 0, brw: 0, dur: 0 };
    cur.sessions += sessions;
    cur.erw += num(row.metrics[1]) * sessions;
    cur.brw += num(row.metrics[2]) * sessions;
    cur.dur += num(row.metrics[3]);
    by.set(path, cur);
  }
  return [...by.entries()]
    .map(([path, c]) => ({
      path,
      sessions: c.sessions,
      engagement_rate: mlen > 1 && c.sessions > 0 ? round(c.erw / c.sessions) : null,
      bounce_rate: mlen > 2 && c.sessions > 0 ? round(c.brw / c.sessions) : null,
      avg_engagement_seconds: mlen > 3 && c.sessions > 0 ? round(c.dur / c.sessions, 1) : null,
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

export type PageRow = { path: string; views: number; users: number; avg_engagement_seconds: number | null };

export function reducePages(r: Ga4Report | undefined): PageRow[] {
  const by = new Map<string, { views: number; users: number; dur: number; hasDur: boolean }>();
  for (const row of rows(r)) {
    if (row.dims[0] === "(not set)") continue;
    const path = normalisePath(row.dims[0] || "/");
    const cur = by.get(path) ?? { views: 0, users: 0, dur: 0, hasDur: row.metrics.length > 2 };
    cur.views += num(row.metrics[0]);
    cur.users += num(row.metrics[1]);
    cur.dur += num(row.metrics[2]);
    by.set(path, cur);
  }
  return [...by.entries()]
    .map(([path, c]) => ({
      path,
      views: c.views,
      users: c.users,
      avg_engagement_seconds: c.hasDur && c.users > 0 ? round(c.dur / c.users, 1) : null,
    }))
    .sort((a, b) => b.views - a.views);
}

// landingPage × channel → { path: { channel: sessions } }
export function reduceLandingChannels(r: Ga4Report | undefined): Map<string, Record<string, number>> {
  const by = new Map<string, Record<string, number>>();
  for (const row of rows(r)) {
    if (row.dims[0] === "(not set)") continue;
    const path = normalisePath(row.dims[0] || "/");
    const channel = row.dims[1] || "(unknown)";
    const cur = by.get(path) ?? {};
    cur[channel] = (cur[channel] ?? 0) + num(row.metrics[0]);
    by.set(path, cur);
  }
  return by;
}

// ── Search Console ─────────────────────────────────────────────────────────

export type GscTotals = { clicks: number; impressions: number; ctr: number; position: number | null };

export function reduceGscTotals(rowsIn: GscRow[]): GscTotals {
  const r = rowsIn[0];
  if (!r) return { clicks: 0, impressions: 0, ctr: 0, position: null };
  return { clicks: num(r.clicks), impressions: num(r.impressions), ctr: round(num(r.ctr)), position: round(num(r.position), 1) };
}

export type GscKeyed = { key: string; clicks: number; impressions: number; ctr: number; position: number };

export const reduceGscKeyed = (rowsIn: GscRow[], toPath = false): GscKeyed[] =>
  rowsIn.map((r) => ({
    key: toPath ? normalisePath(r.keys[0] ?? "") : (r.keys[0] ?? ""),
    clicks: num(r.clicks),
    impressions: num(r.impressions),
    ctr: round(num(r.ctr)),
    position: round(num(r.position), 1),
  }));

// Search Console reports each URL variant separately (http/https, www, trailing
// slash), and normalisePath() collapses them onto one path — so fold the rows
// too, or a consumer double-counts. Same semantics as the /content merge: sum
// clicks + impressions, recompute CTR, keep the best (lowest) position.
export function foldGscPaths(rowsIn: GscKeyed[]): GscKeyed[] {
  const by = new Map<string, GscKeyed>();
  for (const r of rowsIn) {
    const cur = by.get(r.key);
    if (!cur) {
      by.set(r.key, { ...r });
      continue;
    }
    cur.clicks += r.clicks;
    cur.impressions += r.impressions;
    cur.position = Math.min(cur.position, r.position);
    cur.ctr = cur.impressions > 0 ? round(cur.clicks / cur.impressions) : 0;
  }
  return [...by.values()].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
}

// Sum keyed page rows into totals (positions weighted by impressions).
export function sumGsc(rowsIn: GscKeyed[]): GscTotals {
  let clicks = 0;
  let impressions = 0;
  let posW = 0;
  for (const r of rowsIn) {
    clicks += r.clicks;
    impressions += r.impressions;
    posW += r.position * r.impressions;
  }
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? round(clicks / impressions) : 0,
    position: impressions > 0 ? round(posW / impressions, 1) : null,
  };
}

// Search Console page regex for the Expo cluster (EN + DE), any host variant.
export const EXPO_GSC_REGEX = "^https?://[^/]+/(de/)?expo-2027(/|$)";
