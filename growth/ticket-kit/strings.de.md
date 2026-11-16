# Ticket-Verkaufsstart-Kit: kurze Texte (Deutsch)

Dieselben `{{PLATZHALTER}}` wie in der Seitenvorlage füllen. Jeder Text nennt, wohin er gehört. Szenario B ist „jetzt im Verkauf“; Szenario A ist „Preise oder Termin angekündigt, noch nicht im Verkauf“.

**Form der Platzhalter (Redaktionshinweis):** `{{SALE_DATE}}`, `{{ANNOUNCE_DATE}}` und `{{VERIFIED_DATE}}` als bloßes Datum ohne Artikel oder Präposition einsetzen („1. Dezember 2026“); „am“, „seit dem“ und „bis zum“ stehen schon im Text. `{{CHANNELS_SHORT}}` ist eine klein beginnende Ortsangabe nach einem Komma, ohne Schlusspunkt („auf der offiziellen Website und an Kassen“). `{{CHANNELS_LONG}}` und `{{WEB_CHANNEL}}` sind ganze Sätze mit Schlusspunkt. `{{CURRENCY_NOTE}}` ist leer oder beginnt mit Komma oder Leerzeichen und endet ohne Punkt. Preise im deutschen Format („2.400 Dinar (etwa 20 €)“).

## Hub-Zeile (`src/pages/de/expo-2027/index.astro`, Zeile „Tickets“ im Array `facts`)

- B: `Seit {{SALE_DATE}} im Verkauf: Ein-Tages-Ticket {{P_1DAY}}, Drei-Tage-Ticket {{P_3DAY}}. Nur über die offizielle Website kaufen`
- A: `Verkaufsstart {{SALE_DATE}}: Ein-Tages-Ticket {{P_1DAY}}, Drei-Tage-Ticket {{P_3DAY}}. Noch nirgends im Verkauf`

## Hub-Zeile „noch unbekannt“

Der deutsche Hub hat derzeit keine solche Liste. Falls eine hinzukommt, diesen Text verwenden:

- B: `Ticket-Ermäßigungen, eine Saisonkarte, Erstattungsregeln und Zeitfenster (Ein-Tages- und Drei-Tage-Preise wurden am {{SALE_DATE}} veröffentlicht)`. Jeden Teil streichen, den der Veranstalter inzwischen veröffentlicht hat.
- A: `Ticket-Ermäßigungen, eine Saisonkarte, Erstattungsregeln und Zeitfenster (Verkaufsstart {{SALE_DATE}})`

## Hub-FAQ „Gibt es schon Tickets für die Expo 2027?“ (`src/pages/de/expo-2027/index.astro`, Array `faqs`)

- B: `Ja. Der Verkauf begann am {{SALE_DATE}}, {{CHANNELS_SHORT}}. Ein Ein-Tages-Ticket kostet {{P_1DAY}}, ein Drei-Tage-Ticket {{P_3DAY}}. Kaufen Sie nur über Kanäle, die die offizielle Website nennt.`
- A: `Noch nicht, aber der Termin steht fest. Der Veranstalter hat angekündigt, dass der Verkauf am {{SALE_DATE}} beginnt, {{CHANNELS_SHORT}}, mit Ein-Tages-Tickets zu {{P_1DAY}} und Drei-Tage-Tickets zu {{P_3DAY}}.`

## Kachel auf dem Pavillonprofil (`src/lib/i18n.ts`, deutsch `tickets.body`)

- B: `Seit {{SALE_DATE}} im Verkauf: die Preise, wo Sie offiziell kaufen und was Sie vor der Zahlung prüfen sollten.`
- A: `Verkaufsstart {{SALE_DATE}}: die angekündigten Preise und wo der offizielle Verkauf stattfinden wird.`

## Zeile im deutschen Expo-Leitfaden (`src/lib/i18n.ts`, `ticketsText`, nur Deutsch)

- B: `seit {{SALE_DATE}} im Verkauf – Preise und offizielle Verkaufsstellen im`
- A: `Verkaufsstart am {{SALE_DATE}} – angekündigte Preise im`

## Facebook-Beitrag

Die Facebook-Seite postet auf Englisch; es gibt keine deutsche Fassung (siehe `strings.en.md`).
