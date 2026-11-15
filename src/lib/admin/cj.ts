import { env } from "./env";

// CJ (Commission Junction) earnings for /admin/affiliates (added 2026-11-15).
// Reads the Commission Detail API with a Personal Access Token
// (developers.cj.com → Authentication → Personal Access Tokens) in
// CJ_PERSONAL_ACCESS_TOKEN; publisher (company) ID in CJ_PUBLISHER_ID, default
// the BelgradeBest account. Every link on the site carries a sub-ID
// (sid=bb-<placement>, lib/affiliates.ts), which CJ returns as `shopperId`, so
// earnings can be shown per placement. The API caps a query at 31 days.
// Server-only; degrades to a `reason` string.

export type CjRow = { sid: string; advertiser: string; commission: number; sale: number; status: string; date: string };
export type CjEarnings =
  | { configured: true; days: number; rows: CjRow[]; total: number; sales: number }
  | { configured: false; reason: string };

const CACHE = new Map<number, { at: number; v: CjEarnings }>();

export async function cjEarnings(days: number): Promise<CjEarnings> {
  const token = env("CJ_PERSONAL_ACCESS_TOKEN");
  if (!token) {
    return {
      configured: false,
      reason: "Set CJ_PERSONAL_ACCESS_TOKEN (CJ → developers.cj.com → Personal Access Tokens) in the Vercel environment.",
    };
  }
  const hit = CACHE.get(days);
  if (hit && Date.now() - hit.at < 30 * 60e3) return hit.v;
  const pub = env("CJ_PUBLISHER_ID") || "7672064";
  const span = Math.min(Math.max(days, 1), 31);
  const before = new Date();
  const since = new Date(before.getTime() - span * 864e5);
  const query = `{ publisherCommissions(forPublishers: ["${pub}"], sincePostingDate: "${since.toISOString().slice(0, 19)}Z", beforePostingDate: "${before.toISOString().slice(0, 19)}Z") { count records { actionStatus advertiserName postingDate pubCommissionAmountUsd saleAmountUsd shopperId } } }`;
  try {
    const res = await fetch("https://commissions.api.cj.com/query", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return { configured: false, reason: `CJ API ${res.status}: ${(await res.text()).slice(0, 160)}` };
    const json = (await res.json()) as {
      data?: { publisherCommissions?: { records?: Record<string, string | number | null>[] } };
      errors?: { message: string }[];
    };
    if (json.errors?.length) return { configured: false, reason: `CJ API: ${json.errors[0].message}` };
    const rows: CjRow[] = (json.data?.publisherCommissions?.records ?? []).map((r) => ({
      sid: String(r.shopperId ?? "") || "(no sub-ID)",
      advertiser: String(r.advertiserName ?? ""),
      commission: Number(r.pubCommissionAmountUsd ?? 0) || 0,
      sale: Number(r.saleAmountUsd ?? 0) || 0,
      status: String(r.actionStatus ?? ""),
      date: String(r.postingDate ?? "").slice(0, 10),
    }));
    const v: CjEarnings = {
      configured: true,
      days: span,
      rows,
      total: rows.reduce((s, r) => s + r.commission, 0),
      sales: rows.length,
    };
    CACHE.set(days, { at: Date.now(), v });
    return v;
  } catch (e) {
    return { configured: false, reason: `CJ API error: ${(e as Error).message}` };
  }
}
