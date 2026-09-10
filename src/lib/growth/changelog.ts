// growth/growth_changes.jsonl — the append-only growth change log.
//
// One JSON object per line. Parsed leniently (blank lines and lines starting
// with # are skipped; a malformed line is reported, not fatal) so a single bad
// append never takes the endpoint down. Entries are returned oldest → newest.

export type ChangeEntry = {
  id: string; // BB-CHG-NNNN
  timestamp: string; // ISO-8601 UTC
  category: string;
  title: string;
  reason: string;
  affected_area: string[];
  expected_metrics: string[];
  experiment_id: string | null;
  author: string;
  notes: string;
};

const ID_RE = /^BB-CHG-\d{4,}$/;
const REQUIRED: (keyof ChangeEntry)[] = ["id", "timestamp", "category", "title"];

export type ParsedChangelog = { entries: ChangeEntry[]; problems: string[] };

export function parseChangelog(text: string): ParsedChangelog {
  const entries: ChangeEntry[] = [];
  const problems: string[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t || t.startsWith("#")) return;
    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(t);
    } catch {
      problems.push(`line ${i + 1}: not valid JSON`);
      return;
    }
    for (const k of REQUIRED) {
      if (typeof obj[k] !== "string" || !(obj[k] as string).trim()) {
        problems.push(`line ${i + 1}: missing "${k}"`);
        return;
      }
    }
    if (!ID_RE.test(obj.id as string)) {
      problems.push(`line ${i + 1}: id "${obj.id}" is not BB-CHG-NNNN`);
      return;
    }
    if (Number.isNaN(new Date(obj.timestamp as string).getTime())) {
      problems.push(`line ${i + 1}: bad timestamp`);
      return;
    }
    const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);
    entries.push({
      id: obj.id as string,
      timestamp: obj.timestamp as string,
      category: obj.category as string,
      title: obj.title as string,
      reason: typeof obj.reason === "string" ? obj.reason : "",
      affected_area: arr(obj.affected_area),
      expected_metrics: arr(obj.expected_metrics),
      experiment_id: typeof obj.experiment_id === "string" ? obj.experiment_id : null,
      author: typeof obj.author === "string" ? obj.author : "",
      notes: typeof obj.notes === "string" ? obj.notes : "",
    });
  });
  entries.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp) || a.id.localeCompare(b.id));
  return { entries, problems };
}

export function changesSince(entries: ChangeEntry[], since: Date | null): ChangeEntry[] {
  if (!since) return entries;
  const t = since.getTime();
  return entries.filter((e) => Date.parse(e.timestamp) >= t);
}

// Next sequential id for an append (used by docs/tests; the log is edited by hand).
export function nextChangeId(entries: ChangeEntry[]): string {
  const max = entries.reduce((m, e) => Math.max(m, Number(e.id.slice("BB-CHG-".length)) || 0), 0);
  return `BB-CHG-${String(max + 1).padStart(4, "0")}`;
}
