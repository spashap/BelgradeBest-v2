// Claimable-listings engine (KB/platform/PLATFORM-PLAN.md, Phases 1–2).
// Data master: one JSON file per listing under src/data/listings/<leg>/<slug>.json
// (per-file so self-serve edits + admin outreach updates commit without
// conflicts). Listings form a one-level hierarchy: a listing with `parent`
// renders UNDER its parent (pavilion → exhibitor/booth; restaurant groups etc.
// later). This module loads all of them at build time, applies the thin-content
// guard, and exposes accessors. Section URL segments per leg live in SECTION —
// astro.config.mjs mirrors them for sitemap/noindex handling (keep in sync).
//
// PRIVACY: `contact` and `outreach` are operator-only fields (admin + future
// /manage). Templates must never render them into public HTML.

import { CONFIG } from "./site";

export type ListingFact = { label: string; value: string; source?: string };
export type ListingQuote = { quote: string; who: string; source?: string };
export type ListingSource = { url: string; note?: string };

export type OutreachStatus =
  | "none"
  | "queued"
  | "sent"
  | "replied"
  | "claiming"
  | "live"
  | "declined"
  | "opt-out";
export const OUTREACH_STATUSES: OutreachStatus[] = [
  "none",
  "queued",
  "sent",
  "replied",
  "claiming",
  "live",
  "declined",
  "opt-out",
];

export type Listing = {
  slug: string;
  leg: string;
  type: string; // "pavilion" | "exhibitor" | "organization" | "restaurant" | …
  parent?: string; // slug of the parent listing in the SAME leg (1 level deep)
  name: string;
  shortName?: string;
  summary: string; // the lede — one honest paragraph
  status?: string; // e.g. "announced" | "tender" | "construction" | "concept-only"
  claimed?: boolean; // business has taken control (renders the disclaimer)
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
  // ── operator-only (admin/outreach; NEVER rendered publicly) ──
  contact?: { email?: string; person?: string; source?: string };
  outreach?: { status?: OutreachStatus; sentAt?: string; repliedAt?: string; notes?: string };
};

// URL section segment per leg (e.g. /expo-2027/pavilions/<slug>). New legs add
// their segment here + a matching pages/<leg>/<section>/ route pair.
export const SECTION: Record<string, string> = {
  "expo-2027": "pavilions",
};
// Human label for the section (header sub-nav etc.). One entry per SECTION key.
export const SECTION_TITLE: Record<string, string> = {
  "expo-2027": "Pavilions",
};

const files = import.meta.glob<{ default: Listing }>("../data/listings/**/*.json", {
  eager: true,
});
const all: Listing[] = Object.values(files).map((m) => m.default);

// Every listing including sub-threshold stubs — the admin Platform module needs
// the full set; public pages must keep using the guarded accessors below.
export const allListings: Listing[] = all
  .slice()
  .sort((a, b) => a.leg.localeCompare(b.leg) || a.name.localeCompare(b.name, "en"));

// Thin-content guard: a listing publishes only when it would make a real page.
// (Pavilions carry no images yet, so the image requirement starts with business
// types in Phase 4.) Sub-threshold listings stay as stubs awaiting data/claim.
export function validListing(l: Listing): boolean {
  const aboutLen = (l.blocks?.about ?? []).join(" ").length;
  const facts = l.blocks?.facts?.length ?? 0;
  return Boolean(l.name && l.summary && l.summary.length >= 80 && aboutLen >= 300 && facts >= 2);
}

// Published TOP-LEVEL listings for a leg (hub cards + parent routes).
export function listingsForLeg(leg: string): Listing[] {
  return all
    .filter((l) => l.leg === leg && !l.parent && validListing(l))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

// Published children of a listing (exhibitors/booths under a pavilion). A child
// publishes only if its PARENT also publishes (no orphan URLs).
export function childrenOf(leg: string, parentSlug: string): Listing[] {
  const parent = all.find((l) => l.leg === leg && l.slug === parentSlug);
  if (!parent || !validListing(parent)) return [];
  return all
    .filter((l) => l.leg === leg && l.parent === parentSlug && validListing(l))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export function parentOf(l: Listing): Listing | null {
  if (!l.parent) return null;
  return all.find((p) => p.leg === l.leg && p.slug === l.parent) ?? null;
}

export function listingHref(l: Listing): string {
  const section = SECTION[l.leg] ?? "places";
  return l.parent ? `/${l.leg}/${section}/${l.parent}/${l.slug}` : `/${l.leg}/${section}/${l.slug}`;
}

// noindex-first publish gate (same convention as glossary/areas).
export const listingsIndexable =
  (CONFIG as { programmatic?: { listingsIndexable?: boolean } }).programmatic
    ?.listingsIndexable === true;

// Header sub-navigation for a leg: its businesses/listings section, shown only
// once the section is real (published listings + the indexable flag on). This
// is what gives Expo 2027 its "Pavilions" second level — and gives every
// future leg its own automatically when its SECTION entry + listings land.
export function navSectionsFor(leg: string): { title: string; href: string }[] {
  const section = SECTION[leg];
  if (!section || !listingsIndexable) return [];
  if (listingsForLeg(leg).length === 0) return [];
  const title = SECTION_TITLE[leg] ?? section.charAt(0).toUpperCase() + section.slice(1);
  return [{ title, href: `/${leg}/${section}` }];
}

// Newest `updated` across a leg's published listings (hub dateModified/lastmod).
export function newestUpdated(leg: string): string | undefined {
  const dates = all
    .filter((l) => l.leg === leg && validListing(l))
    .map((l) => l.updated)
    .filter(Boolean)
    .sort();
  return dates.at(-1);
}
