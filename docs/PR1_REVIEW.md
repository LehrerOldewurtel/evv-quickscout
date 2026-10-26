# Review von PR #1 · 26.10.2026

## Ergebnis

**PR #1 ist eine QA-/Stabilisierungsgrundlage, keine V8.0-Freigabe.** Die neu gefundenen Fehler werden im bestehenden Branch behoben. Ein Merge sollte erst mit grünen Checks des aktualisierten PR erfolgen; für einen produktiven Hybrid-Release reicht die Abdeckung weiterhin nicht. Kein Merge ausgeführt.

## Versionsbasis

PR basiert auf `f6b316b` (`main`, Version **7.19.0-k1-auto-mb**). V7.9.2 liegt bei `d10c1b5bcaefc313bb3ea55a091aa0802b9768cf` und ist nachweislich ein Vorfahr. Alle PR-Änderungen enthalten also V7.9.2 plus spätere Entwicklung; sie basieren nicht ausschließlich auf V7.9.2. Die remote angebotenen Branches/Tags liefern keinen neueren V7.9.2-Stand. Kein Downgrade vorgenommen.

## Bereits zuverlässig nachgewiesen

- Neue Node-Tests laden und führen die **vollständige App** in JSDOM aus. Nur für schnelle Simulationen wird Rendering abgeschaltet; keine kopierten Spiellogikfunktionen und keine Quelltextfragment-Assertions in diesen Tests. Playwright lädt die echte App und bedient sie per Touch. Die neun alten Skripte bleiben separat als Legacy dokumentiert.
- Vorhandene 100-Match-Evidenz nachgerechnet, nicht neu simuliert: **100 Matches, 400 Sätze, 19.990 Rallyes; 50 Dreisatz-/50 Fünfsatzmatches, kein Viersatzmatch**. SHA256 unverändert `6a0ae5a7ae881f46e4e0ee01eaa871d5f7824205117d7181ca83ce53f4b7bd39`. Seeds 1–100, Einstand/Verlängerung, Satz-/Matchende, Aufschlag, Rotation und Archiv geprüft. Ausschließlich Quick-Punkte; keine A0/D0-/Wechsel-/Detailkontakt-Matches in dieser Menge.
- Bisher 17 Node-/36 Browserfälle erfolgreich; außerdem zwei erfolgreiche GitHub-QA-Checks für PR-Stand `6f48a58` abgefragt. Detailfälle für K1/K2, A0/D0 beider Teams, Zielzonen/Undo, Wechsel/Rückwechsel, Satzwechsel und Reload werden separat ausgeführt. Alle sechs Rotationen sind abgedeckt, überwiegend mit der Standardsechs.
- Jetzt gezielt **26/26 Node-Tests** ohne die unveränderte 100-Match-Simulation sowie **19/19 Browserfälle** ausgeführt (7 neue + 12 betroffene bestehende Fälle). Zusätzlich **2/2 Importfälle** für die historischen synthetischen Backups bestanden. Der Sprachfall wurde nach Erweiterung der Schreibsperre nochmals einzeln bestanden. Keine pauschale Wiederholung der gesamten lokalen Suite.
- Synthetische Fixtures wurden mit den tatsächlichen historischen Apps V7.9.2 und `main` vor PR erzeugt. Geprüft: Update/Reload, Punkte, Satzarchiv, Aufstellung/Rollen, Wechsel, Markierungen und fortsetzbares Undo. Keine produktiven Backups benutzt. Speicherkey bleibt gleich; `liberoAutoEnabled` ist eine additive Einstellung. Ganze Schema-/Migrationstreue ist damit nicht pauschal bewiesen.

## Gefundene Fehler und gezielte Korrekturen

| Nachweis vor Fix | Korrektur |
|---|---|
| Update von V7.9.2 aktivierte vorher ungenutzten Libero | Alter Einsatzwunsch wird beim Laden/Import übernommen |
| „Kein Libero“ wurde sofort wieder aktiv | Expliziter, persistenter Ein-/Ausschalter; Rückkehr nach Reload getestet |
| Sprachaktionen einschließlich Undo änderten READ-ONLY-Ansicht | Gemeinsame Ansichtssperre für Sprache; Undo-Funktion einschließlich Draft-Reset |
| Sprachannahme A3 setzte `step:2`, verlor Annahmekette | Gültiger zweiter-Ball-Schritt und vollständiger Annahmekontakt |
| Undo ließ ausstehende Zielzonenbestätigung stehen | Alte Bestätigung wird geschlossen/entfernt |
| V7.9.2-Import und Reload ergaben unterschiedliche Initialisierung von Taktikfeldern | Gemeinsame Normalisierung ergänzt den fehlenden leeren `sixBoards`-Wert vor Speicherung |
| Beschädigtes JSON oder `null` im Speicher wurde beim Öffnen überschrieben | Automatisches Speichern bei Ladefehler gesperrt; Überschreiben erst nach expliziter Bestätigung eines neuen Spiels oder Imports |

Rohbelege: `qa/review-before-fixes.log`, `qa/review-storage-before-fix.log`, `qa/review-after-fixes.log`, `qa/review-browser-results.json`, `qa/review-import-results.json`, `qa/review-import-before-fix.json`, `qa/review-voice-before-fix.log`, `qa/review-voice-browser-results.json`. Libero-Aufschlagsverbot/Wiedereintritt wurde zusätzlich für alle Rotationen positiv geprüft. A0/D0 und die bisherigen markierten Undo-/Wechselprüfungen bleiben grün.

## Offene kritische Grenzen

Keine ungelösten Fehler aus den oben ergänzten Reproduktionen. Weiterhin **nicht als sicher abgenommen**: umfassend validierter/atomarer Import manipulierter Backups, alle beschädigten strukturierten Speicherzustände, Schreibfehler/Quota und vollständiger Offline-/Update-Lebenszyklus. Bei geblockter Wiederherstellung bleiben Rohdaten erhalten; es gibt noch keine komfortable Wiederherstellungsoberfläche. Persistenz auf gleichem Origin ist geprüft; Umzug auf einen anderen Origin übernimmt localStorage nicht automatisch.

Fehlende V8.0-Funktionen: native Hybrid-Verpackung/Bridge, grafische Live-Eingabe mit geringerem Tap-Aufwand, eigentliche Turnaround-Engine und vollständige kontaktbasierte Gegner-/Spielerstatistik. Echte Geräte-/Pencil-/Sprachtests fehlen weiterhin; ein simulierter Speech-API-Test ist kein Mikrofontest.

## Nächster Schritt

Das Repository ist **teilweise vorbereitet**: Taktikfelder, Aktionsketten, Rotations-/Angriffsoptionen und atomarer Rallyeabschluss existieren. Eine getrennte Turnaround-Engine mit Ereignisvertrag, Replay und Besitzwechselregeln existiert nicht. Der konkrete Datenvertrag, Implementierungsablauf, Tap-Ziele und die noch fehlende Hybrid-Testmatrix stehen in [V8_HYBRID_TURNAROUND.md](design/V8_HYBRID_TURNAROUND.md).
