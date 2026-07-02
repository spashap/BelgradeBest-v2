// Shared text helpers for SEO strings.

// Trim a string to a SERP-safe meta-description length without cutting
// mid-thought: prefer the last full sentence that fits, then the last word.
export function metaTrim(s: string, max = 158): string {
  const t = s.trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max);
  const sentenceEnd = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  if (sentenceEnd >= 80) return slice.slice(0, sentenceEnd + 1);
  const wordEnd = slice.lastIndexOf(" ");
  return `${slice.slice(0, wordEnd > 0 ? wordEnd : max).replace(/[,;:—–-]\s*$/, "")}…`;
}
