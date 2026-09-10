# BelgradeBest — Growth API Implementation Report

**Date:** 2026-09-10
**Scope:** Growth Data API + growth change-log layer only. No database, no new
tracking, no content or SEO redesign.
**Status:** implemented, tested (35 unit tests passing), production build green.
Not yet deployed — deployment is the owner's push (see §10).

---

## 1. What was implemented

Three read-only, bearer-token JSON endpoints that expose aggregate growth data
to an external Growth connector, plus a version-controlled change log and the
rule that keeps it current.

- **`GET /api/growth/summary`** — traffic KPIs, new vs returning, devices,
  countries, GA4 channel groups, **source/medium with platform bucketing**,
  landing pages, Google Search clicks/impressions/CTR/position with top queries
  and pages, and the Expo 2027 cluster (GA4 + Search Console + listing counts +
  lead count).
- **`GET /api/growth/content`** — per-page GA4 joined with Search Console on the
  normalised path, classified by the site's own route architecture, with
  landing-session channel splits and a per-section roll-up.
- **`GET /api/growth/changes`** — the growth change log, oldest → newest,
  filtered by `since`.

Supporting work:

- **Reused, not duplicated, the existing Google integration.** Extracted two
  shared helpers, `ga4Client()` and `gscRequest()`, from
  `src/lib/admin/analytics.ts`; the admin's own `gscQuery()` was refactored onto
  `gscRequest()` (its four callers and the admin screens are unchanged).
- **Extended GA4 query capability** with `sessionSource` × `sessionMedium`,
  `newUsers`, `landingPage` × `sessionDefaultChannelGroup`, and
  `BEGINS_WITH` path filters for the Expo cluster.
- **Common envelope** with `data_quality.status` / `warnings` / `sources`.
- **Graceful degradation**: one provider failing yields `"partial"`, not a 500.
- **Opportunistic warm-instance TTL cache** (GA4 30 min, Search Console 6 h).
- **Path classifier** driven by `site-schema.json`, `listing-sections.ts` and
  `site-pages.json` rather than a duplicate taxonomy.
- **Privacy gate**: counts only; no lead contents, contact, outreach, magic-link
  or credential data can reach a response, asserted by tests.

---

## 2. Files changed

### Added

| File | Purpose |
|---|---|
| `src/pages/api/growth/summary.ts` | route shell, `prerender = false` |
| `src/pages/api/growth/content.ts` | route shell, `prerender = false` |
| `src/pages/api/growth/changes.ts` | route shell, `prerender = false` |
| `src/lib/growth/handlers.ts` | request → response for all three endpoints |
| `src/lib/growth/auth.ts` | constant-time bearer check, 401/503 bodies |
| `src/lib/growth/envelope.ts` | envelope, `DataQuality`, JSON/400 responses |
| `src/lib/growth/dates.ts` | period parsing, Search Console lag clamp, `since`/`limit` |
| `src/lib/growth/summary.ts` | the summary report |
| `src/lib/growth/content.ts` | per-page report, GA4 × Search Console merge |
| `src/lib/growth/reports.ts` | GA4 request definitions, reducers, platform bucketing |
| `src/lib/growth/classify.ts` | path → content type / section from site data |
| `src/lib/growth/changelog.ts` | JSONL parse, `since` filter, next-id helper |
| `src/lib/growth/cache.ts` | warm-instance TTL cache |
| `src/lib/growth/runners.ts` | real GA4 / Search Console adapters |
| `src/lib/growth/deps.ts` | wires real dependencies (token, counts, changelog) |
| `src/lib/growth/types.ts` | adapter interfaces used by handlers and tests |
| `src/lib/listing-sections.ts` | `SECTION` / `SECTION_TITLE`, extracted so the classifier and Node tests can import them without Astro globals |
| `growth/growth_changes.jsonl` | the append-only change log (1 entry) |
| `growth/BELGRADEBEST_GROWTH_API.md` | API documentation |
| `tests/growth/fakes.ts` | mocked GA4 / Search Console / deps |
| `tests/growth/{auth,dates,changes,classify,summary,content}.test.ts` | 35 unit tests |
| `BELGRADEBEST_GROWTH_API_IMPLEMENTATION_REPORT.md` | this report |

### Modified

| File | Change |
|---|---|
| `src/lib/admin/analytics.ts` | added exported `ga4Client()` and `gscRequest()`; `gscQuery()` now uses `gscRequest()` (behaviour unchanged) |
| `src/lib/listings.ts` | `SECTION`/`SECTION_TITLE` now imported from `listing-sections.ts` and re-exported (all existing importers unaffected) |
| `CLAUDE.md` | new "Growth API + growth change log" section with the mandatory change-log rule; `npm test` in Commands; two additions to "What NOT to do" |
| `package.json` | added `"test": "node --test \"tests/growth/*.test.ts\""` |
| `tsconfig.json` | `allowImportingTsExtensions` + `noEmit`; excluded `tests` from the Astro type check |
| `astro.config.mjs` | added `tests` to the serverless-function prune list (keeps test fakes out of the deployed bundle) |
| `.env.example` | documented `GROWTH_AGENT_TOKEN` and `GSC_SITE_URL` |
| `scripts/commit-message.txt` | commit message for this change set |

No public page, template, content file, tracking tag, sitemap rule or SEO
setting was modified.

---

## 3. Endpoint URLs

```
GET https://belgradebest.com/api/growth/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
GET https://belgradebest.com/api/growth/content?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=50
GET https://belgradebest.com/api/growth/changes?since=ISO-8601
```

Auth: `Authorization: Bearer <GROWTH_AGENT_TOKEN>` on every request.

| Condition | Status |
|---|---|
| valid token | `200` |
| missing / invalid token | `401` + `WWW-Authenticate: Bearer` |
| `GROWTH_AGENT_TOKEN` unset | `503 growth_api_not_configured` |
| non-GET | `405` |
| bad `from`/`to`/`since` | `400` |

All parameters are optional. `summary` and `content` default to the 28 days
ending yesterday (UTC); maximum span 366 days. `changes` without `since`
returns the whole log. Responses carry `Cache-Control: private, no-store` and
`X-Robots-Tag: noindex, nofollow`; `/api/` is already disallowed in
`robots.txt`, and the routes are absent from the sitemap (verified in the build:
156 sitemap URLs, unchanged, zero `/api/growth` entries).

Verified in the Vercel build output — all three are serverless, not prerendered:

```
"src": "^/api/growth/changes$", "dest": "_render"
"src": "^/api/growth/content$", "dest": "_render"
"src": "^/api/growth/summary$", "dest": "_render"
```

---

## 4. Available metrics

**Traffic (GA4)** — users, new users, sessions, pageviews, engagement rate,
engagement duration (total and per session), views per session, new vs
returning, devices, countries (top 15), default channel groups.

**Acquisition (GA4)** — `sessionSource` × `sessionMedium` (top 60) plus a
`platform` bucket per row: direct, google, bing, duckduckgo, yahoo, ecosia,
yandex, other_search, facebook, instagram, reddit, x, linkedin, pinterest,
youtube, tiktok, other_social, ai_assistant, embed_widget, qr, email, referral,
other. Facebook's mobile and link-shim hosts fold into one bucket; AI assistants
(ChatGPT, Copilot, Perplexity, …) get their own; widget embeds are identified by
`utm_medium=embed`.

**Landing pages (GA4)** — sessions, engagement rate, bounce rate, average
engagement seconds; per-page channel split in `content`.

**Search (Google Search Console)** — clicks, impressions, CTR, average position;
top 25 queries; top 25 pages; the same metrics restricted to the Expo cluster.

**Content** — per page: content type, section, language, Expo flag, GA4 views /
users / landing sessions / engagement / bounce, Search Console clicks /
impressions / CTR / position, landing sessions by channel; plus a per-section
roll-up.

**Expo** — GA4 pageviews and landing sessions across `/expo-2027*` and
`/de/expo-2027*`, top pages, Search Console performance for the cluster,
listing counts (`masters_total` 79, `published_top_level` 21,
`published_children` 1, `claimed` 0 at time of writing) and the lead file count.

---

## 5. Still-unavailable metrics

| Metric | Why | Where stated |
|---|---|---|
| Conversions of any kind | No GA4 key events exist; leads and claims are repository files, not analytics events | `conversions: null` + a standing warning |
| Lead attribution (channel/page/session) | Lead files carry no session context | lead `note` field |
| Post-level social attribution | Historical visits carry no `utm_content`/`utm_campaign` | `post_level_attribution: false` + warning |
| Per-partner widget attribution | Every embed of a widget sends the same UTM, and the UTM overrides the referrer | documented in `BELGRADEBEST_GROWTH_API.md` §5 |
| Widget impressions | Widgets make no network requests by design | documented |
| Bing clicks / impressions / referring domains | Explicitly out of scope for this task | documented in §9 of the API doc |
| Backlinks, index coverage, ranking history | No data source integrated | documented |
| Affiliate clicks or revenue | No affiliate link is enabled and no click tracking exists | documented |
| Historical trends beyond provider retention | Nothing is stored locally | documented |

Nothing is invented or estimated. A metric that is not measured is `null` or
absent, never zero-as-if-measured.

---

## 6. Changes to GA4 / Search Console query capability

The admin previously queried GA4 for KPIs, a date/hour trend,
`sessionDefaultChannelGroup`, `deviceCategory`, `newVsReturning`, `country`,
`landingPagePlusQueryString`, `pagePath` and realtime; and Search Console for
`query` and `page`. This task adds, for the Growth API only:

| Addition | Why |
|---|---|
| `sessionSource` × `sessionMedium` (60 rows) | distinguish Facebook / Reddit / Bing / Google / AI assistants / widget embeds — the core requirement of §5 of the spec |
| `newUsers` metric | new vs returning as a ratio of the KPI block |
| `landingPage` × `sessionDefaultChannelGroup` | acquisition channel per destination page in `/content` |
| `pagePath` / `landingPage` filtered `BEGINS_WITH` the Expo prefixes | Expo cluster totals without pulling every page |
| `landingPage` with `bounceRate` + `engagementRate` in one request | landing-page quality per page |
| Search Console with no dimension | true period totals (previously derived from top-25 rows) |
| Search Console `page` with `includingRegex` for `/expo-2027` and `/de/expo-2027` | Expo search performance |
| Search Console `page`, 500 rows | per-page join in `/content` |

Shared plumbing was extracted rather than duplicated: `ga4Client()` builds the
authenticated client from `GA_PROPERTY_ID` + `GA_CREDENTIALS_JSON`, and
`gscRequest()` performs an authenticated Search Analytics POST. GA4 requests are
issued through `batchRunReports` in chunks of five (the API limit), so the
summary costs two round trips and content one.

Two correctness details worth recording:

- **Path normalisation.** GA4 returns paths and Search Console returns absolute
  URLs; both are normalised (origin, query and trailing slash stripped) so the
  two sides join. Rows that fold together are summed, and rates are
  session-weighted.
- **Search Console URL variants.** `http`/`https`, `www` and trailing-slash
  variants of one page arrive as separate rows. They are folded: clicks and
  impressions summed, CTR recomputed, best (lowest) position kept. This defect
  was caught while generating the documentation examples and is covered by a
  regression test.

---

## 7. Change-log implementation

`growth/growth_changes.jsonl` — version controlled, append-only, one JSON object
per line, sequential `BB-CHG-NNNN` ids. Current contents: one entry,
`BB-CHG-0001`, recording this implementation.

Schema: `id`, `timestamp` (ISO-8601 UTC), `category`, `title`, `reason`,
`affected_area[]`, `expected_metrics[]`, `experiment_id`, `author`, `notes`.

Parsing (`src/lib/growth/changelog.ts`) is deliberately lenient: blank lines and
`#` comments are skipped; a malformed line, a bad id or an unparsable timestamp
is reported in `data_quality.warnings` instead of failing the request. Entries
are returned oldest → newest, filtered inclusively by `since`.

The file is inlined into the serverless bundle at build time (verified in the
build output), so it is read with no filesystem or GitHub access at runtime and
a new entry goes live with the next deploy. No repository internals, tokens or
GitHub references appear in the response; a test asserts this.

---

## 8. CLAUDE.md rule

A new section, **"Growth API + growth change log"**, documents the endpoints,
the auth model, the privacy constraints and the mandatory rule:

> Every change that can materially affect traffic acquisition, SEO, indexing,
> SERP appearance, social/referral attribution, content discovery, business
> leads, widgets/distribution, affiliate performance, landing-page behavior or
> conversion behavior MUST append an entry to `growth/growth_changes.jsonl`.

It lists what should be logged (title/meta/schema, sitemap/robots/indexing,
major internal linking, new content architecture, Expo platform,
widget/distribution, tracking, CTA, lead-form, affiliate, social attribution,
important page templates), what should not (harmless refactors, formatting,
typos), and the tie-breaker: **if uncertain, log it.**

"What NOT to do" gained two lines: `/api/growth/*` is added to the sanctioned
list of server-rendered routes, and shipping a growth-affecting change without
its log entry — or exposing operator/private fields through the API — is
forbidden. `npm test` was added to Commands.

---

## 9. Tests

`npm test` → Node's built-in test runner, **35 tests, all passing, zero Google
API quota consumed** (every upstream is a fake in `tests/growth/fakes.ts`).

| File | Covers |
|---|---|
| `auth.test.ts` (7) | missing bearer → 401 with `WWW-Authenticate`; wrong bearer on all three endpoints; **admin cookie rejected**; unset/empty/whitespace token → 503 with no data; valid token and case-insensitive scheme; POST → 405; digest comparison |
| `dates.test.ts` (8) | default 28-day window; explicit range; invalid dates, reversed range, future `to`, over-long span; handler 400; Search Console lag clamp and the fully-inside-lag case; `since` and `limit` parsing |
| `changes.test.ts` (5) | valid lines kept, malformed line / bad id reported; inclusive `since`; envelope shape; **no GitHub or repo internals in output**; the real `growth_changes.jsonl` parses cleanly with sequential ids |
| `classify.test.ts` (5) | path normalisation across GA4 paths and Search Console URLs; every content type against the real routes; German mirror; internal surfaces never reportable; platform bucketing |
| `summary.test.ts` (7) | full envelope and every data block; platform aggregation (Facebook hosts merged, AI assistant, widget embed); admin paths excluded; **Search Console variant folding**; Search Console down → partial with GA4 intact; GA4 down → partial with Search Console intact; GA4 unconfigured; period inside the lag; warm cache reuse reported as `cached`; failures not cached |
| `content.test.ts` (4) | GA4 × Search Console merge on the normalised path; trailing-slash folding; classification; internal surfaces excluded; `limit` and `total_pages_seen`; each provider failing independently |

Two tests specifically assert that no private field (`contact`, `outreach`,
`tokenHash`, `manage`, lead email, `GA_CREDENTIALS`, `GITHUB_TOKEN`) appears
anywhere in a serialised response.

`npm run build` completes successfully. One real bug was caught by the build (a
re-export that left `SECTION` unbound inside `listings.ts`) and fixed before
this report.

---

## 10. Deployment status

**Not deployed.** Per the project's working agreement, commits and pushes happen
on the owner's instruction. The change set is staged locally with
`scripts/commit-message.txt` written, so `scripts/push-to-git.bat` will commit
and push it verbatim, which triggers the Vercel rebuild.

Before the endpoints answer in production, one environment variable must be set
in the Vercel project:

```
GROWTH_AGENT_TOKEN=<a long random string, e.g. openssl rand -hex 32>
```

Until it is set the API answers `503 growth_api_not_configured` — a safe
failure that exposes nothing. `GA_PROPERTY_ID` and `GA_CREDENTIALS_JSON` are
already configured for the admin analytics screens and are reused as-is;
`GSC_SITE_URL` is optional (default `sc-domain:belgradebest.com`).

Post-deploy verification:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://belgradebest.com/api/growth/summary          # 401
curl -s -H "Authorization: Bearer $GROWTH_AGENT_TOKEN" \
  "https://belgradebest.com/api/growth/summary?from=2026-08-01&to=2026-08-28" | head -c 400
curl -s -H "Authorization: Bearer $GROWTH_AGENT_TOKEN" \
  https://belgradebest.com/api/growth/changes
```

Public site behaviour is preserved: output stays `static`, the sitemap still
contains 156 URLs with no `/api/growth` entries, no public page became
server-rendered, and no tracking, content or template file was touched.

---

## 11. Example sanitized JSON

Generated by running the real handlers against mocked Google responses. Figures
are illustrative.

### `GET /api/growth/summary?from=2026-08-01&to=2026-08-28`

```json
{
  "schema_version": "1",
  "project": "belgradebest",
  "generated_at": "2026-09-10T12:00:00.000Z",
  "period": { "from": "2026-08-01", "to": "2026-08-28", "timezone": "UTC" },
  "data_quality": {
    "status": "ok",
    "warnings": [
      "No downstream conversion tracking exists (no GA4 key events, no lead/claim events); conversion metrics are not reported.",
      "Post-level social attribution is unavailable: historical visits carry no utm_content/utm_campaign, so only platform-level source/medium is reported."
    ],
    "sources": { "ga4": "ok", "gsc": "ok" }
  },
  "data": {
    "traffic": {
      "users": 148,
      "new_users": 140,
      "sessions": 175,
      "pageviews": 269,
      "engagement_rate": 0.37,
      "engagement_duration_seconds_total": 16975,
      "engagement_duration_seconds_per_session": 97,
      "views_per_session": 1.54,
      "new_vs_returning": { "new": 140, "returning": 8 },
      "devices": [
        { "device": "desktop", "users": 100, "sessions": 120 },
        { "device": "mobile", "users": 48, "sessions": 55 }
      ],
      "countries": [
        { "country": "Serbia", "users": 24, "sessions": 30 },
        { "country": "United States", "users": 25, "sessions": 26 }
      ],
      "channels": [
        { "channel": "Direct", "sessions": 69, "users": 60 },
        { "channel": "Organic Search", "sessions": 60, "users": 55 },
        { "channel": "Organic Social", "sessions": 29, "users": 25 }
      ],
      "platforms": [
        { "platform": "direct", "sessions": 69, "users": 60, "sources": ["(direct)"] },
        { "platform": "bing", "sessions": 30, "users": 28, "sources": ["bing"] },
        { "platform": "facebook", "sessions": 29, "users": 26, "sources": ["m.facebook.com", "l.facebook.com"] },
        { "platform": "ai_assistant", "sessions": 5, "users": 5, "sources": ["copilot.com"] },
        { "platform": "google", "sessions": 4, "users": 4, "sources": ["google"] },
        { "platform": "reddit", "sessions": 3, "users": 3, "sources": ["reddit.com"] },
        { "platform": "embed_widget", "sessions": 2, "users": 2, "sources": ["countdown-widget"] }
      ],
      "sources": [
        { "source": "(direct)", "medium": "(none)", "platform": "direct", "sessions": 69, "users": 60 },
        { "source": "bing", "medium": "organic", "platform": "bing", "sessions": 30, "users": 28 },
        { "source": "m.facebook.com", "medium": "referral", "platform": "facebook", "sessions": 20, "users": 18 },
        { "source": "countdown-widget", "medium": "embed", "platform": "embed_widget", "sessions": 2, "users": 2 }
      ]
    },
    "landing_pages": [
      { "path": "/plan-your-trip/airport-to-city", "sessions": 9, "engagement_rate": 0.6, "bounce_rate": 0.4, "avg_engagement_seconds": 100 },
      { "path": "/expo-2027/pavilions/germany", "sessions": 4, "engagement_rate": 0.5, "bounce_rate": 0.5, "avg_engagement_seconds": 50 }
    ],
    "seo": {
      "window": { "from": "2026-08-01", "to": "2026-08-28" },
      "clicks": 2,
      "impressions": 106,
      "ctr": 0.0189,
      "position": 45.7,
      "top_queries": [
        { "query": "expo 2027 belgrade", "clicks": 1, "impressions": 40, "ctr": 0.025, "position": 12.8 }
      ],
      "top_pages": [
        { "path": "/expo-2027/pavilions", "clicks": 1, "impressions": 34, "ctr": 0.03, "position": 12.8 },
        { "path": "/plan-your-trip/airport-to-city", "clicks": 1, "impressions": 25, "ctr": 0.04, "position": 9 }
      ]
    },
    "expo": {
      "ga4": {
        "pageviews": 57,
        "users_sum_by_page": 45,
        "landing_sessions": 19,
        "top_pages": [
          { "path": "/expo-2027", "views": 40, "users": 30, "avg_engagement_seconds": null },
          { "path": "/expo-2027/pavilions/germany", "views": 12, "users": 10, "avg_engagement_seconds": null },
          { "path": "/de/expo-2027/tickets", "views": 5, "users": 5, "avg_engagement_seconds": null }
        ],
        "top_landing_pages": [
          { "path": "/expo-2027", "sessions": 15 },
          { "path": "/expo-2027/pavilions/germany", "sessions": 4 }
        ]
      },
      "search": {
        "clicks": 1,
        "impressions": 44,
        "ctr": 0.0227,
        "position": 16.7,
        "top_pages": [
          { "path": "/expo-2027/pavilions", "clicks": 1, "impressions": 34, "ctr": 0.03, "position": 12.8 },
          { "path": "/expo-2027/pavilions/germany", "clicks": 0, "impressions": 10, "ctr": 0, "position": 30 }
        ]
      },
      "listings": { "masters_total": 79, "published_top_level": 21, "published_children": 1, "claimed": 0 },
      "leads": { "count": 0, "note": "Count of stored lead files in the deployed snapshot; no lead details are exposed." }
    },
    "attribution": {
      "post_level_attribution": false,
      "note": "Post-level social attribution is unavailable: historical visits carry no utm_content/utm_campaign, so only platform-level source/medium is reported."
    },
    "conversions": null
  }
}
```

### `GET /api/growth/content?from=2026-08-01&to=2026-08-28&limit=3`

```json
{
  "schema_version": "1",
  "project": "belgradebest",
  "generated_at": "2026-09-10T12:00:00.000Z",
  "period": { "from": "2026-08-01", "to": "2026-08-28", "timezone": "UTC" },
  "data_quality": { "status": "ok", "warnings": ["…"], "sources": { "ga4": "ok", "gsc": "ok" } },
  "data": {
    "limit": 3,
    "total_pages_seen": 7,
    "post_level_attribution": false,
    "acquisition_note": "acquisition.landing_sessions_by_channel is GA4's default channel grouping per landing page (platform level). Per-post attribution is unavailable.",
    "pages": [
      {
        "path": "/plan-your-trip/airport-to-city",
        "content_type": "article",
        "section": "plan-your-trip",
        "lang": "en",
        "expo": false,
        "ga4": { "views": 50, "users": 40, "sessions_as_landing_page": 9, "engagement_rate": 0.6, "bounce_rate": 0.4, "avg_engagement_seconds": 100 },
        "search": { "clicks": 1, "impressions": 25, "ctr": 0.04, "position": 9 },
        "acquisition": { "landing_sessions_by_channel": { "Organic Search": 7, "Organic Social": 2 } }
      },
      {
        "path": "/",
        "content_type": "homepage",
        "section": "home",
        "lang": "en",
        "expo": false,
        "ga4": { "views": 30, "users": 25, "sessions_as_landing_page": 0, "engagement_rate": null, "bounce_rate": null, "avg_engagement_seconds": 24 },
        "search": { "clicks": 0, "impressions": 0, "ctr": 0, "position": null },
        "acquisition": null
      },
      {
        "path": "/expo-2027/pavilions/germany",
        "content_type": "listing",
        "section": "expo-2027",
        "lang": "en",
        "expo": true,
        "ga4": { "views": 15, "users": 13, "sessions_as_landing_page": 4, "engagement_rate": 0.5, "bounce_rate": 0.5, "avg_engagement_seconds": 46.2 },
        "search": { "clicks": 0, "impressions": 0, "ctr": 0, "position": null },
        "acquisition": { "landing_sessions_by_channel": { "Referral": 4 } }
      }
    ],
    "by_section": {
      "plan-your-trip": { "pages": 1, "views": 50, "clicks": 1, "impressions": 25 },
      "home": { "pages": 1, "views": 30, "clicks": 0, "impressions": 0 },
      "expo-2027": { "pages": 2, "views": 15, "clicks": 1, "impressions": 34 },
      "areas": { "pages": 1, "views": 8, "clicks": 0, "impressions": 0 },
      "glossary": { "pages": 1, "views": 6, "clicks": 0, "impressions": 0 },
      "utility": { "pages": 1, "views": 2, "clicks": 0, "impressions": 0 }
    }
  }
}
```

### `GET /api/growth/changes`

```json
{
  "schema_version": "1",
  "project": "belgradebest",
  "generated_at": "2026-09-10T12:00:00.000Z",
  "period": { "from": "2026-09-10T12:00:00Z", "to": "2026-09-10T12:00:00.000Z", "timezone": "UTC" },
  "data_quality": { "status": "ok", "warnings": [], "sources": { "changelog": "ok" } },
  "data": {
    "since": null,
    "count": 1,
    "total_in_log": 1,
    "source": "growth/growth_changes.jsonl (bundled at build; updates on deploy)",
    "changes": [
      {
        "id": "BB-CHG-0001",
        "timestamp": "2026-09-10T12:00:00Z",
        "category": "analytics",
        "title": "Implemented Growth API and growth change log",
        "reason": "Expose decision-quality traffic, search and content data plus a machine-readable change history to the Growth Lab connector",
        "affected_area": ["/api/growth/summary", "/api/growth/content", "/api/growth/changes", "growth/growth_changes.jsonl", "src/lib/admin/analytics.ts"],
        "expected_metrics": [],
        "experiment_id": null,
        "author": "claude-code",
        "notes": "Bearer-token (GROWTH_AGENT_TOKEN) read-only endpoints reusing the admin GA4 Data API + Search Console integration; adds sessionSource/sessionMedium platform reporting; warm-instance TTL cache. No public page or tracking change."
      }
    ]
  }
}
```

### Refusals

```json
{ "error": "unauthorized", "message": "A valid bearer token is required." }
{ "error": "growth_api_not_configured", "message": "GROWTH_AGENT_TOKEN is not set on the server." }
{ "error": "bad_request", "message": "`from` must be a valid YYYY-MM-DD date." }
```

### Degraded response

```json
{
  "data_quality": {
    "status": "partial",
    "warnings": ["Google Search Console unavailable: Search Console error: 403", "…"],
    "sources": { "ga4": "ok", "gsc": "unavailable" }
  },
  "data": { "traffic": { "sessions": 175, "…": "…" }, "seo": { "clicks": 0, "impressions": 0, "top_queries": [] } }
}
```

---

## 12. Deviations from specification

Five, all additive or clarifying. Nothing in the specification was skipped.

1. **`data_quality.sources` added to the envelope.** The specified envelope has
   `status` and `warnings` only. A per-source map (`ok` / `cached` /
   `unavailable` / `not_applicable`) was added so a consumer can tell a fresh
   pull from a cache hit and see exactly which provider is missing. The
   specified fields are unchanged.

2. **`503` for an unconfigured token, `401` for a bad one.** The specification
   asks for "missing/unconfigured token → safe failure" and "invalid/missing
   bearer token → 401". These are two different conditions, so they get two
   codes: a server that has no `GROWTH_AGENT_TOKEN` answers `503
   growth_api_not_configured` (it cannot authenticate anyone), while a client
   presenting no or a wrong token gets `401`.

3. **Default period is the 28 days ending yesterday, not ending today.** Today's
   GA4 figures are incomplete and Search Console has none. Explicit `from`/`to`
   are honoured as given.

4. **Search Console windows are clamped to `today − 2`** rather than returning
   empty results for recent days. The dates actually queried are returned in
   `seo.window` with a warning, and a period entirely inside the lag is reported
   as `not_applicable` rather than `unavailable` (it is not a failure).

5. **`src/lib/listing-sections.ts` extracted.** `src/lib/listings.ts` uses
   `import.meta.glob`, which Node's test runner cannot execute, so the `SECTION`
   map was moved into a plain module that both the site and the classifier
   import. `listings.ts` re-exports it, so no existing importer changed. This
   was the smallest way to satisfy "use actual project metadata rather than a
   fragile duplicate taxonomy" while keeping tests runnable without Vite.

Scope was held: no analytics database, no Meta Pixel, no affiliate or widget
impression tracking, no Bing integration, no SEO redesign, no content change and
no Facebook strategy change. Source/medium reporting was added only because the
Growth API requires it.
