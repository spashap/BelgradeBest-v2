// gen-all-heroes.mjs — generate every where-to-stay hero in one run.
// Calls scripts/gen-hero.mjs once per article, sequentially, reusing its exact
// pipeline (OpenAI -> sharp -> optimized hero.webp + thumb.webp). Prompts live
// here as JS strings so Windows code pages never mangle the Serbian characters.
//
// Run via scripts/generate-heroes.bat (double-click) or: node scripts/gen-all-heroes.mjs
// Pass --force to overwrite existing images:           node scripts/gen-all-heroes.mjs --force
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const genHero = join(here, "gen-hero.mjs");
const extraFlags = process.argv.slice(2); // e.g. --force, --model <id>

const heroes = [
  ["where-to-stay-in-belgrade", "Belgrade rooftops at golden hour where the Sava meets the Danube, old-town roofs and New Belgrade towers, warm editorial travel photo"],
  ["where-to-stay-in-belgrade-first-time", "A cosy boutique hotel-room window overlooking Stari Grad rooftops and the Knez Mihailova promenade, soft morning light"],
  ["where-to-stay-in-belgrade-with-family", "A bright, spacious modern Belgrade apartment living room with a leafy park view, warm and family-friendly daylight"],
  ["where-to-stay-in-belgrade-for-nightlife", "A Belgrade apartment balcony at night above the Savamala riverfront, city and club lights glowing below, moody warm tones"],
  ["where-to-stay-in-belgrade-for-business", "Modern New Belgrade business-hotel glass towers along a wide boulevard at blue hour, polished and professional"],
  ["belgrade-old-town-vs-new-belgrade", "Belgrade across the Sava — historic Stari Grad rooftops facing New Belgrade's modern towers, golden hour"],
  ["dorcol-vs-vracar-where-to-stay", "A leafy central Belgrade residential street with cafe terraces, Dorcol and Vracar character, warm afternoon light"],
  ["stari-grad-vs-zemun-belgrade", "Zemun's Gardos tower and Danube quay with old-town Belgrade beyond the river, golden hour"],
  ["belgrade-hotels-vs-apartments", "A warm Belgrade hotel reception desk and a serviced-apartment key handover, inviting interior, no faces"],
  ["belgrade-non-smoking-hotels-apartments", "A fresh, airy, light-filled non-smoking Belgrade hotel room with an open window and plants, clean and calm"],
];

let ok = 0;
const failed = [];
for (let i = 0; i < heroes.length; i++) {
  const [slug, scene] = heroes[i];
  console.log(`\n=== [${i + 1}/${heroes.length}] ${slug} ===`);
  const r = spawnSync(process.execPath, [genHero, slug, scene, ...extraFlags], { stdio: "inherit" });
  if (r.status === 0) ok++;
  else failed.push(slug);
}

console.log(`\n──────────────────────────────`);
console.log(`Done: ${ok}/${heroes.length} heroes generated.`);
if (failed.length) {
  console.log(`Failed: ${failed.join(", ")}`);
  console.log(`(Tip: re-run with --force to overwrite, or check OPENAI_API_KEY / OPENAI_IMAGE_MODEL in .env.)`);
}
process.exit(failed.length ? 1 : 0);
