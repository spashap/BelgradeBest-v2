// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import schema from "./src/data/site-schema.json" with { type: "json" };
import config from "./src/data/site-config.json" with { type: "json" };
import pagesData from "./src/data/site-pages.json" with { type: "json" };

// Production domain. Canonical/sitemap URLs use this even while the V2 build is
// served from a temporary *.vercel.app URL (domain switch happens later).
const SITE = config.brand.origin;

// Leg slugs (one path segment that is a real leg hub, vs a utility page).
const LEG_SLUGS = new Set(schema.legs.map((l) => l.slug));

// noindex path set — kept OUT of the sitemap (a noindex page in a sitemap is
// contradictory). Article noindex is propagated from its leg by the porter, so
// leg.noindex is the authoritative signal here too. Flipping a leg to indexable
// (the SEO-on lever) automatically re-adds it + its articles to the sitemap.
const NOINDEX = new Set();
if (config.seo.homeNoindex) NOINDEX.add("");
for (const leg of schema.legs) {
  if (leg.noindex) {
    NOINDEX.add(`/${leg.slug}`);
    for (const s of leg.slugs) NOINDEX.add(`/${leg.slug}/${s.slug}`);
  }
}
for (const p of pagesData.pages) {
  if (p.noindex) NOINDEX.add(`/${p.slug}`);
}

const pathOf = (url) => new URL(url).pathname.replace(/\/$/, "");

export default defineConfig({
  site: SITE,
  output: "static",
  trailingSlash: "never",
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
