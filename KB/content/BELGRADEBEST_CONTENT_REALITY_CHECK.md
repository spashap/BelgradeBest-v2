# BelgradeBest content reality check — 15 November 2026

**TL;DR:** 51 articles + the Expo tracker/contract data were fact-checked against current sources by 7 checker agents; 26 serious findings went to an independent skeptic, **23 were confirmed and are fixed** (English + German + Slovak twins), 3 were rejected. 15 pages are solid, 39 need work, 6 were stale. The pattern: **dated "as of" claims that the calendar overtook** (tickets, events, fees), not invented facts.

## Fixed (23 confirmed)

| Area | What was wrong | Now |
|---|---|---|
| Expo tickets (EN/DE/SK) | Framed 1 Nov Slovak package date as upcoming; "as of 17 Sep" | Re-dated 15 Nov; 1 Nov passed with no public package or price; official site still "available soon" |
| Expo guide / what-is-it / programme (EN/DE) | Ticket + calendar status dated Aug/Sep | Re-dated mid-Nov (still unpublished) |
| Expo getting-there + guide (EN/DE/SK) | Railway timing vague | Oct 2026: works done by end 2026, opening March/April 2027 (minister, not timetable) |
| Visitor numbers (5 EN pages, 4 DE, 1 SK, tracker) | "BIE now states more than 6 million" — no BIE source | Official figure "more than 4 million"; 6 million = organisers' upper target |
| Contracts ledger | Missing NOVASTON lease-management award (RSD 1.56bn, 8 Jul 2026) | Added |
| Car rental | Parking zones/hours pre-July-2025 (Sunday "free") | Purple/red/white zones; Sat 07–22, Sun 07–14 charged |
| Airport-to-city | A1 "roughly hourly" contradicted Expo page | Every 15–30 min daytime, both pages agree |
| SIM & connectivity | EU roaming "by around 2028" | Talks authorised June 2026, no date for Serbia |
| Staying safe | "No advisory change"; protests absent | New protests section |
| Fortress (4 pages) | "Open 24/7 / ramparts at any hour" | Upper Town gates close ~00:30–04:30 since June 2026 |
| Arenas | UFC 1 Aug 2026 as "next event"; Final Four undecided; no concerts | Evergreen "where to find the calendar"; Final Four 2027 = Abu Dhabi |
| Day trips | Novi Sad train 400–500 RSD | ~550 Regio / ~680 Soko (since July 2026) |
| Restaurants / wine bars | Legat 1903 (reported closing), The Square (renovation), Homa renamed | Removed / renamed |
| Restaurants, cocktail bars | **Truncated text** (Enso paragraph, cocktail itinerary) | Restored from git (21 Jun version) |
| Splavovi | Clean-up "last raft Oct 2025" | Autumn 2023 start, last raft Aug 2024 |
| Where-to-stay (2 pages) | Tourist tax 160 RSD | 240 RSD since 15 Oct 2026 |

**Process note:** two articles were still truncated despite the September repair and build gate — the gate does not catch a sentence that stops mid-way ("**Enso** is"). Worth adding a check for paragraphs ending without punctuation.

## Not fixed — lower severity or unverified (owner/next pass)

- expo-2027/guide.md: unverifiable — Say "about 140 participants (countries and international organisations) per the organiser, 30 June 2026". Cite the 141 figure only if the August source can be linked. App
- expo-2027/guide.md: wrong — Remove the causal claim that the US "pushed it to 139 in May 2026" and give the sequence 137 early 2026 / 138 March 2026 / 139–140 June 2026 with sources.
- expo-2027/where-to-stay-for-expo.md: contradiction — Use "about 13.5 km (official figure; some sources round to 15 km)" in where-to-stay-for-expo.md. Reconcile the hotel and new-hotel counts with one sourced figure, or give
- expo-2027/programme.md: contradiction — After re-checking the official programme page, use one verification date across all six pages and their twins.
- src/data/expo-participants.json: outdated — Update officialCount.note and sources[0].note to say the official counter now reads '140+' (checked 15 Nov 2026) and remove the 'unreachable' wording. Add a timeline row 
- src/data/listings/expo-2027/russia.json: contradiction — Say 'signed 24-25 December 2025' or use the organiser's date (25 Dec) and cite the organiser's article.
- src/data/listings/expo-2027/slovakia.json: contradiction — Change status to 'announced' (the same value used for Germany and Austria, whose tenders are also decided). Apply the same check to turkiye.json: its tender closed 17 Aug
- src/data/listings/expo-2027/germany.json: unverifiable — Reword to 'was scheduled for around 15 October 2026; the organiser says all pavilions will be handed over by 1 December 2026'. Update it when the handover is confirmed.
- plan-your-trip/getting-around.md: wrong — Say the turnkey contract was signed in December 2025 and the project entered its design phase in 2026.
- plan-your-trip/airport-to-city.md: contradiction — Use one range across pages (e.g. about 2,300-3,000 RSD to central zones) and point to the airport's posted zone table.
- plan-your-trip/stations-and-onward-travel.md: outdated — Add: international service targeted for December 2026, no confirmed date; re-check Srbijavoz/MAV before travel.
- plan-your-trip/airport-to-city.md: unverifiable — Verify against the GSP/bgprevoz.rs line list or remove the 607 bullet.
- plan-your-trip/airport-to-city.md: unverifiable — Keep 400 RSD with an 'about' qualifier; optionally confirm with the A1 operator or GSP.
- plan-your-trip/sim-and-connectivity.md: unverifiable — Remove or source the 2028 date.
- plan-your-trip/visa-and-entry.md: unverifiable — Keep the 90-days-after-departure rule (confirmed) and either source the 10-year and two-blank-pages conditions from the Serbian MFA or soften them.
- plan-your-trip/visa-and-entry.md: missing — Add one line: ETIAS is expected to start for Schengen entry in late 2026 (check the EU site for the date); still irrelevant for Serbia itself.
- plan-your-trip/visa-and-entry.md: unverifiable — Cite the MFA or portal page for the Digital Travel Authorisation claim, or soften it.
- plan-your-trip/sim-and-connectivity.md: unverifiable — No change needed beyond optionally linking the official Yettel page.
- visit-belgrade/belgrade-museums.md: unverifiable — Remove the first-Wednesday claim from the museums page (body, FAQ and 'at a glance') and from brutalist-belgrade.md unless the owner can cite a source. Add that the Salon
- visit-belgrade/belgrade-museums.md: missing — Add one line: 'A move to a new building has been announced but no date is fixed; it remains at Krunska 51 for now. Check tesla-museum.org.'
- visit-belgrade/understanding-belgrade.md: missing — Add a line to the Waterfront passage, and a sentence in things-to-do or neighbourhoods: 'Belgrade 360 Deck, an observation deck at the top of Kula Belgrade, opened April 
- food-and-nightlife/best-restaurants-in-belgrade.md: wrong — Write 'Langouste has held a Michelin star since the 2025 edition and kept it in the 2026 selection'.
- food-and-nightlife/best-restaurants-in-belgrade.md: missing — Name all three 2026 Bib Gourmands and note that Restaurant 27 is currently closed.
- food-and-nightlife/belgrade-splavovi.md: unverifiable — Soften to 'relocation sites have varied and some stretches (Danube quays, the Fair area) are next in line for clearance', or cite a source.
- food-and-nightlife/belgrade-splavovi.md: missing — Add one line: 'Freestyler runs a Winterstage in Beton Hala October-April.'
- food-and-nightlife/belgrade-nightlife.md: contradiction — Add the clean-up caveat and link to the splavovi page in the Savamala sections of belgrade-nightlife.md and belgrade-food-and-drink-by-neighborhood.md, or reword to 'Sava
- food-and-nightlife/belgrade-craft-beer.md: unverifiable — Phone or check samopivo.rs. If closed, replace the anchor with Krafter, Dogma or Gvint. If open, keep it.
- food-and-nightlife/belgrade-food-and-drink-by-neighborhood.md: contradiction — Merge each duplicated district into one section and delete the trailing repeated blocks.
- food-and-nightlife/eating-and-drinking-in-belgrade.md: missing — Replace with: 'Serbia has no full indoor smoking ban in bars and restaurants; owners can designate smoking venues and a stricter law has been proposed for years. Many kaf
- where-to-stay/where-to-stay-in-belgrade-with-family.md: unverifiable — Re-check the child tiers against the October 2026 City Assembly decision, or add the new adult rate of 240 RSD for context.
## Rejected by the skeptic (left as is)

- Tracker timeline "missing 1 Oct" — already covered by the 30 Sep entry.
- EXIT festival location — the finder's premise was itself outdated.
- Veggessence "closed" — only a 2022 crowd-sourced flag; other listings show it open.
