// Atomic, fresh-read-per-op store over the V2 data masters. Mirrors the old
// schema-store.ts model: every mutation reads the file fresh, mutates, and
// writes atomically (tmp file + rename) so concurrent ops never clobber.
//
// The site reads these exact files at build, so an admin edit is reflected on
// the next `astro build` / dev reload.
import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ADMIN = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(ADMIN, "..");
const SCHEMA = join(ROOT, "src", "data", "site-schema.json");
const ARTICLES = join(ROOT, "src", "content", "articles");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
function writeJsonAtomic(path, obj) {
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n", "utf8");
  renameSync(tmp, path);
}

export function readSchema() {
  return readJson(SCHEMA);
}

// "Live" = a committed content file exists (exactly what the build renders).
export function isLive(leg, slug) {
  return existsSync(join(ARTICLES, leg, `${slug}.md`));
}

function findLeg(schema, legSlug) {
  const leg = schema.legs.find((l) => l.slug === legSlug);
  if (!leg) throw new Error(`unknown leg '${legSlug}'`);
  return leg;
}
function findSlug(leg, slugId) {
  const s = leg.slugs.find((x) => x.slug === slugId);
  if (!s) throw new Error(`unknown slug '${slugId}' in '${leg.slug}'`);
  return s;
}

// ---- mutations (each: fresh read → mutate → atomic write) ----

// Set a slug's related-link list (the render master). Accepts an array of
// internal hrefs ("/leg/slug" or "/leg") or bare same-leg slugs. Trims, drops
// empties, dedupes.
export function setSlugLinks(legSlug, slugId, links) {
  const schema = readSchema();
  const slug = findSlug(findLeg(schema, legSlug), slugId);
  const clean = [];
  const seen = new Set();
  for (const raw of links) {
    const v = String(raw).trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    clean.push(v);
  }
  slug.linksTo = clean;
  writeJsonAtomic(SCHEMA, schema);
  return clean;
}

export function setSlugVisible(legSlug, slugId, visible) {
  const schema = readSchema();
  const slug = findSlug(findLeg(schema, legSlug), slugId);
  slug.visible = !!visible;
  writeJsonAtomic(SCHEMA, schema);
  return slug.visible;
}

export function setLegVisible(legSlug, visible) {
  const schema = readSchema();
  findLeg(schema, legSlug).visible = !!visible;
  writeJsonAtomic(SCHEMA, schema);
}

// Reorder a slug within its leg by swapping `order` with its neighbour.
export function moveSlug(legSlug, slugId, dir) {
  const schema = readSchema();
  const leg = findLeg(schema, legSlug);
  const sorted = [...leg.slugs].sort((a, b) => a.order - b.order);
  const i = sorted.findIndex((s) => s.slug === slugId);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= sorted.length) return; // edge — no-op
  const a = sorted[i].order;
  sorted[i].order = sorted[j].order;
  sorted[j].order = a;
  writeJsonAtomic(SCHEMA, schema);
}
