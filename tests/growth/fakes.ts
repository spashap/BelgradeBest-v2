// Fake upstreams for the Growth API tests. No network, no Google quota.
import type { GrowthDeps, Ga4Runner, Ga4Request, Ga4Report, GscRunner, GscRow } from "../../src/lib/growth/types.ts";
import { SUMMARY_GA4, CONTENT_GA4 } from "../../src/lib/growth/reports.ts";

export const NOW = new Date("2026-09-10T12:00:00Z");
export const TOKEN = "test-token-abc123";

const row = (dims: string[], metrics: number[]) => ({ dims, metrics });

// A summary-shaped GA4 answer keyed by request index (mirrors summaryGa4Requests).
export function fakeSummaryGa4(): Ga4Runner {
  return async (requests: Ga4Request[]): Promise<Ga4Report[]> =>
    requests.map((_, i) => {
      switch (i) {
        case SUMMARY_GA4.KPI:
          return { rows: [row([], [148, 175, 269, 0.37, 16975, 1.54, 140])] };
        case SUMMARY_GA4.NEW_RETURNING:
          return { rows: [row(["new"], [140]), row(["returning"], [8])] };
        case SUMMARY_GA4.DEVICES:
          return { rows: [row(["desktop"], [100, 120]), row(["mobile"], [48, 55])] };
        case SUMMARY_GA4.COUNTRIES:
          return { rows: [row(["Serbia"], [24, 30]), row(["United States"], [25, 26])] };
        case SUMMARY_GA4.CHANNELS:
          return { rows: [row(["Direct"], [69, 60]), row(["Organic Search"], [60, 55]), row(["Organic Social"], [29, 25])] };
        case SUMMARY_GA4.SOURCES:
          return {
            rows: [
              row(["(direct)", "(none)"], [69, 60]),
              row(["bing", "organic"], [30, 28]),
              row(["m.facebook.com", "referral"], [20, 18]),
              row(["l.facebook.com", "referral"], [9, 8]),
              row(["google", "organic"], [4, 4]),
              row(["countdown-widget", "embed"], [2, 2]),
              row(["copilot.com", "referral"], [5, 5]),
              row(["reddit.com", "referral"], [3, 3]),
            ],
          };
        case SUMMARY_GA4.LANDING:
          return {
            rows: [
              row(["/plan-your-trip/airport-to-city"], [9, 0.6, 0.4, 900]),
              row(["/expo-2027/pavilions/germany/"], [4, 0.5, 0.5, 200]),
              row(["/admin/analytics"], [1, 0, 1, 0]),
            ],
          };
        case SUMMARY_GA4.EXPO_PAGES:
          return {
            rows: [
              row(["/expo-2027"], [40, 30]),
              row(["/expo-2027/pavilions/germany"], [12, 10]),
              row(["/de/expo-2027/tickets"], [5, 5]),
            ],
          };
        case SUMMARY_GA4.EXPO_LANDING:
          return { rows: [row(["/expo-2027"], [15]), row(["/expo-2027/pavilions/germany"], [4])] };
        default:
          return { rows: [] };
      }
    });
}

export function fakeContentGa4(): Ga4Runner {
  return async (requests: Ga4Request[]): Promise<Ga4Report[]> =>
    requests.map((_, i) => {
      switch (i) {
        case CONTENT_GA4.PAGES:
          return {
            rows: [
              row(["/plan-your-trip/airport-to-city"], [50, 40, 4000]),
              row(["/expo-2027/pavilions/germany"], [12, 10, 500]),
              row(["/expo-2027/pavilions/germany/"], [3, 3, 100]),
              row(["/areas/dorcol"], [8, 8, 300]),
              row(["/glossary/kafana"], [6, 6, 200]),
              row(["/"], [30, 25, 600]),
              row(["/about"], [2, 2, 20]),
              row(["/admin"], [7, 1, 0]),
              row(["/manage"], [2, 1, 0]),
            ],
          };
        case CONTENT_GA4.LANDING:
          return {
            rows: [row(["/plan-your-trip/airport-to-city"], [9, 0.6, 0.4]), row(["/expo-2027/pavilions/germany"], [4, 0.5, 0.5])],
          };
        case CONTENT_GA4.LANDING_CHANNEL:
          return {
            rows: [
              row(["/plan-your-trip/airport-to-city", "Organic Search"], [7]),
              row(["/plan-your-trip/airport-to-city", "Organic Social"], [2]),
              row(["/expo-2027/pavilions/germany", "Referral"], [4]),
            ],
          };
        default:
          return { rows: [] };
      }
    });
}

export function fakeGsc(): GscRunner {
  return async (req): Promise<GscRow[]> => {
    if (!req.dimensions) return [{ keys: [], clicks: 2, impressions: 106, ctr: 0.0189, position: 45.7 }];
    if (req.dimensions[0] === "query")
      return [{ keys: ["expo 2027 belgrade"], clicks: 1, impressions: 40, ctr: 0.025, position: 12.8 }];
    if (req.pageRegex)
      return [
        { keys: ["https://belgradebest.com/expo-2027/pavilions"], clicks: 1, impressions: 34, ctr: 0.03, position: 12.8 },
        { keys: ["https://belgradebest.com/expo-2027/pavilions/germany"], clicks: 0, impressions: 10, ctr: 0, position: 30 },
      ];
    return [
      { keys: ["https://belgradebest.com/expo-2027/pavilions"], clicks: 1, impressions: 34, ctr: 0.03, position: 12.8 },
      { keys: ["https://belgradebest.com/plan-your-trip/airport-to-city"], clicks: 1, impressions: 20, ctr: 0.05, position: 9 },
      { keys: ["http://www.belgradebest.com/plan-your-trip/airport-to-city/"], clicks: 0, impressions: 5, ctr: 0, position: 15 },
    ];
  };
}

export const failingGa4: Ga4Runner = async () => {
  throw new Error("GA4 error: quota exceeded");
};
export const failingGsc: GscRunner = async () => {
  throw new Error("Search Console error: 403");
};

export const CHANGELOG = [
  '{"id":"BB-CHG-0001","timestamp":"2026-09-01T10:00:00Z","category":"seo","title":"First","reason":"r","affected_area":["/"],"expected_metrics":[],"experiment_id":null,"author":"claude-code","notes":""}',
  '{"id":"BB-CHG-0002","timestamp":"2026-09-05T10:00:00Z","category":"analytics","title":"Second","reason":"r","affected_area":[],"expected_metrics":["sessions"],"experiment_id":"exp-1","author":"owner","notes":"n"}',
  "not json at all",
  '{"id":"BAD-ID","timestamp":"2026-09-06T10:00:00Z","category":"x","title":"bad id"}',
].join("\n");

export function deps(over: Partial<GrowthDeps> = {}): GrowthDeps {
  return {
    token: TOKEN,
    now: () => NOW,
    ga4: fakeSummaryGa4(),
    gsc: fakeGsc(),
    changelogText: CHANGELOG,
    listingCounts: () => ({ masters_total: 79, published_top_level: 21, published_children: 1, claimed: 0 }),
    leadCount: async () => 0,
    ...over,
  };
}

export const authed = (url: string, token = TOKEN) =>
  new Request(url, { headers: { Authorization: `Bearer ${token}` } });
