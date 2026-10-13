# EVV QuickScout 7.9.0 – integrierter Testkandidat

## Pakete
1. **Stabilisierung**: vorhandene Rallye-Logik, A0 direkter Gegnerpunkt, Undo und Satzwechsel übernommen; Syntax und Regressionstests ausgeführt.
2. **Aufstellung**: P1–P6 vor jedem Satz wählbar, Startrotation/K1/K2, Historie getrennt.
3. **Statistik**: Spieler/Rotation/K1/K2, Satz und Match, Effizienz, A2+A3 und Stichprobengrößen.
4. **Coaching**: regelbasierte Hinweise mit Mindeststichproben, getrennte K1/K2-Anzeige.
5. **Trainingsplanung**: druckfertige 105-Minuten-Vorlage plus Matchbriefing-PDF.
6. **Bedienung**: Backup als JSON, druckbarer Matchbericht, vorhandene Quick-Aktionen; erweiterte 9-Zonen-A/B/C/D-Analyse **noch nicht implementiert**.

## Test und Einschränkungen
- JavaScript-Syntax geprüft; Satzwechsel-Regression bestanden; bestehende Tests teils versionsgebunden und deshalb nicht unverändert grün.
- **Kein vollständiger echter Browser-/iPad-End-to-End-Test durchgeführt.**
- Wechselprüfung ist ein zusätzlicher Schutz für sechs reguläre Wechsel und Paar-Rückwechsel, aber **keine vollständig geprüfte DVV-/FIVB-Regelengine** (Sonderfälle wie Verletzung, Libero-Austausch, Ausnahmesubstitution offen).
- Daten bleiben im lokalen Browser; vor dem Update über **Backup** exportieren, sobald neue Version geladen ist. Alte lokale Daten bleiben ansonsten im selben Speicher.
- Coaching-Hinweise sind statistische Prüfimpulse, keine automatische Ursachenfeststellung.
- Ein echter Saisonplaner mit dauerhaft gespeicherten Trainingseinheiten ist **nicht Teil dieser Version**.

## Installation ohne Terminal
GitHub-Branch `test-v7-8-1` wählen, **alle Webdateien aus diesem ZIP** hochladen, Commit, GitHub Pages Branch prüfen, Seite neu laden. Anzeige muss V7.9.0 zeigen. Vor dem Einsatz zuerst mit Testspiel prüfen.
