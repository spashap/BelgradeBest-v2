// GET /api/growth/content — per-page performance, GA4 joined with Search
// Console on the normalised path and classified by the site's own routes.
import type { GrowthDeps } from "./types.ts";
import type { Period } from "./dates.ts";
import { gscPeriod } from "./dates.ts";
import { DataQuality } from "./envelope.ts";
import { cached, TTL } from "./cache.ts";
import { classifyPath, isReportable, type Classification } from "./classify.ts";
import {
  CONTENT_GA4,
  contentGa4Requests,
  reducePages,
  reduceLanding,
  reduceLandingChannels,
  reduceGscKeyed,
  type PageRow,
  type LandingRow,
  type GscKeyed,
} from "./reports.ts";
import { NO_CONVERSIONS_WARNING, NO_POST_LEVEL_WARNING } from "./summary.ts";

export type ContentPage = {
  path: string;
  content_type: Classification["content_type"];
  section: string;
  lang: "en" | "de";
  expo: boolean;
  ga4: {
    views: number;
    users: number;
    sessions_as_landing_page: number;
    engagement_rate: number | null;
    bounce_rate: number | null;
    avg_engagement_seconds: number | null;
  } | null;
  search: { clicks: number; impressions: number; ctr: number; position: number | null } | null;
  acquisition: { landing_sessions_by_channel: Record<string, number> } | null;
};

async function ga4Content(deps: GrowthDeps, period: Period) {
  if (!deps.ga4) throw new Error(deps.ga4Reason ?? "GA4 not configured");
  const reports = await deps.ga4(contentGa4Requests(period.from, period.to));
  return {
    pages: reducePages(reports[CONTENT_GA4.PAGES]),
    landing: reduceLanding(reports[CONTENT_GA4.LANDING]),
    channels: reduceLandingChannels(reports[CONTENT_GA4.LANDING_CHANNEL]),
  };
}

async function gscContent(deps: GrowthDeps, period: Period): Promise<GscKeyed[]> {
  if (!deps.gsc) throw new Error(deps.gscReason ?? "Search Console not configured");
  const rows = await deps.gsc({ from: period.from, to: period.to, dimensions: ["page"], rowLimit: 500 });
  return reduceGscKeyed(rows, true);
}

export function mergeContent(
  pages: PageRow[],
  landing: LandingRow[],
  channels: Map<string, Record<string, number>>,
  search: GscKeyed[],
  hasGa4: boolean,
  hasGsc: boolean,
): ContentPage[] {
  const by = new Map<string, ContentPage>();
  const get = (path: string): ContentPage | null => {
    const cls = classifyPath(path);
    if (!isReportable(cls)) return null;
    let p = by.get(cls.path);
    if (!p) {
      p = {
        path: cls.path,
        content_type: cls.content_type,
        section: cls.section,
        lang: cls.lang,
        expo: cls.expo,
        ga4: hasGa4
          ? { views: 0, users: 0, sessions_as_landing_page: 0, engagement_rate: null, bounce_rate: null, avg_engagement_seconds: null }
          : null,
        search: hasGsc ? { clicks: 0, impressions: 0, ctr: 0, position: null } : null,
        acquisition: null,
      };
      by.set(cls.path, p);
    }
    return p;
  };
  for (const r of pages) {
    const p = get(r.path);
    if (!p?.ga4) continue;
    p.ga4.views += r.views;
    p.ga4.users += r.users;
    p.ga4.avg_engagement_seconds = r.avg_engagement_seconds;
  }
  for (const l of landing) {
    const p = get(l.path);
    if (!p?.ga4) continue;
    p.ga4.sessions_as_landing_page += l.sessions;
    p.ga4.engagement_rate = l.engagement_rate;
    p.ga4.bounce_rate = l.bounce_rate;
  }
  for (const [path, ch] of channels) {
    const p = get(path);
    if (!p) continue;
    p.acquisition = { landing_sessions_by_channel: ch };
  }
  for (const s of search) {
    const p = get(s.key);
    if (!p?.search) continue;
    // Several URL variants (http/https, www, trailing slash) can fold into one
    // path — sum clicks/impressions, keep the best (lowest) position.
    p.search.clicks += s.clicks;
    p.search.impressions += s.impressions;
    p.search.ctr = p.search.impressions > 0 ? Math.round((p.search.clicks / p.search.impressions) * 1e4) / 1e4 : 0;
    p.search.position = p.search.position === null ? s.position : Math.min(p.search.position, s.position);
  }
  return [...by.values()].sort(
    (a, b) =>
      (b.ga4?.views ?? 0) - (a.ga4?.views ?? 0) ||
      (b.search?.clicks ?? 0) - (a.search?.clicks ?? 0) ||
      (b.search?.impressions ?? 0) - (a.search?.impressions ?? 0) ||
      a.path.localeCompare(b.path),
  );
}

export async function buildContent(deps: GrowthDeps, period: Period, limit: number) {
  const quality = new DataQuality();
  const now = deps.now();

  let ga: Awaited<ReturnType<typeof ga4Content>> | null = null;
  try {
    const hit = await cached(`ga4:content:${period.from}:${period.to}`, TTL.GA4_MS, () => ga4Content(deps, period));
    ga = hit.value;
    quality.ok("ga4", hit.cached);
  } catch (e) {
    quality.unavailable("ga4", `Google Analytics 4 unavailable: ${(e as Error).message}`);
  }

  let gs: GscKeyed[] | null = null;
  const gp = gscPeriod(period, now);
  if (!gp) {
    quality.notApplicable("gsc");
    quality.warn("Search Console has no data yet for this period (it lags ~2 days).");
  } else {
    if (gp.to !== period.to) quality.warn(`Search Console figures end on ${gp.to} (data lags ~2 days).`);
    try {
      const hit = await cached(`gsc:content:${gp.from}:${gp.to}`, TTL.GSC_MS, () => gscContent(deps, gp));
      gs = hit.value;
      quality.ok("gsc", hit.cached);
    } catch (e) {
      quality.unavailable("gsc", `Google Search Console unavailable: ${(e as Error).message}`);
    }
  }

  const merged = mergeContent(ga?.pages ?? [], ga?.landing ?? [], ga?.channels ?? new Map(), gs ?? [], !!ga, !!gs);
  quality.warn(NO_CONVERSIONS_WARNING);
  quality.warn(NO_POST_LEVEL_WARNING);

  const bySection: Record<string, { pages: number; views: number; clicks: number; impressions: number }> = {};
  for (const p of merged) {
    const s = (bySection[p.section] ??= { pages: 0, views: 0, clicks: 0, impressions: 0 });
    s.pages += 1;
    s.views += p.ga4?.views ?? 0;
    s.clicks += p.search?.clicks ?? 0;
    s.impressions += p.search?.impressions ?? 0;
  }

  const data = {
    limit,
    total_pages_seen: merged.length,
    post_level_attribution: false,
    acquisition_note:
      "acquisition.landing_sessions_by_channel is GA4's default channel grouping per landing page (platform level). Per-post attribution is unavailable.",
    pages: merged.slice(0, limit),
    by_section: bySection,
  };
  return { quality, data };
}
