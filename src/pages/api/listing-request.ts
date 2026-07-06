export const prerender = false;
import type { APIRoute } from "astro";
import { putFile } from "../../lib/admin/store";

// Public lead endpoint for the /for-businesses "get listed" form. Writes each
// request as a lead file via the shared GitHub/local store (a commit in prod —
// no DB), which the admin Platform home lists. Spam guards: honeypot field,
// field length caps, basic email shape. This is (with /api/admin/*) part of
// the sanctioned serverless surface — public PAGES stay static.
const LEADS_DIR = "src/data/leads";

export const POST: APIRoute = async ({ request, redirect }) => {
  const back = "/for-businesses";
  try {
    const form = await request.formData();
    // Honeypot: real users never fill "company" (visually hidden). Pretend success.
    if (String(form.get("company") ?? "").trim() !== "") return redirect(`${back}?sent=1`);

    const business = String(form.get("business") ?? "").trim().slice(0, 120);
    const category = String(form.get("category") ?? "").trim().slice(0, 40);
    const person = String(form.get("person") ?? "").trim().slice(0, 80);
    const email = String(form.get("email") ?? "").trim().slice(0, 120);
    const website = String(form.get("website") ?? "").trim().slice(0, 200);
    const message = String(form.get("message") ?? "").trim().slice(0, 1000);

    if (business.length < 2) return redirect(`${back}?error=missing-business`);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return redirect(`${back}?error=bad-email`);

    const now = new Date();
    const stamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const slug = business
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    const lead = {
      received: now.toISOString(),
      business,
      category,
      person: person || null,
      email,
      website: website || null,
      message: message || null,
      status: "new",
    };
    await putFile(
      `${LEADS_DIR}/${stamp}-${slug || "lead"}.json`,
      JSON.stringify(lead, null, 2) + "\n",
      `lead: ${business} (${category})`,
      null,
    );
    return redirect(`${back}?sent=1`);
  } catch {
    return redirect(`${back}?error=save-failed`);
  }
};
