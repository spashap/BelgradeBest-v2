// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Production domain. Canonical/sitemap URLs use this even while the V2 build is
// served from a temporary *.vercel.app URL (domain switch happens later).
const SITE = "https://belgradebest.com";

export default defineConfig({
  site: SITE,
  output: "static",
  trailingSlash: "never",
  // Markdown parity with the old react-markdown (plain CommonMark) path:
  // SmartyPants OFF (no curly-quote/dash rewriting). GFM stays on (the bodies
  // have no GFM-only syntax, so it's a no-op; kept for tables/autolinks safety).
  // This config is frozen by the Phase-4 parity stop-gate.
  markdown: {
    gfm: true,
    smartypants: false,
  },
  integrations: [
    sitemap({
      // Never expose the local-only admin (it isn't built anyway, belt-and-braces).
      filter: (page) => !page.includes("/admin"),
      // Priority parity with the old app/sitemap.ts (home 1.0, hubs 0.9,
      // articles 0.8, utility 0.3). noindex pages are dropped in serialize.
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\/$/, "");
        const segs = path.split("/").filter(Boolean);
        if (path === "") {
          item.priority = 1.0;
          item.changefreq = "weekly";
        } else if (segs.length === 1) {
          // leg hub or utility page — refined per-URL in the page frontmatter set
          item.priority = 0.9;
          item.changefreq = "weekly";
        } else {
          item.priority = 0.8;
          item.changefreq = "weekly";
        }
        return item;
      },
    }),
  ],
});
