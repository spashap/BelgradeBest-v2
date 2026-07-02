import schema from "../data/site-schema.json";
import { clusterBySlug } from "./clusters";
import { thumbForPath } from "./hero";
import { articlesByHref } from "./articles";
import { validAreas, areaSection } from "./areas";
import { termsByHref, glossarySection } from "./glossary";

// Internal-link model. The SINGLE editable master for related links is
// data/site-schema.json (slug.linksTo) — the local admin writes it; the site
// reads it here. relatedFor() resolves each stored link to a render-ready card:
// title/teaser come from the TARGET (article frontmatter or leg cluster), so a
// link is just a reference and can never carry a stale copied title.

export type RelatedLink = {
  href: string;
  title: string;
  body?: string;
  heroSrc?: string;
  heroAlt?: string;
};

function linksForSlug(leg: string, slug: string): string[] {
  const L = schema.legs.find((l) => l.slug === leg);
  const s = L?.slugs.find((x) => x.slug === slug);
  return s?.linksTo ?? [];
}

// A stored link is either a full "/leg/slug" (or "/leg") href, or a bare
// same-leg slug (legacy form). Normalize to a leading-slash path.
function normalize(link: string, leg: string): string {
  if (link.startsWith("/")) return link;
  return `/${leg}/${link}`;
}

// Resolve a programmatic-spoke href (/areas/<slug>, /glossary/<slug>) to a card,
// so linksTo entries can point at those pages too — same reference-not-copy rule.
function spokeForHref(href: string): RelatedLink | null {
  const [section, spokeSlug] = href.replace(/^\//, "").split("/");
  if (section === areaSection.slug) {
    const a = validAreas().find((x) => x.slug === spokeSlug);
    if (a) {
      return {
        href,
        title: `${a.name} — neighbourhood guide`,
        body: a.lede,
        heroSrc: `/images/areas/${a.slug}.svg`,
        heroAlt: `${a.name}, Belgrade neighbourhood`,
      };
    }
  }
  if (section === glossarySection.slug) {
    const t = termsByHref().get(href);
    if (t) {
      return {
        href,
        title: t.term,
        body: t.short,
        heroSrc: `/images/glossary/${t.slug}.svg`,
        heroAlt: `${t.term} — Belgrade glossary`,
      };
    }
  }
  return null;
}

export async function relatedFor(leg: string, slug: string): Promise<RelatedLink[]> {
  const byHref = await articlesByHref();
  const out: RelatedLink[] = [];
  const seen = new Set<string>();
  for (const raw of linksForSlug(leg, slug)) {
    const href = normalize(raw, leg);
    if (seen.has(href)) continue;
    seen.add(href);
    const segs = href.replace(/^\//, "").split("/").filter(Boolean);
    let title: string | undefined;
    let body: string | undefined;
    if (segs.length >= 2) {
      const a = byHref.get(href);
      if (!a || a.data.visible === false) {
        // Not an article — try the programmatic spokes before dropping.
        const spoke = spokeForHref(href);
        if (spoke) out.push(spoke);
        continue;
      }
      title = a.data.shortTitle || a.data.title;
      body = a.data.description;
    } else if (segs.length === 1) {
      const c = clusterBySlug(segs[0]);
      if (!c) continue;
      title = c.title;
      body = c.tagline;
    } else {
      continue;
    }
    const hero = thumbForPath(href, title);
    out.push({ href, title: title!, body, heroSrc: hero?.src, heroAlt: hero?.alt });
  }
  return out;
}
