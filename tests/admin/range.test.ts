import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveAdminRange,
  presetDates,
  compared,
  todayIn,
  fmtRange,
  DATA_START,
} from "../../src/lib/admin/range.ts";

// 20 Nov 2026, 10:00 UTC = 11:00 in Belgrade.
const NOW = new Date("2026-11-20T10:00:00Z");
const R = (q: string, now = NOW) => resolveAdminRange(new URLSearchParams(q), now);

test("default = the 28 full days ending yesterday, compared with the 28 before", () => {
  const r = R("");
  assert.equal(r.from, "2026-10-23");
  assert.equal(r.to, "2026-11-19");
  assert.equal(r.days, 28);
  assert.equal(r.prevFrom, "2026-09-25");
  assert.equal(r.prevTo, "2026-10-22");
  assert.equal(r.isToday, false);
  assert.equal(r.notice, null);
});

test("presets", () => {
  const t = "2026-11-20";
  assert.deepEqual(presetDates("today", t), { from: t, to: t });
  assert.deepEqual(presetDates("7d", t), { from: "2026-11-13", to: "2026-11-19" });
  assert.deepEqual(presetDates("90d", t), { from: "2026-08-22", to: "2026-11-19" });
  assert.deepEqual(presetDates("month", t), { from: "2026-11-01", to: t });
  assert.deepEqual(presetDates("lastmonth", t), { from: "2026-10-01", to: "2026-10-31" });
  // across a year boundary
  assert.deepEqual(presetDates("lastmonth", "2027-01-05"), { from: "2026-12-01", to: "2026-12-31" });
  // February in a non-leap year
  assert.deepEqual(presetDates("lastmonth", "2027-03-10"), { from: "2027-02-01", to: "2027-02-28" });
  for (const k of ["7d", "28d", "90d"] as const) assert.equal(compared(presetDates(k, t)).days, Number(k.slice(0, -1)));
});

test("explicit from/to is kept and compared with the equally long period before", () => {
  const r = R("from=2026-10-01&to=2026-10-31");
  assert.equal(r.days, 31);
  assert.equal(r.prevTo, "2026-09-30");
  assert.equal(r.prevFrom, "2026-08-31");
  assert.equal(r.notice, null);
});

test("today → hourly mode; a single past day is not 'today'", () => {
  const t = R("from=2026-11-20&to=2026-11-20");
  assert.equal(t.isToday, true);
  assert.equal(t.days, 1);
  assert.equal(t.prevFrom, "2026-11-19");
  const past = R("from=2026-11-10&to=2026-11-10");
  assert.equal(past.isToday, false);
  assert.equal(past.days, 1);
  assert.equal(past.prevTo, "2026-11-09");
});

test("bad input falls back to the default with a notice", () => {
  for (const q of [
    "from=2026-11-31&to=2026-11-19", // no such day
    "from=nope&to=2026-11-19",
    "from=2026-11-10&to=2026-11-01", // from after to
    "from=2026-11-01&to=2026-11-21", // future
    "from=2025-01-01&to=2025-02-01", // entirely before the data
  ]) {
    const r = R(q);
    assert.equal(r.from, "2026-10-23", q);
    assert.equal(r.to, "2026-11-19", q);
    assert.ok(r.notice && /default/.test(r.notice), q);
  }
});

test("a start before the GA4 data is clamped, not rejected", () => {
  const r = R("from=2026-01-01&to=2026-07-01");
  assert.equal(r.from, DATA_START);
  assert.equal(r.to, "2026-07-01");
  assert.ok(r.notice && r.notice.includes(DATA_START));
});

test("one-sided URLs: missing to = today, missing from = 28 days ending at to", () => {
  const a = R("from=2026-11-01");
  assert.equal(a.to, "2026-11-20");
  const b = R("to=2026-10-31");
  assert.equal(b.from, "2026-10-04");
  assert.equal(b.days, 28);
});

test("legacy ?days= links still work", () => {
  assert.equal(R("days=1").isToday, true);
  assert.equal(R("days=7").from, "2026-11-13");
  assert.equal(R("days=90").days, 90);
  assert.equal(R("days=5").days, 28);
});

test("'today' follows Belgrade, not UTC", () => {
  // 23:30 UTC on 20 Nov is already 00:30 on 21 Nov in Belgrade.
  const late = new Date("2026-11-20T23:30:00Z");
  assert.equal(todayIn(late), "2026-11-21");
  assert.equal(R("from=2026-11-21&to=2026-11-21", late).isToday, true);
});

test("labels", () => {
  assert.equal(fmtRange("2026-11-20", "2026-11-20"), "20 Nov 2026");
  assert.equal(fmtRange("2026-10-22", "2026-11-18"), "22 Oct – 18 Nov 2026");
  assert.equal(fmtRange("2026-12-28", "2027-01-03"), "28 Dec 2026 – 3 Jan 2027");
});
