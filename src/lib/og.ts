// Social-card lookup for the generated OG images (scripts/gen-listing-og.mjs
// → public/images/og/<name>.png). Returns the site-relative path when the
// card exists, else undefined so pageMetadata falls back to the brand default.
// Uses fs at BUILD time — import from prerendered pages only (never from
// admin/runtime code paths).

import { existsSync } from "node:fs";
import { join } from "node:path";

export function ogImage(name: string): string | undefined {
  const rel = `/images/og/${name}.png`;
  return existsSync(join(process.cwd(), "public", rel)) ? rel : undefined;
}
