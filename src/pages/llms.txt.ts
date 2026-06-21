import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE, CONFIG } from "../lib/site";
import { clusters } from "../lib/clusters";

// /llms.txt — a clean, link-first map of the site for LLM answer engines
// (ChatGPT, Perplexity, Google AI Overviews, Claude). Follows the llms.txt
// convention: an H1, a blockquote summary, then curated sections of links with
// one-line descriptions. Built at build time from the same masters the site
// renders from, so it never drifts. Excludes hidden + noindex legs/articles.

const clean = (s: string): string => s.replace(/\s+/g, " ").trim();

export const GET: APIRoute = async () => {
  const all = (await getCollection("articles")).filter(
    (a) => a.data.visible !== false && a.data.noindex !== true,
  );

  // Index articles by leg, ordered by their `order` field.
  const byLeg = new Map<string, typeof all>();
  for (const a of all) {
    const arr = byLeg.get(a.data.leg) ?? [];
    arr.push(a);
    byLeg.set(a.data.leg, arr);
  }
  for (const arr of byLeg.values()) arr.sort((a, b) => a.data.order - b.data.order);

  const lines: string[] = [];
  lines.push(`# ${SITE.name}`);
  lines.push("");
  lines.push(`> ${clean(CONFIG.seo.rootDescription)}`);
  lines.push("");
  lines.push(
    clean(
      "BelgradeBest is an independent, English-language guide to Belgrade, Serbia, written for foreign visitors and newcomers. Pages are grounded in a source-checked knowledge base and mark facts as confirmed, reported, or unknown. Belgrade hosts a Specialised Expo from 15 May to 15 August 2027.",
    ),
  );
  lines.push("");

  // Visible, indexable legs in display order, each with its articles.
  for (const c of clusters) {
    if (c.hidden || c.noindex) continue;
    const arts = byLeg.get(c.slug);
    if (!arts || arts.length === 0) continue;
    lines.push(`## ${c.title}`);
    lines.push("");
    if (c.tagline) {
      lines.push(`${clean(c.tagline)}`);
      lines.push("");
    }
    for (const a of arts) {
      const url = `${SITE.origin}/${a.data.leg}/${a.data.slug}`;
      lines.push(`- [${clean(a.data.title)}](${url}): ${clean(a.data.description)}`);
    }
    lines.push("");
  }

  // Key non-article pages.
  lines.push("## About");
  lines.push("");
  lines.push(`- [About ${SITE.name}](${SITE.origin}/about): Who makes this guide and how it is written.`);
  lines.push(`- [How we make money](${SITE.origin}/how-we-make-money): Our independence and affiliate policy.`);
  lines.push(`- [Contact](${SITE.origin}/contact): How to reach the team.`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
