import type { APIRoute } from "astro";
import { widgetScript, JS_HEADERS } from "../../lib/widget-js";
import { EXPO, SITE } from "../../lib/site";

// /widgets/expo-facts.js — Expo 2027 quick-facts card (dates, venue, theme,
// distances). Facts come from the site-config master at build time.
export const GET: APIRoute = () => {
  const js = widgetScript({
    header: `/* BelgradeBest — Expo 2027 quick facts (free embed).
 * <div data-bb-expo-facts></div>
 * <script src="${SITE.origin}/widgets/expo-facts.js" async><\/script>
 * Optional hex colors on the div: data-bg, data-fg, data-accent.
 * Facts are published by belgradebest.com and update with our site.
 * No cookies, no tracking. */`,
    attr: "data-bb-expo-facts",
    global: "BBExpoFacts",
    data: {
      dates: "15 May – 15 Aug 2027",
      days: "93 days",
      venue: `${EXPO.venue}, Belgrade`,
      theme: EXPO.theme,
      airport: "~5 km from the airport",
      centre: "~13.5 km from the centre",
      transit: "City transit currently free",
      url: `${SITE.origin}/expo-2027?utm_source=facts-widget&utm_medium=embed`,
    },
    render: `function render(el) {
    var t = theme(el);
    el.innerHTML = card(t, 340,
      eyebrow(t, "Expo 2027 Belgrade — quick facts") +
      '<div style="font-size:24px;font-weight:800;letter-spacing:-0.01em;line-height:1.15;margin-bottom:2px">' + DATA.dates + '</div>' +
      '<div style="font-size:13px;opacity:.75;margin-bottom:10px">' + esc(DATA.theme) + '</div>' +
      row(t, "Duration", DATA.days) +
      row(t, "Site", esc(DATA.venue)) +
      row(t, "Airport", DATA.airport) +
      row(t, "City centre", DATA.centre) +
      row(t, "Getting around", DATA.transit),
      'Full guide: ' + link(t, DATA.url, "Expo 2027 on BelgradeBest") + ''
    );
  }`,
  });
  return new Response(js, { headers: JS_HEADERS });
};
