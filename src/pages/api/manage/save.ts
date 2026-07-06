export const prerender = false;
import type { APIRoute } from "astro";
import { findByToken, saveManaged } from "../../../lib/admin/platform-store";
import { getFile, putBinary } from "../../../lib/admin/store";
import { notifyOwner } from "../../../lib/admin/notify";
import { listingHref } from "../../../lib/listings";
import { SITE } from "../../../lib/site";

// Self-serve save for the /manage portal. Token re-verified here (never trust
// the form's leg/slug alone); text is sanitized + capped in saveManaged();
// images arrive as browser-resized JPEG data URLs and are committed as binary
// files before the listing JSON references them. Every save notifies the
// owner (Resend when configured, console fallback otherwise).
const MAX_IMG_BYTES = 700_000;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const back = (q: string) => redirect(`/manage?token=${encodeURIComponent(token)}&${q}`);
  try {
    const listing = await findByToken(token);
    if (!listing) return redirect("/manage"); // invalid link → generic screen

    // Images: validate + commit binaries first, collect site-relative paths.
    const existing = listing.images ?? [];
    const slots: (string | null)[] = [];
    let uploaded = false;
    for (let n = 1; n <= 3; n++) {
      const dataUrl = String(form.get(`img${n}`) ?? "");
      if (!dataUrl) {
        slots.push(existing[n - 1] ?? null);
        continue;
      }
      const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
      if (!m) return back("error=bad-image-format");
      const b64 = m[1];
      if (Buffer.byteLength(b64, "base64") > MAX_IMG_BYTES) return back("error=image-too-large");
      const rel = `public/images/listings/${listing.leg}/${listing.slug}/photo-${n}.jpg`;
      // Overwrites need the current blob sha in GitHub mode.
      let sha: string | null = null;
      try {
        sha = (await getFile(rel)).sha;
      } catch {
        /* new file */
      }
      await putBinary(rel, b64, `manage: ${listing.leg}/${listing.slug} photo ${n}`, sha);
      slots.push(`/images/listings/${listing.leg}/${listing.slug}/photo-${n}.jpg`);
      uploaded = true;
    }

    await saveManaged(listing.leg, listing.slug, token, {
      summary: String(form.get("summary") ?? ""),
      about: String(form.get("about") ?? ""),
      website: String(form.get("website") ?? ""),
      images: uploaded ? (slots.filter(Boolean) as string[]) : undefined,
    });

    await notifyOwner(
      `Listing edited via /manage: ${listing.name}`,
      `${listing.leg}/${listing.slug} was self-edited by the business.\nLive page: ${SITE.origin}${listingHref(listing)}\nReview the commit in GitHub (message "manage: ${listing.leg}/${listing.slug} self-edit"); revert it if anything is off.`,
    );
    return back("saved=1");
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("invalid token")) return redirect("/manage");
    return back(`error=${encodeURIComponent(msg.slice(0, 120))}`);
  }
};
