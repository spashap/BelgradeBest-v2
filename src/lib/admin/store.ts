import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { env } from "./env";

// Data-file store for the in-app /admin.
//
// READS never leave the process (2026-09-06: the admin used to read every page
// through the GitHub Contents API, so a dead token turned the whole admin into
// a blank 500). Now:
//   • dev (`astro dev`): read the files from disk, so edits show instantly.
//   • production build: read the BUNDLED snapshot of src/data/** captured at
//     build time (import.meta.glob below). Every save triggers a rebuild, so
//     the snapshot is current except for the ~1 min rebuild window after a save.
// WRITES are the only thing that needs GitHub:
//   • GitHub mode (GITHUB_TOKEN + GITHUB_REPO set, i.e. on Vercel): a write is a
//     commit via the Contents API, which auto-triggers the Vercel rebuild. The
//     write path re-reads the file from GitHub first (current text + blob sha),
//     so a stale snapshot can never clobber a newer commit.
//   • local (no token): write the file on disk.
//   • Vercel WITHOUT a token: saving is refused with a clear message; reading
//     keeps working. No database; the JSON files remain the single source of truth.

// Build-time snapshot of every JSON master under src/data (raw text, keyed by
// repo-relative path). ~0.7 MB; inlined into the server bundle by Vite.
const SNAPSHOT: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob("../../data/**/*.json", { query: "?raw", import: "default", eager: true }) as Record<
      string,
      string
    >,
  ).map(([k, v]) => [k.replace(/^(\.\.\/)+data\//, "src/data/"), v]),
);
const IS_DEV = import.meta.env.DEV;
const ON_VERCEL = typeof process !== "undefined" && !!process.env.VERCEL;

const REL_SCHEMA = "src/data/site-schema.json";
const REL_CONFIG = "src/data/site-config.json";

const ghRepo = () => env("GITHUB_REPO");
const ghBranch = () => env("GITHUB_BRANCH") || "main";
const ghToken = () => env("GITHUB_TOKEN");
export const usingGitHub = () => !!(ghRepo() && ghToken());

// How a save would persist right now — shown on the dashboard.
export type SaveMode = "github" | "local" | "readonly";
export function saveMode(): SaveMode {
  if (usingGitHub()) return "github";
  return ON_VERCEL ? "readonly" : "local";
}
const READONLY_MSG =
  "Saving from the deployed admin needs GITHUB_TOKEN + GITHUB_REPO in the Vercel env " +
  "(reads work without them). Edit the JSON in the repo instead.";

type FileState = { text: string; sha: string | null };

// getFile/putFile/listDir are exported for sibling stores (platform-store.ts)
// so every admin surface shares one persistence implementation.

// READ — dev: disk; prod: bundled snapshot. Never the network. sha is always
// null here: a read result must not be passed to putFile (use getFileForWrite).
export async function getFile(rel: string): Promise<FileState> {
  if (IS_DEV) {
    try {
      return { text: readFileSync(join(process.cwd(), rel), "utf8"), sha: null };
    } catch {
      /* fall through to the snapshot */
    }
  }
  const text = SNAPSHOT[rel];
  if (text !== undefined) return { text, sha: null };
  throw new Error(`Cannot read ${rel} (not on disk, not in the build snapshot)`);
}

// READ-FOR-WRITE — the current persisted text + sha for an update. GitHub mode
// fetches the live file (so an update mutates the newest commit, never the
// snapshot); local mode reads disk. Throws if the file does not exist.
export async function getFileForWrite(rel: string): Promise<FileState> {
  if (usingGitHub()) {
    const url = `https://api.github.com/repos/${ghRepo()}/contents/${rel}?ref=${ghBranch()}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${ghToken()}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "belgradebest-v2-admin",
      },
    });
    if (!res.ok) throw new Error(`GitHub GET ${rel} failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { content: string; sha: string };
    return { text: Buffer.from(json.content, "base64").toString("utf8"), sha: json.sha };
  }
  if (ON_VERCEL) throw new Error(READONLY_MSG);
  return { text: readFileSync(join(process.cwd(), rel), "utf8"), sha: null };
}

export async function putFile(rel: string, text: string, message: string, sha: string | null): Promise<void> {
  if (usingGitHub()) {
    const url = `https://api.github.com/repos/${ghRepo()}/contents/${rel}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${ghToken()}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "belgradebest-v2-admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(text, "utf8").toString("base64"),
        branch: ghBranch(),
        ...(sha ? { sha } : {}),
      }),
    });
    if (!res.ok) throw new Error(`GitHub PUT ${rel} failed: ${res.status} ${await res.text()}`);
    return;
  }
  if (ON_VERCEL) throw new Error(READONLY_MSG);
  // local atomic write
  const abs = join(process.cwd(), rel);
  const tmp = `${abs}.tmp-${process.pid}`;
  writeFileSync(tmp, text, "utf8");
  renameSync(tmp, abs);
}

// Binary sibling of putFile: content arrives already base64-encoded (image
// uploads from the manage portal). GitHub mode PUTs it directly; local mode
// decodes to disk. sha=null creates; pass a sha to overwrite.
export async function putBinary(rel: string, base64: string, message: string, sha: string | null): Promise<void> {
  if (usingGitHub()) {
    const url = `https://api.github.com/repos/${ghRepo()}/contents/${rel}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${ghToken()}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "belgradebest-v2-admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, content: base64, branch: ghBranch(), ...(sha ? { sha } : {}) }),
    });
    if (!res.ok) throw new Error(`GitHub PUT ${rel} failed: ${res.status} ${await res.text()}`);
    return;
  }
  if (ON_VERCEL) throw new Error(READONLY_MSG);
  const abs = join(process.cwd(), rel);
  const { mkdirSync } = await import("node:fs");
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, Buffer.from(base64, "base64"));
}

// List a directory (names + kind) — dev: disk; prod: the snapshot (JSON files
// only, which is all the data dirs hold). Callers must handle absence ([]).
export type DirEntry = { name: string; dir: boolean };
export async function listDir(rel: string): Promise<DirEntry[]> {
  if (IS_DEV) {
    try {
      const { readdirSync, statSync } = await import("node:fs");
      const abs = join(process.cwd(), rel);
      return readdirSync(abs).map((name) => ({ name, dir: statSync(join(abs, name)).isDirectory() }));
    } catch {
      /* fall through to the snapshot */
    }
  }
  const prefix = rel.replace(/\/+$/, "") + "/";
  const seen = new Map<string, boolean>();
  for (const key of Object.keys(SNAPSHOT)) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    const i = rest.indexOf("/");
    if (i === -1) seen.set(rest, false);
    else seen.set(rest.slice(0, i), true);
  }
  return [...seen].map(([name, dir]) => ({ name, dir })).sort((a, b) => a.name.localeCompare(b.name));
}

// ---- schema model ----

export type Schema = {
  legs: {
    slug: string;
    title: string;
    order: number;
    visible?: boolean;
    noindex?: boolean;
    slugs: { slug: string; title: string; order: number; visible?: boolean; linksTo?: string[] }[];
  }[];
};

export async function readSchema(): Promise<Schema> {
  return JSON.parse((await getFile(REL_SCHEMA)).text);
}

// read → mutate → write (with sha for GitHub optimistic concurrency).
async function updateSchema(mutate: (s: Schema) => void, message: string): Promise<void> {
  const { text, sha } = await getFileForWrite(REL_SCHEMA);
  const schema: Schema = JSON.parse(text);
  mutate(schema);
  await putFile(REL_SCHEMA, JSON.stringify(schema, null, 2) + "\n", message, sha);
}

function findLeg(s: Schema, legSlug: string) {
  const leg = s.legs.find((l) => l.slug === legSlug);
  if (!leg) throw new Error(`unknown leg '${legSlug}'`);
  return leg;
}
function findSlug(leg: Schema["legs"][number], slugId: string) {
  const s = leg.slugs.find((x) => x.slug === slugId);
  if (!s) throw new Error(`unknown slug '${slugId}' in '${leg.slug}'`);
  return s;
}

// ---- mutations ----

export async function setSlugLinks(legSlug: string, slugId: string, links: string[]): Promise<void> {
  const clean: string[] = [];
  const seen = new Set<string>();
  for (const raw of links) {
    const v = String(raw).trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    clean.push(v);
  }
  await updateSchema((s) => {
    findSlug(findLeg(s, legSlug), slugId).linksTo = clean;
  }, `admin: set linksTo for /${legSlug}/${slugId}`);
}

export async function setSlugVisible(legSlug: string, slugId: string, visible: boolean): Promise<void> {
  await updateSchema((s) => {
    findSlug(findLeg(s, legSlug), slugId).visible = visible;
  }, `admin: ${visible ? "show" : "hide"} /${legSlug}/${slugId}`);
}

export async function setLegVisible(legSlug: string, visible: boolean): Promise<void> {
  await updateSchema((s) => {
    findLeg(s, legSlug).visible = visible;
  }, `admin: ${visible ? "show" : "hide"} leg ${legSlug}`);
}

export async function moveSlug(legSlug: string, slugId: string, dir: "up" | "down"): Promise<void> {
  await updateSchema((s) => {
    const leg = findLeg(s, legSlug);
    const sorted = [...leg.slugs].sort((a, b) => a.order - b.order);
    const i = sorted.findIndex((x) => x.slug === slugId);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    const tmp = sorted[i].order;
    sorted[i].order = sorted[j].order;
    sorted[j].order = tmp;
  }, `admin: move ${slugId} ${dir} in ${legSlug}`);
}

// ---- chrome / navigation (site-config.json) ----
// Header strip + footer lists. Items are { ref, visible } objects (social items
// are { url, label, visible }). Order = array order; visible toggles per item.

export type NavRefItem = { ref: string; visible?: boolean };
export type SocialItem = { url: string; label: string; visible?: boolean };

export type SiteConfig = {
  chrome: {
    headerNav?: { items?: NavRefItem[] };
    footer?: {
      columns?: { heading?: string; kind: string; items?: NavRefItem[] }[];
      legal?: NavRefItem[];
      social?: SocialItem[];
    };
  };
};

// Where a nav list lives. `col` is required only for footer columns.
export type NavTarget = "header" | "footer-col" | "legal" | "social";

export async function readConfig(): Promise<SiteConfig> {
  return JSON.parse((await getFile(REL_CONFIG)).text);
}

async function updateConfig(mutate: (c: SiteConfig) => void, message: string): Promise<void> {
  const { text, sha } = await getFileForWrite(REL_CONFIG);
  const config: SiteConfig = JSON.parse(text);
  mutate(config);
  await putFile(REL_CONFIG, JSON.stringify(config, null, 2) + "\n", message, sha);
}

// Resolve the live array for a target so move/visible operate on the real ref.
function resolveNavList(c: SiteConfig, target: NavTarget, col: number): unknown[] {
  const ch = c.chrome ?? (c.chrome = {});
  if (target === "header") {
    const h = (ch.headerNav ??= {});
    return (h.items ??= []);
  }
  const f = (ch.footer ??= {});
  if (target === "footer-col") {
    const cols = (f.columns ??= []);
    const column = cols[col];
    if (!column) throw new Error(`unknown footer column ${col}`);
    return (column.items ??= []);
  }
  if (target === "legal") return (f.legal ??= []);
  if (target === "social") return (f.social ??= []);
  throw new Error(`unknown nav target '${target}'`);
}

export async function moveNavItem(
  target: NavTarget,
  col: number,
  index: number,
  dir: "up" | "down",
): Promise<void> {
  await updateConfig((c) => {
    const list = resolveNavList(c, target, col);
    const j = dir === "up" ? index - 1 : index + 1;
    if (index < 0 || index >= list.length || j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
  }, `admin: move nav item ${index} ${dir} in ${target}${target === "footer-col" ? `[${col}]` : ""}`);
}

// Append a structure ref to a nav list (header / footer column / legal). New
// items default to visible. No-op if the ref is already present. Not for social
// (those are custom { url, label } entries, not structure refs).
export async function addNavItem(target: NavTarget, col: number, ref: string): Promise<void> {
  const clean = String(ref).trim();
  if (!clean) throw new Error("empty ref");
  if (target === "social") throw new Error("cannot add structure refs to social");
  await updateConfig((c) => {
    const list = resolveNavList(c, target, col) as ({ ref?: string } | string)[];
    const exists = list.some((it) => (typeof it === "string" ? it : it.ref) === clean);
    if (exists) return;
    (list as NavRefItem[]).push({ ref: clean, visible: true });
  }, `admin: add ${clean} to ${target}${target === "footer-col" ? `[${col}]` : ""}`);
}

// Remove an item from a nav list entirely (vs. setNavItemVisible which hides it).
export async function removeNavItem(target: NavTarget, col: number, index: number): Promise<void> {
  await updateConfig((c) => {
    const list = resolveNavList(c, target, col);
    if (index < 0 || index >= list.length) throw new Error(`no nav item at index ${index}`);
    list.splice(index, 1);
  }, `admin: remove nav item ${index} from ${target}${target === "footer-col" ? `[${col}]` : ""}`);
}

export async function setNavItemVisible(
  target: NavTarget,
  col: number,
  index: number,
  visible: boolean,
): Promise<void> {
  await updateConfig((c) => {
    const list = resolveNavList(c, target, col) as ({ visible?: boolean } | string)[];
    const item = list[index];
    if (item === undefined) throw new Error(`no nav item at index ${index} in ${target}`);
    if (typeof item === "string") {
      // tolerate legacy bare-string items: promote to object form
      list[index] = { ref: item, visible };
    } else {
      item.visible = visible;
    }
  }, `admin: ${visible ? "show" : "hide"} nav item ${index} in ${target}${target === "footer-col" ? `[${col}]` : ""}`);
}

// ---- question radar (data/radar/*) ----------------------------------------
// Two files: questions.json is the discovery FEED written by the radar job
// (admin reads only); state.json holds the operator's per-item "actioned" flags
// (admin writes). Splitting them means the daily job and the admin never fight
// over the same file.

const REL_RADAR_FEED = "src/data/radar/questions.json";
const REL_RADAR_STATE = "src/data/radar/state.json";

export type RadarItem = {
  id: string;
  title: string;
  url: string;
  sub: string;
  comments: number;
  topics: string[];
  score: number;
  isQuestion?: boolean;
  firstSeen: string; // ISO date first discovered
  lastSeen: string; // ISO date most recently in the feed
};
export type RadarFeed = { generatedAt: string | null; items: RadarItem[] };
export type RadarStateEntry = { actioned: boolean; note?: string; updatedAt: string };
export type RadarState = Record<string, RadarStateEntry>;

async function getFileOrEmpty(rel: string): Promise<FileState> {
  try {
    return await getFile(rel);
  } catch {
    return { text: "", sha: null };
  }
}

export async function readRadarFeed(): Promise<RadarFeed> {
  const { text } = await getFileOrEmpty(REL_RADAR_FEED);
  if (!text) return { generatedAt: null, items: [] };
  try {
    const f = JSON.parse(text);
    return { generatedAt: f.generatedAt ?? null, items: Array.isArray(f.items) ? f.items : [] };
  } catch {
    return { generatedAt: null, items: [] };
  }
}

export async function readRadarState(): Promise<RadarState> {
  const { text } = await getFileOrEmpty(REL_RADAR_STATE);
  if (!text) return {};
  try {
    return JSON.parse(text) as RadarState;
  } catch {
    return {};
  }
}

export async function setRadarActioned(id: string, actioned: boolean): Promise<void> {
  const clean = String(id).trim();
  if (!clean) throw new Error("empty id");
  let text = "";
  let sha: string | null = null;
  try {
    ({ text, sha } = await getFileForWrite(REL_RADAR_STATE));
  } catch (e) {
    // GitHub 404 / no local file yet = first flag ever → create. Anything else
    // (bad token, read-only Vercel) must surface.
    const msg = (e as Error).message;
    if (!/failed: 404|ENOENT/.test(msg)) throw e;
  }
  let state: RadarState = {};
  if (text) {
    try {
      state = JSON.parse(text);
    } catch {
      state = {};
    }
  }
  state[clean] = { actioned, updatedAt: new Date().toISOString() };
  await putFile(
    REL_RADAR_STATE,
    JSON.stringify(state, null, 2) + "\n",
    `admin: radar ${actioned ? "actioned" : "reopened"} ${clean}`,
    sha,
  );
}

// Manually kick off the question-radar GitHub Actions workflow (workflow_dispatch)
// so the operator can refresh the feed on demand from /admin/radar. Needs the
// admin GITHUB_TOKEN to allow Actions (classic PAT `repo` scope, or a fine-grained
// token with "Actions: write"). The run takes ~1–2 min, then it commits the feed.
export async function triggerRadarWorkflow(): Promise<void> {
  if (!usingGitHub()) {
    throw new Error("Run-now needs GitHub mode (GITHUB_TOKEN + GITHUB_REPO). In local dev, run: node scripts/question-radar.mjs");
  }
  const url = `https://api.github.com/repos/${ghRepo()}/actions/workflows/question-radar.yml/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ghToken()}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "belgradebest-v2-admin",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: ghBranch() }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      res.status === 403 || res.status === 404
        ? `Couldn't start the workflow (${res.status}). The admin token likely lacks Actions permission — give it 'workflow' scope (classic PAT) or 'Actions: write' (fine-grained).`
        : `Workflow dispatch failed: ${res.status} ${detail}`,
    );
  }
}
