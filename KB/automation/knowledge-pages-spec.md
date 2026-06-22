# Knowledge pages (hub-and-spoke SEO) — build spec

Spec for a scalable "knowledge pages" layer: many granular spoke pages in their own
route, linked from the hand-curated articles (the hubs), so the main leg/article IA
stays small and clean while the long-tail grows. Drafted 2026-06-21 for a future
session to implement.

> **Status (2026-06-22): FIRST SET BUILT — the `/glossary` knowledge set is live
> in the codebase (noindex-first), exactly per this spec.** Data `glossary.json`,
> lib guard `glossary.ts`, pages `glossary/[term].astro`+`index.astro`, thumbs
> `gen-glossary-thumbs.mjs`, and the auto-linker `gen-glossary-links.mjs` are all
> in place. See `KB/automation/RUNBOOK.md → Knowledge pages` for run/publish steps.
> Reuse the same pattern for the next sets (`/answers`, `/compare`).

## Goal

Grow SEO + AI-citation reach with high volumes of genuinely useful, narrow pages
(definitions, comparisons, single-question answers) **without** bloating the seven
legs or the article tree. The articles link down into these pages; the pages link
back up — classic hub-and-spoke / pillar-cluster.

## The pattern already exists — copy it

The **`/areas/` programmatic pages are the working precedent.** Reuse their machinery
verbatim; a knowledge set is the same shape with a different data file + route:

- Data: `src/data/areas.json` → e.g. `src/data/glossary.json`
- Lib (types + thin-content guard + accessors + markdown builder): `src/lib/areas.ts`
  → `src/lib/glossary.ts`
- Pages: `src/pages/areas/[area].astro` + `src/pages/areas/index.astro`
  → `src/pages/glossary/[term].astro` + `index.astro`
- Thumbnails (optional): `scripts/gen-area-thumbs.mjs` (lightweight branded SVGs, no API)
- noindex-first flag: `site-config.json → programmatic.areasIndexable`
  → add `programmatic.glossaryIndexable`
- Sitemap/IndexNow gating: the `NOINDEX` block in `astro.config.mjs` (search for
  `programmatic?.areasIndexable`) — add the new route the same way.

## Route + data shape

Pick a clear top-level route per set so it never collides with the `[leg]/[slug]`
dynamic route: `/glossary/<term>`, `/answers/<question>`, `/compare/<a-vs-b>`.

Each record carries enough fields to make a genuinely non-thin page, e.g. for glossary:

```json
{
  "slug": "kafana",
  "term": "Kafana",
  "localTerm": "Кафана",
  "short": "One-sentence definition (for meta + the answer-first lede).",
  "body": "2–4 paragraphs: what it is, why it matters in Belgrade, what to expect.",
  "related": ["/food-and-nightlife/belgrade-kafanas", "/glossary/rakija"],
  "faqs": [{ "question": "...", "answer": "..." }]
}
```

## Thin-content guard (non-negotiable)

Mirror `validArea()` in `lib/areas.ts`: a record missing substantial fields (min body
length, ≥1 related link, ≥1 FAQ, a real definition) is simply **not generated**. A
60-word stub is worse than no page — Google's scaled-content / thin-content systems
penalise it. The guard is what keeps "lots of pages" from becoming "content farm".

## Per page: render + schema

Compose existing components (BaseLayout + PageIntro + Container + MarkdownInline +
InternalLinkBlock), exactly like `areas/[area].astro`. Emit:
- `DefinedTerm` or `Article` + `BreadcrumbList` + `FAQPage` JSON-LD (reuse `lib/schemas.ts`).
- OG image: a branded SVG (reuse the area-thumb generator) or the default card.

## The internal-linking engine (the multiplier)

This is what makes the spokes rank: authority flowing from strong articles.

1. **Curated:** add spoke hrefs to each article's `linksTo` in `site-schema.json` (the
   existing related-links system renders them) — or re-run `scripts/gen-internal-links.mjs`.
2. **Auto-linker (build this):** a new script `scripts/gen-glossary-links.mjs` that scans
   article bodies for the **first mention** of each known term and wraps it in a link to
   that term's page. Append-only, idempotent, one link per term per article, skips
   headings/code. Low-maintenance, scales to hundreds of terms. Model its arg/IO style on
   `gen-internal-links.mjs` and `gen-faqs.mjs`.

## Launch safely (same playbook as /areas)

1. Build the set noindex-first (`glossaryIndexable: false`) — pages render but carry
   `noindex` and stay out of the sitemap + IndexNow.
2. Review in `npm run dev` / `npx serve .vercel/output/static`.
3. Flip the flag to `true`, rebuild, push → they enter the sitemap and get IndexNow-pinged.
4. **Do not** AI-mass-publish unattended. Generate records from the KB (source-checked),
   review, then publish. Demand-validate topics from the question radar (`/admin/radar`).

## First sets worth building (demand-validated)

- **Glossary / definitions:** kafana, splav, rakija, menjačnica, ćevapi, Skadarlija,
  Ada Ciganlija, BusPlus, etc. — win "what is X" + AI-citation.
- **Comparisons:** area-vs-area, hotel-vs-apartment, taxi-vs-app (some exist as articles;
  keep those as hubs and spin granular spokes only where there's distinct demand).
- **Single-question answers:** straight from recurring `/admin/radar` threads.

## Cautions

- Each page must earn its place (guard). Volume ≠ value.
- Keep spokes in their own route; never inflate the seven legs.
- Watch for cannibalisation: a spoke shouldn't compete with an article targeting the same
  query — the spoke should be narrower (one term/question), the article broader.
