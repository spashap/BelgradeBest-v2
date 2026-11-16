# Ticket on-sale kit: short strings (English)

Fill the same `{{BLANKS}}` as the page template. Each string says where it goes. Scenario B is "on sale now"; scenario A is "prices or a date announced, not yet on sale".

## Hub row (`src/pages/expo-2027/index.astro`, the "Tickets" row in "Good to know")

- B: `On sale since {{SALE_DATE}}: one-day {{P_1DAY}}, three-day {{P_3DAY}}. Buy only through the official site`
- A: `Sales open {{SALE_DATE}}: one-day {{P_1DAY}}, three-day {{P_3DAY}}. Not yet on sale anywhere`

## Hub "still unknown" line (same file, the ticket line in the unknowns list)

- B: `Ticket concessions, a season pass, refund rules and time slots (one-day and three-day prices were published on {{SALE_DATE}})`. Delete any part the organiser has since published.
- A: `Ticket concessions, a season pass, refund rules and time slots (sales open {{SALE_DATE}})`

## Hub FAQ "Are Expo 2027 tickets on sale?" (German, Slovak and Czech hubs have this FAQ)

- B: `Yes. Sales opened on {{SALE_DATE}}, {{CHANNELS_SHORT}}. A one-day ticket costs {{P_1DAY}} and a three-day ticket {{P_3DAY}}. Buy only through channels the official site names.`
- A: `Not yet, but the date is set. The organiser announced that sales open on {{SALE_DATE}}, {{CHANNELS_SHORT}}, with one-day tickets at {{P_1DAY}} and three-day tickets at {{P_3DAY}}.`

## Pavilion profile tile (`src/layouts/ListingPage.astro` English; `src/lib/i18n.ts` German `tickets.body`)

- B: `On sale since {{SALE_DATE}}: the prices, where to buy officially, and what to check before you pay.`
- A: `Sales open {{SALE_DATE}}: the announced prices and where the official sale will happen.`

## German Expo-guide line (`src/lib/i18n.ts`, `ticketsText`, German only)

- B: `seit {{SALE_DATE}} im Verkauf – Preise und offizielle Verkaufsstellen im`
- A: `Verkaufsstart am {{SALE_DATE}} – angekündigte Preise im`

## Facebook post (Page only, organic; English)

Post the day the tickets page is live. One post; no hashtags beyond one; no Booking or hotel names (Booking's terms rule out paid or targeted promotion tied to its brand or hotel names, and we keep posts organic anyway).

B:

> Expo 2027 tickets are on sale. Since {{SALE_DATE}}, the organiser sells them {{CHANNELS_SHORT}}: {{P_1DAY}} for one day, {{P_3DAY}} for three days.
>
> Buy only where the official site sends you. Several unofficial sites have been quoting "prices" for months.
>
> Our page lists every official price, the conditions to check before you pay, and what is still unknown:
> https://belgradebest.com/expo-2027/tickets?utm_source=facebook&utm_medium=social&utm_campaign=tickets-onsale

A:

> Expo 2027 tickets now have a date and prices. The organiser says sales open on {{SALE_DATE}}, {{CHANNELS_SHORT}}: {{P_1DAY}} for one day, {{P_3DAY}} for three days.
>
> Until then, nobody can sell you an official ticket. What is confirmed so far:
> https://belgradebest.com/expo-2027/tickets?utm_source=facebook&utm_medium=social&utm_campaign=tickets-announced

A second post, two or three days later, can point to the stay page for readers who have now fixed their dates:

> Fixed your Expo 2027 days? Our where-to-stay guide compares New Belgrade, the airport side and the old town, with named hotels in each and what each base suits:
> https://belgradebest.com/expo-2027/where-to-stay-for-expo?utm_source=facebook&utm_medium=social&utm_campaign=tickets-stay
