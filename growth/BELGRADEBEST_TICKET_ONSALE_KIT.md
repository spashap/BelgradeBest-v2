# BelgradeBest — Expo 2027 ticket on-sale kit

*16 November 2026. Step 3 of `growth/BELGRADEBEST_AFFILIATE_PLAN_2026-11.md`. Prepared now so that on the day the organiser announces prices or opens sales, every page that mentions tickets is right within 24 hours.*

## TL;DR

- **Tickets are still not on sale.** The official programme page still said "Tickets available soon" on 16 Nov 2026.
- **The kit holds ready replacement pages** for the tickets page in English, German, Slovak and Czech, plus the hub rows, pavilion tiles and Facebook posts. On the day, we fill in the blanks (date, prices, channels) and confirm or replace each default sentence about conditions.
- **On-sale day is also a booking moment.** Readers fix their Expo days when they buy tickets. Booking.com credits only bookings made within a day of the click. So the new page links to the stay page right after "where to buy", together with one labelled in-text link and the labelled Expo hotel card. There is no affiliate link on the ticket purchase itself.
- **The build now refuses a page with an unfilled blank.** Any `{{BLANK}}` or `⟦CHECK⟧` left in `src/content` fails the build.
- **Budget on the day: about 3 hours.** Live within 24 hours of verification; judged 28 days after sales open.

## What's in the kit

| File | What it is |
|---|---|
| `growth/ticket-kit/tickets.en.md` (+ `.de`, `.sk`, `.cs`) | The full replacement tickets page, frontmatter included. Blanks are `{{LIKE_THIS}}`; default sentences to confirm or replace start with `⟦CHECK⟧`. A "SCENARIO A" block at the end covers "prices or a date announced, not yet on sale". |
| `growth/ticket-kit/strings.en.md` (+ `.de`, `.sk`, `.cs`) | Hub rows, hub FAQ answers, the pavilion tile, the German guide line and the Facebook posts |
| `growth/ticket-kit/bing-urls.txt` | The 14 URLs to resubmit to Bing after the change |
| This document | How to tell it's real, the order of work, every other page to change, how to measure |

## How we'll know it's real

**Counts:**
- The official programme page (`https://www.expobelgrade2027.org/en/experience/programme`) replaces "Tickets available soon" with prices or a sales link, or the official site gets a ticket page.
- An announcement by Expo 2027 d.o.o. or the Government of Serbia, carried by Tanjug, RTS or the main Serbian outlets, *and* reflected on the official site within a day or two.
- A sales channel the official site names: its own shop, a box-office list, or a named agency or platform.

**Does not count on its own:**
- Third-party "guide" sites quoting prices. Several have published estimates, such as 2,400 dinars for one day; none was ever official.
- Articles saying sales "started". One Slovak magazine wrote in September that sales began on 15 September at about €25, which never happened.
- A minister's or tender's date without a sales page. Two such dates have already slipped.

**Watch, weekly until it happens:** the programme page, Serbian business media (biznis.rs, Tanjug), Slovak travel-trade news for the agency packages, and the public procurement portal for a ticketing-platform contract.

**Also watch the apartment prize draw.** In July 2026 the government set up a working group for a draw of apartments in the Expo complex, open to holders of officially bought tickets who register them in a mobile app (021.rs, 24 Jul 2026). Its app may launch together with sales; the templates already mention it.

## Scenario A or B

- **A: prices or a sales date announced, not yet on sale.** Use the page template with the SCENARIO A replacements: title, description, lede, the first FAQ and the first section. The Prices heading becomes "Announced prices". Use the A strings for the hubs and tiles. When sales then open, switch to B.
- **B: on sale.** Use the template as it is.

## On the day, in this order

1. **Verify (15 min).** Open the official page. Save a screenshot and the URL with the date, and write down prices exactly as published (with currency), the channels, and any published conditions: refunds, validity dates, names, time slots, concessions.
2. **English tickets page (45 min).**
   - Copy `growth/ticket-kit/tickets.en.md` over `src/content/articles/expo-2027/tickets.md`.
   - Fill every `{{BLANK}}`, using dates written like "1 December 2026" and `{{ISO_DATE}}` as `2026-12-01`.
   - For each `⟦CHECK⟧`, either keep the default sentence and delete the marker, or replace the sentence with the published rule.
   - Delete lines under "What is still not announced" that are now answered, and delete the SCENARIO A comment.
   - Prices: give the official figure first. If it is in dinars, add a euro figure only as "about €X", converted at that day's rate.
3. **German, Slovak and Czech pages (60 min).** Do the same with `tickets.de.md`, `tickets.sk.md` and `tickets.cs.md`, in each language's date and number format. The twin rule applies: all four go in the same commit.
4. **Hubs and tiles (20 min).** Use `strings.<lang>.md`:
   - English hub: the three ticket constants at the top of `index.astro` (`TICKETS_SNIPPET`, which also feeds the search snippet; `TICKETS_GTK`; `TICKETS_FAQ`) and the ticket line in the unknowns list.
     - `TICKETS_SNIPPET` is deliberately empty until then. "Not on sale yet" in the search snippet cut the hub's clicks twice (October and November 2026).
     - On launch day, fill it with the on-sale line so the snippet carries the news.
   - German, Slovak and Czech hubs: the Tickets row and the "can I buy tickets?" FAQ.
   - Pavilion tile: `ListingPage.astro` (English) and `i18n.ts` → `listing … tickets.body` (German).
   - The German guide line: `i18n.ts` → `ticketsText`.
5. **Other pages that state the ticket status (30–45 min).** See the table below. Change the German twin of each English page in the same commit.
6. **Checks (15 min).**
   - Run `grep -rn "available soon\|not on sale\|nicht im Verkauf\|demnächst verfügbar\|nie sú v predaji\|nejsou v prodeji" src`. Anything left must be a deliberate historical mention.
   - Run `node scripts/update-content-baseline.mjs`. The new tickets pages are shorter than the old ones, so the shrinkage gate would otherwise stop the build, and re-baselining is the deliberate act.
   - Run `npm run build`; the placeholder guard fails it if a blank is left.
   - In `dist/client/expo-2027/tickets/index.html`, check the title, the lede, the price table and the Ad tags on the stay link and card.
   - Article `faqs` are not rendered or emitted as JSON-LD (see the note in `ArticleLayout.astro`); they are source material only, so keep them consistent but don't count on them for search. The hub FAQs *are* shown.
7. **Log and ship (10 min).** Add a `growth/growth_changes.jsonl` entry (category `content`, every changed URL in `affected_area`), write `scripts/commit-message.txt`, and push.
8. **Bing (5 min).** Run `node scripts/submit-to-bing.mjs --urls=growth/ticket-kit/bing-urls.txt` from PowerShell. IndexNow does not reach Bing.
9. **Facebook (10 min).** Post the B (or A) post from `strings.en.md`, with the stay-page post two or three days later.
10. **Raise the ticket-affiliate question with the owner.** Who sells the tickets, and does that platform have a referral programme? The owner's 15 Nov decision stands: do not contact the organiser or ticket platforms without the owner's go.

## Other pages that state the ticket status

Find them on the day with the grep in step 6. As of 16 Nov 2026 they are:

| Page (English file; German twin where it exists) | What it says now | What it says on the day (B) |
|---|---|---|
| `expo-2027/guide.md` (+ de), FAQ "what to book first" | "tickets cannot be booked yet (the official site still says "available soon")" | "Book your Expo tickets through the official channel; they have been on sale since {{SALE_DATE}}." |
| `guide.md` (+ de), "Sort out accommodation first" paragraph | "unlike tickets, which are not on sale yet, it can be booked now on refundable rates" | "tickets have been on sale since {{SALE_DATE}}, and once your days are fixed a room can be booked on refundable rates" |
| `guide.md`, tickets section ("As of 15 November 2026, the official Programme page says…") | Two dates passed, nothing published | "Tickets have been on sale since {{SALE_DATE}}, {{CHANNELS_SHORT}}: {{P_1DAY}} for one day and {{P_3DAY}} for three days. Prices, conditions and what is still unknown are on our [tickets page](/expo-2027/tickets). Buy only through channels the official site names." |
| `guide.md`, "accommodation is worth sorting first" line | "unlike tickets (not on sale), it can be booked now" | "it can be booked refundably as soon as your dates are firm" |
| `programme.md` (+ de): two FAQ answers and two body lines | "still shows "Tickets available soon"" | Swap that clause for "tickets have been on sale since {{SALE_DATE}} (see our [tickets page](/expo-2027/tickets))" and keep the rest of each sentence, which is about the missing daily calendar |
| `what-is-it.md` (+ de), FAQ "Can you buy tickets yet?" | "Not yet…" | "Yes. Tickets have been on sale since {{SALE_DATE}}, {{CHANNELS_SHORT}}: {{P_1DAY}} for one day, {{P_3DAY}} for three days. Details on our tickets page." |
| `what-is-it.md` (+ de), body paragraph on tickets | "notes "Tickets available soon"…" | The same two sentences as the guide's tickets section |
| `what-is-it.md`, "who should wait" list | "want to budget precisely, since ticket prices and sales channels are not yet published" | Delete the bullet |
| English hub `pages/expo-2027/index.astro` | `TICKETS_SNIPPET` (search snippet), `TICKETS_GTK` (quick answer), `TICKETS_FAQ` and the unknowns line | `strings.en.md` |
| German, Slovak and Czech hubs | Tickets row and FAQ | `strings.de/sk/cs.md` |
| Pavilion profiles, English and German | "Still not on sale…" tile | `strings.en.md`, `strings.de.md` |

## Measuring it (judged 28 days after sales open)

- **It worked if** the pages were live within 24 hours of verification, and Bing clicks on the four tickets pages rose against the 28 days before.
- **Hand-offs to money pages:** views of `/expo-2027/where-to-stay-for-expo` with the tickets page as referrer (GA4 `pageReferrer`), and `aff_click_booking` on the tickets pages (placements `inline:near/belgrade-flex` and `pick:expo/*`).
- Booking credits only same-day bookings, so watch the clicks in the first week after sales open, and the pending commissions in CJ after that.

## What we deliberately don't do

- **No affiliate link on the ticket itself.** No programme exists, and the official channel is the only recommendation we make.
- **No urgency.** No "sell out" or "buy before…" unless the organiser publishes limits, and then only quoted with the source.
- **No price we haven't seen on the official site or a channel it names.**
