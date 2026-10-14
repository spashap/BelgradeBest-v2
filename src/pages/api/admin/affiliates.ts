export const prerender = false;
import type { APIRoute } from "astro";
import { setAffiliate } from "../../../lib/admin/store";

// Affiliate partner switch + ID/link. Writes src/data/affiliates.json (GitHub
// commit → rebuild in prod, local file in dev). Auth: the /admin middleware.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const key = String(form.get("key") ?? "");
  try {
    await setAffiliate(key, { enabled: form.get("enabled") === "1", value: String(form.get("value") ?? "") });
    return redirect(`/admin/affiliates?ok=${encodeURIComponent(key)}#${encodeURIComponent(key)}`);
  } catch (e) {
    return redirect(`/admin/affiliates?error=${encodeURIComponent((e as Error).message)}#${encodeURIComponent(key)}`);
  }
};
