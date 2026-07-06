# BelgradeBest → Claimable-Listings Platform — Master Plan (rev. 2026-07-05 b)

Owner vision: convert BelgradeBest from a travel guide written by the owner into a
platform where Belgrade businesses (Expo pavilions/exhibitors first, then per-leg
businesses) claim and **self-manage** a free page — "we are their free website" —
with outreach, claim flow, and badge/backlink mechanics managed from `/admin`.

**⭐ NORTH STAR (owner, 2026-07-05 — design everything around this):** the atomic
unit is the **BOOTH** — the individual business inside a pavilion (~10,000
prospects), NOT the pavilion. Pavilions (and future leg groupings) are just
categories/containers; governments claiming pavilion pages becomes plausible only
after ~10 claimed booths per pavilion prove value. The admin is a **prospect
database** (drill-down: Legs → categories → booth table; add prospects in-admin;
per-booth email pipeline). Booth stubs stay unpublished until claimed, so booth
outreach emails pitch the PARENT page (`{parentUrl}`), never the booth's own URL.

Rev-b changes (owner notes 2026-07-05): **self-serve editing without owner
validation** (trust-first + disclaimer + safety net), email = `admin@belgradebest.com`
+ Resend/Brevo as env placeholders (owner wires them on Vercel later), **no
Supabase — Vercel serverless + GitHub store only**, and the badge/tools package
becomes the flagship ("shiny point") with non-tech integration guides.

Architecture stays inside the locked constraints: static public site, JSON data
masters, serverless only for the management surfaces. **Constraint amendment
required (flag in CLAUDE.md when built):** the business portal `/manage` +
`/api/manage/*` join `/admin` + `/api/admin/*` as the only server-rendered
routes. Public pages stay prerendered.

---

## Storage verdict: no Supabase (and when that changes)

GitHub-as-database (the existing `lib/admin/store.ts` pattern) covers v1 fully:

- **Content + state:** per-listing JSON files (`src/data/listings/<leg>/<slug>.json`)
  — one file per business avoids concurrent-write conflicts and keeps commits small.
- **Auth:** magic-link tokens (no accounts, no passwords) — token **hashes** stored
  in the listing file; raw token only ever lives in the emailed link.
- **Versioning/audit/revert:** every edit is a git commit → full history, diffable,
  one-click revert from admin. A DB gives none of this for free.
- **Publish:** commit → Vercel rebuild → live in ~1–2 min. The portal shows
  "your changes go live in ~2 minutes" (this delay is the one UX quirk we accept).
- **Images:** browser resizes/compresses client-side (canvas → webp, capped
  ~1600px/500KB) before upload; serverless validates type+size and commits to
  `public/images/listings/<slug>/`. No image pipeline on the server.

Revisit a real DB (Supabase / Vercel Postgres/KV) only if we later need: instant
edits without rebuild, business password accounts, stored booking/lead inquiries,
or high edit volume. Keep the seam clean: all persistence behind one
`lib/platform/store.ts` module so a swap stays contained.

## Self-serve engine (the core)

**Claim → edit → live, zero owner clicks in the loop:**

1. Outreach email carries a unique claim link `/manage?token=…`.
2. `/manage` (server-rendered, token-auth, noindex, out of sitemap): prefilled
   edit form — text blocks, hours, links, menu/services per leg type, image
   upload, badge/QR/tools tab. Plain text + limited markdown only; HTML stripped
   server-side.
3. Save → `/api/manage/save` validates token (hash, constant-time) + field
   limits → commits the listing JSON (+ images) → rebuild → live. Page renders
   the **"Information provided by the business"** disclaimer block automatically
   once claimed.
4. Lost link → "resend my link" form: enter email → if it matches the listing's
   contact, a fresh magic link is sent (token rotated). No passwords ever.

**Safety net instead of pre-moderation** (trust-first, owner-recoverable):
- Server-side validation: length caps, no HTML/scripts, image sniffing, upload caps.
- Owner **notification email on every edit** (via Resend) with a diff summary.
- Admin **Listings page**: recent edits feed, per-listing history, one-click
  revert (git revert of that commit), token revoke/rotate, unclaim.
- Rate limits on `/api/manage/*`; failed-token lockout.

## Email (env placeholders now, owner wires later)

Two channels (unchanged): cold outreach from the real mailbox
`admin@belgradebest.com`; transactional via **Resend** (recommended; Brevo
fallback) — claim links, edit notifications, "page is live", monthly stats digest.

Env contract (all optional — every code path no-ops gracefully when unset):
```
RESEND_API_KEY          # or BREVO_API_KEY — transactional sender
EMAIL_FROM              # admin@belgradebest.com (needs DNS-verified domain in Resend)
OWNER_NOTIFY_EMAIL      # where edit notifications go (default: EMAIL_FROM)
```
Dev/no-key fallback: instead of sending, the admin Outreach page **displays the
magic link** to copy-paste manually — the whole flow is testable before any
account exists.

## Business toolkit — the flagship

Principle: **all complexity on our side; minimal clicks on theirs.** Every tool
lives on one "Your tools" tab in `/manage` with copy buttons and downloads.

- **Verified badge embed**: plain `<a><img>` snippet (hosted SVG/PNG — no JS, so
  it works on any platform and we can update the artwork centrally). Copy button.
- **QR code**: auto-generated per listing (PNG + SVG download) — table stickers,
  flyers, menus.
- **Menu / services URL** (`…/menu`): printable, linkable, fits GBP's menu field.
- **Google Business Profile guide**: "no website? point your GBP website field
  at your page" — 5 screenshots, 2 minutes.
- **Per-platform how-tos for non-tech people**: WordPress, Wix, Squarespace,
  Facebook page, email signature — each a short illustrated page under
  `/manage` docs (also public at `/for-businesses`).
- **vCard download**; **monthly views digest** email (GA4 Data API — already
  wired in admin) as retention + proof of value.
- Public **`/for-businesses` landing page**: the pitch (free page, tools, badge),
  claim CTA — doubles as the outreach email's destination.

## Data model

- `src/data/listings/<leg>/<slug>.json` — per-listing master: `slug, leg, type,
  name, claimed, verified, tokenHash, contact {email, person, source},
  outreach {status, sentAt, repliedAt}, blocks {…per-type}, images[],
  links {website, gbp, booking, social[]}, updated`. Contact + tokenHash are
  **never rendered** into public HTML.
- Lib `src/lib/platform/listings.ts`: loader, `validListing()` thin-content
  guard (≥ N filled blocks + ≥ 1 image to publish), JSON-LD builder per type.
- Pages `src/pages/[leg]/places/[slug].astro` + index. **Noindex-first** behind
  `site-config.json → programmatic.listingsIndexable` (glossary/areas convention).
- Design law: listing blocks = new `.c-listing-*` classes added to `globals.css`
  first, tokens only.

## Per-leg page design (block system)

Universal blocks: gallery (3–6 images), about (2–3 text blocks), NAP + map link,
hours, contact/links row, "Featured in" (links to our articles mentioning it),
verified badge state, claim CTA when unclaimed, **provided-by-business disclaimer
when claimed**.

| Leg | Business types (source articles) | Extra blocks | JSON-LD |
|---|---|---|---|
| expo-2027 | pavilions, exhibitors, booths (`participants.md`, `programme.md`) | country/org, theme, location on site, event schedule | `Organization` + `Event` |
| food-and-nightlife | restaurants, kafanas, splavovi, bars, cafes (8+ articles = warm prospect lists) | **menu** (sections → items → RSD prices), price range, cuisines, reservation link | `Restaurant`/`BarOrPub`/`CafeOrCoffeeShop` + `hasMenu` |
| where-to-stay | hotels, aparthotels, hostels (synergy with `stayTargets` affiliates) | room types, amenities, booking links, neighborhood | `Hotel`/`LodgingBusiness` |
| medical-tourism | dental, hair, cosmetic, eye, IVF clinics (13 articles — highest value) | services + price ranges, accreditations, languages, lead doctor | `MedicalClinic`/`Dentist` — **YMYL: disclaimer mandatory, no outcome claims** |
| visit-belgrade | museums, tours, attractions, day-trip operators | hours, tickets, duration, booking | `TouristAttraction`/`Museum` |
| plan-your-trip | transfers, car rental, SIM shops, exchange | services + prices | `LocalBusiness`/`AutoRental` |
| invest-and-relocate | leg is noindex/hidden — park until live | — | — |

Articles become hubs: "Places featured in this guide" module links articles →
listings (hub-and-spoke, like `gen-glossary-links.mjs`).

## Backlink mechanics (unchanged from rev-a)

- Verify claims by **email-domain match** (auto) or manual — never require the
  link (Google link-scheme risk).
- The link comes voluntarily via the badge embed + GBP website field + menu URL.
- Cold outreach ≤ 20–30/day, personalized ("we featured you in <article>"),
  opt-out line, GDPR legitimate-interest basis, opt-outs logged.

## Sourcing (legal)

Own articles first (warm "we featured you" angle), official expo2027 participant
list, OSM/Overpass, registries. **No Google Maps scraping** (ToS). Contact emails
from venue websites via polite owner-run crawler in `scripts/` (not deployed).

## Phases (each ships alone)

| Phase | Scope | Build |
|---|---|---|
| **0 — SEO step-0** | ✅ **DONE 2026-07-05** (socials/sameAs deferred by owner): `/expo-2027/tracker` (participant data page + open JSON at `/data/expo-2027-participants.json`, data master `src/data/expo-participants.json` — bump `updated` on edits), `/expo-2027/countdown` + `public/widgets/expo-countdown.js` (free embed, attribution link), `public/badges/featured-on-belgradebest.svg` + `/for-businesses` landing (claim CTA = mailto until Phase 2). New library classes: `.c-stats/.c-stat`, `.c-data-table` (also styles `.c-article table`), `.c-snippet` + `Snippet.astro`. | S–M |
| **1 — Listings engine + Expo pilot** | ✅ **DONE 2026-07-05**: `src/lib/listings.ts` (per-listing JSON masters, `validListing` guard, `SECTION` URL map) + `/expo-2027/pavilions` hub (93-country directory, built-vs-pending) + `[slug]` template; **12 researched pavilion profiles seeded** (Japan, Germany, Italy, Serbia, USA, Russia, Saudi Arabia, Austria, Switzerland, Türkiye, UAE, China — every fact sourced); `programmatic.listingsIndexable` **flipped to `true` 2026-07-05** (pages enriched first: geography + visiting blocks templated from getting-there facts, 3–4 sourced FAQs each + FAQPage JSON-LD, ~900–1,300 words/page); tracker + participants-article cross-links live. URL deviation from plan: expo uses `/pavilions/`, not `/places/` (per-leg segment via `SECTION`). | M (≈ a day) |
| **2 — Self-serve portal** | `/manage` + `/api/manage/*` (token auth, edit form, image upload, save→commit), disclaimer block, email placeholders w/ no-key fallback, admin Listings page (history/revert/tokens). **Partial 2026-07-05 (admin half done, redesigned around the north star):** drill-down module — `/admin/platform` (LEG cards + booth funnel + GA4/GSC), `/admin/platform/[leg]` (category cards w/ booth rollups + add-category + one-click create for missing Expo countries), `/admin/platform/[leg]/[category]` (**the working screen**: add-business prospect form → `createListing()` stub, per-booth contact/stage/draft/claim management, stage filters). Cross-cutting: `/listings` = Search, `/outreach` = Queue. Draft builder `lib/admin/outreach-draft.ts` (template resolution `<leg>:<type>` → `<leg>` → default; `{parentName}/{parentUrl}` placeholders; booth template sells the parent page). Runtime reads/writes via `platform-store.ts` + `/api/admin/platform`. **Hierarchy shipped:** `parent` field → child routes (`ListingPage.astro` serves both levels; child publishes only with its parent; seeded: World Expo Museum under China). Still open: `/manage` business portal (token auth, edit form, image upload), transactional email, history/revert UI, bulk CSV import of booth prospects. | M–L |
| **3 — Outreach** | admin Outreach page: contacts + statuses (GitHub store), template editor, magic-link generation, send via mailbox / copy-paste at first | M |
| **4 — Per-leg rollout** | food-and-nightlife first (menu block), then where-to-stay, medical (YMYL guardrails), visit/plan | M per leg |
| **5 — Toolkit polish** | QR gen, platform how-tos, GBP guide, GA4 monthly digest, menu pages | S–M |

## Guardrails

- Public site stays static; `/manage` + `/api/manage/*` are the only new
  server-rendered routes (amend CLAUDE.md when built), noindex + out of sitemap.
- Trust-first editing but never trust input: strip HTML, cap lengths, sniff
  images, rate-limit, hash tokens, constant-time compares.
- Contact emails + token hashes never in public HTML.
- Noindex-first; flip `programmatic.listingsIndexable` when enough pages pass
  the thin-content guard.
- Editorial brand ≠ directory: distinct listing design (globals.css modifiers),
  "provided by the business" disclaimer on claimed pages.
- Badge link voluntary, never a claim precondition.
