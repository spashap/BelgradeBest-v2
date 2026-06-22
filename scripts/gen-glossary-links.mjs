// gen-glossary-links.mjs — Auto-link the FIRST mention of each glossary term in
// the article bodies to its glossary spoke page. This is the hub-and-spoke
// multiplier: authority flows from the strong hand-written articles (hubs) down
// into the granular glossary pages (spokes), which is what makes spokes rank.
//
// Safe by design — mirrors scripts/gen-internal-links.mjs / gen-faqs.mjs:
//   • APPEND-ONLY: only adds links, never removes or rewrites existing text.
//   • IDEMPOTENT: skips any term already linked to /glossary/<slug> in that file,
//     so re-runs change nothing.
//   • ONE link per term per article (first eligible mention only).
//   • Skips headings, code fences, inline code, and text already inside a link.
//   • Operates on the article BODY only (frontmatter is left untouched).
//
//   node scripts/gen-glossary-links.mjs                 # REPORT → KB/seo/glossary-link-suggestions.md
//   node scripts/gen-glossary-links.mjs --write         # apply to src/content/articles/**.md
//   node scripts/gen-glossary-links.mjs --write food-and-nightlife/serbian-food   # limit to article(s)
//   node scripts/gen-glossary-links.mjs --max-per-article 6   # cap links added per file (default 8)
//
// Review the git diff before pushing.
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GLOSSARY_PATH = join(ROOT, "src", "data", "glossary.json");
const ARTICLES_DIR = join(ROOT, "src", "content", "articles");
const SECTION_SLUG = "glossary";
const REPORT_PATH = join(ROOT, "KB", "seo", "glossary-link-suggestions.md");

function parseArgs(argv) {
  const a = { write: false, maxPer: 8, only: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--write") a.write = true;
    else if (t === "--dry-run") a.write = false;
    else if (t === "--max-per-article") a.maxPer = parseInt(argv[++i], 10) || 8;
    else if (!t.startsWith("--")) a.only.push(t.replace(/^\/+/, "").replace(/\.md$/, ""));
  }
  return a;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Build the term match table. Each term contributes its display name + any
// aliases as surface forms; forms are matched longest-first so a longer alias
// (e.g. "ćevapčići") wins over a shorter one ("ćevap") on the same line.
function buildTerms() {
  const data = JSON.parse(readFileSync(GLOSSARY_PATH, "utf8"));
  const terms = [];
  for (const t of data.terms ?? []) {
    if (!t || !t.slug || !t.term) continue;
    const forms = Array.from(new Set([t.term, ...(t.aliases ?? [])].map((f) => f.trim()).filter(Boolean)));
    forms.sort((x, y) => y.length - x.length);
    terms.push({ slug: t.slug, term: t.term, href: `/${SECTION_SLUG}/${t.slug}`, forms });
  }
  return terms;
}

// Intervals on a line that must NOT be matched into: existing markdown links
// (incl. image alts) and inline code spans.
function maskedRanges(line) {
  const ranges = [];
  const patterns = [/\[[^\]]*\]\([^)]*\)/g, /`[^`]*`/g];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(line)) !== null) ranges.push([m.index, m.index + m[0].length]);
  }
  return ranges;
}
const inMasked = (idx, end, ranges) => ranges.some(([s, e]) => idx < e && end > s);

// Split frontmatter (--- ... ---) from the body. Only the body is linked.
function splitFrontmatter(text) {
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) {
      const close = text.indexOf("\n", end + 1);
      const cut = close === -1 ? text.length : close + 1;
      return { head: text.slice(0, cut), body: text.slice(cut) };
    }
  }
  return { head: "", body: text };
}

// Link the first eligible mention of each not-yet-linked term in a body.
// Returns { body, linked: [{slug, form}] }.
function linkBody(body, terms, maxPer) {
  const lines = body.split("\n");
  const alreadyLinked = new Set();
  for (const t of terms) {
    if (new RegExp(`\\(${escapeRe(t.href)}\\)`).test(body)) alreadyLinked.add(t.slug);
  }
  const linked = [];
  const doneSlugs = new Set(alreadyLinked);
  let inFence = false;

  for (let i = 0; i < lines.length && linked.length < maxPer; i++) {
    let line = lines[i];
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (/^\s{0,3}#/.test(line)) continue; // heading line

    for (const t of terms) {
      if (doneSlugs.has(t.slug)) continue;
      if (linked.length >= maxPer) break;
      let placed = false;
      for (const form of t.forms) {
        const re = new RegExp(`(?<![\\p{L}\\p{N}])(${escapeRe(form)})(?![\\p{L}\\p{N}])`, "iu");
        const m = re.exec(line);
        if (!m) continue;
        const start = m.index;
        const end = start + m[0].length;
        if (inMasked(start, end, maskedRanges(line))) continue;
        line = line.slice(0, start) + `[${m[0]}](${t.href})` + line.slice(end);
        linked.push({ slug: t.slug, form: m[0] });
        doneSlugs.add(t.slug);
        placed = true;
        break;
      }
      if (placed) lines[i] = line;
    }
  }
  return { body: lines.join("\n"), linked };
}

function collectArticles(only) {
  const out = [];
  for (const leg of readdirSync(ARTICLES_DIR)) {
    const legDir = join(ARTICLES_DIR, leg);
    if (!statSync(legDir).isDirectory()) continue;
    for (const file of readdirSync(legDir)) {
      if (!file.endsWith(".md")) continue;
      const rel = `${leg}/${file.replace(/\.md$/, "")}`;
      if (only.length && !only.includes(rel)) continue;
      out.push({ rel, path: join(legDir, file) });
    }
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const terms = buildTerms();
  const articles = collectArticles(args.only);

  const results = [];
  for (const art of articles) {
    const text = readFileSync(art.path, "utf8");
    const { head, body } = splitFrontmatter(text);
    const { body: newBody, linked } = linkBody(body, terms, args.maxPer);
    if (linked.length === 0) continue;
    results.push({ ...art, linked, newText: head + newBody });
  }

  if (args.write) {
    let files = 0, links = 0;
    for (const r of results) {
      writeFileSync(r.path, r.newText);
      files++;
      links += r.linked.length;
      console.log(`  ✓ ${r.rel} (+${r.linked.length}: ${r.linked.map((l) => l.slug).join(", ")})`);
    }
    console.log(`\nAdded ${links} glossary link(s) across ${files} article(s). Review the diff, then rebuild.`);
    return;
  }

  // Report mode.
  const out = [];
  out.push("# Glossary auto-link suggestions");
  out.push("");
  out.push(
    `Generated by scripts/gen-glossary-links.mjs. Each article lists the glossary ` +
      `terms whose first mention WOULD be linked to its spoke page. Apply with ` +
      `\`--write\` (append-only, idempotent, one link per term per article).`,
  );
  out.push("");
  let total = 0;
  for (const r of results) {
    out.push(`### /${r.rel}`);
    for (const l of r.linked) out.push(`- "${l.form}" → /${SECTION_SLUG}/${l.slug}`);
    out.push("");
    total += r.linked.length;
  }
  if (results.length === 0) out.push("_No new links to add — everything is already linked._");
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, out.join("\n"));
  console.log(`Would add ${total} link(s) across ${results.length} article(s) → ${REPORT_PATH}`);
  console.log("Re-run with --write to apply (safe: append-only, idempotent).");
}

main();
