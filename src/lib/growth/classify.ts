// Path → content type / section, from the project's own route architecture.
//
// Sources of truth (not a parallel taxonomy):
//   • legs            → src/data/site-schema.json (the structure master)
//   • listing sections→ src/lib/listing-sections.ts (SECTION map)
//   • utility pages   → src/data/site-pages.json
//   • programmatic sets, Expo data pages, /for-businesses, feeds and widgets
//     are the fixed routes under src/pages/ (mirrored here as constants).
//
// Plain module: importable by Node tests. JSON imports use import attributes
// (required by Node ESM, accepted by Vite).
import schema from "../../data/site-schema.json" with { type: "json" };
import pagesData from "../../data/site-pages.json" with { type: "json" };
import { SECTION } from "../listing-sections.ts";

export type ContentType =
  | "homepage"
  | "leg_hub"
  | "article"
  | "expo_hub"
  | "expo_data"
  | "listing_directory"
  | "listing"
  | "listing_child"
  | "area_hub"
  | "area"
  | "glossary_hub"
  | "glossary"
  | "utility"
  | "partner_landing"
  | "feed"
  | "widget"
  | "not_found"
  | "internal"
  | "other";

export type Classification = {
  path: string; // normalised: no query, no trailing slash, "/" for home
  content_type: ContentType;
  section: string; // leg slug, "areas", "glossary", "home", "utility", …
  lang: "en" | "de";
  expo: boolean; // part of the Expo 2027 cluster (EN or DE)
};

const LEGS = new Set<string>(schema.legs.map((l) => l.slug));
const UTILITY = new Set<string>(pagesData.pages.map((p) => p.slug));
const EXPO_LEG = "expo-2027";
const EXPO_DATA_PAGES = new Set(["tracker", "countdown", "corporate-area"]);

// GA4 pagePath and GSC page URLs both arrive here; strip origin, query and
// trailing slash so the two sides merge on one key.
export function normalisePath(input: string): string {
  let p = input.trim();
  if (/^https?:\/\//i.test(p)) {
    try {
      p = new URL(p).pathname;
    } catch {
      /* keep as is */
    }
  }
  const q = p.indexOf("?");
  if (q !== -1) p = p.slice(0, q);
  const h = p.indexOf("#");
  if (h !== -1) p = p.slice(0, h);
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
}

export function classifyPath(input: string): Classification {
  const path = normalisePath(input);
  let lang: "en" | "de" = "en";
  let rest = path;
  if (path === "/de" || path.startsWith("/de/")) {
    lang = "de";
    rest = path === "/de" ? "/" : path.slice(3);
  }
  const segs = rest.split("/").filter(Boolean);
  const out = (content_type: ContentType, section: string, expo = section === EXPO_LEG): Classification => ({
    path,
    content_type,
    section,
    lang,
    expo,
  });

  if (segs.length === 0) return out("homepage", "home", lang === "de");
  const [a, b, c, d] = segs;

  if (a === "admin" || a === "api" || a === "manage") return out("internal", "internal", false);
  if (a === "404") return out("not_found", "internal", false);
  if (a === "widgets" || a === "badges") return out("widget", "distribution", false);
  if (a === "data" || a === "rss.xml" || a === "llms.txt" || a === "llms-full.txt" || a === "robots.txt" || a.startsWith("sitemap"))
    return out("feed", "distribution", false);
  if (a === "for-businesses" && segs.length === 1) return out("partner_landing", "partners", false);
  if (UTILITY.has(a) && segs.length === 1) return out("utility", "utility", false);
  if (a === "areas") return out(segs.length === 1 ? "area_hub" : "area", "areas", false);
  if (a === "glossary") return out(segs.length === 1 ? "glossary_hub" : "glossary", "glossary", false);

  if (LEGS.has(a)) {
    const section = SECTION[a];
    if (segs.length === 1) return out(a === EXPO_LEG ? "expo_hub" : "leg_hub", a);
    if (section && b === section) {
      if (segs.length === 2) return out("listing_directory", a);
      if (segs.length === 3 && c) return out("listing", a);
      if (segs.length === 4 && d) return out("listing_child", a);
      return out("other", a);
    }
    if (a === EXPO_LEG && segs.length === 2 && EXPO_DATA_PAGES.has(b)) return out("expo_data", a);
    if (segs.length === 2) return out("article", a);
    return out("other", a);
  }
  return out("other", "other", false);
}

// Paths the Growth API never reports on (aggregate-only, no internal surfaces).
export function isReportable(cls: Classification): boolean {
  return cls.content_type !== "internal" && cls.content_type !== "not_found";
}

export const EXPO_PREFIXES = [`/${EXPO_LEG}`, `/de/${EXPO_LEG}`];
export const isExpoPath = (path: string): boolean => classifyPath(path).expo;
