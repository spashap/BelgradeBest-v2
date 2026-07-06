import type { APIRoute } from "astro";
import { widgetScript, JS_HEADERS } from "../../lib/widget-js";
import { officialCount, namedCount, byRegion, updated } from "../../lib/expo-participants";
import { SITE } from "../../lib/site";

// /widgets/expo-stats.js — the live participant counter. Data baked at build
// from src/data/expo-participants.json: update the tracker, push, and every
// embed on every partner site shows the new number.
export const GET: APIRoute = () => {
  const fmt = new Date(updated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const js = widgetScript({
    header: `/* BelgradeBest — Expo 2027 participant counter (free embed).
 * <div data-bb-expo-stats></div>
 * <script src="${SITE.origin}/widgets/expo-stats.js" async><\/script>
 * Optional hex colors on the div: data-bg, data-fg, data-accent.
 * Data is baked in at publish time by belgradebest.com — embeds update
 * automatically whenever our Expo 2027 tracker updates. No cookies, no tracking. */`,
    attr: "data-bb-expo-stats",
    global: "BBExpoStats",
    data: {
      official: officialCount,
      named: namedCount,
      regions: byRegion().length,
      updated: fmt,
      url: `${SITE.origin}/expo-2027/tracker?utm_source=stats-widget&utm_medium=embed`,
    },
    render: `function render(el) {
    var t = theme(el);
    el.innerHTML = card(t, 320,
      eyebrow(t, "Expo 2027 Belgrade — participants") +
      '<div style="font-size:46px;font-weight:800;letter-spacing:-0.02em;line-height:1">' + DATA.official + '</div>' +
      '<div style="font-size:14px;opacity:.75;margin:4px 0 10px">confirmed international participants</div>' +
      row(t, "Publicly named countries", DATA.named) +
      row(t, "Continents represented", DATA.regions) +
      row(t, "Tracker updated", DATA.updated),
      'Live data: ' + link(t, DATA.url, "Expo 2027 participant tracker") + ' · BelgradeBest'
    );
  }`,
  });
  return new Response(js, { headers: JS_HEADERS });
};
