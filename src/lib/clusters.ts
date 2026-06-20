// The top-level IA clusters (the six charter legs + the medical vertical silo)
// and the utility/legal pages. Used by the homepage (T1), cluster hubs (T2), the
// sitemap, and the internal-link block / article chrome.
//
// SOURCE OF TRUTH: leg structure + display metadata DERIVE from the master
// data/site-schema.json. Imports JSON only (no node:fs) so it is safe to use in
// any context (including the local admin tool).

import schema from "../data/site-schema.json";

export type Cluster = {
  slug: string;
  href: string;
  eyebrow: string;
  title: string;
  navLabel?: string;
  seoTitle?: string;
  seoDescription?: string;
  noindex?: boolean;
  tagline: string;
  intro: string;
  body?: string;
  bodyBelow?: string;
  hidden?: boolean;
  hero?: { src: string | null; alt: string | null };
  // leg `status` (live/coming-soon) is NOT here — projected by legStatus().
};

export const clusters: Cluster[] = [...schema.legs]
  .sort((a, b) => a.order - b.order)
  .map((leg) => ({
    slug: leg.slug,
    href: `/${leg.slug}`,
    eyebrow: leg.eyebrow,
    title: leg.title,
    navLabel: leg.navLabel ?? "",
    seoTitle: (leg as { seoTitle?: string }).seoTitle ?? "",
    seoDescription: (leg as { seoDescription?: string }).seoDescription ?? "",
    noindex: (leg as { noindex?: boolean }).noindex ?? false,
    tagline: leg.tagline,
    intro: leg.intro,
    body: leg.body ?? "",
    bodyBelow: (leg as { bodyBelow?: string }).bodyBelow ?? "",
    hidden: leg.visible === false,
    hero: leg.hero ?? { src: null, alt: null },
  }));

export function clusterBySlug(slug: string): Cluster | undefined {
  return clusters.find((c) => c.slug === slug);
}

// Utility/legal pages — flat at root, not under a cluster. DERIVED from the
// standalone-pages content master so the footer nav label and the page heading
// each live in ONE place.
import { sitePages } from "./site-pages";
export const utilityPages = sitePages.map((p) => ({ slug: p.slug, title: p.navLabel }));
