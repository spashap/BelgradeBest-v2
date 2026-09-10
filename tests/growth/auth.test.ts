import { test } from "node:test";
import assert from "node:assert/strict";
import { handleSummary, handleChanges, handleContent } from "../../src/lib/growth/handlers.ts";
import { checkAuth } from "../../src/lib/growth/auth.ts";
import { deps, authed, TOKEN } from "./fakes.ts";

const URL_S = "https://belgradebest.com/api/growth/summary";

test("missing bearer → 401 with WWW-Authenticate", async () => {
  const res = await handleSummary(new Request(URL_S), deps());
  assert.equal(res.status, 401);
  assert.match(res.headers.get("www-authenticate") ?? "", /Bearer/);
  const body = await res.json();
  assert.equal(body.error, "unauthorized");
  assert.equal(body.data, undefined);
});

test("wrong bearer → 401 (all three endpoints)", async () => {
  for (const h of [handleSummary, handleChanges, handleContent]) {
    const res = await h(authed(URL_S, "nope"), deps());
    assert.equal(res.status, 401);
  }
});

test("admin cookie is not accepted as machine auth", async () => {
  const req = new Request(URL_S, { headers: { Cookie: "bb_admin=deadbeef" } });
  const res = await handleChanges(req, deps());
  assert.equal(res.status, 401);
});

test("token not configured → 503 safe failure, no data", async () => {
  for (const token of [undefined, "", "   "]) {
    const res = await handleSummary(authed(URL_S), deps({ token }));
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.error, "growth_api_not_configured");
    assert.ok(!("data" in body));
  }
});

test("valid bearer → 200; case-insensitive scheme; no-store", async () => {
  const req = new Request(URL_S, { headers: { authorization: `bearer ${TOKEN}` } });
  const res = await handleSummary(req, deps());
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "private, no-store");
});

test("read-only: POST refused", async () => {
  const req = new Request(URL_S, { method: "POST", headers: { Authorization: `Bearer ${TOKEN}` } });
  const res = await handleSummary(req, deps());
  assert.equal(res.status, 405);
});

test("checkAuth compares in constant time on digests (length mismatch still 401)", () => {
  const req = new Request(URL_S, { headers: { Authorization: `Bearer ${TOKEN}x` } });
  const a = checkAuth(req, TOKEN);
  assert.equal(a.ok, false);
  if (!a.ok) assert.equal(a.status, 401);
});
