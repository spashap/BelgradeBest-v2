// GET /api/growth/summary — traffic, landing pages, SEO and Expo aggregates.
import type { GrowthDeps, GscRow } from "./types.ts";
import type { Period } from "./dates.ts";
import { gscPeriod } from "./dates.ts";
import { DataQuality } from "./envelope.ts";
import { cached, TTL } from "./cache.ts";
import { classifyPath, isReportable } from "./classify.ts";
import {
  SUMMARY_GA4,
  summaryGa4Requests,
  reduceKpis,
  reduceNamed,
  reduceNewReturning,
  reduceSources,
  reduceLanding,
  reducePages,
  reduceGscTotals,
  reduceGscKeyed,
  foldGscPaths,
  sumGsc,
  EXPO_GSC_REGEX,
  type GscTotals,
} from "./reports.ts";

export const NO_CONVERSIONS_WARNING =
  "No downstream conversion tracking exists (no GA4 key events, no lead/claim events); conversion metrics are not reported.";
export const NO_POST_LEVEL_WARNING =
  "Post-level social attribution is unavailable: historical visits carry no utm_content/utm_campaign, so only platform-level source/medium is reported.";

async function ga4Summary(deps: GrowthDeps, period: Period) {
  if (!deps.ga4) throw new Error(deps.ga4Reason ?? "GA4 not configured");
  const reports = await deps.ga4(summaryGa4Requests(period.from, period.to));
  const kpis = reduceKpis(reports[SUMMARY_GA4.KPI]);
  const { sources, platforms } = reduceSources(reports[SUMMARY_GA4.SOURCES]);
  const landing = reduceLanding(reports[SUMMARY_GA4.LANDING]).filter((l) => isReportable(classifyPath(l.path)));
  const expoPages = reducePages(reports[SUMMARY_GA4.EXPO_PAGES]).filter((p) => classifyPath(p.path).expo);
  const expoLanding = reduceLanding(reports[SUMMARY_GA4.EXPO_LANDING]).filter((p) => classifyPath(p.path).expo);
  return {
    traffic: {
      ...kpis,
      new_vs_returning: reduceNewReturning(reports[SUMMARY_GA4.NEW_RETURNING]),
      devices: reduceNamed(reports[SUMMARY_GA4.DEVICES], "device", ["users", "sessions"]),
      countries: reduceNamed(reports[SUMMARY_GA4.COUNTRIES], "country", ["users", "sessions"]),
      channels: reduceNamed(reports[SUMMARY_GA4.CHANNELS], "channel", ["sessions", "users"]),
      platforms,
      sources,
    },
    landing_pages: landing,
    expo: {
      pageviews: expoPages.reduce((s, p) => s + p.views, 0),
      users_sum_by_page: expoPages.reduce((s, p) => s + p.users, 0),
      landing_sessions: expoLanding.reduce((s, p) => s + p.sessions, 0),
      top_pages: expoPages.slice(0, 15),
      top_landing_pages: expoLanding.slice(0, 10).map((l) => ({ path: l.path, sessions: l.sessions })),
    },
  };
}

async function gscSummary(deps: GrowthDeps, period: Period) {
  if (!deps.gsc) throw new Error(deps.gscReason ?? "Search Console not configured");
  const base = { from: period.from, to: period.to };
  const [totals, queries, pages, expoPages]: GscRow[][] = await Promise.all([
    deps.gsc({ ...base }),
    deps.gsc({ ...base, dimensions: ["query"], rowLimit: 25 }),
    deps.gsc({ ...base, dimensions: ["page"], rowLimit: 25 }),
    deps.gsc({ ...base, dimensions: ["page"], rowLimit: 100, pageRegex: EXPO_GSC_REGEX }),
  ]);
  const expoKeyed = foldGscPaths(reduceGscKeyed(expoPages, true).filter((p) => classifyPath(p.key).expo));
  return {
    seo: {
      ...reduceGscTotals(totals),
      top_queries: reduceGscKeyed(queries).map(({ key, ...rest }) => ({ query: key, ...rest })),
      top_pages: foldGscPaths(reduceGscKeyed(pages, true).filter((p) => isReportable(classifyPath(p.key)))).map(
        ({ key, ...rest }) => ({ path: key, ...rest }),
      ),
    },
    expo: {
      ...sumGsc(expoKeyed),
      top_pages: expoKeyed.slice(0, 15).map(({ key, ...rest }) => ({ path: key, ...rest })),
    },
  };
}

const EMPTY_GSC: GscTotals & { top_queries: unknown[]; top_pages: unknown[] } = {
  clicks: 0,
  impressions: 0,
  ctr: 0,
  position: null,
  top_queries: [],
  top_pages: [],
};

export async function buildSummary(deps: GrowthDeps, period: Period) {
  const quality = new DataQuality();
  const now = deps.now();

  // GA4 ─────────────────────────────────────────────────────────────────────
  let ga: Awaited<ReturnType<typeof ga4Summary>> | null = null;
  try {
    const hit = await cached(`ga4:summary:${period.from}:${period.to}`, TTL.GA4_MS, () => ga4Summary(deps, period));
    ga = hit.value;
    quality.ok("ga4", hit.cached);
  } catch (e) {
    quality.unavailable("ga4", `Google Analytics 4 unavailable: ${(e as Error).message}`);
  }

  // Search Console ──────────────────────────────────────────────────────────
  let gs: Awaited<ReturnType<typeof gscSummary>> | null = null;
  const gp = gscPeriod(period, now);
  let gscWindow: { from: string; to: string } | null = null;
  if (!gp) {
    quality.notApplicable("gsc");
    quality.warn(`Search Console has no data yet for this period (it lags ~2 days).`);
  } else {
    gscWindow = { from: gp.from, to: gp.to };
    if (gp.to !== period.to) quality.warn(`Search Console figures end on ${gp.to} (data lags ~2 days).`);
    try {
      const hit = await cached(`gsc:summary:${gp.from}:${gp.to}`, TTL.GSC_MS, () => gscSummary(deps, gp));
      gs = hit.value;
      quality.ok("gsc", hit.cached);
    } catch (e) {
      quality.unavailable("gsc", `Google Search Console unavailable: ${(e as Error).message}`);
    }
  }

  // Site facts (build snapshot; never private fields) ───────────────────────
  const listings = deps.listingCounts();
  let leads: number | null = null;
  try {
    leads = await deps.leadCount();
  } catch {
    leads = null;
  }
  if (leads === null) quality.warn("Lead count unavailable.");

  quality.warn(NO_CONVERSIONS_WARNING);
  quality.warn(NO_POST_LEVEL_WARNING);

  const data = {
    traffic: ga?.traffic ?? null,
    landing_pages: ga?.landing_pages ?? [],
    seo: {
      window: gscWindow,
      ...(gs?.seo ?? EMPTY_GSC),
    },
    expo: {
      ga4: ga?.expo ?? null,
      search: gs?.expo ?? null,
      listings,
      leads: { count: leads, note: "Count of stored lead files in the deployed snapshot; no lead details are exposed." },
    },
    attribution: {
      post_level_attribution: false,
      note: NO_POST_LEVEL_WARNING,
    },
    conversions: null,
  };
  return { quality, data };
}
