# Hybrid-Live-Entwicklung

Branch: `dev/v8-hybrid-live`, auf PR #1 (`935905e`) aufgebaut. Separater, gestapelter PR gegen `dev/v8-qa-foundation`; kein Merge und keine Veröffentlichung. Die Produktversionskennung bleibt gemäß AGENTS.md 7.19.0, bis eine Release-Abnahme erfolgt.

## Versionshistorie

V7.9.0 (`7269d1e`) war der integrierte Testkandidat. V7.9.2 (`d10c1b5`) ergänzte freie Rollen-/Positionszuordnung, rollenabhängige Angriffs-/Libero-Prüfung und Rollenübertragung bei Wechseln. Beide sind Vorfahren von V7.19 (`f6b316b`). Es wurde kein Stand zurückgesetzt; die bisherigen Tests bleiben unverändert vorhanden.

## Implementiert

- Umschaltbarer Schnell-/Detailmodus über der Live-Erfassung. Detailmodus bleibt Standard; beide Modi verwenden denselben `draft`, `st`, `commit`, Satz-/Rotationsablauf und Undo. Moduswechsel löscht keine Kontaktkette. Coach-/Statistikansichten bleiben verfügbar.
- Grafisches Live-Feld mit sechs tatsächlichen Regelpositionen einschließlich aktivem Libero. Große Spieler- und Aktionstasten, dauerhaft vorhandener Score-Header, direkter Undo ohne Dialog.
- Ass mit automatisch richtigem Aufschläger; A0/D0, Angriffspunkt/-fehler und Blockpunkt über Aktion plus berechtigten Spieler. Angriff verteidigt dokumentiert einen tatsächlichen Angriff ohne Punkt. Gegnerfehler schließt ohne erfundenen eigenen Angriff ab.
- „Abwehr gewonnen / Transition“ erfasst eine kontrollierte Chance ohne Angriff oder Punkt. Wiederholtes Tippen ohne intervenierendes Spielereignis zählt dieselbe Chance nicht erneut. Alte UI-Handler sind revisionsgebunden.
- `turnaroundMetrics` berechnet A = dokumentierte eigene Angriffe, B = kontrollierte eigene Transition-Chancen. Im Detailmodus gelten D2/D3 als kontrollierte Abwehr, D0/D1 nicht. Kennzahlen stehen je neuer Rallye unter `turnaround`, im Schnellmodus live und in der Rallyehistorie. Kills, Blockpunkte und Gegnerfehler bleiben unterschiedliche Ereignisse. Altdaten werden nicht nachträglich umgedeutet.
- Gegnerangriffe werden zusätzlich ausdrücklich in der Kontaktkette gespeichert. Ein bereits im Detailmodus erfasster offener Angriff wird beim Schnellabschluss abgeschlossen statt doppelt angelegt.
- Getrennte, validierte taktische Ziele und Laufwege pro Rotation R1–R6 (`saveHybridFormation`/`hybridFormation`). Speicherung/Export gemeinsam mit dem Match; keinerlei Einfluss auf `courtPos`, Rotation oder Aufstellung. Leere Formationen sind bewusst keine erfundenen Team-Annahmemuster. Ein visueller Formationseditor/Animation folgt separat.
- Service-Worker-Core umfasst nun auch Compact-UI und Manifest. Dies ersetzt keine vollständige Offline-Abnahme.

## Automatisierte Abnahme

Abgeschlossen: **31/31 Node-Tests**, **57/57 Playwright-Fälle**, keine übersprungenen Tests. Nach Ergänzung expliziter Gegnerangriffe zusätzlich **18/18 betroffene Browserfälle** erfolgreich wiederholt. Installation aus Lockfile, JavaScript-Syntax und Diff-Prüfung bestanden. Details siehe `qa/hybrid/`.

Neue 100 vollständige, deterministische Ereignisketten: Annahme, 0–5 eigene verteidigte Angriffe mit Gegnerabwehr/-zuspiel/-angriff und eigener kontrollierter Abwehr, anschließend Kill, Angriffsfehler, Blockpunkt oder Gegnerfehler. Unabhängige Sollzähler entstehen aus dem Szenariogenerator, nicht aus `turnaroundMetrics`. Für jede Kette werden beide Kennzahlen, genau ein Rallyeabschluss und der Sieger geprüft. Diese Ketten ergänzen die vorhandenen 100 vollständigen Quick-Matches; sie sind nicht als 100 weitere vollständige Matches auszugeben.

Zusatztests: gleiche Ereignis-ID, doppelte Transition, veralteter Handler, Detail-/Schnellwechsel ohne doppelten Angriff, Formationen R1–R6, Validierung und Reload. Playwright misst tatsächliche Touch-Taps ab eingerichtetem Schnellmodus (Setup und Moduswahl separat ausgeschlossen), jeweils 390 und 820 px:

| Situation | Eingaben bis Erfassung |
|---|---:|
| Ass | 1 |
| A0 / D0 | 2 |
| Angriffspunkt | 2 |
| Abwehr gewonnen | 1 |
| Transition → Kill | 3 |

Undo wird nach der Messung zusätzlich geprüft. Messrohwerte: `qa/hybrid/browser.json`.

## Behobene Fehler während der Implementierung

Der erste Ereigniskettentest deckte einen Kettenverlust beim generischen Quick-Abschluss auf. Der neue explizite Gegnerfehlerabschluss bewahrt die bestehende Kette. Ein offener Detailangriff wird beim Moduswechsel nicht doppelt gezählt. Ass verwendet den regulären Aufschläger und keine frei wählbare, gegebenenfalls unberechtigte Person. Berechtigungen für Annahme, Angriff und Block stammen aus der bestehenden Engine.

## Offene Grenzen

Keine native iOS-/Android-Verpackung, keine reale iPad-/Pencil-/Mikrofonabnahme. Kein visueller Editor/animierte Laufwege. Die bestehende Engine bleibt DOM-gebunden; die Kennzahlenfunktion ist rein, eine vollständige externe Reducer-Architektur ist noch kein Bestandteil. Nicht abgeschlossene Drafts überleben Moduswechsel, aber weiterhin keinen Browser-Neustart. Vollständige Offline-Migration, manipulierter Import und Quota-/atomare Speicherfehler bleiben Aufgaben aus PR #1. Ein wiederholter bewusster Abschluss einer neuen Rallye ist ein neuer Punkt; die Revisionssperre blockiert alte Handler, kein absichtliches mehrfaches Erfassen. Schnellmodus erfasst optionale Landepunkte/Zuspielqualitäten nicht; für diese Datentiefe bleibt der Detailmodus verfügbar.
