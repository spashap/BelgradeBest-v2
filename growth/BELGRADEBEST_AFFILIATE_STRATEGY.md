# BelgradeBest — affiliate placement strategy

*16 November 2026. Covers Booking.com, Welcome Pickups, Air Serbia and, from 17 Nov, Daytrip (all via CJ).*

## TL;DR

- **Before this change, every Booking link sat on pages almost nobody reads.** The `/where-to-stay` articles had 10 views or fewer each in 90 days. The pages people actually read had no hotel link at all: the Expo hub (205 views), tickets (105), the airport page (104) and the Expo guide.
- **Three of the live Booking links were broken.** On Booking, "Dorćol" opened a single apartment, "Savamala" opened one apartment, and "New Belgrade" (the main Expo area) showed only 8 properties. These are fixed, and every target has been checked in a real browser.
- **Links now sit where the text recommends something.** There are three placement types:
  - an in-text link on a phrase that already makes the recommendation;
  - a small card of 2–4 named, verified hotels at the end of an area section;
  - the old end-of-page box, which now appears only when the text hasn't already offered that partner.
- **Every commission can now be traced to a page.** CJ sub-IDs used to say only which area was linked. They now name the page as well, and `/admin/affiliates` maps them back.
- **Placement no longer limits income; traffic does.** The next income gains come from sending readers to the stay pages and from the partners still waiting on CJ (tours, transfers, buses). Moving links around further won't add much.

## What changed

| Page group | Before | Now |
|---|---|---|
| Expo where-to-stay (EN + DE) | 1 area box at the bottom | 3 hotel cards: New Belgrade, the Expo/airport side and Stari Grad. 3 in-text links. A new fact about the Swissôtel EXPO (Q1 2027) and InterContinental openings. |
| Expo guide, tickets, getting-there, location (EN + DE) | Nothing, or a box at the bottom | 1–3 in-text links on the sentences that tell the reader to book (beds first, flights, transfer) |
| Airport, taxis, best time to visit | A box at the bottom | 1 in-text link each, on the existing "pre-book a transfer" or "book early" phrase |
| 8 where-to-stay articles | 1 box with 3–5 area searches | A card for each recommended area, placed in that section (2–6 per page) |
| Expo hub | No path to the stay page | A "Stay" row in "Good to know" links to the Expo stay page (an internal link, not an affiliate one) |

**Totals:** 21 articles, 32 hotel cards and 22 in-text links. The cards draw on 27 named hotels.

### Second pass (same day): Air Serbia, Welcome Pickups, pavilions

- **Air Serbia has a fares page for each country**, at `/en-<cc>/flights-to-belgrade`. CJ passes deep links to these pages; the Czech and UK pages were tested. That allows country-specific links:
  - **15 pavilion profiles** get a "Flights" tile pointing to Air Serbia's page for that pavilion's own country, labelled as an affiliate link. The German profiles link the German page. Slovakia has no Bratislava flight, so its tile says so and points to Vienna, matching the Slovak getting-there page.
  - Seven countries have no Air Serbia market page and get no tile: Azerbaijan, Israel, Japan, Saudi Arabia, South Korea, Turkmenistan and the UAE. Serbia gets none either.
  - The map is in `partner-links.json → airSerbiaPavilions`.
- **The Czech getting-there page** links to Air Serbia's Czech page. **The Slovak page** links to the Austrian one, because Vienna is the nearest departure.
- **Welcome Pickups has no deep link.** All 16 of its CJ links land on the same generic homepage, and a `url=` parameter is ignored (tested 2026-11-16). Placement is the only lever. The link now sits on the "pre-booked transfer" sentence on every getting-there page (EN, DE, SK, CS), on the airport page and on the taxis page.
- **"Early flight" bullets** on the stay hub and the business stay page now link to hotels near the airport.
- **Pavilion directory and profiles:** a "Where to stay" tile now appears first, with a sharper line ("Beds, not tickets, are the bottleneck…"). That sends Expo-curious readers to the stay page with the hotel cards.
- **Fix:** the profiles' tickets tile said two start dates had passed. It now says three, matching the tickets page.

Pavilion flight sub-IDs are `bb-[lang-]<pavilion initials>-flights` (e.g. `bb-us-flights`, `bb-de-g-flights`).

**Deliberately left without links:**
- visa and entry, money, safety and SIM pages, because a link there reads as paid advice;
- every restaurant and bar page, because we have no partner and it would look paid;
- ticket sentences, because the page tells readers to buy only through official channels.

## The rules (keep them)

1. **A link goes only where the reader would act next.** The sentence must already recommend booking, an area or a service. If no such phrase exists, leave the spot empty.
2. **No more than 3 in-text links per article.** Where-to-stay articles are the exception: they get one card for each recommended area.
3. **Never in the lede, never in legal or safety text, never on a restaurant, bar, ticket seller or anything we only describe.**
4. **Label every commercial link "Ad" where it appears** (revised 16 Nov after the Codex review, following UK ASA and FTC guidance).
   - Every in-text affiliate link is followed by a small **Ad** tag.
   - Every card, box and flight tile opens with **Ad** and a one-line commission note *before* its links, not in a footer.
   - The date line explains the label ("We earn a commission when you book through links marked 'Ad'").
   - Translated: *Anzeige* (DE), *Reklama* (SK/CS).
   - `/how-we-make-money` explains the label and how hotels are chosen.
   - `rel="sponsored"` is for search engines and does not count as disclosure to readers.
7. **Never state what we can't support.** That rules out scarcity ("will go first", "beds are the bottleneck"), commute promises, and urgency. Booking advice is conditional: book refundably once your dates are firm, and check the cancellation deadline, deposit and prepayment. Our own pages say the room and visitor figures do not predict a shortage, so no page may contradict that.
5. **A hotel must earn its spot.** It has to be in the area the paragraph names and score about 8.5 or more on Booking.com across hundreds of reviews. It must also be confirmed open and bookable, with the check date stored in its `verified` field. The tiers are spread from budget to luxury.
6. **No partner URL lives in the article text.** Articles carry only references (`aff:`), which are resolved at build time. A partner switched off in `/admin/affiliates` turns links back into plain text and removes the cards, so no rewrite is needed.

## How to edit (for Claude or by hand)

- In-text link: `[phrase](aff:hotel/<key>)`, `aff:area/<key>`, `aff:near/<key>` or `aff:go/<partner-target>`.
- Card: put `[Places to stay](aff:pick/<key>)` alone on its own line, at the end of the section.
- Hotels, cards and places are defined in `src/data/hotel-picks.json`. Area searches are in `stay-affiliates.json` and travel partners in `partner-links.json`.
- A mistyped key fails the build, so a broken reference can't go live.
- **Check every new Booking search in a browser before adding it.** Booking reads free text loosely: "New Belgrade, Belgrade" returned 8 properties while "Novi Beograd" returned 488.

## Partner terms (read in CJ on 16 Nov 2026)

| Partner | Pays | Counts if the reader buys within | Paid when | Rules that bind us |
|---|---|---|---|---|
| Booking.com (CEE programme) | 4% of the booking | **1 day of the click** | Only after the stay happens. A cancelled booking pays nothing. | No paid ads that use Booking or hotel names, no iframes, no coupon or voucher claims |
| Welcome Pickups | 7% of the transfer | 45 days | When the ride takes place | No links on sites we don't own (forums, Facebook groups) without the owner's consent; only CJ-supplied material (plain text links are fine); no brand-name ads |
| Air Serbia | 1% of the ticket | 45 days | On a confirmed sale | No Google Ads, no misleading claims, only authorised material |
| Daytrip (accepted 17 Nov, from Daytrip's welcome email) | 13% of the trip | 14 days | Not stated in the email; check in CJ | No search ads on the Daytrip brand |

What this means:

- **Booking pays only for bookings made within a day of the click.** A reader who clicks today and books next week earns us nothing unless they come back through one of our links. So a Booking link pays only for readers whose dates are already firm. The stay pages have to be easy to find again, and the ticket on-sale day matters twice over: readers fix their dates that day and can book a bed the same day.
- **Expo commissions arrive after the stays,** so from mid-May 2027 onward. Booking also sends its figures to CJ in monthly batches (the last two were on 11 Oct and 9 Nov). Until summer 2027, judge results by clicks and by pending commissions in CJ, not by money paid out.
- **Per sale, Booking is the business.** A 3-night stay at €100 a night pays about €12, a €30 airport transfer about €2 and a €300 flight about €3. Conversion work stays on stays. The flight tiles stay as they are, with no more work on them.
- **Booking also pays 4% on airport taxis and attractions** bought on its site. We don't use that, because Welcome Pickups pays 7% and gives 45 days.
- **Facebook stays organic.** Booking's terms rule out paid ads tied to its brand or to hotel names. Welcome Pickups links can't go into groups or forums we don't own.
- **Which country's rate applies is not yet clear.** The Booking programme's three commission rates are labelled for Slovak, Czech and Polish loyalty partners. CJ's conversion data for the programme includes US and other customers, so it doesn't look limited to those countries. The first commission will show which rate our bookings get.

## Measuring it

- **Clicks:** the GA4 event `aff_click_<partner>`. Its `placement` value is `inline:area/new-belgrade`, `pick:expo/kame` and so on. Cards also send `aff_view`, which gives a click rate. Both appear in `/admin/affiliates`.
- **Money:** the CJ sub-ID is `bb-[lang-]<page initials>-<item>`. For example, `bb-wtsfe-p-hyatt` is the Hyatt card on where-to-stay-for-expo. `/admin/affiliates → Money` names the page.
- **The one number:** sessions with at least one accommodation-affiliate click per 28 days, excluding bots and our own test clicks. 14 December 2026 sets the baseline and 1 February 2027 is the first comparison. Click rate is a diagnostic; revenue is the eventual measure.
- **Do not remove cards on a timer.** At a real 5% click rate, 20 views still give zero clicks 36% of the time. Judge a card only once it has enough views. Booking pays after the stay, so commissions lag clicks by weeks or months.
- **Tracking was checked end to end on 16 Nov 2026.** A click on the Hyatt card on the Expo stay page reached GA4 within a minute (`aff_click_booking`, placement `pick:new-belgrade/hyatt`). It went through CJ to Booking.com with our link ID, and Booking showed the Hyatt first.
- **CJ shows clicks per link per day, about a day late, and never by sub-ID.** Sub-IDs appear only on commissions (`shopperId` in CJ's API, which `/admin/affiliates` reads). So a sub-ID can only be confirmed once the first commission comes in.
- **Leave out our own clicks.** These are the 6 CJ clicks on 15 Nov (link checks: Booking 4, Welcome Pickups 1, Air Serbia 1; GA4 had no reader clicks before 16 Nov). The test click at 09:51 UTC on 16 Nov is also ours (Booking, sub-ID `bb-wtsfe-p-hyatt`). Future tests open the page with `?bb_test=1` so GA4's page location marks them.
- The full plan, with dates and owner hours, is in `growth/BELGRADEBEST_AFFILIATE_PLAN_2026-11.md`.

## Honest expectation

The site has about 100–200 visitors on its best Expo pages per quarter. Even at a strong 3% click rate and a 3% booking rate on Booking's ~4%, that is a few euros a month today. These figures are illustrative, not measured. Booking's 1-day window lowers them further for readers who are still planning. This change removes the leaks so that each reader who reaches a stay page can book. It does not create readers.

## Next levers, ranked

1. **Send readers to the stay pages.** Done for the Expo set: the Expo hub links to the Expo stay page, every pavilion profile carries a "Where to stay" tile (16 Nov), and the Slovak and Czech tickets pages carry the hotel card plus an in-text stay link. The next candidates are the evergreen pages Bing already shows that have no route to a stay page yet, starting with things to do in Belgrade (236 Bing impressions in 90 days to 16 Nov, zero links to the where-to-stay leg).
2. **CJ applications.** The Network Profile is complete (checked 19 Nov: CJ's "complete your Network Profile" note is hidden on every advertiser), so nothing blocks applying. Spots are already mapped for these partners:
   - **GetYourGuide:** Iron Gates and Oplenac day tours, the Novi Sad + Fruška Gora tour, the Brutalism tour, wine tastings, stadium tours. Application pending since 16 Nov, as are Qatar Airways and Trip.com;
   - **Daytrip: accepted 17 Nov and placed, owner postponed activation** (see below);
   - **12GO: not applied, and not worth it now.** It pays 50% of 12GO's own margin, not of the fare (its example: $5 on a $100 ticket), so a €30 Belgrade–Budapest bus earns about €1.50, and Serbia is outside its listed serviceable area.

   **Daytrip placements (17 Nov, OFF until its CJ click link is pasted in `/admin/affiliates`):**
   - **Day trips page:** "Daytrip's Novi Sad and Sremski Karlovci day trip" (`aff:go/daytrip-karlovci`), in the paragraph that says the three-stop day is awkward by public transport;
   - **Stations page:** a private transfer to Novi Sad (`daytrip-novi-sad`) and to Budapest (`daytrip-budapest`), the latter until the Budapest passenger trains run (announced for 13 Dec 2026).

   **Per sale:** Daytrip lists prices per person (Budapest from about US$87, Novi Sad from US$22, the Karlovci day trip from €40; checked 17 Nov). At 13%, a Budapest transfer for two pays roughly €20, more than a typical hotel stay. Its 14-day window also beats Booking's 1 day.

   **Check once CJ is reachable:**
   - Copy Daytrip's click link from CJ (Links → Daytrip) into the admin and switch it on.
   - Test one link: does CJ honour `?url=` deep links for Daytrip? If not, every link lands on Daytrip's home page, like Welcome Pickups.

   Each is one line in `partner-links.json` plus an `aff:go/…` link in the article.
3. **Swissôtel Belgrade EXPO** (inside the Expo complex, opening Q1 2027): add it to the Expo card as soon as Booking takes bookings for it.
4. **Re-check every named hotel in March 2027,** before the Expo booking peak. Use the `verified` dates in `hotel-picks.json`.
