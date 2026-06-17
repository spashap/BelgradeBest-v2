// Markdown-parity STOP-GATE (Phase 4). Renders sample article bodies through
// BOTH engines and reports differences. Run before the bulk port:
//   node scripts/_parity.mjs
// Astro side: @astrojs/markdown-remark (V2's actual engine, gfm:true/smarty:off).
// Old side:  react-markdown + react-dom/server, resolved from the OLD project.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const NEW = join(dirname(fileURLToPath(import.meta.url)), "..");
const OLD = join(NEW, "..", "BelgradeBest", "frontend");

const SAMPLES = [
  ["visit-belgrade", "zemun"],
  ["expo-2027", "tickets"],
  ["medical-tourism", "dental-work-belgrade"],
];

// --- Astro engine ---
const { createMarkdownProcessor } = await import("@astrojs/markdown-remark");
const proc = await createMarkdownProcessor({ gfm: true, smartypants: false });

// --- old react-markdown engine (resolved from OLD node_modules) ---
const reqOld = createRequire(join(OLD, "package.json"));
const React = (await import(pathToFileURL(reqOld.resolve("react")).href)).default;
const ReactMarkdown = (await import(pathToFileURL(reqOld.resolve("react-markdown")).href)).default;
const { renderToStaticMarkup } = await import(pathToFileURL(reqOld.resolve("react-dom/server")).href);

const norm = (s) => s.replace(/\r\n/g, "\n").replace(/\n+/g, "\n").trim();

let allMatch = true;
for (const [leg, slug] of SAMPLES) {
  const bodyPath = join(OLD, "app", leg, slug, "body.md");
  if (!existsSync(bodyPath)) {
    console.log(`SKIP ${leg}/${slug} (no body.md)`);
    continue;
  }
  const body = readFileSync(bodyPath, "utf8");

  const astroHtml = norm((await proc.render(body)).code);
  const rmHtml = norm(renderToStaticMarkup(React.createElement(ReactMarkdown, null, body)));

  const match = astroHtml === rmHtml;
  allMatch = allMatch && match;
  console.log(`\n=== ${leg}/${slug} === ${match ? "IDENTICAL ✅" : "DIFFERS ⚠️"}`);
  console.log(`   astro len=${astroHtml.length}  reactMd len=${rmHtml.length}`);
  console.log(`   headingIds(astro)=${/<h[1-6][^>]*\bid=/.test(astroHtml)} curlyQuotes(astro)=${/[“”‘’]/.test(astroHtml) && !/[“”‘’]/.test(body)}`);
  if (!match) {
    // first divergence
    let i = 0;
    while (i < astroHtml.length && i < rmHtml.length && astroHtml[i] === rmHtml[i]) i++;
    console.log(`   first diff @${i}:`);
    console.log(`     astro : …${JSON.stringify(astroHtml.slice(Math.max(0, i - 40), i + 60))}`);
    console.log(`     reactM: …${JSON.stringify(rmHtml.slice(Math.max(0, i - 40), i + 60))}`);
  }
}
console.log(`\n[parity] ${allMatch ? "ALL SAMPLES IDENTICAL ✅ — safe to bulk-port" : "DIFFERENCES FOUND ⚠️ — review above"}`);
