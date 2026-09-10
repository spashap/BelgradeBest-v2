import { env } from "./env";

// GA4 via the Data API. Credentials: GA_CREDENTIALS_JSON (inline service-account
// JSON — the Vercel-friendly form) or GOOGLE_APPLICATION_CREDENTIALS (a file path,
// for local). Degrades gracefully when unconfigured.
export type Ga4Result =
  | { configured: true; rows: { path: string; views: number; users: number }[] }
  | { configured: false; reason: string };

export async function ga4TopPages(): Promise<Ga4Result> {
  const propertyId = env("GA_PROPERTY_ID");
  if (!propertyId) {
    return { configured: false, reason: "Set GA_PROPERTY_ID (+ GA_CREDENTIALS_JSON) in the environment." };
  }
  let mod: typeof import("@google-analytics/data");
  try {
    mod = await import("@google-analytics/data");
  } catch {
    return { configured: false, reason: "@google-analytics/data is not installed." };
  }
  try {
    const { BetaAnalyticsDataClient } = mod;
    const credsJson = env("GA_CREDENTIALS_JSON");
    const client = credsJson
      ? new BetaAnalyticsDataClient({ credentials: JSON.parse(credsJson) })
      : new BetaAnalyticsDataClient();
    const [resp] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 25,
    });
    const rows = (resp.rows ?? []).map((r) => ({
      path: r.dimensionValues?.[0]?.value ?? "",
      views: Number(r.metricValues?.[0]?.value ?? 0),
      users: Number(r.metricValues?.[1]?.value ?? 0),
    }));
    return { configured: true, rows };
  } catch (e) {
    return { configured: false, reason: `GA4 error: ${(e as Error).message}` };
  }
}

// ── Shared clients (admin pages + the Growth API, src/lib/growth/) ──────────
// ONE place that turns the env into an authenticated GA4 client / a Search
// Console request. Both degrade to a `reason` string instead of throwing so
// callers can report "unavailable" rather than 500.

export type Ga4ClientResult =
  | { ok: true; client: import("@google-analytics/data").BetaAnalyticsDataClient; property: string }
  | { ok: false; reason: string };

export async function ga4Client(): Promise<Ga4ClientResult> {
  const propertyId = env("GA_PROPERTY_ID");
  if (!propertyId) {
    return { ok: false, reason: "Set GA_PROPERTY_ID (+ GA_CREDENTIALS_JSON) in the environment." };
  }
  let mod: typeof import("@google-analytics/data");
  try {
    mod = await import("@google-analytics/data");
  } catch {
    return { ok: false, reason: "@google-analytics/data is not installed." };
  }
  try {
    const { BetaAnalyticsDataClient } = mod;
    const credsJson = env("GA_CREDENTIALS_JSON");
    const client = credsJson
      ? new BetaAnalyticsDataClient({ credentials: JSON.parse(credsJson) })
      : new BetaAnalyticsDataClient();
    return { ok: true, client, property: `properties/${propertyId}` };
  } catch (e) {
    return { ok: false, reason: `GA4 client error: ${(e as Error).message}` };
  }
}

// Raw Search Analytics query. `body` is the API request body (startDate,
// endDate, dimensions, rowLimit, dimensionFilterGroups…); rows come back as
// the API returns them. Reuses the service account (GA_CREDENTIALS_JSON) with
// the read-only webmasters scope; site = GSC_SITE_URL or the domain property.
export type GscApiRow = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };
export type GscRequestResult = { ok: true; rows: GscApiRow[] } | { ok: false; reason: string };

export async function gscRequest(body: Record<string, unknown>): Promise<GscRequestResult> {
  const credsJson = env("GA_CREDENTIALS_JSON");
  if (!credsJson) {
    return { ok: false, reason: "Set GA_CREDENTIALS_JSON (the service-account key) in the environment." };
  }
  const site = env("GSC_SITE_URL") || "sc-domain:belgradebest.com";
  let GoogleAuth: typeof import("google-auth-library").GoogleAuth;
  try {
    ({ GoogleAuth } = await import("google-auth-library"));
  } catch {
    return { ok: false, reason: "google-auth-library is not installed." };
  }
  try {
    const auth = new GoogleAuth({
      credentials: JSON.parse(credsJson),
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });
    const token = await auth.getAccessToken();
    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      return { ok: false, reason: `Search Console error: ${res.status} ${(await res.text()).slice(0, 200)}` };
    }
    const json = (await res.json()) as { rows?: GscApiRow[] };
    return { ok: true, rows: json.rows ?? [] };
  } catch (e) {
    return { ok: false, reason: `Search Console error: ${(e as Error).message}` };
  }
}

// Google Search Console via the Search Analytics API. Reuses the same service
// account (GA_CREDENTIALS_JSON). Site defaults to the domain property; override
// with GSC_SITE_URL (e.g. "sc-domain:belgradebest.com"). Degrades gracefully.
export type GscRow = {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};
export type GscResult =
  | { configured: true; rows: GscRow[]; range: { start: string; end: string; days: number } }
  | { configured: false; reason: string };

// Search Console data lags ~2 days behind real time, so every window ends at
// the latest day that has data (today − 2). days=1 → that single latest day.
const GSC_LAG_DAYS = 2;
export function gscWindow(days: number) {
  const end = new Date(Date.now() - GSC_LAG_DAYS * 864e5);
  const start = new Date(end.getTime() - Math.max(0, days - 1) * 864e5);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end), days };
}

async function gscQuery(dimension: "query" | "page", pageRegex?: string, days = 28): Promise<GscResult> {
  const range = gscWindow(days);
  const res = await gscRequest({
    startDate: range.start,
    endDate: range.end,
    dimensions: [dimension],
    rowLimit: pageRegex ? 50 : 25,
    ...(pageRegex
      ? {
          dimensionFilterGroups: [
            { filters: [{ dimension: "page", operator: "includingRegex", expression: pageRegex }] },
          ],
        }
      : {}),
  });
  if (!res.ok) return { configured: false, reason: res.reason };
  const rows = res.rows.map((r) => ({
    key: r.keys?.[0] ?? "",
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
  return { configured: true, rows, range };
}

export const searchConsoleTopQueries = (days = 28) => gscQuery("query", undefined, days);
export const searchConsoleTopPages = (days = 28) => gscQuery("page", undefined, days);
// Platform surface only (pavilions/tracker/countdown/for-businesses) — the
// early-indexation feedback loop for /admin/platform.
export const searchConsolePlatformPages = (regex: string) => gscQuery("page", regex);

// ── Platform pages traffic ───────────────────────────────────────────────────
// Views/users for the claimable-listings surface (pavilion pages, tracker,
// countdown, /for-businesses) with a previous-period comparison. Powers
// /admin/platform. Degrades gracefully like the other reports.
export type PlatformPageRow = { path: string; views: number; users: number; prevViews: number };
export type PlatformTraffic =
  | { configured: true; days: number; rows: PlatformPageRow[] }
  | { configured: false; reason: string };

export async function ga4PlatformPages(prefixes: string[], days = 28): Promise<PlatformTraffic> {
  const propertyId = env("GA_PROPERTY_ID");
  if (!propertyId) {
    return { configured: false, reason: "Set GA_PROPERTY_ID (+ GA_CREDENTIALS_JSON) in the environment." };
  }
  let mod: typeof import("@google-analytics/data");
  try {
    mod = await import("@google-analytics/data");
  } catch {
    return { configured: false, reason: "@google-analytics/data is not installed." };
  }
  try {
    const { BetaAnalyticsDataClient } = mod;
    const credsJson = env("GA_CREDENTIALS_JSON");
    const client = credsJson
      ? new BetaAnalyticsDataClient({ credentials: JSON.parse(credsJson) })
      : new BetaAnalyticsDataClient();
    const [resp] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        { startDate: `${days}daysAgo`, endDate: "today" },
        { startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` },
      ],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
      dimensionFilter: {
        orGroup: {
          expressions: prefixes.map((p) => ({
            filter: { fieldName: "pagePath", stringFilter: { matchType: "BEGINS_WITH", value: p } },
          })),
        },
      },
      limit: 200,
    });
    // With two dateRanges the API appends an implicit dateRange dimension value
    // to every row — merge the two periods per path.
    const byPath = new Map<string, PlatformPageRow>();
    for (const r of resp.rows ?? []) {
      const path = r.dimensionValues?.[0]?.value ?? "";
      const range = r.dimensionValues?.[1]?.value ?? "date_range_0";
      const row = byPath.get(path) ?? { path, views: 0, users: 0, prevViews: 0 };
      if (range === "date_range_1") {
        row.prevViews = num(r.metricValues?.[0]?.value);
      } else {
        row.views = num(r.metricValues?.[0]?.value);
        row.users = num(r.metricValues?.[1]?.value);
      }
      byPath.set(path, row);
    }
    const rows = [...byPath.values()].sort((a, b) => b.views - a.views);
    return { configured: true, days, rows };
  } catch (e) {
    return { configured: false, reason: `GA4 error: ${(e as Error).message}` };
  }
}

// ── Rich GA4 overview ────────────────────────────────────────────────────────
// One batched pull powering the redesigned Analytics screen: headline KPIs with
// period-over-period deltas, a daily trend series (sparklines), traffic channels,
// devices, geo, new-vs-returning, landing pages (browsing patterns) and top
// pages. Degrades gracefully exactly like ga4TopPages().

export type Kpi = { value: number; prev: number; delta: number | null };
export type TrendPoint = {
  key: string; // YYYYMMDD or HH
  label: string; // "8 Sep" or "14:00"
  users: number;
  views: number;
  prevUsers: number;
  prevViews: number;
};
export type Ga4Overview =
  | {
      configured: true;
      range: { days: number; start: string; end: string };
      kpis: {
        users: Kpi;
        sessions: Kpi;
        views: Kpi;
        engagementRate: Kpi;
        avgEngagement: Kpi; // seconds, per active user
        viewsPerSession: Kpi;
      };
      // "day": one point per day of the range, prev = the day before it.
      // "hour" (days=1 / Today): one point per hour, prev = same hour yesterday.
      granularity: "day" | "hour";
      timeseries: TrendPoint[];
      channels: { name: string; sessions: number }[];
      devices: { name: string; users: number }[];
      countries: { name: string; users: number }[];
      newReturning: { name: string; users: number }[];
      landingPages: { path: string; sessions: number; avgEngagement: number; bounceRate: number }[];
      topPages: { path: string; views: number; users: number; avgEngagement: number }[];
    }
  | { configured: false; reason: string };

const num = (v: unknown) => Number(v ?? 0) || 0;
const delta = (cur: number, prev: number): number | null =>
  prev > 0 ? (cur - prev) / prev : cur > 0 ? null : 0; // null = "new" (no prior baseline)

export async function ga4Overview(days = 28): Promise<Ga4Overview> {
  const propertyId = env("GA_PROPERTY_ID");
  if (!propertyId) {
    return { configured: false, reason: "Set GA_PROPERTY_ID (+ GA_CREDENTIALS_JSON) in the environment." };
  }
  let mod: typeof import("@google-analytics/data");
  try {
    mod = await import("@google-analytics/data");
  } catch {
    return { configured: false, reason: "@google-analytics/data is not installed." };
  }
  try {
    const { BetaAnalyticsDataClient } = mod;
    const credsJson = env("GA_CREDENTIALS_JSON");
    const client = credsJson
      ? new BetaAnalyticsDataClient({ credentials: JSON.parse(credsJson) })
      : new BetaAnalyticsDataClient();
    const property = `properties/${propertyId}`;

    // days=1 = "Today" (property timezone) compared against yesterday.
    const today1 = days === 1;
    const cur = today1
      ? { startDate: "today", endDate: "today" }
      : { startDate: `${days}daysAgo`, endDate: "today" };
    const prev = today1
      ? { startDate: "yesterday", endDate: "yesterday" }
      : { startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` };
    const trendMetrics = [{ name: "totalUsers" }, { name: "screenPageViews" }];
    const kpiMetrics = [
      { name: "totalUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "engagementRate" },
      { name: "userEngagementDuration" },
      { name: "screenPageViewsPerSession" },
    ];

    const [[batch]] = await Promise.all([
      client.batchRunReports({
        property,
        requests: [
          // 0 — KPIs across current + previous period (two date ranges → two rows)
          { dateRanges: [cur, prev], metrics: kpiMetrics },
          // 1 — trend. Today: per hour, today + yesterday (two ranges → the API
          // adds a dateRange dimension). Otherwise: per day, one extra day before
          // the range as the baseline for the first day-over-day delta.
          today1
            ? {
                dateRanges: [cur, prev],
                dimensions: [{ name: "hour" }],
                metrics: trendMetrics,
                orderBys: [{ dimension: { dimensionName: "hour" } }],
                keepEmptyRows: true,
              }
            : {
                dateRanges: [{ startDate: `${days + 1}daysAgo`, endDate: "today" }],
                dimensions: [{ name: "date" }],
                metrics: trendMetrics,
                orderBys: [{ dimension: { dimensionName: "date" } }],
                keepEmptyRows: true,
              },
          // 2 — traffic channels
          {
            dateRanges: [cur],
            dimensions: [{ name: "sessionDefaultChannelGroup" }],
            metrics: [{ name: "sessions" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: 8,
          },
          // 3 — devices
          {
            dateRanges: [cur],
            dimensions: [{ name: "deviceCategory" }],
            metrics: [{ name: "totalUsers" }],
            orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
          },
          // 4 — new vs returning
          {
            dateRanges: [cur],
            dimensions: [{ name: "newVsReturning" }],
            metrics: [{ name: "totalUsers" }],
          },
        ],
      }),
    ]);

    const [batch2] = await client.batchRunReports({
      property,
      requests: [
        // 0 — top countries
        {
          dateRanges: [cur],
          dimensions: [{ name: "country" }],
          metrics: [{ name: "totalUsers" }],
          orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
          limit: 8,
        },
        // 1 — landing pages (browsing entry points)
        {
          dateRanges: [cur],
          dimensions: [{ name: "landingPagePlusQueryString" }],
          metrics: [{ name: "sessions" }, { name: "userEngagementDuration" }, { name: "bounceRate" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: 12,
        },
        // 2 — top pages with engagement
        {
          dateRanges: [cur],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }, { name: "userEngagementDuration" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 15,
        },
      ],
    });

    const reports = batch.reports ?? [];
    const reports2 = batch2.reports ?? [];
    const rep = (b: typeof reports, i: number) => b[i]?.rows ?? [];

    // KPIs: row per date range; dimensionValues[0] is "date_range_0"/"date_range_1".
    const kpiRows = rep(reports, 0);
    const pick = (suffix: string) =>
      kpiRows.find((r) => (r.dimensionValues?.[0]?.value ?? "").endsWith(suffix))?.metricValues ?? [];
    const c = pick("0");
    const p = pick("1");
    const kpi = (i: number, transform: (n: number) => number = (n) => n): Kpi => {
      const value = transform(num(c[i]?.value));
      const prevV = transform(num(p[i]?.value));
      return { value, prev: prevV, delta: delta(value, prevV) };
    };
    // avg engagement (s/user) = userEngagementDuration / totalUsers
    const avgEng = (mv: typeof c): number => {
      const u = num(mv[0]?.value);
      return u > 0 ? num(mv[4]?.value) / u : 0;
    };

    let timeseries: TrendPoint[];
    if (today1) {
      const byHour = new Map<string, TrendPoint>();
      for (const r of rep(reports, 1)) {
        const h = r.dimensionValues?.[0]?.value ?? "";
        const range = r.dimensionValues?.[1]?.value ?? "date_range_0";
        const pt = byHour.get(h) ?? { key: h, label: `${h}:00`, users: 0, views: 0, prevUsers: 0, prevViews: 0 };
        if (range === "date_range_1") {
          pt.prevUsers = num(r.metricValues?.[0]?.value);
          pt.prevViews = num(r.metricValues?.[1]?.value);
        } else {
          pt.users = num(r.metricValues?.[0]?.value);
          pt.views = num(r.metricValues?.[1]?.value);
        }
        byHour.set(h, pt);
      }
      timeseries = Array.from({ length: 24 }, (_, i) => {
        const h = String(i).padStart(2, "0");
        return byHour.get(h) ?? { key: h, label: `${h}:00`, users: 0, views: 0, prevUsers: 0, prevViews: 0 };
      });
    } else {
      const raw = rep(reports, 1).map((r) => ({
        date: r.dimensionValues?.[0]?.value ?? "",
        users: num(r.metricValues?.[0]?.value),
        views: num(r.metricValues?.[1]?.value),
      }));
      const dayLabel = (ymd: string) =>
        ymd.length === 8
          ? new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8))).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              timeZone: "UTC",
            })
          : ymd;
      // raw[0] is the baseline day before the range; it is not shown itself.
      timeseries = raw.slice(1).map((d, i) => ({
        key: d.date,
        label: dayLabel(d.date),
        users: d.users,
        views: d.views,
        prevUsers: raw[i].users,
        prevViews: raw[i].views,
      }));
    }
    const channels = rep(reports, 2).map((r) => ({
      name: r.dimensionValues?.[0]?.value || "(unknown)",
      sessions: num(r.metricValues?.[0]?.value),
    }));
    const devices = rep(reports, 3).map((r) => ({
      name: r.dimensionValues?.[0]?.value || "(unknown)",
      users: num(r.metricValues?.[0]?.value),
    }));
    const newReturning = rep(reports, 4)
      .map((r) => ({ name: r.dimensionValues?.[0]?.value || "(unknown)", users: num(r.metricValues?.[0]?.value) }))
      .filter((r) => r.name !== "(unknown)" || r.users > 0);
    const countries = rep(reports2, 0).map((r) => ({
      name: r.dimensionValues?.[0]?.value || "(unknown)",
      users: num(r.metricValues?.[0]?.value),
    }));
    const landingPages = rep(reports2, 1).map((r) => {
      const sessions = num(r.metricValues?.[0]?.value);
      return {
        path: r.dimensionValues?.[0]?.value ?? "",
        sessions,
        avgEngagement: sessions > 0 ? num(r.metricValues?.[1]?.value) / sessions : 0,
        bounceRate: num(r.metricValues?.[2]?.value),
      };
    });
    const topPages = rep(reports2, 2).map((r) => {
      const users = num(r.metricValues?.[1]?.value);
      return {
        path: r.dimensionValues?.[0]?.value ?? "",
        views: num(r.metricValues?.[0]?.value),
        users,
        avgEngagement: users > 0 ? num(r.metricValues?.[2]?.value) / users : 0,
      };
    });

    const today = new Date();
    const startD = new Date(Date.now() - (today1 ? 0 : days) * 864e5);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    return {
      configured: true,
      range: { days, start: fmt(startD), end: fmt(today) },
      granularity: today1 ? "hour" : "day",
      kpis: {
        users: kpi(0),
        sessions: kpi(1),
        views: kpi(2),
        engagementRate: kpi(3),
        avgEngagement: { value: avgEng(c), prev: avgEng(p), delta: delta(avgEng(c), avgEng(p)) },
        viewsPerSession: kpi(5),
      },
      timeseries,
      channels,
      devices,
      countries,
      newReturning,
      landingPages,
      topPages,
    };
  } catch (e) {
    return { configured: false, reason: `GA4 error: ${(e as Error).message}` };
  }
}

// Realtime active users (last 30 min). Separate, fast call; degrades silently.
export async function ga4Realtime(): Promise<{ active: number } | null> {
  const propertyId = env("GA_PROPERTY_ID");
  if (!propertyId) return null;
  try {
    const { BetaAnalyticsDataClient } = await import("@google-analytics/data");
    const credsJson = env("GA_CREDENTIALS_JSON");
    const client = credsJson
      ? new BetaAnalyticsDataClient({ credentials: JSON.parse(credsJson) })
      : new BetaAnalyticsDataClient();
    const [resp] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: "activeUsers" }],
    });
    return { active: num(resp.rows?.[0]?.metricValues?.[0]?.value) };
  } catch {
    return null;
  }
}

export function vercelInfo() {
  const team = env("VERCEL_TEAM_ID");
  return {
    note: "Vercel Web Analytics is viewed in the project's Analytics tab on vercel.com. The site's production <script> collects the data.",
    dashboardUrl: team ? `https://vercel.com/${team}` : "https://vercel.com/dashboard",
  };
}
