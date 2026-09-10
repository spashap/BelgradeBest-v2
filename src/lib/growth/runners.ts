// Real upstream adapters for the Growth API, on top of the shared clients in
// lib/admin/analytics.ts. Server-only (import only from prerender=false routes).
import { ga4Client, gscRequest } from "../admin/analytics";
import type { Ga4Runner, Ga4Request, Ga4Report, GscRunner } from "./types.ts";

const BATCH = 5; // batchRunReports hard limit

function toApiRequest(r: Ga4Request) {
  return {
    dateRanges: [{ startDate: r.from, endDate: r.to }],
    ...(r.dimensions?.length ? { dimensions: r.dimensions.map((name) => ({ name })) } : {}),
    metrics: r.metrics.map((name) => ({ name })),
    ...(r.limit ? { limit: r.limit } : {}),
    ...(r.orderByMetricDesc ? { orderBys: [{ metric: { metricName: r.orderByMetricDesc }, desc: true }] } : {}),
    ...(r.filter
      ? {
          dimensionFilter: {
            orGroup: {
              expressions: r.filter.values.map((value) => ({
                filter: { fieldName: r.filter!.field, stringFilter: { matchType: r.filter!.matchType, value } },
              })),
            },
          },
        }
      : {}),
  };
}

export async function makeGa4Runner(): Promise<{ runner: Ga4Runner | null; reason?: string }> {
  const c = await ga4Client();
  if (!c.ok) return { runner: null, reason: c.reason };
  const runner: Ga4Runner = async (requests) => {
    const out: Ga4Report[] = [];
    for (let i = 0; i < requests.length; i += BATCH) {
      const chunk = requests.slice(i, i + BATCH);
      const [resp] = await c.client.batchRunReports({
        property: c.property,
        requests: chunk.map(toApiRequest),
      });
      const reports = resp.reports ?? [];
      for (let j = 0; j < chunk.length; j++) {
        const rep = reports[j];
        out.push({
          rows: (rep?.rows ?? []).map((row) => ({
            dims: (row.dimensionValues ?? []).map((d) => d.value ?? ""),
            metrics: (row.metricValues ?? []).map((m) => Number(m.value ?? 0) || 0),
          })),
        });
      }
    }
    return out;
  };
  return { runner };
}

export function makeGscRunner(): GscRunner {
  return async (req) => {
    const body: Record<string, unknown> = {
      startDate: req.from,
      endDate: req.to,
      rowLimit: req.rowLimit ?? 25,
    };
    if (req.dimensions?.length) body.dimensions = req.dimensions;
    if (req.pageRegex) {
      body.dimensionFilterGroups = [
        { filters: [{ dimension: "page", operator: "includingRegex", expression: req.pageRegex }] },
      ];
    }
    const res = await gscRequest(body);
    if (!res.ok) throw new Error(res.reason);
    return res.rows.map((r) => ({
      keys: r.keys ?? [],
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    }));
  };
}
