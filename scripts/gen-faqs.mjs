// gen-faqs.mjs — Generate answer-first FAQ pairs for articles (AEO).
//
// Rich FAQ blocks are the cheapest way to win Google "People also ask" / AI
// Overviews and to get quoted by answer engines (ChatGPT/Perplexity). The
// article's `faqs` frontmatter already flows to FAQPage JSON-LD via
// ArticleLayout, so this script just fills that field — grounded ONLY in the
// article body (+ its KB sources file when present), preserving the guide's
// confirmed/reported/unknown hedging and never inventing perishable numbers.
//
// Needs OPENAI_API_KEY in .env (optional OPENAI_TEXT_MODEL). Runs on the owner's
// machine; NOT deployed.
//
// Usage:
//   node scripts/gen-faqs.mjs                       # fill every article that has NO faqs
//   node scripts/gen-faqs.mjs plan-your-trip/money  # one or more "leg/slug" targets
//   node scripts/gen-faqs.mjs all --force           # regenerate ALL (replaces existing)
//   node scripts/gen-faqs.mjs all --augment         # ADD new Q/As, keep existing verbatim
// Options: --count <n> (default 6), --model <id>, --dry-run
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ART_DIR = join(ROOT, "src", "content", "articles");
const KB_DIR = join(ROOT, "KB");

function loadKey() {
  const envPath = join(ROOT, ".env");
  if (!existsSync(envPath)) throw new Error("No .env found at repo root.");
  const env = readFileSync(envPath, "utf8");
  const key = (env.match(/^OPENAI_API_KEY=(.+)$/m) || [])[1]?.trim();
  if (!key) throw new Error("OPENAI_API_KEY not set in .env.");
  const model = (env.match(/^OPENAI_TEXT_MODEL=(.+)$/m) || [])[1]?.trim();
  return { key, model };
}

function parseArgs(argv) {
  const a = { _: [], count: 6, force: false, augment: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--force") a.force = true;
    else if (t === "--augment") a.augment = true;
    else if (t === "--dry-run") a.dryRun = true;
    else if (t === "--count") a.count = parseInt(argv[++i], 10) || 6;
    else if (t === "--model") a.model = argv[++i];
    else a._.push(t);
  }
  return a;
}

// Split "---\n<fm>\n---\n<body>" → { ok, fm, body }.
function splitFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { ok: false };
  return { ok: true, fm: m[1], body: raw.slice(m[0].length) };
}

// Existing FAQ questions (best-effort, for the skip check + --augment dedupe).
function existingQuestions(fm) {
  const out = [];
  const re = /^\s+question:\s*(.+)$/gm;
  let m;
  while ((m = re.exec(fm))) {
    let v = m[1].trim();
    try { v = JSON.parse(v); } catch { v = v.replace(/^["']|["']$/g, ""); }
    out.push(String(v));
  }
  return out;
}

// Remove an existing top-level `faqs:` block (handles `faqs: []` and multi-line).
function stripFaqs(fm) {
  const lines = fm.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    if (/^faqs:/.test(lines[i])) {
      i++;
      while (i < lines.length && /^\s/.test(lines[i]) && lines[i].trim() !== "") i++;
      continue;
    }
    out.push(lines[i]);
    i++;
  }
  return out.join("\n").replace(/\n+$/, "");
}

function faqsToYaml(faqs) {
  const lines = ["faqs:"];
  for (const f of faqs) {
    lines.push(`  - question: ${JSON.stringify(String(f.question))}`);
    lines.push(`    answer: ${JSON.stringify(String(f.answer))}`);
  }
  return lines.join("\n");
}

function listAllTargets() {
  const out = [];
  for (const leg of readdirSync(ART_DIR)) {
    const legDir = join(ART_DIR, leg);
    if (!statSync(legDir).isDirectory()) continue;
    for (const f of readdirSync(legDir)) {
      if (f.endsWith(".md")) out.push(`${leg}/${f.replace(/\.md$/, "")}`);
    }
  }
  return out;
}

async function generate(body, kb, title, count, key, model) {
  const sys =
    "You write FAQ pairs for a travel guide to Belgrade. Rules: (1) answer-first — " +
    "the first sentence directly answers the question; (2) ground every answer ONLY in " +
    "the provided article text and notes — do not add facts that are not supported; " +
    "(3) preserve hedging: if the source marks something reported/unknown or time-sensitive, " +
    "keep that nuance; do NOT invent specific prices, hours, or dates; (4) phrase questions " +
    "the way real travellers search (natural language); (5) 2–4 sentences per answer. " +
    'Return strict JSON: {"faqs":[{"question":"...","answer":"..."}]}.';
  const user =
    `Article title: ${title}\n\n` +
    (kb ? `KNOWLEDGE-BASE NOTES (authoritative; may carry confirmed/reported/unknown labels):\n${kb.slice(0, 6000)}\n\n` : "") +
    `ARTICLE BODY:\n${body.slice(0, 12000)}\n\n` +
    `Produce ${count} FAQ pairs.`;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const json = await res.json();
  const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
  const faqs = Array.isArray(parsed.faqs) ? parsed.faqs : [];
  return faqs
    .filter((f) => f && f.question && f.answer)
    .map((f) => ({ question: String(f.question).trim(), answer: String(f.answer).trim() }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { key, model: envModel } = loadKey();
  const model = args.model || envModel || "gpt-4o-mini";

  let targets = args._.filter((t) => t !== "all");
  if (targets.length === 0) targets = listAllTargets();

  let wrote = 0, skipped = 0, failed = 0;
  for (const id of targets) {
    const file = join(ART_DIR, `${id}.md`);
    if (!existsSync(file)) { console.warn(`! missing: ${id}`); failed++; continue; }
    const parts = splitFrontmatter(readFileSync(file, "utf8"));
    if (!parts.ok) { console.warn(`! no frontmatter: ${id}`); failed++; continue; }

    const prior = existingQuestions(parts.fm);
    const hasFaqs = prior.length > 0;
    if (hasFaqs && !args.force && !args.augment) { skipped++; continue; }

    const title = (parts.fm.match(/^title:\s*(.+)$/m) || [])[1]?.replace(/^["']|["']$/g, "") || id;
    const kbFile = join(KB_DIR, `${id}.sources.md`);
    const kb = existsSync(kbFile) ? readFileSync(kbFile, "utf8") : "";

    try {
      const gen = await generate(parts.body, kb, title, args.count, key, model);
      if (gen.length === 0) { console.warn(`! no faqs returned: ${id}`); failed++; continue; }

      let newFm;
      let label;
      if (args.augment && hasFaqs) {
        const have = new Set(prior.map((q) => q.toLowerCase()));
        const added = gen.filter((f) => !have.has(f.question.toLowerCase()));
        if (added.length === 0) { skipped++; continue; }
        newFm = appendToFaqs(parts.fm, added); // keeps existing pairs verbatim
        label = `augmented (+${added.length})`;
      } else {
        newFm = stripFaqs(parts.fm) + "\n" + faqsToYaml(gen);
        label = hasFaqs ? `replaced (${gen.length})` : `wrote (${gen.length})`;
      }

      const content = `---\n${newFm}\n---\n${parts.body}`;
      if (args.dryRun) {
        console.log(`--- DRY RUN ${id} [${label}] ---\n${content.slice(0, 500)}\n...`);
      } else {
        writeFileSync(file, content);
        console.log(`✓ ${id} — ${label}`);
      }
      wrote++;
    } catch (e) {
      console.warn(`! failed ${id}: ${e.message}`);
      failed++;
    }
  }
  console.log(`\nDone. wrote/updated=${wrote} skipped=${skipped} failed=${failed} (model=${model})`);
  if (wrote > 0 && !args.dryRun) console.log("Rebuild the site to publish the new FAQPage JSON-LD.");
}

// Insert new pairs at the end of an existing `faqs:` block (existing pairs untouched).
function appendToFaqs(fm, added) {
  const addYaml = added
    .map((f) => `  - question: ${JSON.stringify(f.question)}\n    answer: ${JSON.stringify(f.answer)}`)
    .join("\n");
  const lines = fm.split("\n");
  const i = lines.findIndex((l) => /^faqs:/.test(l));
  if (i === -1) return fm + "\n" + faqsToYaml(added);
  let j = i + 1;
  while (j < lines.length && /^\s/.test(lines[j]) && lines[j].trim() !== "") j++;
  lines.splice(j, 0, addYaml);
  return lines.join("\n");
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
