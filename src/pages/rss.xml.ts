import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE, CONFIG } from "../lib/site";
import { clusterBySlug } from "../lib/clusters";

// Static RSS 2.0 feed of the latest articles — hand-rolled (no dependency), so
// it builds with the rest of the static site. Excludes hidden (visible:false)
// and noindex articles, matching the public/indexable surface. Newest first by
// `lastUpdated`. Linked from <head> in BaseLayout (rel="alternate"); also the
// input the optional syndication script reads.

const esc = (s: string): string =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

const rfc822 = (iso: string): string => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
};

export const GET: APIRoute = async () => {
  const articles = (await getCollection("articles"))
    .filter((a) => a.data.visible !== false && a.data.noindex !== true)
    .sort((a, b) => +new Date(b.data.lastUpdated) - +new Date(a.data.lastUpdated))
    .slice(0, 50);

  const items = articles
    .map((a) => {
      const href = `/${a.data.leg}/${a.data.slug}`;
      const url = SITE.origin + href;
      const cluster = clusterBySlug(a.data.leg);
      const category = cluster?.title ?? a.data.leg;
      return [
        "    <item>",
        `      <title>${esc(a.data.title)}</title>`,
        `      <link>${esc(url)}</link>`,
        `      <guid isPermaLink="true">${esc(url)}</guid>`,
        `      <pubDate>${rfc822(a.data.lastUpdated)}</pubDate>`,
        `      <category>${esc(category)}</category>`,
        `      <description>${esc(a.data.description)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const feedUrl = `${SITE.origin}/rss.xml`;
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.name)} — latest</title>
    <link>${esc(SITE.origin)}</link>
    <atom:link href="${esc(feedUrl)}" rel="self" type="application/rss+xml" />
    <description>${esc(CONFIG.seo.rootDescription)}</description>
    <language>${esc(CONFIG.brand.locale)}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
};
