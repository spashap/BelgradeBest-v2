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

export function vercelInfo() {
  const team = env("VERCEL_TEAM_ID");
  return {
    note: "Vercel Web Analytics is viewed in the project's Analytics tab on vercel.com. The site's production <script> collects the data.",
    dashboardUrl: team ? `https://vercel.com/${team}` : "https://vercel.com/dashboard",
  };
}
