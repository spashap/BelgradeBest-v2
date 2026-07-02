# BelgradeBest — SEO Action Plan (2026-07-02)

Companion to `FULL-AUDIT-REPORT-2026-07-02.md`. Ordered by priority; each item lists the exact file(s) to touch. Effort: S < 1h · M = half-day · L = multi-day.

## CRITICAL — fix immediately

- [ ] **1. Fix `www.belgradebest.com` TLS cert** — Vercel dashboard → Project → Domains: add/verify `www.belgradebest.com` so a cert is issued (keep redirect to apex; set it to permanent). No code change. *(S, infra)*

## HIGH — this week

- [ ] **2. Replace the 907 KB favicon** — `public/icon.svg` is a base64 PNG in an SVG wrapper, downloaded on every page view. Replace with a true vector (<10 KB) or remove the `<link rel="icon" type="image/svg+xml">` from `src/layouts/BaseLayout.astro:58` and keep `favicon.ico`. *(S)*
- [ ] **3. Batch-trim titles + descriptions** — 29 titles >62 chars → ≤60; 63 descriptions >165 chars → ~150–155. Frontmatter-only edit across `src/content/articles/**`. Worst offenders: medical-tourism descriptions (up to 433 chars), `belgrade-wine-bars` title (88). Also give `plan-your-trip/money` a real title (currently 19 chars). *(M)*
- [ ] **4. Fix `/areas/*` meta-description bug** — `src/lib/areas.ts:75`: remove blanket `.toLowerCase()` on `riverSide` (breaks proper nouns), cap at ~155 not 320; or add per-area `metaDescription` to `areas.json`. *(S)*
- [ ] **5. De-orphan the programmatic pages** —
  - Footer: add `/glossary` link in `src/components/SiteFooter.astro` (mirror the `areas` special-case, gated on `glossaryIndexable`).
  - Visible breadcrumbs on `src/pages/glossary/[term].astro` + `src/pages/areas/[area].astro` (HTML to match existing BreadcrumbList JSON-LD).
  - Add `/areas/<slug>` entries to `linksTo` of `where-to-stay-in-belgrade`, `belgrade-neighborhoods`, `dorcol-vs-vracar-where-to-stay`, `stari-grad-vs-zemun-belgrade`, `belgrade-old-town-vs-new-belgrade` (verify `lib/links.ts relatedFor()` resolves non-article hrefs first), and/or build `scripts/gen-area-links.mjs` on the glossary-linker pattern.
  - Link `nearby` names on area pages to sibling `/areas/*`//glossary/*` spokes (`src/lib/areas.ts:107`).
  - Give `menjacnica` an inbound link from `plan-your-trip/money`. *(M)*
- [ ] **6. Author/E-E-A-T identity** — name a real editor on `/about` (`src/data/site-pages.json`); for medical-tourism add a "Reviewed by [named credential]" line + `Person` in `articleSchema()` (`src/lib/schemas.ts`) for that leg. Only add schema claims backed by a real person. *(M–L, needs owner decision on who)*
- [ ] **7. External citations** — add outbound links for load-bearing stats, starting with expo-2027 (BIE/official expo site) and medical-tourism (accreditation bodies, official stats). Markdown-only edits. *(M, rolling)*
- [ ] **8. Responsive heroes** — emit 640/960/1600 widths in `scripts/gen-hero.mjs` + `scripts/optimize-heroes.mjs`; return `srcset`+`sizes` from `src/lib/hero.ts`; consume in `ArticleLayout`/`LegHubLayout`/`index.astro`. Drop WebP quality 80→75. Fixes mobile LCP (4.4–8.6s → target <2.5s). *(M)*

## MEDIUM — this month

- [ ] **9. `vercel.json` hardening** — add `headers`: security set (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, baseline CSP allowing GA domains) + `Cache-Control: public, max-age=31536000, immutable` for `/_astro/(.*)`. *(S)*
- [ ] **10. Custom 404** — create `src/pages/404.astro` on `BaseLayout` with links to home + top legs. *(S)*
- [ ] **11. Visible "Updated {date}"** on articles — render `lastUpdated` in `src/layouts/ArticleLayout.astro` near the lede (data already in frontmatter/schema). *(S)*
- [ ] **12. Schema fixes** —
  - Pass `image` + dates into `articleSchema()` at `glossary/[term].astro:80` and `areas/[area].astro:61`.
  - Emit `Event` only on the `/expo-2027` hub, not all 7 articles (`ArticleLayout.astro:54`).
  - `organizer.url` + logo `width/height: 180` in `src/lib/schemas.ts`.
  - BreadcrumbList (+`AboutPage` for /about) in `UtilityPageLayout.astro`. *(M)*
- [ ] **13. Expand thin indexable articles** — priority order: `belgrade-nightlife` (447w, P1), `serbian-food` (466w, P1), `belgrade-food-and-drink-by-neighborhood` (391w), `staying-safe` (411w), `belgrade-neighborhoods` (383w), `belgrade-itinerary-3-days` (473w), `belgrade-grill-and-street-food`, `eating-and-drinking-in-belgrade`. While editing, inject expo-2027-grade specificity into food-and-nightlife/visit-belgrade FAQs. *(L)*
- [ ] **14. Convert medical price lists to tables** — `medical-tourism-costs-in-belgrade.md`, `dental-work-belgrade.md`, `cosmetic-surgery-belgrade.md`, `hair-transplant-belgrade.md`: `| Procedure | Price range | What's included |`. Pre-build the expo ticket-price table scaffold in `tickets.md`. *(S–M)*
- [ ] **15. Glossary title grammar** — `termTitle()` in `src/lib/glossary.ts:66-68`: per-record article/question override ("What is Skadarlija?", "What are ćevapi?"). *(S)*
- [ ] **16. De-conflict `belgrade-neighborhoods` vs `/areas` hub** — differentiate titles (article = character/sightseeing; hub = where-to-stay angle) and cross-link as hierarchy. Cross-link `/areas/skadarlija` ↔ `/glossary/skadarlija`. *(S)*
- [ ] **17. Real `lastmod` for non-article pages** — 34 URLs (hubs, utility, glossary, areas) get `BUILD_DATE` re-stamped every deploy. Add `updated` fields to `glossary.json`/`areas.json`/`site-pages.json` and wire into the `LASTMOD` map in `astro.config.mjs`; bump hub priority from 0.3. *(M)*
- [ ] **18. Update CLAUDE.md** — SEO posture section (3 legs + glossary/areas now indexable; admin password IS set). Stale docs actively mislead future sessions. *(S)*

## LOW — backlog

- [ ] **19. Preconnect/preload** — GA domains preconnect + base Latin woff2 preload in `BaseLayout.astro`. *(S)*
- [ ] **20. Delete 63 orphan hero PNGs** (134 MB, never served; silent-fallback risk in `hero.ts`). *(S)*
- [ ] **21. Raise programmatic guard floors** — `validTerm`/`validArea`: body/character ≥900 chars, glossary `faqs ≥ 2` (`src/lib/glossary.ts:30-41`, `src/lib/areas.ts`). *(S)*
- [ ] **22. robots.txt polish** — drop deprecated `Host:`; add explicit AI-bot policy blocks (document intent; owner decision on training-only bots CCBot/Bytespider). *(S)*
- [ ] **23. `llms-full.txt`** — new `src/pages/llms-full.txt.ts` emitting full markdown bodies for indexable legs. *(S–M)*
- [ ] **24. Mobile nav tap targets** — add `padding-block` to mobile nav anchors in `globals.css` (30px → ≥44px). *(S)*
- [ ] **25. Populate `brand.sameAs`** the moment any real social/YouTube profile exists (`site-config.json`; code already supports it). Off-site authority is currently zero — the biggest long-term GEO/backlink lever. *(ongoing)*
- [ ] **26. Inbound-link pass for the 20 zero-inbound articles**, esp. money pages (`medical-tourism-serbia-vs-turkey`, `ivf-and-fertility-belgrade`, `where-to-stay-for-expo`). *(M)*
- [ ] **27. `unknowns` frontmatter** — wire into UI or retire. *(S)*

## New programmatic page sets (ranked, build noindex-first)
1. `/when/belgrade-in-<month>` — 12 curated pages (weather/daylight/events/Expo notes). LOW effort.
2. Glossary +15–25 terms (kajmak, ajvar, slava, dinar, Knez Mihailova, Surčin…). VERY LOW.
3. `/answers/<question>` from the radar feed (AEO; already spec-reserved). LOW-MED.
4. `/day-trips/<destination>` (8–12; `belgrade-day-trips` as hub). MED.
5. Areas +5–8 genuine stay-areas (cap ~15). LOW.
6. Expo pavilion/FAQ spokes as announcements land. MED, rolling.
7. Medical procedure pages — last, hand-reviewed (YMYL). HIGH.
Skip: "X near Y" (no data source, doorway risk).

## Follow-up
- In 2–4 weeks: GSC coverage check on `/glossary/*`, `/areas/*`, and the three newly-indexed legs.
- Wire GSC/CrUX/GA4 credentials for the next audit (field CWV + indexation data were unavailable this round).
- Re-run Lighthouse on `/food-and-nightlife` after items 2+8 to confirm the 8.6s LCP outlier resolves.
