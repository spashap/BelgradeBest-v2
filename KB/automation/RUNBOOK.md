# Automated marketing — implementation runbook

Built 2026-06-21. Implements the low/very-low-effort tactics from
`automated-marketing-plan.md` (#1, #2, #3, #4, #6, #10, #12, #11). All public
output stays static; the scripts run on the owner's machine and are NOT deployed
(`scripts/` is `.vercelignore`'d).

> **Not deployed yet.** Per project convention nothing was committed/pushed.
> Run `npm run build` to verify, then `scripts\push-to-git.bat` when ready.

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

## Verification checklist (owner — visible/build steps)

1. `npm run build` — should succeed; confirm `dist/rss.xml`, `dist/llms.txt`,
   `dist/14ec77dc669e4a48947348a73e9ee9b7.txt`, `dist/images/og-default.png` exist.
2. `npm run preview` → view source on an article: `og:image`, `twitter:image`,
   `rel="alternate"` RSS link, and the enriched Article JSON-LD are present.
3. After deploy: run an article URL through Google's **Rich Results Test** and a
   social card validator.

## Files added / changed

- Added: `scripts/gen-internal-links.mjs`, `scripts/gen-faqs.mjs`,
  `scripts/gen-og-default.mjs`, `scripts/syndicate.mjs`,
  `src/pages/rss.xml.ts`, `src/pages/llms.txt.ts`,
  `public/images/og-default.png`, `public/14ec77dc669e4a48947348a73e9ee9b7.txt`,
  this runbook.
- Changed: `src/lib/schemas.ts`, `src/lib/metadata.ts`,
  `src/layouts/BaseLayout.astro`, `src/layouts/ArticleLayout.astro`,
  `astro.config.mjs`, `src/data/site-config.json`, `.gitignore`.
