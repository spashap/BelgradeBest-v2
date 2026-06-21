// question-radar.mjs — Daily discovery of Belgrade questions worth answering.
//
// Automates DISCOVERY, not posting (replying stays manual — automating replies
// would be spam and against platform rules). Scans target subreddits for recent,
// question-shaped posts about Belgrade that match our topics, ranks them by
// opportunity (on-topic + a real question + few existing answers + fresh), and
// emits a digest you skim each morning.
//
// Auth: app-only OAuth (client_credentials) using REDDIT_CLIENT_ID +
// REDDIT_CLIENT_SECRET — NO username/password needed. If that fails it falls
// back to Reddit's public .json search (no credentials). Read-only either way.
//
// Outputs: KB/automation/question-radar.md, the GitHub Actions step summary,
// and an optional webhook (RADAR_WEBHOOK_URL). Built for unattended cloud runs
// (.github/workflows/question-radar.yml) — your PC stays off. Node built-ins only.
//
// Usage: node scripts/question-radar.mjs [--days 7] [--top 25]
import { writeFileSync, mkdirSync, readFileSync, existsSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = join(ROOT, "KB", "automation", "question-radar.md");
const STATE = join(ROOT, "scripts", ".radar-state.json");

const USER_AGENT = process.env.REDDIT_USER_AGENT || "belgradebest-radar/1.0 by u/IstartCommentsPorn";

// Where to look (Belgrade/Serbia/travel/expat/medical communities) ...
const SUBREDDITS = [
  "serbia", "Belgrade", "BalkanPeninsula", "europetravel", "solotravel",
  "travel", "digitalnomad", "expats", "Eurotrip", "medicaltourism", "HairTransplants",
];
// ... and the search terms run within each (kept lean to stay well under rate limits).
const QUERIES = ["belgrade", "belgrade dentist OR hair transplant"];

// Topics we can genuinely help with — used to score relevance (mirrors the legs).
const TOPICS = [
  "hotel", "stay", "where to stay", "apartment", "neighbourhood", "neighborhood", "area", "dorcol", "vracar", "zemun",
  "safe", "safety", "visa", "entry", "airport", "transfer", "transport", "bus", "taxi", "money", "dinar", "atm", "currency",
  "nightlife", "club", "bar", "splav", "restaurant", "food", "kafana", "coffee",
  "itinerary", "days", "worth visiting", "worth it", "things to do", "see", "expo", "expo 2027",
  "dental", "dentist", "hair transplant", "clinic", "surgery", "medical", "ivf",
];
const QUESTION_WORDS = /\b(how|what|where|when|which|why|is|are|should|can|could|do|does|any|anyone|anybody|recommend|recommendation|best|help|tips|advice|worth)\b/i;

function parseArgs(argv) {
  const a = { days: 7, top: 25 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--days") a.days = parseInt(argv[++i], 10) || 7;
    else if (argv[i] === "--top") a.top = parseInt(argv[++i], 10) || 25;
  }
  return a;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getToken() {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  try {
    const auth = Buffer.from(`${id}:${secret}`).toString("base64");
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) {
      console.warn(`Reddit token request ${res.status} — falling back to public JSON.`);
      return null;
    }
    const json = await res.json();
    return json.access_token || null;
  } catch (e) {
    console.warn(`Reddit auth error (${e.message}) — falling back to public JSON.`);
    return null;
  }
}

async function search(sub, q, token, days) {
  const t = days <= 7 ? "week" : days <= 31 ? "month" : "year";
  const path = `/r/${encodeURIComponent(sub)}/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&sort=new&t=${t}&limit=50&include_over_18=on`;
  const base = token ? "https://oauth.reddit.com" : "https://www.reddit.com";
  const headers = { "User-Agent": USER_AGENT, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  try {
    const res = await fetch(base + path, { headers });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data?.children ?? []).map((c) => c.data);
  } catch {
    return [];
  }
}

function topicHits(text) {
  const lc = text.toLowerCase();
  const hits = [];
  for (const t of TOPICS) if (lc.includes(t)) hits.push(t);
  return [...new Set(hits)];
}

function scorePost(p, days) {
  const text = `${p.title} ${p.selftext || ""}`;
  const hits = topicHits(text);
  if (hits.length === 0) return null; // off-topic
  const isQuestion = p.title.includes("?") || QUESTION_WORDS.test(p.title);
  const ageDays = (Date.now() / 1000 - (p.created_utc || 0)) / 86400;
  if (ageDays > days) return null;
  const recency = Math.max(0, days - ageDays); // fresher = higher
  const lowAnswers = (p.num_comments ?? 0) < 4 ? 3 : 0; // unanswered = opportunity
  const score = hits.length * 3 + (isQuestion ? 5 : 0) + lowAnswers + recency * 0.5;
  return { hits, isQuestion, ageDays, score };
}

function loadState() { try { return existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : { seen: [] }; } catch { return { seen: [] }; } }
function saveState(s) { try { writeFileSync(STATE, JSON.stringify(s, null, 2) + "\n"); } catch {} }

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = await getToken();
  console.log(token ? "Authenticated (app-only OAuth)." : "Using public JSON (no token).");

  const byId = new Map();
  for (const sub of SUBREDDITS) {
    for (const q of QUERIES) {
      const posts = await search(sub, q, token, args.days);
      for (const p of posts) if (p && p.id && !byId.has(p.id)) byId.set(p.id, p);
      await sleep(token ? 300 : 800); // be polite to the API
    }
  }

  const ranked = [];
  for (const p of byId.values()) {
    const s = scorePost(p, args.days);
    if (!s) continue;
    ranked.push({
      id: p.id,
      title: p.title,
      url: `https://www.reddit.com${p.permalink}`,
      sub: p.subreddit_name_prefixed || `r/${p.subreddit}`,
      comments: p.num_comments ?? 0,
      ageDays: s.ageDays,
      hits: s.hits,
      isQuestion: s.isQuestion,
      score: s.score,
    });
  }
  ranked.sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, args.top);

  const now = new Date().toISOString().slice(0, 10);
  const out = [];
  out.push("# Question radar — Belgrade threads worth answering");
  out.push("");
  out.push(`Generated ${now}. ${byId.size} posts scanned across ${SUBREDDITS.length} subreddits · last ${args.days} days · ranked by opportunity (on-topic + a real question + few answers + fresh).`);
  out.push("");
  out.push("> Reply by hand, helpfully, and only link a page when it truly answers. Automated posting is intentionally NOT done.");
  out.push("");
  for (const r of top) {
    out.push(`### ${r.isQuestion ? "❓ " : ""}${r.title}`);
    out.push(`- ${r.sub} · ${r.comments} comments · ${r.ageDays.toFixed(1)} days old · score ${r.score.toFixed(1)}`);
    out.push(`- topics: ${r.hits.join(", ")}`);
    out.push(`- ${r.url}`);
    out.push("");
  }
  if (top.length === 0) out.push("_No matching threads in this window._");
  const report = out.join("\n");

  mkdirSync(dirname(REPORT), { recursive: true });
  writeFileSync(REPORT, report);
  console.log(`Wrote ${REPORT} — ${top.length} threads (of ${byId.size} scanned).`);

  if (process.env.GITHUB_STEP_SUMMARY) {
    try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + "\n"); } catch {}
  }

  const hook = process.env.RADAR_WEBHOOK_URL;
  if (hook && top.length) {
    const lines = top.slice(0, 8).map((r) => `• ${r.title} (${r.sub}, ${r.comments}c)\n  ${r.url}`).join("\n");
    const text = `Belgrade question radar — ${top.length} threads to consider:\n${lines}`;
    try { const r = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, content: text }) }); console.log(`webhook → ${r.status}`); }
    catch (e) { console.warn(`webhook failed: ${e.message}`); }
  }

  // Track seen ids (useful for local runs; CI runs are stateless and rely on the day window).
  const state = loadState();
  state.seen = [...new Set([...state.seen, ...top.map((r) => r.id)])].slice(-500);
  saveState(state);
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
