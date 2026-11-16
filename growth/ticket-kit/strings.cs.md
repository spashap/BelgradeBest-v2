# Sada pro zahájení prodeje vstupenek: krátké texty (česky)

Vyplňte stejné `{{BLANKS}}` jako v šabloně stránky. Každý text uvádí, kam patří. Scénář B je „v prodeji nyní“; scénář A je „ceny nebo datum oznámeny, zatím není v prodeji“.

**Tvar hodnot (poznámka pro editora):** `{{SALE_DATE}}`, `{{ANNOUNCE_DATE}}` a `{{VERIFIED_DATE}}` vždy ve 2. pádě bez předložky („1. prosince 2026“); texty jsou napsány tak, aby tento tvar seděl všude („od …“, „do …“, „prodej začne …“). Nepoužívejte 3. pád („k 1. prosinci“). `{{CHANNELS_SHORT}}` je určení místa s malým počátečním písmenem za čárkou, bez tečky („na oficiálním webu a v pokladnách“). `{{CHANNELS_LONG}}` a `{{WEB_CHANNEL}}` jsou celé věty s tečkou. `{{CURRENCY_NOTE}}` je prázdné, nebo začíná čárkou či mezerou a nemá tečku. Ceny v českém formátu („2 400 dinárů (asi 20 €)“).

## Řádek na hubu (`src/pages/cs/expo-2027/index.astro`, řádek „Vstupenky“ v poli `facts`)

- B: `V prodeji od {{SALE_DATE}}: jednodenní {{P_1DAY}}, třídenní {{P_3DAY}}. Kupujte jen přes oficiální web`
- A: `Prodej začne {{SALE_DATE}}: jednodenní {{P_1DAY}}, třídenní {{P_3DAY}}. Zatím nejsou v prodeji nikde`

## Řádek „zatím neznámé“ na hubu

Český hub (`src/pages/cs/expo-2027/index.astro`) zatím žádný seznam „zatím neznámé“ nemá. Pokud se přidá, použijte tento text:

- B: `Slevy na vstupenky, sezónní vstupenka, pravidla pro vrácení peněz a časová okna (ceny jednodenní a třídenní vstupenky byly zveřejněny {{SALE_DATE}})`. Smažte každou část, kterou pořadatel mezitím zveřejnil.
- A: `Slevy na vstupenky, sezónní vstupenka, pravidla pro vrácení peněz a časová okna (prodej začne {{SALE_DATE}})`

## FAQ na hubu „Dají se už koupit vstupenky na Expo 2027?“ (`src/pages/cs/expo-2027/index.astro`, pole `faqs`)

- B: `Ano. Prodej byl zahájen {{SALE_DATE}}, {{CHANNELS_SHORT}}. Jednodenní vstupenka stojí {{P_1DAY}} a třídenní {{P_3DAY}}. Kupujte jen přes kanály, které uvádí oficiální web.`
- A: `Zatím ne, ale datum je stanoveno. Pořadatel oznámil, že prodej začne {{SALE_DATE}}, {{CHANNELS_SHORT}}, s jednodenními vstupenkami za {{P_1DAY}} a třídenními za {{P_3DAY}}.`

## Dlaždice na profilu pavilonu

České profily pavilonů zatím neexistují. Pokud přibudou, použijte tento text:

- B: `V prodeji od {{SALE_DATE}}: ceny, kde koupit oficiálně a co zkontrolovat před zaplacením.`
- A: `Prodej začne {{SALE_DATE}}: oznámené ceny a místo, kde se bude oficiálně prodávat.`

## Použití v češtině

Řádek německého průvodce Expem (`ticketsText`, pouze německy) a příspěvek na Facebooku se pro češtinu nepoužívají.
