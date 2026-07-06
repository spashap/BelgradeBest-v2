import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE, CONFIG } from "../lib/site";
import { clusterBySlug } from "../lib/clusters";
import { listingsForLeg, childrenOf, listingHref, listingsIndexable } from "../lib/listings";
import { metaTrim } from "../lib/text";

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
    .map((a) => ({
      title: a.data.title,
      href: `/${a.data.leg}/${a.data.slug}`,
      date: a.data.lastUpdated,
      category: clusterBySlug(a.data.leg)?.title ?? a.data.leg,
      description: a.data.description,
    }));

  // Published pavilion/listing profiles join the feed (gated on the same
  // indexable flag as the pages themselves) — answer engines and subscribers
  // see pavilion updates the same way they see article updates.
  const listings = listingsIndexable
    ? listingsForLeg("expo-2027").flatMap((p) => [
        {
          title: `${p.name} at Expo 2027 Belgrade`,
          href: listingHref(p),
          date: p.updated,
          category: "Expo 2027 pavilions",
          description: metaTrim(p.summary),
        },
        ...childrenOf("expo-2027", p.slug).map((c) => ({
          title: `${c.name} at Expo 2027 Belgrade`,
          href: listingHref(c),
          date: c.updated,
          category: "Expo 2027 pavilions",
          description: metaTrim(c.summary),
        })),
      ])
    : [];

  const entries = [...articles, ...listings]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 50);

  const items = entries
    .map((e) => {
      const url = SITE.origin + e.href;
      return [
        "    <item>",
        `      <title>${esc(e.title)}</title>`,
        `      <link>${esc(url)}</link>`,
        `      <guid isPermaLink="true">${esc(url)}</guid>`,
        `      <pubDate>${rfc822(e.date)}</pubDate>`,
        `      <category>${esc(e.category)}</category>`,
        `      <description>${esc(e.description)}</description>`,
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
