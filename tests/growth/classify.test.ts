import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyPath, normalisePath, isReportable } from "../../src/lib/growth/classify.ts";
import { platformOf } from "../../src/lib/growth/reports.ts";

test("normalisePath folds GA4 paths and GSC URLs onto one key", () => {
  assert.equal(normalisePath("https://belgradebest.com/expo-2027/pavilions/germany/"), "/expo-2027/pavilions/germany");
  assert.equal(normalisePath("http://www.belgradebest.com/about?utm_source=x#top"), "/about");
  assert.equal(normalisePath("/"), "/");
  assert.equal(normalisePath("expo-2027"), "/expo-2027");
});

test("classifyPath follows the real route architecture", () => {
  const c = (p: string) => classifyPath(p);
  assert.deepEqual(c("/"), { path: "/", content_type: "homepage", section: "home", lang: "en", expo: false });
  assert.equal(c("/visit-belgrade").content_type, "leg_hub");
  assert.equal(c("/visit-belgrade/zemun").content_type, "article");
  assert.equal(c("/visit-belgrade/zemun").section, "visit-belgrade");
  assert.equal(c("/medical-tourism/dental-work-belgrade").section, "medical-tourism");
  assert.equal(c("/expo-2027").content_type, "expo_hub");
  assert.equal(c("/expo-2027/tickets").content_type, "article");
  assert.equal(c("/expo-2027/tickets").expo, true);
  assert.equal(c("/expo-2027/tracker").content_type, "expo_data");
  assert.equal(c("/expo-2027/countdown").content_type, "expo_data");
  assert.equal(c("/expo-2027/pavilions").content_type, "listing_directory");
  assert.equal(c("/expo-2027/pavilions/germany").content_type, "listing");
  assert.equal(c("/expo-2027/pavilions/china/world-expo-museum").content_type, "listing_child");
  assert.equal(c("/areas").content_type, "area_hub");
  assert.equal(c("/areas/dorcol").content_type, "area");
  assert.equal(c("/glossary/kafana").content_type, "glossary");
  assert.equal(c("/about").content_type, "utility");
  assert.equal(c("/how-we-make-money").content_type, "utility");
  assert.equal(c("/for-businesses").content_type, "partner_landing");
  assert.equal(c("/rss.xml").content_type, "feed");
  assert.equal(c("/data/expo-2027-participants.json").content_type, "feed");
  assert.equal(c("/widgets/expo-stats.js").content_type, "widget");
  assert.equal(c("/invest-and-relocate/real-estate").content_type, "article");
  assert.equal(c("/something/else").content_type, "other");
});

test("German mirror keeps type and section, flags lang=de and expo", () => {
  const d = classifyPath("/de/expo-2027/pavilions/germany");
  assert.equal(d.lang, "de");
  assert.equal(d.content_type, "listing");
  assert.equal(d.section, "expo-2027");
  assert.equal(d.expo, true);
  assert.equal(classifyPath("/de/expo-2027").content_type, "expo_hub");
  assert.equal(classifyPath("/de/expo-2027/tickets").content_type, "article");
});

test("internal surfaces are never reportable", () => {
  for (const p of ["/admin", "/admin/analytics", "/api/growth/summary", "/manage?token=abc", "/404"]) {
    assert.equal(isReportable(classifyPath(p)), false, p);
  }
  assert.equal(isReportable(classifyPath("/expo-2027")), true);
});

test("platformOf buckets source/medium", () => {
  assert.equal(platformOf("(direct)", "(none)"), "direct");
  assert.equal(platformOf("m.facebook.com", "referral"), "facebook");
  assert.equal(platformOf("l.instagram.com", "referral"), "instagram");
  assert.equal(platformOf("reddit.com", "referral"), "reddit");
  assert.equal(platformOf("t.co", "referral"), "x");
  assert.equal(platformOf("google", "organic"), "google");
  assert.equal(platformOf("bing", "organic"), "bing");
  assert.equal(platformOf("duckduckgo", "organic"), "duckduckgo");
  assert.equal(platformOf("countdown-widget", "embed"), "embed_widget");
  assert.equal(platformOf("qr", "(not set)"), "qr");
  assert.equal(platformOf("copilot.com", "referral"), "ai_assistant");
  assert.equal(platformOf("chatgpt.com", "referral"), "ai_assistant");
  assert.equal(platformOf("example.org", "referral"), "referral");
  assert.equal(platformOf("newsletter", "email"), "email");
});
