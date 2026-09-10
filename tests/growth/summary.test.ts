import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { handleSummary } from "../../src/lib/growth/handlers.ts";
import { clearCache } from "../../src/lib/growth/cache.ts";
import { deps, authed, failingGa4, failingGsc } from "./fakes.ts";

const URL_S = "https://belgradebest.com/api/growth/summary?from=2026-08-01&to=2026-08-28";

beforeEach(() => clearCache());

const PRIVATE = /contact|outreach|tokenHash|manage|email|GA_CREDENTIALS|private_key|client_email|GITHUB_TOKEN/i;

test("summary envelope + traffic/seo/expo blocks", async () => {
  const res = await handleSummary(authed(URL_S), deps());
  assert.equal(res.status, 200);
  const b = await res.json();
  assert.equal(b.schema_version, "1");
  assert.equal(b.project, "belgradebest");
  assert.deepEqual(b.period, { from: "2026-08-01", to: "2026-08-28", timezone: "UTC" });
  assert.equal(b.data_quality.status, "ok");
  assert.equal(b.data_quality.sources.ga4, "ok");
  assert.equal(b.data_quality.sources.gsc, "ok");

  const t = b.data.traffic;
  assert.equal(t.users, 148);
  assert.equal(t.sessions, 175);
  assert.equal(t.pageviews, 269);
  assert.equal(t.engagement_rate, 0.37);
  assert.equal(t.engagement_duration_seconds_per_session, 97);
  assert.equal(t.views_per_session, 1.54);
  assert.deepEqual(t.new_vs_returning, { new: 140, returning: 8 });
  assert.equal(t.devices[0].device, "desktop");
  assert.equal(t.countries.length, 2);
  assert.equal(t.channels[0].channel, "Direct");

  // source/medium → platforms
  const plat = Object.fromEntries(t.platforms.map((p: { platform: string; sessions: number }) => [p.platform, p.sessions]));
  assert.equal(plat.facebook, 29);
  assert.equal(plat.bing, 30);
  assert.equal(plat.google, 4);
  assert.equal(plat.direct, 69);
  assert.equal(plat.embed_widget, 2);
  assert.equal(plat.ai_assistant, 5);
  assert.equal(plat.reddit, 3);
  assert.ok(t.sources.some((s: { source: string; medium: string }) => s.source === "m.facebook.com" && s.medium === "referral"));

  // landing pages: admin path dropped, trailing slash folded
  const paths = b.data.landing_pages.map((l: { path: string }) => l.path);
  assert.ok(paths.includes("/expo-2027/pavilions/germany"));
  assert.ok(!paths.some((p: string) => p.startsWith("/admin")));
  assert.equal(b.data.landing_pages[0].engagement_rate, 0.6);
  assert.equal(b.data.landing_pages[0].avg_engagement_seconds, 100);

  // seo
  assert.equal(b.data.seo.clicks, 2);
  assert.equal(b.data.seo.impressions, 106);
  assert.equal(b.data.seo.position, 45.7);
  assert.equal(b.data.seo.top_queries[0].query, "expo 2027 belgrade");
  assert.equal(b.data.seo.top_pages[0].path, "/expo-2027/pavilions");
  // Search Console URL variants (http/www/trailing slash) fold to one path row
  const seoPaths = b.data.seo.top_pages.map((p: { path: string }) => p.path);
  assert.equal(new Set(seoPaths).size, seoPaths.length, "duplicate paths in seo.top_pages");
  const airport = b.data.seo.top_pages.find((p: { path: string }) => p.path === "/plan-your-trip/airport-to-city");
  assert.equal(airport.impressions, 25);
  assert.equal(airport.clicks, 1);
  assert.equal(airport.position, 9);
  assert.deepEqual(b.data.seo.window, { from: "2026-08-01", to: "2026-08-28" });

  // expo
  assert.equal(b.data.expo.ga4.pageviews, 57);
  assert.equal(b.data.expo.ga4.landing_sessions, 19);
  assert.equal(b.data.expo.search.impressions, 44);
  assert.equal(b.data.expo.search.clicks, 1);
  assert.deepEqual(b.data.expo.listings, { masters_total: 79, published_top_level: 21, published_children: 1, claimed: 0 });
  assert.equal(b.data.expo.leads.count, 0);

  // limitations are explicit
  assert.equal(b.data.attribution.post_level_attribution, false);
  assert.equal(b.data.conversions, null);
  assert.ok(b.data_quality.warnings.some((w: string) => /conversion/i.test(w)));
  assert.ok(b.data_quality.warnings.some((w: string) => /post-level/i.test(w)));

  assert.doesNotMatch(JSON.stringify(b), PRIVATE);
});

test("GSC down → partial with GA4 data intact", async () => {
  const res = await handleSummary(authed(URL_S), deps({ gsc: failingGsc }));
  const b = await res.json();
  assert.equal(res.status, 200);
  assert.equal(b.data_quality.status, "partial");
  assert.equal(b.data_quality.sources.gsc, "unavailable");
  assert.ok(b.data_quality.warnings.some((w: string) => w.startsWith("Google Search Console unavailable")));
  assert.equal(b.data.traffic.sessions, 175);
  assert.equal(b.data.seo.clicks, 0);
  assert.equal(b.data.seo.top_queries.length, 0);
  assert.equal(b.data.expo.search, null);
});

test("GA4 down → partial with GSC data intact", async () => {
  const res = await handleSummary(authed(URL_S), deps({ ga4: failingGa4 }));
  const b = await res.json();
  assert.equal(b.data_quality.status, "partial");
  assert.equal(b.data.traffic, null);
  assert.deepEqual(b.data.landing_pages, []);
  assert.equal(b.data.seo.impressions, 106);
});

test("GA4 not configured → partial with the configuration reason", async () => {
  const res = await handleSummary(authed(URL_S), deps({ ga4: null, ga4Reason: "Set GA_PROPERTY_ID" }));
  const b = await res.json();
  assert.equal(b.data_quality.status, "partial");
  assert.ok(b.data_quality.warnings.some((w: string) => w.includes("Set GA_PROPERTY_ID")));
});

test("period inside the Search Console lag → gsc not_applicable, still 200", async () => {
  const res = await handleSummary(authed("https://x/api/growth/summary?from=2026-09-09&to=2026-09-09"), deps());
  const b = await res.json();
  assert.equal(res.status, 200);
  assert.equal(b.data_quality.sources.gsc, "not_applicable");
  assert.equal(b.data.seo.window, null);
});

test("warm cache: second call reuses GA4/GSC results and says so", async () => {
  let calls = 0;
  const counting = deps();
  const inner = counting.ga4!;
  counting.ga4 = async (r) => {
    calls++;
    return inner(r);
  };
  await handleSummary(authed(URL_S), counting);
  const b = await (await handleSummary(authed(URL_S), counting)).json();
  assert.equal(calls, 1);
  assert.equal(b.data_quality.sources.ga4, "cached");
});

test("failures are not cached", async () => {
  let n = 0;
  const flaky = deps({
    gsc: async (req) => {
      n++;
      if (n <= 4) throw new Error("boom");
      return (await deps().gsc!(req)) ?? [];
    },
  });
  const first = await (await handleSummary(authed(URL_S), flaky)).json();
  assert.equal(first.data_quality.sources.gsc, "unavailable");
  const second = await (await handleSummary(authed(URL_S), flaky)).json();
  assert.equal(second.data_quality.sources.gsc, "ok");
});
