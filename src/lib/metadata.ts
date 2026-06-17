import { SITE, CONFIG } from "./site";
import { clusterBySlug } from "./clusters";

// Framework-agnostic page-metadata model. BaseLayout consumes this and renders
// the actual <title>/<meta>/<link rel=canonical>/OG/twitter/robots tags. (The
// old Next `Metadata` object is replaced by this plain shape.)
export type PageMeta = {
  title: string; // full <title> (already suffixed with the brand)
  description: string;
  canonical: string; // absolute URL
  noindex: boolean;
  ogType: string;
};

type Args = {
  title: string;
  description: string;
  path: string; // pathname only, e.g. "/expo-2027/getting-there"
  noindex?: boolean;
};

export function pageMetadata({ title, description, path, noindex }: Args): PageMeta {
  const fullTitle = title.endsWith(SITE.name)
    ? title
    : `${title}${CONFIG.seo.titleSeparator}${SITE.name}`;
  return {
    title: fullTitle,
    description,
    canonical: `${SITE.origin}${path}`,
    noindex: !!noindex,
    ogType: CONFIG.seo.ogType,
  };
}

// Leg-hub <head> from the leg's (optionally-overridden) SEO fields. Empty
// seoTitle/seoDescription fall back to the derived values (`${title} —
// ${tagline}` / `intro`), so a hub with no overrides renders as before.
export function hubMetadata(slug: string): PageMeta {
  const c = clusterBySlug(slug);
  if (!c) throw new Error(`hubMetadata: unknown leg '${slug}'`);
  return pageMetadata({
    title: c.seoTitle?.trim() || `${c.title} — ${c.tagline}`,
    description: c.seoDescription?.trim() || c.intro,
    path: c.href,
    noindex: c.noindex,
  });
}
