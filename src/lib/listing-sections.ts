// URL section segment per leg for claimable listings, e.g.
// /expo-2027/pavilions/<slug>. New legs add their segment here + a matching
// pages/<leg>/<section>/ route pair. astro.config.mjs mirrors this map for
// sitemap/noindex handling (keep in sync).
//
// Plain module on purpose: no import.meta.glob, no Astro globals — it is
// imported by src/lib/listings.ts (site) AND src/lib/growth/classify.ts (the
// Growth API + its Node tests).
export const SECTION: Record<string, string> = {
  "expo-2027": "pavilions",
};

// Human label for the section (header sub-nav etc.). One entry per SECTION key.
export const SECTION_TITLE: Record<string, string> = {
  "expo-2027": "Pavilions",
};
