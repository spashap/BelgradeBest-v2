# Light sweep — in-session subagents + owner Perplexity Deep Research, processed 2026-08-07

Method: a 3-agent light in-session sweep (tender winners / participants /
pavilion details) run directly in this session, cross-checked against a
focused owner-run Perplexity Deep Research pass. No dedicated Sonnet-subagent
drafting batch this cycle — this was a targeted top-up sweep, not a full
country batch like 2026-07-06.

## Key finds

- **Slovakia**: design-competition winner is EXPO LINE (Bratislava collective)
  with "Living Playground", €375,000 ex-VAT design contract (under the
  ~€414k estimate) — announced 9 Jul 2026 on ASB.sk. Folded into
  `src/data/listings/expo-2027/slovakia.json`.
- **Türkiye**: official notice confirms a 648 m² parcel (A5.1) and a National
  Day on 19 May 2027 — ticaret.gov.tr, 4 Jun 2026, verified by direct fetch
  (not just aggregator/search-snippet).
- **Serbia**: project team corroborated on aleatek.com (second independent
  source alongside prior official material).
- Official Expo 2027 participant count still holds at **139** — no change
  detected this sweep.
- **CERN**: confirmed as a participant — an international organisation, not a
  country — with its own exhibition space for the first time at any Expo.
  Source: vreme.com, 28 Jul 2026 (also corroborated on danas.rs). New listing:
  `src/data/listings/expo-2027/cern.json` (published — meets the thin-content
  guard).
- **Pošta Srbije**: confirmed as official sponsor + supplier (logistics:
  vehicle transport of promotional stands/materials, promotional support).
  Sources: tanjug.rs (2 Aug 2026 clarification) + connectingregion.com
  (4 Aug 2026). New listing: `src/data/listings/expo-2027/posta-srbije.json`
  (published).
- **Russia**: A-category pavilion, announced as one of the largest of the
  Expo (Deputy Minister Alexey Gruzdev, fomag.ru, 10 Mar 2026) — already
  reflected in `russia.json`.
- **Germany / facts and fiction**: Messe Düsseldorf holds overall/operational
  responsibility for the German Pavilion (972 m², "Play for Progress") as
  general commissioner for BMWE, announced 28 May 2026
  (messe-duesseldorf.com newsroom). Cologne agency **facts and fiction GmbH**
  does the content concept & cultural programme — new outreach-prospect stub:
  `src/data/listings/expo-2027/facts-and-fiction.json` (contact found via
  factsfiction.de: Kira Brucksch, project inquiries; Freya Paintner, press).

## Key not-founds (re-sweep next cycle)

- Korea / Turkmenistan / Germany sub-contractor winners beyond what's already
  on file.
- UAE and Russia pavilion operators/contractors (still unnamed publicly).
- North Macedonia commissioner (still unnamed).
- Corporate-area occupants — nothing new public.
- Exhibitor lists at the booth level — still not published anywhere.
- A National Day calendar beyond the single Türkiye date (19 May 2027) found
  this sweep.

## New listings this run

1. `src/data/listings/expo-2027/posta-srbije.json` — sponsor, published.
2. `src/data/listings/expo-2027/cern.json` — organization, published.
3. `src/data/listings/expo-2027/facts-and-fiction.json` — contractor,
   outreach-prospect stub (not published; thin-content guard correctly keeps
   it off public pages until there's more than a contact record).

## Watch list (update every run)

- Slovakia's winning pavilion **design visuals** (only the design-firm name
  and budget are public so far).
- Korea / Turkmenistan tender winners.
- UAE / Russia pavilion operator announcements.
- North Macedonia commissioner naming.
- Any additional National Day dates beyond Türkiye's 19 May 2027.
- Corporate-area occupant announcements.
