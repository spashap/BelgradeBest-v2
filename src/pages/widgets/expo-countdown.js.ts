import type { APIRoute } from "astro";
import { JS_HEADERS } from "../../lib/widget-js";
import LABELS from "../../data/countdown-labels.json";

// /widgets/expo-countdown.js — the Expo 2027 countdown embed, in every language
// of src/data/countdown-labels.json (the same master the WordPress plugin in
// wp-plugin/ copies, so the two can't disagree). Self-contained: no requests,
// no cookies, no tracking. The credit link is nofollow (see lib/widget-js.ts
// for why) and optional — embedding is not conditional on keeping it.
const DATA = {
  open: LABELS.open,
  close: LABELS.close,
  origin: LABELS.origin,
  hub: LABELS.hub,
  L: LABELS.languages,
};

const LANGS = Object.keys(LABELS.languages).join(", ");

const JS = `/* BelgradeBest — Expo 2027 Belgrade countdown widget (free embed).
 * Usage (on any site):
 *   <div data-bb-expo-countdown></div>
 *   <script src="${LABELS.origin}/widgets/expo-countdown.js" async><\/script>
 * Optional data-lang on the div: ${LANGS}.
 *   Without it the widget follows the host page's <html lang>, else English.
 * Optional hex colors on the div: data-bg, data-fg, data-accent.
 *
 * Self-contained by design: no external requests, no cookies, no tracking.
 * The small credit link is welcome but optional, and nofollow.
 * window.BBExpoCountdown.render(el) re-renders a mount (used by the live
 * preview on belgradebest.com/for-businesses).
 */
(function () {
  "use strict";
  var D = ${JSON.stringify(DATA)};
  var SCRIPT = document.currentScript;
  var HEX = /^#[0-9a-fA-F]{3,8}$/;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function theme(el) {
    var d = el.dataset || {};
    return {
      bg: HEX.test(d.bg || "") ? d.bg : "#f7f3ec",
      fg: HEX.test(d.fg || "") ? d.fg : "#211b16",
      accent: HEX.test(d.accent || "") ? d.accent : "#b5462b"
    };
  }

  // data-lang wins; otherwise the host page's language; otherwise English.
  function lang(el) {
    var want = (el.dataset || {}).lang || document.documentElement.getAttribute("lang") || "en";
    var l = String(want).toLowerCase().slice(0, 2);
    return D.L[l] ? l : "en";
  }

  // Plural slot: 0 for 1, 1 for 2-4 in Slovak/Czech, 2 otherwise.
  function form(l, n) {
    if (n === 1) return 0;
    if ((l === "sk" || l === "cs") && n >= 2 && n <= 4) return 1;
    return 2;
  }

  function day(s) {
    var p = s.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  // Whole calendar days, counted between local midnights (Math.round absorbs
  // the daylight-saving hour).
  function state(l, L) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var open = day(D.open), close = day(D.close);
    if (today > close) return { num: null, label: L.ended };
    if (today >= open) {
      var left = Math.round((close - today) / 864e5) + 1;
      return { num: left, label: L.left[form(l, left)] + " · " + L.leftNote };
    }
    var days = Math.round((open - today) / 864e5);
    return { num: days, label: L.until[form(l, days)] + " · " + L.untilNote };
  }

  function render(el) {
    var l = lang(el);
    var L = D.L[l];
    var s = state(l, L);
    var t = theme(el);
    var href = D.origin + (D.hub[l] || D.hub.en) + "?utm_source=countdown-widget&utm_medium=embed";
    var caps = L.caps ? "letter-spacing:.1em;text-transform:uppercase;" : "";
    var aria = L.title + ": " + (s.num !== null ? s.num + " " : "") + s.label;
    // role/aria-label: screen readers announce the card as one unit; lang and
    // dir so each language is voiced and laid out correctly inside a page in
    // another language (Arabic runs right to left).
    el.innerHTML =
      '<div role="group" lang="' + l + '" dir="' + L.dir + '" aria-label="' + esc(aria) + '" style="box-sizing:border-box;max-width:300px;background:' + t.bg + ";border:1px solid " + t.fg + '26;border-top:4px solid ' + t.accent + ';border-radius:6px;padding:18px 20px;font-family:-apple-system,BlinkMacSystemFont,\\'Segoe UI\\',Roboto,Helvetica,Arial,sans-serif;color:' + t.fg + ';line-height:1.4">' +
      '<div style="font-size:11px;font-weight:600;' + caps + 'color:' + t.accent + ';margin-bottom:6px">' + esc(L.title) + "</div>" +
      (s.num !== null
        ? '<div style="font-size:44px;font-weight:800;letter-spacing:-0.02em;color:' + t.fg + ';line-height:1">' + s.num + "</div>"
        : "") +
      '<div style="font-size:14px;opacity:.75;margin-top:4px">' + esc(s.label) + "</div>" +
      '<div style="font-size:12px;opacity:.75;margin-top:10px;border-top:1px solid ' + t.fg + '26;padding-top:8px">' + esc(L.by) + '<a href="' + esc(href) + '" target="_blank" rel="nofollow noopener" style="color:' + t.accent + ';text-decoration:underline">BelgradeBest</a>' + esc(L.tagline) + "</div>" +
      "</div>";
  }

  function mount() {
    var targets = document.querySelectorAll("[data-bb-expo-countdown]:not([data-bb-rendered])");
    if (!targets.length) {
      var here = SCRIPT;
      if (!here || !here.parentNode) return;
      var div = document.createElement("div");
      div.setAttribute("data-bb-expo-countdown", "");
      here.parentNode.insertBefore(div, here);
      targets = [div];
    }
    for (var i = 0; i < targets.length; i++) {
      targets[i].setAttribute("data-bb-rendered", "1");
      render(targets[i]);
      (function (el) {
        setInterval(function () { render(el); }, 36e5);
      })(targets[i]);
    }
  }

  window.BBExpoCountdown = { render: render };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
`;

export const GET: APIRoute = () => new Response(JS, { headers: JS_HEADERS });
