// gen-area-thumbs.mjs — Generate lightweight branded SVG thumbnails for the
// programmatic area pages (#5). No AI / no API cost: each is a tiny vector card
// with the neighbourhood name on brand paper, used as the card thumbnail and the
// page hero. Re-run whenever src/data/areas.json changes.
//
//   node scripts/gen-area-thumbs.mjs [--force]
//
// Writes public/images/areas/<slug>.svg (committed; ~1 KB each). Colors mirror
// the design tokens in src/styles/globals.css (:root) — generated asset, not a
// page, so inlined here; keep in sync if the palette changes.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "src", "data", "areas.json");
const OUT_DIR = join(ROOT, "public", "images", "areas");

const PAPER = "#f7f3ec";
const INK = "#211b16";
const INK_SOFT = "#6b5f54";
const ACCENT = "#b5462b";
const LINE = "#e2d8c9";

const W = 1600;
const H = 686; // 21:9 — matches ArticleHero (full width visible there)

// CROP-SAFE: the .c-card__img crop is 16:11 (object-fit: cover), so of this
// 1600-wide canvas only the central ~998 px is visible on cards. ALL text must
// fit inside that window — size against SAFE, not the canvas. (This was the
// "Novi Beograd (New Belgrade)" trimming bug: the old budget was 1320 px.)
const SAFE = 940;

const esc = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

// Fit a line of text into the SAFE window by shrinking its font size.
function fitFont(text, base, charEm, min = 20) {
  const size = Math.min(base, Math.floor(SAFE / (Math.max(String(text).length, 1) * charEm)));
  return Math.max(min, size);
}
const nameFontSize = (name) => fitFont(name, 120, 0.56, 44);

function svgFor(area) {
  const name = area.name;
  const fs = nameFontSize(name);
  const sub = String(area.riverSide || "").split(",")[0];
  const local = area.localName || "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(name)} — Belgrade neighbourhood">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect x="0" y="0" width="${W}" height="10" fill="${ACCENT}"/>
  <!-- faint river lines (Sava + Danube nod) -->
  <path d="M0 600 Q 400 560 800 600 T 1600 600" fill="none" stroke="${ACCENT}" stroke-width="3" opacity="0.10"/>
  <path d="M0 640 Q 400 680 800 640 T 1600 640" fill="none" stroke="${ACCENT}" stroke-width="3" opacity="0.08"/>
  <text x="${W / 2}" y="232" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="26" letter-spacing="4" font-weight="600" fill="${ACCENT}">BELGRADE · NEIGHBOURHOOD GUIDE</text>
  <text x="${W / 2}" y="${360 + fs * 0.34}" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="${fs}" font-weight="800" fill="${INK}">${esc(name)}</text>
  ${local ? `<text x="${W / 2}" y="468" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="${fitFont(local, 34, 0.5)}" fill="${INK_SOFT}">${esc(local)}</text>` : ""}
  <line x1="${W / 2 - 60}" y1="510" x2="${W / 2 + 60}" y2="510" stroke="${ACCENT}" stroke-width="3"/>
  <text x="${W / 2}" y="556" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="${fitFont(sub, 26, 0.52)}" fill="${INK_SOFT}">${esc(sub)}</text>
  <rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${LINE}" stroke-width="2"/>
</svg>
`;
}

function main() {
  const force = process.argv.includes("--force");
  const data = JSON.parse(readFileSync(DATA, "utf8"));
  mkdirSync(OUT_DIR, { recursive: true });
  let wrote = 0, skipped = 0;
  for (const area of data.areas) {
    if (!area || !area.slug) continue;
    const out = join(OUT_DIR, `${area.slug}.svg`);
    if (existsSync(out) && !force) { skipped++; continue; }
    writeFileSync(out, svgFor(area));
    console.log(`  ✓ images/areas/${area.slug}.svg`);
    wrote++;
  }
  console.log(`\nDone. wrote=${wrote} skipped=${skipped} (use --force to overwrite).`);
}

main();
