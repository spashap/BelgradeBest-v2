=== Countdown for Expo 2027 Belgrade ===
Contributors: litocreative
Tags: countdown, expo, expo 2027, belgrade, event countdown
Requires at least: 6.3
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A live countdown to Expo 2027 Belgrade (15 May – 15 August 2027) in eight languages. No external requests, no cookies, no tracking.

== Description ==

Countdown for Expo 2027 Belgrade adds a small card to any post, page or sidebar that counts the days until the world expo in Belgrade, Serbia opens on 15 May 2027. While the Expo runs it shows the days left until it closes on 15 August 2027, and afterwards it says the Expo has ended. You set it up once and never touch it again.

**Eight languages**

English, German, Slovak, Czech, Turkish, Arabic, Japanese and Korean. By default the countdown follows your site's language and falls back to English; you can also pick a language per block, so a German page on an English site can show a German countdown. Arabic is laid out right to left, and Slovak and Czech use the correct plural for one, two to four, and five or more days.

**Three ways to place it**

* **Block editor:** search for "Expo 2027" in the block inserter. Language and colours are in the block sidebar, with a live preview.
* **Shortcode:** `[bbexpo_countdown]` anywhere shortcodes run, including page builders with a shortcode element.
* **Classic widget:** an "Expo 2027 Belgrade Countdown" widget for themes that still use classic sidebars.

**Matches your theme**

Background, text and accent colours accept any hex value. An invalid value falls back to the default colour, so a typo can never break your page.

**Light and private**

The countdown is rendered on your server. A small stylesheet and a short script load only on pages that show the countdown; the script just recounts the days in the visitor's own calendar when a page cache serves an older copy of the page. The plugin makes no external requests, sets no cookies, stores no data and adds no settings page.

**Credit link is optional**

There is a setting to show a small "Countdown by BelgradeBest" link under the countdown. It is **off by default**, and the countdown works exactly the same whether it is on or off.

This plugin is made by BelgradeBest, an independent travel guide to Belgrade. It is not affiliated with or endorsed by the organisers of Expo 2027 Belgrade or the Bureau International des Expositions.

== Installation ==

1. Install the plugin through Plugins → Add New, or upload the plugin folder to `/wp-content/plugins/`.
2. Activate it through the Plugins screen.
3. Edit any post or page and add the **Expo 2027 Belgrade Countdown** block.

For a sidebar, go to Appearance → Widgets and add either the block or the classic widget, whichever your theme supports.

== Frequently Asked Questions ==

= Which dates does it count to? =

Before the opening it counts the days until 15 May 2027. From 15 May to 15 August 2027 it counts the days left, including the current day. After 15 August 2027 it shows that the Expo has ended. Days are counted in your site's timezone, and the visitor's own calendar day after the page loads.

= Does it contact any server or track visitors? =

No. Everything the countdown needs is in the plugin. It makes no requests to any other site, sets no cookies and stores nothing.

= How do I choose the language? =

Leave the language on "Same as the site" and the countdown uses your site language if it is one of the eight, otherwise English. To fix a language, choose it in the block sidebar or the classic widget, or use the shortcode's `lang` attribute: `en`, `de`, `sk`, `cs`, `tr`, `ar`, `ja` or `ko`.

= What are the shortcode attributes? =

`lang` (auto or a language code), `bg`, `fg` and `accent` (hex colours) and `credit` (yes or no).

Example: `[bbexpo_countdown lang="de" bg="#ffffff" accent="#0055a4"]`

= Is the credit link required? =

No. It is off by default and the countdown is identical either way. If you turn it on, the link opens the BelgradeBest Expo guide (in German, Slovak or Czech for those languages, otherwise in English) and carries `rel="nofollow"`.

= Can I add another language? =

Not from the settings, but language requests are welcome in the support forum.

== Changelog ==

= 1.0.0 =
* First release: countdown block, `[bbexpo_countdown]` shortcode and classic widget.
* English, German, Slovak, Czech, Turkish, Arabic (right to left), Japanese and Korean.
* Background, text and accent colours.
* Optional credit link, off by default.

== Upgrade Notice ==

= 1.0.0 =
First release.
