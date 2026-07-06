# Prospect Research Runbook — finding & seeding new businesses

**Trigger:** the owner says anything like "check for new businesses", "update the
prospects", "populate the pavilions", "refresh the pipeline", "run an update
check". This file is the complete procedure — follow it start to finish.

**North star reminder** (see `PLATFORM-PLAN.md` + memory `platform-north-star`):
the target is the **booth** — individual businesses (~10k at full Expo scale).
Gatekeeper agencies matter because they hold the exhibitor lists. Categories
(pavilions) are containers. Never design a run around government pages.

Last full run: **2026-07-05** (32 prospects: 16 gatekeepers + 15 event-level
companies + 1 container category; 9 verified public emails).
Last external run: **2026-07-06** — owner-run Perplexity Deep Research
(processed record: `research/2026-07-06-perplexity-prospects.md`; +7 prospects
incl. the UAE Commissioner General, +Turkmenistan category). External research
is a valid input channel: give the owner the runbook-based prompt, then VERIFY
spot-checks before seeding (2 of 3 A-claims held; 1 source page had vanished).

---

## 1. What a run produces

New/updated files only — no manual DB anywhere:

| Output | Where |
|---|---|
| Prospect stubs (unpublished) | `src/data/listings/expo-2027/<slug>.json` — `parent` = pavilion/category slug, `type` = `agency` / `contractor` / `supplier` / `sponsor` / `booth` |
| New containers when needed | top-level listing stub (`type: "pavilion"` or `"category"`; event-level companies go under `partners-and-suppliers`) |
| Pavilion page enrichments | new sourced facts into existing pavilion JSONs (+ bump their `updated`) |
| Tracker refresh (if counts moved) | `src/data/expo-participants.json` (+ bump `updated`) |
| Commit message | `scripts/commit-message.txt` (always, verbatim-committed by the bat) |

## 2. Prospect taxonomy (what to hunt)

1. **Gatekeepers (`agency`)** — ministries/trade agencies/commissioner offices
   running a pavilion. One-per-pavilion goal: every profiled pavilion should
   have its gatekeeper row with a contact route. They are the path to booths.
2. **Contractors/suppliers (`contractor` / `supplier`)** — design studios,
   builders, operators, PR/catering firms awarded Expo work. Found via tenders
   and awards. They claim pages AND they talk to everyone else on site.
3. **Sponsors (`sponsor`)** — tiered partners of the Expo or of one pavilion.
4. **Booths (`booth`)** — actual exhibitors. Scarce until exhibitor lists
   publish (expected late 2026 → 2027); when a list lands, switch to bulk mode
   (see §7 use case C).

## 3. Sources (proven on the 2026-07-05 run + candidates)

**Official / primary (check every run):**
- `expobelgrade2027.org` — `/en/news` (confirmations, sponsor announcements),
  `/en/participants` (counter + named countries), `/en/play-with-us`
  (partnerships; published `komercijalizacija@expobelgrade2027.org`),
  `/en/contact` (`info@expobelgrade2027.org`). Country participants register
  via `ipportal.rs`.
- BIE — `bie-paris.org/site/en/2027-belgrade` + news (403s direct fetch; use
  search snippets).
- Wikipedia `Expo_2027` — participants table w/ confirmation dates.

**Per-country pavilion programs (bookmark-grade URLs found so far):**
- Japan: `jetro.go.jp/en/news/releases/` (pavilion releases), METI press.
- Germany: `evergabe-online.de` (federal tenders; id 793340 was the pavilion),
  Messe Düsseldorf newsroom (implementation winner).
- Italy: `esteri.it` notices + `ambbelgrado.esteri.it`
  (`economico.belgrado@esteri.it`; sponsorship call ran to 31 Aug 2026).
- Austria: `bmwet.gv.at/Themen/International/EXPO/Expo-2027-Belgrad.html`
  (`EXPO@bmwet.gv.at`), `expoaustria.at` (`office@expoaustria.at`).
- USA: `usapavilion.us` (`expo@state.gov` + sponsorship contacts), state.gov
  releases.
- Türkiye: `ticaret.gov.tr/duyurular/` (`expo2027@ticaret.gov.tr`; proposal
  call ran to 17 Aug 2026).
- Switzerland: `eda.admin.ch` Expo page (blocks fetch — search snippets),
  `wernersobek.com/projects/expo-2027-belgrade/` (design team).
- China: `ccpit.org` (Exhibition Management Dept).
- Russia: minpromtorg.gov.ru, minobrnauki.gov.ru (`ipu.ru` carried the call).

**Tenders & awards (contractor goldmine):**
- `evergabe-online.de` (DE), `javne-nabavke.rs` (RS public procurement),
  TED / `ted.europa.eu` (EU-wide, e.g. Austria's two-stage), national portals.

**Serbian business press (awards + sponsors surface here first):**
- eKapija (`ekapija.com/en`), Nova Ekonomija, biznis.rs, Tanjug `/expo-2027/`,
  Serbian Monitor, Vreme.

**Company self-announcements** — search `"expo 2027" belgrade` site-wide and in
news; suppliers brag (the NUSSLI pattern: their own project page announced
on-site presence + `expo@nussli.com`; same for SVORA's landing page).

**Additions from the 2026-07-06 external run:**
- Country MFA mission pages name commissioners — pattern:
  `mofa.gov.ae/en/missions/belgrade` gave the UAE Commissioner General.
- `expobelgrade2027.org/en/experience/partners` + `/docs/List-of-Benefits-and-Sponsor-Categories.pdf` — sponsor tiers (names appear here eventually).
- `business.com.tm` — Turkmenistan tender notices.
- `architizer.com` — project credits (ALEATEK/PowerChina on the Serbia
  pavilion) — **treat as C, corroborate officially before outreach/publishing**.
- Bilateral chambers (AHK Serbien, CEBAC members) run Expo-focused business
  events — gatekeepers to foreign SMEs.

## 4. Hard rules (best practices — non-negotiable)

1. **Every entry carries a source URL** a human can open. No source → no entry.
2. **Never invent or guess emails.** Only emails published on the entity's own
   official pages. Record caveats in `outreach.notes` (e.g. "PRESS contact
   only", "media inquiries only", "third-party collector").
3. **Dedupe before seeding** — the seeder must skip existing slugs (check
   `src/data/listings/<leg>/`); re-runs are append-only.
4. **Stubs stay unpublished** — never add fake summary/about to force a stub
   past the thin-content guard. Public pages get content only from real
   sourced research or a claim.
5. **Contact/outreach fields never render publicly** — after seeding, grep the
   built `dist/client` for a few seeded emails/domains to prove no leakage.
6. **No Google Maps scraping** (ToS). OSM/Overpass is the geo source for
   future legs.
7. **Quality over volume**: 10 sourced entries beat 50 guesses (agents are
   told this verbatim).

## 5. The procedure

1. **Read current state**: list `src/data/listings/expo-2027/`, note which
   pavilions lack a gatekeeper, check `expo-participants.json` `updated`, and
   re-read the **watch list** (§6) for items that have come due.
2. **Launch 2 background research agents in parallel** (prompts in §8):
   - Agent A: companies (sponsors/contractors/corporate-area/exhibitors)
   - Agent B: gatekeepers + exhibitor calls for pavilions missing coverage
   (For a big run add Agent C: one per major pavilion's exhibitor list.)
3. **While they run**: prep or reuse the seeder pattern — a one-shot
   `seed-*.mjs` in the session scratchpad (NOT in `scripts/`; it's disposable)
   that writes stub JSONs with: `slug/leg/type/parent/name`, empty `summary`,
   `blocks: {}`, `links.website`, `contact` (only verified), `outreach.status
   "none"` + `notes` = role + caveats + source. Category containers created
   the same way (`partners-and-suppliers` exists for event-level companies).
4. **Seed** from agent JSON. Assign parents: country-tied → that pavilion's
   slug; event-level → `partners-and-suppliers`; missing container → create it.
5. **Feed back into public pages**: if research surfaced new pavilion facts
   (awards, designs, themes), add sourced facts/paragraphs to the pavilion
   JSONs and bump their `updated`. Update tracker data if the official counter
   moved.
6. **Verify** (all four, every time):
   - all listing JSONs parse (`node -e` loop);
   - `npm run build` clean;
   - published page count unchanged unless intended (stubs stay dark);
   - leakage grep on `dist/client` for seeded emails/domains.
7. **Document**: update the "Last full run" line + watch list in THIS file,
   rewrite `scripts/commit-message.txt`, summarize actionable finds to the
   owner (especially anything with a deadline).

## 6. Watch list (update every run — last updated 2026-07-06)

- **Italy** sponsorship call closes **31 Aug 2026** (tiers Bronze €5–25k →
  Platinum €100k+; PEC amb.belgrado@cert.esteri.it) → after close, find who
  sponsored (each sponsor = booth-grade prospect under Italy).
- **Türkiye** proposal call closes **17 Aug 2026** → find the awarded organizer.
- **Turkmenistan** pavilion design+construction tender closed 13 Apr 2026 →
  winner not yet public.
- **Germany**: Messe Düsseldorf sub-procurements (communication, catering,
  shop) on evergabe-online.de — not public yet / may need portal access.
- **Serbia pavilion**: Architizer (C) names PowerChina Serbia as GC and ALEATEK
  Studio as architect (~13,544 m² net, under construction) → corroborate via
  official source, then enrich the Serbia pavilion page + upgrade prospects.
- **Best Practice & Corporate Area**: ~45 corporate pavilions, occupants
  unannounced (only World Expo Museum named). **PKS is the recruiting partner**
  for this zone (institutional agreement) — the corporate-area booth gatekeeper.
- **UAE**: Commissioner General FOUND (Amb. Ahmed Hatem Almenhali, MOFA) —
  still watch for the implementing operator (`uaepavilion.ae` still Osaka-era).
  **Russia**: operator unnamed. **Saudi**: no program page yet.
- **Sponsor tiers**: only Telekom Srbija + Air Serbia (Platinum) named; the
  partners page shows categories only — watch for names.
- **Exhibitor lists**: none published yet anywhere. When one lands → bulk mode.
- **National Day schedule**: unpublished; when it lands, update pavilions +
  the participants article.

## 7. Use cases

- **A. Periodic refresh** (monthly now; biweekly from ~Q4 2026): full §5 run.
- **B. New pavilion profiled** → immediately find its gatekeeper (Agent B
  pattern, single country) so the container never sits contactless.
- **C. Exhibitor list published** → bulk mode: fetch/parse the list, generate
  booth stubs via seeder (or build the CSV importer — planned, not yet built),
  assign `parent` = that pavilion, `type: "booth"`. Emails only if the list
  publishes them.
- **D. Inbound lead arrived** (`src/data/leads/`) → verify the business exists
  (its website/GBP), create the booth in its category via admin or seeder,
  advance stage to `replied`, delete the lead file.
- **E. Other legs** (food-and-nightlife first, Phase 4): sources shift to our
  own articles (warmest: "we featured you"), OSM/Overpass, official registries
  (APR). Same taxonomy: categories = venue groupings, booths = venues.

## 8. Agent prompt templates (proven 2026-07-05 — adapt dates/scope)

**Agent A — companies:**
> Research COMPANIES and ORGANIZATIONS (not countries) publicly connected to
> Expo 2027 Belgrade, as of {DATE}. These become outreach prospects, so
> accuracy + a source URL per entry is mandatory. Find: (1) official
> partners/sponsors, (2) Best Practice & Corporate Area participants,
> (3) companies tied to specific national pavilions (contractors, designers,
> operators), (4) Serbian companies in Expo coverage (eKapija, Tanjug…).
> Return raw JSON only: {name, country, role: sponsor|corporate-pavilion|
> exhibitor|contractor|supplier, pavilion|null, website|null, publicEmail
> (ONLY if published on their own official pages, else null), note, source}.
> 10 solid sourced entries beat 50 guesses. Do NOT invent emails.

**Agent B — gatekeepers:**
> For Expo 2027 Belgrade, research the IMPLEMENTING/COORDINATING ORGANIZATIONS
> behind these national pavilions: {LIST — pavilions lacking a gatekeeper}.
> These agencies recruit the businesses inside their pavilion. For each: the
> org officially running the pavilion; a PUBLIC contact route (program page
> URL + official published email or null); any published call for
> exhibitors/sponsors (URL). Return raw JSON: {pavilion, name, role, website,
> publicEmail|null, exhibitorCall|null, note, source}. Do NOT invent emails.

## 9. Anti-patterns (things that already almost went wrong)

- Emailing a booth prospect a link to its own page — **it's 404 until
  claimed**; booth/child templates must pitch `{parentUrl}` (handled by
  `lib/admin/outreach-draft.ts` fallback — don't bypass it).
- Treating a PR/media email as a partnership contact — record the caveat.
- Confusing lookalike programs: `german-pavilion.com` = trade-fair program,
  NOT the World Expo pavilion; `uaepavilion.ae` still = Osaka.
- Counting on `bie-paris.org` direct fetch (403) or `eda.admin.ch` (blocks
  bots) — use search snippets and say so in the source note.
