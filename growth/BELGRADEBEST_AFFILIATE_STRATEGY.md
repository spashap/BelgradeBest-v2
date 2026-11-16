# BelgradeBest — affiliate placement strategy

*16 November 2026. Covers Booking.com, Welcome Pickups and Air Serbia (all via CJ).*

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

**Deliberately left without links:**
- visa and entry, money, safety and SIM pages, because a link there reads as paid advice;
- every restaurant and bar page, because we have no partner and it would look paid;
- ticket sentences, because the page tells readers to buy only through official channels.

## The rules (keep them)

1. **A link goes only where the reader would act next.** The sentence must already recommend booking, an area or a service. If no such phrase exists, leave the spot empty.
2. **No more than 3 in-text links per article.** Where-to-stay articles are the exception: they get one card for each recommended area.
3. **Never in the lede, never in legal or safety text, never on a restaurant, bar, ticket seller or anything we only describe.**
4. **Disclose up front.** Any page with in-text links says so in the date line under the title, linking `/how-we-make-money`. That page now explains how hotels are chosen.
5. **A hotel must earn its spot.** It has to be in the area the paragraph names and score about 8.5 or more on Booking.com across hundreds of reviews. It must also be confirmed open and bookable, with the check date stored in its `verified` field. The tiers are spread from budget to luxury.
6. **No partner URL lives in the article text.** Articles carry only references (`aff:`), which are resolved at build time. A partner switched off in `/admin/affiliates` turns links back into plain text and removes the cards, so no rewrite is needed.

## How to edit (for Claude or by hand)

- In-text link: `[phrase](aff:hotel/<key>)`, `aff:area/<key>`, `aff:near/<key>` or `aff:go/<partner-target>`.
- Card: put `[Places to stay](aff:pick/<key>)` alone on its own line, at the end of the section.
- Hotels, cards and places are defined in `src/data/hotel-picks.json`. Area searches are in `stay-affiliates.json` and travel partners in `partner-links.json`.
- A mistyped key fails the build, so a broken reference can't go live.
- **Check every new Booking search in a browser before adding it.** Booking reads free text loosely: "New Belgrade, Belgrade" returned 8 properties while "Novi Beograd" returned 488.

## Measuring it

- **Clicks:** the GA4 event `aff_click_<partner>`. Its `placement` value is `inline:area/new-belgrade`, `pick:expo/kame` and so on. Cards also send `aff_view`, which gives a click rate. Both appear in `/admin/affiliates`.
- **Money:** the CJ sub-ID is `bb-[lang-]<page initials>-<item>`. For example, `bb-wtsfe-p-hyatt` is the Hyatt card on where-to-stay-for-expo. `/admin/affiliates → Money` names the page.
- **First read: 14 December 2026** (28 days). Booking pays after the stay, so expect clicks well before commissions.
  - A card with views but no clicks after 28 days: swap its hotels or remove it.
  - An in-text link with clicks but no money: keep it, because commissions lag the stay.

## Honest expectation

The site has about 100–200 visitors on its best Expo pages per quarter. Even at a strong 3% click rate and a 3% booking rate on Booking's ~4%, that is a few euros a month today. These figures are illustrative, not measured. This change removes the leaks so that each reader who reaches a stay page can book. It does not create readers.

## Next levers, ranked

1. **Send readers to the stay pages.** The Expo hub now links to the Expo stay page. Next candidates:
   - a "staying for the Expo?" line on pavilion profiles;
   - translating the where-to-stay cards into the Slovak and Czech pilots, whose readers come for Expo tickets and travel.
2. **Unblock the CJ applications (owner action: complete the CJ Network Profile).** Spots are already mapped for these partners:
   - **GetYourGuide:** Iron Gates and Oplenac day tours, the Novi Sad + Fruška Gora tour, the Brutalism tour, wine tastings, stadium tours;
   - **Daytrip:** Novi Sad and Budapest transfers;
   - **12GO:** Belgrade–Budapest, Novi Sad and Niš buses.

   Each is one line in `partner-links.json` plus an `aff:go/…` link in the article.
3. **Swissôtel Belgrade EXPO** (inside the Expo complex, opening Q1 2027): add it to the Expo card as soon as Booking takes bookings for it.
4. **Re-check every named hotel in March 2027,** before the Expo booking peak. Use the `verified` dates in `hotel-picks.json`.
