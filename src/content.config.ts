import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// One `articles` collection, folder-per-leg: src/content/articles/<leg>/<slug>.md
// id resolves to "<leg>/<slug>". Body = the original body.md verbatim (CommonMark,
// H2+ only — the H1/lede/hero/FAQ/links all render from frontmatter, matching the
// old ArticleTemplate split). Frontmatter is merged by scripts/port-content.mjs.

export const LEGS = [
  "visit-belgrade",
  "plan-your-trip",
  "where-to-stay",
  "food-and-nightlife",
  "expo-2027",
  "invest-and-relocate",
  "medical-tourism",
] as const;

const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: z.object({
    // identity / routing
    leg: z.enum(LEGS),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    // SEO / head
    title: z.string(),
    shortTitle: z.string(),
    description: z.string(),
    // article surface
    lede: z.string(),
    heroLabel: z.string(),
    heroAlt: z.string().optional(),
    lastUpdated: z.string(), // ISO date
    // structure (mirrored from site-schema.json slug entry; schema stays the master)
    order: z.number().int().default(999),
    visible: z.boolean().default(true),
    intent: z.enum(["leisure", "investor", "both"]).nullable().default(null),
    priority: z.enum(["P1", "P2", "P3"]).default("P3"),
    noindex: z.boolean().default(false),
    // internal links — porter-seeded convenience; the RENDER source of truth is
    // site-schema.json via lib/links.ts (kept here only for reference/back-compat).
    linksTo: z.array(z.string()).default([]),
    // FAQ (was faqs.json) -> FAQPage schema
    faqs: z
      .array(z.object({ question: z.string(), answer: z.string() }))
      .default([]),
    // optional editorial extras carried from the old registries / page props
    isFaqCandidate: z.boolean().optional(),
    unknowns: z.array(z.string()).default([]),
  }),
});

export const collections = { articles };
