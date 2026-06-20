import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { clusterBySlug } from "./clusters";

// THE single hero resolver. Every surface that shows a hero/thumbnail resolves
// through here. Storage paths/conventions (from the old stack):
//   - per-slug article hero:  public/images/expo-2027/<slug>-hero.<webp|png>  (flat dir, all legs)
//   - per-slug card thumbnail: public/images/expo-2027/<slug>-thumb.webp       (optional, small)
//   - per-leg hero:           public/images/legs/<leg>/hero.<webp|png>
// WebP is preferred when present; PNG is the fallback so pre-optimization heroes
// keep working. Thumbnails are small 16:9 crops used on cards/read-next so those
// surfaces stop loading the full-size hero. Returns a cache-busted src (file
// mtime) + alt, or null when no asset exists. Build-time only (SSG).

export type ResolvedHero = { src: string; alt: string } | null;

const pub = (...p: string[]) => join(process.cwd(), "public", "images", ...p);
function mtime(abs: string): number {
  try {
    return Math.floor(statSync(abs).mtimeMs);
  } catch {
    return 0;
  }
}

// Pick the first existing variant; return its public URL (cache-busted) or null.
function pick(dirParts: string[], names: string[], urlBase: string): { src: string } | null {
  for (const name of names) {
    const abs = pub(...dirParts, name);
    if (existsSync(abs)) return { src: `${urlBase}/${name}?v=${mtime(abs)}` };
  }
  return null;
}

// Per-slug article hero (flat dir for every leg — locked convention). WebP → PNG.
export function heroForSlug(slug: string, alt?: string): ResolvedHero {
  const got = pick(["expo-2027"], [`${slug}-hero.webp`, `${slug}-hero.png`], "/images/expo-2027");
  return got ? { src: got.src, alt: alt ?? slug } : null;
}

// Per-slug card thumbnail. Small WebP → falls back to the full hero if absent.
export function thumbForSlug(slug: string, alt?: string): ResolvedHero {
  const got = pick(["expo-2027"], [`${slug}-thumb.webp`], "/images/expo-2027");
  if (got) return { src: got.src, alt: alt ?? slug };
  return heroForSlug(slug, alt);
}

// Per-leg hero (leg-keyed dir). WebP → PNG. Alt from the leg's stored alt → title.
export function heroForLeg(leg: string, alt?: string): ResolvedHero {
  const got = pick(["legs", leg], ["hero.webp", "hero.png"], `/images/legs/${leg}`);
  if (!got) return null;
  const c = clusterBySlug(leg);
  return { src: got.src, alt: alt ?? c?.hero?.alt ?? c?.title ?? leg };
}

// Per-leg card thumbnail. Small WebP → falls back to the full leg hero if absent.
export function thumbForLeg(leg: string, alt?: string): ResolvedHero {
  const got = pick(["legs", leg], ["thumb.webp"], `/images/legs/${leg}`);
  if (got) {
    const c = clusterBySlug(leg);
    return { src: got.src, alt: alt ?? c?.hero?.alt ?? c?.title ?? leg };
  }
  return heroForLeg(leg, alt);
}

// Resolve a hero from an internal path:
//   "/leg/slug" → per-slug article hero ;  "/leg" → per-leg hero ;  else null.
export function heroForPath(path: string, altHint?: string): ResolvedHero {
  const segs = path.split("?")[0].replace(/^\//, "").split("/").filter(Boolean);
  if (segs.length >= 2) return heroForSlug(segs[1], altHint);
  if (segs.length === 1) return heroForLeg(segs[0], altHint);
  return null;
}

// Thumbnail variant of heroForPath — small image for cards / read-next tiles.
export function thumbForPath(path: string, altHint?: string): ResolvedHero {
  const segs = path.split("?")[0].replace(/^\//, "").split("/").filter(Boolean);
  if (segs.length >= 2) return thumbForSlug(segs[1], altHint);
  if (segs.length === 1) return heroForLeg(segs[0], altHint);
  return null;
}
