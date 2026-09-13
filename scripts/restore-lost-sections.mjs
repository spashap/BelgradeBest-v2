#!/usr/bin/env node
/**
 * restore-lost-sections.mjs — one-off repair for the 2026-06-22 content loss.
 *
 * WHAT HAPPENED
 * Commit e928564 ("Build /glossary knowledge-pages spoke set") rewrote article
 * bodies and silently dropped whole H2 sections from 17 articles. Two later
 * passes (2026-07-02, 2026-08-07) repaired the ones that ended mid-sentence.
 * The rest end on a clean sentence, so every truncation scan passed them — and
 * they shipped incomplete for three months. `things-to-do-in-belgrade` served
 * 4 of its 10 attractions.
 *
 * WHAT THIS DOES
 * For each article, diffs today's H2 sections against the last good revision
 * (9645a97, 2026-06-21) and re-inserts only the MISSING ones, in their original
 * relative position. Sections that still exist are left exactly as they are, so
 * every legitimate edit since June survives.
 *
 * It never rewrites frontmatter and never touches retained prose.
 *
 * CAVEAT THE OPERATOR MUST HONOUR: restored text is from June 2026. Prices,
 * venues and opening hours in it are UNVERIFIED. The script prints a review
 * list of restored sections containing perishable claims.
 *
 *   node scripts/restore-lost-sections.mjs --dry-run
 *   node scripts/restore-lost-sections.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const BASE = "9645a97"; // last revision before the loss
const DRY = process.argv.includes("--dry-run");

const FILES = `visit-belgrade/understanding-belgrade
visit-belgrade/things-to-do-in-belgrade
visit-belgrade/is-belgrade-worth-visiting
visit-belgrade/belgrade-neighborhoods
visit-belgrade/belgrade-museums
visit-belgrade/belgrade-itinerary-3-days
plan-your-trip/getting-around
food-and-nightlife/vegetarian-and-vegan-belgrade
food-and-nightlife/eating-and-drinking-in-belgrade
food-and-nightlife/best-restaurants-in-belgrade
food-and-nightlife/belgrade-splavovi
food-and-nightlife/belgrade-nightlife
food-and-nightlife/belgrade-kafanas
food-and-nightlife/belgrade-food-and-drink-by-neighborhood
food-and-nightlife/belgrade-craft-beer
food-and-nightlife/belgrade-coffee-culture`.split("\n").map((s) => s.trim());

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const PERISHABLE = /\b\d[\d.,]*\s*(?:€|EUR|RSD|din|dinars?)\b|\b(?:€|EUR|RSD)\s?\d|\bopen(?:s|ing)?\b.*\b\d{1,2}(?::\d{2})?\s?(?:am|pm|h)\b/i;

/** Split a file into { head, sections[] } where head is frontmatter + any intro before the first H2. */
function split(text) {
  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  const fm = m ? m[0] : "";
  const rest = text.slice(fm.length);
  const lines = rest.split(/\r?\n/);
  const intro = [];
  const sections = [];
  let cur = null;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (cur) sections.push(cur);
      cur = { title: line.slice(3).trim(), lines: [line] };
    } else if (cur) cur.lines.push(line);
    else intro.push(line);
  }
  if (cur) sections.push(cur);
  return { head: fm + intro.join("\n"), sections };
}

let totalSections = 0, totalWords = 0, touched = 0;
const review = [];

for (const rel of FILES) {
  const path = `src/content/articles/${rel}.md`;
  const oldText = execFileSync("git", ["show", `${BASE}:${path}`], { encoding: "utf8" });
  const newText = fs.readFileSync(path, "utf8");
  const oldS = split(oldText).sections;
  const cur = split(newText);
  const have = new Set(cur.sections.map((s) => norm(s.title)));

  // Walk the ORIGINAL order; anything missing is re-inserted after the last
  // section that both versions still share, preserving the author's sequence.
  const out = [...cur.sections];
  let restored = 0;
  for (let i = 0; i < oldS.length; i++) {
    const sec = oldS[i];
    if (have.has(norm(sec.title))) continue;
    let anchor = -1;
    for (let j = i - 1; j >= 0; j--) {
      const k = out.findIndex((s) => norm(s.title) === norm(oldS[j].title));
      if (k !== -1) { anchor = k; break; }
    }
    out.splice(anchor + 1, 0, sec);
    have.add(norm(sec.title));
    restored++;
    const words = sec.lines.join(" ").split(/\s+/).filter(Boolean).length;
    totalWords += words;
    if (PERISHABLE.test(sec.lines.join("\n"))) review.push(`${rel} → "${sec.title}"`);
  }
  if (!restored) continue;
  totalSections += restored;
  touched++;
  const body = out.map((s) => s.lines.join("\n").replace(/\s+$/, "")).join("\n\n");
  const final = `${cur.head.replace(/\s+$/, "")}\n\n${body}\n`;
  console.log(`${restored === 0 ? " " : "+"} ${rel.padEnd(52)} restored ${restored} section(s)`);
  if (!DRY) fs.writeFileSync(path, final);
}

console.log(`\n${DRY ? "WOULD RESTORE" : "RESTORED"}: ${totalSections} sections, ~${totalWords} words, across ${touched} articles.`);
if (review.length) {
  console.log(`\n!! ${review.length} restored section(s) contain prices or opening hours from June 2026 — VERIFY BEFORE TRUSTING:`);
  for (const r of review) console.log("   " + r);
}
