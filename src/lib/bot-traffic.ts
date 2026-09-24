// Known non-human traffic that GA4's built-in (IAB list) bot filter lets through.
// ONE list, read by the public tag (Analytics.astro — stop collecting) and by every
// GA4 report the admin + Growth API run (lib/admin/analytics.ts — strip history).
//
// Signature (verified 2026-09-24, 90 days): headless Chrome at a square or
// non-standard screen size, Direct, exactly 1 page, ~0 s engagement. 1280x1200 is
// the Singapore datacenter crawler (139 of 139 SG sessions in 28 days, 0 s total);
// 1366x1366 is the same kit on residential proxies (Brazil, Pakistan, ~20 more).
// No real monitor or phone reports either size. Add a size only with the same
// evidence (GA4: screenResolution × country × channel, engagement ≈ 0).
export const BOT_SCREEN_RESOLUTIONS = ["1280x1200", "1366x1366"];

// GA4 Data API FilterExpression that drops those sessions from a report.
export const GA4_BOT_EXCLUSION = {
  notExpression: {
    filter: { fieldName: "screenResolution", inListFilter: { values: BOT_SCREEN_RESOLUTIONS } },
  },
};

// AND the exclusion onto a report's own dimensionFilter (if any).
export function withoutBots<T extends object>(filter?: T) {
  return filter ? { andGroup: { expressions: [GA4_BOT_EXCLUSION, filter] } } : GA4_BOT_EXCLUSION;
}
