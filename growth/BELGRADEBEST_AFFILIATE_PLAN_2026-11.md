# BelgradeBest — affiliate hub plan, Nov 2026 – May 2027

*16 November 2026. My draft was reviewed in two Codex rounds. I checked its claims against the repo and live sources; the verdicts are in the table below. This document is a proposal waiting for the owner's approval.*

## TL;DR

- **Visitor numbers, not link placement, limit income.** Codex's revenue model puts **about €100–700 in total commissions from now to Aug 2027**. Zero is possible. €2,000+ needs roughly ten times today's traffic. At 5–10 owner-hours a week, the Expo alone pays about €0.40–€5 per hour.
- **So:** about 70% of effort goes into winning readers, with conversion work capped. Treat the Expo as a way to build a **permanent Belgrade guide** whose evergreen pages (airport, neighbourhoods, stays) keep earning after Aug 2027.
- **Fix trust problems first.** Our own pages contradict each other, and the affiliate labels are too weak for UK/EU readers.
- **One number to judge it by:** sessions with at least one accommodation-affiliate click per 28 days. Bots and our own test clicks are excluded.

## What the review changed (each point verified)

| Codex point | Verdict |
|---|---|
| The hub's "unknowns" box says two ticket start dates passed; the tickets page says three | **True** (`src/pages/expo-2027/index.astro`) |
| "Beds are the bottleneck", "will go first and command premium prices" and "short, predictable commute" are not supported, and contradict our own caveat that visits ≠ overnight guests | **True.** The phrase now appears in about 9 places, including stay tiles I added on 16 Nov. |
| My head-term CTR was wrong | **True.** 1,898 impressions and 32 clicks give 1.69%, not 1.3%. One snippet change, then stop. |
| Removing cards with views but no clicks after 28 days chases noise | **True.** At a real 5% click rate, 20 views still give zero clicks 36% of the time. Delete the rule. |
| "Book Dec–Mar" is a hypothesis, not a deadline | Accepted |
| A reader on a pavilion page is not necessarily from that country | Accepted. The flight tiles stay as a measured experiment and won't be extended. |
| Airalo runs an eSIM affiliate programme on Impact at 10% | **True** (checked airalo.com). Our eSIM demand is tiny, though: about 15 Bing impressions in 3 months. **Deferred.** |
| serbiaexpo.com's stay page is weak | **True, and weaker than claimed.** It has 3 one-line areas, no named hotels, and every button links to "#". |
| An email ticket alert isn't worth it now | Accepted. At our traffic it would gather about 2–5 subscribers in 6 months. Under CAN-SPAM and UK rules it would also need a postal address and an identifiable controller, which conflicts with the owner's privacy. |
| Disclosure: label "Ad" where the commercial content is | Accepted (pattern in step 1) |

**Where I'd be careful:** Codex suggests contacting 8–12 Expo travel agencies. That counts as outreach. Our 17 Sep decision found cold email unlawful in most of our contacts' countries. If we do it, it has to be hand-sent, one at a time, after checking each country's rules, offering only a reference page and asking for nothing. **That is the owner's decision.**

## The plan (5 owner-hours a week by default)

| # | What | Why | Effort | It worked if… | Judge on |
|---|---|---|---|---|---|
| 1 | **Trust fixes across all languages.** Reword the bottleneck, scarcity and commute claims, including the stay page lede and FAQs. Fix the hub's ticket count. New disclosure: the date line says "We earn a commission when you book through links marked 'Ad'", cards start with "Ad ·", and in-text affiliate recommendations carry a short local label. Delete the 28-day card rule. | Trust is what converts. Labels shown only at the bottom or footer are too weak for UK and EU readers. | 2–3 h, mostly mine | Every commercial block is visibly labelled and the checked pages make no unsupported claims | 30 Nov 2026 |
| 2 | **Verify tracking end to end.** Click one tagged test link and confirm it appears in GA4 and in CJ by sub-ID. Read each advertiser's CJ terms: commission base, attribution window, cancellations. | Data that never arrives can't support a decision. | 1 h | The test click is visible in both, and the terms are written down | 30 Nov 2026 |
| 3 | **Ticket on-sale kit.** A prepared replacement for the top of the tickets page (EN/DE/SK/CS) covering status, official seller link, price table, conditions, unknowns and a dated change log. Matching hub row and a Facebook post. | 25% of searchers click our ticket results, and the announcement is the biggest traffic event coming. | 3–4 h now, 2–3 h on the day | Update live within 24 h; ticket clicks rise | Ready 30 Nov; judged 28 days after sales open |
| 4 | **Improve the airport page plus one other evergreen page that Bing already shows.** Sharper answers on payment and the A1 minibus, contradictions removed, everything kept on the same URL. | Existing Bing visibility is the cheapest way to win readers, and it is a money page (Welcome Pickups). | 8–10 h | Clicks on these pages up 25% or more over 8 weeks compared with before | 31 Jan 2027 |
| 5 | **Rebuild the Expo stay page around an honest access table.** One row per base, with columns: suits whom, which side of the Sava, transport that works today, confirmed visitor route (otherwise "not yet confirmed"), planned links, what to check before booking, source and date. No travel times to an approximate venue location. The Swissôtel gets a labelled "opening Q1 2027" note. EN and DE. | Gives better local judgement than Booking or serbiaexpo.com, without promises we can't keep. | 5–6 h | Published, claims clean, accommodation clicks measured | Published by 15 Dec; performance judged 31 Mar 2027 |
| 6 | **Six-week Facebook test.** Two useful posts a week (arrival, choosing a base, real ticket news), each linking to one guide with UTM tags. | Already 278 sessions per 28 days. | 0.5 h/week | 120 or more engaged sessions per 28 days (about 92 now) | 15 Jan 2027 |
| 7 | **Monthly scorecard.** Sessions with an accommodation-affiliate click, non-Expo organic landings, referring domains, commissions, owner-hours. | Protects owner time and shows what survives after the Expo. | 0.5 h/month | Non-Expo organic landings up 50% or more by May | 14 Dec (baseline), 31 May 2027, 30 Nov 2027 |
| (8) | *Optional, owner decision:* the agency reference pilot (8–12 agencies, under the safeguards above) | Possible links and qualified visitors | 4–5 h | One relevant referring domain, or two requests to use our page | 28 Feb 2027 |

## Dropped or deferred

- Email list and eSIM partner, both deferred.
- Slovak and Czech stay pages, more hotel cards, more flight tiles.
- New near-duplicate keyword pages, and repeated snippet tinkering.
- Removing cards on a 28-day timer.
- Contracts-ledger expansion, the quiz, homepage redesign, and anything aimed at locals.

**Still open (owner action):** completing the CJ Network Profile is a 30-minute task that unlocks GetYourGuide, Daytrip and 12GO. Add their products only to pages that already have the matching intent.
