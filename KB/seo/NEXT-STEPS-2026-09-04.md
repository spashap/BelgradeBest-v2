# Next steps — decided after the 2026-09-04 efficiency check

Companion to `EFFICIENCY-REPORT-2026-09-04.md`. The owner raised three candidate
moves (automated pavilion email, more languages, affiliate links). This file
records the assessment of each, the reprioritised plan, and the numbers to check
at the next checkpoint (~05 Oct 2026).

## The diagnosis that drives the order

Root cause of "no attention": **0 backlinks → Google position ~45 → Google is not a
channel yet**. Bing/DuckDuckGo/Copilot are already a channel (56 of 60 organic
sessions) because they do not apply the authority discount. Therefore every move
is ranked by one question: *does it create links, mentions or a list?* Traffic and
revenue follow from those; nothing else moves Google.

Second observation: **demand exists but is narrow** — Expo tickets (Italian and
German queries already ranking), "<country> pavilion expo 2027", and practical
arrival pages (airport, visa, money). Building for that demand beats broadening.

## Assessment of the three proposals

### 1. Automated first email to pavilion contacts — YES, but as a link engine, not a traffic engine

- Reality: 12 contact emails exist, mostly generic government inboxes
  (esteri.it, state.gov, ticaret.gov.tr). Fully automating the send is one
  afternoon of work; it is not what is missing. **The list is what is missing.**
- Reframe: each claim = a badge/GBP link = a real backlink. 200 contacts → ~10–20
  replies → 3–8 claims → the first 3–8 backlinks the site has ever had. That is
  the entire value.
- Build (after RESEND_API_KEY + domain DNS — owner action, blocked since July):
  1. `/api/admin/outreach-run` (or a Vercel cron): pick listings with
     `contact.email`, `outreach.status = none`, parent published; render the
     existing draft (`lib/admin/outreach-draft.ts`); send via Resend from
     admin@belgradebest.com with an opt-out line; set `status: sent, sentAt`;
     commit. Cap 20/day.
  2. Follow-up #2 at +7 days if `status` is still `sent` (one bump, then stop).
  3. Reply detection stays manual (Resend has no inbound); mark `replied` in the
     category screen. Resend webhooks record opened/clicked into `outreach`.
  4. Personalisation hook per contact type: contractors/agencies get "your
     pavilion work is documented on <parentUrl> — claim it"; sponsors get the
     "featured on" badge; governments get the language angle (see §2).
- List building (Perplexity run, cheap): contractors + agencies + sponsors +
  Chambers/commissariats for the 141 participants. Target 150–200 named
  inboxes, not info@. Run the blind award sweep first (memory:
  expo-awards-are-the-prospect-vein).

### 2. More languages — NOT site-wide; ONE language on the Expo cluster as a pilot

- Against site-wide: translating 64 articles × N languages multiplies pages
  that carry the same zero authority; Google will rank the German copy exactly
  where it ranks the English one. Cost is high, effect on the root cause is nil.
- For a narrow pilot: Bing already ranks "expo 2027 belgrade biglietti" pos 2
  and "expo belgrad ticket price" pos 4 on *English* pages; GA4 shows DE/AT
  7+5 sessions, JP 12, IL 14. A native-language page will rank better on Bing
  immediately and it doubles as the outreach hook for that country's pavilion
  team and contractors ("we built the German-language guide to your pavilion").
- Pilot scope: **German** (Germany pavilion is the best-performing listing on
  both Bing and GA4; DE + AT + CH = three pavilions, Messe Düsseldorf, AHK,
  WKO contacts already in the list). Pages: expo-2027 hub, tickets, guide,
  getting-there, pavilions hub, pavilions/germany, /austria, /switzerland
  (~8–10 pages) under `/de/…` with hreflang, in the existing layouts.
- Decide on 05 Oct: if the DE pages pull ≥ 100 Bing impressions in their first
  4 weeks, add Italian (tickets intent) and Turkish; otherwise stop.
- **DONE 2026-09-04 (same day):** 12 German pages live — hub, 6 articles,
  pavilions hub, Germany/Austria/Switzerland profiles — with hreflang both
  ways and Bing URL push. Mechanics in `CLAUDE.md → Language pilot`.

### 3. Affiliate links in articles — YES on three pages, low priority, no growth effect

- The plumbing exists (`StayLinks.astro` + `stay-affiliates.json`, all targets
  disabled). At ~150 real sessions/month revenue will be ~€0–5/month; this is
  monetisation hygiene, not growth. Do it because it is nearly free and it
  makes the how-we-make-money page true.
- Scope: airport-to-city (transfer + eSIM), where-to-stay hub +
  dorcol-vs-vracar (hotels), things-to-do (tours). One network signup covers
  all four verticals (Travelpayouts wraps Booking/Hotellook, GetYourGuide,
  Kiwitaxi, Airalo); Booking.com direct no longer accepts new partners.
- Do NOT sprinkle across all articles — affiliate-heavy thin travel content is
  exactly what Google's helpful-content classifier punishes.

## Two moves the owner did not list that rank higher

### A. Digital PR around the Expo data (the only unique asset)
The tracker (141 participants, every public contract award with amounts, ticket
print facts) is data nobody else compiles in English. Pitch it as a citable
source: Expo/exhibition trade press, Serbian English-language outlets, the
Wikipedia article on Expo 2027 (nofollow, but it drives crawl + AI citation),
Balkan travel bloggers. Perplexity builds the 30-outlet list with editor
emails; Sonnet drafts; the owner sends from the real mailbox. Expected: 3–10
editorial links in 60 days — worth more than everything else combined.

### B. "Tickets on sale" email capture (B2C list, zero risk)
Ticket intent is the one demand signal already ranking in three languages.
Add a "tell me when Expo 2027 tickets go on sale" form to `/expo-2027/tickets`
(and countdown), stored through the existing leads pattern into a Resend
Audience. On the on-sale day the site sends one email and owns the moment.
Cost: half a day. This is the first genuinely automatable email flow with
real demand behind it.

### Also, cheap and overdue
- Populate `brand.sameAs`: create the Facebook page (Facebook already sends
  29 sessions), LinkedIn company page, X — link them in JSON-LD. 30 minutes.
- Reddit: the question radar produces 10+ threads a week; two honest replies
  a week by the owner is the cheapest direct-traffic source available.
- Push every new URL to Bing (SubmitUrlBatch) the day it ships — Bing is the
  live channel.

## 90-day plan (owner minutes in brackets)

| When | What | Who |
|---|---|---|
| Week 1 | Resend account + DNS for admin@belgradebest.com [30 min]; Travelpayouts signup [20 min]; FB/LinkedIn/X pages → sameAs [30 min] | owner |
| Week 1–2 | Outreach send + 7-day follow-up + webhooks; ticket-alert capture; affiliates on 3 pages | Claude |
| **14–16 Sep** | **Expo ticket sales planned to open 15 Sep 2026** (found 04 Sep): update /tickets + /de twin the same day, push to Bing, run the tracker pitch cycle | Claude + owner |
| Week 2–3 | Perplexity: 150–200 named Expo contacts + 30 press outlets; Sonnet drafts; Fable review | pipeline |
| Week 3 | First sends: 20/day outreach; press pitch batch of 30 | owner clicks Send |
| ~~Week 4–6~~ done 04 Sep | German pilot on the Expo cluster (12 pages, hreflang); Bing push | Claude |
| Ongoing | 2 Reddit replies/week; Bing push per ship; blind award sweep monthly | owner / Claude |

## Numbers to check on ~05 Oct 2026

| Metric | 04 Sep | Target 05 Oct |
|---|---|---|
| Backlinks (Bing InLinks / referring domains) | 0 | ≥ 5 |
| Claims | 0 | ≥ 2 |
| Outreach sent / replied | 0 / 0 | 150 / ≥ 8 |
| Bing clicks per day | ~2 | ≥ 5 |
| Google indexed (sweep) | 66 of 145 | ≥ 80 |
| GA4 sessions / 28d (ex-bots) | ~140 | 300 |
| Ticket-alert subscribers | 0 | ≥ 30 |

---

## Session ledger — 2026-09-04 (end of session)

### Done and live (V01.017, deployed by Claude with owner authorisation)

- **Efficiency check** with live GSC / GA4 / Bing data → `EFFICIENCY-REPORT-2026-09-04.md`
  + raw Google index sweep `google-index-sweep-2026-09-04.json` (66/145 indexed).
- **Expo research run** (3 Sonnet agents + Fable verification) →
  `KB/platform/research/2026-09-04-sweep.md`; runbook watch list updated.
  - Ticket sales **planned 15 Sep 2026** applied to /tickets (+ German twin),
    hub, guide FAQ, pavilion visiting block — worded as planned, not confirmed.
  - Germany motto, Austria "Join the Flow" (+ team, status announced),
    Switzerland agency Jeff + commissioner, Italy call extended to 30 Oct.
  - 7 prospect stubs (Intereuropa, Arhi Nova, NEO Aerodromes, laundry
    consortium, Jeff, ZONE Media, PLANET architects). 21 published pavilion
    pages unchanged; no contact data leaked (grep-verified on dist).
- **German Expo cluster** — 12 pages at `/de/expo-2027/…` with hreflang both
  ways, German chrome, sitemap lastmod, Bing + IndexNow push. Mechanics in
  `CLAUDE.md → Language pilot`.
- **Widgets** — countdown `data-lang="de"`, accessible card roots on all four
  widgets; countdown page documents the options.
- Memory + this plan updated; research record written.

### Not done (carried forward)

| Item | Why not | Owner action needed? |
|---|---|---|
| Automated first outreach email + 7-day follow-up | Blocked on `RESEND_API_KEY` + DNS for admin@belgradebest.com | **Yes** — Resend account + DNS (~30 min) |
| Contact-list build (150–200 named Expo contacts) | Runbook says Perplexity run is the cheap path | Yes — run the runbook prompt, or say "use agents" |
| Digital-PR pitch of the tracker (30 outlets) | Needs the list + owner sends from the real mailbox | Yes — list via Perplexity, sending by owner |
| Ticket-alert email capture on /expo-2027/tickets | Needs Resend Audiences (same key) | Yes — same Resend key |
| Affiliates on 3 pages | Needs a Travelpayouts (or similar) account | Yes — signup (~20 min) |
| `brand.sameAs` (FB / LinkedIn / X pages) | Owner-created profiles | Yes |
| Italian / Turkish Expo pages | Decision gate 05 Oct on German Bing impressions | No — Claude, after the gate |
| Tracker participant count | No source moved it past 141 | No |
| Russia / UAE pavilion designers | Unverified claims, kept off the site | No — recheck next run |
| Reddit replies from the question radar | By hand, by design | Yes — 2/week |

### Dated triggers

- **14–16 Sep 2026** — ticket sales expected to open: update /tickets + /de twin the
  same day, hub facts line, ListingPage visiting block; push to Bing; run the
  tracker pitch cycle.
- **~17 Sep** — National Days stage tender award (precursor to the calendar).
- **~05 Oct** — SEO checkpoint vs the targets table above; German go/no-go.
- **30 Oct** — Italy sponsor call closes → sponsor roster = prospects.
- **1 Dec** — pavilion handover to countries → heavy prospect run.
