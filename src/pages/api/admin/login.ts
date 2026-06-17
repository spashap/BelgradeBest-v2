export const prerender = false;
import type { APIRoute } from "astro";
import { adminPassword, authToken, AUTH_COOKIE } from "../../../lib/admin/env";

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  const form = await request.formData();
  const pw = adminPassword();
  // If no password is configured, auth is off — just go in.
  if (!pw) return redirect("/admin");
  if (String(form.get("password") ?? "") === pw) {
    cookies.set(AUTH_COOKIE, authToken(pw), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
    });
    return redirect("/admin");
  }
  return redirect("/admin/login?bad=1");
};
