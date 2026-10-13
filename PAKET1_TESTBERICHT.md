# EVV QuickScout V7.8.0 – Paket 1: Stabilisierung

## Basis
Ausgangscode V7.7.3 GoldLoop. Unveränderte Ausgangsversion als ZIP separat behalten.

## Änderungen
1. EVV-Annahme A0 gibt nicht länger automatisch Gegnerpunkt. Rückfrage: direkter Punkt oder geretteter Ball. Rettung führt zum 2. Ball.
2. Gegner-Annahme A0 gibt nicht länger automatisch EVV-Punkt. Rückfrage: direkter Punkt oder geretteter Ball. Rettung führt zum Gegner-2.-Ball.
3. Ungültige Siegerwerte in `commit()` werden abgefangen.
4. Rallye-Undo räumt auch temporäre Rückschritthistorie und ausstehende Zielmarkierung auf.
5. Versionsanzeige, Assets und Cache-Kennung auf V7.8.0 aktualisiert.
6. Tests als ausführbares Node-Skript hinzugefügt.

## Prüfergebnis
`node --check app.js`: bestanden.
`node TEST_STABILITY_NODE.js`: 11/11 bestanden (Syntax, deterministische Regeln, Codepfade).
Browser-End-to-End: **NICHT BESTANDEN / NICHT AUSGEFÜHRT**. Playwright/Chromium verweigert in dieser Umgebung HTTP- und file-URL mit ERR_BLOCKED_BY_ADMINISTRATOR. Kein Anspruch auf vollständige Browservalidierung.

## Offene Punkte / Grenzen
- Die 5:1-Rotationsmatrix mit Läuferwegen, Angriffslaufwegen und Libero-Wechseln ist noch nicht anhand aller sechs echten EVV-Aufstellungen validiert.
- Die K1- und K2-Statistik sowie per-Spieler-Kennzahlen wurden nicht unabhängig gegen ein Referenzspiel nachgerechnet.
- A0 wird nun differenziert erfasst; D0/Abwehr sowie andere Endzustände bedürfen weiterer E2E-Tests.
- Bestehende gespeicherte Matchdaten liegen im Browser-localStorage; vor Deployment bitte alte Version und Daten sichern.
- Keine Garantie, dass GitHub Pages Cache sofort aktualisiert. Bei Bedarf Seite hart neu laden und Versionsbadge V7.8.0 prüfen.

## Manueller Kurztest nach GitHub-Upload
1. Neues Testspiel K1 starten. Michael A0: Stand bleibt 0:0, zwei Optionen sichtbar.
2. „Ball gerettet“: 2.-Ball-Menü sichtbar, weiterhin 0:0.
3. „Zurück“: wieder A0-Entscheidung. „Direkter Punkt Gegner“: 0:1.
4. Undo: 0:0, Rallye und ihre Statistiken zurückgesetzt.
5. K1 Quick EVV: 1:0, Wechsel zu K2, Rotation um eins weiter.
6. K2 Aufschlagfehler: 1:1, zurück zu K1.
7. K2 „im Spiel“ → Gegnerannahme A0: keine sofortige Punktvergabe; zwischen direktem Punkt und gerettetem Ball entscheiden.
8. Auswertung S1/LIVE/MATCH vergleichen, anschließend Satzwechsel nur bei regulärem Satzende.
9. Auf iPad/Safari separat testen: Offline, App-Reload, Undo nach Ace+Zielzone, Zurück innerhalb einer Rallye.

## Deployment
Im GitHub-Repository evv-quickscout nur die Dateien `index.html`, `app.js`, `styles.css`, `version.js`, `sw.js`, `manifest.webmanifest` aus diesem Paket in den Root laden und vorhandene ersetzen. Nicht das gesamte ZIP als Einzeldatei hochladen. Vorher Kopie des aktuellen Repositories und ggf. Export der Spielstände anfertigen.
