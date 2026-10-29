# V8 Master Playbook – Abnahme des Entwicklungskandidaten

Stand: 2026-10-29T15:08:31.447580+00:00. Quell-QA erzeugt: 2026-10-29T15:01:05.456Z. Branch `dev/v8-master-playbook`, geprüfter Quellstand `eaac8beb3cb21dde181ae557f4b653618aad91de`. V8-RC, Produktkennung bleibt 7.19.0-k1-auto-mb. Kein Merge/Produktivdeployment.

| Anforderung | Status | Beleg |
|---|---|---|
| Ursachenanalyse vor Umsetzung; vorhandene Regression zuerst | PASS | [Systembericht](docs/V8_MASTER_SYSTEM.md), [Ausgangslauf](docs/qa/master-baseline/qa-run.json), fehlgeschlagene P0-Reproduktionen daneben |
| Sechs K1-Läufer, tatsächliches Zuspieler-Mapping, beide Teams, legaler Aufschlagkontakt und freie Ziele | PASS | `tests/master-playbook.test.cjs`, `data/formationen_5_1.json`, [alle sechs Läufer](docs/screenshots/master/README.md) |
| Stabile Identitäten, unabhängige Rotation, Startsechs/Rollen/Nummern, reguläre Wechsel/Rückwechsel/Undo | PASS | Node + Master-/Rotations-/Matchday-Browserfälle, [unveränderte 100 Match-Digests](docs/qa/master/ledger-comparison.json) |
| Echte L1/L2 beider Teams, beide MB über R1–R6, Rückkehr, Rallye-Abstand, keine Vorschauwechsel | PASS | Master-Node und Master-/Practice-Fixes-Browserfälle; Screenshots `libero-*` und `opponent-libero-*` |
| Ein gemeinsames Board, geschützter Spielbetrieb, Editor/Timeout, zwölf nummerierte Kreise | PASS | Master-/Defense-/Practice-Browserfälle, [Screenshots](docs/screenshots/master/README.md) |
| Fünf Pfeile, Körper und beide Enden, Maus/Touch, Undo/Redo, Reload/Export/Import | PASS | `master-playbook.spec.cjs`, tatsächliche Chromium-CDP-Touchgesten in `master-touch.spec.cjs`, `five-arrows.png` |
| Vier K2-Systeme; IV/II spiegelbildlich, III Einerblock, Hinterfeld I P3/P4 + P2 Nahsicherung | PASS | Defense-/Master-Node, Defense-Browser, vier Screenshots |
| Stammdaten und Mehrfachrollen ohne doppelte IDs | PASS | Master-Node, EVV-Nummern-/Rollen-UI, Altbestände beibehalten |
| Zuspiel-, A+-Mitte-, Angriffserfolg und Dankeballstatistik mit echten Nennern | PASS | unabhängige Sollwerte in `matchplan.test.cjs`; Matchplan-Browser, `setter-cockpit.png` |
| Matchplan-Ziele, Punktestand-Pacer, Deuce, Mitte-Soll/Ist, kleine Stichprobe | PASS | Matchplan-Node/Browser, `matchplan.png`, `middle-pacer.png` |
| Transition → Spieler → Kill, keine erfundenen/doppelten Ereignisse | PASS | 2 gemessene Browserfälle mit genau drei Eingaben, Spielerzuordnung im Hybrid-/Master-Test |
| Dark Glass, fünf Lucide-Zugänge, responsive, Fokus/Touch/Reduzierte Bewegung | PASS | vier Viewports, Kontrastregression, [46 Screenshots](docs/screenshots/master/README.md); native Geräte separat offen |
| Speicherung, alte Daten, Export/Import, Satzwechsel, Offline/Reload | PASS | vollständige Node-/Chromium- und zusätzliche WebKit-Auswahl; 100 alte Kontakt-/Score-Digests unverändert |
| Automatisierte Regression tatsächlich vollständig ausgeführt | PASS | Node 221, Chromium 174, zusätzliche WebKit-Auswahl 116; jeweils 0 Fehler/0 übersprungen/0 flaky; [Rohdaten](docs/qa/master/release-candidate.json) |
| Startbares Test-ZIP mit getrennten Testablagen | PASS | Vorab-ZIP tatsächlich entpackt/gestartet: acht frische Chromium-/WebKit-Kontexte, [Protokoll](docs/qa/master/preflight-package.json). Finale Datei wird separat geprüft: `downloads/v8-master/EVV-QuickScout-V8-Master.verification.json` und `DOWNLOAD_VERIFIED.json` |
| Draft-Pull-Request | FAIL – externer Zugriffsblocker | aktive Cloud-Policy verweigert `api.github.com`; Git funktioniert. Konkreter PR-Text: [PR_MASTER_V8.md](docs/PR_MASTER_V8.md) |
| GitHub-Actions-Ergebnis am endgültigen Remote-HEAD | NICHT GETESTET | API-Zugriff blockiert; lokale vollständige Regression oben nachgewiesen |
| Physischer Mac, iPad Safari, Hallenlicht, WLAN und Native-/Store-Abnahme | NICHT GETESTET | keine physischen Apple-Geräte verfügbar; Linux-WebKit ist kein iPad-Nachweis |
| Exakte Übereinstimmung mit früheren Lehrbildern | NICHT GETESTET | Bilder nicht im Upload; ausdrücklich eigenständige Vorschläge, keine Bildrekonstruktion |

100 detaillierte synthetische Matches: 400 Sätze, 17213 Rallyes, 271405 Kontakte, 1220 Undo/Wiederholungen, 800 reguläre Wechsel/Rückwechsel. Hinzu kommen 100 Quick-Matches, 100 isolierte Kontaktketten und komplette Browser-Matches. Originale Match-Oracles wurden nicht abgeschwächt.

Der abschließende Lauf startet `npm test` und `npm run test:e2e` parallel; beide Kommandos und Exitcodes sind vollständig in `qa-run.json` erfasst, der tatsächliche Runner liegt daneben als `run-parallel.cjs`.

Chromium führt die gesamte Suite einschließlich Maus und CDP-Touch aus. WebKit ist eine zusätzliche Auswahl: matchplan, defense, practice-fixes, cockpit, practice, release, hybrid, matchday und master-playbook; jeweils .spec.cjs, Chromium-Neustart ausgeschlossen. Unter paralleler Last gab es zuvor drei Überschreitungen des 30-Sekunden-Gesamtbudgets bei langen WebKit-Sequenzen; Ablaufspuren zeigten erreichte Bedienelemente ohne fachlichen Assert-Fehler. Diese abgebrochene Diagnoserunde bleibt in `webkit-load-timeouts.log` erhalten. Die vollständige endgültige WebKit-Auswahl verwendet 60 Sekunden je Test, einen Worker und unveränderte Assertions. Nicht ausgewählte Chromium-spezifische Fälle zählen nicht als WebKit-Pass und wurden nicht als übersprungene Tests versteckt.

Einschränkungen: [Systembericht](docs/V8_MASTER_SYSTEM.md) und [Paketgrenzen](release/KNOWN_LIMITATIONS.txt). Positionsvalidierung prüft relative Symbolmittelpunkte; echte Fußstellungen und Schiedsrichterentscheidungen sind davon nicht erfasst. Unbekannte alte Zuspiel-/Gegnerdaten bleiben unbekannt. Kein Produktivbackup wurde verwendet. Keine öffentliche Test-URL eingerichtet; separater Mac-Teststarter ist die sichere Alternative.
