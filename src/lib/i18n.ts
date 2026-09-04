// Language pilot (added 2026-09-04): a German mirror of the Expo 2027 cluster
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

export type Lang = "en" | "de";
export const LANGS: Lang[] = ["en", "de"];
export const OG_LOCALE: Record<Lang, string> = { en: "en_US", de: "de_DE" };

// Path of the German mirror for an English path, and back.
export function dePath(enPathname: string): string {
  return enPathname === "" || enPathname === "/" ? "/de" : `/de${enPathname}`;
}
export function enPath(dePathname: string): string {
  return dePathname.replace(/^\/de(?=\/|$)/, "") || "/";
}

// hreflang set for a page that exists in both languages. x-default = English.
export type Alternate = { hreflang: string; href: string };
export function alternates(enPathname: string): Alternate[] {
  return [
    { hreflang: "en", href: `${SITE.origin}${enPathname}` },
    { hreflang: "de", href: `${SITE.origin}${dePath(enPathname)}` },
    { hreflang: "x-default", href: `${SITE.origin}${enPathname}` },
  ];
}

// Which English article paths have a German twin (from the `de` collection).
let deArticlePaths: Set<string> | null = null;
export async function deArticleSet(): Promise<Set<string>> {
  if (deArticlePaths) return deArticlePaths;
  const de = await getCollection("de");
  deArticlePaths = new Set(de.map((e) => `/${e.data.leg}/${e.data.slug}`));
  return deArticlePaths;
}

// Date formatting per language (visible "Updated" stamps, Expo dates).
export function fmtDate(d: string, lang: Lang): string {
  const t = Date.parse(d);
  if (Number.isNaN(t)) return d;
  return new Date(t).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", {
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
  },
} as const;
