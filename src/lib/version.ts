// Site version — single source: src/data/version.json, bumped by
// scripts/bump-version.mjs (run automatically by scripts/push-to-git.bat, so
// every push increments the minor; a major bump is a manual owner command).
// Rendered in the public footer and the admin dashboard.

import v from "../data/version.json";

export const VERSION = `V${String(v.major).padStart(2, "0")}.${String(v.minor).padStart(3, "0")}`;
