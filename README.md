# BelgradeBest-V2

A simple, fast, SEO-first **static** site for Belgrade, built with **Astro** (SSG).
Pure static HTML on Vercel — no server, no DB, no content-generation pipeline.
Content is plain Markdown + JSON that you and Claude Code edit by hand.

This is the standalone successor to the old Next.js + pipeline project at
`../BelgradeBest` (which stays frozen as a rollback). The only link between them
was the one-time content port (`scripts/port-content.mjs`); V2 builds with the
old folder absent.

## Layout

```
src/
  content/articles/<leg>/<slug>.md   # article body (Markdown) + frontmatter metadata
  data/site-schema.json              # STRUCTURE master: legs, slugs, order, SEO, noindex, linksTo
  data/site-config.json              # chrome / layout tokens / SEO defaults
  data/site-pages.json               # standalone pages (about / privacy / contact / how-we-make-money)
  layouts/                           # BaseLayout + Article(T3) / LegHub(T2) / UtilityPage
  components/                        # ported L3 component library (.astro)
  lib/                               # clusters, metadata, schemas, hero, links, content-plan, …
  pages/                             # routes: index, [leg]/index, [leg]/[slug], standalone, robots.txt
  styles/globals.css                 # the design system (tokens + L3 classes), ported verbatim
public/images/                       # heroes — flat: images/expo-2027/<slug>-hero.png ; legs/<leg>/hero.png
scripts/port-content.mjs             # ONE-TIME porter (reads ../BelgradeBest/frontend; not deployed)
admin/                               # LOCAL-ONLY operator tool (not deployed)
```

## Develop / build

```bash
npm install
npm run dev       # local dev (analytics tags are NOT emitted in dev)
npm run build     # static output → dist/  (sitemap-index.xml + robots.txt included)
npm run preview   # serve dist/ locally
```

## Editing the site (you + Claude Code)

- **Article text** → edit `src/content/articles/<leg>/<slug>.md` (body is Markdown, H2+).
- **Article metadata / SEO** → the frontmatter of that same file.
- **Related "Read next" links** → `linksTo` on the slug in `src/data/site-schema.json`
  (full hrefs like `/visit-belgrade/zemun`, or a bare same-leg slug). The site
  resolves each target's title/teaser/hero automatically — links are references.
- **Structure / nav / chrome / layout** → the three `src/data/*.json` masters.
- A new leg or article: add the leg to `LEGS` in `src/content.config.ts`, add a leg
  entry in `site-schema.json`, drop a `.md` in `src/content/articles/<leg>/`, and a
  hero at `public/images/expo-2027/<slug>-hero.png`.

## Re-porting from the old project

`node --experimental-strip-types scripts/port-content.mjs` re-reads the old
`../BelgradeBest/frontend` tree and regenerates `src/content/articles/**`,
normalizes `linksTo`, and copies images. Idempotent. (Only needed if you change
something in the old project; normally V2 is self-contained.)

## Local admin (never deployed)

```bash
cd admin && npm install && npm start   # http://127.0.0.1:4000
```
Local-only (403 if `VERCEL` or `NODE_ENV=production`); excluded from the Vercel
build via `.vercelignore`. Manages related links + structure (writes the same
`src/data/site-schema.json` the site reads) and shows analytics. For GA4 set
`GA_PROPERTY_ID` + `GOOGLE_APPLICATION_CREDENTIALS` in `admin/.env`
(and `npm approve-scripts protobufjs` once). Vercel analytics is viewed in the
Vercel dashboard.

## Analytics on the public site

`PUBLIC_GA4_ID` (Vercel build env) injects GA4; Vercel Web Analytics is auto-served.
Both load in **production only** — never in `astro dev`.

## SEO / indexing posture

Canonical + sitemap use the production domain (`site` in `astro.config.mjs`) even
while served from a temporary `*.vercel.app` URL. Per-leg `noindex` in
`site-schema.json` is preserved from the old site: indexable today are
**expo-2027, food-and-nightlife, medical-tourism**; the other legs are `noindex`
and excluded from the sitemap. **To turn a leg on for search:** set its
`noindex: false` in `site-schema.json` (and re-run the porter or hand-edit the
affected articles' frontmatter `noindex`). The sitemap re-includes it automatically.

## Handoff checklist (deploy — parallel to the old site)

1. Create the GitHub repo `spashap/BelgradeBest-v2` (empty), then:
   `git remote add origin https://github.com/spashap/BelgradeBest-v2 && git push -u origin main`
2. New Vercel project on that repo: root = repo root, build `astro build`, output `dist`.
   It deploys to a temporary `*.vercel.app` URL. Set `PUBLIC_GA4_ID` env.
3. Verify on the temp URL (head/JSON-LD/body vs the live site, sitemap, robots, CWV).
4. **Only after you're satisfied:** move the production domain from the old Vercel
   project to this one, and re-point GA4 / Search Console. The old project stays as
   instant rollback.
