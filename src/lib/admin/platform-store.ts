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

// ── Manage-portal tokens & self-serve saves ──────────────────────────────────
// Magic-link auth: the RAW token exists only in the emailed link; the listing
// stores its sha256. Issue rotates (old links die); revoke clears.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export async function issueManageToken(leg: string, slug: string): Promise<string> {
  if (!/^[a-z0-9-]+$/.test(leg) || !/^[a-z0-9-]+$/.test(slug)) throw new Error("bad leg/slug");
  const rel = `${DIR}/${leg}/${slug}.json`;
  const { text, sha } = await getFile(rel);
  const l = JSON.parse(text) as Listing;
  const token = randomBytes(32).toString("hex");
  l.manage = { tokenHash: hash(token), issued: new Date().toISOString().slice(0, 10) };
  await putFile(rel, JSON.stringify(l, null, 2) + "\n", `admin(platform): issue manage token ${leg}/${slug}`, sha);
  return token; // shown ONCE to the operator
}

export async function revokeManageToken(leg: string, slug: string): Promise<void> {
  const rel = `${DIR}/${leg}/${slug}.json`;
  const { text, sha } = await getFile(rel);
  const l = JSON.parse(text) as Listing;
  delete l.manage;
  await putFile(rel, JSON.stringify(l, null, 2) + "\n", `admin(platform): revoke manage token ${leg}/${slug}`, sha);
}

// Constant-time token check against a listing's stored hash. Tokens are
// 64-hex-char strings (32 random bytes); anything else fails the shape check.
export function tokenMatches(l: Listing, token: string): boolean {
  const stored = l.manage?.tokenHash;
  if (!stored || !/^[a-f0-9]{64}$/.test(token)) return false;
  const a = Buffer.from(hash(token), "hex");
  const b = Buffer.from(stored, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function findByToken(token: string): Promise<AdminListing | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const all = await readListings();
  return all.find((l) => tokenMatches(l, token)) ?? null;
}

// The self-serve save: business-provided text + images. Escapes angle brackets
// (no HTML enters the masters), caps lengths, marks the listing claimed, bumps
// `updated`. Image paths are provided by the caller AFTER the binary commits.
export type ManagePatch = {
  summary: string;
  about: string; // blank-line separated paragraphs
  website?: string;
  images?: string[]; // site-relative paths, already committed
};

const sanitize = (s: string, max: number) =>
  s.replace(/</g, "‹").replace(/>/g, "›").replace(/\s+\n/g, "\n").trim().slice(0, max);

export async function saveManaged(leg: string, slug: string, token: string, patch: ManagePatch): Promise<void> {
  const rel = `${DIR}/${leg}/${slug}.json`;
  const { text, sha } = await getFile(rel);
  const l = JSON.parse(text) as Listing;
  if (!tokenMatches(l, token)) throw new Error("invalid token");
  l.summary = sanitize(patch.summary, 400);
  l.blocks = l.blocks ?? {};
  l.blocks.about = sanitize(patch.about, 4000)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean)
    .slice(0, 6);
  if (patch.website !== undefined) {
    const w = patch.website.trim().slice(0, 200);
    l.links = { ...(l.links ?? {}), website: /^https?:\/\/[^\s]+$/.test(w) ? w : (l.links?.website ?? null) };
  }
  if (patch.images && patch.images.length) l.images = patch.images.slice(0, 3);
  l.claimed = true;
  l.updated = new Date().toISOString().slice(0, 10);
  await putFile(rel, JSON.stringify(l, null, 2) + "\n", `manage: ${leg}/${slug} self-edit`, sha);
}

// ── Bulk import (CSV paste) ──────────────────────────────────────────────────
// For the day exhibitor lists publish: paste CSV rows, get booth stubs.
// Columns (header row optional): name,email,person,website,notes
// Per-row failures don't abort the batch; existing slugs are skipped.
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export type ImportResult = { created: string[]; skipped: string[]; errors: string[] };

export async function importListings(
  leg: string,
  parent: string,
  type: string,
  csv: string,
): Promise<ImportResult> {
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const res: ImportResult = { created: [], skipped: [], errors: [] };
  if (lines.length === 0) return res;

  // Optional header row: starts with "name" and contains no @.
  let cols = ["name", "email", "person", "website", "notes"];
  let start = 0;
  const first = parseCsvLine(lines[0]).map((c) => c.toLowerCase());
  if (first[0] === "name" && !lines[0].includes("@")) {
    cols = first;
    start = 1;
  }
  const idx = (k: string) => cols.indexOf(k);

  for (const line of lines.slice(start)) {
    const f = parseCsvLine(line);
    const name = f[idx("name")] ?? "";
    if (!name) {
      res.errors.push(`empty name: "${line.slice(0, 40)}"`);
      continue;
    }
    try {
      const slug = await createListing({
        leg,
        name,
        type,
        parent,
        email: idx("email") >= 0 ? f[idx("email")] : undefined,
        person: idx("person") >= 0 ? f[idx("person")] : undefined,
        website: idx("website") >= 0 ? f[idx("website")] : undefined,
        notes: idx("notes") >= 0 ? f[idx("notes")] : undefined,
      });
      res.created.push(slug);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("already exists")) res.skipped.push(slugify(name));
      else res.errors.push(`${name}: ${msg}`);
    }
  }
  return res;
}

// ── Pipeline analytics ────────────────────────────────────────────────────────
export type Funnel = { status: OutreachStatus; count: number }[];
export function outreachFunnel(listings: Listing[]): Funnel {
  return OUTREACH_STATUSES.map((status) => ({
    status,
    count: listings.filter((l) => (l.outreach?.status ?? "none") === status).length,
  }));
}
