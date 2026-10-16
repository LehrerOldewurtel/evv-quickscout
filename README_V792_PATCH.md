# QuickScout V7.9.2 – freie Positionszuordnung

## Umgesetzt
- Startaufstellung: Spieler und Rolle (Z, D, AA1, AA2, MB1, MB2) separat für jeden Startplatz wählbar.
- Jede Rolle muss genau einmal vergeben sein; doppelte Spieler werden verhindert.
- Neuer Satz: Startsechs und Rollen frei verändern oder vorbelegte Aufstellung übernehmen.
- Angriffswege und Libero-Berechtigung verwenden die gewählte Spielrolle statt der starren Kaderrolle.
- Reguläre Spielerwechsel übertragen die taktische Rolle auf den Einwechselspieler.
- Kader ergänzt um Arthur, Lion, David und Reinhold; Maxim-Anzeige vereinheitlicht.
- Rollen werden lokal und im JSON-Export mitgespeichert.

## Tests
- `node --check app.js`: bestanden.
- `node TEST_V792_ROLLEN.js`: bestanden.
- `node TEST_WECHSEL_V791.js`: bestanden.
- Der alte `TEST_SATZWECHSEL.js` prüft die frühere Oberfläche ohne Rollenfelder und ist für V7.9.2 nicht mehr geeignet.

## Noch nicht Teil dieses Patches
- Frei editierbare Annahmeriegel je Rotation, animierte Taktiktafel, vollständiger Timeout-Coach.
- Reale iOS-Browserprüfung und vollständiger End-to-End-Matchtest.
- Bestehende lokale Spieldaten bleiben unter dem bisherigen Speicherschlüssel erhalten; vor einem Update zur Sicherheit JSON-Backup exportieren.
