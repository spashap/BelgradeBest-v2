// The common response envelope every /api/growth/* endpoint returns.
//
// {
//   schema_version, project, generated_at, period{from,to,timezone},
//   data_quality{status, warnings, sources}, data
// }
//
// `sources` is an addition to the contract: per upstream service it says
// "ok" | "cached" | "unavailable" | "not_applicable", so a consumer can tell a
// fresh GA4 pull from a warm-instance cache hit or a failed call.

export const SCHEMA_VERSION = "1";
export const PROJECT = "belgradebest";

export type SourceState = "ok" | "cached" | "unavailable" | "not_applicable";

export class DataQuality {
  readonly warnings: string[] = [];
  readonly sources: Record<string, SourceState> = {};
  private degraded = false;

  warn(msg: string): void {
    if (!this.warnings.includes(msg)) this.warnings.push(msg);
  }
  // A missing upstream makes the response "partial"; an informational
  // limitation (no conversions, no post-level attribution) does not.
  unavailable(source: string, msg: string): void {
    this.sources[source] = "unavailable";
    this.degraded = true;
    this.warn(msg);
  }
  ok(source: string, cached = false): void {
    this.sources[source] = cached ? "cached" : "ok";
  }
  notApplicable(source: string): void {
    this.sources[source] = "not_applicable";
  }
  get status(): "ok" | "partial" {
    return this.degraded ? "partial" : "ok";
  }
  toJSON() {
    return { status: this.status, warnings: [...this.warnings], sources: { ...this.sources } };
  }
}

export type Envelope<T> = {
  schema_version: string;
  project: string;
  generated_at: string;
  period: { from: string; to: string; timezone: "UTC" };
  data_quality: { status: "ok" | "partial"; warnings: string[]; sources: Record<string, SourceState> };
  data: T;
};

export function envelope<T>(args: { from: string; to: string; now: Date; quality: DataQuality; data: T }): Envelope<T> {
  return {
    schema_version: SCHEMA_VERSION,
    project: PROJECT,
    generated_at: args.now.toISOString(),
    period: { from: args.from, to: args.to, timezone: "UTC" },
    data_quality: args.quality.toJSON(),
    data: args.data,
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Responses are per-token and may hold a warm cache already; never let
      // a CDN or browser cache them.
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export function badRequest(message: string): Response {
  return jsonResponse({ error: "bad_request", message }, 400);
}
