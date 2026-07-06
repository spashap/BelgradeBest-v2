/* BelgradeBest — Expo 2027 Belgrade countdown widget (free embed).
 * Usage (on any site):
 *   <div data-bb-expo-countdown></div>
 *   <script src="https://belgradebest.com/widgets/expo-countdown.js" async></script>
 * Optional color attributes on the div (hex): data-bg, data-fg, data-accent.
 *
 * Self-contained by design: no external requests, no cookies, no tracking.
 * The attribution link is the free license. window.BBExpoCountdown.render(el)
 * re-renders a mount (used by the live preview on belgradebest.com/for-businesses).
 */
(function () {
  "use strict";
  var OPEN = new Date(2027, 4, 15); // 15 May 2027 (local time)
  var CLOSE = new Date(2027, 7, 15, 23, 59, 59); // 15 Aug 2027
  var LINK = "https://belgradebest.com/expo-2027?utm_source=countdown-widget&utm_medium=embed";
  var SCRIPT = document.currentScript;
  var HEX = /^#[0-9a-fA-F]{3,8}$/;

  function theme(el) {
    var d = el.dataset || {};
    return {
      bg: HEX.test(d.bg || "") ? d.bg : "#f7f3ec",
      fg: HEX.test(d.fg || "") ? d.fg : "#211b16",
      accent: HEX.test(d.accent || "") ? d.accent : "#b5462b",
    };
  }

  function state() {
    var now = new Date();
    if (now > CLOSE) return { num: null, label: "Expo 2027 Belgrade has ended" };
    if (now >= OPEN) {
      var left = Math.ceil((CLOSE - now) / 864e5);
      return { num: left, label: "day" + (left === 1 ? "" : "s") + " left · open until 15 Aug 2027" };
    }
    var days = Math.ceil((OPEN - now) / 864e5);
    return { num: days, label: "day" + (days === 1 ? "" : "s") + " until opening · 15 May 2027" };
  }

  function render(el) {
    var s = state();
    var t = theme(el);
    el.innerHTML =
      '<div style="box-sizing:border-box;max-width:300px;background:' + t.bg + ";border:1px solid " + t.fg + '26;border-top:4px solid ' + t.accent + ';border-radius:6px;padding:18px 20px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;color:' + t.fg + ';line-height:1.4">' +
      '<div style="font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:' + t.accent + ';margin-bottom:6px">Expo 2027 Belgrade</div>' +
      (s.num !== null
        ? '<div style="font-size:44px;font-weight:800;letter-spacing:-0.02em;color:' + t.fg + ';line-height:1">' + s.num + "</div>"
        : "") +
      '<div style="font-size:14px;opacity:.75;margin-top:4px">' + s.label + "</div>" +
      '<div style="font-size:12px;opacity:.75;margin-top:10px;border-top:1px solid ' + t.fg + '26;padding-top:8px">Countdown by <a href="' + LINK + '" target="_blank" rel="noopener" style="color:' + t.accent + ';text-decoration:underline">BelgradeBest</a> — the honest English guide to Belgrade</div>' +
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
