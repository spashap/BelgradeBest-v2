import master from "../data/affiliates.json";
import stay from "../data/stay-affiliates.json";
import partnerLinks from "../data/partner-links.json";

// Affiliate partners (2026-10-14). ONE master, src/data/affiliates.json, holds
// each partner's on/off switch and its ID or tracked link; the owner edits it
// from /admin/affiliates (save = GitHub commit → Vercel rebuild, ~1–2 min).
// Placements stay in stay-affiliates.json (Booking areas) and
// partner-links.json (transfers, flights, eSIM); pages pick them through
// frontmatter `stayTargets` / `partnerTargets`. Everything resolves at BUILD
// time: a partner that is off, unavailable or missing its value renders
// nothing, and the public pages gain no runtime requests.

export type PartnerKey = string;
export type Partner = {
  name: string;
  what: string;
  // "aid" = a Booking.com partner number; "url" = a tracked https link;
  // "aid-or-url" = either (Booking.com: direct aid, or its CJ click link).
  field: "aid" | "url" | "aid-or-url";
  fieldLabel: string;
  enabled: boolean;
  value: string;
  available: boolean;
  unavailableReason?: string;
  dashboard?: string;
  accepted?: string | null;
  changedAt?: string | null;
};

export const PARTNERS = (master as { partners: Record<PartnerKey, Partner> }).partners;

// GA4 event name per partner: aff_click_<key>. The partner lives in the event
// NAME (a built-in GA4 dimension), so the admin can report clicks without any
// custom-dimension setup in the GA4 property.
export const clickEvent = (key: PartnerKey) => `aff_click_${key.replace(/[^a-z0-9]/g, "_")}`;

export function partnerLive(key: PartnerKey, partners: Record<PartnerKey, Partner> = PARTNERS): boolean {
  const p = partners[key];
  return !!p && p.available && p.enabled && !!p.value.trim();
}

// Validates an admin-entered value; returns an error message or null.
export function checkValue(p: Pick<Partner, "field">, value: string): string | null {
  const v = value.trim();
  if (!v) return null; // empty is allowed (the partner just stays off)
  if (p.field === "aid") return /^\d{3,12}$/.test(v) ? null : "The Booking.com partner ID is a number (3–12 digits).";
  if (p.field === "aid-or-url" && /^\d{3,12}$/.test(v)) return null;
  try {
    return new URL(v).protocol === "https:" ? null : "The link must start with https://";
  } catch {
    return "That is not a valid link: paste the full https://… tracking URL.";
  }
}

export type AffLink = { href: string; label: string; partner: PartnerKey; placement: string };

// Block chrome per language. English lives at the top level of the placement
// JSON; translated pilots (de, sk) under `tr`. The disclosure page is English.
export type BlockChrome = { heading: string; disclosure: string; disclosureLink: string; cta?: string };
type Labels = Partial<Record<string, string>>;
type StayReg = {
  partner?: string;
  disclosure: string;
  tr?: Record<string, BlockChrome>;
  targets: Record<string, { label: string; search?: string; url?: string; labels?: Labels }>;
};
type TravelReg = {
  heading: string;
  disclosure: string;
  tr?: Record<string, BlockChrome>;
  targets: Record<string, { label: string; partner: string; labels?: Labels; deep?: Labels }>;
};
const STAY = stay as StayReg;
const TRAVEL = partnerLinks as TravelReg;
export const STAY_PARTNER = STAY.partner ?? "booking";

export function stayChrome(lang = "en"): BlockChrome {
  return STAY.tr?.[lang] ?? { heading: "Where to book your stay", disclosure: STAY.disclosure, disclosureLink: "How we make money" };
}
export function travelChrome(lang = "en"): BlockChrome {
  return TRAVEL.tr?.[lang] ?? { heading: TRAVEL.heading, disclosure: TRAVEL.disclosure, disclosureLink: "How we make money" };
}

// CJ (Commission Junction) click links: https://www.<cj-domain>/click-<PID>-<linkId>.
// `url` deep-links to a specific partner page; `sid` is a sub-ID that CJ's
// reports show per transaction, so every placement is traceable to money.
const CJ_HOSTS = /(^|\.)(anrdoezrs\.net|dpbolvw\.net|jdoqocy\.com|kqzyfj\.com|tkqlhce\.com)$/;
export const isCjLink = (href: string) => {
  try {
    return CJ_HOSTS.test(new URL(href).hostname);
  } catch {
    return false;
  }
};
export function tracked(base: string, dest: string | undefined, sid: string): string {
  if (!isCjLink(base)) return base;
  const u = new URL(base);
  if (dest) u.searchParams.set("url", dest);
  u.searchParams.set("sid", sid);
  return u.toString();
}

const BOOKING_LANG: Record<string, string> = { en: "en-gb", de: "de", sk: "sk", cs: "cs" };

// CJ sub-ID: bb-[lang-]<page initials>-<ref>, e.g. bb-wtsfe-moskva for
// moskva on where-to-stay-for-expo. Short (CJ caps sub-IDs) yet traceable:
// /admin/affiliates maps the initials back to the page. Without a page (old
// callers) it stays bb-[lang-]<ref>.
export const pageCode = (slug: string) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((w) => (/^\d+$/.test(w) ? w : w[0]))
    .join("");
export function sidFor(lang: string, slug: string | undefined, ref: string): string {
  const s = `bb-${lang === "en" ? "" : lang + "-"}${slug ? pageCode(slug) + "-" : ""}${ref}`;
  return s.replace(/[^a-z0-9-]/gi, "-").toLowerCase().slice(0, 60);
}

// Booking.com: a search for the area. Direct partner (numeric aid): `label` is
// the per-area sub-ID. Via CJ: the search is the deep link and `sid` the sub-ID.
export function stayLinks(targets: string[], lang = "en", page?: string): AffLink[] {
  if (!partnerLive(STAY_PARTNER)) return [];
  const value = PARTNERS[STAY_PARTNER].value.trim();
  const cta = stayChrome(lang).cta ?? "Book a stay in {area}";
  return targets.flatMap((t) => {
    const x = STAY.targets[t];
    if (!x?.search && !x?.url) return [];
    const sid = sidFor(lang, page, page ? `box-${t}` : t);
    const label = cta.replace("{area}", x.labels?.[lang] ?? x.label);
    // A Booking landing page (`url`) where one works, else a search (`search`).
    const u = new URL(x.url ?? "https://www.booking.com/searchresults.html");
    if (!x.url) u.searchParams.set("ss", x.search!);
    u.searchParams.set("lang", BOOKING_LANG[lang] ?? "en-gb");
    if (/^\d+$/.test(value)) {
      u.searchParams.set("aid", value);
      u.searchParams.set("label", sid);
      return [{ href: u.toString(), label, partner: STAY_PARTNER, placement: t }];
    }
    const dest = u.toString();
    return [{ href: tracked(value, dest, sid), label, partner: STAY_PARTNER, placement: t }];
  });
}

export function travelLinks(targets: string[], lang = "en", page?: string): AffLink[] {
  return targets.flatMap((t) => {
    const x = TRAVEL.targets[t];
    if (!x || !partnerLive(x.partner)) return [];
    const sid = sidFor(lang, page, page ? `box-${t}` : t);
    const dest = x.deep?.[lang] ?? x.deep?.en;
    const label = x.labels?.[lang] ?? x.label;
    return [{ href: tracked(PARTNERS[x.partner].value.trim(), dest, sid), label, partner: x.partner, placement: t }];
  });
}

// The partner behind one partner-links.json target key ("" if unknown).
export const partnerOfTarget = (t: string) => TRAVEL.targets[t]?.partner ?? "";

// Admin "where it shows": the partner behind a page's stay/partner targets.
export function partnersForTargets(stayTargets: string[], partnerTargets: string[]): Set<PartnerKey> {
  const out = new Set<PartnerKey>();
  if (stayTargets.some((t) => STAY.targets[t]?.search || STAY.targets[t]?.url)) out.add(STAY_PARTNER);
  for (const t of partnerTargets) if (TRAVEL.targets[t]) out.add(TRAVEL.targets[t].partner);
  return out;
}
