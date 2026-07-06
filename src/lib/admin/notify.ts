// Owner notification email — Resend when configured, console fallback when
// not (the RESEND_API_KEY/EMAIL_FROM placeholders: set them on Vercel and
// notifications switch on; nothing else changes). Never throws — a failed
// notification must not fail the action it reports on.

import { env } from "./env";

export async function notifyOwner(subject: string, text: string): Promise<void> {
  const key = env("RESEND_API_KEY");
  const from = env("EMAIL_FROM");
  const to = env("OWNER_NOTIFY_EMAIL") || from;
  if (!key || !from || !to) {
    console.log(`[notify:fallback] ${subject}\n${text}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `BelgradeBest <${from}>`, to: [to], subject, text }),
    });
    if (!res.ok) console.error(`[notify] Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
  } catch (e) {
    console.error(`[notify] failed: ${(e as Error).message}`);
  }
}
