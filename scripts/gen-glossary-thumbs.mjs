// gen-glossary-thumbs.mjs — Generate lightweight branded SVG thumbnails for the
// programmatic glossary spoke pages (hub-and-spoke SEO). No AI / no API cost:
// each is a tiny vector card with the term, its Serbian spelling and category on
// brand paper, used as the card thumbnail and the page hero. Mirrors
// scripts/gen-area-thumbs.mjs. Re-run whenever src/data/glossary.json changes.
//
//   node scripts/gen-glossary-thumbs.mjs [--force]
//
// Writes public/images/glossary/<slug>.svg (committed; ~1 KB each). Colors mirror
// the design tokens in src/styles/globals.css (:root) — generated asset, not a
// page, so inlined here; keep in sync if the palette changes.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "src", "data", "glossary.json");
const OUT_DIR = join(ROOT, "public", "images", "glossary");

const PAPER = "#f7f3ec";
const INK = "#211b16";
const INK_SOFT = "#6b5f54";
const ACCENT = "#b5462b";
const LINE = "#e2d8c9";

const W = 1600;
const H = 686; // 21:9 — matches ArticleHero (full width visible there)

// CROP-SAFE: the .c-card__img crop is 16:11 (object-fit: cover), so only the
// central ~998 px of this canvas shows on cards — size text against SAFE, not
// the canvas (same fix as gen-area-thumbs.mjs).
const SAFE = 940;

const esc = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

// Fit a line of text into the SAFE window by shrinking its font size.
function fitFont(text, base, charEm, min = 20) {
  const size = Math.min(base, Math.floor(SAFE / (Math.max(String(text).length, 1) * charEm)));
  return Math.max(min, size);
}
const termFontSize = (name) => fitFont(name, 132, 0.56, 48);

function svgFor(term) {
  const name = term.term;
  const fs = termFontSize(name);
  const local = term.localTerm || "";
  const cat = String(term.category || "").toUpperCase();
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(name)} — Belgrade glossary">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect x="0" y="0" width="${W}" height="10" fill="${ACCENT}"/>
  <!-- faint river lines (Sava + Danube nod) -->
  <path d="M0 600 Q 400 560 800 600 T 1600 600" fill="none" stroke="${ACCENT}" stroke-width="3" opacity="0.10"/>
  <path d="M0 640 Q 400 680 800 640 T 1600 640" fill="none" stroke="${ACCENT}" stroke-width="3" opacity="0.08"/>
  <text x="${W / 2}" y="222" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="${fitFont(`BELGRADE · GLOSSARY${cat ? ` · ${cat}` : ""}`, 26, 0.75)}" letter-spacing="4" font-weight="600" fill="${ACCENT}">BELGRADE · GLOSSARY${cat ? ` · ${esc(cat)}` : ""}</text>
  <text x="${W / 2}" y="${360 + fs * 0.34}" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="${fs}" font-weight="800" fill="${INK}">${esc(name)}</text>
  ${local ? `<text x="${W / 2}" y="476" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="${fitFont(local, 38, 0.5)}" fill="${INK_SOFT}">${esc(local)}</text>` : ""}
  <line x1="${W / 2 - 60}" y1="520" x2="${W / 2 + 60}" y2="520" stroke="${ACCENT}" stroke-width="3"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${LINE}" stroke-width="2"/>
</svg>
`;
}

function main() {
  const force = process.argv.includes("--force");
  const data = JSON.parse(readFileSync(DATA, "utf8"));
  mkdirSync(OUT_DIR, { recursive: true });
  let wrote = 0, skipped = 0;
  for (const term of data.terms) {
    if (!term || !term.slug) continue;
    const out = join(OUT_DIR, `${term.slug}.svg`);
    if (existsSync(out) && !force) { skipped++; continue; }
    writeFileSync(out, svgFor(term));
    console.log(`  ✓ images/glossary/${term.slug}.svg`);
    wrote++;
  }
  console.log(`\nDone. wrote=${wrote} skipped=${skipped} (use --force to overwrite).`);
}

main();
