// Local-only guard — mirrors the old isLocalOnly() philosophy. The admin is
// blocked whenever it looks like a deployed/production context. It is also
// excluded from the Vercel build (../.vercelignore), so this is defense-in-depth.
export function isLocalOnly() {
  return !process.env.VERCEL && process.env.NODE_ENV !== "production";
}

// Express middleware: 403 unless local.
export function guard(req, res, next) {
  if (!isLocalOnly()) {
    res.status(403).send("Forbidden — admin is local-only.");
    return;
  }
  next();
}
