import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseChangelog, changesSince, nextChangeId } from "../../src/lib/growth/changelog.ts";
import { handleChanges } from "../../src/lib/growth/handlers.ts";
import { deps, authed, CHANGELOG } from "./fakes.ts";

test("parseChangelog keeps valid lines, reports bad ones, sorts oldest → newest", () => {
  const { entries, problems } = parseChangelog(CHANGELOG);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].id, "BB-CHG-0001");
  assert.equal(entries[1].experiment_id, "exp-1");
  assert.equal(problems.length, 2);
  assert.equal(nextChangeId(entries), "BB-CHG-0003");
});

test("changesSince filters inclusively", () => {
  const { entries } = parseChangelog(CHANGELOG);
  assert.equal(changesSince(entries, new Date("2026-09-05T10:00:00Z")).length, 1);
  assert.equal(changesSince(entries, new Date("2026-09-05T10:00:01Z")).length, 0);
  assert.equal(changesSince(entries, null).length, 2);
});

test("GET /changes envelope + since + warnings", async () => {
  const res = await handleChanges(authed("https://x/api/growth/changes?since=2026-09-02T00:00:00Z"), deps());
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.schema_version, "1");
  assert.equal(body.project, "belgradebest");
  assert.equal(body.period.timezone, "UTC");
  assert.equal(body.data.count, 1);
  assert.equal(body.data.changes[0].id, "BB-CHG-0002");
  assert.equal(body.data_quality.status, "ok");
  assert.ok(body.data_quality.warnings.some((w: string) => w.startsWith("Change log:")));
  const text = JSON.stringify(body);
  assert.doesNotMatch(text, /github|GITHUB_TOKEN|sha/i);
});

test("GET /changes without since returns everything; bad since → 400", async () => {
  const all = await (await handleChanges(authed("https://x/api/growth/changes"), deps())).json();
  assert.equal(all.data.count, 2);
  const bad = await handleChanges(authed("https://x/api/growth/changes?since=yesterday"), deps());
  assert.equal(bad.status, 400);
});

test("the real growth/growth_changes.jsonl parses cleanly with sequential ids", () => {
  const text = readFileSync(new URL("../../growth/growth_changes.jsonl", import.meta.url), "utf8");
  const { entries, problems } = parseChangelog(text);
  assert.deepEqual(problems, []);
  assert.ok(entries.length >= 1);
  entries.forEach((e, i) => assert.equal(e.id, `BB-CHG-${String(i + 1).padStart(4, "0")}`));
});
