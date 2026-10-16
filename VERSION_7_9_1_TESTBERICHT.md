# EVV QuickScout V7.9.1 – Patch und Teststand

## Geändert
- Reguläre Wechsel verwenden eine gemeinsame Validierung für Bildschirm- und Spracheingabe.
- Ein Startspieler kann nach der ersten Auswechslung nur für seinen ursprünglichen Ersatzspieler zurückkehren.
- Ein ausgewechselter Ersatzspieler darf im selben Satz nicht erneut eingewechselt werden.
- Bereits aktive Spieler können nicht erneut eingewechselt werden.
- Wechselhistorie mit Satz-Spielstand, Ein-/Auswechslung und Kennzeichnung Rückwechsel direkt im Wechsel-Dialog.
- Die Startsechs wird beim Matchstart für die Wechselprüfung festgehalten.
- Version und Cache-Busting auf V7.9.1 aktualisiert.

## Automatisierte Prüfungen
- `node --check app.js`
- `node TEST_WECHSEL_V791.js`
- `node TEST_SATZWECHSEL.js`
- `node TEST_PAKET_1_2.js`

## Noch offen
- Vollständiger Browser-/iPad-End-to-End-Test und reale Rally-Erfassung sind hier nicht durchgeführt.
- Für aus älteren Versionen wiederhergestellte, bereits laufende Sätze ohne gespeicherte Startsechs kann die Wechselvalidierung eingeschränkt sein. Für den Test einen neuen Matchstart wählen.
- Angriffswege, Coaching-Kennzahlen und Match-Statistiken sind nicht grundsätzlich neu entwickelt; vor Live-Einsatz separat validieren.

## Installation
In GitHub im veröffentlichten Branch (`main`) die Dateien aus dem ZIP im Repository-Stamm ersetzen/hochladen, nicht den ZIP-Ordner als Unterordner. Nach Deployment Seite neu laden. Bestehende lokale Daten vorher mit `Backup` sichern.
