import { env } from "./env";
import type { Period } from "../growth/dates";

// CJ (Commission Junction) earnings for /admin/affiliates (added 2026-11-15).
// Reads the Commission Detail API with a Personal Access Token
// (developers.cj.com → Authentication → Personal Access Tokens) in
// CJ_PERSONAL_ACCESS_TOKEN; publisher (company) ID in CJ_PUBLISHER_ID (CJ company ID, LitoCreative 7995454), default
// the BelgradeBest account. Every link on the site carries a sub-ID
// (sid=bb-<placement>, lib/affiliates.ts), which CJ returns as `shopperId`, so
// earnings can be shown per placement. The API caps a query at 31 days, so a
// longer period is asked for in 31-day slices (in parallel) and joined.
// Server-only; degrades to a `reason` string.

export type CjRow = { sid: string; advertiser: string; commission: number; sale: number; status: string; date: string };
export type CjEarnings =
  | { configured: true; days: number; rows: CjRow[]; total: number; sales: number }
  | { configured: false; reason: string };

const DAY = 864e5;
const MAX_SLICE = 31 * DAY;
const CACHE = new Map<string, { at: number; v: CjEarnings }>();
const iso = (d: Date) => d.toISOString().slice(0, 19) + "Z";

// `span`: trailing days up to now, or an explicit from/to period (whole UTC
// days; a period ending today stops at now — CJ refuses future dates).
export async function cjEarnings(span: number | Period): Promise<CjEarnings> {
  const token = env("CJ_PERSONAL_ACCESS_TOKEN") || env("CJ_TOKEN");
  if (!token) {
    return {
      configured: false,
      reason: "Set CJ_TOKEN (your CJ Personal Access Token, developers.cj.com) in the Vercel environment.",
    };
  }
  const key = typeof span === "number" ? `d${span}` : `${span.from}:${span.to}`;
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.at < 30 * 60e3) return hit.v;
  const pub = env("CJ_PUBLISHER_ID") || "7995454";
  const now = Date.now();
  const days = typeof span === "number" ? Math.max(span, 1) : span.days;
  const since = typeof span === "number" ? now - days * DAY : Date.parse(`${span.from}T00:00:00Z`);
  const before = typeof span === "number" ? now : Math.min(Date.parse(`${span.to}T00:00:00Z`) + DAY, now);
  const slices: [number, number][] = [];
  for (let s = since; s < before; s += MAX_SLICE) slices.push([s, Math.min(s + MAX_SLICE, before)]);
  try {
    const parts = await Promise.all(slices.map(([s, b]) => cjSlice(token, pub, new Date(s), new Date(b))));
    const failed = parts.find((p): p is { error: string } => "error" in p);
    if (failed) return { configured: false, reason: failed.error };
    const rows = parts.flatMap((p) => ("rows" in p ? p.rows : []));
    const v: CjEarnings = {
      configured: true,
      days,
      rows,
      total: rows.reduce((s, r) => s + r.commission, 0),
      sales: rows.length,
    };
    CACHE.set(key, { at: Date.now(), v });
    return v;
  } catch (e) {
    return { configured: false, reason: `CJ API error: ${(e as Error).message}` };
  }
}

async function cjSlice(token: string, pub: string, since: Date, before: Date): Promise<{ rows: CjRow[] } | { error: string }> {
  const query = `{ publisherCommissions(forPublishers: ["${pub}"], sincePostingDate: "${iso(since)}", beforePostingDate: "${iso(before)}") { count records { actionStatus advertiserName postingDate pubCommissionAmountUsd saleAmountUsd shopperId } } }`;
  const res = await fetch("https://commissions.api.cj.com/query", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) return { error: `CJ API ${res.status}: ${(await res.text()).slice(0, 160)}` };
  const json = (await res.json()) as {
    data?: { publisherCommissions?: { records?: Record<string, string | number | null>[] } };
    errors?: { message: string }[];
  };
  if (json.errors?.length) return { error: `CJ API: ${json.errors[0].message}` };
  return {
    rows: (json.data?.publisherCommissions?.records ?? []).map((r) => ({
      sid: String(r.shopperId ?? "") || "(no sub-ID)",
      advertiser: String(r.advertiserName ?? ""),
      commission: Number(r.pubCommissionAmountUsd ?? 0) || 0,
      sale: Number(r.saleAmountUsd ?? 0) || 0,
      status: String(r.actionStatus ?? ""),
      date: String(r.postingDate ?? "").slice(0, 10),
    })),
  };
}
