#!/usr/bin/env node
/**
 * build-plugin.mjs — builds the WordPress.org upload zip for
 * "BelgradeBest Countdown for Expo 2027 Belgrade".
 *
 *   node wp-plugin/build-plugin.mjs           copy labels + write wp-plugin/dist/<slug>.zip
 *   node wp-plugin/build-plugin.mjs --check   exit 1 if the plugin's labels.json is stale
 *
 * The countdown labels have ONE master: src/data/countdown-labels.json (the
 * site's /widgets/expo-countdown.js is built from it too). This script copies
 * it into the plugin as includes/labels.json, so the plugin and the site can't
 * disagree. Nothing in wp-plugin/ is deployed to Vercel (.vercelignore).
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SLUG = "belgradebest-countdown-for-expo-2027-belgrade";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const master = path.join(root, "src", "data", "countdown-labels.json");
const pluginDir = path.join(here, SLUG);
const target = path.join(pluginDir, "includes", "labels.json");

const src = JSON.parse(fs.readFileSync(master, "utf8"));
const { _readme, ...data } = src; // the plugin needs the data, not our notes
const next = JSON.stringify(data, null, 2) + "\n";
const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";

if (process.argv.includes("--check")) {
  if (current !== next) {
    console.error(`STALE: ${path.relative(root, target)} differs from src/data/countdown-labels.json — run node wp-plugin/build-plugin.mjs`);
    process.exit(1);
  }
  console.log("labels.json is in sync.");
  process.exit(0);
}

if (current !== next) {
  fs.writeFileSync(target, next);
  console.log(`Updated ${path.relative(root, target)}`);
}

// Version must agree in the three places WordPress reads it.
const php = fs.readFileSync(path.join(pluginDir, `${SLUG}.php`), "utf8");
const readme = fs.readFileSync(path.join(pluginDir, "readme.txt"), "utf8");
const block = JSON.parse(fs.readFileSync(path.join(pluginDir, "blocks", "countdown", "block.json"), "utf8"));
const vHeader = php.match(/^\s*\*\s*Version:\s*(\S+)/m)?.[1];
const vConst = php.match(/BBEXPO_COUNTDOWN_VERSION',\s*'([^']+)'/)?.[1];
const vStable = readme.match(/^Stable tag:\s*(\S+)/m)?.[1];
const versions = { header: vHeader, constant: vConst, "readme Stable tag": vStable, "block.json": block.version };
if (new Set(Object.values(versions)).size !== 1) {
  console.error("Version mismatch:", versions);
  process.exit(1);
}

const distDir = path.join(here, "dist");
fs.mkdirSync(distDir, { recursive: true });
const zip = path.join(distDir, `${SLUG}.zip`);
if (fs.existsSync(zip)) fs.rmSync(zip);
// bsdtar (Windows 10+ tar.exe, macOS, most Linux) writes a zip with forward
// slashes when the name ends in .zip; PowerShell 5's Compress-Archive does not.
const r = spawnSync("tar", ["-a", "-c", "-f", zip, "-C", here, SLUG], { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(`Built ${path.relative(root, zip)} (v${vHeader}, ${fs.statSync(zip).size} bytes)`);
