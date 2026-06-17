// Shared structural types used across components.

// A single part of a structured rich-text note (site-config.json). Exactly one
// key is set — strong | em | text. Rendered by components/RichNote.astro.
export type RichPart = { strong?: string; em?: string; text?: string };
