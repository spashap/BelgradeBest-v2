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

export const namedCount = participants.length;
export const officialCount = data.officialCount.count;
export const updated = data.updated;
