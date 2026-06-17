import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import { env } from "./env";

// Data-file store for the in-app /admin. TWO backends:
//   • GitHub  (when GITHUB_TOKEN + GITHUB_REPO set, i.e. on Vercel): reads/writes
//     src/data/*.json via the GitHub Contents API. A write is a commit, which
//     auto-triggers a Vercel rebuild → the static site goes live with the change.
//     No database; the JSON files remain the single source of truth.
//   • Local FS (dev / no token): reads/writes the files directly so `astro dev`
//     reflects edits immediately.
// Either way the public site reads these exact files at build.

const REL_SCHEMA = "src/data/site-schema.json";

const ghRepo = () => env("GITHUB_REPO");
const ghBranch = () => env("GITHUB_BRANCH") || "main";
const ghToken = () => env("GITHUB_TOKEN");
export const usingGitHub = () => !!(ghRepo() && ghToken());

type FileState = { text: string; sha: string | null };

async function getFile(rel: string): Promise<FileState> {
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
    const text = Buffer.from(json.content, "base64").toString("utf8");
    return { text, sha: json.sha };
  }
  return { text: readFileSync(join(process.cwd(), rel), "utf8"), sha: null };
}

async function putFile(rel: string, text: string, message: string, sha: string | null): Promise<void> {
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
  // local atomic write
  const abs = join(process.cwd(), rel);
  const tmp = `${abs}.tmp-${process.pid}`;
  writeFileSync(tmp, text, "utf8");
  renameSync(tmp, abs);
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
  const { text, sha } = await getFile(REL_SCHEMA);
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
