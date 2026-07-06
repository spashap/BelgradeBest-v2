import type { APIRoute } from "astro";
import { widgetScript, JS_HEADERS } from "../../lib/widget-js";
import { listingsForLeg, listingHref } from "../../lib/listings";
import { SITE } from "../../lib/site";
import { metaTrim } from "../../lib/text";

// /widgets/expo-pavilion.js — a country's pavilion spotlight. The partner
// picks the pavilion via data-country="<slug>"; every published pavilion
// profile is baked in, so new profiles/updates flow to embeds on deploy.
const STATUS_LABEL: Record<string, string> = {
  announced: "Plans announced",
  tender: "Tender under way",
  construction: "Under construction",
  "concept-only": "Concept reported",
};

export const GET: APIRoute = () => {
  const pavilions: Record<string, { name: string; status: string; line: string; url: string }> = {};
  for (const p of listingsForLeg("expo-2027")) {
    pavilions[p.slug] = {
      name: p.name,
      status: p.status ? (STATUS_LABEL[p.status] ?? p.status) : "Profile",
      line: metaTrim(p.summary, 130),
      url: `${SITE.origin}${listingHref(p)}?utm_source=pavilion-widget&utm_medium=embed`,
    };
  }
  const js = widgetScript({
    header: `/* BelgradeBest — Expo 2027 pavilion spotlight (free embed).
 * <div data-bb-expo-pavilion data-country="japan"></div>
 * <script src="${SITE.origin}/widgets/expo-pavilion.js" async><\/script>
 * data-country: one of ${Object.keys(pavilions).join(", ")}
 * Optional hex colors on the div: data-bg, data-fg, data-accent.
 * Profiles are researched + sourced by belgradebest.com and baked in at
 * publish time — embeds update when our profiles do. No cookies, no tracking. */`,
    attr: "data-bb-expo-pavilion",
    global: "BBExpoPavilion",
    data: { pavilions, fallback: "japan", url: `${SITE.origin}/expo-2027/pavilions?utm_source=pavilion-widget&utm_medium=embed` },
    render: `function render(el) {
    var t = theme(el);
    var slug = (el.dataset && el.dataset.country) || DATA.fallback;
    var p = DATA.pavilions[slug] || DATA.pavilions[DATA.fallback];
    if (!p) return;
    el.innerHTML = card(t, 340,
      eyebrow(t, "Expo 2027 Belgrade — pavilion") +
      '<div style="font-size:26px;font-weight:800;letter-spacing:-0.01em;line-height:1.15">' + esc(p.name) + '</div>' +
      '<div style="display:inline-block;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:' + t.accent + ';border:1px solid ' + t.accent + ';border-radius:999px;padding:2px 10px;margin:8px 0 10px">' + esc(p.status) + '</div>' +
      '<div style="font-size:14px;opacity:.85">' + esc(p.line) + '</div>',
      'Sourced profile: ' + link(t, p.url, "read on BelgradeBest") + ' · ' + link(t, DATA.url, "all pavilions")
    );
  }`,
  });
  return new Response(js, { headers: JS_HEADERS });
};
