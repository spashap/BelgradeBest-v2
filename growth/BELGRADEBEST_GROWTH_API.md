# BelgradeBest Growth Data API

A read-only, token-authenticated JSON API that exposes **aggregate** traffic,
search and content-performance data plus a machine-readable history of
growth-relevant site changes. Built for an external Growth connector.

- Base URL: `https://belgradebest.com`
- Endpoints: `/api/growth/summary`, `/api/growth/content`, `/api/growth/changes`
- Schema version: `1`
- Everything is UTC.

There is **no database**. The API reads the same Google Analytics 4 Data API and
Google Search Console integration the `/admin` analytics screens use, plus the
version-controlled change log at `growth/growth_changes.jsonl`.

---

## 1. Authentication

Send a bearer token on every request:

```
Authorization: Bearer <GROWTH_AGENT_TOKEN>
```

`GROWTH_AGENT_TOKEN` is a server-side environment variable (Vercel project env).
The browser/admin session cookie (`bb_admin`) is **not** accepted here — machine
clients and humans use different credentials on purpose.

| Situation | Status | Body |
|---|---|---|
| Valid token | `200` | the envelope below |
| Missing or wrong token | `401` | `{"error":"unauthorized", ...}` + `WWW-Authenticate: Bearer` |
| `GROWTH_AGENT_TOKEN` not set on the server | `503` | `{"error":"growth_api_not_configured", ...}` |
| Non-GET method | `405` | `{"error":"method_not_allowed", ...}` |
| Bad `from`/`to`/`since`/`limit` | `400` | `{"error":"bad_request","message":"…"}` |

Token comparison is constant-time over SHA-256 digests, so neither the length
nor a prefix of the token leaks through response timing. Every response carries
`Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow`, and
`/api/` is already disallowed in `robots.txt`.

Rotating the token: change it in the Vercel env and redeploy. There is no token
list and no revocation store — one token, one consumer.

---

## 2. Common response envelope

Every successful response has exactly this shape:

```json
{
  "schema_version": "1",
  "project": "belgradebest",
  "generated_at": "2026-09-10T12:00:00.000Z",
  "period": { "from": "2026-08-01", "to": "2026-08-28", "timezone": "UTC" },
  "data_quality": {
    "status": "ok",
    "warnings": [],
    "sources": { "ga4": "ok", "gsc": "ok" }
  },
  "data": {}
}
```

`data_quality.status` is `"ok"` or `"partial"`. It becomes `"partial"` when an
upstream service was unavailable — never because of an informational limitation.

`data_quality.sources` (an addition to the base contract) reports each upstream:

| Value | Meaning |
|---|---|
| `ok` | fetched live from the provider during this request |
| `cached` | served from the warm-instance TTL cache (see §7) |
| `unavailable` | the call failed or is not configured; a warning explains why |
| `not_applicable` | the provider legitimately has nothing for this period (e.g. Search Console lag) |

`warnings` always contains the two standing limitations (no conversion
tracking; no post-level social attribution) so a consumer never has to infer
them.

---

## 3. `GET /api/growth/summary`

Aggregate traffic, landing pages, Google Search performance and the Expo 2027
cluster for a period.

**Query parameters**

| Name | Format | Default |
|---|---|---|
| `from` | `YYYY-MM-DD` | `to` − 27 days |
| `to` | `YYYY-MM-DD` | yesterday (UTC) |

The default window is the 28 days ending yesterday: today's GA4 figures are
still moving and Search Console has nothing for today. Maximum span 366 days;
`to` may not be in the future.

**`data` fields**

`traffic` (GA4, `null` if GA4 is unavailable)
- `users`, `new_users`, `sessions`, `pageviews`
- `engagement_rate` (0–1)
- `engagement_duration_seconds_total`, `engagement_duration_seconds_per_session`
- `views_per_session`
- `new_vs_returning: { new, returning }`
- `devices[]` — `{ device, users, sessions }`
- `countries[]` — `{ country, users, sessions }` (top 15)
- `channels[]` — `{ channel, sessions, users }`, GA4 default channel grouping
- `platforms[]` — `{ platform, sessions, users, sources[] }` (see §5)
- `sources[]` — `{ source, medium, platform, sessions, users }` (top 60)

`landing_pages[]` — `{ path, sessions, engagement_rate, bounce_rate, avg_engagement_seconds }`, top 25 by sessions.

`seo` (Search Console)
- `window` — the actual dates queried, or `null` when the whole period is inside the data lag
- `clicks`, `impressions`, `ctr`, `position`
- `top_queries[]` — `{ query, clicks, impressions, ctr, position }` (top 25)
- `top_pages[]` — `{ path, clicks, impressions, ctr, position }` (top 25)

`expo`
- `ga4` — `{ pageviews, users_sum_by_page, landing_sessions, top_pages[], top_landing_pages[] }` for `/expo-2027*` and `/de/expo-2027*`
- `search` — the same Search Console metrics restricted to the Expo cluster, plus `top_pages[]`
- `listings` — `{ masters_total, published_top_level, published_children, claimed }` (**counts only**)
- `leads` — `{ count, note }` (**count only**)

`attribution` — `{ post_level_attribution: false, note }`

`conversions` — always `null`. See §9.

**Example** (abridged; figures are illustrative, not real)

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
      "users": 148, "new_users": 140, "sessions": 175, "pageviews": 269,
      "engagement_rate": 0.37,
      "engagement_duration_seconds_total": 16975,
      "engagement_duration_seconds_per_session": 97,
      "views_per_session": 1.54,
      "new_vs_returning": { "new": 140, "returning": 8 },
      "devices": [ { "device": "desktop", "users": 100, "sessions": 120 } ],
      "countries": [ { "country": "Serbia", "users": 24, "sessions": 30 } ],
      "channels": [ { "channel": "Organic Search", "sessions": 60, "users": 55 } ],
      "platforms": [
        { "platform": "direct", "sessions": 69, "users": 60, "sources": ["(direct)"] },
        { "platform": "bing", "sessions": 30, "users": 28, "sources": ["bing"] },
        { "platform": "facebook", "sessions": 29, "users": 26, "sources": ["m.facebook.com", "l.facebook.com"] },
        { "platform": "ai_assistant", "sessions": 5, "users": 5, "sources": ["copilot.com"] },
        { "platform": "embed_widget", "sessions": 2, "users": 2, "sources": ["countdown-widget"] }
      ],
      "sources": [
        { "source": "m.facebook.com", "medium": "referral", "platform": "facebook", "sessions": 20, "users": 18 }
      ]
    },
    "landing_pages": [
      { "path": "/plan-your-trip/airport-to-city", "sessions": 9, "engagement_rate": 0.6, "bounce_rate": 0.4, "avg_engagement_seconds": 100 }
    ],
    "seo": {
      "window": { "from": "2026-08-01", "to": "2026-08-28" },
      "clicks": 2, "impressions": 106, "ctr": 0.0189, "position": 45.7,
      "top_queries": [ { "query": "expo 2027 belgrade", "clicks": 1, "impressions": 40, "ctr": 0.025, "position": 12.8 } ],
      "top_pages": [ { "path": "/expo-2027/pavilions", "clicks": 1, "impressions": 34, "ctr": 0.03, "position": 12.8 } ]
    },
    "expo": {
      "ga4": { "pageviews": 57, "users_sum_by_page": 45, "landing_sessions": 19, "top_pages": [], "top_landing_pages": [] },
      "search": { "clicks": 1, "impressions": 44, "ctr": 0.0227, "position": 16.7, "top_pages": [] },
      "listings": { "masters_total": 79, "published_top_level": 21, "published_children": 1, "claimed": 0 },
      "leads": { "count": 0, "note": "Count of stored lead files in the deployed snapshot; no lead details are exposed." }
    },
    "attribution": { "post_level_attribution": false, "note": "…" },
    "conversions": null
  }
}
```

---

## 4. `GET /api/growth/content`

Per-page performance: GA4 joined with Search Console on the normalised path,
classified by the site's own route architecture.

**Query parameters**: `from`, `to` (as above), `limit` (default 50, max 200).

Each entry in `data.pages[]`:

```json
{
  "path": "/plan-your-trip/airport-to-city",
  "content_type": "article",
  "section": "plan-your-trip",
  "lang": "en",
  "expo": false,
  "ga4": {
    "views": 50,
    "users": 40,
    "sessions_as_landing_page": 9,
    "engagement_rate": 0.6,
    "bounce_rate": 0.4,
    "avg_engagement_seconds": 100
  },
  "search": { "clicks": 1, "impressions": 25, "ctr": 0.04, "position": 9 },
  "acquisition": { "landing_sessions_by_channel": { "Organic Search": 7, "Organic Social": 2 } }
}
```

`ga4` is `null` when GA4 is unavailable; `search` is `null` when Search Console
is unavailable; `acquisition` is `null` for pages that were not a landing page
in the period. Rows are ordered by GA4 views, then Search Console clicks.

`data` also carries `limit`, `total_pages_seen`, `post_level_attribution`
(always `false`), `acquisition_note`, and `by_section` — a
`{ pages, views, clicks, impressions }` roll-up keyed by section.

**`content_type` and `section` come from the project's real routes**, not a
parallel taxonomy. `src/lib/growth/classify.ts` reads the leg list from
`src/data/site-schema.json`, the listing URL segments from
`src/lib/listing-sections.ts` and the utility slugs from
`src/data/site-pages.json`, so adding a leg or a listing section reclassifies
the API automatically.

| `content_type` | Example path | `section` |
|---|---|---|
| `homepage` | `/` | `home` |
| `leg_hub` | `/visit-belgrade` | the leg slug |
| `article` | `/plan-your-trip/airport-to-city` | the leg slug |
| `expo_hub` | `/expo-2027` | `expo-2027` |
| `expo_data` | `/expo-2027/tracker`, `/expo-2027/countdown`, `/expo-2027/corporate-area` | `expo-2027` |
| `listing_directory` | `/expo-2027/pavilions` | `expo-2027` |
| `listing` | `/expo-2027/pavilions/germany` | `expo-2027` |
| `listing_child` | `/expo-2027/pavilions/china/world-expo-museum` | `expo-2027` |
| `area_hub` / `area` | `/areas`, `/areas/dorcol` | `areas` |
| `glossary_hub` / `glossary` | `/glossary`, `/glossary/kafana` | `glossary` |
| `utility` | `/about`, `/how-we-make-money` | `utility` |
| `partner_landing` | `/for-businesses` | `partners` |
| `feed` | `/rss.xml`, `/llms.txt`, `/data/…json` | `distribution` |
| `widget` | `/widgets/expo-stats.js` | `distribution` |

German pages keep their type and section and set `lang: "de"` (for example
`/de/expo-2027/pavilions/germany` is a `listing` in section `expo-2027`).

Internal surfaces (`/admin*`, `/api*`, `/manage`, `/404`) are **never**
reported.

---

## 5. Traffic sources and social platforms

The admin screens show only GA4's default channel grouping. This API also
requests `sessionSource` × `sessionMedium` and buckets each row into a
`platform`, so Facebook can be told from Reddit and Bing from Google:

`direct` · `google` · `bing` · `duckduckgo` · `yahoo` · `ecosia` · `yandex` ·
`other_search` · `facebook` · `instagram` · `reddit` · `x` · `linkedin` ·
`pinterest` · `youtube` · `tiktok` · `other_social` · `ai_assistant` ·
`embed_widget` · `qr` · `email` · `referral` · `other`

Notes on the buckets that are specific to this site:

- **`facebook`** absorbs the mobile and link-shim hosts GA4 reports separately
  (`m.facebook.com`, `l.facebook.com`, `lm.facebook.com`).
- **`ai_assistant`** covers ChatGPT, Copilot, Perplexity, Claude, Gemini and
  similar referrers — a real and growing channel for this site.
- **`embed_widget`** is traffic from the free Expo widgets, which link home with
  `utm_medium=embed` and `utm_source=<widget>-widget`. **This identifies the
  widget, not the partner site**: every partner embedding the same widget sends
  the same UTM, and because the UTM overrides the referrer, the embedding domain
  is not recoverable from these reports.
- **`qr`** is the printed QR codes on claimed listing pages (`utm_source=qr`).

The raw `sources[]` array is returned alongside `platforms[]` so a consumer can
re-bucket differently without another API call.

---

## 6. `GET /api/growth/changes`

Returns the growth change log, oldest → newest.

**Query parameter**: `since` — any ISO-8601 timestamp. Entries with
`timestamp >= since` are returned (inclusive). Omit it to get everything.

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
        "reason": "Expose decision-quality growth data to the Growth Lab connector",
        "affected_area": ["/api/growth/summary", "/api/growth/content", "/api/growth/changes"],
        "expected_metrics": [],
        "experiment_id": null,
        "author": "claude-code",
        "notes": ""
      }
    ]
  }
}
```

### The log file

`growth/growth_changes.jsonl` — version controlled, **append-only**, one JSON
object per line, ids sequential as `BB-CHG-NNNN`.

| Field | Type | Meaning |
|---|---|---|
| `id` | string | `BB-CHG-NNNN`, sequential, never reused |
| `timestamp` | ISO-8601 UTC | when the change shipped |
| `category` | string | e.g. `seo`, `analytics`, `content`, `platform`, `distribution`, `conversion` |
| `title` | string | one line, what changed |
| `reason` | string | why it was done |
| `affected_area` | string[] | routes, files or surfaces touched |
| `expected_metrics` | string[] | metrics expected to move, if any |
| `experiment_id` | string \| null | when the change is part of an experiment |
| `author` | string | `claude-code`, `owner`, … |
| `notes` | string | free text |

**When to append** (the rule also lives in `CLAUDE.md`): every change that can
materially affect traffic acquisition, SEO, indexing, SERP appearance,
social/referral attribution, content discovery, business leads,
widgets/distribution, affiliate performance, landing-page behavior or conversion
behavior. Title/meta/schema, sitemap/robots/indexing, major internal linking,
new content architecture, Expo platform, widget/distribution, tracking, CTA,
lead-form, affiliate and social-attribution changes, and important page-template
changes all qualify. Harmless refactors, formatting and typo fixes do not — but
**if uncertain, log it**.

Parsing is lenient: blank lines and `#` comments are skipped, and a malformed
line is reported in `data_quality.warnings` rather than failing the request.

The file is bundled into the serverless function at build time, so a new entry
becomes visible **after the next deploy** (the same commit → rebuild flow the
rest of the site uses). No GitHub credentials or repository internals appear in
the response.

---

## 7. Caching

GA4 and Search Console are rate-limited and add 1–3 s of latency, so aggregate
results are memoised in a module-level `Map` inside the serverless function:

| Source | TTL |
|---|---|
| GA4 | 30 minutes |
| Search Console | 6 hours (its own data only updates daily and lags ~2 days) |

This cache is **opportunistic, not guaranteed**. It lives in the memory of one
warm serverless instance; a cold start or a request routed to a different
instance simply misses and fetches fresh. It is a quota and latency
optimisation, never a correctness mechanism, and a consumer should not assume
two calls within the TTL are served from the same instance.

Only aggregate report data is cached. Credentials and tokens are never cached,
never written to disk and never included in any response. Failed upstream calls
are not cached, so the next request retries. Concurrent identical requests share
one in-flight upstream call.

---

## 8. Metric definitions

### GA4 (Google Analytics 4 Data API)

| Field | GA4 metric | Definition |
|---|---|---|
| `users` | `totalUsers` | distinct users with at least one event in the period |
| `new_users` | `newUsers` | users whose first-ever session falls in the period |
| `sessions` | `sessions` | session count |
| `pageviews` | `screenPageViews` | page views, including repeats |
| `engagement_rate` | `engagementRate` | share of sessions that were engaged (≥10 s, a conversion, or ≥2 views) |
| `engagement_duration_seconds_total` | `userEngagementDuration` | total foreground time, seconds |
| `engagement_duration_seconds_per_session` | derived | duration ÷ sessions |
| `views_per_session` | `screenPageViewsPerSession` | views ÷ sessions |
| `bounce_rate` | `bounceRate` | 1 − engagement rate, per landing page |
| `sessions_as_landing_page` | `sessions` by `landingPage` | sessions that entered on this page |
| `devices` | `deviceCategory` | desktop / mobile / tablet |
| `countries` | `country` | user's country |
| `channels` | `sessionDefaultChannelGroup` | GA4's channel grouping |
| `sources` | `sessionSource`, `sessionMedium` | acquisition source and medium |

`(not set)` rows are dropped. Page paths are normalised (origin, query and
trailing slash stripped) so `/x` and `/x/` merge; when several raw rows fold
into one path, counts are summed and rates are session-weighted.

### Search Console (Search Analytics API)

| Field | Definition |
|---|---|
| `clicks` | clicks from Google Search to the site |
| `impressions` | times a result was seen |
| `ctr` | clicks ÷ impressions (0–1) |
| `position` | average position, weighted by impressions when rows are combined |

Search Console reports each URL variant separately (`http`/`https`, `www`,
trailing slash). These fold onto one normalised path: clicks and impressions are
summed, CTR is recomputed, and the **best (lowest) position** is kept.

Google Search only. There is no Bing Webmaster Tools integration — see §9.

---

## 9. Data lag and known limitations

**Search Console lags ~2 days.** Every Search Console window is clamped to
`today − 2`. If the requested period ends later, the actual dates queried are
returned in `seo.window` and a warning says so. If the whole period is inside the
lag, `sources.gsc` is `not_applicable` and search figures are zero — the
request still succeeds with GA4 data.

**GA4 same-day data is incomplete.** The default period ends yesterday for that
reason. Requesting today is allowed but the numbers will keep moving.

**One provider failing does not fail the response.** If GA4 is down or
unconfigured, Search Console data is still returned (and vice versa), with
`data_quality.status: "partial"` and a warning naming the missing provider.

**No conversion tracking exists.** The site defines no GA4 key events, and lead
submissions and business claims are stored as repository files rather than
analytics events. `conversions` is always `null` and no conversion figure is
inferred. The lead **count** in `summary` is the number of stored lead files in
the deployed snapshot; it is not attributable to a session, channel or page.

**No post-level social attribution.** Historical visits carry no `utm_content`
or `utm_campaign`, so a specific Facebook post cannot be measured. Only
platform-level source/medium is available, and both endpoints state this as
`post_level_attribution: false`.

**No per-partner widget attribution.** See §5.

**No Bing data.** Bing Webmaster Tools is deliberately out of scope for this
API even though Bing is a significant channel for the site; only Google Search
Console is integrated.

**No backlink, index-coverage or ranking-history data**, and no historical
storage of any kind: every response is computed from what GA4 and Search Console
return for the requested window. Retention is whatever the underlying Google
properties keep (Search Console: 16 months).

**Aggregate only.** No user-level, session-level or IP data is exposed. Business
contact details, outreach status, magic-link tokens and lead contents are never
returned — only counts.

---

## 10. Examples

```bash
# Last 28 days (default window)
curl -s -H "Authorization: Bearer $GROWTH_AGENT_TOKEN" \
  https://belgradebest.com/api/growth/summary

# An explicit month
curl -s -H "Authorization: Bearer $GROWTH_AGENT_TOKEN" \
  "https://belgradebest.com/api/growth/summary?from=2026-08-01&to=2026-08-31"

# Top 100 pages for August
curl -s -H "Authorization: Bearer $GROWTH_AGENT_TOKEN" \
  "https://belgradebest.com/api/growth/content?from=2026-08-01&to=2026-08-31&limit=100"

# Everything that changed since the connector last checked
curl -s -H "Authorization: Bearer $GROWTH_AGENT_TOKEN" \
  "https://belgradebest.com/api/growth/changes?since=2026-09-01T00:00:00Z"
```

A consumer should: read `data_quality.status` and `warnings` before using the
numbers; treat `null` as "not measured" rather than zero; and correlate a metric
shift with `/api/growth/changes` before attributing it to anything else.

---

## 11. Implementation map

| File | Role |
|---|---|
| `src/pages/api/growth/{summary,content,changes}.ts` | route shells, `prerender = false` |
| `src/lib/growth/handlers.ts` | request → response, auth gate, parameter parsing |
| `src/lib/growth/auth.ts` | bearer check (constant time), 401/503 bodies |
| `src/lib/growth/envelope.ts` | envelope, `DataQuality`, JSON responses |
| `src/lib/growth/dates.ts` | period parsing, Search Console lag clamp |
| `src/lib/growth/summary.ts` | the summary report |
| `src/lib/growth/content.ts` | the per-page report and the GA4 × GSC merge |
| `src/lib/growth/reports.ts` | request definitions, reducers, platform bucketing |
| `src/lib/growth/classify.ts` | path → content type / section, from site data |
| `src/lib/growth/changelog.ts` | JSONL parsing and filtering |
| `src/lib/growth/cache.ts` | warm-instance TTL cache |
| `src/lib/growth/runners.ts` | real GA4 / Search Console adapters |
| `src/lib/growth/deps.ts` | wires the real dependencies |
| `src/lib/admin/analytics.ts` | shared `ga4Client()` and `gscRequest()` (also used by `/admin`) |
| `tests/growth/*.test.ts` | unit tests with Google fully mocked (`npm test`) |

Run the tests with `npm test`. They use Node's built-in runner, mock every
Google call and consume no API quota.
