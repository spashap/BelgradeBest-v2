# BelgradeBest — Growth Technical Report

**Prepared for:** growth strategist
**Prepared from:** read-only inspection of the `BelgradeBest-V2` repository (branch `main`, working tree as of 2026-09-10) plus the committed build output in `dist/`. No code was changed, no packages installed, nothing deployed.
**Method:** every statement below was checked against the actual implementation (source files, config, build artifacts). Documentation in `KB/` and `CLAUDE.md` was used only as context and is labelled as such. Where the repo does not confirm something, it is marked **Not confirmed**.
**Secrets:** environment-variable *names* are quoted; no values are.

---

## 1. Executive Summary

BelgradeBest.com is an English-first editorial travel guide to Belgrade with an Expo 2027 (15 May – 15 Aug 2027) cluster and an early-stage "claimable business pages" platform. Technically it is a **fully static site** built with Astro and hosted on Vercel, with a small server-rendered admin area. Content lives in Markdown and JSON files committed to Git; there is no database and no runtime CMS.

### CONFIRMED (verified in code)

| Area | Finding |
|---|---|
| **Frontend/backend** | Astro 5 static site generator, `output: "static"`, `@astrojs/vercel` adapter. Every public page is prerendered HTML. Only `/admin/*`, `/api/admin/*`, `/manage`, `/api/manage/save` and `/api/listing-request` are serverless functions (`prerender = false`). |
| **CMS / content** | File-based. Articles are Markdown with YAML frontmatter in `src/content/articles/<leg>/<slug>.md` (64 files, 6 legs live). Structure, navigation, homepage and SEO defaults live in three JSON masters (`site-schema.json`, `site-config.json`, `site-pages.json`). Programmatic sets: 31 glossary terms, 10 neighbourhood ("area") pages, 79 listing JSON files (Expo pavilions and prospects), 1 Expo participant dataset. |
| **Database / storage** | None. Persistence for admin edits is a **GitHub commit** through the Contents API (`GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`), which triggers a Vercel rebuild. Leads from the public "get listed" form are written as JSON files into `src/data/leads/` the same way. |
| **Deployment / hosting** | Vercel, framework preset Astro. `vercel.json` sets security headers, CSP and cache headers only; no crons, no redirects, no rewrites. Site origin in config is `https://belgradebest.com`. |
| **Analytics** | Google Analytics 4 only, via `gtag.js`, injected on every public page **in production builds only** (`PUBLIC_GA4_ID`). Default config, no custom events. Owner-side reporting pulls the **GA4 Data API** and the **Google Search Console Search Analytics API** into `/admin/analytics` and `/admin/platform` at request time, using a service account (`GA_PROPERTY_ID`, `GA_CREDENTIALS_JSON`, `GSC_SITE_URL`). Vercel Web Analytics was removed (comment in `Analytics.astro`); the CSP still whitelists its hosts. |
| **SEO systems** | Per-page title/description/canonical/OG/Twitter meta from a shared `pageMetadata()` builder; `noindex,follow` meta where flagged; XML sitemap with real per-URL `lastmod`; `robots.txt`; JSON-LD (Organization, WebSite, Article, BreadcrumbList, FAQPage, Event, DefinedTerm, Dataset, ItemList, WebPage/AboutPage); hreflang EN↔DE for the 11 German pages; IndexNow ping on production builds; RSS feed; `llms.txt` and `llms-full.txt`. One 301 redirect. Branded 404. |
| **Affiliate systems** | Plumbing exists (`StayLinks.astro` + `stay-affiliates.json`, `rel="sponsored nofollow noopener"`) but **all 10 targets are disabled with empty URLs**. No affiliate link renders anywhere today. No ad network. |
| **External widgets** | Four free embeddable JavaScript widgets (countdown, participant counter, quick facts, pavilion spotlight), a "Featured on BelgradeBest" SVG badge, a public JSON dataset endpoint, and QR codes for listing pages. All are self-contained, data baked in at build, no tracking. Attribution is via `utm_source`/`utm_medium` on the widget's link home only. |
| **Localisation** | English site plus a German mirror of the Expo cluster only: `/de/expo-2027` hub, 6 articles, pavilion directory, 3 pavilion profiles (11 URLs). `<html lang>`, `og:locale`, hreflang with `x-default` = English. |
| **Scheduled automation** | Two GitHub Actions workflows: daily Reddit "question radar" (commits a feed the admin reads) and weekly content-freshness scan (report only). Build-time IndexNow ping. Nothing scheduled on Vercel. |
| **Business funnel** | Public lead form (`/for-businesses` → `/api/listing-request` → JSON file commit). Magic-link self-serve portal `/manage` for claimed listings (edits commit to GitHub; owner notified via Resend if `RESEND_API_KEY` set). Admin outreach pipeline is manual (`mailto:` drafts from templates). |

### PARTIAL (exists, but incomplete or not wired end-to-end)

- **Channel attribution** exists only as far as GA4's default channel grouping provides it. Widget/badge/QR links carry `utm_source` (and `utm_medium=embed`) but no `utm_campaign`, no per-partner identifier, and no written UTM convention (the growth plan says "UTM as agreed"; nothing in the repo defines it).
- **Search Console integration** covers top queries and top pages (clicks, impressions, CTR, position) for 1/7/28/90-day windows and a page-regex filter for platform pages. URL Inspection, Sitemaps and Links reports are not implemented in the app. A one-off indexation sweep JSON (`KB/seo/google-index-sweep-2026-09-04.json`) exists but no script in the repo regenerates it.
- **Bing Webmaster Tools** is the primary ranking channel according to the owner's KB reports, but there is **no Bing API code** in the application. The reports in `KB/seo/` were produced with operator tooling outside the repo (config files exist under the owner's `~/.config/claude-seo/`; not part of the app).
- **Social posting**: `scripts/syndicate.mjs` can post to X, LinkedIn and Facebook Pages but is inert (no tokens), not scheduled, not deployed, and adds no UTM.
- **Admin caching**: none. Every admin analytics page load calls GA4 and GSC live.

### NOT FOUND

- Custom GA4 events (outbound clicks, CTA clicks, form submits, scroll), consent mode, IP-anonymisation flags.
- Server-side request logging, referrer capture, IP capture.
- Widget impression or click counting, per-embed IDs, referring-domain capture.
- Live affiliate links, affiliate IDs, revenue import.
- Meta Pixel, Pinterest/Meta/Google/Bing site-verification meta tags.
- Tag or category taxonomy beyond the 7 fixed "legs"; pagination.
- Image sitemap, news sitemap, LocalBusiness/TouristAttraction schema.
- Any read-only growth/reporting API endpoint.
- Business-facing statistics in the `/manage` portal ("monthly visitor email" is promised on `/for-businesses` but not implemented).

---

## 2. Site Content Architecture

All public routes are prerendered at build time unless stated. "Analytics distinguishes it" means: GA4 records `pagePath`, so any type with a distinct URL prefix can be separated by path filter in GA4 or in the admin; there is no content-type dimension sent to GA4.

| Content type | Route(s) | Data source | Template | Indexable | Static? | Analytics distinguishes |
|---|---|---|---|---|---|---|
| **Homepage** | `/` | `site-config.json → homepage`, clusters | `pages/index.astro` (BaseLayout) | Yes | Static | Yes (path `/`) |
| **Leg hubs** (category pages) | `/visit-belgrade`, `/plan-your-trip`, `/where-to-stay`, `/food-and-nightlife`, `/medical-tourism` | `site-schema.json` legs | `LegHubLayout` via `[leg]/index.astro` | Yes | Static | Yes (one-segment path) |
| **Articles / guides** | `/<leg>/<slug>` — 64 live (visit-belgrade 10, plan-your-trip 10, where-to-stay 10, food-and-nightlife 13, medical-tourism 15, expo-2027 6) | `src/content/articles/<leg>/<slug>.md` (Astro content collection, Zod schema in `content.config.ts`) | `ArticleLayout` via `[leg]/[slug].astro` | Yes (per-file `noindex` flag; all live ones indexable) | Static | By path prefix = leg |
| **Hidden leg** | `/invest-and-relocate` (3 planned slugs, no content files) | `site-schema.json` | — | No (`noindex: true`, `visible: false`, excluded from sitemap) | Static | n/a |
| **Neighbourhoods** | `/areas`, `/areas/<slug>` (10) | `src/data/areas.json` via `lib/areas.ts` (thin-content guard) | `pages/areas/[area].astro` | Yes (`programmatic.areasIndexable: true`) | Static | Yes (`/areas/`) |
| **Glossary** | `/glossary`, `/glossary/<term>` (31) | `src/data/glossary.json` via `lib/glossary.ts` | `pages/glossary/[term].astro` | Yes (`glossaryIndexable: true`) | Static | Yes (`/glossary/`) |
| **Expo 2027 hub** | `/expo-2027` | Config facts, articles, participants, listings | one-off portal `pages/expo-2027/index.astro` | Yes | Static | Yes |
| **Expo articles** | `/expo-2027/<slug>` (6) | Markdown as above | `ArticleLayout` | Yes | Static | Yes |
| **Expo participant tracker** | `/expo-2027/tracker` | `src/data/expo-participants.json` (93 named countries, 141 official count, updated 2026-08-20) | `pages/expo-2027/tracker.astro` | Yes | Static | Yes |
| **Expo open data** | `/data/expo-2027-participants.json` | same JSON | `pages/data/…json.ts` | n/a (data file) | Static | Yes (only if hits reach GA4; a raw JSON fetch does not run gtag, so **downloads are not measured**) |
| **Countdown page** | `/expo-2027/countdown` | config | `countdown.astro` | Yes | Static | Yes |
| **Corporate area** | `/expo-2027/corporate-area` | hand-written | `corporate-area.astro` | Yes | Static | Yes |
| **Pavilion directory** | `/expo-2027/pavilions` | `listingsForLeg()` from `src/data/listings/expo-2027/*.json` | `pages/expo-2027/pavilions/index.astro` ("EXPO ATLAS" chrome) | Yes (`listingsIndexable: true`) | Static | Yes |
| **Pavilion / country profiles** (business listings, level 1) | `/expo-2027/pavilions/<slug>` — 21 published of 23 top-level | listing JSON; thin-content guard `validListing` | `layouts/ListingPage.astro` | Yes | Static | Yes |
| **Exhibitor / booth listings** (level 2) | `/expo-2027/pavilions/<parent>/<child>` — 1 published of 56 child stubs | same | `ListingPage` | Yes when published | Static | Yes |
| **German Expo cluster** | `/de/expo-2027`, `/de/expo-2027/<slug>` (6), `/de/expo-2027/pavilions`, `/de/expo-2027/pavilions/<slug>` (3) | `src/content/de/`, `i18n.de` blocks in listing JSON | `ArticleLayout lang="de"`, `ListingPage lang="de"` | Yes, with hreflang | Static | Yes (`/de/` prefix) |
| **Partner landing** | `/for-businesses` | listings, counts | `for-businesses.astro` | Yes | Static | Yes |
| **Utility pages** | `/about`, `/how-we-make-money`, `/contact`, `/privacy` | `site-pages.json` | `UtilityPageLayout` | Yes | Static | Yes |
| **Business portal** | `/manage?token=…` | listing JSON via token hash | `manage/index.astro` | No (`noindex` meta + `X-Robots-Tag`) | **Serverless** | Yes but irrelevant |
| **Widgets** | `/widgets/expo-facts.js`, `expo-stats.js`, `expo-pavilion.js` (generated), `/widgets/expo-countdown.js` (static file) | config / participants / listings baked at build | `lib/widget-js.ts` | n/a | Static | **No** (script files, no gtag) |
| **Feeds** | `/rss.xml`, `/llms.txt`, `/llms-full.txt`, `/robots.txt`, `/sitemap-index.xml` | generated | endpoint files | n/a | Static | No |
| **Admin** | `/admin/*` | JSON masters (build snapshot), GA4/GSC live | `AdminLayout` | No | Serverless | Not tracked (no gtag) |

**Types that do not exist as distinct content:** attractions, restaurants, hotels/accommodation and events are covered inside articles and the neighbourhood pages; there are no per-venue pages, no event listings beyond the Expo Event schema, and no tag/category taxonomy beyond the 7 legs. Medical tourism is a leg of 15 articles, not a directory.

**Built sitemap (from `dist/`, build dated 2026-09-04):** 156 URLs (including 11 `/de/`, 11 areas, 32 glossary, 27 pavilion URLs).

---

## 3. Current Traffic Analytics

| Item | Status | Where / how |
|---|---|---|
| **Provider** | GA4 only | `src/components/Analytics.astro` |
| **Initialisation** | `gtag.js` loader + `gtag('config', PUBLIC_GA4_ID)`; emitted only when `import.meta.env.PROD && PUBLIC_GA4_ID` | `Analytics.astro` lines 5–15, mounted in `BaseLayout.astro` `<head>` |
| **Pageview tracking** | GA4 automatic `page_view` on every public page load. Nothing on admin pages, widget scripts, JSON/RSS/text endpoints | same |
| **Custom events** | **None** in code. Any scroll/outbound/file-download events depend on GA4 "enhanced measurement" toggled in the GA4 property (not verifiable from the repo) | — |
| **Referral tracking** | GA4 default: `sessionDefaultChannelGroup`, `sessionSource/Medium` collected by gtag. Admin surfaces channel group only (`ga4Overview`) | `src/lib/admin/analytics.ts` |
| **UTM tracking** | GA4 reads UTM natively. Site-generated UTMs: widgets (`utm_source=countdown-widget|stats-widget|facts-widget|pavilion-widget`, `utm_medium=embed`), badge (`utm_source=badge&utm_medium=embed`), QR codes (`utm_source=qr`). No `utm_campaign` or `utm_content` anywhere. Admin does not query source/medium dimensions | `src/pages/widgets/*.js.ts`, `public/widgets/expo-countdown.js`, `for-businesses.astro:30`, `scripts/gen-listing-qr.mjs:40` |
| **Social source detection** | GA4 default channel grouping (Organic Social etc.). No pixel, no social-specific tagging | — |
| **Outbound-link tracking** | **None** in code (no onclick, no gtag event, no redirector). Markdown links render as plain `<a href>` with no rel/target (no rehype plugin). Hand-written external links use `rel="nofollow noopener"` | `astro.config.mjs` markdown block, `ListingPage.astro`, `tracker.astro` |
| **Affiliate click tracking** | None (and no affiliate links live) | `StayLinks.astro` |
| **Widget referral tracking** | Only the UTM on the widget's home link. No impressions, no clicks inside the widget, no embedding-host capture | `lib/widget-js.ts` |
| **Search Console integration** | Server-side, admin only: Search Analytics API `dimensions: query | page`, 25/50 rows, window ends today−2 days, optional page regex | `src/lib/admin/analytics.ts` lines 62–130 |
| **GA4 Data API integration** | Admin only. Requests: `pagePath`×`screenPageViews`/`activeUsers`/`totalUsers`; KPIs `totalUsers, sessions, screenPageViews, engagementRate, userEngagementDuration, screenPageViewsPerSession` with previous-period comparison; `date`/`hour` trend; `sessionDefaultChannelGroup`; `deviceCategory`; `newVsReturning`; `country`; `landingPagePlusQueryString` with `sessions, userEngagementDuration, bounceRate`; realtime `activeUsers`; platform-page filter `pagePath BEGINS_WITH` | same file |
| **Server logs** | Not used by the app. Vercel's platform logs exist outside the repo; nothing reads them | — |
| **Consent / privacy** | No consent banner. `/privacy` states GA4 is used, anonymised aggregate | `site-pages.json` |

**Data availability:** GA4 and GSC data are as complete as Google holds them; the repo only limits *which slices* the admin shows. Historical depth is whatever the GA4 property and GSC property retain (GA4 retention setting not verifiable from code).

---

## 4. SEO Measurement Capability

| Question | Answer | Actual source |
|---|---|---|
| Organic sessions | **YES** | GA4 Data API, `sessionDefaultChannelGroup` = Organic Search (admin shows channel totals; per-engine split requires `sessionSource`, not queried in the app but available in GA4 UI) |
| Google clicks | **YES** | GSC Search Analytics API (`clicks`), admin `/admin/analytics`, windows 1/7/28/90 days |
| Google impressions | **YES** | same (`impressions`) |
| Search queries | **YES (top 25)** | GSC `dimension: query`, rowLimit 25 |
| Average position / rankings | **PARTIAL** | GSC `position` per query and per page (top 25/50). No rank tracker, no history stored, no competitor data |
| Landing-page SEO performance | **YES** | GSC `dimension: page` (top 25; platform-page regex top 50) plus GA4 `landingPagePlusQueryString` (top 12, all channels) |
| Indexed pages | **PARTIAL** | No URL Inspection / index-coverage API in the app. A manual sweep snapshot exists (`KB/seo/google-index-sweep-2026-09-04.json`, per-URL coverage verdicts) but nothing regenerates it. Sitemap URL count is computable from the build (156) |
| Page-specific CTR | **YES** | GSC `ctr` per page row |
| Organic conversions | **NO** | No conversion events defined anywhere; no goal/`key event` code. Lead-form submissions are stored as files but not sent to GA4 |
| Branded vs non-branded | **NO** (computable offline) | GSC query rows are returned raw; no brand regex classification in code |
| Search traffic by country | **PARTIAL** | GA4 `country` top 8 (all channels, not organic-filtered). GSC `country` dimension not requested |
| Search traffic by device | **PARTIAL** | GA4 `deviceCategory` (all channels). GSC `device` dimension not requested |
| Bing clicks/impressions | **NO (in app)** | Owner's KB reports cite Bing Webmaster Tools numbers obtained outside the repo; no Bing API code |

---

## 5. SEO Technical Infrastructure

| Element | What exists | Files |
|---|---|---|
| **Title / meta description** | `pageMetadata()` builds `<title>` = page title + ` — BelgradeBest` (suffix skipped if already present); description per page from frontmatter / JSON | `src/lib/metadata.ts`, `BaseLayout.astro` |
| **Dynamic metadata** | All build-time from frontmatter and JSON masters; leg hubs use optional `seoTitle`/`seoDescription` overrides | `metadata.ts hubMetadata()` |
| **Canonical** | Absolute self-referencing canonical on every page, no trailing slash (`trailingSlash: "never"`) | `metadata.ts:53`, `astro.config.mjs:321` |
| **Robots meta** | `<meta name="robots" content="noindex,follow">` only when flagged; no tag when indexable. `/manage` also sends `X-Robots-Tag: noindex, nofollow` | `BaseLayout.astro:56`, `manage/index.astro:16` |
| **Sitemap** | `@astrojs/sitemap` → `/sitemap-index.xml` + `sitemap-0.xml`. Filter excludes `/admin`, `/manage`, noindex/hidden legs and slugs. `lastmod` per URL from article `lastUpdated`, JSON `updated`, listing `updated`, hubs = newest child; falls back to build date only for unmapped paths. `changefreq` weekly (yearly for utility pages); priorities 1.0 / 0.9 / 0.8 / 0.7 / 0.3. No hreflang `xhtml:link` entries, no image entries | `astro.config.mjs` lines 14–170, 344–368 |
| **robots.txt** | `User-agent: *` / `Allow: /` / `Disallow: /admin` / `Disallow: /api/` / `Sitemap:` line. AI crawlers deliberately not blocked | `src/pages/robots.txt.ts` |
| **JSON-LD** | Organization (every page, with logo, `publishingPrinciples`, `sameAs` = 1 Facebook URL); WebSite + FAQPage (home); Article + BreadcrumbList + FAQPage (articles, areas, glossary, listings); DefinedTerm (glossary); Event with Offer `PreOrder` (Expo hub); Dataset with DataDownload (tracker); ItemList (listing children); WebPage/AboutPage (utility); WebPage + FAQPage (for-businesses). Author and publisher are the Organization (no personal byline). `dateModified` from `lastUpdated`/`updated`; `datePublished` falls back to `dateModified` | `src/lib/schemas.ts`, layouts |
| **Breadcrumbs** | BreadcrumbList JSON-LD on all page types; visible breadcrumb UI only on listing profiles, data pages and for-businesses (not on articles or hubs) | `ListingPage.astro:210`, `ArticleLayout.astro` |
| **OpenGraph** | `og:title/description/url/site_name/type/locale/image/image:alt`. `og:type` is `article` on every page including home. Image = page hero or `/images/og-default.png`; listing/platform pages use pre-rendered PNGs in `public/images/og/` | `BaseLayout.astro:59–66`, `lib/og.ts` |
| **Twitter/X cards** | `summary_large_image` + title/description/image/alt. `twitter:site` not emitted (config value empty) | `BaseLayout.astro:68–73` |
| **hreflang** | `en`, `de`, `x-default`(=en) on the 11 German pages and their English twins only. Bare language codes | `src/lib/i18n.ts alternates()` |
| **Language targeting** | `<html lang>`, `og:locale` (`en_US`/`de_DE`), JSON-LD `inLanguage` | `BaseLayout.astro`, `i18n.ts` |
| **Static vs SSR** | Public = static. Serverless: admin, manage, two API routes | `astro.config.mjs`, `prerender = false` files |
| **Pagination** | None | — |
| **Tag/category indexing** | No tags. Categories = 7 legs; hubs indexable except `invest-and-relocate` | `site-schema.json` |
| **Duplicate-content prevention** | Self-canonical everywhere; trailing-slash never; noindex set shared between meta, sitemap and IndexNow; DE pages self-canonical with hreflang (not canonicalised to EN). **www→apex** handling is not in the repo (KB audit of 2026-07-02 recorded a 307 and a TLS issue as owner actions) | `astro.config.mjs`, `vercel.json` (no redirects) |
| **Redirects** | One: `/expo-2027/participants → /expo-2027` (301) | `astro.config.mjs:324` |
| **404** | Branded `404.astro`, `noindex`, links to all sections; Vercel serves real 404 status | `src/pages/404.astro` |
| **Images** | Heroes as WebP with 640/960/1600 `srcset` and `sizes`, `alt` from frontmatter, cache-busted by mtime; listing photos `loading="lazy"` with width/height; SVG thumbs for areas/glossary | `src/lib/hero.ts`, `ListingPage.astro` |
| **Image sitemap** | None | — |
| **Internal linking** | "Read next" blocks resolve `linksTo` references from `site-schema.json` at render (titles never copied). Targets: articles, hubs, areas, glossary, Expo data pages, published listings. Offline generators exist (`gen-internal-links.mjs`, `gen-glossary-links.mjs`) | `src/lib/links.ts` |
| **Related content** | Same mechanism; listing pages add tile grids to sibling pavilions, tracker, guides; German articles link the other German articles of the leg | `links.ts`, `ListingPage.astro` |
| **Freshness** | `lastUpdated` required on every article; `updated` on every glossary/area/listing/page record (0 missing). Shown visibly ("Updated {date} · Source-checked…"), in `dateModified`, in sitemap `lastmod`, in `llms-full.txt`. No `<time datetime>` markup. Weekly freshness scan via GitHub Actions | layouts, `scripts/check-freshness.mjs`, `.github/workflows/freshness.yml` |
| **News schema** | Not used (Article only) | — |
| **Local business schema** | Not used | — |
| **Event schema** | Yes, Expo 2027 Event on the hub (start/end, Place, PostalAddress, organizer, Offer PreOrder → `/tickets`) | `schemas.ts expoEventSchema` |
| **IndexNow** | `astro:build:done` hook on `VERCEL_ENV=production`; submits all indexable URLs; tries api.indexnow.org → Yandex → Seznam → Naver (comment records Microsoft endpoint 403s for this host as of 2026-08-20). Key file in `public/` | `astro.config.mjs:173–256` |
| **Feeds for discovery** | RSS 2.0 (50 newest articles + listings), `llms.txt`, `llms-full.txt` (full article text) | `src/pages/rss.xml.ts`, `llms*.txt.ts` |
| **Security headers** | CSP, nosniff, X-Frame-Options SAMEORIGIN, Referrer-Policy `strict-origin-when-cross-origin`, Permissions-Policy. No HSTS in config | `vercel.json` |
| **Verification tags** | None (Google/Bing/Pinterest/Meta) in HTML | — |

---

## 6. Expo 2027 Infrastructure

**Routes:** `/expo-2027` (portal), 6 articles (`what-is-it`, `guide`, `programme`, `getting-there`, `tickets`, `where-to-stay-for-expo`), `/expo-2027/tracker`, `/expo-2027/countdown`, `/expo-2027/corporate-area`, `/expo-2027/pavilions`, 21 pavilion profiles, 1 exhibitor child page, `/data/expo-2027-participants.json`, and the German mirror (11 URLs). One 301 from the retired `/expo-2027/participants`.

**Participant / country data:** `src/data/expo-participants.json` — `updated` 2026-08-20, `officialCount` 141 (organiser statement), 93 named participants with `name`, `region`, `announced`, `source`, a 15-row timeline, 8 sources, 5 caveats, and a citation licence string. Regions: Africa 37, Asia 23, Europe 16, Americas 10, Oceania 7. There is no per-country "stage" field; the 4-stage progress track on the atlas comes from the *listing* `status` (`concept-only`, `announced`, `tender`, `construction`).

**Pavilion / business data:** 79 listing JSON files in `src/data/listings/expo-2027/`: 23 top-level (19 pavilions, plus organisations/sponsors), 56 child prospect stubs (contractors 23, agencies 22, suppliers 7, sponsors 4 …). 22 pass the thin-content guard and publish. 21 have operator `contact` data, 58 have an `outreach` record, 0 are `claimed`. Operator fields `contact`/`outreach`/`manage` are never rendered publicly (verified by grep across public templates).

**Update mechanism:** manual edits to JSON (owner + Claude Code, per `KB/platform/TRACKER-NEWS-PLAYBOOK.md` and `PROSPECT-RESEARCH-RUNBOOK.md`), or admin/`/manage` saves that commit to GitHub. Every commit triggers a rebuild, which regenerates the tracker page, the JSON endpoint, the widgets and the sitemap. No automated feed ingestion from the organiser or the BIE.

**Automated feeds out:** RSS (includes pavilion updates), `llms.txt`, Dataset JSON-LD pointing at the JSON file, IndexNow ping.

**Widgets / embeddables:** see Section 7. **APIs:** the only public data endpoint is the static JSON file above (no CORS header, no Cache-Control header set in code, no versioning).

**Backlink / referral mechanisms:** the attribution link inside each widget, the badge, the citation licence on the tracker, the outreach templates (which link *to* BelgradeBest pages without tracking parameters), and the QR codes (`?utm_source=qr`).

**Measurement of Expo traffic:**

| Can the system measure… | Answer |
|---|---|
| Widget impressions | **No.** Widgets make no network requests; the only server-side signal would be Vercel's static-asset request logs for `/widgets/*.js`, which nothing reads |
| Widget clicks | **Partial.** Only clicks that land on the site, as GA4 sessions with `utm_source=<widget>-widget` / `utm_medium=embed`. Not queried in the admin (needs `sessionSource`/`sessionMedium`) |
| Referring domain | **Partial.** GA4 records the HTTP referrer as `sessionSource` for untagged links; for UTM-tagged widget clicks the UTM overrides the referrer, so the **partner domain is lost** in standard reports (the `page_referrer` event parameter would still hold it but is not surfaced anywhere) |
| Expo landing-page traffic | **Yes.** GA4 landing pages + `/admin/platform` prefix filter (`/expo-2027/pavilions`, tracker, countdown, for-businesses) with previous-period delta; GSC page regex for the same set |
| Country (pavilion) page traffic | **Yes**, per `pagePath` (`/expo-2027/pavilions/<slug>`) |
| Partner referrals | **Partial**, as above: by widget type, not by partner |
| Conversions / actions from Expo visitors | **No.** No events; lead-form submissions and `/manage` saves are stored as Git commits, not linked to sessions |

---

## 7. External Widget / Distribution System

**Inventory**

| Asset | Type | How it works |
|---|---|---|
| `/widgets/expo-countdown.js` | hand-written static JS in `public/widgets/` | Partner pastes `<div data-bb-expo-countdown></div>` + `<script src async>`. Renders an inline-styled card with days to/from 15 May 2027, re-renders hourly, optional `data-lang="de"` and hex colour attributes. Footer link to `/expo-2027` (or `/de/expo-2027`) with `utm_source=countdown-widget&utm_medium=embed` |
| `/widgets/expo-stats.js` | generated at build (`src/pages/widgets/expo-stats.js.ts`) | Participant counter: official count, named countries, continents, tracker date, baked in from the JSON master. Link to tracker with `utm_source=stats-widget` |
| `/widgets/expo-facts.js` | generated | Dates, theme, venue, distances. Link to `/expo-2027` with `utm_source=facts-widget` |
| `/widgets/expo-pavilion.js` | generated | All 21 published pavilions baked in; partner selects with `data-country="<slug>"`. Links to the profile and the directory with `utm_source=pavilion-widget` |
| `/badges/featured-on-belgradebest.svg` | static image | Snippet on `/for-businesses` wraps it in `<a href="https://belgradebest.com/?utm_source=badge&utm_medium=embed">` |
| `/data/expo-2027-participants.json` | static JSON | Open dataset, referenced by Dataset JSON-LD and the tracker page |
| `public/images/qr/<leg>--<slug>.svg` | generated offline (`scripts/gen-listing-qr.mjs`) | Encodes the listing URL + `?utm_source=qr`; offered to claimed businesses in `/manage` |
| `/for-businesses` showroom | static page | Live previews with colour/country controls that rewrite the embed snippet client-side; loads all four widget scripts |

**Properties (all verified in `src/lib/widget-js.ts` and the endpoint files):**

| Property | Status |
|---|---|
| Unique ID per embed | **No.** Only `data-bg/fg/accent` and `data-country` attributes; no partner key or site id |
| Referring site captured | **No.** No `document.referrer`, no `location.host`, no beacon. On click, the browser sends a normal `Referer` (links use `rel="noopener"`, not `noreferrer`), but the UTM parameters take precedence in GA4 source attribution |
| Impressions counted | **No** |
| Clicks counted | **Only** as GA4 sessions arriving with the widget UTM. No click handler inside the widget |
| Partner / domain-level performance | **Not possible** with current tagging: all partners embedding the same widget send identical UTMs. Would require GA4 `page_referrer` analysis or per-partner parameters |
| Bot / abuse filtering | **None** in the app. GA4's own bot filtering applies to sessions; nothing filters script requests |
| Cache headers on `/widgets/` | None set in code or `vercel.json` (Vercel static defaults apply) |
| Future growth API could query this | Only what GA4 holds (sessions by `sessionSource`/`sessionMedium`/`page_referrer`); nothing is stored first-party |

The widget design is explicitly privacy-first: every header comment and the `/for-businesses` FAQ state "no cookies, no analytics, no network requests". This is a product decision that directly limits partner-level measurement.

---

## 8. Affiliate / Commercial Tracking

| Integration | Status |
|---|---|
| **Accommodation affiliate block** | `src/components/StayLinks.astro` renders "Where to book your stay" links for the `stayTargets` an article declares (10 where-to-stay articles declare them). Registry `src/data/stay-affiliates.json`: 10 area targets, `defaultNetwork: "booking"`, each with `enabled: false`, `url: ""`, `status: "none"`. Component filters on `enabled && url`, so **it renders nothing on every page today**. When enabled it would emit the raw `url` verbatim with `rel="sponsored nofollow noopener"`, `target="_blank"`, plus the disclosure line linking `/how-we-make-money` |
| Provider | Named only as the label `"booking"`. No affiliate ID, no URL template, no sub-id, no per-page label |
| Outbound-click measurement | None |
| Revenue / conversions returned into the app | None; no network API, no import |
| Revenue by page/source/channel | Not possible |
| **Booking.com / GetYourGuide / Viator / Airbnb / Expedia / Klook / Omio / Skyscanner etc.** | No links anywhere in rendered code or content. Brand names appear only in editorial prose (unlinked) and in `KB/` research notes. `KB/seo/NEXT-STEPS-2026-09-04.md` proposes a Travelpayouts signup as a future step — plan only |
| **Ads** | None (no AdSense/Ezoic/Mediavine; CSP would block them) |
| **Sponsored listings** | None. `claimed` flag exists on listings (0 set); claimed pages show a "Managed by the team" note. No payment flow |
| **Local business leads** | `/api/listing-request` stores leads as JSON commits (0 in repo at inspection). No CRM, no email autoresponse; owner notification only on `/manage` saves via Resend |
| **Public monetisation statement** | `/how-we-make-money`: "free to read… lightweight, clearly-marked affiliate links — and nothing else… no paid placements… no display-ad clutter". As of this snapshot no affiliate link is active, so the page describes intent rather than current practice |

No credentials of any kind for commercial networks exist in the repo; the local `.env` contains only unrelated legacy variables (names listed in the appendix) and none of them is read by this application.

---

## 9. Social Traffic Attribution

**What GA4 can separate today** (default channel grouping + `sessionSource`, nothing custom):

| Source | Distinguishable? | Note |
|---|---|---|
| Facebook | Yes | Arrives as Organic Social with sources `facebook.com`, `m.facebook.com`, `l.facebook.com`, `lm.facebook.com` (the KB efficiency report of 2026-09-04 lists exactly these). Footer link and `sameAs` point to one Facebook Page |
| Instagram | Yes if traffic arrives (referrer-based); no account configured in the site |
| X | Yes (`t.co`); no account configured (`twitterSite` empty) |
| Pinterest | Yes (referrer); a Pinterest business account is a planned task in `growth-plan.json`, not done; no verification tag |
| Reddit | Yes (referrer); the Reddit account was removed from the footer (`visible: false`) and `sameAs` |
| Direct | Yes (GA4 "Direct") |
| Google organic | Yes (`google` / Organic Search) |
| Bing / DuckDuckGo / Yahoo / Ecosia | Yes as `sessionSource` (not surfaced in the admin, which shows channel groups only) |
| AI assistants (copilot.com, chatgpt.com, perplexity) | Yes as referrers; GA4 now groups some as "AI Assistant" (the KB report shows this) |
| Partner / referral | Yes as Referral for untagged links; widget/badge clicks land in a **separate "embed" medium**, so they will not appear under Referral |

**Individual post tracking:** not possible from the repo. No UTM convention is defined, `scripts/syndicate.mjs` posts bare URLs, footer/social links carry no parameters. Only the widgets, badge and QR carry `utm_source`; none carries `utm_campaign`/`utm_content`, so posts cannot be identified.

**Attribution persistence beyond the landing page:** GA4 session-scoped attribution (source/medium/channel stay attached to the session and, for `firstUser*` dimensions, to the user). No first-party cookie or server-side stitching exists; nothing carries attribution into the lead form or `/manage` saves.

---

## 10. Existing Internal Reports / Admin Tools

All admin pages are server-rendered, gated by `src/middleware.ts` (cookie = sha256 of `ADMIN_ENTRY`/`ADMIN_PASSWORD`; open if unset), `noindex`, excluded from sitemap.

| Tool | Location | What it provides |
|---|---|---|
| **Dashboard** | `/admin` | Built vs planned page counts per leg, indexable/hidden badges, site version, persistence mode |
| **Analytics** | `/admin/analytics` | Live GA4: realtime active users; KPIs (users, sessions, pageviews, engagement rate, avg engagement, views/session) with period deltas; daily/hourly trend chart; channels; devices; new vs returning; top countries; landing pages (sessions, engagement, bounce); top pages. Live GSC: top 25 queries and top 25 pages (clicks, impressions, CTR, position). Ranges Today/7/28/90 days. No caching, no export |
| **Platform overview** | `/admin/platform` | Listing/contact/outreach/claimed counts per leg; booth funnel; inbound leads table (from `src/data/leads/`); GA4 views/users for platform pages with previous-28-day delta; GSC rows for platform pages |
| **Platform manager** | `/admin/platform/[leg]`, `/[leg]/[category]`, `/listings`, `/outreach`, `/history` | Per-listing contact and outreach stage, `mailto:` drafts from `outreach-templates.json`, CSV import of prospects, magic-link issue/revoke, stale (>45 days) flag, GitHub commit history with restore |
| **Growth plan** | `/admin/growth` | Tick-off task list from `src/data/growth-plan.json` (7 phases, 28 tasks, 8 target metrics with baselines for 05 Oct and 01 Dec 2026); live pipeline counters from listing masters. State file currently `{}` (nothing ticked) |
| **Question radar** | `/admin/radar` | Reddit question feed (120 items) ranked by opportunity, mark-as-actioned, "run now" button that dispatches the GitHub workflow |
| **Structure / Links / Navigation** | `/admin/structure`, `/admin/links`, `/admin/navigation` | Edit visibility, order, `linksTo`, header/footer via GitHub commits |
| **Sitemap generation** | build-time | `@astrojs/sitemap` with real `lastmod` (Section 5) |
| **Search Console scripts** | none in repo | GSC is queried only by the admin pages above |
| **Cron jobs** | `.github/workflows/question-radar.yml` (daily 06:00 UTC, commits feed), `.github/workflows/freshness.yml` (Mondays 07:00 UTC, report to run summary + optional webhook) | Last radar commit in history: 2026-08-27; no feed commit since (cause not determinable from the repo) |
| **Content-performance reports** | none automated | `KB/seo/EFFICIENCY-REPORT-2026-09-04.md` and predecessors are hand-assembled snapshots (GA4, GSC, Bing) produced with operator tooling outside the repo |
| **Link monitoring / backlinks** | none in app | Growth plan tracks "Referring domains (Bing InLinks)" manually; baseline 0 |
| **Ranking tracking** | none | GSC position only, no history |
| **Referrer dashboard** | none | Channel groups only |
| **Owner-run scripts** (not deployed) | `scripts/` | `gen-internal-links.mjs`, `gen-glossary-links.mjs`, `gen-faqs.mjs`, `gen-og-default.mjs`, `gen-listing-og.mjs`, `gen-listing-qr.mjs`, hero generators, `syndicate.mjs` (inert), `check-freshness.mjs`, `question-radar.mjs`, `bump-version.mjs` |

---

## 11. Exact Growth Metrics Available TODAY

Only metrics with a working data path are listed. "Accuracy" reflects the data path, not verified figures. "Historical?" = whether the source retains history (GA4/GSC retention is a property setting, not verifiable from code; GSC keeps 16 months).

| Metric | Available? | Source | Accuracy | Historical? | Page-level? | Channel-level? |
|---|---|---|---|---|---|---|
| Total sessions / users / pageviews | Yes | GA4 Data API (admin) | Standard GA4; no bot filter beyond GA4 defaults (KB report notes bot-like Direct traffic from Singapore) | Yes | Yes | Yes |
| Organic search sessions | Yes | GA4 `sessionDefaultChannelGroup` | Good | Yes | Via landing page | Yes |
| Organic by engine (Google vs Bing etc.) | Yes (GA4 UI / API), not in admin | GA4 `sessionSource` | Good | Yes | Yes | Yes |
| Social sessions | Yes | GA4 Organic Social | Good; platform via `sessionSource` | Yes | Yes | Yes |
| Referral sessions | Yes | GA4 Referral + `sessionSource` | Good; widget clicks are in medium `embed`, not Referral | Yes | Yes | Yes |
| Traffic by article | Yes | GA4 `pagePath` (admin top 15/25; full via API) | Good | Yes | Yes | Yes (with source dimension) |
| Traffic by category (leg) | Yes, by path prefix | GA4 `pagePath BEGINS_WITH` (implemented only for platform prefixes; other legs need the same filter) | Good | Yes | Yes | Yes |
| Traffic by Expo page | Yes | `/admin/platform` prefix filter; GA4 | Good | Yes (28-day delta shown) | Yes | Not in admin |
| Landing pages with engagement and bounce | Yes | GA4 `landingPagePlusQueryString` | Good | Yes | Yes | No |
| Engagement rate, avg engagement, views/session | Yes | GA4 | Good | Yes | Partial (top pages have engagement) | No |
| Realtime active users | Yes | GA4 realtime | Good | No | No | No |
| Search Console clicks / impressions / CTR / position | Yes | GSC API (admin top 25/50) | Good; 2-day lag; sampled top rows only | Yes (16 months at source) | Yes | Google only |
| Search queries | Yes (top 25) | GSC | Good | Yes | Not joined to page in admin | Google only |
| Traffic by country | Yes | GA4 `country` (top 8 in admin) | Good | Yes | No (not joined) | No |
| Traffic by device | Yes | GA4 `deviceCategory` | Good | Yes | No | No |
| New vs returning users | Yes | GA4 `newVsReturning` | Good | Yes | No | No |
| Widget-attributed sessions | Yes, if queried | GA4 `sessionSource` = `*-widget`, medium `embed` | Good per widget type; **no partner split** | Yes | Landing page yes | Yes |
| Badge / QR-attributed sessions | Yes, if queried | `utm_source=badge` / `qr` | Same | Yes | Yes | Yes |
| Inbound business leads | Yes (count) | JSON files in `src/data/leads/` (0 today) | Exact | Yes (git) | n/a | No attribution |
| Outreach pipeline (sent/replied/claimed) | Yes | Listing JSON `outreach.status`; `/admin/growth`, `/admin/platform` | Exact but manually maintained | Via git history | n/a | n/a |
| Indexed URL count (Google) | Manual snapshot only | `KB/seo/google-index-sweep-2026-09-04.json` | Point-in-time | No | Yes | n/a |
| Outbound affiliate clicks | **No** | — | — | — | — | — |
| Widget impressions | **No** | — | — | — | — | — |
| Referring domains / backlinks | **No (in app)** | Manual, via Bing WMT outside repo | — | — | — | — |
| Conversions (any) | **No** | — | — | — | — | — |

---

## 12. API / Growth Reporter Feasibility

Context: the site is static; the only compute is Vercel serverless functions under `/admin` and `/api`. A read-only reporter would follow the existing pattern (`prerender = false` route + `src/lib/admin/analytics.ts` helpers + `middleware.ts` gate). The path prefix `/internal/` is not currently gated by the middleware (it gates `/admin` and `/api/admin` only), so the gate would need extending or the routes placed under `/api/admin/growth/*`.

| Endpoint | Data source | Feasibility today | External dependency | Cache need | Auth | Privacy | Difficulty |
|---|---|---|---|---|---|---|---|
| `GET …/summary` | GA4 Data API (`ga4Overview` already returns users, sessions, views, engagement, channels, devices, countries, new/returning) | **High** — existing function returns the shape | GA4 (`GA_PROPERTY_ID`, `GA_CREDENTIALS_JSON`) | Yes: GA4 quota (Data API core tokens per property per hour) and 1–3 s latency; no cache exists. Vercel Runtime Cache or a 15–60 min in-memory/Edge Config cache would be needed | Middleware cookie or a bearer token to add | Aggregates only | Low |
| `GET …/seo` | GSC Search Analytics (`searchConsoleTopQueries/Pages` exist); Bing WMT **not implemented** | **Medium** — Google part exists; Bing needs new code and a `BING_WMT_API_KEY` (proposed in growth plan, not present) | GSC (service account, `webmasters.readonly`), Bing API | Yes; GSC lags 2 days so daily cache is adequate | same | Queries may contain personal names; low risk | Low (Google) / Medium (Bing) |
| `GET …/pages` | GA4 `pagePath` + GSC `page`; leg classification derivable from path and `site-schema.json` | **High** — both halves exist; joining by URL is new code | GA4 + GSC | Yes | same | none | Low–Medium |
| `GET …/referrals` | GA4 `sessionSource`/`sessionMedium`/`page_referrer` — **not currently requested** | **Medium** — needs new GA4 report requests; partner-level split impossible until widgets carry a partner parameter | GA4 | Yes | same | Referrer URLs may include partner page paths; acceptable | Low for source/medium; **blocked** for per-partner |
| `GET …/social` | GA4 `sessionSource` filtered to social + `sessionDefaultChannelGroup = Organic Social` | **Medium** — new request; per-post split impossible without UTM convention | GA4 | Yes | same | none | Low |
| `GET …/expo` | GA4 platform prefix (`ga4PlatformPages` exists), GSC regex (exists), listing masters (published/claimed counts exist), participant dataset, leads count | **High** | GA4 + GSC + build snapshot | Yes | same | Listing `contact`/`outreach` fields must be excluded from any response | Low |

Cross-cutting facts:
- All data would be fetched live; there is **no stored history** in the app, so trend endpoints can only return what GA4/GSC return for the requested window.
- The admin already tolerates missing credentials (returns `configured: false, reason`); a reporter should mirror that.
- Nothing about widget impressions, backlinks, affiliate revenue or conversions can be served because it is not collected.

---

## 13. Recommended Growth JSON

Proposed read-only contract shaped to the data that actually exists. Fields marked `"UNAVAILABLE"` have no data path today and are included only so the strategist knows they are absent.

```json
{
  "project": "belgradebest",
  "generated_at": "2026-09-10T00:00:00Z",
  "period": {
    "days": 28,
    "start": "2026-08-13",
    "end": "2026-09-10",
    "compare_to_previous": true,
    "gsc_lag_days": 2
  },
  "traffic": {
    "source": "ga4",
    "users": { "value": 0, "prev": 0, "delta": null },
    "sessions": { "value": 0, "prev": 0, "delta": null },
    "pageviews": { "value": 0, "prev": 0, "delta": null },
    "engagement_rate": { "value": 0, "prev": 0, "delta": null },
    "avg_engagement_seconds": { "value": 0, "prev": 0, "delta": null },
    "new_vs_returning": { "new": 0, "returning": 0 },
    "channels": [ { "channel": "Organic Search", "sessions": 0 } ],
    "sources": [ { "source": "bing", "medium": "organic", "sessions": 0 } ],
    "devices": [ { "device": "mobile", "users": 0 } ],
    "countries": [ { "country": "Serbia", "users": 0 } ],
    "realtime_active_users": 0,
    "bot_filtering": "ga4-default-only"
  },
  "seo": {
    "google": {
      "source": "gsc",
      "clicks": 0, "impressions": 0, "ctr": 0, "avg_position": 0,
      "top_queries": [ { "query": "", "clicks": 0, "impressions": 0, "ctr": 0, "position": 0 } ],
      "top_pages":   [ { "url": "", "clicks": 0, "impressions": 0, "ctr": 0, "position": 0 } ],
      "branded_share": "UNAVAILABLE (no brand classification implemented)",
      "by_country": "UNAVAILABLE (dimension not requested)",
      "by_device": "UNAVAILABLE (dimension not requested)"
    },
    "bing": "UNAVAILABLE (no Bing Webmaster API integration in the app)",
    "indexation": {
      "sitemap_url_count": 156,
      "google_indexed": "UNAVAILABLE live (manual sweep file dated 2026-09-04 only)"
    },
    "backlinks": "UNAVAILABLE (no backlink source in the app)"
  },
  "top_pages": [
    {
      "url": "/plan-your-trip/airport-to-city",
      "type": "article",
      "leg": "plan-your-trip",
      "lang": "en",
      "pageviews": 0, "users": 0, "avg_engagement_seconds": 0,
      "landing_sessions": 0, "bounce_rate": 0,
      "gsc": { "clicks": 0, "impressions": 0, "position": 0 },
      "last_updated": "2026-06-20"
    }
  ],
  "by_category": [
    { "leg": "expo-2027", "pageviews": 0, "users": 0, "landing_sessions": 0 }
  ],
  "social": {
    "sessions_total": 0,
    "by_platform": [ { "platform": "facebook", "sessions": 0 } ],
    "by_post": "UNAVAILABLE (no UTM convention; syndication posts bare URLs)"
  },
  "referrals": {
    "sessions_total": 0,
    "by_domain": [ { "domain": "", "sessions": 0 } ],
    "embeds": {
      "by_widget": [ { "utm_source": "countdown-widget", "sessions": 0 } ],
      "badge_sessions": 0,
      "qr_sessions": 0,
      "by_partner_domain": "UNAVAILABLE (no per-embed identifier; UTM overrides referrer)",
      "impressions": "UNAVAILABLE (widgets make no requests)"
    }
  },
  "expo": {
    "dataset_updated": "2026-08-20",
    "official_count": 141,
    "named_countries": 93,
    "pavilion_profiles_published": 21,
    "exhibitor_pages_published": 1,
    "listings_total": 79,
    "listings_claimed": 0,
    "outreach": { "sent": 0, "replied": 0, "claiming": 0, "live": 0 },
    "leads_received": 0,
    "traffic": {
      "hub": 0, "tracker": 0, "countdown": 0, "pavilions_directory": 0,
      "pavilion_pages": [ { "slug": "germany", "pageviews": 0, "users": 0, "prev_pageviews": 0 } ],
      "de_cluster": 0
    },
    "gsc_platform_pages": [ { "url": "", "clicks": 0, "impressions": 0, "position": 0 } ],
    "dataset_downloads": "UNAVAILABLE (static JSON, not tracked)"
  },
  "affiliate": {
    "links_enabled": 0,
    "clicks": "UNAVAILABLE (no click tracking)",
    "revenue": "UNAVAILABLE (no network integration)"
  },
  "conversions": "UNAVAILABLE (no events defined)",
  "data_quality": {
    "ga4_configured": true,
    "gsc_configured": true,
    "cache": "none (live API calls per request)",
    "history_stored_in_app": false,
    "known_issues": [
      "Direct traffic includes bot-like sessions (see KB efficiency report 2026-09-04)",
      "Widget UTMs hide the partner referrer",
      "GA4 enhanced-measurement events not verifiable from code"
    ]
  }
}
```

---

## 14. Measurement Gaps

### CRITICAL

1. **No conversion or action events.** Lead-form submissions, `/manage` saves, outbound clicks, JSON downloads and widget-code copies are invisible to GA4. *Decision blocked:* which content or channel produces business value (claims, leads) cannot be known; CAC per channel is impossible.
2. **No partner-level attribution for embeds.** All embeds of a widget share one UTM pair and the UTM suppresses the referrer in GA4 source reports. *Decision blocked:* which partner sites and outreach targets are worth more effort; ROI of the backlink/embed programme.
3. **Bing, the channel the owner's reports identify as the one that ranks the site, has no data path in the app.** *Decision blocked:* automated monitoring of the primary organic channel; the 05 Oct language-expansion gate depends on Bing impressions read by hand.
4. **No stored history.** Nothing in the app snapshots GA4/GSC results; every view is a live query. *Decision blocked:* trend analysis beyond GA4/GSC retention, and any offline analysis of the growth-plan targets.

### IMPORTANT

5. **Referrer / source dimensions are not surfaced in the admin** (only channel groups). Referring domains, engine split (Bing vs Google vs DuckDuckGo) and AI-assistant referrals require the GA4 UI. *Unreliable:* channel prioritisation from the admin alone.
6. **No UTM convention** for social posts, outreach emails or syndication. *Impossible:* per-post and per-campaign social measurement.
7. **Indexation is a manual snapshot** (`google-index-sweep-2026-09-04.json`); no URL Inspection or sitemap-status integration. *Unreliable:* "indexed URLs" target in the growth plan.
8. **No backlink data source** in the app. *Unreliable:* "referring domains" target (baseline 0) is tracked by hand.
9. **No bot filtering** beyond GA4 defaults; KB reports flag bot-like Direct traffic from Singapore. *Unreliable:* total-traffic KPIs and the "GA4 sessions ex-bots" target.
10. **Affiliate block dormant and untracked.** *Impossible:* revenue per page, per channel, or per stay-target once links are enabled.
11. **Daily question-radar job has not committed since 2026-08-27.** *Unreliable:* the `/admin/radar` feed is stale; cause not determinable from the repo.

### NICE TO HAVE

12. GSC `country` and `device` dimensions not requested (available with one extra request each).
13. Branded vs non-branded query classification.
14. Widget impression counting (would contradict the "no requests" promise; a server-side count of `/widgets/*.js` fetches from Vercel logs would be the non-invasive route).
15. Dataset download counting for `/data/expo-2027-participants.json`.
16. `twitter:site`, HSTS, verification meta tags, image sitemap, hreflang entries in the sitemap.
17. Admin response caching to protect GA4 quota.
18. Business-facing visitor numbers in `/manage` (promised on `/for-businesses`).

---

## 15. Files Inspected

**Config and build:** `astro.config.mjs`, `vercel.json`, `.vercelignore`, `package.json`, `.env.example` (names only), `.github/workflows/question-radar.yml`, `.github/workflows/freshness.yml`, `dist/client/sitemap-0.xml`, `dist/client/robots.txt`, `.vercel/output/static/widgets/`

**Analytics and admin:** `src/components/Analytics.astro`, `src/lib/admin/analytics.ts`, `env.ts`, `store.ts`, `platform-store.ts`, `notify.ts`, `outreach-draft.ts`, `src/middleware.ts`, `src/layouts/AdminLayout.astro`, `src/pages/admin/*.astro`, `src/pages/admin/platform/*.astro`, `src/pages/api/admin/*.ts`, `src/pages/api/manage/save.ts`, `src/pages/api/listing-request.ts`, `src/pages/manage/index.astro`

**SEO:** `src/lib/metadata.ts`, `schemas.ts`, `i18n.ts`, `hero.ts`, `og.ts`, `links.ts`, `clusters.ts`, `content-plan.ts`, `src/layouts/BaseLayout.astro`, `ArticleLayout.astro`, `LegHubLayout.astro`, `UtilityPageLayout.astro`, `ListingPage.astro`, `src/pages/robots.txt.ts`, `rss.xml.ts`, `llms.txt.ts`, `llms-full.txt.ts`, `404.astro`, `src/components/SiteFooter.astro`, `Schema.astro`, `MarkdownInline.astro`, `public/manifest.webmanifest`

**Content and data:** `src/content.config.ts`, `src/content/articles/**` (counts, sample frontmatter), `src/content/de/**`, `src/data/site-schema.json`, `site-config.json`, `site-pages.json`, `areas.json`, `glossary.json`, `expo-participants.json`, `listings/expo-2027/*.json` (79, tallied), `stay-affiliates.json`, `outreach-templates.json`, `growth-plan.json`, `growth-plan-state.json`, `radar/questions.json`, `radar/state.json`, `leads/`, `src/lib/listings.ts`, `expo-participants.ts`, `areas.ts`, `glossary.ts`, `articles.ts`, `site.ts`

**Routes:** `src/pages/index.astro`, `[leg]/index.astro`, `[leg]/[slug].astro`, `areas/*`, `glossary/*`, `expo-2027/index.astro`, `tracker.astro`, `countdown.astro`, `corporate-area.astro`, `pavilions/*`, `de/expo-2027/*`, `data/expo-2027-participants.json.ts`, `for-businesses.astro`, `about/contact/privacy/how-we-make-money.astro`

**Widgets and distribution:** `src/lib/widget-js.ts`, `src/pages/widgets/expo-facts.js.ts`, `expo-stats.js.ts`, `expo-pavilion.js.ts`, `public/widgets/expo-countdown.js`, `public/badges/featured-on-belgradebest.svg`, `public/14ec77dc669e4a48947348a73e9ee9b7.txt`, `src/components/StayLinks.astro`

**Scripts:** `scripts/syndicate.mjs`, `question-radar.mjs`, `check-freshness.mjs`, `gen-listing-qr.mjs`, `gen-listing-og.mjs`, `push-to-git.bat` (referenced), `_parity.mjs`

**Documentation (context only):** `CLAUDE.md`, `KB/platform/PLATFORM-PLAN.md`, `TRACKER-NEWS-PLAYBOOK.md`, `PROSPECT-RESEARCH-RUNBOOK.md`, `KB/seo/EFFICIENCY-REPORT-2026-09-04.md`, `NEXT-STEPS-2026-09-04.md`, `FULL-AUDIT-REPORT-2026-07-02.md`, `google-index-sweep-2026-09-04.json`, `KB/automation/RUNBOOK.md`, `question-radar.md`

**Not inspected / not verifiable from the repo:** Vercel project environment variables, GA4 property settings (enhanced measurement, retention, key events), GSC/Bing property state, live production HTML.

---

## 16. Final Assessment

| Dimension | Score | Basis |
|---|---|---|
| **CURRENT MEASUREMENT READINESS** | **4/10** | GA4 + GSC wired into a working admin with page-level and channel-group data; but no events, no conversions, no stored history, no bot handling, no caching |
| **SEO DATA READINESS** | **5/10** | Strong technical SEO foundation (canonicals, real lastmod sitemap, rich JSON-LD, hreflang, IndexNow, llms.txt) and live GSC clicks/impressions/position; missing Bing, indexation, backlinks, query classification, history |
| **SOCIAL ATTRIBUTION READINESS** | **3/10** | Platform-level split via GA4 referrers only; one live Facebook Page; no UTM convention, no pixel, inert syndication script |
| **REFERRAL / PARTNERSHIP READINESS** | **3/10** | Excellent link-earning assets (four widgets, badge, open dataset, QR, outreach templates) but measurement stops at "which widget type", with no partner id, impressions or click counts |
| **GROWTH API READINESS** | **4/10** | The helper layer (`analytics.ts`) and auth pattern make summary/pages/expo endpoints straightforward; referrals/social need new GA4 dimensions; Bing, backlinks, conversions and affiliate data have no source at all |

### Five facts a growth strategist must know before planning acquisition

1. **The site is static, file-based and rebuilt on every commit.** There is no database and no runtime server for public pages. Any new tracking must be either client-side GA4 configuration/events or a new serverless function; first-party event storage would be a new architectural piece (the admin persists via GitHub commits, which is unsuitable for event volume).
2. **Measurement today is GA4 defaults plus Search Console top-25 lists.** Sessions, pageviews, landing pages, channel groups, devices, countries and Google clicks/impressions/positions are available and page-addressable. Nothing downstream of a pageview (clicks, leads, claims, downloads) is measured, and nothing is stored historically in the app.
3. **Bing is the ranking channel by the owner's own reports, and the app cannot see it.** The KB efficiency report (04 Sep 2026, produced outside the repo) records Google at 2 clicks/28 days with average position ~45 and zero referring domains, while Bing-index engines supplied 56 of 60 organic sessions. Any Bing-based KPI is currently hand-collected.
4. **The Expo 2027 distribution assets are built for links, not for measurement.** Widgets, badge and dataset are deliberately tracking-free; attribution is one UTM pair per widget type. Partner-level performance, impressions and the referring domain of a widget click cannot be reported without changing the widget contract (for example a `data-site` attribute or per-partner `utm_content`).
5. **Monetisation and the business funnel are unstarted and unmeasured.** Zero affiliate links are enabled (registry is all `enabled: false`), zero listings are claimed, zero leads are stored, outreach is manual `mailto:`, and the ticket-alert subscriber metric in the growth plan has no corresponding feature in the code. Growth targets that reference these (claims, outreach replies, subscribers) can only be tracked by hand or through Git history until events and a UTM convention exist.
