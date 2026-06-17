export const prerender = false;
import type { APIRoute } from "astro";
import { moveSlug, setSlugVisible } from "../../../lib/admin/store";

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const action = String(form.get("action") ?? "");
  const leg = String(form.get("leg") ?? "");
  const slug = String(form.get("slug") ?? "");
  try {
    if (action === "move") {
      await moveSlug(leg, slug, form.get("dir") === "up" ? "up" : "down");
    } else if (action === "visible") {
      await setSlugVisible(leg, slug, form.get("visible") === "1");
    }
    return redirect("/admin/structure?ok=1");
  } catch (e) {
    return redirect(`/admin/structure?error=${encodeURIComponent((e as Error).message)}`);
  }
};
