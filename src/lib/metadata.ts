import { SITE, CONFIG } from "./site";
import { clusterBySlug } from "./clusters";
import { heroForLeg } from "./hero";

// Framework-agnostic page-metadata model. BaseLayout consumes this and renders
// the actual <title>/<meta>/<link rel=canonical>/OG/twitter/robots tags. (The
// old Next `Metadata` object is replaced by this plain shape.)
export type PageMeta = {
  title: string; // full <title> (already suffixed with the brand)
  description: string;
  canonical: string; // absolute URL
  noindex: boolean;
  ogType: string;
  image: string; // absolute URL — always set (page hero or the brand default)
  imageAlt: string;
};

// Site-wide fallback share image (a branded card). Every page gets an og:image,
// so links never preview blank; pages with their own hero override it.
const DEFAULT_OG = `${SITE.origin}${(CONFIG.seo as { defaultOgImage?: string }).defaultOgImage ?? "/images/og-default.png"}`;

// Make a (possibly site-relative, possibly cache-busted) image src absolute for
// OG/Twitter, which require fully-qualified URLs.
export function absoluteImage(src?: string | null): string {
  if (!src) return DEFAULT_OG;
  if (/^https?:\/\//.test(src)) return src;
  return `${SITE.origin}${src.startsWith("/") ? "" : "/"}${src}`;
}

type Args = {
  title: string;
  description: string;
  path: string; // pathname only, e.g. "/expo-2027/getting-there"
  noindex?: boolean;
  image?: string | null; // page hero (relative or absolute); falls back to default
  imageAlt?: string;
};

export function pageMetadata({ title, description, path, noindex, image, imageAlt }: Args): PageMeta {
  const fullTitle = title.endsWith(SITE.name)
    ? title
    : `${title}${CONFIG.seo.titleSeparator}${SITE.name}`;
  return {
    title: fullTitle,
    description,
    canonical: `${SITE.origin}${path}`,
    noindex: !!noindex,
    ogType: CONFIG.seo.ogType,
    image: absoluteImage(image),
    imageAlt: imageAlt?.trim() || title,
  };
}

// Leg-hub <head> from the leg's (optionally-overridden) SEO fields. Empty
// seoTitle/seoDescription fall back to the derived values (`${title} —
// ${tagline}` / `intro`), so a hub with no overrides renders as before.
export function hubMetadata(slug: string): PageMeta {
  const c = clusterBySlug(slug);
  if (!c) throw new Error(`hubMetadata: unknown leg '${slug}'`);
  const legHero = heroForLeg(slug, c.hero?.alt ?? c.title);
  return pageMetadata({
    title: c.seoTitle?.trim() || `${c.title} — ${c.tagline}`,
    description: c.seoDescription?.trim() || c.intro,
    path: c.href,
    noindex: c.noindex,
    image: legHero?.src,
    imageAlt: legHero?.alt,
  });
}
