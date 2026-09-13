#!/usr/bin/env node
/**
 * update-content-baseline.mjs — re-record the article size baseline that the
 * build-time content integrity guard checks against (src/lib/content-integrity.mjs).
 *
 * Run this ONLY when you have deliberately shortened or removed article
 * content and reviewed the diff. That is the whole point: shrinking an article
 * should be an explicit, committed act, because the June 2026 content loss
 * reached production precisely because nothing forced anyone to notice.
 *
 *   node scripts/update-content-baseline.mjs
 */
import fs from "node:fs";
import { currentBaseline, BASELINE, checkContentIntegrity } from "../src/lib/content-integrity.mjs";

const damage = checkContentIntegrity().filter((f) => f.kind === "damage");
if (damage.length) {
  console.error("Refusing to re-baseline: visible content damage is present.\n");
  for (const d of damage) console.error(`  ${d.file}\n    ${d.detail}`);
  console.error("\nFix the damage first, then re-run.");
  process.exit(1);
}
const next = currentBaseline();
fs.writeFileSync(BASELINE, JSON.stringify(next, null, 2) + "\n");
console.log(`Baseline recorded for ${Object.keys(next.articles).length} articles → ${BASELINE}`);
