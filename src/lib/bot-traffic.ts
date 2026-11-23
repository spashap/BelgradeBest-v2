// Known non-human traffic that GA4's built-in (IAB list) bot filter lets through:
// headless screen sizes + Facebook's link previewer (by referrer, below).
// ONE list, read by the public tag (Analytics.astro — stop collecting) and by every
// GA4 report the admin + Growth API run (lib/admin/analytics.ts — strip history).
//
// Signature (verified 2026-09-24, 90 days): headless Chrome at a square or
// non-standard screen size, Direct, exactly 1 page, ~0 s engagement. 1280x1200 is
// the Singapore datacenter crawler (139 of 139 SG sessions in 28 days, 0 s total);
// 1366x1366 is the same kit on residential proxies (Brazil, Pakistan, ~20 more).
// No real monitor or phone reports either size. Add a size only with the same
// evidence (GA4: screenResolution × country × channel, engagement ≈ 0).
//
// 2000x2000 (added 2026-11-16): Meta's link crawler. 312 of 314 sessions since
// June are Organic Social (Facebook), from US/Sweden/Ireland datacentres, about
// 5 s of "engagement" each — it fires engagement events, so it inflated
// Facebook's engaged sessions. No real screen is 2000x2000.
//
// 1280x1600 (added 2026-11-23): a crawler in Ashburn, Virginia (Amazon's
// us-east-1 data centres). 40 of 40 sessions since June, all in November,
// Direct, one page each, 0 s, and GA4 cannot even parse its browser or OS
// ("(not set)"). It walked the site page by page (areas, pavilions, German
// pages). It was the largest single source in Direct.
//
// 1600x1200 (added 2026-11-23): a Chinese scraper (Shenzhen, Guangzhou,
// Zhongshan) claiming "Android 6.0" on a desktop-monitor-sized screen. 19 of
// 19 sessions since June, Direct, 0 engaged. 1600x1200 is an old 4:3 monitor
// size, but no real visitor has reported it in six months.
//
// NOT listed on purpose: 412x915 and 440x956 (real Pixel / iPhone Pro Max sizes).
// Facebook's link previewer uses them, so it is caught by its referrer instead.
export const BOT_SCREEN_RESOLUTIONS = ["1280x1200", "1366x1366", "2000x2000", "1280x1600", "1600x1200"];

// Facebook's link previewer (added 2026-11-23). It opens every shared link
// with the referrer "http://m.facebook.com" — plain http, no path. Since June:
// 307 sessions, every one from a Meta data-centre town (Prineville, Luleå,
// Dublin, Forest City, Fort Worth, Altoona…), 0 s of engagement, emulating a
// 412x915 Android or 440x956 iPhone. Real Facebook visitors always arrive from
// https:// (facebook.com, l./lm./m.facebook.com). Stripping it took the last
// 28 days' Organic Social from 143 to 15 sessions (engaged 7 → 5) and left
// every other channel untouched. A FULL match (GA4 RE2; anchored in JS too).
export const BOT_REFERRER_PATTERN = "http://([a-z]+\\.)?facebook\\.com/?";

// GA4 Data API FilterExpression that drops those sessions from a report.
export const GA4_BOT_EXCLUSION = {
  andGroup: {
    expressions: [
      { notExpression: { filter: { fieldName: "screenResolution", inListFilter: { values: BOT_SCREEN_RESOLUTIONS } } } },
      {
        notExpression: {
          filter: { fieldName: "pageReferrer", stringFilter: { matchType: "FULL_REGEXP", value: BOT_REFERRER_PATTERN } },
        },
      },
    ],
  },
};

// AND the exclusion onto a report's own dimensionFilter (if any).
export function withoutBots<T extends object>(filter?: T) {
  return filter ? { andGroup: { expressions: [GA4_BOT_EXCLUSION, filter] } } : GA4_BOT_EXCLUSION;
}
