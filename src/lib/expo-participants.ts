// Expo 2027 participant tracker — typed accessor over data/expo-participants.json
// (the data master, hand-updated as confirmations land; bump `updated` on every
// edit — it drives the page's dateModified + sitemap lastmod).

import data from "../data/expo-participants.json";

export type Participant = {
  name: string;
  region: string;
  announced: string | null;
  host?: boolean;
  source: string;
};

export type TimelinePoint = {
  date: string;
  count: number | null;
  event: string;
  source: string;
};

export const TRACKER = data;

export const participants: Participant[] = (data.participants as Participant[])
  .slice()
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

export const timeline: TimelinePoint[] = data.timeline as TimelinePoint[];

// Region → named-country count, largest first (the "spread" stat).
export function byRegion(): Array<{ region: string; count: number }> {
  const m = new Map<string, number>();
  for (const p of participants) m.set(p.region, (m.get(p.region) ?? 0) + 1);
  return [...m.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);
}

// Region of a named country (by name or a listing's shortName), else null.
const regionIndex = new Map(participants.map((p) => [p.name.toLowerCase(), p.region]));
export function regionOf(name: string | undefined): string | null {
  if (!name) return null;
  return regionIndex.get(name.toLowerCase()) ?? null;
}
// Short codes for the deck readouts / panel codes. Unknown regions → 2 letters.
export const REGION_CODE: Record<string, string> = {
  Europe: "EU", Asia: "AS", Africa: "AF", Americas: "AM", Oceania: "OC", "Middle East": "ME", "North America": "NA", "South America": "SA",
};
export const regionCode = (r: string | null) => (r ? (REGION_CODE[r] ?? r.slice(0, 2).toUpperCase()) : "—");
// Pipeline stage of a listing status for the 4-segment progress track.
export const STAGE: Record<string, number> = { "concept-only": 1, announced: 2, tender: 3, construction: 4 };

export const namedCount = participants.length;
export const officialCount = data.officialCount.count;
export const updated = data.updated;
