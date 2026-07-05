// Claimable-listings engine (KB/platform/PLATFORM-PLAN.md, Phase 1).
// Data master: one JSON file per listing under src/data/listings/<leg>/<slug>.json
// (per-file so future self-serve edits commit without conflicts). This module
// loads them all at build time, applies the thin-content guard, and exposes
// per-leg accessors. Section URL segments per leg live in SECTION below —
// astro.config.mjs mirrors them for sitemap/noindex handling (keep in sync).

import { CONFIG } from "./site";

export type ListingFact = { label: string; value: string; source?: string };
export type ListingQuote = { quote: string; who: string; source?: string };
export type ListingSource = { url: string; note?: string };

export type Listing = {
  slug: string;
  leg: string;
  type: string; // "pavilion" now; "restaurant" | "hotel" | "clinic" | … in Phase 4
  name: string;
  shortName?: string;
  summary: string; // the lede — one honest paragraph
  status?: string; // e.g. "announced" | "tender" | "construction" | "concept-only"
  claimed?: boolean; // Phase 2: business has taken control (renders disclaimer)
  verified?: boolean;
  updated: string; // ISO date — bump on every edit (drives dateModified + lastmod)
  blocks: {
    about?: string[]; // paragraphs (plain text)
    facts?: ListingFact[]; // label/value rows, each ideally sourced
    quotes?: ListingQuote[];
  };
  links?: { website?: string | null; sources?: ListingSource[] };
  images?: string[];
  faqs?: { question: string; answer: string }[]; // rendered + FAQPage JSON-LD
};

// URL section segment per leg (e.g. /expo-2027/pavilions/<slug>). New legs add
// their segment here + a matching pages/<leg>/<section>/ route pair.
export const SECTION: Record<string, string> = {
  "expo-2027": "pavilions",
};

const files = import.meta.glob<{ default: Listing }>("../data/listings/**/*.json", {
  eager: true,
});
const all: Listing[] = Object.values(files).map((m) => m.default);

// Thin-content guard: a listing publishes only when it would make a real page.
// (Pavilions carry no images yet, so the image requirement starts in Phase 4
// with business types.) Sub-threshold listings stay as stubs awaiting data/claim.
export function validListing(l: Listing): boolean {
  const aboutLen = (l.blocks?.about ?? []).join(" ").length;
  const facts = l.blocks?.facts?.length ?? 0;
  return Boolean(l.name && l.summary && l.summary.length >= 80 && aboutLen >= 300 && facts >= 2);
}

export function listingsForLeg(leg: string): Listing[] {
  return all
    .filter((l) => l.leg === leg && validListing(l))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export function listingHref(l: Listing): string {
  return `/${l.leg}/${SECTION[l.leg] ?? "places"}/${l.slug}`;
}

// noindex-first publish gate (same convention as glossary/areas).
export const listingsIndexable =
  (CONFIG as { programmatic?: { listingsIndexable?: boolean } }).programmatic
    ?.listingsIndexable === true;

// Newest `updated` across a leg's published listings (hub dateModified/lastmod).
export function newestUpdated(leg: string): string | undefined {
  const dates = listingsForLeg(leg)
    .map((l) => l.updated)
    .filter(Boolean)
    .sort();
  return dates.at(-1);
}
