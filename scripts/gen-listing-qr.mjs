// gen-listing-qr.mjs — QR codes for every PUBLISHED listing page (the
// business toolkit: table stickers, flyers, menus → their BelgradeBest page).
// Writes public/images/qr/<leg>--<slug>.svg (brand-inked, quiet-zone kept).
//
// Owner-run (uses the repo's qrcode dev-dependency), NOT deployed. Idempotent.
//   node scripts/gen-listing-qr.mjs
// Re-run after new listings publish (mentioned in the manage portal + admin).
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LISTINGS = join(ROOT, "src", "data", "listings");
const OUT_DIR = join(ROOT, "public", "images", "qr");
const ORIGIN = "https://belgradebest.com";
const SECTION = { "expo-2027": "pavilions" }; // mirror lib/listings.ts

const INK = "#211b16";
const PAPER = "#ffffff"; // print-safe white (not paper cream — scanners first)

// Same publish rule as lib/listings.ts validListing (keep in sync).
const publishes = (l) => {
  const aboutLen = (l.blocks?.about ?? []).join(" ").length;
  if (l.claimed) return l.name && l.summary && l.summary.length >= 80 && aboutLen >= 200;
  return l.name && l.summary && l.summary.length >= 80 && aboutLen >= 300 && (l.blocks?.facts?.length ?? 0) >= 2;
};

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  let n = 0;
  for (const leg of readdirSync(LISTINGS)) {
    const dir = join(LISTINGS, leg);
    const section = SECTION[leg] ?? "places";
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      const l = JSON.parse(readFileSync(join(dir, f), "utf8"));
      if (!publishes(l)) continue;
      const path = l.parent ? `/${leg}/${section}/${l.parent}/${l.slug}` : `/${leg}/${section}/${l.slug}`;
      const url = `${ORIGIN}${path}?utm_source=qr`;
      const svg = await QRCode.toString(url, {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 2,
        color: { dark: INK, light: PAPER },
      });
      writeFileSync(join(OUT_DIR, `${leg}--${l.slug}.svg`), svg);
      n++;
    }
  }
  console.log(`Done — ${n} QR codes in public/images/qr/ (rebuild to ship).`);
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
