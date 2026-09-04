# Website efficiency report — 2026-09-04

Third measured checkpoint (baseline 2026-08-07, recheck 2026-08-20). All numbers
pulled live via the wired APIs (GSC, GA4, Bing WMT legacy JSON — still answering
on 2026-09-04 despite the announced 08-31 retirement). Windows: GSC 05 Aug–01 Sep
vs 08 Jul–04 Aug; GA4 07 Aug–03 Sep vs 10 Jul–06 Aug; Bing 14 Aug–01 Sep (18 days,
all Bing has).

## Verdict in one paragraph

The site is technically healthy and its content works: Bing ranks it in the top 10
on real-intent queries, Copilot/ChatGPT/Perplexity already send visitors, and every
traffic metric is 3–4x the prior month. It is still tiny — about 6 visits a day —
because it has **zero backlinks** (Bing InLinks = 0 on every crawl row), so Google
keeps it at position ~45 and refuses to crawl a third of the sitemap. The business
funnel has not started: 0 outreach emails sent, 0 claims, 0 inbound leads. The
constraint is distribution and authority, not the product.

## Traffic (GA4)

| Metric | prev 28d | cur 28d |
|---|---|---|
| Sessions | 50 | 175 |
| Users | 45 | 148 |
| Pageviews | 65 | 269 |
| Engaged sessions | 15 | 65 |
| Avg session duration | 28 s | 97 s |

Channels (cur 28d): Direct 69 (Singapore 31 sessions, bot-like) · Organic Search 60
(prev 4) · Organic Social 29 (all Facebook: facebook.com / m. / lm. / l.) · AI
Assistant 8 (copilot.com 5, chatgpt.com 3) + perplexity 3 · Referral 3 · widget 2.

Organic search by engine: **bing 30, duckduckgo 16, yahoo 4, ecosia 3, qwant 3 = 56
of 60 come from the Bing index**; google 4.

Top landing pages for organic: airport-to-city (9), visa-and-entry (9), money (4),
stations-and-onward-travel (3), pavilions/germany (4), expo-2027 (3), pavilions (3),
tracker (2), things-to-do (3). Practical "plan-your-trip" pages + Expo pages win.

Countries (sessions): SG 31 (bot), US 25, RS 24, IL 14, JP 12, DE 7, UK 7, AT 5,
BR 5, CN 5, FR 5.

## Google (GSC)

| | prev 28d | cur 28d |
|---|---|---|
| Impressions | 56 | 106 |
| Clicks | 0 | 2 |
| Avg position | 38.3 | 45.7 |
| Pages with impressions | — | 25 |

Position got worse because new deep pages started appearing at pos 60–90; the
one bright spot is `/expo-2027/pavilions` (34 impressions, pos 12.8). 103 of 106
impressions are desktop, 29 from the US — consistent with rank-checker/bot SERPs
rather than real users. Real Google demand for this site is effectively nil today.

Queries seen: "expo 2027 belgrade", "expo 2027 beograd", "belgrade crime",
"belgrade in march", "best pljeskavica belgrade", "bekrija meaning".

## Bing (Webmaster Tools)

18 days, 14 Aug–01 Sep: **745 impressions, 33 clicks, CTR 4.4%**, trending up
(last 4 days average 57 impressions/day vs 30 in the first week). 131 of 145
sitemap URLs in the Bing index, crawl 60–90 pages/day, 0 errors.

Top queries with position: "expo belgrade 2027" (14, pos 7), "expo 2027 belgrade"
(10, pos 6), "is belgrade worth visiting" (9, pos 6), "belgrade airport to city
center" (5, pos 9), "expo 2027 belgrade biglietti" (4, pos 2, 1 click),
"must do things in belgrade as a politics and history fan" (3, pos 1, 2 clicks),
"upscale belgrade restaurants" (pos 2), "expo 2027 serbia pavilion germany"
(pos 2), "saudi pavilion at belgrade expo 2027" (pos 3), "expo belgrad ticket
price" (pos 4).

Top pages: /expo-2027 (79 imp), /plan-your-trip/visa-and-entry (62),
/plan-your-trip/airport-to-city (37), /plan-your-trip/money (27),
/visit-belgrade/is-belgrade-worth-visiting (13), /expo-2027/pavilions (9, 4 clicks),
/visit-belgrade/things-to-do-in-belgrade (7, 2 clicks).

Signals worth acting on: ticket-intent queries in Italian and German are already
ranking; pavilion pages rank pos 1–3 for "<country> pavilion expo 2027" queries.

## Authority

- **Backlinks: 0** (Bing GetLinkCounts empty, InLinks 0 daily). GA4 referrals in
  28 days: readlife.net 1, sunblog.asia 1 (both scraper-grade).
- `brand.sameAs` still empty — no social profiles linked from the Organization
  JSON-LD.
- Organic Social 29 sessions from Facebook shows posting works when it happens.

## Business funnel (platform)

72 listing files (23 top-level, 49 children). 12 have a contact email (mostly
generic government/agency inboxes). Outreach status: `none` on all 72. Claims: 0.
Inbound `/for-businesses` leads: 0. Resend not wired (no RESEND_API_KEY), so the
pipeline is draft-only, as it has been since July.

## Google index coverage (URL Inspection sweep, all sitemap URLs)

145 sitemap URLs inspected on 2026-09-04 (URL Inspection API):

| State | 20 Aug | 04 Sep |
|---|---|---|
| Submitted and indexed | 74 | **66** |
| Discovered, not indexed (never crawled) | 28 | 42 |
| Unknown to Google | 40 | 26 |
| Crawled, not indexed | 3 | 11 |

Google is going backwards: 8 pages dropped out of the index in two weeks while
the site gained traffic elsewhere. Patterns in the 79 unindexed URLs:

- **All 19 pavilion pages + the two children are unindexed** (discovered or
  unknown) — the exact pages Bing ranks pos 1–3 and Copilot cites.
- **8 of 15 medical-tourism articles are "crawled, not indexed"** — Google
  fetched them (July dates) and declined. On a zero-authority domain, YMYL
  content is the first to be refused; this leg will not index without
  authority signals.
- Core arrival pages are still *unknown* to Google: /plan-your-trip/airport-to-city,
  /visa-and-entry, /money (discovered), /where-to-stay hub, /food-and-nightlife hub.
  These are the best Bing performers. Nothing technical is wrong with them
  (200, self-canonical, in sitemap, internally linked); Google simply is not
  spending crawl budget here.
- 21 of 31 glossary terms unindexed; 6 of 11 areas.
- 7 "crawled, not indexed" pages carry July crawl dates and one August date
  (choosing-a-clinic 23 Aug) — Google re-evaluated one and still said no.

Conclusion unchanged from 20 Aug, now stronger: crawl-budget and quality
thresholds on a domain with no inbound links. Backlinks are the only lever
that changes this table.

## What changed since 20 Aug

- Traffic 3.5x, organic search 15x (from a near-zero base), first AI-assistant
  referrals appeared as a channel.
- Bing sitemap + 100-URL push on 20 Aug → Bing index 92 → 131 pages.
- Google indexed count fell 74 → 66; the Indexing API push (07 Aug) confirmed useless.

## Bottom line

Efficiency of what exists: good (content ranks where authority is not required;
engagement 97 s average; CTR 4.4% on Bing). Efficiency of distribution: zero —
nothing has been sent, posted on a schedule, or pitched. Next steps and the
90-day plan are in `KB/seo/NEXT-STEPS-2026-09-04.md`.
