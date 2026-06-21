// syndicate.mjs — Auto-post new/updated articles to social platforms.
//
// ⚠️ ACCOUNT-GATED: this is the one automation that needs platform accounts +
// API tokens. With no tokens set it is fully INERT (logs "skipped" and exits 0),
// so it's safe to wire up now and switch on later. NOT deployed; run on the
// owner's machine or a scheduler.
//
// It reads the BUILT feed (dist/rss.xml — run `npm run build` first), finds the
// newest article not already posted (tracked in scripts/.syndicate-state.json),
// and posts a short update to whichever providers have credentials.
//
// Usage:
//   npm run build && node scripts/syndicate.mjs           # post newest unposted
//   node scripts/syndicate.mjs --dry-run                  # show what WOULD post
//   node scripts/syndicate.mjs --feed https://belgradebest.com/rss.xml   # use live feed
//
// Env (set only the providers you use):
//   X (Twitter) v2:   X_ACCESS_TOKEN            (OAuth2 user token with tweet.write)
//   LinkedIn:         LINKEDIN_ACCESS_TOKEN, LINKEDIN_AUTHOR_URN  (e.g. urn:li:organization:123)
//   Facebook Page:    FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATE = join(ROOT, "scripts", ".syndicate-state.json");
const DIST_FEED = join(ROOT, "dist", "rss.xml");

function envFromDotenv() {
  // Merge .env (if present) into process.env without a dependency.
  const p = join(ROOT, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
  }
}

function parseArgs(argv) {
  const a = { dryRun: false, feed: null, max: 1 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") a.dryRun = true;
    else if (argv[i] === "--feed") a.feed = argv[++i];
    else if (argv[i] === "--max") a.max = parseInt(argv[++i], 10) || 1;
  }
  return a;
}

const unesc = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

function parseFeed(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const get = (tag) => {
      const t = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return t ? unesc(t[1].trim()) : "";
    };
    items.push({ title: get("title"), link: get("link"), description: get("description") });
  }
  return items;
}

async function loadFeed(args) {
  if (args.feed) {
    const res = await fetch(args.feed);
    if (!res.ok) throw new Error(`feed fetch ${res.status}`);
    return parseFeed(await res.text());
  }
  if (!existsSync(DIST_FEED)) throw new Error(`No ${DIST_FEED}. Run "npm run build" first, or pass --feed <url>.`);
  return parseFeed(readFileSync(DIST_FEED, "utf8"));
}

function loadState() {
  if (!existsSync(STATE)) return { posted: [] };
  try { return JSON.parse(readFileSync(STATE, "utf8")); } catch { return { posted: [] }; }
}
function saveState(s) { writeFileSync(STATE, JSON.stringify(s, null, 2) + "\n"); }

// ── providers ───────────────────────────────────────────────────────────────
async function postToX(text) {
  const token = process.env.X_ACCESS_TOKEN;
  if (!token) return { provider: "X", skipped: true };
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return { provider: "X", ok: res.ok, status: res.status, body: res.ok ? "" : (await res.text()).slice(0, 200) };
}

async function postToLinkedIn(text, url) {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const author = process.env.LINKEDIN_AUTHOR_URN;
  if (!token || !author) return { provider: "LinkedIn", skipped: true };
  const payload = {
    author,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: `${text}\n${url}` },
        shareMediaCategory: "ARTICLE",
        media: [{ status: "READY", originalUrl: url }],
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
    body: JSON.stringify(payload),
  });
  return { provider: "LinkedIn", ok: res.ok, status: res.status, body: res.ok ? "" : (await res.text()).slice(0, 200) };
}

async function postToFacebook(text, url) {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) return { provider: "Facebook", skipped: true };
  const body = new URLSearchParams({ message: text, link: url, access_token: token });
  const res = await fetch(`https://graph.facebook.com/${pageId}/feed`, { method: "POST", body });
  return { provider: "Facebook", ok: res.ok, status: res.status, body: res.ok ? "" : (await res.text()).slice(0, 200) };
}

async function main() {
  envFromDotenv();
  const args = parseArgs(process.argv.slice(2));
  const items = await loadFeed(args);
  if (items.length === 0) { console.log("Feed empty — nothing to post."); return; }

  const state = loadState();
  const postedSet = new Set(state.posted);
  const pending = items.filter((it) => it.link && !postedSet.has(it.link)).slice(0, args.max);
  if (pending.length === 0) { console.log("Nothing new to post (all feed items already syndicated)."); return; }

  const anyCreds = !!(process.env.X_ACCESS_TOKEN || process.env.LINKEDIN_ACCESS_TOKEN || process.env.FB_PAGE_ACCESS_TOKEN);
  if (!anyCreds) {
    console.log("No social credentials set — INERT. Would post:");
    for (const it of pending) console.log(`  • ${it.title} → ${it.link}`);
    console.log("\nSet provider env vars (see header) to enable. Exiting 0.");
    return;
  }

  for (const it of pending) {
    const text = it.title;
    if (args.dryRun) { console.log(`DRY RUN → ${it.link}\n  ${text}`); continue; }
    const results = await Promise.all([
      postToX(`${text} ${it.link}`),
      postToLinkedIn(text, it.link),
      postToFacebook(text, it.link),
    ]);
    let anyOk = false;
    for (const r of results) {
      if (r.skipped) console.log(`  - ${r.provider}: skipped (no creds)`);
      else if (r.ok) { console.log(`  ✓ ${r.provider}: posted`); anyOk = true; }
      else console.log(`  ! ${r.provider}: ${r.status} ${r.body}`);
    }
    if (anyOk) { state.posted.push(it.link); saveState(state); }
  }
  if (!args.dryRun) console.log("Done.");
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
