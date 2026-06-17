// BelgradeBest-V2 — LOCAL-ONLY admin tool.
// Run:  cd admin && npm install && npm start   → http://127.0.0.1:4000
// Never deployed (../.vercelignore). Every route is guarded by isLocalOnly().
import express from "express";
import { guard, isLocalOnly } from "./lib/guard.mjs";
import {
  readSchema,
  isLive,
  setSlugLinks,
  setSlugVisible,
  setLegVisible,
  moveSlug,
} from "./lib/store.mjs";
import { ga4TopPages, vercelInfo } from "./lib/analytics.mjs";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(guard); // local-only on EVERY route (defense-in-depth)

const PORT = 4000;
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function page(title, nav, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — V2 admin</title>
<style>
:root{--bg:#16130f;--panel:#221d17;--line:#3a322a;--ink:#ece4d8;--soft:#a89b8a;--accent:#d2693f;--ok:#6fae84;}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif}
a{color:var(--accent)}header{padding:14px 20px;border-bottom:1px solid var(--line);display:flex;gap:18px;align-items:center;flex-wrap:wrap}
header b{font-size:16px}nav a{margin-right:14px;text-decoration:none;color:var(--soft)}nav a:hover{color:var(--ink)}
main{padding:20px;max-width:1100px;margin:0 auto}h1{font-size:20px;margin:0 0 16px}h2{font-size:16px;margin:24px 0 10px;color:var(--soft)}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:14px 16px;margin:0 0 14px}
.row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.row+.row{margin-top:8px}
.slug{font-family:ui-monospace,monospace;font-size:13px}
.badge{font-size:11px;padding:2px 7px;border-radius:99px;border:1px solid var(--line);color:var(--soft)}
.badge.live{color:var(--ok);border-color:var(--ok)}.badge.hidden{color:var(--accent);border-color:var(--accent)}
textarea{width:100%;min-height:84px;background:#120f0c;color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:8px;font-family:ui-monospace,monospace;font-size:13px}
button,input[type=submit]{background:var(--accent);color:#fff;border:0;border-radius:6px;padding:7px 12px;cursor:pointer;font-size:13px}
button.ghost{background:transparent;border:1px solid var(--line);color:var(--ink)}
table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:6px 10px;border-bottom:1px solid var(--line)}th{color:var(--soft);font-weight:600}
.muted{color:var(--soft)}form.inline{display:inline}
</style></head><body>
<header><b>BelgradeBest-V2</b><span class="muted">local admin</span>
<nav><a href="/">Dashboard</a><a href="/links">Links</a><a href="/structure">Structure</a><a href="/analytics">Analytics</a></nav>
</header><main><h1>${esc(title)}</h1>${body}</main></body></html>`;
}

// ---- Dashboard ----
app.get("/", (req, res) => {
  const schema = readSchema();
  let built = 0;
  let planned = 0;
  for (const leg of schema.legs)
    for (const s of leg.slugs) (isLive(leg.slug, s.slug) ? built++ : planned++);
  const legRows = schema.legs
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((l) => {
      const b = l.slugs.filter((s) => isLive(l.slug, s.slug)).length;
      return `<tr><td class="slug">${esc(l.slug)}</td><td>${esc(l.title)}</td><td>${b}/${l.slugs.length} built</td><td>${l.noindex ? '<span class="badge">noindex</span>' : '<span class="badge live">indexable</span>'}</td><td>${l.visible === false ? '<span class="badge hidden">hidden</span>' : ""}</td></tr>`;
    })
    .join("");
  res.send(
    page(
      "Dashboard",
      true,
      `<div class="panel"><div class="row"><b>${built}</b> built articles · <b>${planned}</b> planned · <b>${schema.legs.length}</b> legs</div></div>
      <h2>Legs</h2><div class="panel"><table><tr><th>slug</th><th>title</th><th>built</th><th>index</th><th></th></tr>${legRows}</table></div>
      <p class="muted">Edit related links in <a href="/links">Links</a>; reorder / show-hide in <a href="/structure">Structure</a>. Changes write <code>src/data/site-schema.json</code> atomically; rebuild or reload the dev server to see them.</p>`,
    ),
  );
});

// ---- Links ----
app.get("/links", (req, res) => {
  const schema = readSchema();
  const sections = schema.legs
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((leg) => {
      const slugs = leg.slugs
        .slice()
        .sort((a, b) => a.order - b.order)
        .filter((s) => isLive(leg.slug, s.slug)) // links only matter for built pages
        .map((s) => {
          const val = (s.linksTo ?? []).join("\n");
          return `<div class="panel"><div class="row"><span class="slug">/${esc(leg.slug)}/${esc(s.slug)}</span><span class="badge live">live</span></div>
          <form method="post" action="/links/${esc(leg.slug)}/${esc(s.slug)}">
          <p class="muted">Related "Read next" links — one internal href per line (e.g. <code>/visit-belgrade/zemun</code> or <code>/plan-your-trip</code>).</p>
          <textarea name="links">${esc(val)}</textarea>
          <div class="row" style="margin-top:8px"><button type="submit">Save links</button></div></form></div>`;
        })
        .join("");
      return slugs ? `<h2>${esc(leg.title)}</h2>${slugs}` : "";
    })
    .join("");
  res.send(page("Manage links", true, sections || '<p class="muted">No built articles yet.</p>'));
});

app.post("/links/:leg/:slug", (req, res) => {
  const links = String(req.body.links ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  setSlugLinks(req.params.leg, req.params.slug, links);
  res.redirect("/links");
});

// ---- Structure ----
app.get("/structure", (req, res) => {
  const schema = readSchema();
  const sections = schema.legs
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((leg) => {
      const rows = leg.slugs
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((s) => {
          const live = isLive(leg.slug, s.slug);
          return `<tr><td class="slug">${esc(s.slug)}</td>
          <td>${live ? '<span class="badge live">live</span>' : '<span class="badge">planned</span>'} ${s.visible === false ? '<span class="badge hidden">hidden</span>' : ""}</td>
          <td>
            <form class="inline" method="post" action="/structure/${esc(leg.slug)}/${esc(s.slug)}/move"><input type="hidden" name="dir" value="up"><button class="ghost" type="submit">↑</button></form>
            <form class="inline" method="post" action="/structure/${esc(leg.slug)}/${esc(s.slug)}/move"><input type="hidden" name="dir" value="down"><button class="ghost" type="submit">↓</button></form>
            <form class="inline" method="post" action="/structure/${esc(leg.slug)}/${esc(s.slug)}/visible"><input type="hidden" name="visible" value="${s.visible === false ? "1" : "0"}"><button class="ghost" type="submit">${s.visible === false ? "Show" : "Hide"}</button></form>
          </td></tr>`;
        })
        .join("");
      return `<h2>${esc(leg.title)} <span class="muted">/${esc(leg.slug)}</span></h2><div class="panel"><table><tr><th>slug</th><th>status</th><th>actions</th></tr>${rows}</table></div>`;
    })
    .join("");
  res.send(page("Structure", true, sections));
});

app.post("/structure/:leg/:slug/move", (req, res) => {
  moveSlug(req.params.leg, req.params.slug, req.body.dir === "up" ? "up" : "down");
  res.redirect("/structure");
});
app.post("/structure/:leg/:slug/visible", (req, res) => {
  setSlugVisible(req.params.leg, req.params.slug, req.body.visible === "1");
  res.redirect("/structure");
});

// ---- Analytics ----
app.get("/analytics", async (req, res) => {
  const ga = await ga4TopPages();
  const v = vercelInfo();
  const gaBody = ga.configured
    ? `<table><tr><th>page</th><th>views (28d)</th><th>users</th></tr>${ga.rows
        .map((r) => `<tr><td class="slug">${esc(r.path)}</td><td>${r.views}</td><td>${r.users}</td></tr>`)
        .join("")}</table>`
    : `<p class="muted">GA4 not configured. ${esc(ga.reason)}</p>`;
  const vBody = `<p class="muted">${esc(v.note)}</p><p><a href="${esc(v.dashboardUrl)}" target="_blank" rel="noreferrer">Open Vercel dashboard ↗</a></p>`;
  res.send(
    page(
      "Analytics",
      true,
      `<h2>Google Analytics 4 — top pages</h2><div class="panel">${gaBody}</div>
       <h2>Vercel Web Analytics</h2><div class="panel">${vBody}</div>`,
    ),
  );
});

app.listen(PORT, "127.0.0.1", () => {
  if (!isLocalOnly()) {
    console.error("Refusing to run: not a local environment (VERCEL / NODE_ENV=production set).");
    process.exit(1);
  }
  console.log(`BelgradeBest-V2 admin → http://127.0.0.1:${PORT}  (local-only)`);
});
