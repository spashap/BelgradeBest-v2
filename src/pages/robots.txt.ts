import type { APIRoute } from "astro";
import { SITE } from "../lib/site";

// Static robots.txt. Allows crawling of the public site, blocks the server-
// rendered /admin app + its API, and points at the @astrojs/sitemap index.
// AI answer-engine crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot,
// Google-Extended) are DELIBERATELY allowed — citations from AI search are a
// stated goal of this site. Revisit here if that policy ever changes.
export const GET: APIRoute = () => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "",
    `Sitemap: ${SITE.origin}/sitemap-index.xml`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
