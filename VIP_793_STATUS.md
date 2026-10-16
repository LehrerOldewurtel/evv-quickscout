# QuickScout VIP 7.9.3 – Zwischenstand, 16.10.2026

Ausgangsbasis: hochgeladene `EVV_QuickScout_VIP_WIP_Schritt1.zip` (Claude WIP).

## In diesem Durchgang implementiert
- Freie Rollen Z/D/AA1/AA2/MB1/MB2 bleiben bestehen. Beispiel-Startaufstellung: Johann Z, Jens D, Michael AA1, Arthur AA2, Jannick MB1, Dirk MB2. **Nur Vorlage**, keine verbindliche Spielaufstellung. Maxim kann frei als AA oder MB zugeordnet werden.
- Taktische Skizze im Coach: sechs Feldspieler per Touch verschieben; Positionsskizze lokal speichern und zurücksetzen.
- Annahme pro Rotation individuell wählen, inklusive Diagonalspieler. Michael kann aus der Annahme genommen werden. Auswahl wird bei Spielerwechsel auf den eingewechselten Spieler übertragen (über vorhandene receiveIds nur teilweise; siehe Einschränkung unten).
- Gegner-Trendübersicht aus explizit erfassten Aktionen und letzten Rallyes.
- Visuelle Anpassungen für iPhone/iPad: Touch-Flächen, Kontrast, Fokus, Abstände, Spielfeld.
- Neue Speicherfelder werden auch bei alten Spielständen initialisiert.

## Automatisierte Prüfungen
- `node TEST_PAKET_1_2.js`: 13/13 erfolgreich (Versionsprüfung auf 7.9.3 aktualisiert).
- `node TEST_V792_ROLLEN.js`: erfolgreich.
- `node TEST_WECHSEL_V791.js`: erfolgreich.
- `node tests/test_regression_core.js`: 9/9 erfolgreich.
- `node --check app.js`: erfolgreich.
- `node TEST_SATZWECHSEL.js`: fehlgeschlagen (veralteter isolierter Test-Harness: `lineupEditor` nicht bereitgestellt). Kein bestandener Satzwechsel-Abnahmetest.

## Offene Punkte vor einer Release-Freigabe
- Annahmeplan muss bei Spielerwechsel, Liberoeintritt und Satzwechsel vollständig auf Spielberechtigung und Zuständigkeiten geprüft werden; aktuell werden ungültige Namen ausgefiltert.
- Die Taktiktafel ist eine frei verschiebbare Skizze, keine regelgeprüfte Laufweg-Animation; Überlappungsregeln und Startpositionen müssen separat geprüft werden.
- Gegneranalyse ist noch nicht symmetrisch zur EVV-Spielerstatistik; Trikotnummern und Ereignistypen sind teilweise aggregiert.
- K1/K2-Rotationsauswertung, Libero-Wechsel und Satzwechsel benötigen umfassendere End-to-End-Tests.
- Offline-Speicherung verwendet localStorage, nicht garantierte persistente Speicherung. Import aus Exportdatei fehlt. Sprachfunktion auf realen iPhones/iPads ungeprüft.
- Keine echte iPhone/iPad-Safari- oder PWA-Praxistestung durchgeführt.

**Status: BETA / kein vollständiger P3-P5-Abschluss.** Vor dem Einsatz ein JSON-Backup des alten Spielstands exportieren.
