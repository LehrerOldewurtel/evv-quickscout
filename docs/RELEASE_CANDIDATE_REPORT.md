# Auftrag 5 · Spieltags-Generalprobe / Release-Kandidatenbericht

Historischer Bericht zu Auftrag 5. Für den finalen Kandidaten vom 27.10.2026 gilt
[FINAL_RELEASE_REPORT.md](FINAL_RELEASE_REPORT.md) mit dem neuen 100-Match-Lauf und der ZIP-Abnahme.

Stand: 26.10.2026. Basis `dev/v8-tactics-reliability` (`b01e625`), Folgebranch `dev/v8-matchday-rehearsal`. Produktversion unverändert **7.19.0-k1-auto-mb**. Dieser Bericht ist keine V8.0-Versionsfreigabe.

## Tatsächlich ausgeführte Prüfung

Der vollständige Lauf `npm run qa:release` bestand mit **68/68 Node-Tests** und **72/72 Playwright-Tests**; keine aktuellen Tests fehlgeschlagen, übersprungen oder flaky. Installation aus unverändertem Lockfile, Syntaxprüfungen und `git diff --check` bestanden. Alle vorherigen 39 Node- und 66 Browserfälle sind enthalten. Eine bisherige Statistik-Assertion wurde von der nachweislich falschen Chancenquote auf den fachlich richtigen Rallye-Nenner umgestellt; die alte Chancenquote bleibt als zusätzliche Kennzahl geprüft.

[Automatisch erzeugter Bericht](qa/phase5/release-candidate.md), [maschinelle Ergebnisse mit Testnamen/Messwerten](qa/phase5/release-candidate.json), [Node-TAP](qa/phase5/node.tap), [Matchpläne und Prüfsummen](qa/phase5/20-matchdays.json), [Replay-Vergleich](qa/phase5/replay.json).

| Simulation | Matches | Sätze | Rallyes | Aussage |
|---|---:|---:|---:|---|
| Neue detaillierte Spieltage, Seeds 501–520 | 20 | 80 | 3.560 | 72.409 Kontakte; Prüfung nach jeder Rallye |
| Bestehende Punktesimulation | 100 | 400 | 19.990 | Spiel-/Satzregeln mit verlängerten Sätzen, keine detaillierten Kontakte |
| Tatsächliche Browserbedienung, 390/820/1024 px | 3 | 9 | 288 | Je 96 Rallyes, alle Aktionen per UI |

Zusätzlich bestanden die bisherigen 100 isolierten Rallye-Ereignisketten. Diese sind **keine weiteren vollständigen Matches**. Undo/Wiederholung wird nicht als zusätzliche endgültige Rallye gezählt.

Die 20 detaillierten Matches enthalten zehn Drei- und zehn Fünfsatzmatches mit unterschiedlichen Startsechsen/Startrotationen, sämtlichen Rotationen, K1/K2, A0/D0, Angriffskills, Angriffsfehlern, Blockpunkten, Gegnerfehlern, Mehrfachangriffen und kontrollierten Transitions. 160 Wechsel/Rückwechsel, 230 Undo mit erneuter Erfassung, beide gemeldeten Liberos und Annahme-/Abwehrbibliotheken R1–R6 werden geprüft. In dieser Serie gewinnt EVV; gegnerische Matchsiege sind im beibehaltenen 100-Punktematch-Test abgedeckt.

Das unabhängige Sollmodell importiert keine App-Funktion und erzeugt Kontakte/Ergebnisse vor deren Ausführung. Nach jeder Rallye werden Score, Aufschlag, Rotation, K1/K2, Kontaktfolge, gesamte Satzhistorie, Spieler-/Rotations-/Turnaround-Statistik, Wechselereignisse, Libero und Formationen verglichen. Tatsächliches Autosave wird trotz deaktiviertem Rendering ausgelöst. Nach jedem Match wird der gespeicherte Zustand in einer vollständig neuen App-Instanz verglichen. Alle 20 Plan-Prüfsummen stimmen mit dem vorherigen erfolgreichen Lauf überein.

## Nachgewiesene Fehler und Korrekturen

1. **Falscher Nenner der Transition-Punktquote:** mehrere Chancen in einer Rallye senkten die vermeintliche Rallyequote. Jetzt zwei ausdrücklich beschriftete Kennzahlen (siehe unten). Rotbeleg: `qa/phase5/before.log`.
2. **Unvollständige Gegnerfehlerzählung:** direkte Gegner-Annahme-/Abwehrfehler sowie Fehler beim zweiten Ball fehlten. Sie bleiben getrennt von eigenen Angriffskills und Blockpunkten. Derselbe Rotbeleg.
3. **Libero nach Satzwechsel im Schnellmodus nicht sofort aktiv:** übernommene Konfiguration wird jetzt vor der ersten Rallye synchronisiert. Rotbeleg: `libero-before.log`.
4. **HTTP 503 blockierte App-Start trotz Cache:** erfolglose HTTP-Antworten verwenden den vorhandenen Cache-Fallback. Rotbeleg: `cache-before.log`; Regression mit realem Service Worker, Netzwerkantwort 503 und tatsächlichen Verbindungsabbrüchen bestanden.
5. **Kontakt-ID-Kollision nach Wiederherstellung:** Neustart setzte den Eingabezähler zurück; gespeicherte IDs konnten erneut vergeben werden, wodurch die Deduplizierung einen echten Angriff entfernte. Neue IDs werden gegen den aktuellen Entwurf geprüft. Rotbeleg: `restart-before.log`; sowohl Node-Neuladen als auch echter Chromium-Prozessneustart bestanden.

Ein anfänglicher Simulationsgenerator ließ in manchen Matches keinen K1-Verlust zu; die Szenario-Abdeckungsassertion schlug deshalb korrekt an. Der Generator erzwingt jetzt A0/D0-Situationen. Das war ein Testdatenproblem, kein weiterer App-Defekt. Beim Cache-Test wurde die bereits vorhandene Initialisierung des leeren `sixBoards`-Feldes zunächst als Byteänderung erkannt; die Referenz wird jetzt nach dieser regulären Initialisierung aufgenommen. Spielinhalte werden weiterhin vollständig verglichen.

## Statistik und Coaching

- **Rallyebezogene Transition-Punktquote:** gewonnene Rallyes mit mindestens einer kontrollierten Chance / alle Rallyes mit mindestens einer solchen Chance.
- **Chancenbezogene Transition-Verwertungsquote:** gewonnene Rallyes mit Chance / Anzahl aller kontrollierten Chancen. Eine Rallye kann höchstens einen Punkt beitragen.
- Transition-Kill-Quote bleibt Angriffskills nach Chance / kontrollierte Chancen. Blockpunkte und Gegnerfehler sind keine Angriffskills.
- Beispiel des unabhängigen Regressionstests: drei Transition-Rallyes mit insgesamt sechs Chancen, zwei gewonnene Rallyes und ein Kill ergeben **66,67 % / 33,33 % / 16,67 %**.
- Fehlende Beobachtung wird in Analyse und Rallyehistorie kenntlich gemacht. First-Attack-/Kill-bis-N-Angriffsquoten schließen ausdrücklich unvollständige Rallyes aus; Transition-Quoten beziehen sich auf tatsächlich erfasste Chancen. Unbekannte Kontakte werden nicht ergänzt.
- Aus der Analyse öffnet eine bewusst gewählte Rotation direkt die Annahme- oder Abwehrformation IV/III/II. Rotation und Kontext bleiben sichtbar. Öffnen/Filtern verändert weder Aufstellung noch gespeicherte Formation; gespeichert wird ausschließlich ausdrücklich im Editor.

## Bedienung und Datensicherheit

Die drei Browsermatches durchlaufen Setup, Libero-Konfiguration, beide Erfassungsmodi, Wechsel/Rückwechsel, Taktikbearbeitung, unterbrochene Rallye mit Reload, Satzvorlage, Matchabschluss, tatsächlichen Datei-Export, neues synthetisches Match, Reimport und erneutes Laden. Ein separater Test schließt und startet den Chromium-Prozess mit einem ausschließlich für den Test erstellten Profil neu.

Schnellmodus auf 390 und 820 px: Ass **1**, A0/D0 **2**, Angriffspunkt **2**, Abwehr gewonnen **1**, Transition → Kill **3** Taps. Setup/Moduswechsel sind hierbei ausgeschlossen; Undo benötigt keinen Bestätigungsdialog. Die vollständigen Generalproben benötigen **245/244/244 Taps** plus **18/18/19 Auswahlaktionen**, je zwei Texteingaben und eine Ziehbewegung. Native Select-Menüs wurden per `selectOption` bedient; ihre internen Bildschirm-Taps werden nicht als gemessen behauptet. Bestätigungen bleiben für Startaufstellung, Wechsel und Import erhalten.

Autosave, Wiederaufnahme, markierte noch offene Punkte, Migration der V7.9.2-/vorherigen-main-Fixtures, gültiger Reimport, beschädigte Imports, Rohdatenrettung und Quota-Warnung bestanden. Größter gespeicherter Zustand der detaillierten Serie: **2.262.892 UTF-16-Codeeinheiten**; unter der JSDOM-Testgrenze von 5.000.000. Das garantiert keine identische Gerätequota. Bei Speicherfehlern bleibt der letzte dauerhafte Stand erhalten, der neuere Stand im Arbeitsspeicher wird mit dauerhafter Exportwarnung angezeigt.

Cache-Prüfung: Auftrag-4-Worker → aktueller Worker → absichtlich fehlgeschlagene Installation → funktionierender Fallback bei 503 und Offline → erneute Installation des vorherigen Workers → Offline-Reload. Fremde Origin-Caches und Spieldaten bleiben erhalten. Getestet ist ein **Service-Worker-/Cache-Rollback bei kompatibler App**, kein Downgrade auf beliebige alte App- oder Datenversionen. Ein funktionierender Offline-Start setzt eine vorherige vollständige Installation voraus.

## Historische Prüfungen

Alle neun historischen Skripte wurden erneut ausgeführt: **ein Erfolg, acht weiterhin fehlgeschlagene archivierte Prüfungen**. Die acht Dateien wurden byteidentisch verschoben. Klassifikation und ausführbare Migration: [Legacy-Register](../tests/legacy/README.md), [tatsächliche Ausgaben](qa/phase5/legacy-audit.json). Ursachen: drei veraltete Quelltextprüfungen, drei veraltete Versionsannahmen, zwei unvollständige Testumgebungen. Keiner dieser ursprünglichen Fehlschläge war ein Beleg für einen aktuellen Funktionsfehler. Fünf zusätzliche Verhaltenstests ergänzen die bestehende Regression; keine echte Funktionsprüfung wurde zur Grünfärbung entfernt.

## Offene Risiken und Freigabeempfehlung

**Empfehlung: bereit zur Review und kontrollierten Generalprobe auf den vorgesehenen Geräten. Keine uneingeschränkte Spieltags-/V8.0-Freigabe allein aufgrund dieser Automatisierung.** In den tatsächlich geprüften Abläufen sind keine bekannten kritischen Fehler offen.

Noch nicht abgenommen: echtes iPad/iPhone mit Safari/PWA, Pencil, Betriebssystemabbruch/Stromverlust, Speicherverdrängung durch das Betriebssystem sowie native Hybrid-Hülle. Prozessneustart wurde mit geordnetem Chromium-Schließen geprüft. Sehr lange Matches können die lokale Quota erreichen; ein Export bleibt dann erforderlich. Browserprofil-Löschung oder ein verlorenes Gerät kann die ausschließlich lokalen Daten weiterhin vernichten; kein geräteübergreifendes Backup ist vorhanden.

Automatische Rückwärtsmigration beliebiger Datenversionen und atomare Auslieferung eines kompletten App-Releases sind nicht zugesichert. Bereits vor dieser Korrektur gespeicherte Ketten mit kollidierenden IDs werden nicht ungefragt umgeschrieben; sie benötigen bei auffälligen Kennzahlen eine Prüfung des Originalexports. Historisch nicht erfasste Kontakte lassen sich nicht rekonstruieren.

Produktionsdaten wurden nicht verwendet oder verändert. `main` und Produktversion bleiben unverändert; kein Merge, keine Veröffentlichung. PR-Abhängigkeiten und geprüfte Commit-Stände sind im [Repository-Audit](REPOSITORY_AUDIT.md) aufgeführt.
