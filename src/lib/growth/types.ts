// Upstream adapters the Growth API talks to. Both are plain functions so the
// handlers can be exercised in Node tests with fakes and never touch Google.

// ── GA4 ────────────────────────────────────────────────────────────────────
export type Ga4Filter = { field: string; matchType: "BEGINS_WITH" | "EXACT" | "CONTAINS"; values: string[] };
export type Ga4Request = {
  from: string; // YYYY-MM-DD
  to: string;
  dimensions?: string[];
  metrics: string[];
  limit?: number;
  orderByMetricDesc?: string;
  filter?: Ga4Filter; // OR over values on one field
};
export type Ga4Row = { dims: string[]; metrics: number[] };
export type Ga4Report = { rows: Ga4Row[] };
// Runs the requests (implementations batch them); throws on failure.
export type Ga4Runner = (requests: Ga4Request[]) => Promise<Ga4Report[]>;

// ── Search Console ─────────────────────────────────────────────────────────
export type GscRequest = {
  from: string;
  to: string;
  dimensions?: ("query" | "page" | "country" | "device")[];
  rowLimit?: number;
  pageRegex?: string; // includingRegex on the page dimension
};
export type GscRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };
export type GscRunner = (request: GscRequest) => Promise<GscRow[]>;

// ── Site facts available at request time without touching private fields ──
export type ListingCounts = {
  masters_total: number;
  published_top_level: number;
  published_children: number;
  claimed: number;
};

export type GrowthDeps = {
  token: string | undefined;
  now: () => Date;
  ga4: Ga4Runner | null; // null = not configured (reason in ga4Reason)
  ga4Reason?: string;
  gsc: GscRunner | null;
  gscReason?: string;
  changelogText: string;
  listingCounts: () => ListingCounts | null;
  leadCount: () => Promise<number | null>;
};
