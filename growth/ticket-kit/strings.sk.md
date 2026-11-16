# Súprava na spustenie predaja vstupeniek: krátke texty (slovensky)

Vyplňte rovnaké `{{BLANKS}}` ako v šablóne stránky. Každý text uvádza, kam patrí. Scenár B je „v predaji teraz“; scenár A je „ceny alebo dátum oznámené, ešte nie je v predaji“.

**Tvar hodnôt (poznámka pre editora):** `{{SALE_DATE}}`, `{{ANNOUNCE_DATE}}` a `{{VERIFIED_DATE}}` vždy v genitíve bez predložky („1. decembra 2026“); texty sú napísané tak, aby tento tvar sedel všade („od …“, „do …“, „predaj sa začal …“). Nepoužívajte datív („k 1. decembru“). `{{CHANNELS_SHORT}}` je určenie miesta s malým začiatočným písmenom za čiarkou, bez bodky („na oficiálnom webe a v pokladniach“). `{{CHANNELS_LONG}}` a `{{WEB_CHANNEL}}` sú celé vety s bodkou. `{{CURRENCY_NOTE}}` je prázdne alebo sa začína čiarkou či medzerou a nemá bodku. Ceny v slovenskom formáte („2 400 dinárov (asi 20 €)“).

## Riadok na hube (`src/pages/sk/expo-2027/index.astro`, riadok „Vstupenky“)

- B: `V predaji od {{SALE_DATE}}: jednodňová {{P_1DAY}}, trojdňová {{P_3DAY}}. Kupujte len cez oficiálnu stránku`
- A: `Predaj sa začne {{SALE_DATE}}: jednodňová {{P_1DAY}}, trojdňová {{P_3DAY}}. Zatiaľ nie je v predaji nikde`

## Riadok „zatiaľ neznáme“ na hube

Slovenský hub (`src/pages/sk/expo-2027/index.astro`) zatiaľ taký zoznam nemá. Ak pribudne, použite tento text:

- B: `Zľavy na vstupenky, sezónny lístok, pravidlá vrátenia peňazí a časové okná (ceny jednodňových a trojdňových vstupeniek boli zverejnené {{SALE_DATE}})`. Každú časť, ktorú organizátor medzitým zverejnil, vymažte.
- A: `Zľavy na vstupenky, sezónny lístok, pravidlá vrátenia peňazí a časové okná (predaj sa začne {{SALE_DATE}})`

## FAQ na hube „Dajú sa už kúpiť vstupenky na Expo 2027?“ (`src/pages/sk/expo-2027/index.astro`)

- B: `Áno. Predaj sa začal {{SALE_DATE}}, {{CHANNELS_SHORT}}. Jednodňová vstupenka stojí {{P_1DAY}} a trojdňová {{P_3DAY}}. Kupujte len cez kanály, ktoré uvádza oficiálna stránka.`
- A: `Zatiaľ nie, ale dátum je určený. Organizátor oznámil, že predaj sa začne {{SALE_DATE}}, {{CHANNELS_SHORT}}, s jednodňovými vstupenkami za {{P_1DAY}} a trojdňovými za {{P_3DAY}}.`

## Dlaždica na profile pavilónu

Slovenské profily pavilónov zatiaľ neexistujú. Ak pribudnú, použite tento text:

- B: `V predaji od {{SALE_DATE}}: ceny, kde kúpiť oficiálne a čo skontrolovať pred platbou.`
- A: `Predaj sa začne {{SALE_DATE}}: oznámené ceny a kde sa uskutoční oficiálny predaj.`

## Nepoužíva sa pre slovenčinu

Riadok pre nemeckého sprievodcu Expom (`ticketsText`, len nemčina) a príspevok na Facebooku sa pre slovenčinu nepoužívajú.
