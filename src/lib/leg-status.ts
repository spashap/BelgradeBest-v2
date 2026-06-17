import { existsSync } from "node:fs";
import { join } from "node:path";
import schema from "../data/site-schema.json";

// Leg "live" status as a READ-ONLY PROJECTION — never stored. A leg is "live"
// iff ANY of its slugs has a committed content file
// (src/content/articles/<leg>/<slug>.md), which is exactly what the build
// renders. Runs at build time (SSG); filesystem reads are safe.
export function legStatus(legSlug: string): "live" | "coming-soon" {
  const leg = schema.legs.find((l) => l.slug === legSlug);
  const live =
    !!leg &&
    leg.slugs.some((s) =>
      existsSync(
        join(process.cwd(), "src", "content", "articles", legSlug, `${s.slug}.md`),
      ),
    );
  return live ? "live" : "coming-soon";
}
