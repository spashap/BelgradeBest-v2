#!/usr/bin/env node
/**
 * submit-to-bing.mjs — push URLs into Bing's crawl queue directly.
 *
 * WHY THIS EXISTS
 * The IndexNow integration in astro.config.mjs cannot reach Microsoft: their
 * endpoint 403s "UserForbiddedToAccessSite" for this host (verified 2026-08-20),
 * so build-time pings only ever land at Yandex/Seznam/Naver. Anything Bing does
 * not find by ordinary crawling therefore never gets submitted at all — which is
 * how the whole German /de/ set sat uncrawled for its first nine days while Bing
 * was crawling 100+ English pages a day.
 *
 * Bing Webmaster's own URL Submission API has no such block and ships a free
 * 100/day, 1800/month quota. This script is the manual channel that fills the
 * IndexNow gap. Bing is this site's live search channel (~6x Google's
 * impressions, effectively all organic clicks), so a URL Bing has not crawled
 * is a URL that does not exist.
 *
 * NOT DEPLOYED — scripts/ is .vercelignore'd. Owner-run, like gen-*.mjs.
 *
 * CREDENTIALS (never committed)
 *   BING_API_KEY env var, else bing_api_key from
 *   ~/.config/claude-seo/backlinks-api.json (this machine's SEO toolkit config).
 *
 * USAGE
 *   node scripts/submit-to-bing.mjs --prefix=/de/ --dry-run   # see the plan
 *   node scripts/submit-to-bing.mjs --prefix=/de/             # submit
 *   node scripts/submit-to-bing.mjs --prefix=/de/ --verify    # crawl status only
 *   node scripts/submit-to-bing.mjs --all --fresh             # whole sitemap,
 *                                                             # skipping crawled
 * FLAGS
 *   --prefix=<path>   only URLs whose path starts with this (repeatable)
 *   --all             no prefix filter (the entire sitemap)
 *   --fresh           drop URLs Bing has already crawled (1 API call per URL)
 *   --limit=<n>       cap the batch (default: the remaining daily quota)
 *   --dry-run         print the batch, submit nothing
 *   --verify          print each URL's Bing crawl status, submit nothing
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SITE = process.env.BING_SITE_URL || "https://belgradebest.com/";
const SITEMAP = new URL("/sitemap-index.xml", SITE).href;
const API = "https://ssl.bing.com/webmaster/api.svc/json";
// Bing's never-crawled sentinel: the API returns a year-3939 date, not null,
// for a URL it has never fetched.
const NEVER_YEAR = 3000;

// ── args ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const value = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
// Git Bash / MSYS rewrites a bare "/de/" argument into "C:/Program Files/de/"
// before node ever sees it. Catch that rather than silently matching nothing.
const normalisePrefix = (raw) => {
  if (/^[A-Za-z]:[/\\]/.test(raw)) {
    console.error(
      `--prefix was rewritten to "${raw}" by the shell (Git Bash/MSYS path conversion).\n` +
        "Run this from PowerShell, or prefix the command with MSYS_NO_PATHCONV=1.",
    );
    process.exit(1);
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
};
const prefixes = argv
  .filter((a) => a.startsWith("--prefix="))
  .map((a) => normalisePrefix(a.slice(9)));
const opts = {
  all: flag("all"),
  fresh: flag("fresh"),
  dryRun: flag("dry-run"),
  verify: flag("verify"),
  limit: value("limit") ? Number(value("limit")) : null,
};

if (!opts.all && prefixes.length === 0) {
  console.error("Refusing to run without a target: pass --prefix=/de/ (repeatable) or --all.");
  process.exit(1);
}

// ── credentials ─────────────────────────────────────────────────────────────
function apiKey() {
  if (process.env.BING_API_KEY) return process.env.BING_API_KEY;
  const cfg = path.join(os.homedir(), ".config", "claude-seo", "backlinks-api.json");
  try {
    const key = JSON.parse(fs.readFileSync(cfg, "utf8")).bing_api_key;
    if (key) return key;
  } catch {
    /* fall through to the error below */
  }
  console.error(
    `No Bing API key. Set BING_API_KEY, or put bing_api_key in ${cfg}.\n` +
      "The key comes from Bing Webmaster Tools -> Settings -> API access.",
  );
  process.exit(1);
}
const KEY = apiKey();

// ── Bing Webmaster API ──────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Bing answers HTTP 400 with an ErrorCode envelope instead of a proper status,
// so a plain res.ok check reads a retryable hiccup as a hard failure:
//   5 = ThrottleHost  — the per-host rate limit
//   2 = UnknownError  — transient; the same URL answers fine seconds later
// Both are retried with backoff. Everything else is a real error and throws.
const RETRYABLE = new Set([5, 2]);
async function get(method, params = {}, attempt = 0) {
  const qs = new URLSearchParams({ apikey: KEY, siteUrl: SITE, ...params });
  const res = await fetch(`${API}/${method}?${qs}`);
  const text = await res.text();
  if (!res.ok) {
    let code = null;
    try {
      code = JSON.parse(text).ErrorCode;
    } catch {
      /* not a Bing error envelope */
    }
    if (RETRYABLE.has(code) && attempt < 4) {
      await sleep(2000 * (attempt + 1));
      return get(method, params, attempt + 1);
    }
    throw new Error(`${method}: ${res.status} ${text.slice(0, 200)}`);
  }
  return JSON.parse(text).d;
}

async function post(method, body) {
  const res = await fetch(`${API}/${method}?apikey=${encodeURIComponent(KEY)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method}: ${res.status} ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
}

// Bing serialises dates as /Date(ms)/.
const asDate = (raw) => {
  const ms = raw && /\d+/.exec(String(raw));
  return ms ? new Date(Number(ms[0])) : null;
};
// null = never crawled, a Date = crawled then.
const crawledAt = (info) => {
  const d = asDate(info?.LastCrawledDate);
  return !d || d.getUTCFullYear() >= NEVER_YEAR ? null : d;
};

// ── the sitemap is the source of truth for what exists ──────────────────────
async function sitemapUrls() {
  const fetchLocs = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`sitemap ${url}: ${res.status}`);
    const xml = await res.text();
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  };
  const index = await fetchLocs(SITEMAP);
  // A sitemap index lists child sitemaps; a flat sitemap lists pages directly.
  const children = index.filter((u) => /sitemap[^/]*\.xml$/i.test(u));
  if (children.length === 0) return index;
  const pages = await Promise.all(children.map(fetchLocs));
  return [...new Set(pages.flat())];
}

// ── main ────────────────────────────────────────────────────────────────────
const all = await sitemapUrls();
const targeted = opts.all
  ? all
  : all.filter((u) => prefixes.some((p) => new URL(u).pathname.startsWith(p)));

console.log(
  `Sitemap: ${all.length} URLs — ${targeted.length} match ${opts.all ? "--all" : prefixes.join(", ")}`,
);
if (targeted.length === 0) {
  console.log("Nothing to do.");
  process.exit(0);
}

// --verify and --fresh both need per-URL crawl status.
let status = null;
if (opts.verify || opts.fresh) {
  status = new Map();
  let first = true;
  for (const url of targeted) {
    if (!first) await sleep(700); // stay under Bing's per-host rate limit
    first = false;
    try {
      status.set(url, crawledAt(await get("GetUrlInfo", { url })));
    } catch (e) {
      status.set(url, undefined); // unknown — never treated as "never crawled"
      console.warn(`  ! ${url}: ${e.message}`);
    }
  }
}

if (opts.verify) {
  console.log("\nBing crawl status");
  let crawled = 0;
  let unknown = 0;
  for (const url of targeted) {
    const at = status.get(url);
    // null = Bing says never crawled; undefined = the lookup itself failed.
    if (at) crawled++;
    else if (at === undefined) unknown++;
    const label = at ? at.toISOString().slice(0, 10) : at === null ? "NEVER CRAWLED" : "UNKNOWN (API error)";
    console.log(`  ${label.padEnd(19)}  ${url}`);
  }
  console.log(
    `\n${crawled}/${targeted.length} crawled by Bing` +
      (unknown ? `, ${unknown} could not be checked.` : "."),
  );
  process.exit(0);
}

const quota = await get("GetUrlSubmissionQuota");
console.log(`Quota: ${quota.DailyQuota}/day, ${quota.MonthlyQuota}/month remaining`);

let batch = opts.fresh ? targeted.filter((u) => status.get(u) === null) : targeted;
if (opts.fresh) console.log(`--fresh: ${batch.length} of ${targeted.length} never crawled`);

const cap = Math.min(opts.limit ?? Infinity, quota.DailyQuota, quota.MonthlyQuota);
if (batch.length > cap) {
  console.log(`Capping batch at ${cap} (quota/limit); re-run for the rest.`);
  batch = batch.slice(0, cap);
}
if (batch.length === 0) {
  console.log("Nothing to submit.");
  process.exit(0);
}

console.log(`\n${opts.dryRun ? "Would submit" : "Submitting"} ${batch.length} URLs:`);
for (const u of batch) console.log(`  ${u}`);

if (opts.dryRun) {
  console.log("\n--dry-run: nothing submitted.");
  process.exit(0);
}

await post("SubmitUrlBatch", { siteUrl: SITE, urlList: batch });
const after = await get("GetUrlSubmissionQuota");
console.log(
  `\nSubmitted ${batch.length}. Quota now ${after.DailyQuota}/day, ${after.MonthlyQuota}/month ` +
    `(used ${quota.DailyQuota - after.DailyQuota} daily, ${quota.MonthlyQuota - after.MonthlyQuota} monthly).`,
);
console.log("Bing typically crawls submitted URLs within 24-48h. Re-check with --verify.");
