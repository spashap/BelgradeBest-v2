export const prerender = false;
import type { APIRoute } from "astro";
import {
  moveNavItem,
  setNavItemVisible,
  addNavItem,
  removeNavItem,
  type NavTarget,
} from "../../../lib/admin/store";

const TARGETS: NavTarget[] = ["header", "footer-col", "legal", "social"];

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const action = String(form.get("action") ?? "");
  const target = String(form.get("target") ?? "") as NavTarget;
  const col = Number(form.get("col") ?? "0");
  const index = Number(form.get("index") ?? "-1");

  try {
    if (!TARGETS.includes(target)) throw new Error(`unknown target '${target}'`);
    if (action === "add") {
      await addNavItem(target, col, String(form.get("ref") ?? ""));
      return redirect("/admin/navigation?ok=1");
    }
    if (!Number.isInteger(index) || index < 0) throw new Error("bad item index");
    if (action === "move") {
      await moveNavItem(target, col, index, form.get("dir") === "up" ? "up" : "down");
    } else if (action === "visible") {
      await setNavItemVisible(target, col, index, form.get("visible") === "1");
    } else if (action === "remove") {
      await removeNavItem(target, col, index);
    } else {
      throw new Error(`unknown action '${action}'`);
    }
    return redirect("/admin/navigation?ok=1");
  } catch (e) {
    return redirect(`/admin/navigation?error=${encodeURIComponent((e as Error).message)}`);
  }
};
