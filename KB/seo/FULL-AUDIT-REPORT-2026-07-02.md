# BelgradeBest — Full SEO + Programmatic SEO Audit

**Date:** 2026-07-02 · **Target:** https://belgradebest.com (live production) + local source
**Method:** 8 parallel specialist passes (technical, content/E-E-A-T, schema, sitemap, performance/Lighthouse, GEO/AI-search, visual/mobile via Playwright, programmatic) + on-page inventory of all 65 articles. No GSC/CrUX/backlink API credentials were available — those data sources are absent from this audit.

---

## Executive summary

**SEO Health Score: 74/100** · **Programmatic SEO Score: 78/100**

| Category | Weight | Score |
|---|---|---|
| Technical SEO | 22% | 84 |
| Content quality / E-E-A-T | 23% | 62 |
| On-page SEO | 20% | 70 |
| Schema / structured data | 10% | 82 |
| Performance (CWV, lab) | 10% | 85 |
| AI search readiness (GEO) | 10% | 68 |
| Images | 5% | 70 |

**Business type:** travel/content publisher (Belgrade guide + Expo 2027 trigger + YMYL medical-tourism leg).

**The site's foundation is unusually clean** — pure static HTML, 100% sitemap coverage (99/99 indexable pages, zero noindex leaks, zero admin/api leaks), correct canonicals and single-hop 308 redirects, one-H1-per-page, rich and mostly valid JSON-LD, IndexNow wired, CLS ≈ 0 and TBT ≈ 10ms everywhere, and a disciplined curated programmatic setup. The gaps are concentrated in five themes: **(1) a broken `www` TLS certificate, (2) authority/E-E-A-T signals (no named author, zero external citations, empty `sameAs`), (3) systematic title/description length overruns, (4) mobile LCP driven by non-responsive hero images and a 907 KB favicon, (5) post-flip internal-linking debt on the programmatic page sets.**

### ⚠ State correction (documentation drift)
CLAUDE.md is stale on indexing posture. Live reality verified on production: `visit-belgrade`, `plan-your-trip`, `where-to-stay` are **already indexable** and in the sitemap; `programmatic.glossaryIndexable` and `areasIndexable` are both **`true`**; only `invest-and-relocate` remains noindex; `/admin` **is** password-gated (302 → /admin/login). Every "before flipping indexable" recommendation is therefore already live-urgent.

### Top 5 critical/high issues
1. **`https://www.belgradebest.com` fails TLS** (`SEC_E_WRONG_PRINCIPAL` — cert doesn't cover `www`). Browsers/crawlers hit a security error before Vercel's redirect fires. Fix in Vercel → Domains (add `www`, cert auto-issues). Infra fix, not code.
2. **No author identity / medical reviewer on a YMYL leg.** No named person anywhere; `author` is always Organization; medical-tourism (15 articles, indexable) has no "reviewed by" credential. Zero external citations in all 65 articles.
3. **Meta descriptions: 63/65 articles exceed ~160 chars** (up to 433); **29 titles exceed ~62 chars** (up to 88). Plus a confirmed bug: `src/lib/areas.ts:75` lowercases proper nouns and caps at 320 chars on all `/areas/*` descriptions.
4. **Mobile LCP fails on key pages** (article 4.4s, food-and-nightlife hub "poor" in lab): heroes ship fixed 1600px with no `srcset` (100–240 KB wasted/page) and `public/icon.svg` is a 907 KB base64-PNG-in-SVG downloaded on every page view.
5. **`/glossary` hub is an orphan** — indexable but linked from nowhere (not footer, not nav, no visible breadcrumb on spokes); `/areas/*` spokes have zero article inbound links.

### Top 5 quick wins (effort ≤ 1 hour each)
1. Replace `public/icon.svg` (907 KB → <10 KB, or drop the link and keep favicon.ico) — biggest byte win on every page view.
2. Add `/glossary` to the footer (mirror the `areas` special-case in `SiteFooter.astro`) + visible breadcrumbs on glossary/area spokes.
3. Fix `src/lib/areas.ts:75` (drop `.toLowerCase()`, cap ~155 chars) — repairs all 9 area meta descriptions.
4. Add a visible "Updated {date}" line to `ArticleLayout.astro` (data already exists as `lastUpdated`).
5. Add `Cache-Control: immutable` for `/_astro/*` + security headers block in `vercel.json`; create `src/pages/404.astro`.

---

## 1. Technical SEO — 84/100

**Critical**
- `www.belgradebest.com`: TLS handshake fails (cert doesn't cover the host). DNS is correct; Vercel would 307 to apex but the cert error fires first. **Fix:** add `www` in Vercel Domains settings; then change the redirect to permanent (308) and consider HSTS `includeSubDomains; preload`.

**High**
- **No custom 404 page** — correct 404 status but Vercel's generic body. Create `src/pages/404.astro` on `BaseLayout` with links to home/top legs.
- **No security headers** beyond platform HSTS: no `X-Content-Type-Options`, `X-Frame-Options`/CSP, `Referrer-Policy`, `Permissions-Policy`. Add a `headers` block to `vercel.json` (CSP must allow googletagmanager.com/google-analytics.com).

**Medium**
- `/areas/*` meta descriptions malformed (see quick win #3). Root cause `src/lib/areas.ts:75`.
- Hero LCP weight (232 KB on `/expo-2027/guide`) — see Performance.
- `www` redirect is 307 (temporary) — make permanent once cert fixed.

**Low**
- `robots.txt` emits deprecated Yandex `Host:` directive (harmless; drop from `src/pages/robots.txt.ts`).
- No font preload for the always-needed Latin woff2 subsets.

**Verified clean:** robots.txt rules, sitemap chain, canonicals (all self-referencing absolute, incl. noindex pages), meta-robots/sitemap consistency, http→https and trailing-slash 308s (single-hop), viewport/lang, no-JS-needed content, IndexNow key live, /rss.xml + /llms.txt 200, one H1 per page, no duplicate titles in sample, brotli, image `width`/`height` + `loading`/`fetchpriority` discipline.

## 2. Content quality / E-E-A-T — 62/100 (weakest category)

E-E-A-T breakdown: Experience 40 · Expertise 45 · Authoritativeness 40 · **Trustworthiness 75** (the confirmed/reported/unknown discipline, disclosure pages, and honest hedging are genuinely strong).

**High**
- **No author/expertise identity anywhere** — `/about` names no person; JSON-LD author is always Organization. For medical-tourism (YMYL), add a named, credentialed medical reviewer ("Reviewed by Dr. X" + `Person` JSON-LD). Single highest-leverage E-E-A-T fix.
- **Zero external citations in 65/65 articles.** Stats are asserted ("sector estimates suggest", "44,652 visitors a day") with no links to primary sources (BIE/Expo official, chamber-of-commerce figures, accreditation bodies). Retrofit load-bearing stats, starting with medical-tourism + expo-2027.

**Medium**
- **Thin content, 8 articles — 5 in indexable food-and-nightlife**, including two P1 pages: `belgrade-nightlife` (447w), `serbian-food` (466w), plus `belgrade-food-and-drink-by-neighborhood` (391w), `belgrade-grill-and-street-food` (496w), `eating-and-drinking-in-belgrade` (496w). Also now-indexable: `staying-safe` (411w), `belgrade-neighborhoods` (383w), `belgrade-itinerary-3-days` (473w).
- **FAQ/intro genericity in food-and-nightlife and visit-belgrade** vs the numeric specificity of expo-2027/medical-tourism. Rewrite to inject concrete checkable facts (prices, hours, distances).
- **`lastUpdated` uniformity**: 63/65 articles stamped 2026-06-20 — reads as a bulk build. Going forward let dates diverge with real edits.

**Low**
- `unknowns` frontmatter field is 95% unused despite being a designed trust mechanic — wire it into UI or retire it.
- No first-hand experience signals anywhere (weakest E-E-A-T pillar) — even small verifiable local details/photo captions per page would help.

Per-leg: expo-2027 best (avg 1,322w, sharp, citation-ready) · medical-tourism strong prose but YMYL gaps (citations/reviewer) · **food-and-nightlife weakest indexable leg (avg 637w)** · where-to-stay deepest of the newly-indexed legs (1,619w) · invest-and-relocate correctly dark.

## 3. On-page SEO — 70/100

- **Titles:** 29/65 over ~62 chars (worst: `belgrade-wine-bars` 88, `belgrade-grill-and-street-food` 81, `where-to-stay-in-belgrade-for-nightlife` 82); `plan-your-trip/money` at 19 chars is under-optimized. Batch-trim to ≤60.
- **Descriptions:** 63/65 over 165 chars; medical-tourism worst (`gender-affirming-surgery-belgrade` 433, `cosmetic-surgery-belgrade` 402). Served verbatim — Google truncates/rewrites. Batch-trim to ~150–155.
- **Internal links:** outbound healthy (avg 3.8 `linksTo`/article, none empty). 20 articles have zero inbound `linksTo` from other articles (hub links only) — worth a pass, esp. for money pages like `medical-tourism-serbia-vs-turkey`, `ivf-and-fertility-belgrade`, `where-to-stay-for-expo`.
- **Headings/H1s:** clean sitewide (verified).
- FAQ coverage: 65/65 articles. Fresh dates (2026-06-20/21).

## 4. Schema / structured data — 82/100

Valid and well-built overall (Organization, WebSite, Article with full recommended props on leg articles, BreadcrumbList everywhere, Event on expo hub, FAQPage, DefinedTerm). Issues:

- **High:** glossary + area `Article` blocks missing `image` and `datePublished/dateModified` — `articleSchema()` called with only `{title, description, url}` at `src/pages/glossary/[term].astro:80` and `src/pages/areas/[area].astro:61`. Live, indexable pages; hero SVGs exist.
- **Medium:** identical `Event` block duplicated on all 7 expo-2027 articles with each article's unrelated hero as `Event.image` (`ArticleLayout.astro:54`) — emit Event on the hub only. `organizer` lacks `url` (`schemas.ts:79-82`). Logo `ImageObject` lacks width/height (180×180).
- **Low:** UtilityPageLayout has zero page-level schema (add BreadcrumbList; `AboutPage` on /about). Consider `ItemList` on hubs and `Place` on area pages (not TouristAttraction). Populate `brand.sameAs` when profiles exist.
- **Deliberate non-recommendations:** do NOT add MedicalWebPage/`reviewedBy` schema without a real credentialed reviewer; FAQPage has no Google rich-result eligibility for commercial sites (kept for AI-citation value — fine).

## 5. Performance — 85/100 (lab; desktop 100 everywhere, mobile is the story)

PSI API quota-blocked; local Lighthouse 13 used. CLS 0–0.032 and TBT 8–10ms sitewide (perfect). **LCP mobile:** home 3.5s, `/expo-2027` 0.9s, `/expo-2027/guide` 4.4s, `/food-and-nightlife` 8.6s (single-run outlier, re-measure — but same root cause).

1. **`public/icon.svg` = 907 KB** (base64 PNG wrapped in SVG), fetched on every page view (`BaseLayout.astro:58`). Replace with real vector (<10 KB) or drop. Highest-ROI fix in the audit.
2. **Heroes not responsive:** fixed 1600×686, no `srcset/sizes` → 100–240 KB wasted per page on mobile (192 KB wasted on guide's LCP image alone). Extend `gen-hero.mjs`/`optimize-heroes.mjs` to emit 640/960/1600 widths; return `srcset` from `src/lib/hero.ts`; drop WebP quality 80→75.
3. **No preconnect/preload:** add preconnect to googletagmanager.com/google-analytics.com + preload the two base Latin woff2s in `BaseLayout.astro`.
4. **`/_astro/*` served with `max-age=0`** despite hashed filenames — add immutable Cache-Control in `vercel.json`.
5. **63 orphan hero PNGs (134 MB) in `public/`** — never served (WebP coverage 100%) but a silent-fallback regression risk; delete.
6. GA4 = 165 KB/27ms main-thread, async — acceptable, no action.

## 6. GEO / AI-search readiness — 68/100

Technical accessibility near-perfect (static HTML, GPTBot/ClaudeBot/PerplexityBot verified served identical 200s, no edge bot-blocking). llms.txt present, well-formed, architecture-synced with noindex flags. Expo 2027 cluster is 8.5/10 answer-ready (dates/location/tickets answered liftably; ticket "not yet on sale" handled the right way).

- **High:** `brand.sameAs` = `[]` — zero off-site authority graph (no YouTube/LinkedIn/Wikipedia/Reddit presence referenced). Highest-leverage GEO gap; populate the moment any real profile exists.
- **High (medical leg):** anonymous authorship (same as §2).
- **Medium-High:** **zero tables in the three priority legs** — medical cost data is bullet lists; convert `medical-tourism-costs-in-belgrade.md` (+ dental/cosmetic/hair pages) price bands into markdown tables (AI Overview/comparison-box lift). Pre-build the Expo ticket-price table scaffold.
- **Medium:** no visible "Updated {date}" on pages (schema-only) — add to `ArticleLayout.astro` (one line, data exists).
- **Low-Medium:** robots.txt has no per-bot policy (all AI bots allowed by default — fine for citation goals, but undocumented; decide deliberately on training-only bots CCBot/Bytespider). No `llms-full.txt` (opportunity: full markdown bodies for indexable legs).
- Passage citability: 6–9/10 across sampled pages; paragraphs often 50–100 words vs the ~140-word optimum — merge answer sentences into denser blocks when editing.

## 7. Visual / mobile — 90/100

Zero horizontal overflow at 390/768/1366px, 18px body font, H1 above the fold everywhere, CLS ≈ 0, clean menu overlay. Two nits: mobile nav links have 30px tap-target boxes (padding is margin, not anchor padding — add `padding-block` to the mobile nav anchor class in `globals.css`); no button-styled CTA above the fold anywhere (editorial choice — but a `.c-btn` in the expo-2027 hero would be the one high-leverage addition for the Expo window). Screenshots in scratchpad `screenshots/`.

## 8. Programmatic SEO — 78/100

Inventory: 11 glossary spokes + hub, 10 area spokes + hub — all live and indexable. Template uniqueness 85/100 (real hand-written prose, ~75–85% unique content per page, no mad-libs body). Thin-content risk LOW today; guard floors weak for the future (280 chars ≈ 45 words — raise to ≥900 chars, glossary `faqs ≥ 2`).

**The entire gap is internal linking (55/100):**
- `/glossary` hub orphaned (zero HTML inbound links sitewide).
- Area spokes: only inbound path is footer → hub. None of the 5–6 where-to-stay/neighborhoods articles link a single `/areas/*` page.
- `nearby` on area pages rendered as plain text where sibling spoke URLs exist (`areas.ts:107`) — resolve to links.
- `menjacnica` glossary spoke has zero article inbound links.
- No visible breadcrumbs on spokes (JSON-LD claims a trail the HTML doesn't show).

**Title-grammar bug (Medium):** `termTitle()` (`lib/glossary.ts:66-68`) unconditionally emits "What is a X?" → "What is a Ada Ciganlija?", "What is a Ćevapi?" — add per-record article/question override.

**Cannibalization watch:** `/visit-belgrade/belgrade-neighborhoods` vs `/areas` hub (same head query — differentiate titles + cross-link as hierarchy); `where-to-stay-in-belgrade` vs `/areas`; `/areas/skadarlija` vs `/glossary/skadarlija` (cross-link; Skadarlija is the weakest area record).

**Sitemap signals:** all 23 programmatic pages get `lastmod = BUILD_DATE` (re-stamped every deploy — teaches Google to ignore lastmod); hubs get priority 0.3. Add real `updated` fields to glossary.json/areas.json and wire into the LASTMOD map in `astro.config.mjs`.

**Ranked new programmatic opportunities** (curated-JSON pattern, noindex-first):
1. **`/when/belgrade-in-<month>`** (12 pages: weather, daylight, events, Expo-window notes) — classic mid-volume low-competition queries; `best-time-to-visit` becomes the pillar. Effort LOW.
2. **Glossary expansion** (+15–25 terms: kajmak, ajvar, slava, dinar, Knez Mihailova, Surčin…) — machinery amortized; validate demand from /admin/radar. Effort VERY LOW.
3. **`/answers/<question-slug>`** (AEO set from the radar question feed) — strongest AI-citation format; already spec-reserved. Effort LOW-MED.
4. **`/day-trips/<destination>`** (Novi Sad, Avala, Golubac… 8–12 pages; `belgrade-day-trips` as hub). Effort MED.
5. **Areas expansion** (+5–8 genuine stay-areas, cap ~15 total). Effort LOW.
6. **Expo 2027 pavilion/FAQ spokes** inside the existing leg as announcements land. Effort MED, rolling.
7. **Medical procedure pages** — highest commercial value, hardest YMYL bar; do last, hand-reviewed. Effort HIGH.
8. **Skip "X near Y"** — no POI data, mad-libs risk, violates the curated ethos.

---

## Not covered (no credentials)
- GSC indexation/impressions/CTR, CrUX field CWV, GA4 organic trends — wire up `seo-google` credentials for the next audit.
- Backlink profile (Moz/Bing/DataForSEO absent). Given `sameAs` is empty and the domain is young, off-site authority is presumably near-zero — the biggest untracked growth constraint.

## Post-flip monitoring
The three legs + 23 programmatic pages went indexable recently. In 2–4 weeks check GSC coverage for `/glossary/*`, `/areas/*`, and the three newly-indexed legs before scaling any new page set.
