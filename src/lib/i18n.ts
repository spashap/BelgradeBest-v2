// Language pilots: German (2026-09-04) and Slovak (2026-10-14, see TR_LANGS).
// German is a mirror of the Expo 2027 cluster
// only — hub, the six Expo articles, the pavilions hub and the DACH pavilion
// profiles. Everything else stays English. URLs keep the English path segments
// under a /de prefix (/de/expo-2027/tickets) so every page maps 1:1 to its
// English original, which is all hreflang needs.
//
// Content sources: German article bodies live in the separate `de` content
// collection (src/content/de/<leg>/<slug>.md, same schema); pavilion
// translations live IN the listing JSON under `i18n.de` (one master per
// listing, `updated` shared). UI strings for German pages live in T below —
// the chrome (header/footer) switches on `lang`.

import { getCollection } from "astro:content";
import { SITE } from "./site";

// Slovak (added 2026-10-14): a three-page pilot — Expo hub, tickets, getting
// there — timed to the 1 Nov Slovak ticket-package launch. Same mechanics as
// German: `sk` content collection + /sk prefix + chrome strings in UI.sk.
export type Lang = "en" | "de" | "sk";
export type TrLang = Exclude<Lang, "en">;
export const LANGS: Lang[] = ["en", "de", "sk"];
export const TR_LANGS: TrLang[] = ["de", "sk"];
export const OG_LOCALE: Record<Lang, string> = { en: "en_US", de: "de_DE", sk: "sk_SK" };
// Header switcher labels: the chip text and the full name (title / aria).
// Adding a language = one row here, a row in UI, TR_LANGS and PAGE_TWINS.
export const LANG_LABEL: Record<Lang, { short: string; name: string }> = {
  en: { short: "EN", name: "English" },
  de: { short: "DE", name: "Deutsch" },
  sk: { short: "SK", name: "Slovenčina" },
};

// The header language switcher for a page: one entry per language the page
// exists in (from its hreflang set), in LANGS order, current one flagged.
// Empty when the page has no twin — the switcher then does not render.
export type LangSwitch = { lang: Lang; short: string; name: string; href: string; current: boolean };
export function langSwitcher(alts: Alternate[] | undefined, current: Lang): LangSwitch[] {
  if (!alts || alts.length === 0) return [];
  const byLang = new Map(alts.filter((a) => a.hreflang !== "x-default").map((a) => [a.hreflang as Lang, a.href]));
  const out = LANGS.filter((l) => byLang.has(l)).map((l) => ({
    lang: l,
    ...LANG_LABEL[l],
    href: byLang.get(l)!.replace(SITE.origin, "") || "/",
    current: l === current,
  }));
  return out.length > 1 ? out : [];
}

// Path of a language mirror for an English path, and back to English.
export function langPath(lang: Lang, enPathname: string): string {
  if (lang === "en") return enPathname || "/";
  return enPathname === "" || enPathname === "/" ? `/${lang}` : `/${lang}${enPathname}`;
}
export const dePath = (enPathname: string) => langPath("de", enPathname);
export function enPath(trPathname: string): string {
  return trPathname.replace(/^\/(de|sk)(?=\/|$)/, "") || "/";
}

// hreflang set for a page and the translations it HAS (`langs`; default = the
// German pilot set, which every older caller meant). x-default = English.
export type Alternate = { hreflang: string; href: string };
export function alternates(enPathname: string, langs: TrLang[] = ["de"]): Alternate[] {
  return [
    { hreflang: "en", href: `${SITE.origin}${enPathname}` },
    ...TR_LANGS.filter((l) => langs.includes(l)).map((l) => ({
      hreflang: l,
      href: `${SITE.origin}${langPath(l, enPathname)}`,
    })),
    { hreflang: "x-default", href: `${SITE.origin}${enPathname}` },
  ];
}

// Hand-built (non-article) pages that have a twin, per language. Articles are
// read from the content collections in twinLangs().
export const PAGE_TWINS: Record<string, TrLang[]> = {
  "/expo-2027": ["de", "sk"],
  "/expo-2027/pavilions": ["de"],
};

// Which English article paths have a twin in a language (from its collection).
const articleTwinCache: Partial<Record<TrLang, Set<string>>> = {};
export async function articleTwinSet(lang: TrLang): Promise<Set<string>> {
  const hit = articleTwinCache[lang];
  if (hit) return hit;
  const entries = await getCollection(lang);
  const set = new Set(entries.map((e) => `/${e.data.leg}/${e.data.slug}`));
  articleTwinCache[lang] = set;
  return set;
}
export const deArticleSet = () => articleTwinSet("de");

// Every translation an English path has (hand-built pages + articles).
export async function twinLangs(enPathname: string): Promise<TrLang[]> {
  const out: TrLang[] = [];
  for (const l of TR_LANGS) {
    if (PAGE_TWINS[enPathname]?.includes(l) || (await articleTwinSet(l)).has(enPathname)) out.push(l);
  }
  return out;
}

// Date formatting per language (visible "Updated" stamps, Expo dates).
const DATE_LOCALE: Record<Lang, string> = { en: "en-GB", de: "de-DE", sk: "sk-SK" };
export function fmtDate(d: string, lang: Lang): string {
  const t = Date.parse(d);
  if (Number.isNaN(t)) return d;
  return new Date(t).toLocaleDateString(DATE_LOCALE[lang], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// German UI strings. Keys mirror the English literals in the layouts.
export const DE = {
  nav: [
    { label: "Expo 2027", href: "/de/expo-2027" },
    { label: "Pavillons", href: "/de/expo-2027/pavilions" },
    { label: "Tickets", href: "/de/expo-2027/tickets" },
    { label: "Anreise", href: "/de/expo-2027/getting-there" },
  ],
  switchLabel: "English",
  switchHint: "Diese Seite auf Englisch",
  footerNote:
    "Deutsche Ausgabe: bisher nur der Expo-2027-Bereich. Alle weiteren Belgrad-Guides sind auf Englisch.",
  footerEnglish: "Zur englischen Ausgabe",
  breadcrumbRoot: "BelgradeBest",
  updated: "Aktualisiert am",
  sourceChecked: "Quellen geprüft nach dem redaktionellen Standard von BelgradeBest",
  unknowns: "Noch unbekannt oder unbestätigt",
  readNextEyebrow: "Weiterlesen",
  readNextTitle: "Mehr zur Expo 2027 auf Deutsch",
  readNextIntro: "Die weiteren deutschsprachigen Seiten dieses Bereichs.",
  listing: {
    kindPavilion: "Nationaler Pavillon",
    kindExhibitor: "Aussteller",
    kindParticipant: "Teilnehmer",
    status: {
      announced: "Pläne angekündigt",
      tender: "Ausschreibung läuft",
      construction: "Im Bau",
      "concept-only": "Konzept berichtet",
    } as Record<string, string>,
    titleSuffix: "auf der Expo 2027 Belgrad — Thema & Pläne",
    imageAlt: "auf der Expo 2027 Belgrad — Profil auf BelgradeBest",
    pavilions: "Pavillons",
    managedBy: (s: string) => `Betreut vom ${s}-Team.`,
    managedText:
      "Die Informationen auf dieser Seite werden von den Vertretern des Eintrags selbst bereitgestellt und aktuell gehalten; Quellen und redaktionelle Einordnung bleiben unsere.",
    atAGlance: "Auf einen Blick",
    source: "[Quelle]",
    announcedHead: "Was bisher angekündigt wurde",
    aboutHead: (s: string) => `Über ${s}`,
    photos: "Fotos",
    photoAlt: "Foto",
    childrenHead: "Aussteller & verbundene Teilnehmer",
    childrenIntro: (s: string) =>
      `Organisationen, die unter oder neben dem Auftritt von ${s} präsent sind — jede mit eigenem Profil (Englisch).`,
    partOf: (name: string) => `Teil des Auftritts von ${name} auf der Expo 2027.`,
    whereHead: (s: string, pav: boolean) => `Wo Sie den ${pav ? "Pavillon" : "Auftritt"} von ${s} finden`,
    whereText:
      "Die nationalen Pavillons stehen im International Participant Area des 25 Hektar großen Expo-Geländes in Surčin im Westen Belgrads — der Zone, die nach der Veranstaltung zur neuen Belgrader Messe wird. Das Gelände liegt etwa 5 km vom Flughafen Nikola Tesla und rund 13,5 km südwestlich des Stadtzentrums (offizielle Planungszahlen): Wer einfliegt, landet also näher an der Expo als an der Innenstadt. Die genaue Position innerhalb der Zonen ist noch nicht veröffentlicht; wir ergänzen den Standort, sobald der Lageplan vorliegt.",
    visitingHead: "Besuch — der praktische Rahmen",
    dates: "Termine:",
    datesText: (dates: string, cls: string) =>
      `${dates} (${cls}, 93 Tage). Jedes Teilnehmerland erhält außerdem einen Nationaltag — dieser Kalender ist noch nicht veröffentlicht.`,
    gettingThere: "Anreise:",
    gettingThereText:
      "Der reguläre Nahverkehr in Belgrad ist derzeit kostenlos; ein Taxi oder eine Fahrdienst-App (CarGo, Yandex Go) deckt die rund 13,5 km vom Zentrum ab. Eine neue Bahnverbindung Flughafen–Surčin ist im Bau, fährt aber noch nicht — den ehrlichen Stand jeder Route finden Sie unter",
    gettingThereLink: "Anreise zur Expo 2027",
    tickets: "Tickets:",
    ticketsText: "noch nicht im Verkauf — was tatsächlich bekannt ist, steht im",
    ticketsLink: "Ticket-Guide zur Expo 2027",
    stay: "Übernachten:",
    stayText: "Flughafennähe oder Innenstadt? Die Abwägung finden Sie unter",
    stayLink: "Übernachten für die Expo 2027",
    faqHead: (s: string) => `${s} auf der Expo 2027 — kurze Antworten`,
    maintainedHead: "So wird diese Seite gepflegt.",
    maintainedText:
      "Dieses Profil wird redaktionell aus den unten aufgeführten öffentlichen Quellen zusammengestellt — wir kennzeichnen Pläne als angekündigt oder berichtet, nie geraten.",
    maintainedClaim: (s: string) => `Sie vertreten ${s}? Sie können`,
    maintainedClaimLink: "diese Seite kostenlos übernehmen",
    maintainedClaimTail: "und selbst aktuell halten (Portal auf Englisch).",
    sources: "Quellen",
    moreOn: "Mehr zur Expo:",
    tracker: "Teilnehmer-Tracker (EN)",
    allPavilions: "alle Pavillon-Profile",
    fullGuide: "der komplette Expo-2027-Guide",
    englishVersion: "Dieses Profil auf Englisch",
    // 2026-09-06 profile redesign: quick nav, visit tiles, explore tiles, sources toggle.
    quickNav: "Auf dieser Seite",
    readouts: { status: "Status", region: "Region", updated: "Aktualisiert", facts: "Belegte Fakten", faqs: "Fragen" },
    stages: ["Konzept", "Angekündigt", "Ausschreibung", "Im Bau"],
    exploreHead: "Weiter zur Expo 2027",
    sourcesToggle: (n: number) => `${n} Quellen anzeigen`,
    childKind: (t: string) =>
      ({ exhibitor: "Aussteller", contractor: "Auftragnehmer", supplier: "Lieferant", agency: "Agentur", sponsor: "Sponsor", chamber: "Kammer", organization: "Organisation" })[t] ?? "Teilnehmer",
    tiles: {
      dates: { kicker: "Termine", title: "" , body: "" },
      gettingThere: { kicker: "Anreise", title: "Anreise zur Expo 2027", body: "Kostenloser Nahverkehr, Taxi-Apps und eine Bahn im Bau – der ehrliche Stand jeder Route." },
      tickets: { kicker: "Tickets", title: "Ticket-Guide zur Expo 2027", body: "Weiterhin nicht im Verkauf – zwei geplante Starttermine verstrichen, Preise offen. Was tatsächlich bekannt ist." },
      stay: { kicker: "Übernachten", title: "Übernachten für die Expo 2027", body: "Flughafennähe oder Innenstadt? Die Abwägung." },
      directory: { kicker: "Verzeichnis", title: "Alle Pavillon-Profile", body: "Jedes Land mit veröffentlichten Plänen – quellengeprüft, auf Deutsch und Englisch." },
      tracker: { kicker: "Daten (EN)", title: "Teilnehmer-Tracker", body: "Alle namentlich bekannten Länder mit Quellen und Datum." },
      guide: { kicker: "Guide", title: "Der komplette Expo-2027-Guide", body: "Termine, Programm, Tickets, Anreise – auf Deutsch." },
    },
  },
} as const;

// Shared chrome strings per translated language (header strip, footer note,
// article chrome). German listing strings stay in DE.listing above.
export type Chrome = {
  nav: { label: string; href: string }[];
  footerNote: string;
  footerEnglish: string;
  updated: string;
  unknowns: string;
  readNextEyebrow: string;
  readNextTitle: string;
  readNextIntro: string;
  skip: string;
  toc: string;
  hub: string;
  feedbackText: string;
  feedbackLink: string;
};
export const UI: Record<TrLang, Chrome> = {
  de: {
    nav: [...DE.nav],
    footerNote: DE.footerNote,
    footerEnglish: DE.footerEnglish,
    updated: DE.updated,
    unknowns: DE.unknowns,
    readNextEyebrow: DE.readNextEyebrow,
    readNextTitle: DE.readNextTitle,
    readNextIntro: DE.readNextIntro,
    skip: "Zum Inhalt springen",
    toc: "Auf dieser Seite",
    hub: "/de/expo-2027",
    feedbackText: "Etwas falsch, veraltet oder fehlt in diesem Leitfaden? ",
    feedbackLink: "Schreiben Sie uns, was Sie gesucht haben",
  },
  sk: {
    nav: [
      { label: "Expo 2027", href: "/sk/expo-2027" },
      { label: "Vstupenky", href: "/sk/expo-2027/tickets" },
      { label: "Doprava", href: "/sk/expo-2027/getting-there" },
    ],
    footerNote:
      "Slovenské vydanie: zatiaľ len základné stránky o Expo 2027. Všetky ostatné stránky sú v angličtine.",
    footerEnglish: "Prejsť na anglickú verziu",
    updated: "Aktualizované",
    unknowns: "Zatiaľ neznáme alebo nepotvrdené",
    readNextEyebrow: "Čítajte ďalej",
    readNextTitle: "Viac o Expo 2027 po slovensky",
    readNextIntro: "Ďalšie slovenské stránky o Expo 2027.",
    skip: "Preskočiť na obsah",
    toc: "Na tejto stránke",
    hub: "/sk/expo-2027",
    feedbackText: "Niečo v tomto sprievodcovi nesedí, je zastarané alebo chýba? ",
    feedbackLink: "Napíšte nám, čo ste hľadali",
  },
};
