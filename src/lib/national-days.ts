// Expo 2027 National Days — the ONE authoritative record of country-to-date
// announcements (BELGRADEBEST_EXPO_CONTENT_PLAN.md §3 and §6).
//
// Data master: src/data/national-days.json. Bump `updated` on every edit; it
// drives dateModified on the page and sitemap lastmod in astro.config.mjs.
//
// Why a shared record rather than a fact row per pavilion: a National Day date
// appears on the tracker page AND on that country's pavilion profile. Held
// twice, it drifts — which is exactly how four pavilion profiles ended up
// contradicting themselves in September 2026. Read it from here in both places.
//
// EDITORIAL RULES (they are the product, not decoration):
//  - `status` records what the SOURCE says. A ministry that says "planned" is
//    reported as planned. Never promote planned → confirmed without a source
//    that confirms it.
//  - `establishes` / `doesNotEstablish` are mandatory on a dated entry. A date
//    is a container: knowing it tells a visitor nothing about times, access or
//    reservations, and saying so is the useful part.
//  - Absence means "not recorded by us", never "not announced anywhere".

import data from "../data/national-days.json";

export type NationalDayStatus = "planned" | "confirmed";

export type NationalDayEntry = {
  country: string;
  listingSlug?: string;
  date: string; // ISO
  status: NationalDayStatus;
  authority: string;
  authorityKind: string;
  source: string;
  sourceNote?: string;
  checked: string;
  establishes: string;
  doesNotEstablish: string;
  context?: string;
};

export type UndatedAnnouncement = {
  country: string;
  listingSlug?: string;
  note: string;
  source: string;
  sourceNote?: string;
  checked: string;
};

export const NATIONAL_DAYS = data as unknown as {
  updated: string;
  checked: string;
  coverage: string;
  entries: NationalDayEntry[];
  undated: UndatedAnnouncement[];
  precedent: { expo: string; note: string; source: string; caution: string };
  sources: { url: string; note?: string }[];
  caveats: string[];
  history: { date: string; change: string }[];
};

/** Dated entries, earliest first. */
export const datedEntries = (): NationalDayEntry[] =>
  [...NATIONAL_DAYS.entries].sort((a, b) => a.date.localeCompare(b.date));

export const undatedAnnouncements = (): UndatedAnnouncement[] =>
  [...NATIONAL_DAYS.undated].sort((a, b) => a.country.localeCompare(b.country, "en"));

export const updated = NATIONAL_DAYS.updated;

/** The National Day record for one pavilion listing slug, if we hold one. */
export function nationalDayFor(listingSlug: string): NationalDayEntry | undefined {
  return NATIONAL_DAYS.entries.find((e) => e.listingSlug === listingSlug);
}
