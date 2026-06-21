# BelgradeBest — Automated Guerrilla Marketing Plan

**Rule:** every tactic here is *fully automatable* — it runs as a script, build hook, or
scheduled task with no manual posting. Anything that requires a human to post into a
community is excluded (it's against platform ToS and damages trust in the medical /
"is it safe" niches).

**Score = impact ÷ effort, 0–100.** 100 = almost no effort, high impact. Low scores mean
either the effort is heavy or the payoff is thin. Scores assume the existing stack:
Astro static + Vercel, OpenAI key + hero script, GA4 + GSC service account, the
`linksTo` / `links.ts` internal-link system, and the per-article frontmatter `faqs`.

---

## Scored tactics (ranked)

| # | Tactic | Score | Effort | Impact |
|---|--------|:----:|--------|--------|
| 1 | Internal-linking automation (keyword-map driven) | **82** | Low | High |
| 2 | AEO: auto FAQ + answer-first + FAQPage JSON-LD across all articles | **80** | Low | High |
| 3 | IndexNow + sitemap auto-ping on every deploy | **78** | Very low | Medium |
| 4 | `llms.txt` + clean content endpoints (get cited by ChatGPT/Perplexity/Google AI) | **76** | Very low | Med-High (growing) |
| 5 | Programmatic SEO pages from structured data (geography + medical costs) | **72** | Med-High | Very High |
| 6 | Schema/rich-results expansion (HowTo, enhanced Breadcrumb, Event) | **70** | Low | Medium |
| 7 | Pinterest auto-pinning (evergreen travel traffic) | **70** | Medium | High |
| 8 | Question radar — scheduled discovery digest (you reply manually) | **68** | Med | Medium |
| 9 | Content-freshness monitor (flags stale perishable facts) | **66** | Low-Med | Medium |
| 10 | Auto-generated OG / social share images | **60** | Low | Low-Med |
| 11 | Auto social syndication (X / FB page / LinkedIn on publish) | **55** | Low | Low-Med |
| 12 | RSS feed + aggregator auto-submit | **50** | Low | Low |
| 13 | Embeddable free widget for passive backlinks | **45** | High | High but slow |

---

## Why the top picks score high

**1 · Internal-linking automation (82).** A script reads the Phase-0 keyword map +
`site-schema.json`, finds the best 3–5 internal targets per article, and writes them into
`linksTo`. Internal links are one of the strongest on-page SEO signals and you already have
the plumbing (`links.ts relatedFor()`). One generator pass lifts every page at once; re-runs
on each new article. Pure code, zero ongoing effort.

**2 · AEO / FAQ schema (80).** You already emit FAQPage JSON-LD when `faqs` is present, but
not every article has rich FAQ blocks. A script uses your KB + OpenAI to generate
answer-first FAQ pairs (the exact phrasing people type and AI engines quote) and writes them
into frontmatter. This is the cheapest way to win AI-assistant citations and Google's
People-Also-Ask / AI Overviews — increasingly where travel discovery happens.

**3 · IndexNow + auto-ping (78).** A tiny endpoint + build hook instantly notifies Bing/Yandex
(and pings your sitemap) on every Vercel deploy. On a young domain, faster indexing = faster
ranking feedback. Near-zero maintenance once wired.

**4 · `llms.txt` + clean endpoints (76).** Auto-generate an `llms.txt` index and ensure each
article has a clean machine-readable form so answer engines can ingest you accurately. Cheap
to produce at build time, and the share of traffic coming from AI answers only grows.

**5 · Programmatic SEO (72).** The biggest raw-traffic lever, scored lower only because the
effort is real. One generator turns your geography KB and medical-cost data into dozens of
long-tail pages ("[procedure] cost in Belgrade", "[area] vs [area] where to stay",
neighborhood transfer pages). Must enforce a quality/uniqueness gate so Google doesn't read
them as thin — build that guard in from the start.

**7 · Pinterest auto-pinning (70).** The one *off-site distribution* channel that allows full
automation. A script renders a branded pin per article (reuse the hero pipeline) and schedules
pins via the Pinterest API. Pins rank in Google Images and stay evergreen for years — travel
is Pinterest's strongest vertical. Effort is the API app approval + image template.

**8 · Question radar (68).** Automates *discovery*, not posting. A daily scheduled task scans
Reddit/forums/Google for fresh Belgrade questions matching your keyword map and emails a
ranked digest of threads worth answering. Machine finds, you reply by hand — keeps it ToS-safe
while removing the hours of manual searching.

---

## Recommended build order

**Phase 1 — quick wins (scores 76–82, days not weeks):** internal-linking automation → AEO/FAQ
generation → IndexNow auto-ping → `llms.txt`. All on-site, all fully automated, all compounding
your existing SEO without touching any external platform.

**Phase 2 — growth engines:** programmatic SEO generator (with the thin-content guard) →
Pinterest auto-pinning. These need API setup / content-quality work but drive the largest new
traffic.

**Phase 3 — force multipliers:** question radar (scheduled) → freshness monitor → social
syndication. Ongoing automated support once the foundation is live.

---

## Honest caveats

- **Programmatic SEO is a double-edged sword.** Mass-generated pages with no real differentiation
  get classified as thin/spam. The uniqueness gate (real KB data per page, no template padding)
  is non-negotiable.
- **Pinterest needs a real account + API approval**, and pins must look native, not spammy.
- **"Question radar" stops at the digest.** The reply is manual on purpose — automating the reply
  is the spam line we're not crossing.
- **AI-citation upside is real but unmeasurable today** — treat scores 2 & 4 as bets on where
  discovery is heading, not on this quarter's analytics.
