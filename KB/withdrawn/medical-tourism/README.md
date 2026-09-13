# Withdrawn: medical-tourism articles (2026-09-13)

These 15 articles were removed from public delivery, not deleted. To restore any
of them: move the `.md` back to `src/content/articles/medical-tourism/`, flip the
leg's `visible`/`noindex` in `src/data/site-schema.json`, and re-run
`node scripts/update-content-baseline.mjs`.

## Why they came down

They made consequential claims about medical treatment that the site could not
substantiate, in a subject area where being wrong has real costs:

- The overview called a **20–60% saving "realistic"** with no citation attached
  to that claim.
- `major-surgery-in-belgrade` inferred **surgical capacity and routine experience
  from domestic waiting-list length**. A queue establishes neither.
- `choosing-a-clinic-in-belgrade` listed **"ISO" as an accreditation**. ISO develops
  standards; it does not issue certificates. A useful answer needs the specific
  standard, the certifying body, the scope and the validity period.
- `medical-tourism-risks-and-aftercare` ranked risks ("the biggest risk is rarely
  the operation itself") without evidence for the ranking.

A "not medical advice" disclaimer does not fix an unsupported claim that
influences a treatment decision.

## What would bring it back

Not a rewrite of the same fifteen pages. The defensible minimum is **one page**
covering travel logistics for someone already in conversation with qualified
clinicians — reaching a verified address, what to confirm about accommodation,
getting a written quote, records and aftercare questions to take to a doctor —
linking out to authoritative patient guidance (e.g. CDC Yellow Book) rather than
giving clinical guidance itself. Estimated 4–8 hours plus any specialist review
for retained clinical or regulatory claims.

Monetisation can still sit on accommodation and transport, disclosed. What does
not come back without funded, accountable review is the clinic-referral
proposition.
