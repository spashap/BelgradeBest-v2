# BelgradeBest-V2 — Standing Brief

**Read this first in every new session.** This is the simplified, pipeline-free
successor to the old project. Read the data masters and this file before acting.

## What this project is

BelgradeBest is an English-first, SEO-oriented evergreen guide to Belgrade for
foreign visitors (leisure + business/investor), with Expo 2027 (15 May–15 Aug
2027) as a traffic trigger feeding the permanent guide. **V2 is a simple, fast,
static site that the owner + Claude Code edit by hand** — there is no LLM content
pipeline, no database, no server at runtime. The strategy/identity/IA are
inherited from the old project and are NOT being redesigned.

## Architecture (locked)

- **Astro SSG.** Node only at BUILD time; output is **pure static HTML** in `dist/`.
- **Deploy:** Vercel (static). `site` = `https://belgradebest.com` in
  `astro.config.mjs`, so canonical + sitemap URLs are correct even while served
  from a temporary `*.vercel.app` URL. The production domain switch is manual.
- **No DB.** Content + structure live in committed files. The PUBLIC site is fully
  static (prerendered). The ONLY server-rendered parts are the `/admin` pages +
  `/api/admin/*` endpoints (`export const prerender = false` → Vercel serverless
  functions via `@astrojs/vercel`); they don't affect public-page performance.
- **Local dev/preview run on `http://localhost:5000`** (`npm run dev` / `npm run preview`;
  set in `astro.config.mjs`). `/admin` lives at `localhost:5000/admin` in dev.

### Relationship to the old project (rollback)
The old Next.js + content-pipeline project at **`../BelgradeBest`** is FROZEN as a
backup/rollback (its own repo `spashap/belgradebest`, its own Vercel project, still
on the production domain until an explicit switch). The ONLY link was the one-time
porter `scripts/port-content.mjs` (reads the old `frontend/` tree). **V2 is
self-contained — it builds with the old folder absent. Do not add imports/paths to
`../BelgradeBest` anywhere except that porter (which is excluded from build + deploy).**

## Repo layout

```
src/
  content/articles/<leg>/<slug>.md   # article BODY (Markdown, H2+) + frontmatter metadata
  content.config.ts                  # 'articles' collection + Zod schema; LEGS enum
  data/site-schema.json              # STRUCTURE master: legs, slugs, order, visible, SEO, noindex, linksTo
  data/site-config.json              # chrome / layout tokens / SEO defaults / homepage / expo facts
  data/site-pages.json               # standalone pages: about / how-we-make-money / contact / privacy
  layouts/  BaseLayout · ArticleLayout(T3) · LegHubLayout(T2) · UtilityPageLayout
  components/                        # ported L3 component library (.astro) + Analytics.astro
  lib/                               # clusters, content-plan, schemas, metadata, hero, leg-status, links, articles, site, routes, types
  pages/  index.astro · [leg]/index.astro · [leg]/[slug].astro · about/privacy/contact/how-we-make-money · robots.txt.ts
  styles/globals.css                 # THE design system (tokens + L3 classes), ported verbatim
public/images/                       # heroes — FLAT: images/expo-2027/<slug>-hero.webp (+ -640/-960 variants) ; legs/<leg>/hero.webp
  middleware.ts                      # auth gate for /admin (open until ADMIN_PASSWORD set)
  pages/admin/ + pages/api/admin/    # the /admin app (server-rendered, prerender=false)
  lib/admin/                         # env, store (GitHub/local), analytics
scripts/port-content.mjs             # one-time porter (NOT deployed; .vercelignore)
```

## The Design Law (enforce on every page)

Compose from `src/styles/globals.css` (the ported L3 library) and its `:root`
tokens. **Never invent components. Never hardcode hex/px.** Variants = modifier
classes (`.c-btn--ghost`). New repeating pattern → add to `globals.css` first,
then use. Identity: Warm Editorial (cream paper, brick accent; `--font-display`
Inter, `--font-body` Newsreader, self-hosted via `@fontsource`). The four layout
knobs (widths + grid cols) live in `site-config.json` and are injected by
`BaseLayout.astro` as `<style id="site-layout">` (the CSS↔JSON bridge) — globals.css
does not define them.

## Content model (how to edit)

- **Article body** → `src/content/articles/<leg>/<slug>.md` (Markdown, H2+, no raw
  HTML; the H1/lede/hero/FAQ/links render from frontmatter, not the body).
- **Article metadata/SEO** → that file's YAML frontmatter (schema in
  `src/content.config.ts`): `title, shortTitle, description, lede, heroLabel,
  heroAlt?, lastUpdated, order, visible, intent, priority, noindex, linksTo, faqs,
  unknowns`. **Article SEO is per-file frontmatter now** (no separate registry).
- **Related "Read next" links** → `linksTo` on the slug in `site-schema.json` (the
  editable MASTER). Entries are internal hrefs (`/visit-belgrade/zemun`) or bare
  same-leg slugs. `lib/links.ts relatedFor()` resolves each target's title/teaser/
  hero — links are references, never copied titles.
- **Structure / nav / chrome / layout / homepage** → the three `src/data/*.json`
  masters. **Single-source law: store references (slugs/hrefs); derive titles/labels
  at render** (`clusters.ts`, `content-plan.ts`, `links.ts`).
- **Heroes** → `public/images/expo-2027/<slug>-hero.webp` (FLAT dir, all legs — locked
  convention `lib/hero.ts` depends on; do NOT reorganize) and `images/legs/<leg>/hero.webp`.
  Each master has `-640.webp`/`-960.webp` responsive variants (emitted by
  `gen-hero.mjs`/`optimize-heroes.mjs`; `lib/hero.ts` builds `srcset` from them).
  The old PNG fallbacks were deleted 2026-07-02 (webp coverage is 100%).
  Cache-busted by file mtime.
- **New article**: add the `.md` (frontmatter `leg` + `slug`), add/confirm the slug
  in `site-schema.json`, drop a hero PNG. **New leg**: also add it to `LEGS` in
  `content.config.ts` and add a leg entry in `site-schema.json` (slug = path segment
  = collection folder = everything, all move together).

## Rendering (one template per page type)

`ArticleLayout` (T3), `LegHubLayout` (T2 — built cards vs planned stubs), home
(`index.astro`), `UtilityPageLayout`. All wrap `BaseLayout` (head: title/desc/
canonical/OG/twitter/robots, favicon/manifest, Organization JSON-LD, Analytics).
Article body renders via Astro's native content `render()` (`<Content/>`); short
inline markdown (leg body, utility pages) via `components/MarkdownInline.astro`
(`marked`). JSON-LD: Article + Breadcrumb everywhere, Event on `expo-2027`, FAQPage
when `faqs` present.

## SEO / indexing posture (updated 2026-07-02)

Per-leg `noindex` lives in `site-schema.json`. **Indexable today: everything
except `invest-and-relocate`** — `expo-2027`, `food-and-nightlife`,
`medical-tourism`, `visit-belgrade`, `plan-your-trip`, `where-to-stay` are all
live in the sitemap, and the programmatic sets are flipped on too
(`site-config.json → programmatic.glossaryIndexable` and `areasIndexable` are
both `true`). Only `invest-and-relocate` remains `noindex` + hidden. **To turn a
leg on/off for search:** set `noindex` on the leg in `site-schema.json` AND
update the affected articles' frontmatter `noindex` (or re-run the porter). The
sitemap re-includes/excludes it automatically. Sitemap `lastmod` is real per-page
(article frontmatter `lastUpdated`; `updated` fields in glossary/areas/site-pages
JSON; hubs inherit their newest child) — do NOT let it fall back to build time.

**Claimable listings (platform, Phase 1 — see `KB/platform/PLATFORM-PLAN.md`):**
per-listing masters `src/data/listings/<leg>/<slug>.json` → `src/lib/listings.ts`
(thin-content guard `validListing`, per-leg URL segment map `SECTION`) → pages
`src/pages/expo-2027/pavilions/` (hub + `[slug]`). Ships **noindex-first** behind
`site-config.json → programmatic.listingsIndexable` (astro.config mirrors the
gate + a `LISTING_SECTION` copy of the segment map — keep in sync). Bump each
listing's `updated` on edit (drives dateModified + sitemap lastmod). The Expo
data page `/expo-2027/tracker` renders `src/data/expo-participants.json` (bump
its `updated` too); `/expo-2027/countdown`, `/for-businesses`, badge + widget
in `public/` are the Phase-0 link assets.

A full SEO audit + prioritized fixes live in `KB/seo/FULL-AUDIT-REPORT-2026-07-02.md`
and `KB/seo/ACTION-PLAN-2026-07-02.md` (most items applied 2026-07-02; the www-TLS
cert fix in Vercel Domains and `brand.sameAs` population remain owner actions).

Astro adds `id` anchors to body headings (only difference from the old
`react-markdown` output) — kept intentionally as an SEO win (jump links + AI passage
citation). SmartyPants is OFF (`astro.config.mjs`) so quotes/dashes are not rewritten.

## Analytics (public site)

`PUBLIC_GA4_ID` (Vercel build env) injects GA4; Vercel Web Analytics is auto-served.
Both load in **production only** (`components/Analytics.astro` gates on `import.meta.env.PROD`)
— never in `astro dev`.

## Admin (`/admin`, in the app — analytics + front-end settings control)

`/admin` is part of the site (server-rendered routes, deployed on Vercel), NOT a
separate tool. Sections: **Dashboard**, **Links** (per-article `linksTo`),
**Structure** (visibility / reorder), **Analytics** (GA4 + Vercel link). "Live" =
the slug is in the `articles` content collection.

- **Persistence = GitHub commit → rebuild.** A save edits `src/data/site-schema.json`
  via the GitHub Contents API (`GITHUB_TOKEN` + `GITHUB_REPO` + `GITHUB_BRANCH`),
  which auto-triggers a Vercel rebuild so the static site goes live (~1 min). NO DB.
  In dev (no token) it writes the local file directly (instant). Code: `src/lib/admin/store.ts`.
- **Auth (`src/middleware.ts`)**: `ADMIN_PASSWORD` is SET in production — `/admin`
  302s to `/admin/login` (verified live 2026-07-02). Unsetting the env var would
  leave it open; the cookie is a hash of the password. Nothing else changes.
- **Analytics**: GA4 Data API via `GA_PROPERTY_ID` + `GA_CREDENTIALS_JSON` (inline
  service-account JSON; on Vercel needs `npm approve-scripts protobufjs` to have run
  at install — Vercel runs install scripts normally). Vercel Web Analytics is viewed
  in the Vercel dashboard. Code: `src/lib/admin/analytics.ts`.
- All admin routes are `noindex` + excluded from the sitemap.

## Automated SEO / marketing (added 2026-06-21 — see `KB/automation/RUNBOOK.md`)

Low-effort, fully-automatable growth tactics. **Automatic on every build:** richer
JSON-LD (`lib/schemas.ts` — Organization logo/sameAs, Article author/publisher.logo);
OG/Twitter social-card tags on every page (`lib/metadata.ts` + `BaseLayout`, hero or
the branded `public/images/og-default.png`); `/rss.xml` + `/llms.txt` endpoints;
IndexNow ping on production builds only (`indexNow()` integration in
`astro.config.mjs`, key file `public/<key>.txt`). **Owner-run scripts** (need `.env`,
NOT deployed): `gen-internal-links.mjs` (append-only `linksTo` filler),
`gen-faqs.mjs` (AEO FAQ generation → frontmatter `faqs` → FAQPage JSON-LD),
`gen-og-default.mjs`, and `syndicate.mjs` (social posting — INERT until X/LinkedIn/
Facebook tokens are set; add profile URLs to `brand.sameAs`). New config keys:
`brand.logoPath`, `brand.sameAs`, `seo.defaultOgImage`, `seo.twitterSite`.

## Knowledge pages — `/glossary` (hub-and-spoke SEO, built 2026-06-22)

First "knowledge pages" spoke set (spec: `KB/automation/knowledge-pages-spec.md`),
same machinery as `/areas`: data `src/data/glossary.json` → lib `src/lib/glossary.ts`
(`validTerm` thin-content guard) → pages `src/pages/glossary/[term].astro` +
`index.astro` → branded SVG thumbs (`scripts/gen-glossary-thumbs.mjs`). Per page:
`Article` + `DefinedTerm` + `BreadcrumbList` + `FAQPage` JSON-LD. **Ships
noindex-first** behind `site-config.json → programmatic.glossaryIndexable`
(**flipped to `true` — glossary + areas are live and indexable**).
The multiplier is the owner-run `scripts/gen-glossary-links.mjs`, which wraps the
first mention of each term in article bodies in a link to its spoke (append-only,
idempotent). Run/publish steps: `KB/automation/RUNBOOK.md → Knowledge pages`.

## Commands

```bash
npm install && npm run dev        # http://localhost:5000  (no analytics tags in dev)
npm run build                     # → dist/ (sitemap-index.xml + robots.txt)
npm run preview                   # serve dist/ on :5000
node --experimental-strip-types scripts/port-content.mjs   # re-port from ../BelgradeBest (rare)
```

This machine's npm has an allow-scripts guard: after installs, approve native
build scripts once (`npm approve-scripts esbuild`, `sharp`; `protobufjs` in admin/).

## How we work

- The human (CTO) decides; Claude Code implements and **hands visible/browser checks
  back to the human with exact steps — does not start/kill the dev server to
  self-verify** (verify non-visible things by static inspection of `dist/`).
- Commit/push only when asked. The remote is `spashap/BelgradeBest-v2` (set it up if
  absent). End commit messages with the Co-Authored-By trailer.
- **ALWAYS update `scripts/commit-message.txt` as the final step of any change set the
  owner will push.** When run with no argument, `push-to-git.bat` commits this file
  VERBATIM via `git commit -F` (first line = subject, rest = body), so write it as a
  complete commit message and **end it with the `Co-Authored-By: Claude
  <noreply@anthropic.com>` trailer**. A stale file = a misleading commit. The owner has
  had to remind about this repeatedly — do it automatically, before telling them to run
  the bat. (The bat reads the file directly, so punctuation in the message is always safe.)
- `push-to-git.bat` now pulls (`--no-rebase --no-edit -X theirs`) before pushing, because
  the question-radar job commits its feed to GitHub and can leave origin ahead of the
  owner's machine. Don't remove that sync step.
- **Site versioning (V<MM>.<mmm>)**: master `src/data/version.json`, formatted by
  `src/lib/version.ts`, shown in the public footer + admin dashboard. `push-to-git.bat`
  auto-runs `scripts/bump-version.mjs` (minor +1) before each push when the tree is
  dirty. Major bump is an owner command only: `node scripts/bump-version.mjs --major`
  (major +1, minor resets to 001). Never bump by hand-editing the JSON.

## What NOT to do

- Do not reintroduce a content-generation pipeline, a DB, or any runtime server to
  the public site (it must stay static).
- Do not import from / path-reference `../BelgradeBest` anywhere except the porter.
- Do not invent components or hardcode styles outside `globals.css`.
- Do not reorganize the flat `public/images/expo-2027/` hero dir (update `lib/hero.ts`
  in lockstep if you ever must).
- Do not move the production domain to V2 without the owner's explicit go (old
  project is the rollback).
- Do not make PUBLIC pages server-rendered — only `/admin` + `/api/admin/*` may set
  `prerender = false`. Keep the public site static.
- Do not deploy `scripts/` (`.vercelignore`'d). Do not leave `/admin` write-enabled
  AND password-less for long — set `ADMIN_PASSWORD` once the token is wired.
```
