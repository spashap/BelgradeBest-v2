// Analytics readers for the local admin. GA4 via the Data API (well-documented);
// Vercel Web Analytics is viewed in the Vercel dashboard (its REST API is not
// stably public — the live <script> on the production site collects the data).
// Both degrade gracefully when unconfigured.

export async function ga4TopPages() {
  const propertyId = process.env.GA_PROPERTY_ID;
  if (!propertyId) {
    return {
      configured: false,
      reason: "Set GA_PROPERTY_ID and GOOGLE_APPLICATION_CREDENTIALS in admin/.env",
    };
  }
  let mod;
  try {
    mod = await import("@google-analytics/data");
  } catch {
    return { configured: false, reason: "Run `npm install` in admin/ to add @google-analytics/data" };
  }
  try {
    const { BetaAnalyticsDataClient } = mod;
    const client = new BetaAnalyticsDataClient();
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
    return { configured: false, reason: `GA4 error: ${e.message}` };
  }
}

export function vercelInfo() {
  const projectId = process.env.VERCEL_PROJECT_ID;
  const team = process.env.VERCEL_TEAM_ID;
  return {
    configured: !!projectId,
    projectId: projectId ?? null,
    dashboardUrl: team
      ? `https://vercel.com/${team}`
      : "https://vercel.com/dashboard",
    note: "Vercel Web Analytics is viewed in the project's Analytics tab on vercel.com. The site's production <script> collects the data; set VERCEL_PROJECT_ID/VERCEL_TEAM_ID in admin/.env to surface the link here.",
  };
}
