import schema from "../data/site-schema.json";
import { legHref } from "./routes";

// Planned-set accessor — DERIVED from the master data/site-schema.json, the
// single source of truth for site structure. Supplies only the planned set +
// each slug's structural fields; render data lives in the content collection.

export type PlanSlug = {
  slug: string;
  path: string;
  title: string;
  intent: string | null;
  status?: string; // projected, never stored
  priority: string;
  linksTo: string[];
};

export type PlanLeg = {
  legPath: string;
  legName: string;
  slugs: PlanSlug[];
};

export type ContentPlan = Record<string, PlanLeg>;

export const contentPlan: ContentPlan = Object.fromEntries(
  schema.legs.map((leg) => [
    leg.slug,
    {
      legPath: `/${leg.slug}/`,
      legName: leg.title,
      // A slug hidden in the master (visible:false) drops out of the PUBLIC
      // planned set, so the admin "hide" toggle has a real effect.
      slugs: leg.slugs
        .filter((s) => s.visible !== false)
        .map((s) => ({
          slug: s.slug,
          path: legHref(leg.slug, s.slug),
          title: s.title,
          intent: s.intent,
          priority: s.priority,
          linksTo: s.linksTo,
        })),
    },
  ]),
);

export function getLeg(key: string): PlanLeg | undefined {
  return contentPlan[key];
}

export function getPlannedSlugs(key: string): PlanSlug[] {
  return contentPlan[key]?.slugs ?? [];
}

export function getPlannedChildren(key: string): PlanSlug[] {
  return getPlannedSlugs(key).filter((r) => r.slug !== key);
}
