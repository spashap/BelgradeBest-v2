export const prerender = false;
import type { APIRoute } from "astro";
import { setGrowthTask } from "../../../lib/admin/store";

// Growth plan task state: "done" toggle and/or a short note per task.
// Writes src/data/growth-plan-state.json (GitHub commit in prod, local file in dev).
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  const back = String(form.get("back") ?? "/admin/growth") || "/admin/growth";
  const sep = back.includes("?") ? "&" : "?";
  try {
    const done = form.has("done") ? form.get("done") === "1" : undefined;
    const note = form.has("note") ? String(form.get("note") ?? "") : undefined;
    await setGrowthTask(id, { done, note });
    return redirect(`${back}${sep}ok=1#${encodeURIComponent(id)}`);
  } catch (e) {
    return redirect(`${back}${sep}error=${encodeURIComponent((e as Error).message)}`);
  }
};
