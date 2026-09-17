# BelgradeBest Growth API — Connector Handoff

Everything a Growth connector needs to consume the API. Verified against
production on 2026-09-10 (site version V01.030, commit `0a373b1`).

---

## Production base URL

```
https://belgradebest.com
```

There is no staging or sandbox environment. The API is served by Vercel
serverless functions; the rest of the site is static.

---

## Endpoints

All three are `GET` only and read-only. They never write, and they expose
aggregate data only.

| Endpoint | Returns |
|---|---|
| `GET /api/growth/summary` | Traffic KPIs, new vs returning, devices, countries, GA4 channel groups, source/medium with platform buckets, landing pages, Google Search clicks/impressions/CTR/position with top queries and pages, and the Expo 2027 cluster (traffic, search, listing counts, lead count) |
| `GET /api/growth/content` | Per-page performance: GA4 joined with Search Console on the normalised path, classified by content type and section, with landing-session channel splits and a per-section roll-up |
| `GET /api/growth/changes` | The growth change log — a dated record of site changes that could move the metrics |

---

## Query parameters and defaults

| Endpoint | Parameter | Format | Default |
|---|---|---|---|
| `summary`, `content` | `from` | `YYYY-MM-DD` | `to` minus 27 days |
| `summary`, `content` | `to` | `YYYY-MM-DD` | yesterday (UTC) |
| `content` | `limit` | integer 1–200 | 50 |
| `changes` | `since` | ISO-8601 timestamp | none (returns the whole log) |

All parameters are optional. The default window is the 28 days ending
yesterday, because today's analytics figures are still moving and Search
Console has no data for today.

Constraints: the period may not exceed 366 days, `to` may not be in the future,
and `from` may not be after `to`. All dates are UTC calendar days. `since` is
inclusive — entries with `timestamp >= since` are returned, oldest first.

---

## Bearer authentication

Every request must send:

```
Authorization: Bearer <GROWTH_AGENT_TOKEN>
```

The token is a server-side environment variable held in the Vercel project. It
is **not** included in this document. Request it from the site owner through a
secure channel.

Notes for the connector implementation:

- The scheme is matched case-insensitively (`Bearer` and `bearer` both work).
- Comparison is constant-time, so a wrong token reveals nothing through timing.
- Browser session cookies are **not** accepted. This is machine auth only.
- There is one token and no token list. If it is rotated, the old value stops
  working immediately on the next deploy.
- Treat the token as a credential granting read access to traffic and search
  data. Store it in a secret manager, never in source control.

---

## Error codes

| Status | Body `error` | Meaning | Connector should |
|---|---|---|---|
| `200` | — | Success. Inspect `data_quality` before using the numbers. | Proceed |
| `400` | `bad_request` | Malformed `from`, `to`, `since` or `limit`. `message` says which. | Fix the request; do not retry unchanged |
| `401` | `unauthorized` | Missing or wrong bearer token. Response carries `WWW-Authenticate: Bearer`. | Check the credential; do not retry unchanged |
| `405` | `method_not_allowed` | A non-GET method reached the handler. | Use GET |
| `500` | `internal` | Unexpected server error. | Retry once with backoff |
| `503` | `growth_api_not_configured` | `GROWTH_AGENT_TOKEN` is not set on the server. | Alert a human; retrying will not help |

Error bodies are terse JSON (`{"error":..., "message":...}`) and never contain a
`data` object.

Every response — success and refusal alike — carries
`Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow`.

**Known quirk:** sending `POST`, `PUT` or `DELETE` to these paths returns a
generic Vercel `500 FUNCTION_INVOCATION_FAILED` rather than the handler's `405`.
This is pre-existing platform behaviour affecting every API route on this site,
not specific to the Growth API, and the error page leaks no internal detail. A
GET-only connector never encounters it.

---

## Cache behaviour

Upstream results are memoised inside the serverless function:

| Source | TTL |
|---|---|
| Google Analytics 4 | 30 minutes |
| Google Search Console | 6 hours |

This cache is **opportunistic, not guaranteed**. It lives in the memory of one
warm serverless instance. A cold start, or a request routed to a different
instance, simply misses and fetches fresh data. Two identical calls a minute
apart may legitimately show different cache states.

Consequences for the connector:

- Do not treat a cache hit as a correctness guarantee, and do not assume a
  repeated call is free.
- `data_quality.sources` tells you which state you got (see below).
- Failed upstream calls are never cached, so a retry genuinely retries.
- Concurrent identical requests share one in-flight upstream call.
- Polling more often than every 30 minutes yields no new GA4 data and wastes
  quota. Once or twice a day is appropriate for this dataset.

Responses are `no-store`, so no CDN or browser layer caches them.

---

## Data-quality behaviour

Every response carries the same envelope:

```json
{
  "schema_version": "1",
  "project": "belgradebest",
  "generated_at": "2026-09-10T14:11:19.029Z",
  "period": { "from": "2026-08-13", "to": "2026-09-09", "timezone": "UTC" },
  "data_quality": {
    "status": "ok",
    "warnings": [],
    "sources": { "ga4": "ok", "gsc": "ok" }
  },
  "data": {}
}
```

`status` is `ok` or `partial`. It becomes `partial` only when an upstream
provider was unavailable — never because of an informational limitation.

`sources` reports each provider independently:

| Value | Meaning |
|---|---|
| `ok` | fetched live during this request |
| `cached` | served from the warm-instance cache |
| `unavailable` | the call failed or is not configured; a warning explains why |
| `not_applicable` | the provider legitimately has nothing for this period |

**One provider failing does not fail the response.** If Search Console is down,
GA4 traffic data is still returned with `status: "partial"`, `sources.gsc:
"unavailable"` and a warning naming the provider. The reverse also holds. A
connector should therefore always read `status` and `sources` before charting,
and should never treat a `partial` response as a hard failure.

**Distinguish absent from zero.** A `null` field means not measured. A `0` means
measured as zero. These are different and should not be merged.

`warnings` always contains the two standing limitations below, so the connector
never has to infer them.

---

## Major metric limitations

These are structural properties of the site, not bugs. Surface them wherever the
connector presents the data.

**No conversion tracking.** The site defines no analytics key events, and
business leads and claims are stored as repository files rather than events.
`data.conversions` is always `null`. No conversion, goal or funnel figure exists
and none is estimated. The lead **count** in `summary` is a count of stored lead
files; it cannot be attributed to a session, channel or page.

**No post-level social attribution.** Historical visits carry no `utm_content`
or `utm_campaign`, so an individual social post cannot be measured. Only
platform-level source and medium are available. Both `summary` and `content`
state this explicitly as `post_level_attribution: false`.

**No per-partner attribution for embedded widgets.** Traffic arriving from the
site's free embeddable widgets appears under the `embed_widget` platform, which
identifies the *widget*, not the *partner site*. Every partner embedding the
same widget sends identical campaign parameters, and those parameters override
the referrer, so the embedding domain is not recoverable.

**Google Search only.** There is no Bing Webmaster Tools integration, even
though Bing-derived engines currently send substantially more organic traffic to
this site than Google does. Any "search" figure in this API means Google.

**Search Console lags about two days.** Every search window is clamped to
`today − 2`. The dates actually queried are returned in `seo.window`, with a
warning when they differ from the requested period. A period falling entirely
inside the lag returns `sources.gsc: "not_applicable"` with zeroed search
figures, and the request still succeeds.

**Same-day analytics data is incomplete.** This is why the default period ends
yesterday.

**No backlink, index-coverage or ranking-history data**, and no local historical
storage of any kind. Every response is computed live from what the providers
return for the requested window. Retention is whatever the underlying Google
properties keep; Search Console holds 16 months.

**Aggregate only.** No user-level, session-level or IP data is exposed. Business
contact details, outreach pipeline status, access tokens and lead contents are
never returned — counts only.

---

## Production smoke-test status

Executed against production on 2026-09-10, site version V01.030.
**61 of 62 checks passed.** The single failure is the documented non-GET method
quirk above, which is pre-existing platform behaviour and does not affect a
GET-only consumer.

| Area | Result |
|---|---|
| Latest code deployed | PASS — live version matches the committed version |
| `GROWTH_AGENT_TOKEN` present in production | PASS — confirmed behaviourally (no-token requests return 401, not 503) |
| `/api/growth/summary` | PASS — 200 with populated data |
| `/api/growth/content` | PASS — 200, 25 of 92 pages returned |
| `/api/growth/changes` | PASS — 200, 2 change entries |
| Bearer auth: no token | PASS — 401 with `WWW-Authenticate`, no data body |
| Bearer auth: wrong token | PASS — 401 |
| Bearer auth: valid token | PASS — 200 |
| `project` = `belgradebest` | PASS — on all three endpoints |
| `schema_version` = `1` | PASS — on all three endpoints |
| Envelope: period, UTC, ISO timestamp | PASS — on all three endpoints |
| Response headers no-store + noindex | PASS — on 200, 400, 401 and 503 |
| GA4 queries work | PASS — traffic, channels, devices, countries, landing pages all populated |
| GA4 source/medium bucketing | PASS — 24 source rows resolved into 12 platform buckets |
| GSC queries work | PASS — clicks, impressions, position, top queries and pages returned |
| GSC lag clamp | PASS — window reported; a period inside the lag returns `not_applicable` with HTTP 200 |
| GSC duplicate page paths folded | PASS — all returned paths unique |
| Content returns page data | PASS — classified across 8 content types and 10 sections |
| Content excludes internal surfaces | PASS — no admin, api, manage or 404 paths present |
| Changes returns the deployed log | PASS — entries well-formed, ordered oldest to newest |
| Changes `?since` filtering | PASS |
| `data_quality.sources` behaviour | PASS — per-provider states reported correctly |
| TTL cache | PASS — repeat call reported `cached` |
| Invalid date handling | PASS — 400 `bad_request` |
| No private or personal data returned | PASS — nine separate scans across all payloads found no contact object, outreach object, access token, email address, service-account credential, repository credential or pipeline field |
| Leads and listings exposed as counts only | PASS |
| Conversions not invented | PASS — `null` |
| Non-GET methods return 405 | FAIL — returns Vercel 500 `FUNCTION_INVOCATION_FAILED` instead; pre-existing behaviour on every API route on this site, no information leaked, unreachable by a GET-only consumer |

**Verdict: production ready for a GET-only connector.**
