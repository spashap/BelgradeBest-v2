// Shared wrapper for the embeddable data widgets (/widgets/*.js endpoints).
// THE CONCEPT: partners paste two lines; the script ships with our data BAKED
// IN at build time, so every site deploy refreshes every embed on every
// partner site — no client-side fetches, no cookies, no tracking. Colors are
// configurable via hex data-attributes (data-bg / data-fg / data-accent),
// sanitized in the script. Each script exposes window.<Global>.render(el) so
// the live preview on /for-businesses can re-render on control changes.
//
// The injected `render(el)` body can use these helpers (defined in the
// wrapper): theme(el), esc(s), eyebrow(t, txt), row(t, label, value),
// card(t, maxw, innerHtml, footHtml), link(t, href, label) — and `DATA`.

export type WidgetSpec = {
  header: string; // top-of-file comment (usage instructions)
  attr: string; // mount attribute, e.g. "data-bb-expo-stats"
  global: string; // window global, e.g. "BBExpoStats"
  data?: unknown; // baked-in data (JSON-serialized)
  render: string; // JS source defining `function render(el) { ... }`
};

export function widgetScript(w: WidgetSpec): string {
  return `${w.header}
(function () {
  "use strict";
  var DATA = ${JSON.stringify(w.data ?? null)};
  var HEX = /^#[0-9a-fA-F]{3,8}$/;
  function theme(el) {
    var d = el.dataset || {};
    return {
      bg: HEX.test(d.bg || "") ? d.bg : "#f7f3ec",
      fg: HEX.test(d.fg || "") ? d.fg : "#211b16",
      accent: HEX.test(d.accent || "") ? d.accent : "#b5462b"
    };
  }
  function esc(s) { return String(s).replace(/[<>&]/g, function (c) { return { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]; }); }
  function eyebrow(t, txt) { return '<div style="font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:' + t.accent + ';margin-bottom:6px">' + txt + '</div>'; }
  function row(t, label, value) { return '<div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;padding:4px 0;border-bottom:1px solid ' + t.fg + '14"><span style="opacity:.65">' + label + '</span><span style="font-weight:600;text-align:right">' + value + '</span></div>'; }
  function link(t, href, label) { return '<a href="' + href + '" target="_blank" rel="noopener" style="color:' + t.accent + ';text-decoration:underline">' + label + '</a>'; }
  function card(t, maxw, inner, foot) {
    return '<div style="box-sizing:border-box;max-width:' + maxw + 'px;background:' + t.bg + ';border:1px solid ' + t.fg + '26;border-top:4px solid ' + t.accent + ';border-radius:6px;padding:18px 20px;font-family:-apple-system,BlinkMacSystemFont,\\'Segoe UI\\',Roboto,Helvetica,Arial,sans-serif;color:' + t.fg + ';line-height:1.45">' + inner + '<div style="font-size:12px;opacity:.8;margin-top:12px;border-top:1px solid ' + t.fg + '26;padding-top:8px">' + foot + '</div></div>';
  }
  ${w.render}
  function mount() {
    var ts = document.querySelectorAll("[${w.attr}]:not([data-bb-rendered])");
    for (var i = 0; i < ts.length; i++) { ts[i].setAttribute("data-bb-rendered", "1"); render(ts[i]); }
  }
  window.${w.global} = { render: render };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
`;
}

export const JS_HEADERS = { "Content-Type": "application/javascript; charset=utf-8" };
