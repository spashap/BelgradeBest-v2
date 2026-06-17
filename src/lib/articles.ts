import { getCollection, type CollectionEntry } from "astro:content";

// Render-data accessor over the `articles` content collection. In V2 the
// per-article render metadata lives in the collection frontmatter (baked in by
// scripts/port-content.mjs), NOT in TS registries — so this replaces the old
// lib/articles.ts registry dispatch.

export type Article = CollectionEntry<"articles">;

export async function allArticles(): Promise<Article[]> {
  return getCollection("articles");
}

export async function visibleArticles(): Promise<Article[]> {
  return (await getCollection("articles")).filter((a) => a.data.visible !== false);
}

export async function articleFor(leg: string, slug: string): Promise<Article | undefined> {
  return (await getCollection("articles")).find(
    (a) => a.data.leg === leg && a.data.slug === slug,
  );
}

export async function articlesForLeg(leg: string): Promise<Article[]> {
  return (await getCollection("articles")).filter((a) => a.data.leg === leg);
}

// Map keyed by canonical href "/<leg>/<slug>" — used by the internal-link resolver.
export async function articlesByHref(): Promise<Map<string, Article>> {
  const map = new Map<string, Article>();
  for (const a of await getCollection("articles")) {
    map.set(`/${a.data.leg}/${a.data.slug}`, a);
  }
  return map;
}
