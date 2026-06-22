import data from "../data/glossary.json";

// Programmatic "Belgrade A–Z" glossary spoke pages (hub-and-spoke SEO). Same
// machinery as lib/areas.ts: data-driven (src/data/glossary.json), rendered
// statically via src/pages/glossary/[term].astro, with a hard THIN-CONTENT GUARD
// (validTerm) so a sparse record is simply not generated. Indexing is gated by
// site-config `programmatic.glossaryIndexable` (noindex-first; flip on after review).

export type GlossaryFaq = { question: string; answer: string };
export type GlossaryTerm = {
  slug: string;
  term: string;
  localTerm?: string;
  category: string;
  pronunciation?: string;
  aliases?: string[];
  short: string;
  body: string;
  related: string[];
  faqs: GlossaryFaq[];
};

export type GlossarySection = { slug: string; eyebrow: string; title: string; lede: string };

export const glossarySection: GlossarySection = data.section;

// Thin-content guard: a record must carry a real definition, a substantial body,
// at least one related link and at least one FAQ to be worth publishing. Returns
// true only for records that clear the bar — mirrors validArea() in lib/areas.ts.
export function validTerm(t: Partial<GlossaryTerm>): t is GlossaryTerm {
  return !!(
    t &&
    t.slug &&
    t.term &&
    t.category &&
    typeof t.short === "string" && t.short.length >= 40 &&
    typeof t.body === "string" && t.body.length >= 280 &&
    Array.isArray(t.related) && t.related.length >= 1 &&
    Array.isArray(t.faqs) && t.faqs.length >= 1
  );
}

export function validTerms(): GlossaryTerm[] {
  const all = (data.terms as Partial<GlossaryTerm>[]) ?? [];
  const out: GlossaryTerm[] = [];
  for (const t of all) {
    if (validTerm(t)) out.push(t);
    else if (t && t.slug) console.warn(`[glossary] skipped "${t.slug}" — fails thin-content guard`);
  }
  return out;
}

export function termBySlug(slug: string): GlossaryTerm | undefined {
  return validTerms().find((t) => t.slug === slug);
}

// All known terms keyed by slug — used by the auto-linker and cross-link resolver.
export function termsByHref(): Map<string, GlossaryTerm> {
  const m = new Map<string, GlossaryTerm>();
  for (const t of validTerms()) m.set(`/${glossarySection.slug}/${t.slug}`, t);
  return m;
}

// SEO title/description for a term page (answer-style, query-shaped — wins
// "what is X" + AI-citation). Kept short enough for SERP/OG.
export function termTitle(t: GlossaryTerm): string {
  return `What is a ${t.term}? Belgrade & Serbia glossary`;
}
export function termDescription(t: GlossaryTerm): string {
  return t.short.slice(0, 320);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Build the readable BODY markdown (H2+) from the structured record. The H1, lede
// and FAQ JSON-LD render from the page; this is the prose between them.
export function termBodyMarkdown(t: GlossaryTerm): string {
  const parts: string[] = [];
  parts.push(`## What ${t.term} means`);
  parts.push("");
  const facts: string[] = [];
  if (t.localTerm) facts.push(`- **In Serbian:** ${t.localTerm}`);
  if (t.pronunciation) facts.push(`- **Pronounced:** ${t.pronunciation}`);
  facts.push(`- **Category:** ${t.category}`);
  parts.push(facts.join("\n"));
  parts.push("");
  // The body field already holds 2–4 paragraphs (\n\n separated); render as-is.
  parts.push(t.body);
  parts.push("");
  if (t.faqs.length) {
    parts.push(`## Common questions about ${cap(t.term)}`);
    parts.push("");
    for (const f of t.faqs) {
      parts.push(`### ${f.question}`);
      parts.push("");
      parts.push(f.answer);
      parts.push("");
    }
  }
  return parts.join("\n");
}
