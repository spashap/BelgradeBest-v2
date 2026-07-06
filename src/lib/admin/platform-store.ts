// Admin-side store for the claimable-listings platform. Unlike the public
// pages (which bundle listings at BUILD time via lib/listings.ts), the admin
// module reads the listing JSON files at REQUEST time through the shared
// GitHub/local store — so outreach-status and claim edits show up immediately
// after a save, without waiting for the Vercel rebuild.

import { getFile, putFile, listDir, usingGitHub } from "./store";
import { allListings, OUTREACH_STATUSES, type Listing, type OutreachStatus } from "../listings";

const DIR = "src/data/listings";

export type AdminListing = Listing & { rel: string };

export async function readListings(): Promise<AdminListing[]> {
  const legs = await listDir(DIR);
  const legDirs = legs.filter((e) => e.dir).map((e) => e.name);
  if (legDirs.length === 0) {
    // Vercel serverless without GitHub creds: no dir on disk — fall back to the
    // bundled build-time snapshot so the module still renders (read-only).
    return allListings.map((l) => ({ ...l, rel: `${DIR}/${l.leg}/${l.slug}.json` }));
  }
  const reads: Promise<AdminListing>[] = [];
  for (const leg of legDirs) {
    const files = await listDir(`${DIR}/${leg}`);
    for (const f of files) {
      if (f.dir || !f.name.endsWith(".json")) continue;
      const rel = `${DIR}/${leg}/${f.name}`;
      reads.push(getFile(rel).then(({ text }) => ({ ...(JSON.parse(text) as Listing), rel })));
    }
  }
  const out = await Promise.all(reads);
  return out.sort((a, b) => a.leg.localeCompare(b.leg) || a.name.localeCompare(b.name, "en"));
}

// One PATCH surface for everything the admin can change on a listing without
// touching its editorial content: contact, outreach pipeline state, claim flag.
// Timestamps are stamped automatically on the sent/replied transitions.
export type ListingPatch = {
  contactEmail?: string;
  contactPerson?: string;
  outreachStatus?: OutreachStatus;
  outreachNotes?: string;
  claimed?: boolean;
};

export async function updateListingAdmin(leg: string, slug: string, patch: ListingPatch): Promise<void> {
  if (!/^[a-z0-9-]+$/.test(leg) || !/^[a-z0-9-]+$/.test(slug)) throw new Error("bad leg/slug");
  const rel = `${DIR}/${leg}/${slug}.json`;
  const { text, sha } = await getFile(rel);
  const l = JSON.parse(text) as Listing;

  if (patch.contactEmail !== undefined || patch.contactPerson !== undefined) {
    l.contact = { ...(l.contact ?? {}) };
    if (patch.contactEmail !== undefined) l.contact.email = patch.contactEmail.trim() || undefined;
    if (patch.contactPerson !== undefined) l.contact.person = patch.contactPerson.trim() || undefined;
  }
  if (patch.outreachStatus !== undefined || patch.outreachNotes !== undefined) {
    const o = { ...(l.outreach ?? {}) };
    if (patch.outreachStatus !== undefined) {
      if (!OUTREACH_STATUSES.includes(patch.outreachStatus)) throw new Error("bad outreach status");
      o.status = patch.outreachStatus;
      const today = new Date().toISOString().slice(0, 10);
      if (patch.outreachStatus === "sent" && !o.sentAt) o.sentAt = today;
      if (patch.outreachStatus === "replied" && !o.repliedAt) o.repliedAt = today;
    }
    if (patch.outreachNotes !== undefined) o.notes = patch.outreachNotes.trim() || undefined;
    l.outreach = o;
  }
  if (patch.claimed !== undefined) l.claimed = patch.claimed;

  const what = [
    patch.outreachStatus && `outreach→${patch.outreachStatus}`,
    patch.contactEmail !== undefined && "contact",
    patch.claimed !== undefined && `claimed=${patch.claimed}`,
  ]
    .filter(Boolean)
    .join(", ");
  await putFile(rel, JSON.stringify(l, null, 2) + "\n", `admin(platform): ${leg}/${slug} — ${what || "update"}`, sha);
}

export const platformUsingGitHub = usingGitHub;

// ── Prospect creation (the north star: booths) ───────────────────────────────
// The outreach database is built IN the admin: "add business" creates a stub
// listing file (thin → unpublished; the public site is untouched until real
// content lands via claim/editing). Also used to create category stubs
// (pavilions) as containers for booths.
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    // strip combining diacritics left by NFKD
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export type NewListing = {
  leg: string;
  name: string;
  type: string; // "booth" | "pavilion" | …
  parent?: string;
  email?: string;
  person?: string;
  website?: string;
  notes?: string;
};

export async function createListing(input: NewListing): Promise<string> {
  const slug = slugify(input.name);
  if (!slug) throw new Error("name produces an empty slug");
  if (!/^[a-z0-9-]+$/.test(input.leg)) throw new Error("bad leg");
  const rel = `${DIR}/${input.leg}/${slug}.json`;
  // Refuse to overwrite an existing listing.
  try {
    await getFile(rel);
    throw new Error(`listing '${slug}' already exists in ${input.leg}`);
  } catch (e) {
    if ((e as Error).message.includes("already exists")) throw e;
    /* not found → good */
  }
  const today = new Date().toISOString().slice(0, 10);
  const stub: Listing = {
    slug,
    leg: input.leg,
    type: input.type,
    ...(input.parent ? { parent: input.parent } : {}),
    name: input.name.trim(),
    summary: "",
    claimed: false,
    verified: false,
    updated: today,
    blocks: {},
    links: { website: input.website?.trim() || null, sources: [] },
    images: [],
    ...(input.email || input.person
      ? { contact: { email: input.email?.trim() || undefined, person: input.person?.trim() || undefined } }
      : {}),
    outreach: { status: "none", ...(input.notes ? { notes: input.notes.trim() } : {}) },
  };
  await putFile(rel, JSON.stringify(stub, null, 2) + "\n", `admin(platform): add ${input.type} ${input.leg}/${slug}`, null);
  return slug;
}

// ── Pipeline analytics ────────────────────────────────────────────────────────
export type Funnel = { status: OutreachStatus; count: number }[];
export function outreachFunnel(listings: Listing[]): Funnel {
  return OUTREACH_STATUSES.map((status) => ({
    status,
    count: listings.filter((l) => (l.outreach?.status ?? "none") === status).length,
  }));
}
