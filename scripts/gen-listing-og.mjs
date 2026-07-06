// gen-listing-og.mjs — Generate social share cards (og:image) for the
// platform pages: every PUBLISHED listing (pavilions + children) plus the
// fixed platform pages (tracker, pavilion directory, corporate area,
// countdown, for-businesses).
//
// CROP-SAFE BY DESIGN: some apps (chat previews, mobile thumbnails) crop the
// 1200×630 card at the sides or corners, so ALL text is center-anchored and
// kept inside a central safe area (~1000×460 px, ≥100 px side margins).
// Decorative full-width bars may crop; text never does.
//
// Owner-run (uses the repo's sharp), NOT deployed. Idempotent — overwrites.
//   node scripts/gen-listing-og.mjs
// Re-run after adding/renaming published listings, then rebuild.
import { readdirSync, readFileSync, mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LISTINGS = join(ROOT, "src", "data", "listings", "expo-2027");
const OUT_DIR = join(ROOT, "public", "images", "og");

// Design tokens (mirrors globals.css :root; raster asset, inlined by design).
const PAPER = "#f7f3ec";
const INK = "#211b16";
const INK_SOFT = "#6b5f54";
const ACCENT = "#b5462b";
const ACCENT_INK = "#8f3621";
const LINE = "#e2d8c9";

const W = 1200;
const H = 630;

const esc = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

// Greedy word-wrap to at most `max` chars per line, at most 2 lines. Words
// that would spill past line 2 are MERGED into line 2 (never dropped) — the
// caller's font-shrink handles the extra width.
function wrap(text, max) {
  const words = String(text).split(/\s+/);
  const lines = [""];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if ((cur + " " + w).trim().length <= max) lines[lines.length - 1] = (cur + " " + w).trim();
    else lines.push(w);
  }
  if (lines.length > 2) return [lines[0], lines.slice(1).join(" ")];
  return lines;
}

// One card. All text centered at x=600. Worst-case crop is a CENTER SQUARE
// (630×630) thumbnail, so critical text must stay within ~x 280–920: titles
// wrap early (≤16 chars/line) and shrink when a single word is still long.
function card({ eyebrow, title, sub }) {
  let lines = wrap(title, 16);
  const longest = Math.max(...lines.map((l) => l.length));
  const size = longest > 14 ? 54 : 72;
  const titleY = lines.length === 2 ? 300 : 330;
  const lineHeight = size * 1.14;
  const titleSvg = lines
    .map(
      (l, i) =>
        `<text x="600" y="${titleY + i * lineHeight}" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="${size}" font-weight="800" fill="${INK}">${esc(l)}</text>`,
    )
    .join("\n  ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect x="0" y="0" width="${W}" height="14" fill="${ACCENT}"/>
  <text x="600" y="170" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="30" font-weight="600" letter-spacing="4" fill="${ACCENT}">${esc(eyebrow.toUpperCase())}</text>
  <rect x="540" y="200" width="120" height="5" fill="${ACCENT}"/>
  ${titleSvg}
  <text x="600" y="${lines.length === 2 ? 470 : 430}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="32" fill="${INK_SOFT}">${esc(sub)}</text>
  <line x1="200" y1="524" x2="1000" y2="524" stroke="${LINE}" stroke-width="2"/>
  <text x="600" y="572" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="${INK}">Belgrade<tspan fill="${ACCENT_INK}">Best</tspan><tspan fill="${INK_SOFT}" font-weight="500">.com</tspan></text>
</svg>`;
}

// Same publish rule as lib/listings.ts validListing (keep in sync): claimed
// listings publish on summary+about alone; editorial ones also need facts.
const publishes = (l) => {
  const aboutLen = (l.blocks?.about ?? []).join(" ").length;
  if (l.claimed) return l.name && l.summary && l.summary.length >= 80 && aboutLen >= 200;
  return (
    l.name && l.summary && l.summary.length >= 80 && aboutLen >= 300 && (l.blocks?.facts?.length ?? 0) >= 2
  );
};

const STATUS = {
  announced: "Plans announced",
  tender: "Tender under way",
  construction: "Under construction",
  "concept-only": "Concept reported",
};

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const jobs = [];

  // Published listings.
  for (const f of readdirSync(LISTINGS)) {
    if (!f.endsWith(".json")) continue;
    const l = JSON.parse(readFileSync(join(LISTINGS, f), "utf8"));
    if (!publishes(l)) continue;
    jobs.push({
      out: `pavilion-${l.slug}.png`,
      svg: card({
        eyebrow: "Expo 2027 Belgrade",
        title: l.name,
        sub: `${STATUS[l.status] ?? "Profile"} · sourced`,
      }),
    });
  }

  // Fixed platform pages.
  const participants = JSON.parse(readFileSync(join(ROOT, "src", "data", "expo-participants.json"), "utf8"));
  const fixed = [
    ["tracker", "Expo 2027 Belgrade", "Participant Tracker", `${participants.officialCount.count} confirmed · sourced`],
    ["pavilions", "Expo 2027 Belgrade", "National Pavilions", "Plans by country · sourced"],
    ["corporate-area", "Expo 2027 Belgrade", "The Corporate Area", "~45 pavilions · how to join"],
    ["countdown", "Free embed", "Expo 2027 Countdown", "Two lines of HTML · no tracking"],
    ["for-businesses", "For businesses", "We fight the SEO war for you", "A free page on BelgradeBest"],
  ];
  for (const [slug, eyebrow, title, sub] of fixed) {
    jobs.push({ out: `${slug}.png`, svg: card({ eyebrow, title, sub }) });
  }

  for (const j of jobs) {
    const out = join(OUT_DIR, j.out);
    await sharp(Buffer.from(j.svg)).png().toFile(out);
    console.log(`  ✓ images/og/${j.out} (${Math.round(statSync(out).size / 1024)} KB)`);
  }
  console.log(`Done — ${jobs.length} cards. Rebuild to pick them up.`);
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
