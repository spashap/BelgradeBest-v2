import data from "../data/site-pages.json";

// The standalone-pages content master (about / how-we-make-money / contact /
// privacy). Bodies are markdown. Public render reads this; clusters.ts derives
// `utilityPages` (footer nav labels) from it so the footer label and the page
// heading each live in ONE place.

export type SitePage = {
  slug: string;
  navLabel: string;
  title: string;
  eyebrow: string;
  lede: string;
  body: string; // markdown
  seoTitle: string;
  seoDescription: string;
  noindex: boolean;
};

export const sitePages: SitePage[] = (data as { pages: SitePage[] }).pages;

export function pageBySlug(slug: string): SitePage | undefined {
  return sitePages.find((p) => p.slug === slug);
}
