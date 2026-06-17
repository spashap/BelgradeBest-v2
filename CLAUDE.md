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
- **No runtime backend, no DB.** Content + structure live in committed files.
- **Local dev/preview run on `http://localhost:5000`** (`npm run dev` / `npm run preview`;
  set in `astro.config.mjs`). The local admin is a separate process on `:4000`.

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
public/images/                       # heroes — FLAT: images/expo-2027/<slug>-hero.png ; legs/<leg>/hero.png
scripts/port-content.mjs             # one-time porter (NOT deployed; .vercelignore)
admin/                               # LOCAL-ONLY operator tool (NOT deployed; own package.json)
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
- **Heroes** → `public/images/expo-2027/<slug>-hero.png` (FLAT dir, all legs — locked
  convention `lib/hero.ts` depends on; do NOT reorganize) and `images/legs/<leg>/hero.png`.
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

## SEO / indexing posture

Per-leg `noindex` in `site-schema.json` is preserved from the old site. **Indexable
today: `expo-2027`, `food-and-nightlife`, `medical-tourism`.** The other legs
(`visit-belgrade`, `plan-your-trip`, `where-to-stay`, `invest-and-relocate`) are
`noindex` and are **excluded from the sitemap**. The porter propagates leg `noindex`
to each article's frontmatter. **To turn a leg on for search:** set `noindex: false`
on the leg in `site-schema.json` AND update the affected articles' frontmatter
`noindex` (or re-run the porter). The sitemap re-includes it automatically.

Astro adds `id` anchors to body headings (only difference from the old
`react-markdown` output) — kept intentionally as an SEO win (jump links + AI passage
citation). SmartyPants is OFF (`astro.config.mjs`) so quotes/dashes are not rewritten.

## Analytics (public site)

`PUBLIC_GA4_ID` (Vercel build env) injects GA4; Vercel Web Analytics is auto-served.
Both load in **production only** (`components/Analytics.astro` gates on `import.meta.env.PROD`)
— never in `astro dev`.

## Local admin (never deployed)

`cd admin && npm install && npm start` → `http://127.0.0.1:4000`. Local-only
(`isLocalOnly()` → 403 if `VERCEL`/`NODE_ENV=production`; also `.vercelignore`'d).
Edits the SAME `src/data/site-schema.json` the site reads (atomic, fresh-read-per-op):
**Links** (per-article `linksTo`), **Structure** (visibility/reorder), **Analytics**
(GA4 Data API + Vercel dashboard link). "Live" = a content `.md` exists. GA4 needs
`GA_PROPERTY_ID` + `GOOGLE_APPLICATION_CREDENTIALS` in `admin/.env` (+ once:
`npm approve-scripts protobufjs`).

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

## What NOT to do

- Do not reintroduce a content-generation pipeline, a DB, or any runtime server to
  the public site (it must stay static).
- Do not import from / path-reference `../BelgradeBest` anywhere except the porter.
- Do not invent components or hardcode styles outside `globals.css`.
- Do not reorganize the flat `public/images/expo-2027/` hero dir (update `lib/hero.ts`
  in lockstep if you ever must).
- Do not move the production domain to V2 without the owner's explicit go (old
  project is the rollback).
- Do not deploy `admin/` or `scripts/` (they are `.vercelignore`'d — keep it that way).
```
