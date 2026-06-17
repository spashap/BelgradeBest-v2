// schema.org JSON-LD builders. Pass the output to <Schema schemas={[...]} />.
// Article on T3, Event for Expo pages, FAQ where the page answers discrete
// questions, BreadcrumbList everywhere, Organization globally.

import { SITE, EXPO, CONFIG } from "./site";

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
    mainEntityOfPage: a.url,
    url: a.url,
    inLanguage: CONFIG.brand.locale,
    isAccessibleForFree: true,
    ...(a.datePublished ? { datePublished: a.datePublished } : {}),
    ...(a.dateModified ? { dateModified: a.dateModified } : {}),
    ...(a.imageUrl ? { image: a.imageUrl } : {}),
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.origin,
    },
  };
}

export function expoEventSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: EXPO.name,
    startDate: EXPO.startDate,
    endDate: EXPO.endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    description: CONFIG.expo.eventDescription,
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
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.origin,
    description: SITE.tagline,
  };
}
