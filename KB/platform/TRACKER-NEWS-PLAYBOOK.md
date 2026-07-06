# Tracker-as-news-source playbook — earning links from Expo announcements

**The idea:** every Expo 2027 announcement (new country confirmed, pavilion
plan published, sponsor named) is a small news event. Journalists covering it
need a source for "how many are confirmed now" and "who else is in" — our
tracker (`/expo-2027/tracker`) and pavilion pages are built to be that source.
Each cycle = fresh content + a pitch to whoever covered the announcement.

## The repeatable cycle (run within 24h of an announcement)

1. **Update the data same-day.** New country → add to
   `src/data/expo-participants.json` (participants + timeline row + officialCount
   if the counter moved), bump `updated`. Pavilion news → update/create the
   pavilion listing (facts + source), bump `updated`. Push. (Claude does this
   on request: "country X confirmed — update the tracker".)
2. **Find who covered it.** Google News / X search for the announcement within
   the last 48h. Serbian outlets (Tanjug, eKapija, N1, Biznis.rs), the country's
   own press, BIE newsletter followers, expo-community blogs.
3. **Pitch** (template below) — to the article's author if named, else the
   newsroom address. ≤5 pitches per cycle; personalised first line ALWAYS.
4. **Log it** in the outreach Queue if the outlet matters long-term (create a
   listing-style prospect under partners-and-suppliers with type "press" only
   for recurring targets — not for one-offs).

## Pitch template (short, useful, no ask beyond the link)

> Subject: Full Expo 2027 participant list to go with your {country} story
>
> Hi {name},
>
> Saw your piece on {country} joining Expo 2027. In case it's useful for
> follow-ups: we maintain the independent participant tracker for the event —
> the official count, every publicly named country by region, confirmation
> dates and a growth timeline, each fact linked to its source:
>
> https://belgradebest.com/expo-2027/tracker
>
> The raw data is also downloadable as JSON, free to cite with attribution.
> We update it the day announcements land, and we keep sourced profiles of
> each national pavilion (theme, design, budget) at
> https://belgradebest.com/expo-2027/pavilions.
>
> If you cover the Expo regularly, happy to flag notable changes as they
> happen — no newsletter, just a short note when something moves.
>
> {owner sign-off}

## Why this works (and what not to do)

- The tracker answers the exact question every announcement story raises
  ("how many now?") better than the official site (which publishes a partial,
  duplicated list). Usefulness earns the citation; no link begging.
- The "happy to flag changes" line builds a journalist list over time — the
  compounding asset. Keep a simple list of who responded in the Queue notes.
- Do NOT mass-mail. 5 personalised pitches per news cycle maximum.
- Do NOT pitch stories we didn't update for — data freshness is the product.

## Hooks calendar (what will generate cycles)

- Each new country confirmation (rolling, ~monthly) — smallest hook, easiest.
- Pavilion plan/design reveals (Germany build, Japan design, USA design…).
- Sponsor announcements (next tiers after Telekom/Air Serbia).
- Milestones: 150th participant, one-year-out (15 May 2026 — passed),
  6-months-out (Nov 2026), ticket sales opening, National Day schedule,
  exhibitor lists publishing, opening week.
- Our own data stories once traffic exists: "most-viewed pavilions on the
  tracker" (needs a few months of GA4 data).

## Related assets to mention when relevant

- `/expo-2027/countdown` — free embeddable countdown (bloggers).
- `/data/expo-2027-participants.json` — the open dataset (data journalists).
- `/expo-2027/corporate-area` — the only public explainer of the corporate
  zone (business press).
