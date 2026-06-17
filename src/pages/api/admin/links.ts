export const prerender = false;
import type { APIRoute } from "astro";
import { setSlugLinks } from "../../../lib/admin/store";

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const leg = String(form.get("leg") ?? "");
  const slug = String(form.get("slug") ?? "");
  const links = String(form.get("links") ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  try {
    await setSlugLinks(leg, slug, links);
    return redirect("/admin/links?ok=1");
  } catch (e) {
    return redirect(`/admin/links?error=${encodeURIComponent((e as Error).message)}`);
  }
};
