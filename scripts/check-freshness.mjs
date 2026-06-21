// check-freshness.mjs — Flag articles whose perishable facts may be going stale.
//
// Read-only. Scans every article for (a) age since `lastUpdated` and (b) markers
// of time-sensitive content (prices/currency, rates, explicit years, clock times,
// "as of / currently" phrasing). Produces a ranked review list so the freshness
// moat is maintained without manually re-reading the whole site.
//
// Outputs:
//   • KB/automation/freshness-report.md   (always)
//   • GitHub Actions step summary          (when run in CI)
//   • a webhook POST                       (if FRESHNESS_WEBHOOK_URL is set — Slack/Discord-style {text})
//
// Designed to run UNATTENDED in the cloud (GitHub Actions, see
// .github/workflows/freshness.yml) — your PC does not need to be on. Uses only
// Node built-ins (no install).
//
// Usage: node scripts/check-freshness.mjs [--months 9] [--top 20]
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ART_DIR = join(ROOT, "src", "content", "articles");
const REPORT = join(ROOT, "KB", "automation", "freshness-report.md");

function parseArgs(argv) {
  const a = { months: 9, top: 20 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--months") a.months = parseInt(argv[++i], 10) || 9;
    else if (argv[i] === "--top") a.top = parseInt(argv[++i], 10) || 20;
  }
  return a;
}

// Perishable-content markers — each (label, regex). Tuned to catch facts that
// drift (money, rates, years, hours, "as of") without flagging ordinary prose.
const MARKERS = [
  ["price/currency", /(\bRSD\b|\bдин\b|\bdinars?\b|€|\bEUR\b|\beuros?\b|\$)/gi],
  ["rate (per night/month/day)", /\b(per|a)\s+(night|month|day|person)\b|\/(night|month|day)\b/gi],
  ["year reference", /\b20(2[4-9]|3\d)\b/g],
  ["clock time / hours", /\b\d{1,2}[:.]\d{2}\b/g],
  ["time-relative phrasing", /\b(as of|currently|at the time of writing|right now|these days|recently)\b/gi],
];

function splitFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { fm: "", body: raw };
  return { fm: m[1], body: raw.slice(m[0].length) };
}
const field = (fm, name) => {
  const m = fm.match(new RegExp(`^${name}:\\s*(.+)$`, "m"));
  if (!m) return undefined;
  return m[1].trim().replace(/^["']|["']$/g, "");
};

function monthsSince(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
}

function scan(body) {
  const hits = [];
  let total = 0;
  for (const [label, re] of MARKERS) {
    const found = body.match(re);
    if (found && found.length) {
      total += found.length;
      const sample = [...new Set(found.map((s) => s.trim()))].slice(0, 4).join(", ");
      hits.push(`${label} (${found.length}): ${sample}`);
    }
  }
  return { total, hits };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rows = [];
  for (const leg of readdirSync(ART_DIR)) {
    const legDir = join(ART_DIR, leg);
    if (!statSync(legDir).isDirectory()) continue;
    for (const f of readdirSync(legDir)) {
      if (!f.endsWith(".md")) continue;
      const raw = readFileSync(join(legDir, f), "utf8");
      const { fm, body } = splitFrontmatter(raw);
      const id = `${leg}/${f.replace(/\.md$/, "")}`;
      const lastUpdated = field(fm, "lastUpdated") || "";
      const months = monthsSince(lastUpdated);
      const { total, hits } = scan(body);
      const stale = months !== null && months >= args.months;
      // Priority: stale-by-age first, then by perishable density, then oldest.
      const priority = (stale ? 1000 : 0) + total * 5 + (months ?? 0);
      rows.push({ id, lastUpdated, months, total, hits, stale, priority });
    }
  }
  rows.sort((a, b) => b.priority - a.priority);

  const staleCount = rows.filter((r) => r.stale).length;
  const now = new Date().toISOString().slice(0, 10);
  const out = [];
  out.push("# Content freshness report");
  out.push("");
  out.push(`Generated ${now}. Staleness threshold: **${args.months} months** since \`lastUpdated\`.`);
  out.push("");
  out.push(`${rows.length} articles scanned · **${staleCount} past the age threshold** · ranked by review priority (stale age + perishable-fact density).`);
  out.push("");
  out.push("| Article | Last updated | Age (mo) | Perishable hits | Flags |");
  out.push("|---|---|--:|--:|---|");
  for (const r of rows.slice(0, args.top)) {
    const age = r.months === null ? "?" : r.months.toFixed(1);
    out.push(`| \`${r.id}\` | ${r.lastUpdated || "—"} | ${age} | ${r.total} | ${r.stale ? "**STALE (age)**" : ""} |`);
  }
  out.push("");
  out.push("## Why each was flagged (top items)");
  out.push("");
  for (const r of rows.slice(0, args.top)) {
    if (r.total === 0 && !r.stale) continue;
    out.push(`- **${r.id}** — ${r.stale ? `stale by age (${r.months.toFixed(1)} mo); ` : ""}${r.hits.join("; ") || "no perishable markers"}`);
  }
  out.push("");
  const report = out.join("\n");

  mkdirSync(dirname(REPORT), { recursive: true });
  writeFileSync(REPORT, report);
  console.log(`Wrote ${REPORT} — ${staleCount} stale-by-age of ${rows.length} scanned.`);

  // GitHub Actions: surface in the run summary (no commit needed).
  if (process.env.GITHUB_STEP_SUMMARY) {
    try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + "\n"); } catch {}
  }

  // Optional webhook digest (Slack/Discord accept {text} / {content}).
  const hook = process.env.FRESHNESS_WEBHOOK_URL;
  if (hook) {
    const top = rows.slice(0, 8).filter((r) => r.stale || r.total > 0)
      .map((r) => `• ${r.id} (${r.months === null ? "?" : r.months.toFixed(0)}mo, ${r.total} hits)`).join("\n");
    const text = `BelgradeBest freshness — ${staleCount} stale of ${rows.length}.\n${top}`;
    fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, content: text }),
    }).then((r) => console.log(`webhook → ${r.status}`)).catch((e) => console.warn(`webhook failed: ${e.message}`));
  }
}

main();
