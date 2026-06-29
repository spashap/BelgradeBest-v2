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
  | { configured: true; rows: GscRow[] }
  | { configured: false; reason: string };

async function gscQuery(dimension: "query" | "page"): Promise<GscResult> {
  const credsJson = env("GA_CREDENTIALS_JSON");
  if (!credsJson) {
    return { configured: false, reason: "Set GA_CREDENTIALS_JSON (the service-account key) in the environment." };
  }
  const site = env("GSC_SITE_URL") || "sc-domain:belgradebest.com";
  let GoogleAuth: typeof import("google-auth-library").GoogleAuth;
  try {
    ({ GoogleAuth } = await import("google-auth-library"));
  } catch {
    return { configured: false, reason: "google-auth-library is not installed." };
  }
  try {
    const auth = new GoogleAuth({
      credentials: JSON.parse(credsJson),
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });
    const token = await auth.getAccessToken();
    const end = new Date();
    const start = new Date(Date.now() - 28 * 864e5);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end), dimensions: [dimension], rowLimit: 25 }),
      },
    );
    if (!res.ok) {
      return { configured: false, reason: `Search Console error: ${res.status} ${(await res.text()).slice(0, 200)}` };
    }
    const json = (await res.json()) as { rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[] };
    const rows = (json.rows ?? []).map((r) => ({
      key: r.keys?.[0] ?? "",
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    }));
    return { configured: true, rows };
  } catch (e) {
    return { configured: false, reason: `Search Console error: ${(e as Error).message}` };
  }
}

export const searchConsoleTopQueries = () => gscQuery("query");
export const searchConsoleTopPages = () => gscQuery("page");

// ── Rich GA4 overview ────────────────────────────────────────────────────────
// One batched pull powering the redesigned Analytics screen: headline KPIs with
// period-over-period deltas, a daily trend series (sparklines), traffic channels,
// devices, geo, new-vs-returning, landing pages (browsing patterns) and top
// pages. Degrades gracefully exactly like ga4TopPages().

export type Kpi = { value: number; prev: number; delta: number | null };
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
      timeseries: { date: string; users: number; views: number }[];
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

    const cur = { startDate: `${days}daysAgo`, endDate: "today" };
    const prev = { startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` };
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
          // 1 — daily trend (sparklines)
          {
            dateRanges: [cur],
            dimensions: [{ name: "date" }],
            metrics: [{ name: "totalUsers" }, { name: "screenPageViews" }],
            orderBys: [{ dimension: { dimensionName: "date" } }],
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

    const timeseries = rep(reports, 1).map((r) => ({
      date: r.dimensionValues?.[0]?.value ?? "",
      users: num(r.metricValues?.[0]?.value),
      views: num(r.metricValues?.[1]?.value),
    }));
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
    const startD = new Date(Date.now() - days * 864e5);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    return {
      configured: true,
      range: { days, start: fmt(startD), end: fmt(today) },
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
