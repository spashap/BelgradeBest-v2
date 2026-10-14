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
  field: "aid" | "url";
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
  try {
    return new URL(v).protocol === "https:" ? null : "The link must start with https://";
  } catch {
    return "That is not a valid link: paste the full https://… tracking URL.";
  }
}

export type AffLink = { href: string; label: string; partner: PartnerKey; placement: string };

type StayReg = { partner?: string; targets: Record<string, { label: string; search?: string }> };
type TravelReg = { targets: Record<string, { label: string; partner: string }> };
const STAY = stay as StayReg;
const TRAVEL = partnerLinks as TravelReg;
export const STAY_PARTNER = STAY.partner ?? "booking";

// Booking.com: a search for the area, with `label` = a per-area sub-ID so the
// Booking.com reports show which neighbourhood converts.
export function stayLinks(targets: string[]): AffLink[] {
  if (!partnerLive(STAY_PARTNER)) return [];
  const aid = PARTNERS[STAY_PARTNER].value.trim();
  return targets.flatMap((t) => {
    const x = STAY.targets[t];
    if (!x?.search) return [];
    const q = new URLSearchParams({ ss: x.search, aid, label: `bb-${t}` });
    return [{ href: `https://www.booking.com/searchresults.html?${q}`, label: `Book a stay in ${x.label}`, partner: STAY_PARTNER, placement: t }];
  });
}

export function travelLinks(targets: string[]): AffLink[] {
  return targets.flatMap((t) => {
    const x = TRAVEL.targets[t];
    if (!x || !partnerLive(x.partner)) return [];
    return [{ href: PARTNERS[x.partner].value.trim(), label: x.label, partner: x.partner, placement: t }];
  });
}

// Admin "where it shows": the partner behind a page's stay/partner targets.
export function partnersForTargets(stayTargets: string[], partnerTargets: string[]): Set<PartnerKey> {
  const out = new Set<PartnerKey>();
  if (stayTargets.some((t) => STAY.targets[t]?.search)) out.add(STAY_PARTNER);
  for (const t of partnerTargets) if (TRAVEL.targets[t]) out.add(TRAVEL.targets[t].partner);
  return out;
}
