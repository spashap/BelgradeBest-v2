# BelgradeBest — WordPress plugin "BelgradeBest Countdown for Expo 2027 Belgrade"

*20 November 2026. **Submitted to WordPress.org on 20 Nov 2026** as litocreative. Renamed 27 Nov after review round 1. **Approved 28 Nov 2026.***

**Status:**
- **Approved 28 Nov.**
  - Slug: `belgradebest-countdown-for-expo-2027-belgrade`.
  - SVN: https://plugins.svn.wordpress.org/belgradebest-countdown-for-expo-2027-belgrade
  - Listing: https://wordpress.org/plugins/belgradebest-countdown-for-expo-2027-belgrade/. It stays empty until the first SVN commit.
- **Next step: publish through SVN.** Run this from the repo root in PowerShell:

  ```
  powershell -ExecutionPolicy Bypass -File wp-plugin\svn-publish.ps1
  ```

  - svn asks for your SVN password, which you set under WordPress.org profile → Account & Security. Your username is `litocreative`.
  - The script does the rest:
    - checks the build;
    - checks the repository out to `C:\projects\wporg-svn\belgradebest-countdown-for-expo-2027-belgrade`, next to CosmyDay's;
    - copies the plugin into `trunk/` and the icons from `wp-plugin/wporg-assets/` into `assets/`;
    - shows the change list and waits for Enter;
    - commits, then tags `1.0.0`.
  - A dry run on 28 Nov, which stopped before the commit, showed exactly the 12 plugin files and 2 icons.
- **The DNS TXT record** `wordpressorg-litocreative-verification` is no longer needed after approval. Leaving it in place does no harm.

## Review round 1 (email of 27 Nov) and the fix

The reviewer raised two things:

1. **The name was too generic** ("Countdown" first), with "Expo 2027 Belgrade" seen as a trademark.
   - **Fix:** the name is now **BelgradeBest Countdown for Expo 2027 Belgrade**: our brand first, and the trademark after "for".
   - It is the same in the readme, the plugin header, the text domain, the block title and the classic widget title.
   - The readme already says the plugin is not affiliated with the Expo organisers or the BIE.
   - The zip is at `wp-plugin/dist/belgradebest-countdown-for-expo-2027-belgrade.zip`.
2. **Ownership:** the account email (cosmyday.com) doesn't match belgradebest.com.
   - **Fix:** add a DNS TXT record on belgradebest.com. The domain's DNS is at Namecheap (`dns1.registrar-servers.com`).
   - Steps: Namecheap → Domain List → belgradebest.com → Manage → Advanced DNS → Add New Record:
     - Type **TXT Record**;
     - Host **@**;
     - Value **wordpressorg-litocreative-verification**;
     - TTL Automatic.
   - Check it is visible before replying: `Resolve-DnsName belgradebest.com -Type TXT -Server 1.1.1.1`.
   - The record says nothing about the owner beyond the username that is already public on the plugin.

**Reply to the review email** (in the same thread, after uploading the new zip on "Add your plugin" while signed in as litocreative):

> Hi,
>
> Thanks for the review. Both points are addressed:
>
> - Name: changed to "BelgradeBest Countdown for Expo 2027 Belgrade" (our brand first, the event name after "for"; the readme states there is no affiliation with the Expo organisers or the BIE). Please change the slug to: belgradebest-countdown-for-expo-2027-belgrade
> - Ownership: I own belgradebest.com. The TXT record wordpressorg-litocreative-verification is now live at the domain root. The account email is on cosmyday.com because I also run that site and its plugin (cosmyday-astrology-widgets) under the same account.
>
> The updated zip has been uploaded.
>
> Thanks
- **Queue:** 701 plugins waiting, and first replies had reached submissions from before 9 Nov.
- **The review email** goes to admin@cosmyday.com with the subject "[WordPress Plugin Directory] Review in Progress: Countdown for Expo 2027 Belgrade" (the original name; replies stay in that thread). Make sure mail from plugins@wordpress.org doesn't go to spam.
- **Do not resubmit:** the account can have one plugin in review at a time, and fixes go in as a reply to the review email.
- **Ownership note:** the account's email is a CosmyDay address, so the submission's "Additional Information" says both sites belong to LitoCreative. It offers proof from admin@belgradebest.com or a verification file on the site.

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

1. **Submit.** Done 20 Nov: you signed in, and I uploaded the zip (checksum matched) and submitted after your yes.
2. **Review.** CosmyDay's took about a week. If the reviewer asks for changes, forward me the email and I'll fix the code and rebuild the zip.
3. **Publish through SVN** (WordPress.org's file store for plugins).
   - The plugin was approved on 28 Nov.
   - Run `wp-plugin\svn-publish.ps1` (see Status). It asks for your SVN password.
   - The icons come from the site's "B" mark.
   - A banner and screenshots can be added later to `wp-plugin/wporg-assets/` and published by re-running the script, with no new review.
   - Later versions follow the same path: bump the version in four places, run `node wp-plugin/build-plugin.mjs`, then run the script.
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
- **Approved 28 Nov** under the name "BelgradeBest Countdown for Expo 2027 Belgrade". The publish script and icons are ready.
- **Your part:** run `powershell -ExecutionPolicy Bypass -File wp-plugin\svn-publish.ps1` and enter your SVN password when asked. Then tell me, and I'll add the plugin link to the site and prepare the translations.
