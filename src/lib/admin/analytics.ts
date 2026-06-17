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

export function vercelInfo() {
  const team = env("VERCEL_TEAM_ID");
  return {
    note: "Vercel Web Analytics is viewed in the project's Analytics tab on vercel.com. The site's production <script> collects the data.",
    dashboardUrl: team ? `https://vercel.com/${team}` : "https://vercel.com/dashboard",
  };
}
