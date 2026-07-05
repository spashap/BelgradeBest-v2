#!/usr/bin/env node
// Site version bumper — single source: src/data/version.json (displayed via
// src/lib/version.ts in the public footer + admin dashboard).
//
//   node scripts/bump-version.mjs          minor +1            V01.001 -> V01.002
//   node scripts/bump-version.mjs --major  major +1, minor=001 V01.007 -> V02.001
//
// push-to-git.bat runs the minor bump automatically before every push (skipped
// when the working tree is clean). The major bump is a manual owner command.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "version.json");
const v = JSON.parse(readFileSync(FILE, "utf8"));

if (process.argv.includes("--major")) {
  v.major += 1;
  v.minor = 1;
} else {
  v.minor += 1;
}

writeFileSync(FILE, JSON.stringify(v, null, 2) + "\n");
console.log(`Site version -> V${String(v.major).padStart(2, "0")}.${String(v.minor).padStart(3, "0")}`);
