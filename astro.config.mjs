// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import schema from "./src/data/site-schema.json" with { type: "json" };
import config from "./src/data/site-config.json" with { type: "json" };
import pagesData from "./src/data/site-pages.json" with { type: "json" };

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

const pathOf = (url) => new URL(url).pathname.replace(/\/$/, "");

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
          item.priority = LEG_SLUGS.has(segs[0]) ? 0.9 : 0.3; // leg hub vs utility page
          if (!LEG_SLUGS.has(segs[0])) item.changefreq = "yearly";
        } else {
          item.priority = 0.8;
        }
        return item;
      },
    }),
  ],
});
