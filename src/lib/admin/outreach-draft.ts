// Outreach draft builder — one place that turns a listing + the templates file
// into a ready-to-send subject/body. Template resolution, most specific wins:
//   "<leg>:<type>"  (e.g. "expo-2027:booth")  →  "<leg>"  →  "default".
// Placeholders: {name} {short} {pageUrl} {parentName} {parentUrl}.
// NOTE for booth drafts: a prospect stub's own page is unpublished until the
// business claims it, so booth templates should sell {parentUrl} (the pavilion
// page / directory) and frame {name}'s page as reserved.

import templates from "../../data/outreach-templates.json";
import { SITE } from "../site";
import { listingHref, type Listing } from "../listings";

export type Draft = { subject: string; body: string };
type Tpl = { subject: string; body: string };
const T = templates as unknown as Record<string, Tpl | string>;

export function draftFor(l: Listing, all: Listing[]): Draft {
  // Most specific first: '<leg>:<type>' → '<leg>' → 'default'. There is NO
  // parent-based fallback any more: it used to funnel every child into the
  // "booth" pitch, which called contractors, agencies and suppliers exhibitors —
  // a factual error in the first line of an email. (There are no exhibitor
  // listings at all: the 79 masters are contractors, agencies, pavilions,
  // suppliers, sponsors, a chamber and organisations.)
  const tpl = (T[`${l.leg}:${l.type}`] ?? T[l.leg] ?? T.default) as Tpl;
  const parent = l.parent ? all.find((p) => p.leg === l.leg && p.slug === l.parent) : undefined;
  const fill = (s: string) =>
    s
      .replaceAll("{name}", l.name)
      .replaceAll("{short}", l.shortName ?? l.name)
      .replaceAll("{pageUrl}", `${SITE.origin}${listingHref(l)}`)
      .replaceAll("{parentName}", parent?.name ?? "the Expo")
      .replaceAll("{parentUrl}", parent ? `${SITE.origin}${listingHref(parent)}` : SITE.origin);
  return { subject: fill(tpl.subject), body: fill(tpl.body) };
}

export function mailtoFor(l: Listing, d: Draft): string | null {
  return l.contact?.email
    ? `mailto:${l.contact.email}?subject=${encodeURIComponent(d.subject)}&body=${encodeURIComponent(d.body)}`
    : null;
}
