# Automated marketing — implementation runbook

Built 2026-06-21. Implements the low/very-low-effort tactics from
`automated-marketing-plan.md` (#1, #2, #3, #4, #6, #10, #12, #11). All public
output stays static; the scripts run on the owner's machine and are NOT deployed
(`scripts/` is `.vercelignore`'d).

> **Status (2026-06-21): DEPLOYED.** The 5 build-automatic features (#3 IndexNow,
> #4 llms.txt, #6 schema, #10 OG cards, #12 RSS) are live. The two owner-run
> scripts **#1 `gen-internal-links.mjs` and #2 `gen-faqs.mjs` were run, reviewed,
> and pushed** — internal links are filled and FAQ blocks/JSON-LD are generated
> across articles. Remaining tactics below are pending the owner's green light.

---

## What's automatic on every build/deploy (no action needed)

| Feature | Where | Verify after deploy |
|---|---|---|
| **#6 Richer JSON-LD** — Organization `logo`+`sameAs`, Article `author`+`publisher.logo`+`isPartOf`+`datePublished` | `src/lib/schemas.ts` | Google **Rich Results Test** on any article URL |
| **#10 OG / social cards** — `og:image`, `og:image:alt`, `twitter:image` on every page (article hero, else branded default) | `src/lib/metadata.ts`, `src/layouts/BaseLayout.astro`, `ArticleLayout.astro`; default at `public/images/og-default.png` | Paste a URL into the **LinkedIn Post Inspector** / X card validator |
| **#12 RSS feed** — `/rss.xml` (newest 50 indexable articles) + `<head>` discovery link | `src/pages/rss.xml.ts`, `BaseLayout.astro` | open `https://belgradebest.com/rss.xml` |
| **#4 llms.txt** — `/llms.txt` site map for AI answer engines | `src/pages/llms.txt.ts` | open `https://belgradebest.com/llms.txt` |
| **#3 IndexNow ping** — submits indexable URLs to Bing/Yandex/Seznam on **production** builds only | `astro.config.mjs` (`indexNow()` integration) + key file `public/14ec77dc669e4a48947348a73e9ee9b7.txt` | build log line "submitted N URLs → 200"; key file must load at `https://belgradebest.com/14ec77dc669e4a48947348a73e9ee9b7.txt` |

IndexNow notes: the key is public by design. It only fires when `VERCEL_ENV=production`
(set automatically by Vercel for prod), never in dev/preview, and never fails the
build. One-time nicety: also add the site to **Bing Webmaster Tools** so you can
see crawl results.

---

## Owner-run scripts (content automation)

All read `.env` at repo root (the same `OPENAI_API_KEY` the hero scripts use).
Review the git diff before pushing.

### #1 Internal linking — `scripts/gen-internal-links.mjs`
Scores articles by title-token overlap + same-leg affinity and proposes related
`linksTo` targets. **Append-only** — it never removes your curated links and only
links to visible, indexable targets.

```bash
node scripts/gen-internal-links.mjs            # REPORT → KB/seo/internal-link-suggestions.md
# review the report, then:
node scripts/gen-internal-links.mjs --write    # fill linksTo in site-schema.json (top up to 4)
node scripts/gen-internal-links.mjs --write --force-min   # also top up articles that already have some
```
Then rebuild. Edits `src/data/site-schema.json` (the same master `/admin → Links`
edits), so review the diff. Re-runnable any time / after adding articles.

### #2 FAQ generation (AEO) — `scripts/gen-faqs.mjs`
Generates answer-first FAQ pairs grounded in the article body + its
`KB/<leg>/<slug>.sources.md` notes; writes them into frontmatter `faqs`, which
already flows to FAQPage JSON-LD. Default run only fills articles that have **no**
FAQs (safe).

```bash
node scripts/gen-faqs.mjs                       # fill every article missing faqs
node scripts/gen-faqs.mjs plan-your-trip/money  # specific article(s)
node scripts/gen-faqs.mjs all --augment         # ADD new Q/As, keep existing
node scripts/gen-faqs.mjs all --force           # regenerate everything (replaces)
node scripts/gen-faqs.mjs --dry-run             # preview without writing
```
Optional `OPENAI_TEXT_MODEL=` in `.env` (default `gpt-4o-mini`). **Always review
the generated answers** before pushing — it's an LLM; the prompt forbids inventing
prices/hours but spot-check anyway.

### #10 Default OG card — `scripts/gen-og-default.mjs`
The fallback share image is already generated (`public/images/og-default.png`).
Regenerate a crisper version on your machine (uses the repo's `sharp` with the
real Inter/Newsreader fallbacks) any time:
```bash
node scripts/gen-og-default.mjs --force
```

---

## #11 Social syndication — needs accounts (kept last, currently INERT)

`scripts/syndicate.mjs` reads the built feed (`dist/rss.xml`), finds the newest
article not yet posted (tracked in `scripts/.syndicate-state.json`, git-ignored),
and posts to whichever providers have credentials. **With no tokens set it does
nothing and exits 0**, so it's safe to schedule now.

```bash
npm run build && node scripts/syndicate.mjs     # post newest unposted
node scripts/syndicate.mjs --dry-run            # show what would post
node scripts/syndicate.mjs --feed https://belgradebest.com/rss.xml   # use live feed
```

To switch on later, create the accounts and set in `.env`:
- **X (Twitter):** `X_ACCESS_TOKEN` (OAuth2 user token with `tweet.write`)
- **LinkedIn:** `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_AUTHOR_URN` (e.g. `urn:li:organization:123`)
- **Facebook Page:** `FB_PAGE_ID`, `FB_PAGE_ACCESS_TOKEN`

Once any social profile exists, add its public URL to `brand.sameAs` in
`src/data/site-config.json` so the Organization JSON-LD (#6) links to it.

---

## #5 Programmatic SEO — Belgrade area pages (built 2026-06-21)

Data-driven neighbourhood pages generated statically at build time — one page per
valid record in `src/data/areas.json` (10 areas shipped). Each renders unique
prose, FAQ, Article + FAQPage + Breadcrumb JSON-LD, and internal links.

- **Route:** `/areas` (hub) + `/areas/<area>` (e.g. `/areas/dorcol`).
- **Thin-content guard** (`src/lib/areas.ts → validArea`): a record missing
  substantial fields is simply NOT generated, so no weak page can ship.
- **Ships noindex-first.** `site-config.json → programmatic.areasIndexable` is
  `false`, so the pages build but carry `noindex` and stay out of the sitemap +
  IndexNow. **Nothing to install.**

**To review then publish:**
1. `npm run build && npm run preview` → open `/areas` and a few `/areas/<slug>`;
   read them for accuracy/quality.
2. When happy, set `programmatic.areasIndexable: true` in `src/data/site-config.json`,
   rebuild and push. They then enter the sitemap and get IndexNow-pinged automatically.
3. To add more areas: append records to `src/data/areas.json` (same shape), then
   regenerate thumbnails and rebuild — pages appear on the next build.

**Thumbnails are lightweight SVGs, not AI images** (no API cost). Each area gets a
branded vector card (name + Cyrillic + river side on brand paper) used as the card
thumbnail and the page hero. Regenerate after editing `areas.json`:

```bash
node scripts/gen-area-thumbs.mjs --force   # → public/images/areas/<slug>.svg
```

Optionally link to the area pages from existing articles (admin → Links, or by
hand) once they're indexable, to pass them internal-link equity.

## #9 Content-freshness monitor (built 2026-06-21)

Read-only scan that flags articles whose perishable facts (prices, rates, years,
hours, "as of…") may be going stale, ranked by review priority. Uses only Node
built-ins — **no install**.

```bash
node scripts/check-freshness.mjs                 # → KB/automation/freshness-report.md
node scripts/check-freshness.mjs --months 6 --top 30
```

**Runs in the cloud, PC off:** `.github/workflows/freshness.yml` runs it every
Monday 07:00 UTC and prints the ranked list to the Actions run summary. Setup:
just push the repo (GitHub Actions must be enabled). Optional — add a repo secret
`FRESHNESS_WEBHOOK_URL` (a Slack/Discord incoming-webhook URL) to also get a ping.

---

## #8 Question radar (built 2026-06-21)

Daily discovery of Belgrade question threads worth a manual reply — DISCOVERY only,
never auto-posting. Scans target subreddits, ranks by opportunity (on-topic + a real
question + few existing answers + fresh).

- Auth: **app-only OAuth** (`client_credentials`) with `REDDIT_CLIENT_ID` +
  `REDDIT_CLIENT_SECRET` — no username/password. Falls back to Reddit's public
  `.json` search automatically if the token is refused. Node built-ins only.
- Runs in the cloud (`.github/workflows/question-radar.yml`, daily 06:00 UTC) →
  ranked list in the Actions run summary. Local: `node scripts/question-radar.mjs`.
- **Setup:** the two `REDDIT_*` repo secrets are already added. Push, then open
  Actions → "Question radar" → **Run workflow** to test now. *Optional:* repo secret
  `RADAR_WEBHOOK_URL` for a Slack/Discord ping. Edit `SUBREDDITS`/`TOPICS` in the
  script to tune.
- **You still reply by hand** — that line is deliberate (auto-posting = spam).

---

## Verification checklist (owner — visible/build steps)

> Note: `npm run preview` does NOT work with the `@astrojs/vercel` adapter. Use
> `npm run dev` to review pages, or serve the built static output (below). With
> this adapter the build writes static HTML to **`.vercel/output/static/`**, not
> `dist/`.

1. `npm run build` — should succeed; confirm `.vercel/output/static/rss.xml`,
   `…/llms.txt`, `…/14ec77dc669e4a48947348a73e9ee9b7.txt`,
   `…/images/og-default.png`, and `…/areas/dorcol/index.html` exist.
2. Review pages: `npm run dev` → open `/areas`, an article, etc.; or
   `npx serve .vercel/output/static` for a production-accurate view. View source:
   `og:image`, `twitter:image`, `rel="alternate"` RSS link, enriched Article
   JSON-LD present; area pages carry `noindex` until the flag is flipped.
3. After deploy: run an article URL through Google's **Rich Results Test** and a
   social card validator.

## Files added / changed

First batch (deployed): `scripts/gen-internal-links.mjs`, `scripts/gen-faqs.mjs`,
`scripts/gen-og-default.mjs`, `scripts/syndicate.mjs`, `src/pages/rss.xml.ts`,
`src/pages/llms.txt.ts`, `public/images/og-default.png`,
`public/14ec77dc669e4a48947348a73e9ee9b7.txt`; changed `src/lib/schemas.ts`,
`src/lib/metadata.ts`, `BaseLayout.astro`, `ArticleLayout.astro`,
`astro.config.mjs`, `site-config.json`, `.gitignore`.

Second batch (#5 + #9 — added 2026-06-21, **not yet pushed**):
- Added: `src/data/areas.json`, `src/lib/areas.ts`, `src/pages/areas/[area].astro`,
  `src/pages/areas/index.astro`, `scripts/gen-area-thumbs.mjs`,
  `public/images/areas/*.svg` (10 thumbnails), `scripts/check-freshness.mjs`,
  `.github/workflows/freshness.yml`.
- Changed: `astro.config.mjs` (areas import + noindex gating),
  `src/data/site-config.json` (`programmatic.areasIndexable` flag).
