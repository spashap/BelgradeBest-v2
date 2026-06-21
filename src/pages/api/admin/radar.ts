export const prerender = false;
import type { APIRoute } from "astro";
import { setRadarActioned, triggerRadarWorkflow } from "../../../lib/admin/store";

// Two actions: "run" dispatches the radar workflow; default toggles an item's
// "actioned" flag (writes data/radar/state.json). Redirects back preserving filters.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const action = String(form.get("action") ?? "");
  const back = String(form.get("back") ?? "/admin/radar") || "/admin/radar";
  const sep = back.includes("?") ? "&" : "?";
  try {
    if (action === "run") {
      await triggerRadarWorkflow();
      return redirect(`${back}${sep}queued=1`);
    }
    const id = String(form.get("id") ?? "");
    const actioned = form.get("actioned") === "1";
    await setRadarActioned(id, actioned);
    return redirect(`${back}${sep}ok=1`);
  } catch (e) {
    return redirect(`${back}${sep}error=${encodeURIComponent((e as Error).message)}`);
  }
};
