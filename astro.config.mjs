// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import schema from "./src/data/site-schema.json" with { type: "json" };
import config from "./src/data/site-config.json" with { type: "json" };
import pagesData from "./src/data/site-pages.json" with { type: "json" };
import areasData from "./src/data/areas.json" with { type: "json" };
import glossaryData from "./src/data/glossary.json" with { type: "json" };
import expoParticipants from "./src/data/expo-participants.json" with { type: "json" };

// Per-article last-modified dates for the sitemap, read from each markdown
// file's `lastUpdated` frontmatter (a freshness signal for search engines).
// Keyed by URL path "/<leg>/<slug>". Non-article pages fall back to build date.
const ARTICLES_DIR = "src/content/articles";
const BUILD_DATE = new Date().toISOString();
const LASTMOD = {};
try {
  for (const leg of readdirSync(ARTICLES_DIR)) {
    const legDir = join(ARTICLES_DIR, leg);
    if (!statSync(legDir).isDirectory()) continue;
    for (const file of readdirSync(legDir)) {
      if (!file.endsWith(".md")) continue;
      const txt = readFileSync(join(legDir, file), "utf8");
      const m = txt.match(/^lastUpdated:\s*["']?(\d{4}-\d{2}-\d{2})/m);
      if (m) LASTMOD[`/${leg}/${file.replace(/\.md$/, "")}`] = new Date(m[1]).toISOString();
    }
  }
} catch {
  /* no articles dir — leave map empty */
}

// Real lastmod for non-article pages too (previously they re-stamped BUILD_DATE
// on every deploy — lastmod churn teaches crawlers to ignore the field).
// Sources: per-record `updated` in glossary.json/areas.json, per-page `updated`
// in site-pages.json; hubs get the newest date of their children.
const iso = (d) => new Date(d).toISOString();
const maxDate = (dates) => (dates.length ? iso(dates.reduce((a, b) => (a > b ? a : b))) : undefined);
for (const t of glossaryData.terms) if (t.updated) LASTMOD[`/glossary/${t.slug}`] = iso(t.updated);
for (const a of areasData.areas) if (a.updated) LASTMOD[`/areas/${a.slug}`] = iso(a.updated);
for (const p of pagesData.pages) if (p.updated) LASTMOD[`/${p.slug}`] = iso(p.updated);
// Standalone .astro pages (no data master of their own): the tracker inherits
// the participant dataset's `updated`; the rest carry a hand-bumped date here —
// bump it when the page content changes (never let these fall to BUILD_DATE).
LASTMOD["/expo-2027/tracker"] = iso(expoParticipants.updated);
LASTMOD["/expo-2027/countdown"] = iso("2026-07-05");
LASTMOD["/for-businesses"] = iso("2026-07-05");
{
  const g = maxDate(glossaryData.terms.map((t) => t.updated).filter(Boolean));
  if (g) LASTMOD["/glossary"] = g;
  const ar = maxDate(areasData.areas.map((a) => a.updated).filter(Boolean));
  if (ar) LASTMOD["/areas"] = ar;
  // Leg hubs + home: newest article date is the honest proxy for "last changed".
  for (const leg of schema.legs) {
    const dates = leg.slugs.map((s) => LASTMOD[`/${leg.slug}/${s.slug}`]).filter(Boolean);
    const m = maxDate(dates);
    if (m) LASTMOD[`/${leg.slug}`] = m;
  }
  const home = maxDate(Object.values(LASTMOD));
  if (home) LASTMOD[""] = home;
}

// Production domain. Canonical/sitemap URLs use this even while the V2 build is
// served from a temporary *.vercel.app URL (domain switch happens later).
const SITE = config.brand.origin;

// Leg slugs (one path segment that is a real leg hub, vs a utility page).
const LEG_SLUGS = new Set(schema.legs.map((l) => l.slug));

// noindex path set — kept OUT of the sitemap (a noindex page in a sitemap is
// contradictory). Article noindex is propagated from its leg by the porter, so
// leg.noindex is the authoritative signal here too. Flipping a leg to indexable
// (the SEO-on lever) automatically re-adds it + its articles to the sitemap.
// Paths kept OUT of the sitemap: noindex (above) AND hidden (visible:false).
// A hidden leg/slug is removed from every public surface, so it must not appear
// in the sitemap either. Unhiding re-adds it automatically.
const NOINDEX = new Set();
if (config.seo.homeNoindex) NOINDEX.add("");
for (const leg of schema.legs) {
  const legHidden = leg.visible === false;
  if (leg.noindex || legHidden) {
    NOINDEX.add(`/${leg.slug}`);
    for (const s of leg.slugs) NOINDEX.add(`/${leg.slug}/${s.slug}`);
  } else {
    for (const s of leg.slugs) if (s.visible === false) NOINDEX.add(`/${leg.slug}/${s.slug}`);
  }
}
for (const p of pagesData.pages) {
  if (p.noindex) NOINDEX.add(`/${p.slug}`);
}
// Programmatic /areas pages ship noindex-first: keep them (and the hub) out of
// the sitemap + IndexNow until `programmatic.areasIndexable` is flipped to true.
if (config.programmatic?.areasIndexable !== true) {
  NOINDEX.add("/areas");
  for (const a of areasData.areas) NOINDEX.add(`/areas/${a.slug}`);
}
// Programmatic /glossary spoke pages ship noindex-first too — same gate.
if (config.programmatic?.glossaryIndexable !== true) {
  NOINDEX.add("/glossary");
  for (const t of glossaryData.terms) NOINDEX.add(`/glossary/${t.slug}`);
}
// Claimable listings (Phase 1: /expo-2027/pavilions) — noindex-first behind
// programmatic.listingsIndexable. Section segments mirror src/lib/listings.ts
// SECTION (keep in sync). lastmod comes from each listing file's `updated`;
// the hub inherits the newest one.
const LISTING_SECTION = { "expo-2027": "pavilions" };
const LISTINGS_INDEXABLE = config.programmatic?.listingsIndexable === true;
for (const [leg, section] of Object.entries(LISTING_SECTION)) {
  if (!LISTINGS_INDEXABLE) NOINDEX.add(`/${leg}/${section}`);
}
try {
  const LISTINGS_DIR = "src/data/listings";
  for (const leg of readdirSync(LISTINGS_DIR)) {
    const legDir = join(LISTINGS_DIR, leg);
    if (!statSync(legDir).isDirectory()) continue;
    const hub = `/${leg}/${LISTING_SECTION[leg] ?? "places"}`;
    const dates = [];
    for (const file of readdirSync(legDir)) {
      if (!file.endsWith(".json")) continue;
      const j = JSON.parse(readFileSync(join(legDir, file), "utf8"));
      // Children (listings with `parent`) live one segment deeper.
      const slug = j.slug ?? file.replace(/\.json$/, "");
      const p = j.parent ? `${hub}/${j.parent}/${slug}` : `${hub}/${slug}`;
      if (j.updated) {
        LASTMOD[p] = iso(j.updated);
        dates.push(LASTMOD[p]);
      }
      if (!LISTINGS_INDEXABLE) NOINDEX.add(p);
    }
    const m = maxDate(dates);
    if (m) LASTMOD[hub] = m;
  }
} catch {
  /* no listings yet */
}

const pathOf = (url) => new URL(url).pathname.replace(/\/$/, "");

// ── IndexNow auto-ping ──────────────────────────────────────────────────────
// On a production Vercel build, submit the indexable URL set to IndexNow
// (Bing/Yandex/Seznam/…) so new + changed pages get crawled fast — a real lever
// on a young domain. Runs inside `astro:build:done` (always fires on Vercel's
// `astro build`), so no npm-lifecycle/.vercelignore concerns. The key is public
// by design (hosted at /<key>.txt). Never fails the build; no-ops off-prod.
const INDEXNOW_KEY = "14ec77dc669e4a48947348a73e9ee9b7";
function indexNow() {
  return {
    name: "indexnow-ping",
    hooks: {
      "astro:build:done": async ({ pages, logger }) => {
        try {
          if (process.env.VERCEL_ENV !== "production") {
            logger.info("skipped (not a production Vercel build)");
            return;
          }
          const host = new URL(SITE).host;
          const urls = [];
          const seen = new Set();
          for (const { pathname } of pages) {
            const trimmed = String(pathname).replace(/^\//, "").replace(/\/$/, "");
            // canonical content pages only — drop assets/endpoints + admin/api
            if (trimmed.includes(".") || trimmed.startsWith("admin") || trimmed.startsWith("api/")) continue;
            const key = trimmed === "" ? "" : `/${trimmed}`;
            if (NOINDEX.has(key)) continue;
            const url = `${SITE}${key}`;
            if (seen.has(url)) continue;
            seen.add(url);
            urls.push(url);
          }
          if (urls.length === 0) {
            logger.warn("no indexable URLs to submit");
            return;
          }
          const res = await fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
              host,
              key: INDEXNOW_KEY,
              keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
              urlList: urls,
            }),
          });
          logger.info(`submitted ${urls.length} URLs → ${res.status} ${res.statusText}`);
        } catch (err) {
          logger.warn(`ping failed (non-fatal): ${err?.message ?? err}`);
        }
      },
    },
  };
}

export default defineConfig({
  site: SITE,
  // Public pages are prerendered to static HTML (the default). Only the /admin
  // pages + /api/admin endpoints opt out via `export const prerender = false`,
  // running as Vercel serverless functions. The adapter enables that.
  output: "static",
  adapter: vercel(),
  trailingSlash: "never",
  // The admin login/forms POST same-origin, but Astro's default checkOrigin CSRF
  // guard misfires behind Vercel's proxy (compares the Origin header to Vercel's
  // internal host) and blocks them with "Cross-site POST form submissions are
  // forbidden". The only on-demand routes are /admin + /api/admin, which are
  // password-gated (ADMIN_ENTRY); the public site is fully static. Safe to disable.
  security: { checkOrigin: false },
  // Local dev + preview run on :5000 (project convention). The admin tool is a
  // separate process on :4000. Production builds are static (port is irrelevant).
  server: { port: 5000, host: false },
  preview: { port: 5000, host: false },
  // Markdown parity with the old react-markdown (plain CommonMark) path:
  // SmartyPants OFF (no curly-quote/dash rewriting). Frozen by the Phase-4 gate.
  markdown: {
    gfm: true,
    smartypants: false,
  },
  integrations: [
    sitemap({
      filter: (page) => {
        const path = pathOf(page);
        if (path.includes("/admin")) return false;
        return !NOINDEX.has(path);
      },
      // Priority parity with the old app/sitemap.ts.
      serialize(item) {
        const path = pathOf(item.url);
        const segs = path.split("/").filter(Boolean);
        item.lastmod = LASTMOD[path] || BUILD_DATE;
        item.changefreq = "weekly";
        if (path === "") {
          item.priority = 1.0;
        } else if (segs.length === 1) {
          // Leg hubs 0.9, programmatic section hubs 0.7, utility pages 0.3.
          const isProgHub = segs[0] === "areas" || segs[0] === "glossary";
          item.priority = LEG_SLUGS.has(segs[0]) ? 0.9 : isProgHub ? 0.7 : 0.3;
          if (!LEG_SLUGS.has(segs[0]) && !isProgHub) item.changefreq = "yearly";
        } else {
          item.priority = 0.8;
        }
        return item;
      },
    }),
    indexNow(),
  ],
});
