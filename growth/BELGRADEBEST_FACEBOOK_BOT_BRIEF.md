# BelgradeBest — Facebook: what the Grok bot does, and its new brief

*16 November 2026. This replaces step 6 of `growth/BELGRADEBEST_AFFILIATE_PLAN_2026-11.md` (the six-week Facebook test).*

## TL;DR

- **Facebook brings almost no readers.** The Page has 5 followers. In the last 90 days, about 26 real engaged visits came from Facebook, roughly 2 a week. None of them clicked an affiliate link.
- **The "278 Facebook sessions a month" in the plan were mostly Meta's own machines.** Two signatures account for nearly all of them:
  - a crawler reporting a 2000×2000 screen (no real screen has that size);
  - Facebook's in-app link prefetch at 412×915 with zero seconds on the page.

  Both come from Meta's US, Swedish and Irish data centres.
- **So the six-week test is cancelled.** It would cost 3 owner-hours to move a channel that cannot reach anyone with 5 followers.
- **The bot keeps posting, at zero owner cost, under a sharper brief.** The brief makes it post less, link to the pages that lead to bookings, and use one tracking scheme so we can read the results.
- **The 2000×2000 crawler is now filtered out of GA4** (`src/lib/bot-traffic.ts`), so Facebook numbers in the admin and the Growth API are honest from now on.

## What the bot does now

From GA4's tracking tags and the public Page:

- It posts link previews to our articles, about 3 a week. It has linked about 40 different pages in 90 days, from kafanas and brutalism to Expo news.
- Its tracking tags are inconsistent: `expo_tickets` and `expo-2027-tickets`, `coffee-culture` and `coffee_culture`. That splits one page's results across several names.
- Its latest post (16 Nov) was an Expo "six months to go" post linking the programme page.

**Real engaged visits from Facebook, by month:**

| Month | Visits | Engaged |
|---|---|---|
| Aug | 9 | 3 |
| Sep | 66 | 9 |
| Oct | 51 | 10 |
| Nov, to the 15th | 6 | 4 |

The landing pages that held real readers were the tickets page, getting around, the Expo hub and "is Belgrade worth visiting".

**Why so little:** a Page with 5 followers shows its posts to almost nobody, and Facebook generally gives posts that link off-site less reach than others. No posting schedule fixes that. Only followers, groups or paid boosts would. All three are poor fits:

- **Followers** grow slowly without effort we don't want to spend.
- **Group posting by a bot** risks a ban, as happened on Reddit. Welcome Pickups' terms also forbid its links in groups we don't own.
- **Paid boosts** tied to Booking or hotel names are against Booking's terms, and the money would not come back at our booking rates.

## The brief to paste into the bot

```
You run the BelgradeBest Facebook Page. Goal: send travellers who are planning a
Belgrade trip to the page that helps them book, without ever sounding like an ad.

CADENCE: 2 posts a week. Fewer, better posts beat daily posts.

WHAT TO POST (rotate):
1. Expo 2027 news with a confirmed fact (dates, tickets, transport, pavilions) →
   link the matching Expo page. When the news is about tickets or transport, the
   follow-up post a few days later links /expo-2027/where-to-stay-for-expo.
2. One practical arrival or stay answer (airport to the city and how to pay, visa
   and the 24-hour registration, which area to stay in) → link
   /plan-your-trip/airport-to-city, /plan-your-trip/visa-and-entry,
   /where-to-stay or a /where-to-stay/... page.
Other topics (food, nightlife, sights) at most once a fortnight.

RULES:
- Link only belgradebest.com pages. Never post affiliate, Booking.com or hotel
  booking links, and never name Booking.com or a hotel in a post.
- Post only on the BelgradeBest Page. No groups, no comments on other pages.
- Label facts the way the site does: confirmed / reported / not yet announced.
  No urgency ("book now", "selling out"), no prices we have not published.
- Every link carries exactly this tracking, with the page's last path segment as
  the campaign:
  ?utm_source=facebook&utm_medium=social&utm_campaign=<slug>
  e.g. https://belgradebest.com/plan-your-trip/airport-to-city?utm_source=facebook&utm_medium=social&utm_campaign=airport-to-city
  Lowercase, hyphens, never underscores.
- Write like the site: plain, short, specific. One fact per post, then the link.
```

## How we judge it

- **The measure is engaged Facebook sessions per month**, from the admin or GA4, with bots stripped. Plain sessions don't count, because Meta's 412×915 prefetch inflates them with zero-second visits.
- **Monthly scorecard (step 7):** one line for Facebook, giving engaged sessions and any `aff_click_*` from Facebook visitors.
- **15 January 2027:** if Facebook is still under 10 engaged sessions a month, we stop spending any attention on it. The bot may keep posting for the Page's presence, since the Page backs the site's Organization schema `sameAs`.

## Owner check

The Page's public contact email is **admin@out25.com**. The site's contact page was switched to the brand address, admin@belgradebest.com, on 16 Nov. Switch the Page contact to match in the Page settings; only the owner can do that.
