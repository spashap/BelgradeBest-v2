// gen-og-default.mjs — Generate the site-wide default social share card.
//
// Produces public/images/og-default.png (1200×630), the fallback og:image used
// by pages without their own hero (home, utility pages, any heroless article).
// Pages WITH a hero use that hero instead — this is only the safety net so no
// shared link ever previews blank.
//
// Runs on the owner's machine (uses the repo's sharp). NOT deployed.
//   node scripts/gen-og-default.mjs [--force]
//
// Colors mirror the design tokens in src/styles/globals.css (:root). This is a
// generated raster asset, not a page, so the tokens are inlined here; if the
// brand palette changes in globals.css, update these four values to match.
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "images");
const OUT = join(OUT_DIR, "og-default.png");

const PAPER = "#f7f3ec"; // --paper
const INK = "#211b16"; // --ink
const INK_SOFT = "#6b5f54"; // --ink-soft
const ACCENT = "#b5462b"; // --accent (brick)
const LINE = "#e2d8c9"; // --line

const W = 1200;
const H = 630;

// xml-escape any text injected into the SVG.
const esc = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

const WORDMARK_LEAD = "Belgrade";
const WORDMARK_ACCENT = "Best";
const TAGLINE = "An honest English guide to Belgrade";
const SUB = "What to see · Where to stay · Food · Expo 2027";

// CROP-SAFE LAYOUT: some apps (chat previews, mobile thumbnails) crop the
// 1200×630 card to a CENTER SQUARE (~630 px wide), so all text is
// center-anchored and sized to fit within ~x 285–915. Decorative full-width
// bars may crop; text never does. (Matches scripts/gen-listing-og.mjs.)
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect x="0" y="0" width="${W}" height="14" fill="${ACCENT}"/>
  <text x="600" y="170" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="26" font-weight="600" letter-spacing="4" fill="${ACCENT}">BELGRADE, HONESTLY</text>
  <rect x="540" y="200" width="120" height="5" fill="${ACCENT}"/>
  <text x="600" y="330" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="84" font-weight="800" fill="${INK}">${esc(
    WORDMARK_LEAD,
  )}<tspan fill="${ACCENT}">${esc(WORDMARK_ACCENT)}</tspan></text>
  <text x="600" y="410" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="34" fill="${INK_SOFT}">${esc(
    TAGLINE,
  )}</text>
  <text x="600" y="465" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="24" fill="${INK_SOFT}">${esc(
    SUB,
  )}</text>
  <line x1="200" y1="524" x2="1000" y2="524" stroke="${LINE}" stroke-width="2"/>
  <text x="600" y="572" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="28" font-weight="600" fill="${ACCENT}">belgradebest.com</text>
</svg>`;

async function main() {
  const force = process.argv.includes("--force");
  if (existsSync(OUT) && !force) {
    console.error("og-default.png already exists. Re-run with --force to overwrite.");
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(OUT);
  const { statSync } = await import("node:fs");
  console.log(`  ✓ public/images/og-default.png (${Math.round(statSync(OUT).size / 1024)} KB)`);
  console.log("Done. Rebuild the site to pick up the new default share image.");
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
