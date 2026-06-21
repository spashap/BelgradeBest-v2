// gen-internal-links.mjs — Suggest / fill internal "Read next" links.
//
// Internal links are one of the strongest on-page SEO signals, and the render
// source of truth is site-schema.json (slug.linksTo, resolved by lib/links.ts).
// This script scores every indexable article against every other by title-token
// overlap (+ a same-leg bonus) and proposes the best related targets.
//
// Two modes:
//   node scripts/gen-internal-links.mjs            # REPORT only (writes KB/seo/internal-link-suggestions.md)
//   node scripts/gen-internal-links.mjs --write    # fill linksTo in site-schema.json (never removes existing)
//
// Options:
//   --target <n>   desired links per article (default 4)
//   --max-add <n>  max NEW links added per article in --write (default 3)
//   --force-min    in --write, top up every article to <target> even if it already has some
//
// Safe by design: --write only APPENDS (existing curated links are kept), dedupes,
// and only links to visible, indexable targets. Runs on the owner's machine.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_PATH = join(ROOT, "src", "data", "site-schema.json");
const REPORT_PATH = join(ROOT, "KB", "seo", "internal-link-suggestions.md");

// Words too common across Belgrade-guide titles to carry signal.
const STOP = new Set(
  ("a an the to in of for and or your you is are be with how what why when where which this that " +
    "on at from by as it its into out up about guide best top things do does see your trip " +
    "belgrade serbia serbian city vs night day days").split(/\s+/),
);

function tokens(s) {
  return new Set(
    String(s)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 3 && !STOP.has(t)),
  );
}

function parseArgs(argv) {
  const a = { target: 4, maxAdd: 3, write: false, forceMin: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--write") a.write = true;
    else if (t === "--force-min") a.forceMin = true;
    else if (t === "--target") a.target = parseInt(argv[++i], 10) || 4;
    else if (t === "--max-add") a.maxAdd = parseInt(argv[++i], 10) || 3;
  }
  return a;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));

  // Flat list of indexable, visible articles (sources AND targets).
  const nodes = [];
  for (const leg of schema.legs) {
    const legOut = leg.visible === false || leg.noindex === true;
    for (const s of leg.slugs) {
      if (legOut || s.visible === false || s.noindex === true) continue;
      const href = `/${leg.slug}/${s.slug}`;
      nodes.push({
        leg: leg.slug,
        slug: s.slug,
        href,
        title: s.title ?? s.slug,
        priority: s.priority ?? "P3",
        order: s.order ?? 999,
        toks: tokens(`${s.title ?? ""} ${s.slug.replace(/-/g, " ")}`),
        ref: s, // live ref into schema for --write
      });
    }
  }

  const norm = (link, leg) => (link.startsWith("/") ? link : `/${leg}/${link}`);
  const prioRank = { P1: 0, P2: 1, P3: 2 };

  function score(a, b) {
    let shared = 0;
    for (const t of a.toks) if (b.toks.has(t)) shared++;
    if (shared === 0 && a.leg !== b.leg) return -1; // no bridge without overlap
    return shared * 2 + (a.leg === b.leg ? 1.5 : 0);
  }

  const suggestions = new Map(); // href -> { node, existing[], add[] }
  for (const a of nodes) {
    const existing = (a.ref.linksTo ?? []).map((l) => norm(l, a.leg));
    const existingSet = new Set(existing);
    const ranked = nodes
      .filter((b) => b.href !== a.href && !existingSet.has(b.href))
      .map((b) => ({ b, sc: score(a, b) }))
      .filter((x) => x.sc >= 0)
      .sort(
        (x, y) =>
          y.sc - x.sc ||
          prioRank[x.b.priority] - prioRank[y.b.priority] ||
          x.b.order - y.b.order,
      );

    const need = Math.max(0, args.target - existing.length);
    const add = ranked.slice(0, Math.max(need, args.write ? 0 : 5)).map((x) => x.b.href);
    suggestions.set(a.href, { node: a, existing, add });
  }

  if (args.write) {
    let changed = 0;
    for (const { node, existing, add } of suggestions.values()) {
      if (existing.length >= args.target && !args.forceMin) continue;
      const room = Math.min(args.maxAdd, Math.max(0, args.target - existing.length));
      if (room <= 0) continue;
      const toAdd = add.slice(0, room);
      if (toAdd.length === 0) continue;
      node.ref.linksTo = [...existing, ...toAdd];
      changed++;
    }
    writeFileSync(SCHEMA_PATH, JSON.stringify(schema, null, 2) + "\n");
    console.log(`Updated linksTo on ${changed} article(s) → ${SCHEMA_PATH}`);
    console.log("Review the diff, then rebuild. (Existing links were preserved.)");
    return;
  }

  // Report mode.
  const out = [];
  out.push("# Internal-link suggestions");
  out.push("");
  out.push(
    `Generated by scripts/gen-internal-links.mjs. Each article lists its current ` +
      `\`linksTo\` and the top suggested ADDITIONS (by title-token overlap + same-leg ` +
      `affinity). Apply with \`--write\` (appends only, never removes), or hand-pick ` +
      `in /admin → Links.`,
  );
  out.push("");
  let byLeg = "";
  for (const { node, existing, add } of suggestions.values()) {
    if (node.leg !== byLeg) {
      byLeg = node.leg;
      out.push(`## ${byLeg}`);
      out.push("");
    }
    out.push(`### ${node.href}`);
    out.push(`- title: ${node.title}`);
    out.push(`- current (${existing.length}): ${existing.join(", ") || "—"}`);
    out.push(`- suggest: ${add.slice(0, 5).join(", ") || "—"}`);
    out.push("");
  }
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, out.join("\n"));
  console.log(`Wrote suggestions for ${nodes.length} articles → ${REPORT_PATH}`);
  console.log("Re-run with --write to apply (safe: appends only).");
}

main();
