// ============================================================================
// ONE-TIME content porter — BelgradeBest (Next.js) → BelgradeBest-V2 (Astro).
//
// READS ONLY from the old frontend tree (sibling ../BelgradeBest/frontend).
// WRITES ONLY into this V2 project (src/content, src/data, public/images).
// It is NOT part of the deployed site (excluded via .vercelignore) and is not
// imported by Astro. Idempotent — safe to re-run.
//
// Run from the V2 repo root:
//   node --experimental-strip-types scripts/port-content.mjs
// (Node 26 strips the type-only imports in the old TS registries on import.)
// ============================================================================

import { existsSync, readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const NEW = join(dirname(fileURLToPath(import.meta.url)), "..");
const OLD = join(NEW, "..", "BelgradeBest", "frontend");

if (!existsSync(OLD)) {
  console.error(`[port] OLD tree not found at ${OLD}. This is the ONLY read source.`);
  process.exit(1);
}

// leg → its render registry (the only place per-article render metadata lives).
const REGISTRIES = [
  { leg: "expo-2027", file: "lib/expo-articles.ts", exp: "expoArticles" },
  { leg: "plan-your-trip", file: "lib/plan-articles.ts", exp: "planArticles" },
  { leg: "visit-belgrade", file: "lib/visit-articles.ts", exp: "visitArticles" },
  { leg: "food-and-nightlife", file: "lib/food-articles.ts", exp: "foodArticles" },
  { leg: "medical-tourism", file: "lib/medical-articles.ts", exp: "medicalArticles" },
];

// ---- helpers ----------------------------------------------------------------

// YAML is a superset of JSON, so a JSON-stringified scalar is always valid YAML
// (and correctly escapes quotes, backslashes, diacritics, em-dashes, colons).
const y = (v) => (typeof v === "boolean" || typeof v === "number" ? String(v) : v === null ? "null" : JSON.stringify(v));

function frontmatter(obj) {
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) {
        lines.push(`${k}: []`);
      } else if (typeof v[0] === "object" && v[0] !== null) {
        // array of objects (faqs)
        lines.push(`${k}:`);
        for (const item of v) {
          const keys = Object.keys(item);
          lines.push(`  - ${keys[0]}: ${y(item[keys[0]])}`);
          for (const kk of keys.slice(1)) lines.push(`    ${kk}: ${y(item[kk])}`);
        }
      } else {
        lines.push(`${k}:`);
        for (const item of v) lines.push(`  - ${y(item)}`);
      }
    } else {
      lines.push(`${k}: ${y(v)}`);
    }
  }
  return lines.join("\n");
}

// Best-effort extraction of literals from a page.tsx (authoritative as-rendered).
function readPageProps(leg, slug) {
  const p = join(OLD, "app", leg, slug, "page.tsx");
  if (!existsSync(p)) return {};
  const src = readFileSync(p, "utf8");
  const out = {};
  const lu = src.match(/lastUpdated="([^"]+)"/);
  if (lu) out.lastUpdated = lu[1];
  const ha = src.match(/heroAlt="((?:[^"\\]|\\.)*)"/);
  if (ha) out.heroAlt = JSON.parse(`"${ha[1]}"`);
  const un = src.match(/unknowns=\{(\[[\s\S]*?\])\}/);
  if (un) {
    const items = [];
    const re = /"((?:[^"\\]|\\.)*)"/g;
    let m;
    while ((m = re.exec(un[1])) !== null) items.push(JSON.parse(`"${m[1]}"`));
    if (items.length) out.unknowns = items;
  }
  return out;
}

// ---- load the structure master (we rewrite its linksTo) ---------------------
const schemaPath = join(NEW, "src", "data", "site-schema.json");
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
const legBySlug = Object.fromEntries(schema.legs.map((l) => [l.slug, l]));

// ---- port each leg's articles ----------------------------------------------
let written = 0;
const missingHeroes = [];
const ported = [];

for (const reg of REGISTRIES) {
  const mod = await import(pathToFileURL(join(OLD, reg.file)).href);
  const articles = mod[reg.exp];
  if (!Array.isArray(articles)) {
    console.error(`[port] ${reg.file}: export ${reg.exp} is not an array`);
    process.exit(1);
  }
  const leg = reg.leg;
  const legSchema = legBySlug[leg];
  const slugSchema = Object.fromEntries((legSchema?.slugs ?? []).map((s) => [s.slug, s]));

  for (const a of articles) {
    const bodyPath = join(OLD, "app", leg, a.slug, "body.md");
    if (!existsSync(bodyPath)) continue; // not built → stays a planned stub
    const body = readFileSync(bodyPath, "utf8");

    const faqsPath = join(OLD, "app", leg, a.slug, "faqs.json");
    const faqs = existsSync(faqsPath) ? JSON.parse(readFileSync(faqsPath, "utf8")) : [];

    const pp = readPageProps(leg, a.slug);
    const ss = slugSchema[a.slug] ?? {};

    const lastUpdated = pp.lastUpdated || a.lastUpdated;
    if (!lastUpdated) {
      console.error(`[port] ${leg}/${a.slug}: no lastUpdated in page.tsx or registry`);
      process.exit(1);
    }

    const evergreenHrefs = (a.evergreenTargets ?? [])
      .map((t) => t.href)
      .filter((h) => typeof h === "string" && h.length > 0);

    const fm = {
      leg,
      slug: a.slug,
      title: a.title,
      shortTitle: a.shortTitle,
      description: a.description,
      lede: a.lede,
      heroLabel: a.heroLabel,
      heroAlt: pp.heroAlt, // optional
      lastUpdated,
      order: typeof ss.order === "number" ? ss.order : 999,
      visible: ss.visible !== false,
      intent: ss.intent ?? null,
      priority: ss.priority ?? "P3",
      // Indexing posture preserved: article inherits its leg's noindex flag.
      noindex: !!legSchema?.noindex,
      linksTo: evergreenHrefs, // porter-seeded reference; render reads schema
      faqs,
      isFaqCandidate: a.isFaqCandidate,
      unknowns: pp.unknowns ?? [],
    };

    const outDir = join(NEW, "src", "content", "articles", leg);
    mkdirSync(outDir, { recursive: true });
    const md = `---\n${frontmatter(fm)}\n---\n\n${body}`;
    writeFileSync(join(outDir, `${a.slug}.md`), md, "utf8");
    written++;
    ported.push(`${leg}/${a.slug}`);

    // The editable LINK MASTER (site-schema.json slug.linksTo) is normalized to
    // the rendered set: each article's evergreen targets, as full hrefs.
    if (slugSchema[a.slug]) slugSchema[a.slug].linksTo = evergreenHrefs;

    if (!existsSync(join(OLD, "public", "images", "expo-2027", `${a.slug}-hero.png`))) {
      missingHeroes.push(`${leg}/${a.slug}`);
    }
  }
}

// ---- persist the normalized structure master -------------------------------
writeFileSync(schemaPath, JSON.stringify(schema, null, 2) + "\n", "utf8");

// ---- copy images verbatim (keep the flat images/expo-2027 convention) -------
const oldImg = join(OLD, "public", "images");
const newImg = join(NEW, "public", "images");
if (existsSync(oldImg)) {
  rmSync(newImg, { recursive: true, force: true });
  cpSync(oldImg, newImg, { recursive: true });
}

// ---- report -----------------------------------------------------------------
console.log(`[port] wrote ${written} article content files:`);
for (const s of ported.sort()) console.log(`         ${s}`);
console.log(`[port] copied images → public/images`);
if (missingHeroes.length) {
  console.log(`[port] WARNING: ${missingHeroes.length} ported slugs have no hero PNG:`);
  for (const s of missingHeroes) console.log(`         ${s}`);
}
console.log(`[port] normalized site-schema.json linksTo to the rendered evergreen set.`);
