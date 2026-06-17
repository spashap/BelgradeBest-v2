// Canonical article-path construction. There is exactly ONE formula for an
// internal article URL:  /<leg>/<slug>
export function legHref(leg: string, slug: string): string {
  return `/${leg}/${slug}`;
}
