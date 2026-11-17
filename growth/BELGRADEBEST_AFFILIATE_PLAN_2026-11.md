# BelgradeBest — affiliate hub plan, Nov 2026 – May 2027

*16 November 2026. My draft was reviewed in two Codex rounds. I checked its claims against the repo and live sources; the verdicts are in the table below. The owner approved it on 16 Nov 2026. Progress is at the end.*

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
| 3 | **Ticket on-sale kit.** A prepared replacement for the top of the tickets page (EN/DE/SK/CS) covering status, official seller link, price table, conditions, unknowns and a dated change log. Matching hub row, a line to the Expo stay page, and a Facebook post. | 25% of searchers click our ticket results, and the announcement is the biggest traffic event coming. | 3–4 h now, 2–3 h on the day | Update live within 24 h; ticket clicks rise | Ready 30 Nov; judged 28 days after sales open |
| 4 | **Improve the airport page plus one other evergreen page that Bing already shows.** Sharper answers on payment and the A1 minibus, contradictions removed, everything kept on the same URL. | Existing Bing visibility is the cheapest way to win readers, and it is a money page (Welcome Pickups). | 8–10 h | Clicks on these pages up 25% or more over 8 weeks compared with before | 31 Jan 2027 |
| 5 | **Rebuild the Expo stay page around an honest access table.** One row per base, with columns: suits whom, which side of the Sava, transport that works today, confirmed visitor route (otherwise "not yet confirmed"), planned links, what to check before booking, source and date. No travel times to an approximate venue location. The Swissôtel gets a labelled "opening Q1 2027" note. EN and DE. | Gives better local judgement than Booking or serbiaexpo.com, without promises we can't keep. | 5–6 h | Published, claims clean, accommodation clicks measured | Published by 15 Dec; performance judged 31 Mar 2027 |
| 6 | ~~**Six-week Facebook test.**~~ *Cancelled 16 Nov; see Progress.* Two useful posts a week (arrival, choosing a base, real ticket news), each linking to one guide with UTM tags. | Already 278 sessions per 28 days. | 0.5 h/week | 120 or more engaged sessions per 28 days (about 92 now) | 15 Jan 2027 |
| 7 | **Monthly scorecard.** Sessions with an accommodation-affiliate click, non-Expo organic landings, referring domains, commissions, owner-hours. | Protects owner time and shows what survives after the Expo. | 0.5 h/month | Non-Expo organic landings up 50% or more by May | 14 Dec (baseline), 31 May 2027, 30 Nov 2027 |
| (8) | *Optional, owner decision:* the agency reference pilot (8–12 agencies, under the safeguards above) | Possible links and qualified visitors | 4–5 h | One relevant referring domain, or two requests to use our page | 28 Feb 2027 |

## Dropped or deferred

- Email list and eSIM partner, both deferred.
- Slovak and Czech stay pages, more hotel cards, more flight tiles.
- New near-duplicate keyword pages, and repeated snippet tinkering.
- Removing cards on a 28-day timer.
- Contracts-ledger expansion, the quiz, homepage redesign, and anything aimed at locals.

**Still open (owner action):** completing the CJ Network Profile is a 30-minute task that unlocks GetYourGuide, Daytrip and 12GO. Add their products only to pages that already have the matching intent.

## Progress

- **Step 1, done 16 Nov (V01.065).** Every affiliate link and block is labelled "Ad", the unsupported claims are gone, and the hub's ticket count is fixed.
- **Step 2, done 16 Nov.**
  - A test click reached GA4 within a minute and went through CJ to the right Booking.com hotel.
  - CJ counts clicks a day late, so the 16 Nov click still has to be seen in its report. Sub-IDs appear only on commissions.
  - The partner terms are in the strategy doc. **Booking credits only bookings made within 1 day of the click, and pays only after the stay.** Welcome Pickups pays 7% and Air Serbia 1%, both with 45 days.
  - Consequence for step 3: the on-sale kit also carries a line to the Expo stay page, because on-sale day is when readers fix their dates and can book a bed the same day.
  - Consequence for step 7: until summer 2027 the scorecard reads pending CJ commissions, not paid ones, because Expo stays pay only after they happen.
- **Step 3, kit ready 16 Nov.** `growth/BELGRADEBEST_TICKET_ONSALE_KIT.md` with templates in `growth/ticket-kit/`.
  - Ready to fill: replacement tickets pages in English, German, Slovak and Czech; hub rows and FAQs; pavilion tiles; Facebook posts; a list of every other page that states the ticket status; and the Bing URL list.
  - Each new page links to the stay page after "where to buy", with one labelled in-text link and the labelled Expo hotel card.
  - The build now refuses any page that still has an unfilled blank.
  - Tickets were still not on sale on 16 Nov (official programme page: "Tickets available soon").
  - Found while sweeping: two scarcity leftovers from step 1, now fixed. The Expo guide's "treat beds as the scarce resource" (EN and DE), and the German stay page's "knapp werden", which now matches the English "under pressure".
- **Step 4, shipped 16 Nov; judged 31 Jan 2027.** The second page is visa and entry, chosen because it has the most Bing impressions of any evergreen page and the lowest click rate. Both pages stay on the same URL.
  - **Airport page:**
    - A comparison table giving time, price and how you pay for each option, and a "How do you pay?" section.
    - The official A1 facts: cash in dinars only, bought from the driver. The official 2026 taxi zone fares: 3,500 RSD to the old town, 2,700 RSD to New Belgrade.
    - New night-arrival and train/bus-station sections, the airport train's expected opening (March or April 2027), and one labelled link to hotels near the airport.
  - **Visa page:**
    - The answer in the title, plus a table by passport.
    - New answers on "Is Belgrade in Schengen?" and on ID-card entry for EU, Swiss, Norwegian and Icelandic citizens.
    - Corrected passport and exemption wording, and the unsupported "register online" claim removed.
    - Routes onward to the airport, money and where-to-stay pages.
  - **Consistency:** the taxis page and the Expo getting-there pages in all four languages quoted an outdated 2,200–2,800 RSD voucher fare; they now give the 2026 zone fares. The airport page's E75 is corrected to E-70.
  - **Baseline, 21 Sep – 15 Nov 2026 (8 weeks):**

    | Page | Bing clicks | Bing impressions | Avg position | GA4 organic sessions |
    |---|---|---|---|---|
    | Airport to city | 17 | 423 | 3.8 | 31 |
    | Visa and entry | 8 | 491 | 5.5 | 21 |
    | Taxis (consistency only) | 8 | 89 | 3.5 | 16 |

  - **Target:** Bing clicks on the airport and visa pages together up 25% or more over the 8 weeks after the change (25 → 32 or more), compared on 31 Jan 2027 with the same 8-week window. Also watch `aff_click_welcome_pickups` and `inline:near/airport` clicks on the airport page.
- **Step 5, published 16 Nov (due 15 Dec).** The Expo stay page (EN and DE) is now built around an access table: each base, its side of the Sava, the Expo bus line that serves it, its station on the planned railway, and who it suits.
  - Each base has "Suits" and "Check before booking" notes, and the table carries a status note with sources and dates.
  - There are no journey times to the site. The Swissôtel has a labelled "opening Q1 2027" note.
  - **New bases:** Zemun and Savski venac/Waterfront, each with its own hotel card.
  - **Found while checking:**
    - EXPO 2027 d.o.o. announced direct EKSPO bus lines on 10 Oct 2026. EKSPO 2–5 were due from 1 Nov 2026, EKSPO 1 from the airport from 1 Apr 2027, and EKSPO 6–7 plus feeder lines from 1 May 2027.
    - The getting-there page (all four languages), the guide (EN and DE), getting around, stations and best time to visit still said no Expo buses were announced. All are updated.
    - None of the reporting confirms the November lines actually started, so every page says "announced, not yet confirmed running".
  - **Measure from now:** `aff_click_booking` on the stay page, by card (`pick:zemun/*` and `pick:savamala/*` are new), in the monthly scorecard.
- **Step 6, cancelled 16 Nov; replaced by a brief for the Grok bot** (`growth/BELGRADEBEST_FACEBOOK_BOT_BRIEF.md`).
  - The "278 sessions / 92 engaged per 28 days" baseline was mostly Meta's crawler (2000×2000) and in-app prefetch (412×915, 0 s).
  - Real Facebook readers: about 26 engaged visits in 90 days, with 0 affiliate clicks. The Page has 5 followers.
  - The bot keeps posting at no owner cost: 2 posts a week, linked to booking-relevant pages, with one UTM scheme.
  - 2000×2000 is now in the GA4 bot filter.
  - Judged in the scorecard by engaged sessions. Under 10 a month on 15 Jan 2027 means we stop paying it attention.
  - The 3 owner-hours go to Bing work instead.
- **Step 4 follow-on, shipped 17 Nov: the money page** (`/plan-your-trip/money`), using the hours freed from step 6. Same URL, judged with step 4 on 31 Jan 2027.
  - **Why this page:** it is the next Bing-visible evergreen page. Its top queries ask what currency Belgrade uses and whether euros are accepted. It stays free of affiliate links (strategy rule) and routes readers to the airport and stay pages.
  - **Baseline, 8 weeks to 16 Nov:** Bing 5 clicks, 238 impressions, average position 5.2 ("belgrade currency" at 8.0). GA4 organic landings from Bing, DuckDuckGo and Ecosia: 28 sessions, 11 engaged.
  - **Target:** 8 or more Bing clicks in the 8 weeks after the change.
  - **What changed:**
    - A quick-answer table, and the exchange rate (117.62 on 13 Nov), which the page never gave before.
    - The euro answer is now sourced to Article 34 of the foreign-exchange law.
    - A card-or-cash table by situation; ATM fees and the conversion trap.
    - The National Bank's ±1.25% euro band at exchange offices.
    - Airport cash for each transfer type; paying for a stay, with the 240 RSD tourist tax.
    - Leaving Serbia: the €10,000 declaration and the VAT refund (minimum 6,000 RSD per seller).
  - **Removed:** an unverified ATM cap and an Expo price-rise line that broke rule 7.
  - **Found while checking:** tipping was 10–15% on this page, 5–10% on the food and kafana pages, and "10%, or 10–15% in nicer places" on the stay pages. It now reads "about 10%, in cash" on all six.
- **Step 4 follow-on, shipped 17 Nov: the Expo hub** (`/expo-2027`). Same URL, judged with step 4 on 31 Jan 2027.
  - **Why this page:** it holds 39% of the site's Bing impressions but only 2.3% click through. "expo 2027" alone had 508 impressions and 7 clicks in 90 days. It is also the way into the Expo stay page, which gets almost no search traffic of its own (9 impressions).
  - **Baseline, 8 weeks to 16 Nov:** Bing 64 clicks, 2,797 impressions, click rate 2.3%, average position 5.4.
  - **Target:** click rate of 3.0% or more over the 8 weeks from 17 Nov.
  - **What changed:**
    - A title that leads with the dates. A snippet that answers first: where it is, ticket status, travel and stay. The count and ticket status fill in from data.
    - Eight quick answers moved under the countdown, including a Stay line linking to the Expo stay page.
    - Five visitor FAQs on the hub: when and where, tickets, getting there, where to stay, visa.
    - The "what is it" and programme pages, which also rank for "expo 2027", now link to the hub in their text.
  - **Found while checking:**
    - The hub still said "the final transport plan" was unannounced, three weeks after the EKSPO lines were announced.
    - It called the event "the first World Expo in the Western Balkans". The BIE ranks Specialised Expos separately from World Expos, and our own "what is it" page says "Specialised". Both are fixed.
- **Follow-on, shipped 17 Nov: three German travel pages** (`/de/plan-your-trip/airport-to-city`, `/de/plan-your-trip/visa-and-entry`, `/de/where-to-stay/where-to-stay-in-belgrade`). Judged on 31 Jan 2027.
  - **Why:** German-speaking readers are the most engaged audience on the site. The `/de/` set converts at 8% on Bing (site average 4.2%). Readers landing on German pages were opening the English airport, where-to-stay and money pages next.
  - **Not a full German site:** upkeep would double per edit, and German Bing demand outside Expo is thin.
  - **What they carry:**
    - **Airport page:** the Welcome Pickups link and hotels near the airport.
    - **Stay page:** six area hotel cards with German texts.
    - **Entry page:** no affiliate links. It now also gives the German Foreign Office's ID-card rule, added to the English page too.
    - **Sub-IDs:** `bb-de-atc-*` and `bb-de-wtsib-*`.
  - **How they're reached:** the German hub lists them under "Reise planen". The German Expo pages offer them in "Mehr auf Deutsch".
  - **Measure:** Bing impressions and clicks on the three URLs (from 0), and affiliate clicks from `/de/` pages.
- **17 Nov: entry pages corrected (V01.075).** The English and German visa-and-entry pages had presented the Serbian MFA's visa-application conditions (two blank pages, a passport issued within 10 years) as rules for everyone. They now give Serbia's own rule (a valid passport or ID card), the UK, German and Canadian advice, and the visa-applicant conditions labelled as such. Both pages also gained a short section on what else the border can ask for (€50 a day in funds). No affiliate links, by rule.
- **17 Nov: Daytrip accepted and placed** (13%, 14-day cookie, no brand search ads).
  - **Where:**
    - the day trips page: a private Novi Sad + Sremski Karlovci day trip;
    - the stations page: private transfers to Novi Sad and to Budapest.
  - **State:** the partner is OFF until its CJ click link is pasted in `/admin/affiliates` (cj.com did not resolve from this machine's DNS on 17 Nov).
  - **Stations page fact updated:** Belgrade–Budapest passenger trains are now announced for 13 December 2026 (Srbijavoz, 27 Oct).
  - **Measure:** `aff_click_daytrip` in the admin, CJ sub-IDs `bb-bdt-daytrip-*` and `bb-saot-daytrip-*`.
