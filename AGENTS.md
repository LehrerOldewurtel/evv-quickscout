# Verbindliche Regeln für EVV QuickScout

## Arbeitsweise
- Änderungen ausschließlich in Entwicklungsbranches; `main` weder direkt ändern noch pushen. Merge nur mit ausdrücklicher Freigabe des Auftraggebers.
- Bestehenden Checkout verwenden: Cloud-Tasks sind bereits isoliert. Keinen zusätzlichen Worktree ohne ausdrücklichen Auftrag anlegen.
- V8.0 ist ein Entwicklungsziel. Die aktuelle App bleibt bis zur geprüften Freigabe als 7.19.0 gekennzeichnet. Kein stabiles Hybrid-/Native-Release behaupten, solange Container und Geräteabnahme fehlen.
- Erst reproduzierbaren fehlgeschlagenen Test erstellen, dann den nachgewiesenen Fehler gezielt korrigieren und betroffene sowie notwendige Regressionstests erneut ausführen. Keine beiläufigen Refactorings.
- Die Projektrotation ist R1→R2→R3→R4→R5→R6→R1; die tatsächlichen Feldpositionen wandern P1→P6→P5→P4→P3→P2→P1. Historische Anleitungen enthalten widersprüchliche Folgen und sind keine aktuelle Spezifikation.
- K1 = Annahme/Sideout, K2 = eigener Aufschlag/Breakpoint. Eine laufende Rallye erhält genau einen Punkt. A0/D0 bedeuten direkten Ballverlust. Transition ändert nicht die ursprüngliche K1/K2-Phase der Rallye.

## Daten und Sicherheit
- Keine produktiven Spieldaten, Browserprofile oder Backups für Tests verwenden, importieren, verändern oder löschen. Ausschließlich synthetische Matches in frischen Browserkontexten und getrenntem localStorage.
- Keine Secrets, Tokens, echten Backups oder personenbezogenen Testdaten committen oder protokollieren. Bestehende lokale Änderungen bewahren.
- Kein Deployment, kein Schreiben auf GitHub Pages und kein automatischer Merge. PRs dienen der Review.
- Mikrofon nur nach expliziter Nutzeraktion; erkannte Sprache weiterhin vor Übernahme bestätigen. Keine automatischen Wiederholungen der Aufnahme.
- TLS-, Signatur- und Prüfsummenvalidierung nicht abschalten. Lockfile verwenden; Abhängigkeiten nicht unbemerkt aktualisieren.
- Destruktive App-Aktionen müssen einen klaren Schutz vor unbeabsichtigtem Datenverlust bieten. Importdaten als untrusted input behandeln; keine HTML-Ausführung aus Daten zulassen.

## Testpflichten
- Vor Spielregeländerungen zuerst `node --test tests/rotations.test.cjs` für alle sechs Startrotationen.
- Vor PR: `npm ci --ignore-scripts --cache /workspace/.npm-cache`, `npm test`, `npm run test:e2e`, `node --check app.js`, `git diff --check`.
- Browser: Chromium via `CHROMIUM_PATH` oder `/usr/bin/chromium`; CI verwendet Playwrights installierten Browser. Lokalen Server nur an Loopback binden.
- `tests/harness.cjs` lädt die vollständige App. Instrumentierung und Render-Unterdrückung gehören ausschließlich in den Test-Harness, niemals in den Produktivpfad.
- Match-Oracle unabhängig von den App-Funktionen halten. Seeds, Ausgangsbedingungen und Artefakte dokumentieren. 100 Quick-Matches ersetzen keine detaillierten Rallye- oder Gerätetests.
- Keine erfundenen Ergebnisse: bestanden, fehlgeschlagen, übersprungen und nicht ausgeführt ausdrücklich unterscheiden. Historische Testberichte sind keine aktuelle Evidenz.
- `docs/QA_PLAYBOOK.md`, Audit und Testbericht bei Änderungen an Testumfang/Spielregeln aktualisieren. Offene Defekte nicht durch gelockerte Assertions verdecken.
