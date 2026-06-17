// Single source for site-level config. All public strings + layout knobs live in
// data/site-config.json (the config master, sibling of site-schema.json); this
// module types it and exposes it. `SITE` and `EXPO` are derived back-compat
// exports so importers (metadata, schemas, hub pages) read a stable shape.

import config from "../data/site-config.json";

export const CONFIG = config;

export const SITE = {
  name: config.brand.name,
  tagline: config.brand.tagline,
  domain: config.brand.domain,
  origin: config.brand.origin,
  defaultLocale: config.brand.locale,
} as const;

export const EXPO = {
  name: config.expo.name,
  shortName: config.expo.shortName,
  classification: config.expo.classification,
  startDate: config.expo.startDate,
  endDate: config.expo.endDate,
  city: config.expo.city,
  country: config.expo.country,
  venue: config.expo.venue,
  theme: config.expo.theme,
} as const;

// Resolve {brand}/{leg}/{year} tokens in a config string so a fact (e.g. the
// brand name) lives in ONE place even when embedded in a sentence.
export function interp(
  s: string,
  vars: { brand?: string; leg?: string; year?: number | string } = {},
): string {
  const brand = vars.brand ?? config.brand.name;
  return s
    .replace(/\{brand\}/g, brand)
    .replace(/\{leg\}/g, vars.leg ?? "")
    .replace(/\{year\}/g, String(vars.year ?? ""));
}
