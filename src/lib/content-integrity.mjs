// Content integrity guard — runs at BUILD START and fails the build.
//
// WHY THIS EXISTS
// On 2026-06-22 commit e928564 silently dropped whole H2 sections from 17
// articles. Two repair passes (07-02, 08-07) fixed only the ones that ended
// mid-sentence; the rest ended on a clean full stop and passed every scan.
// They shipped incomplete for three months — /visit-belgrade/things-to-do-in-
// belgrade served 4 of its 10 attractions.
//
// THE LESSON THAT SHAPES THIS FILE: **a punctuation check cannot prove
// completeness.** A section can vanish and leave a perfectly well-formed page.
// So this guard runs two independent checks:
//
//   1. DAMAGE  — the body ends without terminal punctuation, or contains a
//      heading/link fragment. Catches mid-word truncation.
//   2. SHRINKAGE — the body is materially smaller than the last accepted size
//      recorded in src/data/content-integrity.json. Catches silent section
//      loss, which check 1 cannot see.
//
// Shrinking an article on purpose is fine — you just have to SAY so, by
// re-recording the baseline:
//
//     node scripts/update-content-baseline.mjs
//
// That makes deletion a deliberate, reviewable act instead of an accident.
//
// Lives in src/lib (NOT scripts/, which is .vercelignore'd) so it is present
// in the deployed build and the gate actually runs on Vercel.

import fs from "node:fs";
import path from "node:path";

export const CONTENT_DIRS = ["src/content/articles", "src/content/de"];
export const BASELINE = "src/data/content-integrity.json";

/** How much an article may shrink before the build refuses it. */
const SHRINK_TOLERANCE = 0.1; // 10%

// A body may legitimately end on these. Includes German quotes („…“) and list pipes.
const ENDS_OK = /[.!?:;)\]»"'”“*_`|-]$|^\|.*\|$/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".md")) out.push(p.replace(/\\/g, "/"));
  }
  return out;
}

export function articleFiles() {
  return CONTENT_DIRS.flatMap((d) => walk(d)).sort();
}

/** Body = everything after the frontmatter block. */
export function bodyOf(text) {
  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  return (m ? text.slice(m[0].length) : text).trim();
}

export const wordCount = (body) => (body.match(/\S+/g) || []).length;

/** Check 1 — visible damage. */
function damageOf(body) {
  const problems = [];
  const lines = body.split(/\r?\n/).filter((l) => l.trim());
  const last = lines[lines.length - 1]?.trim() ?? "";
  if (last && !ENDS_OK.test(last)) {
    problems.push(`body ends mid-sentence: ${JSON.stringify(last.slice(-60))}`);
  }
  // A SHORT heading is fine ("## Skadarlija", "### Oncology"). The truncation
  // signature is a heading with NOTHING after it — that is what the June loss
  // left behind ("## Are the" as the final line) — or one that trails off on a
  // dangling function word.
  if (/^#{2,4}\s/.test(last)) {
    problems.push(`ends on a heading with no content: ${JSON.stringify(last)}`);
  } else if (/\b(?:the|a|an|and|or|of|to|in|for|with|is|are|at|on)$/i.test(last)) {
    problems.push(`ends on a dangling word: ${JSON.stringify(last.slice(-60))}`);
  }

  for (const l of lines) {
    const t = l.trim();
    if (/\]\($/.test(t) || /\[[^\]]*\]\([^)]*$/.test(t)) {
      problems.push(`unclosed link: ${JSON.stringify(t.slice(-50))}`);
    }
  }
  return problems;
}

/** Run both checks. Returns [] when the corpus is healthy. */
export function checkContentIntegrity({ baselinePath = BASELINE } = {}) {
  const failures = [];
  // A missing baseline used to make this check silently vacuous — the guard
  // would pass while checking nothing. Absence is now a failure: the file is
  // committed, so if it is gone something is wrong.
  if (!fs.existsSync(baselinePath)) {
    return [{ file: baselinePath, kind: "baseline", detail: "baseline missing — run `node scripts/update-content-baseline.mjs` and commit it" }];
  }
  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8")).articles ?? {};

  for (const file of articleFiles()) {
    const body = bodyOf(fs.readFileSync(file, "utf8"));
    // An emptied body is the most complete loss there is; it must not be skipped.
    if (!body) {
      failures.push({ file, kind: "damage", detail: "article body is empty" });
      continue;
    }

    for (const p of damageOf(body)) failures.push({ file, kind: "damage", detail: p });

    const words = wordCount(body);
    const expected = baseline[file];
    if (typeof expected === "number") {
      const floor = Math.floor(expected * (1 - SHRINK_TOLERANCE));
      if (words < floor) {
        failures.push({
          file,
          kind: "shrinkage",
          detail: `${words} words, expected at least ${floor} (baseline ${expected}, −${Math.round((1 - words / expected) * 100)}%)`,
        });
      }
    }
  }

  // A file in the baseline that no longer exists is either a deliberate removal
  // (re-baseline and commit it) or a deletion nobody noticed.
  const present = new Set(articleFiles());
  for (const file of Object.keys(baseline)) {
    if (!present.has(file)) {
      failures.push({ file, kind: "missing", detail: "in the baseline but not on disk — re-baseline if the removal was intended" });
    }
  }
  return failures;
}

export function currentBaseline() {
  const articles = {};
  for (const file of articleFiles()) {
    const body = bodyOf(fs.readFileSync(file, "utf8"));
    if (body) articles[file] = wordCount(body);
  }
  return { updated: new Date().toISOString().slice(0, 10), tolerance: SHRINK_TOLERANCE, articles };
}
