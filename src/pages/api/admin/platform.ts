export const prerender = false;
import type { APIRoute } from "astro";
import {
  updateListingAdmin,
  createListing,
  importListings,
  issueManageToken,
  revokeManageToken,
  type ListingPatch,
} from "../../../lib/admin/platform-store";
import type { OutreachStatus } from "../../../lib/listings";
import { SITE } from "../../../lib/site";

// One endpoint for the Platform module: PATCH a listing's operator fields
// (contact/outreach/claimed) or CREATE a prospect stub (booth / category).
// Plain form POST → redirect, like the other admin endpoints. For patches,
// only fields present in the form are touched, so quick status buttons and
// full row-save forms share this route.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const leg = String(form.get("leg") ?? "");
  const slug = String(form.get("slug") ?? "");
  const back = String(form.get("back") ?? "/admin/platform");
  const safeBack = back.startsWith("/admin/platform") ? back : "/admin/platform";
  try {
    if (form.get("action") === "create") {
      const created = await createListing({
        leg,
        name: String(form.get("name") ?? ""),
        type: String(form.get("type") ?? "booth"),
        parent: String(form.get("parent") ?? "") || undefined,
        email: String(form.get("email") ?? "") || undefined,
        person: String(form.get("person") ?? "") || undefined,
        website: String(form.get("website") ?? "") || undefined,
        notes: String(form.get("notes") ?? "") || undefined,
      });
      return redirect(`${safeBack}?ok=created+${created}`);
    }
    if (form.get("action") === "token") {
      // Issue (or rotate) the /manage magic link. The raw token exists only in
      // this response — shown once, copied by the operator into their email.
      const token = await issueManageToken(leg, slug);
      const link = `${SITE.origin}/manage?token=${token}`;
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>manage link — admin</title>
<style>:root{--bg:#16130f;--panel:#221d17;--line:#3a322a;--ink:#ece4d8;--soft:#a89b8a;--accent:#d2693f}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 ui-sans-serif,system-ui,sans-serif;padding:40px;max-width:760px;margin:0 auto}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:16px;margin:14px 0}
code{display:block;background:#120f0c;border:1px solid var(--line);border-radius:6px;padding:10px;word-break:break-all;font-size:13px}
a{color:var(--accent)}button{background:var(--accent);color:#fff;border:0;border-radius:6px;padding:8px 14px;cursor:pointer}</style></head><body>
<h1>Manage link for ${leg}/${slug}</h1>
<div class="panel"><p><b>Shown once</b> — copy it now. Issuing again rotates the token (old links stop working).</p>
<code id="l">${link}</code>
<p><button onclick="navigator.clipboard.writeText(document.getElementById('l').textContent).then(()=>this.textContent='copied ✓')">Copy link</button></p>
<p class="muted">Paste it into your email to the business. They open it, edit their page, save — it goes live in ~2 minutes. Revoke any time from the category screen.</p></div>
<p><a href="${back.startsWith("/admin/platform") ? back : "/admin/platform"}">← back</a></p></body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (form.get("action") === "revoke-token") {
      await revokeManageToken(leg, slug);
      return redirect(`${safeBack}?ok=token+revoked`);
    }
    if (form.get("action") === "import") {
      const r = await importListings(
        leg,
        String(form.get("parent") ?? ""),
        String(form.get("type") ?? "booth"),
        String(form.get("csv") ?? ""),
      );
      const msg = `imported ${r.created.length}, skipped ${r.skipped.length} existing${r.errors.length ? `, ${r.errors.length} errors: ${r.errors.slice(0, 3).join("; ").slice(0, 150)}` : ""}`;
      return redirect(`${safeBack}?ok=${encodeURIComponent(msg)}`);
    }
    const patch: ListingPatch = {};
    if (form.has("contactEmail")) patch.contactEmail = String(form.get("contactEmail") ?? "");
    if (form.has("contactPerson")) patch.contactPerson = String(form.get("contactPerson") ?? "");
    if (form.has("outreachStatus")) patch.outreachStatus = String(form.get("outreachStatus")) as OutreachStatus;
    if (form.has("outreachNotes")) patch.outreachNotes = String(form.get("outreachNotes") ?? "");
    // Checkbox semantics: an unchecked box sends nothing, so the row form adds
    // a `claimedPresent` marker — its presence means "this form owns the flag".
    if (form.has("claimedPresent")) patch.claimed = form.get("claimed") === "1";
    await updateListingAdmin(leg, slug, patch);
    return redirect(`${safeBack}?ok=1`);
  } catch (e) {
    return redirect(`${safeBack}?error=${encodeURIComponent((e as Error).message)}`);
  }
};
