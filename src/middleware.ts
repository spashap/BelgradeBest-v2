import { defineMiddleware } from "astro:middleware";
import { adminPassword, authToken, AUTH_COOKIE } from "./lib/admin/env";

// Gate /admin + /api/admin. ADMIN_PASSWORD UNSET = open (the chosen "no auth to
// start"). Set it later to require a login — no other change needed. Runs only
// for the on-demand admin routes; public pages are prerendered and unaffected.
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isAdmin) return next();

  const pw = adminPassword();
  if (!pw) return next(); // open until a password is configured
  if (pathname === "/admin/login" || pathname === "/api/admin/login") return next();

  const cookie = context.cookies.get(AUTH_COOKIE)?.value;
  if (cookie && cookie === authToken(pw)) return next();
  return context.redirect("/admin/login");
});
