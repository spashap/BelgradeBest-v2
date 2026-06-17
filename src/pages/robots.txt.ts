import type { APIRoute } from "astro";
import { SITE } from "../lib/site";

// Static robots.txt. Points at the @astrojs/sitemap index. No API routes on a
// static site, so nothing to disallow.
export const GET: APIRoute = () => {
  const body = [
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${SITE.origin}/sitemap-index.xml`,
    `Host: ${SITE.origin}`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
