import hotelData from "../data/hotel-picks.json";
import stay from "../data/stay-affiliates.json";
import partnerLinks from "../data/partner-links.json";
import { PARTNERS, partnerLive, tracked, clickEvent, STAY_PARTNER, sidFor } from "./affiliates";
export { pageCode, sidFor } from "./affiliates";

// In-text affiliate links (2026-11-16). Article markdown carries REFERENCES,
// never partner URLs or IDs:
//
//   [Hotel Moskva](aff:hotel/moskva)        a named hotel → its Booking.com page
//   [hotels in Dorćol](aff:area/dorcol)     a Booking.com search for an area
//                                           (keys: stay-affiliates.json)
//   [near the airport](aff:near/airport)    a Booking.com search around a place
//   [pre-book a transfer](aff:go/airport-transfer)
//                                           a travel partner (partner-links.json)
//   [Places to stay](aff:pick/dorcol)       ALONE on its own line: a small card
//                                           of 2–3 named hotels + "more in …"
//
// The hotels, picks and places live in src/data/hotel-picks.json; the on/off
// switch + CJ link per partner in affiliates.json (/admin/affiliates). This
// resolves the rendered article HTML at BUILD time in ArticleLayout, so a
// partner switched off renders plain text (links) or nothing (cards), with no
// runtime cost. Resolution happens on the page render, not in a remark plugin,
// so the content-layer cache can never serve a stale switch state. An unknown
// reference throws: a typo fails the build instead of shipping a dead link.

type Tr = Partial<Record<string, Record<string, string>>>;
type Hotel = { name: string; area: string; tier: string; type: string; booking: string; why: string; tr?: Tr; verified: string };
type Pick = { title: string; hotels: string[]; area?: string; near?: string; tr?: Tr };
// `nflt` = a Booking.com results filter, e.g. "fc=2" (free cancellation).
type Near = { search?: string; url?: string; label: string; nflt?: string; tr?: Tr };
type HotelData = {
  hotels: Record<string, Hotel>;
  picks: Record<string, Pick>;
  near: Record<string, Near>;
  chrome: Record<string, Record<string, string>>;
};
const H = hotelData as unknown as HotelData;
type StayTarget = { label: string; search?: string; url?: string; labels?: Record<string, string> };
const STAY_TARGETS = (stay as unknown as { targets: Record<string, StayTarget> }).targets;
// A place on Booking.com: a landing page (`url`) where Booking has one that
// works, else a free-text search (`search`, + optional results filter).
const placeUrl = (x: { url?: string; search?: string; nflt?: string }) => (x.url ? new URL(x.url) : searchUrl(x.search ?? "", x.nflt));
const TRAVEL = (partnerLinks as { targets: Record<string, { partner: string; deep?: Record<string, string> }> }).targets;

const BOOKING_LANG: Record<string, string> = { en: "en-gb", de: "de", sk: "sk", cs: "cs" };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const chrome = (lang: string, k: string) => H.chrome[lang]?.[k] ?? H.chrome.en[k] ?? k;
const trOf = <T extends { tr?: Tr }>(x: T, lang: string, k: string, fallback: string) => x.tr?.[lang]?.[k] ?? fallback;

type Link = { href: string; partner: string; placement: string };

function bookingHref(dest: URL, lang: string, sid: string): string {
  dest.searchParams.set("lang", BOOKING_LANG[lang] ?? "en-gb");
  const value = PARTNERS[STAY_PARTNER].value.trim();
  if (/^\d+$/.test(value)) {
    dest.searchParams.set("aid", value);
    dest.searchParams.set("label", sid);
    return dest.toString();
  }
  return tracked(value, dest.toString(), sid);
}
const searchUrl = (ss: string, nflt?: string) => {
  const u = new URL("https://www.booking.com/searchresults.html");
  u.searchParams.set("ss", ss);
  if (nflt) u.searchParams.set("nflt", nflt);
  return u;
};

// Resolves one reference. null = the partner is off (render plain text);
// throws on a reference that does not exist.
export function resolveRef(ref: string, lang: string, slug: string): Link | null {
  const [kind, key = ""] = ref.split("/");
  const sid = sidFor(lang, slug, key || kind);
  if (kind === "hotel" || kind === "area" || kind === "near") {
    let dest: URL;
    if (kind === "hotel") {
      const h = H.hotels[key];
      if (!h) throw new Error(`aff:${ref} — no hotel "${key}" in hotel-picks.json`);
      dest = new URL(h.booking);
    } else if (kind === "area") {
      const a = STAY_TARGETS[key];
      if (!a?.search && !a?.url) throw new Error(`aff:${ref} — no area "${key}" in stay-affiliates.json`);
      dest = placeUrl(a);
    } else {
      const n = H.near[key];
      if (!n || (!n.search && !n.url)) throw new Error(`aff:${ref} — no place "${key}" in hotel-picks.json → near`);
      dest = placeUrl(n);
    }
    if (!partnerLive(STAY_PARTNER)) return null;
    return { href: bookingHref(dest, lang, sid), partner: STAY_PARTNER, placement: `inline:${ref}` };
  }
  if (kind === "go") {
    const t = TRAVEL[key];
    if (!t) throw new Error(`aff:${ref} — no target "${key}" in partner-links.json`);
    if (!partnerLive(t.partner)) return null;
    const dest = t.deep?.[lang] ?? t.deep?.en;
    return { href: tracked(PARTNERS[t.partner].value.trim(), dest, sid), partner: t.partner, placement: `inline:${ref}` };
  }
  throw new Error(`aff:${ref} — unknown kind "${kind}" (hotel | area | near | go | pick)`);
}

const linkAttrs = (l: Link) =>
  `href="${esc(l.href)}" target="_blank" rel="sponsored nofollow noopener" data-aff="${clickEvent(l.partner)}" data-aff-placement="${esc(l.placement)}"`;

const TIER: Record<string, string> = { budget: "tierBudget", mid: "tierMid", upper: "tierUpper", luxury: "tierLuxury" };
const TYPE: Record<string, string> = { hotel: "typeHotel", boutique: "typeBoutique", aparthotel: "typeAparthotel", hostel: "typeHostel", guesthouse: "typeGuesthouse" };

// The card for aff:pick/<key>. "" while Booking.com is off.
export function pickHtml(key: string, lang: string, slug: string): string {
  const p = H.picks[key];
  if (!p) throw new Error(`aff:pick/${key} — no pick "${key}" in hotel-picks.json`);
  for (const id of p.hotels) if (!H.hotels[id]) throw new Error(`pick "${key}" lists unknown hotel "${id}"`);
  if (!partnerLive(STAY_PARTNER)) return "";
  const title = trOf(p, lang, "title", p.title);
  const rows = p.hotels
    .map((id) => {
      const h = H.hotels[id];
      const sid = sidFor(lang, slug, `p-${id}`);
      const l: Link = { href: bookingHref(new URL(h.booking), lang, sid), partner: STAY_PARTNER, placement: `pick:${key}/${id}` };
      const meta = `${chrome(lang, TYPE[h.type] ?? h.type)} · ${chrome(lang, TIER[h.tier] ?? h.tier)}`;
      return `<li><a class="c-affpick__name" ${linkAttrs(l)}>${esc(h.name)}</a><span class="c-affpick__meta">${esc(meta)}</span><span class="c-affpick__why">${esc(trOf(h, lang, "why", h.why))}</span></li>`;
    })
    .join("");
  let more = "";
  const area = p.area ? STAY_TARGETS[p.area] : undefined;
  const near = p.near ? H.near[p.near] : undefined;
  const place = area?.search || area?.url ? area : near;
  if (place) {
    const label = area ? (area.labels?.[lang] ?? area.label) : trOf(near!, lang, "label", near!.label);
    const l: Link = { href: bookingHref(placeUrl(place), lang, sidFor(lang, slug, `p-${key}-all`)), partner: STAY_PARTNER, placement: `pick:${key}/all` };
    more = `<a ${linkAttrs(l)}>${esc(chrome(lang, area ? "moreArea" : "moreNear").replace("{x}", label))}</a> · `;
  }
  return (
    `<aside class="c-affpick" aria-label="${esc(title)}" data-aff-block="pick:${esc(key)}">` +
    `<p class="c-affpick__title">${esc(title)}</p><ul class="c-affpick__list">${rows}</ul>` +
    `<p class="c-affpick__foot">${more}<span>${esc(chrome(lang, "disclosure"))} <a href="/how-we-make-money">${esc(chrome(lang, "disclosureLink"))}</a></span></p>` +
    `</aside>`
  );
}

export type AffResolved = { html: string; links: number; picks: number; partners: Set<string> };

// Rewrites rendered article HTML: pick paragraphs → cards, aff: links →
// tracked partner links (or their bare text while the partner is off).
export function resolveAffHtml(html: string, lang: string, slug: string): AffResolved {
  let picks = 0;
  let links = 0;
  const partners = new Set<string>();
  let out = html.replace(/<p>\s*<a href="aff:pick\/([^"]+)"[^>]*>[\s\S]*?<\/a>\s*<\/p>/g, (_m, key: string) => {
    const card = pickHtml(key, lang, slug);
    if (card) {
      picks++;
      partners.add(STAY_PARTNER);
    }
    return card;
  });
  if (/href="aff:pick\//.test(out)) throw new Error(`${slug}: an aff:pick/… link must stand alone on its own line`);
  out = out.replace(/<a href="aff:([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g, (_m, ref: string, _rest: string, text: string) => {
    const l = resolveRef(ref, lang, slug);
    if (!l) return text;
    links++;
    partners.add(l.partner);
    return `<a class="c-afflink" ${linkAttrs(l)}>${text}</a>`;
  });
  return { html: out, links, picks, partners };
}

export const hasAffRefs = (s: string | undefined) => !!s && /\]\(aff:|href="aff:/.test(s);

// Markdown → plain markdown for text exports (llms-full.txt): links keep their
// text, pick lines disappear.
export const stripAffMarkdown = (md: string) =>
  md.replace(/^\s*\[[^\]]*\]\(aff:pick\/[^)]+\)\s*$/gm, "").replace(/\[([^\]]+)\]\(aff:[^)]+\)/g, "$1");

// Admin "where it shows": partners referenced from an article body.
export function partnersInBody(md: string | undefined): Set<string> {
  const out = new Set<string>();
  if (!md) return out;
  for (const m of md.matchAll(/\]\(aff:([a-z]+)\/?([^)]*)\)/g)) {
    if (m[1] === "go") {
      const t = TRAVEL[m[2]];
      if (t) out.add(t.partner);
    } else out.add(STAY_PARTNER);
  }
  return out;
}

export const HOTELS = H.hotels;
export const PICKS = H.picks;
