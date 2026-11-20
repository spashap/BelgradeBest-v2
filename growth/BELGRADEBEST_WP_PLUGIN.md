# BelgradeBest — WordPress plugin "Countdown for Expo 2027 Belgrade"

*20 November 2026. Built and tested; not yet submitted to WordPress.org.*

## Why it exists

The widgets on `/for-businesses` and `/expo-2027/countdown` had 13 page views from 4 people between June and November, so nobody finds them. CosmyDay showed which channel works:
- **Listings that other sites copy automatically earn links.** The CosmyDay WordPress plugin has 0 installs, but within days of approval it earned the only two followed links its widget page has.
- **Embedded widgets bring some visitors but no links.**

WordPress.org also has a page in each language for every plugin (de., sk., cs., tr., ar., ja. and ko.wordpress.org). That gives German, Slovak, Czech, Turkish, Arabic, Japanese and Korean readers their own listing once its description is translated. No other plugin on WordPress.org covers Expo 2027 (checked 20 Nov).

## What it does

- A small card that counts the days until Expo 2027 Belgrade opens on 15 May 2027. During the Expo it counts the days left until 15 August 2027, and afterwards it says the Expo has ended.
- **Eight languages:** English, German, Slovak, Czech, Turkish, Arabic (right to left), Japanese and Korean.
  - By default it uses the site's language, falling back to English.
  - A language can also be set per block, shortcode or widget.
  - Slovak and Czech use the correct plural forms (1 / 2–4 / 5+).
- **Three ways to place it:** a block, the `[bbexpo_countdown]` shortcode, and a classic sidebar widget. Colours can be changed.
- **No external requests, no cookies, no tracking, no settings page.** A short script recounts the days in the visitor's own calendar when a page cache serves an old copy of the page.
- **Credit link "Countdown by BelgradeBest" is off by default.** WordPress.org rule 10 requires this. When a site turns it on, the link is nofollow and opens our German, Slovak or Czech hub for those languages, and the English hub for the others.
- **The readme says the plugin is independent** of the Expo organisers and the BIE (Bureau International des Expositions).

## How it was tested (20 Nov)

- **Official Plugin Check, all five categories, errors and warnings:** "Checks complete. No errors found."
  - The first run gave one warning, a variable that WordPress counts as global, which is now fixed.
  - The same checker found 9 problems in a deliberately broken test plugin, so a clean result means something.
- **Real WordPress (Playground in WSL), WordPress 7.1.5 on PHP 8.3 and WordPress 6.3 on PHP 7.4** (the oldest versions it claims to support):
  - block, shortcode and classic widget render in all 8 languages;
  - day counts are right at every boundary (14, 15 and 16 May; 14, 15 and 16 August 2027);
  - hostile and garbled settings are cleaned;
  - no PHP notices.
- **On a block theme:** a shortcode card was stretched to the full column width. The CSS now holds it at 300px.
- **Translations:** a native-language review of all 7 non-English versions changed one thing, a colon in Turkish.

## Your steps

1. **Submit (about 20 minutes).**
   - Sign in at wordpress.org as **litocreative**, the same account as the CosmyDay plugin.
   - Open https://wordpress.org/plugins/developers/add/ and upload `wp-plugin/dist/countdown-for-expo-2027-belgrade.zip`. Rebuild it first with `node wp-plugin/build-plugin.mjs` if anything changed.
   - Tick the confirmations and submit. The slug should read **countdown-for-expo-2027-belgrade**; it was free on 20 Nov.
2. **Review.** CosmyDay's took about a week. If the reviewer asks for changes, forward me the email and I'll fix the code and rebuild the zip.
3. **After approval: publish through SVN** (WordPress.org's file store for plugins). You run the commit with your SVN password, the same way as for CosmyDay; I'll prepare the folder and a script. Screenshots and a banner can go in at the same time, with no new review.
4. **After approval: translations.** These are what create the listings in other languages.
   - The description is translated at translate.wordpress.org. I'll prepare the text in all 7 languages, and you import it while signed in.
   - Each language's editors approve it. To speed that up, we can ask the language teams to make litocreative the translation editor for this plugin.
5. **After approval: on our site** I'll add "or install the WordPress plugin" to `/expo-2027/countdown` and the German hub.

## Rules for later changes

- **Labels have one master: `src/data/countdown-labels.json`.**
  - The site's `/widgets/expo-countdown.js` is built from it.
  - `node wp-plugin/build-plugin.mjs` copies it into the plugin (`--check` reports a stale copy).
  - A new language means a new entry there, and the plugin release notes say so.
- **A new version changes the version number in four places:** the plugin header, `BBEXPO_COUNTDOWN_VERSION`, readme `Stable tag`, and `block.json`. The build script refuses a mismatch.
- **Never** add an external request, a credit link that is on by default, or a keyword-rich link. Each one gets a plugin rejected or reads as link spam.
- `wp-plugin/` is never deployed to Vercel (`.vercelignore`).

## What to expect

From CosmyDay's numbers:
- a handful of real links from directory-copy sites within weeks of approval;
- few installs;
- referral visits only if sites turn the credit link on.

The plugin matters for about 9 months, until the Expo closes on 15 August 2027.

Your stop rule for link-building runs to 16 Dec. It can't show 50 attributable visits by then, so judge this channel on links instead (Ahrefs Webmaster Tools, where CosmyDay's showed up).

## TL;DR

- **The plugin is built and tested.** The official checker found nothing, and it works from WordPress 6.3 to 7.1, in 8 languages including Arabic right to left.
- **It's a listing, not a traffic machine.** WordPress.org plus the sites that copy it should bring us a few real links, and each translated description gives us a page in that language.
- **Also fixed today:** the countdown widget's credit link is now nofollow like the others, and the "the link is the license" wording is gone.
- **Your part:** upload `wp-plugin/dist/countdown-for-expo-2027-belgrade.zip` at wordpress.org/plugins/developers/add/ as litocreative, then forward me the reviewer's email.
