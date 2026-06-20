// gen-hero.mjs — Generate an article hero image (OpenAI) + optimized hero/thumb.
//
// Rebuilds the old project's hero capability, improved: one generation produces
// BOTH a 21:9 hero WebP and a small 16:9 thumbnail WebP, so cards no longer load
// the full-size hero. Runs on the OWNER's machine (needs network + OPENAI_API_KEY
// in .env). NOT deployed (scripts/ is .vercelignore'd).
//
// Usage:
//   node scripts/gen-hero.mjs <slug> "<scene description>" [options]
// Options:
//   --leg <leg>        (informational only; heroes live in the flat expo-2027 dir)
//   --model <id>       image model (default: env OPENAI_IMAGE_MODEL or "gpt-image-1")
//   --quality <q>      low|medium|high|auto (default: high)
//   --keep-src         also save the raw full-res PNG to heroes-src/<slug>.png
//   --force            overwrite existing files without asking
//
// Example:
//   node scripts/gen-hero.mjs belgrade-nightlife \
//     "Belgrade riverfront at night, neon-lit splav clubs reflected on the Sava, cinematic"
//
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "images", "expo-2027"); // flat hero dir (locked convention)

// ---- locked house style appended to every scene prompt ----
const STYLE =
  "Cinematic editorial travel photography, ultra-wide 21:9 establishing shot. " +
  "Warm filmic color grade, soft natural light (golden hour or blue hour), gentle film grain, " +
  "rich but realistic detail, shallow atmosphere and depth. Authentic Belgrade, Serbia. " +
  "No text, no letters, no logos, no watermark, no captions. No prominent posed faces. " +
  "Photorealistic, premium magazine quality.";

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--keep-src") a.keepSrc = true;
    else if (t === "--force") a.force = true;
    else if (t === "--leg") a.leg = argv[++i];
    else if (t === "--model") a.model = argv[++i];
    else if (t === "--quality") a.quality = argv[++i];
    else a._.push(t);
  }
  return a;
}

function loadKey() {
  const envPath = join(ROOT, ".env");
  if (!existsSync(envPath)) throw new Error("No .env found at repo root.");
  const env = readFileSync(envPath, "utf8");
  const key = (env.match(/^OPENAI_API_KEY=(.+)$/m) || [])[1]?.trim();
  if (!key) throw new Error("OPENAI_API_KEY not set in .env.");
  const model = (env.match(/^OPENAI_IMAGE_MODEL=(.+)$/m) || [])[1]?.trim();
  return { key, model };
}

async function generate(prompt, key, model, quality) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, size: "1536x1024", quality, n: 1 }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI image API ${res.status}: ${txt.slice(0, 500)}`);
  }
  const json = await res.json();
  const d = json.data?.[0];
  if (d?.b64_json) return Buffer.from(d.b64_json, "base64");
  if (d?.url) {
    const img = await fetch(d.url);
    return Buffer.from(await img.arrayBuffer());
  }
  throw new Error("No image returned by the API.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [slug, scene] = args._;
  if (!slug || !scene) {
    console.error('Usage: node scripts/gen-hero.mjs <slug> "<scene description>" [--leg x] [--model id] [--quality high] [--keep-src] [--force]');
    process.exit(1);
  }
  const heroPath = join(OUT_DIR, `${slug}-hero.webp`);
  const thumbPath = join(OUT_DIR, `${slug}-thumb.webp`);
  if (!args.force && (existsSync(heroPath) || existsSync(thumbPath))) {
    console.error(`Hero/thumb for "${slug}" already exist. Re-run with --force to overwrite.`);
    process.exit(1);
  }

  const { key, model: envModel } = loadKey();
  const model = args.model || envModel || "gpt-image-1";
  const quality = args.quality || "high";
  const prompt = `${scene}. ${STYLE}`;

  console.log(`Generating hero for "${slug}" with ${model} (${quality})…`);
  const raw = await generate(prompt, key, model, quality);

  mkdirSync(OUT_DIR, { recursive: true });
  if (args.keepSrc) {
    const srcDir = join(ROOT, "heroes-src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, `${slug}.png`), raw);
  }

  // 21:9 hero (1600x686) + 16:9 thumb (640x360), center-cropped to salient area.
  await sharp(raw).resize(1600, 686, { fit: "cover", position: "attention" }).webp({ quality: 80 }).toFile(heroPath);
  await sharp(raw).resize(640, 360, { fit: "cover", position: "attention" }).webp({ quality: 72 }).toFile(thumbPath);

  const { statSync } = await import("node:fs");
  const kb = (p) => Math.round(statSync(p).size / 1024) + " KB";
  console.log(`  ✓ ${slug}-hero.webp  (${kb(heroPath)})`);
  console.log(`  ✓ ${slug}-thumb.webp (${kb(thumbPath)})`);
  console.log("Done. Rebuild the site to pick up the new images.");
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  if (/model/i.test(e.message)) {
    console.error("\nThe image model name may have changed. Set the current one in .env as");
    console.error("OPENAI_IMAGE_MODEL=<id>, or pass --model <id>.");
  }
  process.exit(1);
});
