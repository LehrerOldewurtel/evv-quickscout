# Nächster Entwicklungsschritt: klickarme Hybrid-Oberfläche und Turnaround

Status: vorbereiteter Implementierungsplan; noch keine neue Engine oder Live-Oberfläche implementiert. Grundlage ist V7.19, nicht ein Downgrade auf V7.9.2. Bestehender PR #1 bleibt ein QA-/Stabilisierungs-PR.

## Befund im Repository

Vorhanden sind ein grafisches **Taktik-/Skizzenfeld**, `rotationMatrix`, rollengebundene `attackOptions`, `draft.chain`, K1/TRANSITION-Erkennung, atomarer Rallyeabschluss und Zielzonen. Diese Bausteine sind wiederverwendbar. Das Skizzenfeld ist keine Live-Erfassungsoberfläche und keine regelgeprüfte Turnaround-Engine.

Es fehlen ein von DOM/localStorage unabhängiger Reducer, explizite Ballbesitz-/Turnaround-IDs, ein validiertes Ereignisschema, vollständige gegnerische Angriffskontakte und eine idempotente Abschlussoperation. `attackContext` liefert bereits einen Kontext, aber `attackRoutesFor` verwendet ihn nicht zur unterschiedlichen Routenberechnung. Die aktuelle Chain ist ein Ausgangspunkt, kein vollständiges Replay-Protokoll.

## Arbeitsdefinition und Datenvertrag

Arbeitsdefinition: Turnaround ist der Wechsel der Ballkontrolle zum anderen Team mit anschließendem Neuaufbau innerhalb derselben Rallye. Ein Blocktouch allein zählt nicht automatisch als Turnaround. Die ursprüngliche K1-/K2-Phase bleibt unverändert. Diese Definition wird im nächsten Schritt als explizite fachliche Regel in Tests festgeschrieben.

Geplanter, versionierter zusätzlicher Rallyeentwurf (Beispielwerte sind synthetisch):

```json
{
  "schemaVersion": 1,
  "rallyId": "qa-set1-rally3",
  "initialPhase": "K1",
  "possession": "EVV",
  "turnaroundIndex": 2,
  "contacts": [
    {"id":"c1","sequence":1,"team":"EVV","kind":"reception","playerId":"qa-aa1","quality":"A3","turnaroundIndex":0},
    {"id":"c2","sequence":2,"team":"EVV","kind":"attack","playerId":"qa-aa2","result":"continued","turnaroundIndex":0},
    {"id":"c3","sequence":3,"team":"Gegner","kind":"defense","playerId":"qa-opp1","quality":"D3","turnaroundIndex":1},
    {"id":"c4","sequence":4,"team":"Gegner","kind":"attack","playerId":"qa-opp2","result":"continued","turnaroundIndex":1},
    {"id":"c5","sequence":5,"team":"EVV","kind":"defense","playerId":"qa-aa2","quality":"D2","turnaroundIndex":2}
  ],
  "status": "open"
}
```

`reduceRally(draft, command, lineupContext)` soll ohne DOM, Uhr, Zufall oder Speicherzugriff laufen. Geplante Commands: Kontakt erfassen/korrigieren, letzten Kontakt zurücknehmen, Rallye mit Sieger abschließen. Jedes Command bekommt eine eindeutige ID; Wiederholung derselben ID darf keinen zweiten Punkt erzeugen. Besitzwechsel, Blockabpraller, Dankeball und direkter Fehler erhalten explizite Regeln. Die unabhängige Score-Oracle bleibt erhalten.

Für Speicherung: Adapter in bestehende Rallyefelder/Chain, neue Felder additiv. Bestehende Matchdaten nicht automatisch rückwirkend als Turnarounds interpretieren. Historische Daten zeigen „nicht erfasst“, keine erfundenen Kontaktfolgen. Vor einer echten Schemamigration Sicherung, Validierung und atomare Übernahme; lesbarer Altbestand und unbekannte Felder bleiben erhalten. Neue Engine zuerst hinter deaktivierter Entwicklungsoption; Parallelvergleich auf synthetischen Daten.

## Geplante Oberfläche und Klickbudget

- Score, K1/K2, Rotation und aktiver Ballbesitz bleiben sichtbar. Feldspieler als große beschriftete Ziele auf einem grafischen Feld; Anzeige aus echter Aufstellung/Libero/Rotation, nicht aus frei verschiebbaren Taktikskizzen.
- Spieler wählen → Qualität/Ergebnis aus einer festen Leiste. Eindeutige Spieler-/Angriffszuordnung übernimmt die UI ohne zweiten Kandidatendialog. Kein stiller Qualitäts-Default und keine Auslassung Pflichtdaten, nur um Tap-Ziele zu erreichen.
- Gegneraktion und Turnaround direkt am Feld erfassen; nach kontrollierter Abwehr Ballbesitz automatisch wechseln. Turnaround-Index sichtbar, nicht separat bestätigen.
- Zielzone direkt im Feld statt Pflichtmodal; optional auslassen. Spielstand erst beim expliziten Endergebnis ändern. A0/D0 direkt abschließen.
- Zwei klar getrennte Aktionen: „letzten Kontakt zurück“ während einer Rallye und „letzte Rallye rückgängig“. Sicherheitsbestätigungen für Überschreiben/Import bleiben bestehen.

| Ablauf | Gemessen in V7 | Ziel für Prototyp (noch nicht gemessen) |
|---|---:|---:|
| K1-Annahme bis Kill inkl. optionaler Zone | 6 | höchstens 4, sofern gleiche Pflichtdaten erfasst werden |
| K2-Aufschlag bis Blockpunkt | 7 | höchstens 5 |
| Lange Rallye, drei EVV-Angriffe/zwei Transitions | 24 | mindestens 25 % weniger bei gleicher Datentiefe |

## Implementierungsreihenfolge und Abnahme

1. Reinen Reducer mit Golden Cases für K1/K2, mehrfache Transitions, Blocktouch in beide Richtungen, Freeball, A0/D0 und doppelte Commands implementieren. Unzulässige Eingaben verändern den Entwurf nicht. Korrektur/Replay erzeugen dieselben Ergebnisse.
2. Adapter und Migration separat testen: V7.9.2-/V7.19-Fixtures plus unbekannte Felder, unterbrochene Speicherung, beschädigte Eingaben. Legacy-Statistik darf sich beim bloßen Öffnen nicht ändern.
3. Isolierten Feld-Prototyp auf synthetischen Daten bauen; keine produktiven Profile oder Speicherkeys. Kontakt-/Ballbesitzfolge sichtbar machen und Tap-Metrik automatisieren.
4. Reducer/Prototyp verbinden und mit bisheriger Eingabe auf identischen Kontaktfolgen vergleichen. Erst danach native Verpackung und Gerätetests. Keine Freigabe allein anhand einer Simulation.

## Noch fehlende Hybrid-Tests (Abnahmematrix)

| Bereich | Fehlende Prüfungen |
|---|---|
| Live-Feld | Koordinaten/Zone/Netzrichtung; R1–R6 und freie Aufstellungen; Libero-/Wechselanzeige; falscher Spieler; Trefferfläche; gleichzeitiges Scrollen/Tappen |
| Turnaround | Ballbesitz-/Indexzählung; mehrere Transitions; Blocktouch ohne Besitzwechsel; Blockfortsetzung zu beiden Teams; Freeball/Notball/zweiter Ball; Gegner-Spielerzuordnung; genau ein Abschluss; Replay und Undo je Kontakt |
| Gesten | Finger/Pencil/Maus; pointercancel/capture; Doppeltap; Drag gegenüber Tap; außerhalb Feld loslassen; Multitouch; Safe Areas |
| Layout | 375/600/820/1024 px; Hoch-/Querformat; iPad Split View; Zoom/Textvergrößerung; keine verdeckten Pflichtaktionen; echte Touch-Flächenmessung |
| Barrierefreiheit | VoiceOver/TalkBack; Tastatur/Fokus im Modal; verständliche Namen; Kontrast; Statusansagen; Qualität nicht nur über Farbe unterscheiden |
| Lebenszyklus | iOS/Android WebView und Safari; App-Wechsel/Resume/Prozessabbruch; persistenter offener Rallyeentwurf; Offline-Kaltstart; Service-Worker-Update/Rollback und Cache-Besitzgrenzen |
| Daten | Export-Import-Roundtrip; abgelehnter Import ohne Nebenwirkungen; vollständige Strukturvalidierung; Altversionen; Quota-Fehler; beschädigte Daten; atomare Migration und Wiederherstellung |
| Native Funktionen | Container/Bridge; Dateidialoge/-Downloads; Mikrofonberechtigungen/Abbruch; keine automatische Wiederaufnahme; echte Hardware-Sprache |
| Unabhängige Auswertung | Spieler-/Gegnerstatistik je Kontakt; alle Aufschlag-/Angriffsresultate; vier Sätze; unterschiedliche Gewinnfolgen; unabhängige vollständige Kontaktmatches statt nur Quick-Punkte |

Die vorhandenen Tests liefern eine Regressionsebene für diesen Schritt. Ein neuer grafischer Live-Modus oder eine Turnaround-Engine ist dadurch noch nicht getestet.
