import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { handleContent } from "../../src/lib/growth/handlers.ts";
import { clearCache } from "../../src/lib/growth/cache.ts";
import { deps, authed, fakeContentGa4, failingGsc } from "./fakes.ts";

const URL_C = "https://belgradebest.com/api/growth/content?from=2026-08-01&to=2026-08-28";

beforeEach(() => clearCache());

type Page = {
  path: string;
  content_type: string;
  section: string;
  lang: string;
  expo: boolean;
  ga4: { views: number; users: number; sessions_as_landing_page: number; engagement_rate: number | null } | null;
  search: { clicks: number; impressions: number; ctr: number; position: number | null } | null;
  acquisition: { landing_sessions_by_channel: Record<string, number> } | null;
};

test("content merges GA4 and GSC per normalised path and classifies", async () => {
  const res = await handleContent(authed(URL_C + "&limit=10"), deps({ ga4: fakeContentGa4() }));
  assert.equal(res.status, 200);
  const b = await res.json();
  const pages: Page[] = b.data.pages;
  assert.equal(b.data.limit, 10);
  assert.equal(b.data.post_level_attribution, false);

  const by = Object.fromEntries(pages.map((p) => [p.path, p]));
  // internal surfaces excluded
  assert.equal(by["/admin"], undefined);
  assert.equal(by["/manage"], undefined);

  const a = by["/plan-your-trip/airport-to-city"];
  assert.equal(a.content_type, "article");
  assert.equal(a.section, "plan-your-trip");
  assert.equal(a.ga4!.views, 50);
  assert.equal(a.ga4!.sessions_as_landing_page, 9);
  assert.equal(a.ga4!.engagement_rate, 0.6);
  // two GSC URL variants folded: 1+0 clicks, 20+5 impressions, best position
  assert.equal(a.search!.clicks, 1);
  assert.equal(a.search!.impressions, 25);
  assert.equal(a.search!.ctr, 0.04);
  assert.equal(a.search!.position, 9);
  assert.deepEqual(a.acquisition!.landing_sessions_by_channel, { "Organic Search": 7, "Organic Social": 2 });

  const g = by["/expo-2027/pavilions/germany"];
  assert.equal(g.content_type, "listing");
  assert.equal(g.expo, true);
  assert.equal(g.ga4!.views, 15); // "/…/germany" + "/…/germany/" folded

  assert.equal(by["/"].content_type, "homepage");
  assert.equal(by["/areas/dorcol"].content_type, "area");
  assert.equal(by["/glossary/kafana"].content_type, "glossary");
  assert.equal(by["/about"].content_type, "utility");
  // GSC-only page appears with zero GA4
  assert.equal(by["/expo-2027/pavilions"].content_type, "listing_directory");
  assert.equal(by["/expo-2027/pavilions"].ga4!.views, 0);
  assert.equal(by["/expo-2027/pavilions"].search!.impressions, 34);

  // ordered by views desc
  assert.equal(pages[0].path, "/plan-your-trip/airport-to-city");
  assert.ok(b.data.by_section["plan-your-trip"].views >= 50);
  assert.doesNotMatch(JSON.stringify(b), /contact|outreach|tokenHash|GA_CREDENTIALS/i);
});

test("limit applies and total_pages_seen reports the full set", async () => {
  const b = await (await handleContent(authed(URL_C + "&limit=2"), deps({ ga4: fakeContentGa4() }))).json();
  assert.equal(b.data.pages.length, 2);
  assert.ok(b.data.total_pages_seen > 2);
});

test("GSC down → search null per page, status partial", async () => {
  const b = await (await handleContent(authed(URL_C), deps({ ga4: fakeContentGa4(), gsc: failingGsc }))).json();
  assert.equal(b.data_quality.status, "partial");
  assert.equal(b.data.pages[0].search, null);
  assert.equal(b.data.pages[0].ga4.views, 50);
});

test("GA4 down → ga4 null per page but GSC pages still listed", async () => {
  const b = await (await handleContent(authed(URL_C), deps({ ga4: null, ga4Reason: "no GA4" }))).json();
  assert.equal(b.data_quality.status, "partial");
  assert.ok(b.data.pages.length >= 2);
  assert.equal(b.data.pages[0].ga4, null);
  assert.ok(b.data.pages[0].search.impressions > 0);
});
