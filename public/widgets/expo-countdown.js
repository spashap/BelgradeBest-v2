/* BelgradeBest — Expo 2027 Belgrade countdown widget (free embed).
 * Usage (on any site):
 *   <script src="https://belgradebest.com/widgets/expo-countdown.js" async></script>
 * or, to control placement:
 *   <div data-bb-expo-countdown></div>
 *   <script src="https://belgradebest.com/widgets/expo-countdown.js" async></script>
 *
 * Self-contained by design: no external requests, no cookies, no tracking.
 * Colors are inlined (this runs on third-party pages with no access to the
 * BelgradeBest stylesheet). Attribution link is part of the free license.
 */
(function () {
  "use strict";
  var OPEN = new Date(2027, 4, 15); // 15 May 2027 (local time)
  var CLOSE = new Date(2027, 7, 15, 23, 59, 59); // 15 Aug 2027
  var LINK = "https://belgradebest.com/expo-2027?utm_source=countdown-widget&utm_medium=embed";
  var SCRIPT = document.currentScript; // captured now — null inside deferred callbacks

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
    el.innerHTML =
      '<div style="box-sizing:border-box;max-width:300px;background:#f7f3ec;border:1px solid #e2d8c9;border-radius:4px;padding:18px 20px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;color:#211b16;line-height:1.4">' +
      '<div style="font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#b5462b;margin-bottom:6px">Expo 2027 Belgrade</div>' +
      (s.num !== null
        ? '<div style="font-size:44px;font-weight:800;letter-spacing:-0.02em;color:#8f3621;line-height:1">' + s.num + "</div>"
        : "") +
      '<div style="font-size:14px;color:#6b5f54;margin-top:4px">' + s.label + "</div>" +
      '<div style="font-size:12px;color:#6b5f54;margin-top:10px;border-top:1px solid #e2d8c9;padding-top:8px">Countdown by <a href="' +
      LINK +
      '" target="_blank" rel="noopener" style="color:#8f3621;text-decoration:underline">BelgradeBest</a> — the honest English guide to Belgrade</div>' +
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
      // refresh hourly so a tab left open ticks over at midnight
      (function (el) {
        setInterval(function () { render(el); }, 36e5);
      })(targets[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
