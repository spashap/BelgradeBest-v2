export const prerender = false;
import type { APIRoute } from "astro";
import { updateListingAdmin, createListing, type ListingPatch } from "../../../lib/admin/platform-store";
import type { OutreachStatus } from "../../../lib/listings";

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
