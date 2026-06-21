import data from "../data/areas.json";

// Programmatic "Belgrade by neighbourhood" area pages. Data-driven (src/data/
// areas.json), rendered statically via src/pages/areas/[area].astro. A hard
// THIN-CONTENT GUARD (validArea) means a sparse record is simply not generated —
// so the generator can never ship a weak page. Indexing is gated by
// site-config `programmatic.areasIndexable` (noindex-first; flip on after review).

export type AreaFaq = { question: string; answer: string };
export type Area = {
  slug: string;
  name: string;
  localName?: string;
  municipality: string;
  riverSide: string;
  walkToCenter: string;
  lede: string;
  character: string;
  gettingAround: string;
  stayNotes: string;
  bestFor: string[];
  notIdealFor: string[];
  nearby: string[];
  faqs: AreaFaq[];
  relatedArticles: string[];
};

export type AreaSection = { slug: string; eyebrow: string; title: string; lede: string };

export const areaSection: AreaSection = data.section;

// Thin-content guard: every field that makes a page genuinely useful must be
// present and substantial. Returns true only for records worth publishing.
export function validArea(a: Partial<Area>): a is Area {
  return !!(
    a &&
    a.slug &&
    a.name &&
    a.municipality &&
    a.riverSide &&
    a.walkToCenter &&
    typeof a.lede === "string" && a.lede.length >= 40 &&
    typeof a.character === "string" && a.character.length >= 280 &&
    typeof a.gettingAround === "string" && a.gettingAround.length >= 40 &&
    typeof a.stayNotes === "string" && a.stayNotes.length >= 40 &&
    Array.isArray(a.bestFor) && a.bestFor.length >= 2 &&
    Array.isArray(a.notIdealFor) && a.notIdealFor.length >= 1 &&
    Array.isArray(a.nearby) && a.nearby.length >= 2 &&
    Array.isArray(a.faqs) && a.faqs.length >= 2 &&
    Array.isArray(a.relatedArticles) && a.relatedArticles.length >= 1
  );
}

export function validAreas(): Area[] {
  const all = (data.areas as Partial<Area>[]) ?? [];
  const out: Area[] = [];
  for (const a of all) {
    if (validArea(a)) out.push(a);
    else if (a && a.slug) console.warn(`[areas] skipped "${a.slug}" — fails thin-content guard`);
  }
  return out;
}

export function areaBySlug(slug: string): Area | undefined {
  return validAreas().find((a) => a.slug === slug);
}

const list = (items: string[]) => items.join(", ");

// SEO title/description for an area page (answer-style, query-shaped).
export function areaTitle(a: Area): string {
  return `${a.name}, Belgrade — neighbourhood guide & where to stay`;
}
export function areaDescription(a: Area): string {
  return `${a.name} in Belgrade: where it sits (${a.riverSide.toLowerCase()}), what it's like, who it suits, getting around, and what's nearby. ${a.lede}`.slice(0, 320);
}

// Build the article BODY markdown (H2+) from the structured record. The H1, lede
// and FAQ JSON-LD render from the page; this is the readable prose.
export function areaBodyMarkdown(a: Area): string {
  const parts: string[] = [];
  parts.push("## Quick orientation");
  parts.push("");
  parts.push(`- **River & position:** ${a.riverSide}`);
  parts.push(`- **Getting to the centre:** ${a.walkToCenter}`);
  parts.push(`- **Municipality:** ${a.municipality}`);
  parts.push(`- **Best for:** ${list(a.bestFor)}`);
  parts.push("");
  parts.push(`## What ${a.name} is like`);
  parts.push("");
  parts.push(a.character);
  parts.push("");
  parts.push("## Who should stay here");
  parts.push("");
  parts.push(`**A good fit if you want:** ${list(a.bestFor)}.`);
  parts.push("");
  parts.push(`**Maybe look elsewhere if you're after:** ${list(a.notIdealFor)}.`);
  parts.push("");
  parts.push("## Getting around");
  parts.push("");
  parts.push(a.gettingAround);
  parts.push("");
  parts.push("## Where to stay & what's nearby");
  parts.push("");
  parts.push(a.stayNotes);
  parts.push("");
  parts.push(`**Nearby:** ${list(a.nearby)}.`);
  parts.push("");
  parts.push("## Common questions");
  parts.push("");
  for (const f of a.faqs) {
    parts.push(`### ${f.question}`);
    parts.push("");
    parts.push(f.answer);
    parts.push("");
  }
  return parts.join("\n");
}
