// optimize-heroes.mjs — One-time (re-runnable) optimizer for existing heroes.
//
// Converts the heavy ~2.5 MB hero PNGs into light WebP heroes (21:9) + small WebP
// thumbnails (16:9), so cards/read-next stop loading full-size heroes. No network
// needed — pure sharp. Safe + idempotent: keeps the original PNGs (fallback) unless
// --delete-png is passed; skips files whose WebP is already newer unless --force.
//
// Usage:
//   node scripts/optimize-heroes.mjs            # convert all, keep PNGs
//   node scripts/optimize-heroes.mjs --force    # rebuild even if up to date
//   node scripts/optimize-heroes.mjs --delete-png   # remove PNGs after converting
//
import { readdirSync, statSync, existsSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SLUG_DIR = join(ROOT, "public", "images", "expo-2027"); // per-slug heroes (flat)
const LEGS_DIR = join(ROOT, "public", "images", "legs"); // per-leg heroes

const args = new Set(process.argv.slice(2));
const FORCE = args.has("--force");
const DELETE_PNG = args.has("--delete-png");

const kb = (p) => (existsSync(p) ? Math.round(statSync(p).size / 1024) : 0);
const newer = (a, b) => existsSync(a) && existsSync(b) && statSync(a).mtimeMs >= statSync(b).mtimeMs;

let before = 0;
let after = 0;
let count = 0;

async function convert(pngPath, heroOut, thumbOut, makeThumb) {
  if (!FORCE && newer(heroOut, pngPath) && (!makeThumb || newer(thumbOut, pngPath))) {
    return false; // up to date
  }
  before += kb(pngPath);
  await sharp(pngPath).resize(1600, 686, { fit: "cover", position: "attention" }).webp({ quality: 80 }).toFile(heroOut);
  after += kb(heroOut);
  if (makeThumb) {
    await sharp(pngPath).resize(640, 360, { fit: "cover", position: "attention" }).webp({ quality: 72 }).toFile(thumbOut);
    after += kb(thumbOut);
  }
  if (DELETE_PNG) unlinkSync(pngPath);
  count++;
  return true;
}

// 1) Per-slug heroes: <slug>-hero.png -> <slug>-hero.webp + <slug>-thumb.webp
if (existsSync(SLUG_DIR)) {
  for (const f of readdirSync(SLUG_DIR)) {
    if (!f.endsWith("-hero.png")) continue;
    const slug = f.replace(/-hero\.png$/, "");
    const did = await convert(
      join(SLUG_DIR, f),
      join(SLUG_DIR, `${slug}-hero.webp`),
      join(SLUG_DIR, `${slug}-thumb.webp`),
      true,
    );
    if (did) console.log(`  ✓ ${slug}`);
  }
}

// 2) Per-leg heroes: legs/<leg>/hero.png -> legs/<leg>/hero.webp + legs/<leg>/thumb.webp
//    (thumb is used by the homepage leg cards so they don't load the full hero).
if (existsSync(LEGS_DIR)) {
  for (const leg of readdirSync(LEGS_DIR)) {
    const png = join(LEGS_DIR, leg, "hero.png");
    if (!existsSync(png)) continue;
    const did = await convert(png, join(LEGS_DIR, leg, "hero.webp"), join(LEGS_DIR, leg, "thumb.webp"), true);
    if (did) console.log(`  ✓ legs/${leg}`);
  }
}

console.log(
  `\nConverted ${count} image set(s). Source PNG ${before} KB -> WebP ${after} KB` +
    (before ? ` (${Math.round((1 - after / before) * 100)}% smaller).` : "."),
);
console.log(DELETE_PNG ? "Original PNGs deleted." : "Original PNGs kept as fallback.");
