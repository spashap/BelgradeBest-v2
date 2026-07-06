import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE, CONFIG } from "../lib/site";
import { clusters } from "../lib/clusters";
import { validTerms, glossarySection } from "../lib/glossary";
import { validAreas, areaSection } from "../lib/areas";
import { listingsForLeg, childrenOf, listingHref, listingsIndexable } from "../lib/listings";
import { metaTrim } from "../lib/text";

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

  // Programmatic knowledge sets (data-driven, not in the articles collection):
  // list them here too so answer engines see the long-tail definition/area pages.
  // Each is gated by its own indexable flag, so it stays out while noindex-first.
  const prog = (CONFIG as { programmatic?: { areasIndexable?: boolean; glossaryIndexable?: boolean } }).programmatic ?? {};
  if (prog.glossaryIndexable === true) {
    const terms = validTerms().slice().sort((a, b) => a.term.localeCompare(b.term));
    if (terms.length) {
      lines.push(`## ${glossarySection.title}`);
      lines.push("");
      lines.push(clean(glossarySection.lede));
      lines.push("");
      for (const t of terms) {
        lines.push(`- [${clean(t.term)}](${SITE.origin}/${glossarySection.slug}/${t.slug}): ${clean(t.short)}`);
      }
      lines.push("");
    }
  }
  if (prog.areasIndexable === true) {
    const areas = validAreas();
    if (areas.length) {
      lines.push(`## ${areaSection.title}`);
      lines.push("");
      lines.push(clean(areaSection.lede));
      lines.push("");
      for (const a of areas) {
        lines.push(`- [${clean(a.name)}](${SITE.origin}/${areaSection.slug}/${a.slug}): ${clean(a.lede)}`);
      }
      lines.push("");
    }
  }

  // Expo 2027 platform pages: the pavilion directory + data assets. Gated on
  // the listings indexable flag, like the other programmatic sets.
  if (listingsIndexable) {
    const pavilions = listingsForLeg("expo-2027");
    if (pavilions.length) {
      lines.push("## Expo 2027 pavilions & data");
      lines.push("");
      lines.push(
        clean(
          "Sourced profiles of national pavilions at Expo 2027 Belgrade (theme, design, budget, status), plus the independent participant tracker with the full named-country list and growth timeline.",
        ),
      );
      lines.push("");
      lines.push(
        `- [Expo 2027 participant tracker](${SITE.origin}/expo-2027/tracker): The official participant count, every publicly named country by region, and the growth timeline — sourced and downloadable as JSON.`,
      );
      lines.push(
        `- [Pavilion directory](${SITE.origin}/expo-2027/pavilions): Every named participant country, with profiles for pavilions that have announced plans.`,
      );
      lines.push(
        `- [Corporate & Best Practice Area](${SITE.origin}/expo-2027/corporate-area): The Expo's corporate zone — ~45 modular pavilions, who has joined, and how companies get in.`,
      );
      for (const p of pavilions) {
        lines.push(`- [${clean(p.name)}](${SITE.origin}${listingHref(p)}): ${clean(metaTrim(p.summary, 140))}`);
        for (const c of childrenOf("expo-2027", p.slug)) {
          lines.push(`- [${clean(c.name)}](${SITE.origin}${listingHref(c)}): ${clean(metaTrim(c.summary, 140))}`);
        }
      }
      lines.push("");
    }
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
