import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { clusterBySlug } from "./clusters";

// THE single hero resolver. Every surface that shows a hero/thumbnail resolves
// through here. Storage paths/conventions are UNCHANGED from the old stack:
//   - per-slug article hero: public/images/expo-2027/<slug>-hero.png  (flat dir, all legs)
//   - per-leg hero:          public/images/legs/<leg>/hero.png
// Returns a cache-busted src (file mtime) + alt, or null when no asset exists.
// Runs at build time (SSG) — filesystem reads are safe.

export type ResolvedHero = { src: string; alt: string } | null;

const pub = (...p: string[]) => join(process.cwd(), "public", "images", ...p);
function mtime(abs: string): number {
  try {
    return Math.floor(statSync(abs).mtimeMs);
  } catch {
    return 0;
  }
}

// Per-slug article hero (flat dir for every leg — locked convention).
export function heroForSlug(slug: string, alt?: string): ResolvedHero {
  const abs = pub("expo-2027", `${slug}-hero.png`);
  if (!existsSync(abs)) return null;
  return { src: `/images/expo-2027/${slug}-hero.png?v=${mtime(abs)}`, alt: alt ?? slug };
}

// Per-leg hero (leg-keyed dir). Alt from the leg's stored hero alt → title.
export function heroForLeg(leg: string, alt?: string): ResolvedHero {
  const abs = pub("legs", leg, "hero.png");
  if (!existsSync(abs)) return null;
  const c = clusterBySlug(leg);
  return {
    src: `/images/legs/${leg}/hero.png?v=${mtime(abs)}`,
    alt: alt ?? c?.hero?.alt ?? c?.title ?? leg,
  };
}

// Resolve a hero from an internal path:
//   "/leg/slug" → per-slug article hero ;  "/leg" → per-leg hero ;  else null.
export function heroForPath(path: string, altHint?: string): ResolvedHero {
  const segs = path.split("?")[0].replace(/^\//, "").split("/").filter(Boolean);
  if (segs.length >= 2) return heroForSlug(segs[1], altHint);
  if (segs.length === 1) return heroForLeg(segs[0], altHint);
  return null;
}
