import { env } from "./env";
import { ga4Client, type Ga4Overview } from "./analytics";
import { GA4_BOT_EXCLUSION } from "../bot-traffic";

// ── /admin/analytics TL;DR (added 2026-11-15) ────────────────────────────────
// The owner asked for conclusions, not tables to interpret. This module pulls
// the few extra numbers a decision needs (Bing Webmaster, GA4 engagement by
// landing page / language / device / source) and turns them into Verdict
// cards with rules a human can check. Every rule names its threshold here so
// a wrong-looking card can be traced, not trusted blindly.

// One TL;DR card (rendered by components/admin/Verdicts.astro).
export type Verdict = {
  tone: "good" | "bad" | "watch" | "info"; // keep doing / fix / not decidable yet / context
  label: string; // short topic, e.g. "Traffic"
  value: string; // the headline number
  line: string; // the conclusion in one sentence
  action?: string; // what to do about it
};

const num = (v: unknown) => Number(v ?? 0) || 0;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const signed = (x: number) => `${x > 0 ? "+" : ""}${Math.round(x * 100)}%`;
const change = (cur: number, prev: number) => (prev > 0 ? (cur - prev) / prev : null);

// Opportunistic warm-instance cache (same idea as the Growth API): Bing and
// the extra GA4 reports change slowly; 15 min keeps repeated refreshes cheap.
const CACHE = new Map<string, { at: number; v: unknown }>();
async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.v as T;
  const v = await fn();
  CACHE.set(key, { at: Date.now(), v });
  return v;
}

// ── Bing Webmaster Tools ─────────────────────────────────────────────────────
// Legacy JSON API (GetRankAndTrafficStats / GetPageStats / GetQueryStats) with
// BING_WEBMASTER_API_KEY. Bing is the site's live search channel (~6× Google),
// so it gets equal billing with Search Console.
export type BingRow = { key: string; clicks: number; impressions: number; ctr: number; position: number };
export type BingStats =
  | {
      configured: true;
      days: number;
      clicks: number;
      impressions: number;
      prevClicks: number;
      prevImpressions: number;
      daily: { date: string; clicks: number; impressions: number }[];
      pages: BingRow[];
      queries: BingRow[];
    }
  | { configured: false; reason: string };

const bingDate = (s: string) => new Date(Number(/\d+/.exec(s)?.[0] ?? 0));
type BingRaw = { Date: string; Clicks: number; Impressions: number; Query?: string; AvgImpressionPosition?: number; AvgClickPosition?: number };

async function bingCall(method: string, key: string, site: string): Promise<BingRaw[]> {
  const res = await fetch(
    `https://ssl.bing.com/webmaster/api.svc/json/${method}?apikey=${encodeURIComponent(key)}&siteUrl=${encodeURIComponent(site)}`,
  );
  if (!res.ok) throw new Error(`${method} ${res.status}`);
  return ((await res.json()) as { d?: BingRaw[] }).d ?? [];
}

function aggregate(rows: BingRaw[], from: Date, strip = ""): BingRow[] {
  const m = new Map<string, { c: number; i: number; posW: number }>();
  for (const r of rows) {
    if (bingDate(r.Date) < from || !r.Query) continue;
    const k = strip ? r.Query.replace(strip, "") || "/" : r.Query;
    const a = m.get(k) ?? { c: 0, i: 0, posW: 0 };
    a.c += r.Clicks;
    a.i += r.Impressions;
    a.posW += (r.AvgImpressionPosition ?? 0) * r.Impressions;
    m.set(k, a);
  }
  return [...m.entries()]
    .map(([key, a]) => ({ key, clicks: a.c, impressions: a.i, ctr: a.i ? a.c / a.i : 0, position: a.i ? a.posW / a.i : 0 }))
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
}

export function bingStats(days: number): Promise<BingStats> {
  return cached(`bing:${days}`, 15 * 60e3, async () => {
    const key = env("BING_WEBMASTER_API_KEY");
    if (!key) return { configured: false, reason: "Set BING_WEBMASTER_API_KEY (Bing Webmaster → Settings → API access) in the environment." };
    const site = env("BING_SITE_URL") || "https://belgradebest.com/";
    try {
      const [traffic, pages, queries] = await Promise.all([
        bingCall("GetRankAndTrafficStats", key, site),
        bingCall("GetPageStats", key, site),
        bingCall("GetQueryStats", key, site),
      ]);
      const span = Math.max(days, 1);
      const from = new Date(Date.now() - span * 864e5);
      const prevFrom = new Date(Date.now() - 2 * span * 864e5);
      let clicks = 0, impressions = 0, prevClicks = 0, prevImpressions = 0;
      const daily: { date: string; clicks: number; impressions: number }[] = [];
      for (const r of traffic) {
        const d = bingDate(r.Date);
        if (d >= from) {
          clicks += r.Clicks;
          impressions += r.Impressions;
          daily.push({ date: d.toISOString().slice(0, 10), clicks: r.Clicks, impressions: r.Impressions });
        } else if (d >= prevFrom) {
          prevClicks += r.Clicks;
          prevImpressions += r.Impressions;
        }
      }
      return {
        configured: true,
        days: span,
        clicks,
        impressions,
        prevClicks,
        prevImpressions,
        daily: daily.sort((a, b) => a.date.localeCompare(b.date)),
        pages: aggregate(pages, from, site.replace(/\/$/, "")),
        queries: aggregate(queries, from),
      };
    } catch (e) {
      return { configured: false, reason: `Bing Webmaster error: ${(e as Error).message}` };
    }
  });
}

// ── GA4 engagement cuts the verdicts need ───────────────────────────────────
export type Cut = { key: string; sessions: number; engaged: number; bounce: number; prevSessions: number };
export type Ga4Cuts =
  | { configured: true; landing: Cut[]; language: Cut[]; device: Cut[]; source: Cut[] }
  | { configured: false; reason: string };

export function ga4Cuts(days: number): Promise<Ga4Cuts> {
  return cached(`cuts:${days}`, 15 * 60e3, async () => {
    const c = await ga4Client();
    if (!c.ok) return { configured: false, reason: c.reason };
    const d = Math.max(days, 1);
    const ranges = [
      { startDate: `${d}daysAgo`, endDate: "today" },
      { startDate: `${d * 2}daysAgo`, endDate: `${d + 1}daysAgo` },
    ];
    const req = (dim: string, limit: number) => ({
      dateRanges: ranges,
      dimensions: [{ name: dim }],
      metrics: [{ name: "sessions" }, { name: "engagedSessions" }, { name: "bounceRate" }],
      dimensionFilter: GA4_BOT_EXCLUSION,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit,
    });
    try {
      const [resp] = await c.client.batchRunReports({
        property: c.property,
        requests: [req("landingPage", 60), req("language", 15), req("deviceCategory", 5), req("sessionSource", 20)],
      });
      const cut = (i: number): Cut[] => {
        const m = new Map<string, Cut>();
        for (const r of resp.reports?.[i]?.rows ?? []) {
          const k = r.dimensionValues?.[0]?.value || "(not set)";
          const range = r.dimensionValues?.[1]?.value ?? "date_range_0";
          const x = m.get(k) ?? { key: k, sessions: 0, engaged: 0, bounce: 0, prevSessions: 0 };
          if (range === "date_range_1") x.prevSessions = num(r.metricValues?.[0]?.value);
          else {
            x.sessions = num(r.metricValues?.[0]?.value);
            x.engaged = num(r.metricValues?.[1]?.value);
            x.bounce = num(r.metricValues?.[2]?.value);
          }
          m.set(k, x);
        }
        return [...m.values()].filter((x) => x.sessions > 0).sort((a, b) => b.sessions - a.sessions);
      };
      return { configured: true, landing: cut(0), language: cut(1), device: cut(2), source: cut(3) };
    } catch (e) {
      return { configured: false, reason: `GA4 error: ${(e as Error).message}` };
    }
  });
}

// ── The rules ───────────────────────────────────────────────────────────────
// Minimum samples: a page needs ≥12 sessions, a language ≥15, before any card
// speaks about it. Below that, numbers on a site this size are noise.
const MIN_PAGE = 12;
const MIN_LANG = 15;
const erate = (c: Cut) => (c.sessions ? c.engaged / c.sessions : 0);

export function buildVerdicts(
  days: number,
  ov: Ga4Overview,
  cuts: Ga4Cuts,
  bing: BingStats,
  googleClicks: number | null,
): Verdict[] {
  const out: Verdict[] = [];
  const period = days === 1 ? "today vs yesterday" : `${days} d vs the ${days} d before`;

  // 1. Traffic direction (sessions; ±10% = noise band).
  if (ov.configured) {
    const s = ov.kpis.sessions;
    const d = s.delta;
    out.push({
      tone: d === null ? "info" : d > 0.1 ? "good" : d < -0.1 ? "bad" : "watch",
      label: "Traffic",
      value: d === null ? String(s.value) : signed(d),
      line: `${Math.round(s.value)} sessions (${period}).${d !== null && Math.abs(d) <= 0.1 ? " Flat: within normal noise." : ""}`,
      action: d !== null && d < -0.1 ? "Check the Bing card below first: Bing drives most visits." : undefined,
    });
  }

  // 2. Search engines: Bing vs Google.
  if (bing.configured) {
    const ch = change(bing.clicks, bing.prevClicks);
    const ratio = googleClicks && googleClicks > 0 ? `${(bing.clicks / googleClicks).toFixed(0)}× Google` : "Google ≈ 0";
    out.push({
      tone: ch === null ? "info" : ch > 0.1 ? "good" : ch < -0.1 ? "bad" : "watch",
      label: "Bing search",
      value: `${bing.clicks} clicks`,
      line: `${ch === null ? "" : signed(ch) + " vs previous period · "}${bing.impressions.toLocaleString("en-US")} impressions · ${ratio}.`,
      action: "Bing is the channel: after shipping new pages run scripts/submit-to-bing.mjs.",
    });
    // 3. Biggest Bing CTR gap: many impressions, top-10 position, CTR < 2%.
    const gap = bing.pages
      .filter((p) => p.impressions >= 150 && p.position > 0 && p.position <= 10 && p.ctr < 0.02)
      .sort((a, b) => b.impressions - a.impressions)[0];
    if (gap)
      out.push({
        tone: "bad",
        label: "Wasted Bing impressions",
        value: pct(gap.ctr),
        line: `${gap.key}: ${gap.impressions} impressions at position ${gap.position.toFixed(1)} but only ${gap.clicks} clicks.`,
        action: "Rewrite that page's title + description so the snippet promises the answer.",
      });
  }

  if (cuts.configured) {
    // 4. Winner page: most engaged sessions, engagement ≥ 55%.
    const pages = cuts.landing.filter((c) => c.sessions >= MIN_PAGE && c.key !== "(not set)");
    const winner = [...pages].filter((c) => erate(c) >= 0.55).sort((a, b) => b.engaged - a.engaged)[0];
    if (winner)
      out.push({
        tone: "good",
        label: "Winning page",
        value: pct(erate(winner)),
        line: `${winner.key}: ${winner.sessions} landings, ${pct(erate(winner))} engaged${winner.prevSessions ? ` (was ${winner.prevSessions} landings)` : ""}.`,
        action: "Add 2–3 pages on the same topic and translate this one (DE first).",
      });
    // 5. Leaking page: biggest landing with bounce ≥ 65%.
    const leak = pages.filter((c) => c.bounce >= 0.65 && c !== winner).sort((a, b) => b.sessions - a.sessions)[0];
    if (leak)
      out.push({
        tone: "bad",
        label: "Leaking page",
        value: pct(leak.bounce),
        line: `${leak.key}: ${leak.sessions} landings, ${pct(leak.bounce)} leave without engaging.`,
        action: "Put the direct answer in the first screen; check it matches the search that brings people.",
      });

    // 6. Best audience by language vs English.
    const en = cuts.language.find((c) => c.key === "English");
    const best = cuts.language
      .filter((c) => c.key !== "English" && c.key !== "(not set)" && c.sessions >= MIN_LANG)
      .sort((a, b) => erate(b) - erate(a))[0];
    if (best && en && erate(best) > erate(en))
      out.push({
        tone: "good",
        label: "Best audience",
        value: best.key,
        line: `${best.sessions} sessions, ${pct(erate(best))} engaged vs English ${pct(erate(en))}${best.prevSessions ? ` · was ${best.prevSessions} sessions` : ""}.`,
        action: `Translate the winning pages into ${best.key} first.`,
      });

    // 7. Mobile gap (≥15 points worse than desktop).
    const mob = cuts.device.find((c) => c.key === "mobile");
    const desk = cuts.device.find((c) => c.key === "desktop");
    if (mob && desk && mob.sessions >= 20) {
      const gapPts = erate(desk) - erate(mob);
      out.push({
        tone: gapPts > 0.15 ? "bad" : gapPts > 0.07 ? "watch" : "good",
        label: "Mobile",
        value: pct(erate(mob)),
        line: `Mobile ${pct(erate(mob))} engaged vs desktop ${pct(erate(desk))} (${mob.sessions} mobile sessions).`,
        action: gapPts > 0.15 ? "Test the top landing pages on a phone: first screen, speed, tap targets." : undefined,
      });
    }

    // 7b. Translated editions (/de, /sk, /cs) vs English, by landing page prefix.
    const pref = (p: string) => (/^\/(de|sk|cs)(\/|$)/.exec(p)?.[1] ?? "en");
    const ed = new Map<string, { s: number; e: number }>();
    for (const c of cuts.landing) {
      if (c.key === "(not set)") continue;
      const k = pref(c.key);
      const x = ed.get(k) ?? { s: 0, e: 0 };
      x.s += c.sessions;
      x.e += c.engaged;
      ed.set(k, x);
    }
    const enEd = ed.get("en");
    const tr = ["de", "sk", "cs"].map((k) => ({ k, ...(ed.get(k) ?? { s: 0, e: 0 }) })).filter((x) => x.s > 0);
    if (tr.length && enEd) {
      const best = [...tr].sort((a, b) => b.s - a.s)[0];
      const rate = (x: { s: number; e: number }) => (x.s ? x.e / x.s : 0);
      out.push({
        tone: rate(best) > rate(enEd) ? "good" : "watch",
        label: "Translated editions",
        value: tr.map((x) => `${x.k.toUpperCase()} ${x.s}`).join(" · "),
        line: `Landings on translated pages, ${tr.map((x) => `${x.k.toUpperCase()} ${pct(rate(x))} engaged`).join(", ")} vs English ${pct(rate(enEd))}.`,
        action: rate(best) > rate(enEd) ? "Translated readers engage more: translate the next winning page." : undefined,
      });
    }

    // 8. Noise: a big source that almost never engages (<15%).
    const noise = cuts.source.filter((c) => c.sessions >= 30 && erate(c) < 0.15).sort((a, b) => b.sessions - a.sessions)[0];
    if (noise)
      out.push({
        tone: "info",
        label: "Ignore this traffic",
        value: String(noise.sessions),
        line: `${noise.key}: ${noise.sessions} sessions, only ${pct(erate(noise))} engaged. It inflates the totals, not the audience.`,
      });
  }
  return out;
}
