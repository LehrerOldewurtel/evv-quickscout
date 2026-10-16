# QuickScout 7.11.0 RC – Stand 16.10.2026

## Neu
- Libero 1 und Libero 2 lassen sich vor Spielbeginn aus dem Kader wählen, ausdrücklich auch Felix und Jonas.
- Die bestehenden freien Namen Anmol und Sascha bleiben als Kandidaten erhalten.
- Eine doppelte Libero-Meldung wird abgelehnt.
- Ein als Libero gemeldeter Spieler darf nicht gleichzeitig zur Start-Sechs gehören; Satzaufstellungen werden ebenfalls geprüft.
- Beim Spielstart bleiben die ausgewählten Libero-IDs erhalten; bestehende Export-/Importfelder werden weiterverwendet.
- Die sechs taktischen Felder (EVV IV/III/II, Gegner IV/III/II) bleiben unverändert.

## Tests
PASS: JS-Syntax; 9/9 Kern-Regression; 5/5 Release-Tests; 8/8 alte Libero-Konfiguration; Libero-Aufschlagtest; 6/6 Touch-Zonentests; 6 VIP-Prüfungen; neuer Flex-Libero-Test.
ALT/OBSOLET: `tests/test_combined_7102.js` erwartet zwei statt sechs Boards und schlägt deshalb fehl. Dieser Test ist kein gültiger Abnahmetest der aktuellen sechs-Felder-Ansicht.

## Nicht nachgewiesen / Release-Blocker
- Keine echte Chrome-iPad-Automation mit Touch/Pencil und Mikrofon.
- Kein vollständiger regelkonformer 5-Satz-/Zwei-Libero-Wechseltest, insbesondere zwischen zwei Liberos und Ersatzhandlungen.
- Keine vollständige end-to-end-Simulation mit 200+ Ballwechseln und Dateireimport.
- Auswahl von Felix/Jonas als Libero ist eine *Spielmeldung*, keine zulässige Umwidmung mitten im offiziellen Match. Ligaregeln und Spielbericht beachten.

## GitHub Pages
Vor dem Upload bestehendes Spiel als JSON exportieren. Inhalt des Unterordners `evv-quickscout-main` in das Repository-Stammverzeichnis kopieren. Chrome neu laden, Versionsanzeige `7.11.0-rc` prüfen. Kein Löschen der lokalen Browserdaten.

## Empfohlener Einsatz morgen
Nur nach kurzem Probelauf; während eines Pflichtspiels parallel offiziellen Spielbericht und einfache manuelle Notiz als Rückfallebene verwenden.
