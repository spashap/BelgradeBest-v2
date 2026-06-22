// schema.org JSON-LD builders. Pass the output to <Schema schemas={[...]} />.
// Article on T3, Event for Expo pages, FAQ where the page answers discrete
// questions, BreadcrumbList everywhere, Organization globally.

import { SITE, EXPO, CONFIG } from "./site";

// Brand logo as a schema.org ImageObject (reused by Organization + publisher).
// Google's article rich results want a publisher logo; this gives one source.
const LOGO_URL = `${SITE.origin}${(CONFIG.brand as { logoPath?: string }).logoPath ?? "/apple-icon.png"}`;
function logoImage() {
  return { "@type": "ImageObject", url: LOGO_URL };
}

// Verified social/profile URLs (Organization.sameAs). Populated from
// site-config brand.sameAs as the social accounts come online — empty = omitted.
function sameAs(): string[] {
  const s = (CONFIG.brand as { sameAs?: string[] }).sameAs ?? [];
  return s.filter((u) => typeof u === "string" && u.trim().length > 0);
}

// The publisher Organization, embedded in Article/Event so every page declares
// the same authoritative publisher (name + url + logo). One definition.
function publisherOrg() {
  return {
    "@type": "Organization",
    name: SITE.name,
    url: SITE.origin,
    logo: logoImage(),
  };
}

type ArticleInput = {
  title: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  imageUrl?: string;
};

export function articleSchema(a: ArticleInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": a.url },
    url: a.url,
    inLanguage: CONFIG.brand.locale,
    isAccessibleForFree: true,
    // datePublished defaults to the last-updated date when no distinct publish
    // date is tracked, so the field is always present for rich results.
    ...(a.datePublished || a.dateModified
      ? { datePublished: a.datePublished ?? a.dateModified }
      : {}),
    ...(a.dateModified ? { dateModified: a.dateModified } : {}),
    ...(a.imageUrl ? { image: a.imageUrl } : {}),
    // The brand is the author/publisher (a source-checked editorial guide, not a
    // single byline) — declared consistently for E-E-A-T.
    author: { "@type": "Organization", name: SITE.name, url: SITE.origin },
    publisher: publisherOrg(),
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.origin },
  };
}

export function expoEventSchema(imageUrl?: string) {
  const image = imageUrl || `${SITE.origin}${(CONFIG.seo as { defaultOgImage?: string }).defaultOgImage ?? "/images/og-default.png"}`;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: EXPO.name,
    startDate: EXPO.startDate,
    endDate: EXPO.endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    description: CONFIG.expo.eventDescription,
    // Recommended fields Google asks for on Event rich results.
    image: [image],
    organizer: {
      "@type": "Organization",
      name: EXPO.name,
    },
    // Ticketing isn't on sale yet, so this points at our tickets guide and is
    // marked PreOrder rather than asserting a price we don't have.
    offers: {
      "@type": "Offer",
      url: `${SITE.origin}/expo-2027/tickets`,
      availability: "https://schema.org/PreOrder",
    },
    location: {
      "@type": "Place",
      name: `${EXPO.venue}, ${EXPO.city}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: EXPO.city,
        addressCountry: EXPO.country,
      },
    },
    url: `${SITE.origin}/expo-2027`,
  };
}

export type FaqItem = { question: string; answer: string };
export function faqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  };
}

// DefinedTerm for glossary spoke pages — declares the page as a dictionary-style
// definition that belongs to the site's glossary DefinedTermSet (helps "what is X"
// + AI answer-engine citation). Paired with Article + FAQPage on the same page.
type DefinedTermInput = { name: string; description: string; url: string; setUrl: string; setName: string };
export function definedTermSchema(t: DefinedTermInput) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: t.name,
    description: t.description,
    url: t.url,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: t.setName,
      url: t.setUrl,
    },
  };
}

type Crumb = { name: string; url: string };
export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

export function organizationSchema() {
  const same = sameAs();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.origin,
    description: SITE.tagline,
    logo: logoImage(),
    ...(same.length ? { sameAs: same } : {}),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.origin,
    description: SITE.tagline,
    inLanguage: CONFIG.brand.locale,
  };
}
