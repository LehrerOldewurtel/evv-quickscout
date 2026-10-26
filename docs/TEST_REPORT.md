# Testbericht · 26.10.2026

Basiscommit `f6b316b`, Entwicklungsbranch `dev/v8-qa-foundation`. App-Version bleibt `7.19.0-k1-auto-mb`; Paketversion `8.0.0-dev` bezeichnet das neue Entwicklungs-/Testsystem. Kein V8.0-Release und keine native Gerätefreigabe.

## Tatsächlich ausgeführte Prüfungen

| Prüfung | Ergebnis |
|---|---|
| Vor Korrektur: Rotation R1–R6, je sechs Sideouts (ein Umlauf) | 6/6 bestanden |
| Vor Korrektur: vollständiger erster Node-Lauf | 14/16 bestanden; zwei nachgewiesene Fehler |
| Nach Korrektur: Node-Unit-, Rotations- und Simulationstests | 17/17 bestanden, keine übersprungenen Tests |
| Playwright Chromium, sechs Szenarien × sechs Startrotationen | 36/36 bestanden, keine übersprungenen Tests |
| Historische neun Testskripte am Ausgangsstand | 1 bestanden, 8 fehlgeschlagen; Details im Audit |
| Installation aus Lockfile (`npm ci --ignore-scripts`) | erfolgreich |
| `node --check app.js`, `compact.js`, `sw.js`; `git diff --check` | erfolgreich |
| `npm audit --omit=optional` | 0 gemeldete Schwachstellen zum Prüfzeitpunkt |
| GitHub Actions in GitHub | Ergebnis nicht abgefragt; Workflow hinzugefügt |

Laufzeit: Node 24.19.0, npm 11.9.0, Python 3.12.14, Chromium 154.0.8037.57, Playwright 1.56.1. System-Chromium wurde erfolgreich verwendet; echte Safari-/iPad-Abdeckung folgt daraus nicht.

Rohbelege: `qa/before-fixes.log`, `qa/after-fixes.log`, `qa/browser-results.json`, `qa/legacy-results.json`, `qa/100-matches.json`. Generierte Artefakte künftiger Läufe liegen separat in `artifacts/`.

## Nachgewiesene Fehler und Korrekturen

- **D0 ohne Punktabschluss:** Test erwartete nach EVV-D0 Gegnerstand 1, tatsächlich 0. Beide D0-Zweige (EVV/Gegner) beenden nun die Rallye unmittelbar, speichern die Abwehraktion und vergeben den Punkt an die andere Mannschaft. Unit-Test und Browserfälle in allen Startrotationen prüfen die Korrektur.
- **Regulärer Wechsel eines gemeldeten Liberos:** Test meldete den bisherigen Feldspieler `lion` als Libero. `applySub('michael','lion')` gab vorher `true` zurück. Die Validierung prüft nun auch `st.liberoIds`. Regression erwartet `false`.

Nur diese drei Stellen in `app.js` wurden geändert. Keine Rotation, kein Speicherformat und keine produktiven Spieldaten geändert.

## 100 Testmatches

100 Matches, 400 Sätze und 19.990 Rallyes wurden geprüft, darunter 50 Fünfsatzmatches. Ein zweiter Lauf erzeugte byteidentische Ergebnisse. Ergebnisartefakt SHA256: `6a0ae5a7ae881f46e4e0ee01eaa871d5f7824205117d7181ca83ce53f4b7bd39`.

Seeds 1–100 mit festem uint32-LCG; verlängerte Einstandsphasen und explizite Satzsieger. Gerade Seeds erzwingen einen fünften Satz, ungerade Seeds drei Sätze. Unabhängig geprüft werden Siegerstrom, jeder Vor-/Nachstand, Aufschlag, Rotation, K1/K2, Satzende, drei Gewinnsätze, Archiv und Reset.

Die Matches verwenden Quick-Aktionen und deaktivieren ausschließlich im Test-Harness das Rendering. Die vollständige Spielerstatistik und detaillierte Ballkontaktketten sind damit nicht für 100 Matches unabhängig verifiziert. Diese Grenzen dürfen nicht als bestanden ausgegeben werden. Detaillierte Rallyeketten werden durch die 36 Browserfälle geprüft.

## Touch-Eingaben und Dialoge

Messung: Chromium mit Touch bei 820×1180, für jede Rotation wiederholt. Setup ausgeschlossen. Auswahlfelder bei Wechseln sind separat von Taps auf Buttons zu betrachten.

| Typischer Ablauf | Taps bis Punktabschluss |
|---|---:|
| K1: Annahme → Zuspiel → Weg → Angreifer → Kill → Zielzone | 6 |
| K2: Aufschlag IN → Gegnerannahme → Zuspiel → Richtung → Block → Blocker → Blockpunkt | 7 |
| Lange K1-Rallye mit drei Angriffen und zwei Transitions | 24 |
| Direkte A0-Annahme | 1 |

Der K1-Browseranhang zählt zusätzlich Undo, also insgesamt 7; der Abschluss selbst wird im Test bei 6 geprüft. Wechsel/Rückwechsel messen vier Button-Taps und zusätzlich vier `selectOption`-Auswahlen; diese entsprechen keiner vollständig vermessenen nativen Touch-Auswahlfolge.

Unnötiger Schritt: Nach Auswahl von Zuspielweg/Spieler erscheint noch eine Angreiferauswahl mit genau demselben einzigen Kandidaten. Einsparpotenzial ein Tap je Angriff, drei bei der langen Rallye. Der Zielzonendialog kostet ebenfalls einen Tap; selbst „Überspringen“ spart diesen Tap nicht. Er ist für Landepunktdaten fachlich sinnvoll, könnte für einen optionalen schnellen Erfassungsmodus entfallen. Keine Bedienlogik ohne eigenen Regressionstest geändert. Wechselbestätigung, neue Satzaufstellung und Schutz vor Überschreiben sind fachlich sinnvolle Dialoge.

## Verbleibende Probleme und Grenzen

1. Kein nativer Hybrid-Container, keine echte iPad-/Safari-/Pencil-/Sprachabnahme; V8.0 weiterhin Entwicklungsziel.
2. Versionsangaben im Manifest/HTML und historischen Dokumenten weichen von `version.js` ab; Cache-/Offline-Update inklusive `compact.js` muss separat getestet werden.
3. Die alten Test-Harnesses bleiben unvollständig bzw. versionsgebunden und weiterhin rot. Sie wurden nicht mit geänderten Erwartungen künstlich grün gemacht.
4. Importdaten werden nur teilweise strukturell validiert. Fehlformatierte oder manipulierte Backups, Migrationsfälle und Quota-Fehler benötigen eigene Sicherheits-/Datenerhaltungstests.
5. Vollständige DVV-/FIVB-Sonderwechselregeln, alle freien Aufstellungen und unabhängige Spielerstatistiken sind nicht vollständig geprüft. Die Rotationstests verwenden die dokumentierte Standardsechs.
6. Die redundant angebotene Angreiferbestätigung bleibt als belegtes Bedienproblem dokumentiert.
7. Der erste REST-Aufruf über `gh api` meldete `Forbidden`. Push und anschließende PR-Erstellung mit `gh pr create` waren erfolgreich: https://github.com/LehrerOldewurtel/evv-quickscout/pull/1. Für diesen PR besteht damit kein offener Zugriffsblocker. Installations-/Startanweisungen und `api.github.com` sind im Umgebungsentwurf gespeichert; Veröffentlichung der Umgebung bleibt ein separater Schritt.

Produktionsdaten wurden weder geladen noch verändert; Browserfälle verwenden frische Kontexte und ausschließlich synthetische Matches. Kein Merge und kein Deployment durchgeführt.
