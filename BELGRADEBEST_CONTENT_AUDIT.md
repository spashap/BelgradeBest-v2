# BelgradeBest — content audit, 13 September 2026

Commissioned to answer one question: **does a visitor get what they came for?**
Four external review rounds (GPT-6 Astra via Codex, as a web-marketing and content
strategist); all measurements taken from the repository, the live site, GA4 and
Bing Webmaster.

---

## 1. The headline

**17 articles had been serving incomplete since 22 June 2026.** Commit `e928564`
("Build /glossary knowledge-pages spoke set") silently dropped whole `##` sections.
Repair passes on 2 July and 7 August fixed only the articles that ended
mid-sentence. The rest ended on a clean full stop and passed every scan.

`/visit-belgrade/things-to-do-in-belgrade` offered **4 of its 10 attractions** — no
Skadarlija, no Zemun, no Ada Ciganlija, no Avala Tower. `best-restaurants` lost
**55%** of its body, `splavovi` 51%, `kafanas` 49%, `craft-beer` 48%.

**Restored: 84 sections, ~15,000 words, from revision `9645a97`.** Every edit made
since June was preserved — only missing sections were re-inserted, in their
original positions.

> **The lesson that shaped the fix:** a punctuation check cannot prove completeness.
> A section can vanish and leave a perfectly well-formed page. That is why three
> separate repair passes missed these.

## 2. The measurement was lying

Site-wide figures looked bad — 63% bounce, 1.39 pages/session, 70s. Split by
channel, they were three different websites:

| Channel | Sessions | Engaged | Pages/session | Duration |
|---|---:|---:|---:|---:|
| Direct | 147 | 17% | 1.15 | **14s** |
| Organic Social (Facebook) | 127 | 42% | 1.13 | 25s |
| **Organic Search** | **95** | **61%** | **1.58** | **156s** |

The bot signature is unambiguous: **Singapore·Direct — 64 sessions, exactly 1.00
pages, 0.07 seconds.** Plus US·Direct at 28 sessions, 3.07s. That is 92 sessions,
23% of all traffic, and it is the entire reason the average looked broken.

**Decision cohort** (Organic Search + AI + Referral, excluding Singapore):
**114 sessions, 56% engaged, 1.66 pages/session, 145s.** All judgements use this.

Two findings from it:

- **Two page shapes, not one.** `airport-to-city` and `visa-and-entry` get long
  reads and *exactly zero* onward clicks — task completion, not failure.
  `/expo-2027/pavilions` gets 4.57 pages/session, because browsing *is* its task.
  Judging the visa page by pages/session would have us "fix" a page that works.
- The food-and-nightlife pages that looked worst on engagement were the same pages
  missing half their content. Both causes were real; the second mattered more.

## 3. What was wrong, and what was done

| Finding | Action |
|---|---|
| 17 articles missing 84 sections | **Restored** from git, positions preserved |
| No guard against silent content loss | **Build-time gate** added (§4) |
| 422 FAQ answers (~27,000 words) marked up as `FAQPage`, rendered to nobody — and already contradicting the body | **Markup removed.** Google retired FAQ rich results 2026-05-07, so it bought nothing. Frontmatter kept as editorial source material |
| Homepage emitted FAQ schema even when its section was hidden | **Gated** on the same flag |
| Every article claimed "Source-checked by the BelgradeBest editorial process" — attached automatically to any dated page, with no visible sources | **Reduced to the date** |
| About claimed "every page is manually reviewed… nothing goes live unread" | **Rewritten truthfully**, including this incident and the new guard |
| Medical-tourism leg: premise doesn't hold, claims unsupported | **Withdrawn entirely** (§5) |
| 60 orphaned hero images shipping on every deploy | **Deleted** |

## 4. The guard

`src/lib/content-integrity.mjs`, run from `astro:build:start` — it **fails the
build**, so it cannot be forgotten. Two independent checks:

1. **Damage** — body ends without terminal punctuation, ends on a heading with no
   content, ends on a dangling function word, or contains an unclosed link.
2. **Shrinkage** — the body is >10% smaller than the size recorded in
   `src/data/content-integrity.json`.

The second check is the one that matters. Check 1 could never have caught the June
loss. Proven against all three failure modes: mid-word truncation, heading-with-no-
content, and silent section loss that ends cleanly.

**Deliberate cuts are fine — you just have to say so**, by committing a re-recorded
baseline:

```bash
node scripts/update-content-baseline.mjs
```

That makes shortening an article an explicit, reviewable act rather than an accident.

It lives in `src/lib/` deliberately, not `scripts/` — that directory is
`.vercelignore`'d and the gate would not run on deploys.

## 5. Medical tourism — withdrawn

Two independent reasons, either sufficient.

**Commercial:** owner research concluded Serbia is not competitive against Hungary,
Turkey or Moldova. The premise does not hold.

**Editorial:** the content made treatment-relevant claims it could not support —
a 20–60% saving called "realistic" with no citation; surgical capacity inferred
from domestic waiting-list length; "ISO" listed as an accreditation when ISO
develops standards and does not issue certificates; an unevidenced ranking of risks.
A "not medical advice" disclaimer does not repair an unsupported claim that
influences a treatment decision.

**Removed from public delivery, not noindexed** — a quarantined page still serves
the same guidance to anyone holding the link. Sitemap 157 → 141.

The 15 articles are preserved at `KB/withdrawn/medical-tourism/` with a README
recording the reasoning and what a defensible minimum would look like: **one page**
on travel logistics for someone already talking to qualified clinicians, linking out
to authoritative patient guidance. 4–8 hours plus specialist review. Fully
reversible.

## 6. What is working — do not break it

- **The ledes answer the query.** "Do you need a visa for Serbia? For most major
  nationalities the answer…" That is genuinely good and rarer than it sounds.
- **The confirmed / reported / unknown discipline is real** and catches things —
  it found four self-contradicting pavilion pages this week.
- **The National Days record** — authority, source, checked date, what the evidence
  establishes *and what it does not* — is the pattern the rest of the site should copy.

## 7. Workplan status

Everything on the workplan is done as of 13 September 2026, in this session.

| | Item | Outcome |
|---|---|---|
| ✅ 1 | Restore lost content + build gate | 84 sections restored; gate blocks damage **and** silent shrinkage |
| ✅ 2 | Withdraw medical tourism | Leg removed entirely; premise did not hold |
| ✅ 3 | Remove hidden FAQ markup | Article + homepage schema gone |
| ✅ 4 | Correct editorial promises | "Source-checked" byline and About claim fixed |
| ✅ 5 | Shorten arrival → answer | Practical first-section byte 6155 → **1758**; TOC pagination removed |
| ✅ 6 | `<main>` + skip link + footer labels | Every page type; skip link localised |
| ✅ 7 | Homepage re-ordered around tasks | Identity → 7 task routes → browse → compact Expo → credibility |
| ✅ 8 | Decision-point links | Dinars beside the cash-only fare; connectivity beside the data requirement; transfer costs beside the exchange warning |
| ✅ 9 | FAQ salvage on edited pages | All 15 already covered in body; duplicates deleted with the contradictory rail date |
| ↻ 11 | Monthly 20-minute review | A habit, not a commit |

**Checked and needing no change:** the 11 restored sections carrying prices. On
inspection every one already dated and bounded its own claim — *"indicative as of
2025–2026"*, *"an indicative example from 2024"*. That is the standard in §6
working correctly, not staleness.

### The standard worth keeping

Not a metric — a test:

> For each uncertain claim, say **what varies, what evidence supports it, and what
> the reader should do differently because of it.** If you cannot: investigate,
> narrow the claim, or delete it.

*"Prices vary, check before travelling"* fails it — nothing changes for the reader.
*"The A1 is about 400 RSD, cash only on board, checked June 2026 — here is where to
get dinars"* passes, **and it contains a hedge.** The problem is never hedging; it
is uncertainty that does not change an action. Apply it while editing a page, not
as a project.

**Withdrawn from this audit:** an earlier draft reported a median of 1.2 verifiable
facts per 1,000 words against 3.15 hedge words and called closing that gap the next
project. That does not hold. The "facts" regex counted only numeric expressions, so
*"bus 72 goes to Zeleni Venac"* scored zero; it rewarded repetition (the
airport article scored high partly by restating one fare three times); and hedges
are frequently the correct word. The clearest disproof came from this audit itself —
the hedgiest passages on the site, the restored price sections, were exactly right.
Two unrelated counts establish no correct ratio between them.

**Not doing:** rebrand, URL migration, site search, A/B testing at this volume,
recommendation engine, or auditing all 422 FAQ answers as a project.

---

> *Publish only what you can keep complete, substantiate and maintain — and make it
> easy for the reader to act on it.*
