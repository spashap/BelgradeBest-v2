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
  // Children without a type-specific template fall back to the leg's booth
  // template (the "your page is reserved under {parentUrl}" pitch) before the
  // generic leg template — sponsors/contractors/suppliers are booth-shaped.
  const tpl = (T[`${l.leg}:${l.type}`] ??
    (l.parent ? T[`${l.leg}:booth`] : undefined) ??
    T[l.leg] ??
    T.default) as Tpl;
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
