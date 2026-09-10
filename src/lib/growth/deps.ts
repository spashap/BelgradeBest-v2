// Wires the real GrowthDeps for the /api/growth/* routes. Server-only.
//
// Everything here is aggregate or public-by-design: listing COUNTS from the
// build-time listing masters (never `contact`/`outreach`/`manage`), the COUNT
// of lead files in the deployed snapshot (never their contents), the bundled
// change log, and the two Google adapters.
import { env } from "../admin/env";
import { listDir } from "../admin/store";
import { allListings, listingsForLeg, childrenOf } from "../listings";
import { makeGa4Runner, makeGscRunner } from "./runners.ts";
import type { GrowthDeps, ListingCounts } from "./types.ts";
import changelogText from "../../../growth/growth_changes.jsonl?raw";

export function listingCounts(): ListingCounts {
  const leg = "expo-2027";
  const published = listingsForLeg(leg);
  return {
    masters_total: allListings.length,
    published_top_level: published.length,
    published_children: published.reduce((n, p) => n + childrenOf(leg, p.slug).length, 0),
    claimed: allListings.filter((l) => l.claimed === true).length,
  };
}

export async function leadCount(): Promise<number | null> {
  try {
    const entries = await listDir("src/data/leads");
    return entries.filter((e) => !e.dir && e.name.endsWith(".json")).length;
  } catch {
    return null;
  }
}

export async function realDeps(): Promise<GrowthDeps> {
  const ga = await makeGa4Runner();
  return {
    token: env("GROWTH_AGENT_TOKEN"),
    now: () => new Date(),
    ga4: ga.runner,
    ga4Reason: ga.reason,
    gsc: makeGscRunner(),
    changelogText,
    listingCounts,
    leadCount,
  };
}
