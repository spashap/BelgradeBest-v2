import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE, CONFIG } from "../lib/site";
import { clusters } from "../lib/clusters";
import { validTerms, glossarySection, termBodyMarkdown } from "../lib/glossary";
import { validAreas, areaSection, areaBodyMarkdown } from "../lib/areas";

// /llms-full.txt — the full-text companion to /llms.txt for LLM answer engines
// that ingest whole documents (RAG-style retrieval). Emits every indexable
// article's markdown body (plus the programmatic glossary/area page bodies),
// separated per document with its canonical URL, so an engine that fetched
// llms.txt can pull complete source text in one request. Built from the same
// masters as the site, so it never drifts from the noindex/visible flags.

const clean = (s: string): string => s.replace(/\s+/g, " ").trim();

export const GET: APIRoute = async () => {
  const all = (await getCollection("articles")).filter(
    (a) => a.data.visible !== false && a.data.noindex !== true,
  );

  const byLeg = new Map<string, typeof all>();
  for (const a of all) {
    const arr = byLeg.get(a.data.leg) ?? [];
    arr.push(a);
    byLeg.set(a.data.leg, arr);
  }
  for (const arr of byLeg.values()) arr.sort((a, b) => a.data.order - b.data.order);

  const lines: string[] = [];
  lines.push(`# ${SITE.name} — full text`);
  lines.push("");
  lines.push(`> ${clean(CONFIG.seo.rootDescription)}`);
  lines.push("");
  lines.push(
    clean(
      "Full markdown text of every indexable page, one document per section, each headed by its canonical URL. The link-only map is at /llms.txt.",
    ),
  );
  lines.push("");

  const pushDoc = (url: string, title: string, lede: string, body: string, updated?: string) => {
    lines.push("---");
    lines.push("");
    lines.push(`# ${clean(title)}`);
    lines.push("");
    lines.push(`Canonical: ${url}`);
    if (updated) lines.push(`Updated: ${updated}`);
    lines.push("");
    if (lede) {
      lines.push(clean(lede));
      lines.push("");
    }
    lines.push(body.trim());
    lines.push("");
  };

  for (const c of clusters) {
    if (c.hidden || c.noindex) continue;
    const arts = byLeg.get(c.slug);
    if (!arts) continue;
    for (const a of arts) {
      const url = `${SITE.origin}/${a.data.leg}/${a.data.slug}`;
      pushDoc(url, a.data.title, a.data.lede ?? "", a.body ?? "", a.data.lastUpdated);
    }
  }

  const prog = (CONFIG as { programmatic?: { areasIndexable?: boolean; glossaryIndexable?: boolean } }).programmatic ?? {};
  if (prog.glossaryIndexable === true) {
    for (const t of validTerms()) {
      pushDoc(
        `${SITE.origin}/${glossarySection.slug}/${t.slug}`,
        t.term,
        t.short,
        termBodyMarkdown(t),
        t.updated,
      );
    }
  }
  if (prog.areasIndexable === true) {
    for (const a of validAreas()) {
      pushDoc(
        `${SITE.origin}/${areaSection.slug}/${a.slug}`,
        `${a.name}, Belgrade — neighbourhood guide`,
        a.lede,
        areaBodyMarkdown(a),
        a.updated,
      );
    }
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
