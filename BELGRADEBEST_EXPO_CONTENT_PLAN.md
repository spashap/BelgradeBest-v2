# BelgradeBest — Expo 2027 content plan

**Written 13 September 2026. Horizon: now → Expo opening, 15 May 2027.**
Goal, in the owner's words: *"I want the website to be a valuable source of info."*
Everything below is judged against that, not against traffic.

This plan was developed with three external review rounds (GPT-6 Astra via Codex,
acting as a web-marketing and content strategist). Its corrections are recorded
honestly below, including the ones that overturned our own assumptions — that record
is part of the plan's value.

---

## 1. Where we actually stand

### The demand we can see

Bing is the live search channel. Over the 28 days to 11 September 2026 it served
~1,340 impressions and 46 clicks, against Google's ~300 impressions and 2 clicks over
60 days. **84 of 92 GA4 organic sessions came from the Bing index** (bing, duckduckgo,
ecosia, yahoo). Google delivered four.

Within that, the pavilion pages punch above everything else — `/expo-2027/pavilions`
converts best on the site, and `/expo-2027/pavilions/germany` pulls real German-intent
traffic. That is a promising signal, **not** a proven conversion rate: six clicks on
sixteen impressions is a small sample and position-dependent.

### The competitive field, surveyed

`serbiaexpo.com` — "Independent Visitor & Business Guide" — runs the same
visitor-plus-business model we do, with an AI trip assistant and advertising. It covers
transport, accommodation strategy and districts reasonably (~1,100 words). It covers
**nothing** on tickets, queues, heat, packing or accessibility, and has **no pavilion
directory at all**. Others (xmetr, wego, srpske.rs) are one-off "everything you need to
know" posts.

**Conclusion: do not fight them on transport and accommodation. The concerns nobody
covers are the opening.**

### What past Expos say visitors actually worry about

Osaka 2025's pain was operational, not informational: a reservation system people could
not work, three-hour queues, cellular congestion so bad visitors could not load their own
QR ticket, an app that logged users out after five minutes, cashless-only payment, heat
(**732 doctor-diagnosed suspected heatstroke cases, 88 transported off-site** — the
official post-event figure), and a metro failure that stranded 30,000 people overnight.
Dubai 2020's answer was virtual queueing. Astana 2017 — the closest precedent, a
three-month Specialised Expo with 3,977,545 attendance — struggled with accommodation
and price inflation.

None of that is about what an Expo *is*. It is about whether your day works.

---

## 2. What the review overturned

Recorded because the corrections shaped the plan, and because a site that publishes its
own corrections is the kind of source we are trying to be.

| We believed | Actually |
|---|---|
| Zero competition, eight months early | `serbiaexpo.com` runs our exact model, plus others |
| Osaka: 28 heatstroke cases, one fatality | **732 suspected, 88 transported.** The fatality is unverified — do not publish it |
| 100+ sourced pavilion profiles | **19 pavilions** (79 listing files = 19 pavilions + 60 others, 56 of them child records) |
| No pavilion has FAQs | **All 19 do — 64 questions.** Our inventory script read the wrong key |
| The blocker is a missing data field | **The blocker is missing knowledge.** Storage was never the constraint |
| Two National Day dates | **One.** Türkiye 19 May 2027 (*planned*). UAE announced a National Day with no date |
| 141 participants → 141 National Days | No fixed denominator. The organiser says "140+ participants"; countries *can select* a day |
| Osaka published 131 dates "by the Expo" | 131 of 161 were public **~10 months before opening**, released in batches |

### Four factual defects, found and repaired 13 September 2026

`facts` rows were updated when news landed; hand-written prose and FAQs on the same
pages silently drifted.

- **Slovakia** — prose and FAQ said the winning design "isn't public yet"; facts already
  named EXPO LINE's "Living Playground" (announced 9 July 2026, €375,000 contract).
- **Türkiye** — prose and FAQ said size was unannounced; facts gave the 648 m² plot
  (27 × 24 m) on parcel A5.1, due ready 15 April 2027.
- **Austria** — prose and one FAQ said the EU-wide tender was "under way" while another
  FAQ named its 4 August 2026 winner. **In both languages.**
- **Switzerland** — described the pavilion as a walk-through mountain panorama
  "engineered by Werner Sobek AG with Danilo Dangubic Architects and VOGT". Those firms
  are engaged on the **wider Expo site** (Best Practice Zone timber pavilions, shading
  structure, landscape), not the Swiss national pavilion. A **wrong attribution**, not a
  stale one. Removed, re-sourced, and carrying a dated public correction note.

A fifth: `/expo-2027/programme` told readers "you cannot yet pick a date because your
country falls on it." Türkiye's 19 May makes that false. Corrected EN + DE.

**This class of error is systemic, not four incidents.** It will recur across 19 profiles
and 64 FAQs unless the structure changes — see §6.

---

## 3. Asset #1 — "Expo 2027 National Days: Dates Announced So Far"

**URL: `/expo-2027/national-days`.** Not `visit-belgrade` — a 2027 schedule does not
become evergreen by filing it in the evergreen leg. The Expo leg is already the bridge
into the city guide; contextual links do that job. After August 2027 it stays at the same
URL, relabelled as a historical calendar.

**Why this first:** a National Day date is the only fact on a pavilion profile that
changes *which day someone travels*. The organiser has not published the country-to-date
mapping — their linked calendar is "Playground Events". Each entry is sourced from a
*national* source, so we can build it before the organiser publishes.

### Page order

1. **The honest answer up front** — "We have documented one planned National Day date
   from a national authority. This list is incomplete."
2. **The dated entry** — Türkiye, 19 May 2027, *planned by the national ministry*, source
   publication date, our check date.
3. **Visitor implications**, only where supported. For Türkiye the notice does not
   establish times, venue or access.
4. **What a National Day is** — and that its date is *not* inferable from that country's
   domestic national holiday.
5. **Undated announcements** — UAE belongs here. It must not count as a dated entry.
6. **Next action** — official programme link, pavilion link, "send a date or correction"
   by email. No claim or login required.
7. **Change history and coverage statement.**

### Rules

- Türkiye's date is **planned**, not confirmed. The ministry notice says so.
- "We found one date" ≠ "only one has been announced." Describe our coverage, not the world's.
- An empty search says **"No date recorded in our list"** — never "Not announced."
- Chronological list. Search and filtering only when scrolling becomes inconvenient.
- Defer calendar subscriptions — another surface on which changed dates must stay intelligible.

### Cultural context — the owner's idea, kept selectively

Legitimate when it explains *this Expo celebration*: a documented anniversary link, an
announced performance, a tradition visitors will meet. **Not** a compulsory holiday
history for every country, and **not** a device to reach a word count — Google states
plainly it has no preferred length.

Türkiye earns two or three sentences: 19 May is Commemoration of Atatürk, Youth and
Sports Day, marking his 1919 landing at Samsun. For an Expo themed *Play for Humanity:
Sport and Music for All* the fit is worth remarking on. We may **not** claim it explains
the choice — at Osaka, the Netherlands took 21 May (King's Day is 27 April) and Sweden
14 May (National Day is 6 June). Countries do not systematically pick their domestic holiday.

Substantial country context belongs on that country's pavilion profile, not here.

**Launch budget: two operator hours.** If a standalone page exceeds that, publish it as a
section of `/expo-2027/programme` instead. A neglected tracker would undo the trust repair.

---

## 4. The visitor-profile template

Not a rewrite quota. Research five; rewrite those that qualify.

| # | Section | Content |
|---|---|---|
| 1 | **Why consider visiting** | The distinctive experience, labelled announced / planned / operational |
| 2 | **Plan your visit** | Dated events, actual location, public access or reservation info. Only consequential unknowns |
| 3 | **What you can see and do** | Concrete exhibits and activities, qualifications preserved |
| 4 | **What remains unresolved** | One short paragraph — not repeated down the page |
| 5 | **Who is behind it** | Commissioner, designers, concept background. Budgets only where they illuminate something |
| 6 | **Official information and related places** | Official visitor source first, then related listings with explicit locations |
| 7 | **Sources and review note** | Evidence, real check dates, material corrections |

**Moves down:** signing dates, signatories, contract values, tender chronology, funding
percentages, diplomatic background.

**Cut:** ceremonial quotations, repeated participation confirmations, generic
national-brand claims, FAQs that restate the page.

### Qualifying threshold

- At least **two independently useful pavilion-specific details**, one a concrete
  experience or activity.
- Evidence ties the experience to **the pavilion**, not merely to the country.
- Plans distinguished from operating arrangements.
- A credible onward source and a recorded editorial check.
- **No known internal contradiction.**

An unknown booking policy is useful context but is not positive substance. A slogan, a
commissioner's name and a contract value do not together establish a visitor experience.

**First candidate: Austria** — its Innovation Lab announcement is concrete.

Two things need small code changes, not just JSON: `ListingPage.astro` fixes section
order, and `links.website` exists but is not rendered. A prominent official link is worth
more than the current fact/FAQ counter.

---

## 5. Acquisition — the real bottleneck

The answers live in people, not on websites. **Lead with one publishable answer, not with
claiming a listing.** Asking a ministry to adopt a listing asks them to take on work;
asking one specific question does not. (All 79 listings currently show outreach status
`none`; none is claimed — so we have no response baseline.)

- **8 national offices**, each with one specific unanswered question. Türkiye: confirm the
  planned date. Austria: fresh announcement, existing route.
- **2 routing contacts** — organiser participant relations, plus a chamber or embassy that
  can forward.

**Pace:** ~3 enquiries a week; one follow-up after 7–10 business days; then park the
contact. Never two people in the same delegation at once.

**Expect 1–2 useful replies from 10 offices, and 0–1 new publishable date in month one.**
Zero is plausible. These are planning assumptions, not benchmarks.

Track **publishable answers per operator hour** — not replies, not claims.

**Fix the outreach copy first:** `src/data/outreach-templates.json` claims "Many
delegations use pages like this" (unsubstantiated) and promises same-day corrections.
Both should go.

The claim platform helps *later*, when a representative wants recurring control over
material they already maintain.

---

## 6. Stopping the drift

Manual review is unavoidable. *Duplicated* manual maintenance is not.

1. **Remove duplicative profile FAQs.** Keep a question only when it answers something
   additional.
2. **One authoritative record per repeated operational fact.** Start with National Day
   dates; generate both the page and the profile rows from it.
3. **No mutable facts in evergreen prose.** Dates, booking status and location live in the
   maintained practical section, linked from elsewhere.
4. **Pre-publish dependency check.** A changed date or design fact flags the summary,
   prose, remaining FAQs, translations and shared snippets that may depend on it.
5. **Keep source review human.** Automation can flag "not announced" sitting beside a named
   winner. It cannot tell whether a source describes the right pavilion — that is exactly
   what the Switzerland error was.

Note: `check-freshness.mjs` scans English articles only — not listing JSON, not German — on
a nine-month threshold. **It does not cover this work.**

---

## 7. Review cadence we can defend

| Period | Commitment |
|---|---|
| Now → March 2027 | One 60–90 minute weekly session |
| April → close | Two 30–45 minute sessions weekly, prioritising the next fortnight |
| Full profile reviews | 1–2 monthly, plus reviews triggered by substantive news |
| Missed review | Preserve the old check date and disclose the gap — **never advance it because the site rebuilt** |

Distinguish **"Edited"** (content changed) from **"Source checked"** (verification happened).
One check does not mean a whole profile was reviewed.

### Stop claiming

- Live, complete, or continuously verified
- Every announcement captured
- Same-day corrections, or updates "as soon as announced"
- "No date announced" when we merely have not found one
- That a representative's edit makes a whole page current
- That English and German reflect the same revision without checking both

---

## 8. First 30 days — 12 operator hours

| Days | Work | Done when |
|---|---|---|
| 1–5 | **Repair trust (2h)** — ✅ *done 13 Sep 2026* | Four contradictions resolved, German checked, no dates advanced on unreviewed content |
| 6–9 | **Publish National Days (2h)** | One qualified entry, incomplete coverage stated, correction route, linked from programme + Türkiye |
| 10–17 | **Acquisition pilot (3h)** — 8 offices + 2 routing contacts | Each has one specific question, a rationale, a follow-up date |
| 18–24 | **Follow up, assess five profiles (2h)** | Replies classified; candidates get a reasoned pass/fail |
| 25–30 | **Rewrite one qualifying profile (3h)** — Austria | Template demonstrated; time and results recorded |

**Continuation rule:** expand acquisition only if the pilot yields **≥2 useful editorial
responses, or 1 dependable recurring information route**, within roughly four hours of
acquisition work. If it does not: leave the small page up, stop building machinery, move
the next month's effort to the strongest remaining visitor-information gap.

---

## 9. Beyond month one

| When | Piece | Decision it serves |
|---|---|---|
| Now, maintained to opening | **Tickets: admission, reservations, what to check before buying** *(major update)* | Can I buy, which product, what does it secure? |
| Autumn 2026 | **Crowds and summer heat: what to expect before choosing your dates** | Which part of the event suits me? |
| Research now, publish autumn | **Accessibility: what is confirmed, what to check before booking** | Can the whole journey meet my needs? |
| Winter 2026–27 | **How many days do you need?** | Expo days plus hotel nights |
| Early 2027 | **Belgrade in summer: planning an Expo day** | How do I structure and prepare? |

### The crowds-and-heat boundary

**Defensible:** total visits, daily averages, source chronology, sensitivity to different
attendance levels.

| Scenario | Attendance | Avg daily / 93 days |
|---|---:|---:|
| 4M illustration | 4,000,000 | 43,011 |
| 4.1M (older forecast) | 4,100,000 | 44,086 |
| 6M illustration | 6,000,000 | 64,516 |
| **Astana, actual** | **3,977,545** | **42,769** |

**Conditional:** occupancy illustrations with explicitly hypothetical assumptions.

**Unsupported — do not publish:** actual m² per visitor, expected queue minutes,
guaranteed quiet weekdays, or "Belgrade will be worse than Osaka."

25 hectares is the **category's regulatory limit**, not evidence of undersizing — Astana
had the same. Drop the cross-Expo "m² per visitor" league table: Osaka's published area
includes water and greenery nobody queues on.

---

## 10. Cut list

`suitableFor` fields; blanket accessibility filtering; public completeness scores; new
entity markup; the standalone pavilion comparison matrix; calendar subscriptions;
standalone packing article; queue-hacks franchise; another "what to expect" hub;
speculative "best pavilions" rankings; any new general accommodation or district article.

Keep Article / Breadcrumb / ItemList structured data as-is. Do not encode unknowns as
`false`, invent hours, or turn "planned" into an unqualified operational claim.

**Matrix launch gate**, if we ever revisit it: at least 10 of 19 pavilions carrying two
substantive visitor answers, and two comparable columns with usable values for 10 of the
set. A complete matrix of missing information is an audit product, not a visitor product.

---

## 11. Open risks

- **Some answers may not exist yet.** Officials can know more than the public without
  having an approved date or access policy. Outreach cannot manufacture settled plans.
- **A National Day is a container.** Its date can be known while ceremony access,
  performances and reservations remain unresolved. Model those separately.
- **Coverage will be uneven.** Responsive, well-resourced delegations will dominate the
  list. Missing information must never imply weaker participation.
- **The official schedule will eventually appear** and erase the discovery advantage. Our
  longer-term value must become interpretation, attribution and visitor relevance.
- **Claiming creates editorial ambiguity.** Identity, representative-authored content and
  independently checked facts are three different claims. `validListing` currently accepts
  *less* content for claimed listings — a known, accepted trade-off, but modules must not
  ride on it.
- **Accessibility must not become a quality ranking.** Unknown access information means
  insufficient documentation, not an inaccessible pavilion.
