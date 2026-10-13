# EVV QuickScout V7.8.1 – Pakete 1 + 2

## Implementiert
- Stabile Rotation R5→R6→R1→R2→R3→R4; Positionen P1–P6 aus Startsechs und Sideouts berechnet.
- Vorderreihe P2/P3/P4; Libero nur als Ersatz für einen MB in der Hinterreihe (P1/P5/P6), zwei Libero-Kandidaten bleiben erhalten.
- Vor dem Abschluss einer Angriffsaktion werden Spieler und Angriffsweg erneut gegen aktuelle Rotationsberechtigung validiert.
- A0 als Rettung oder direkter Punkt; Undo inklusive Zielmarkierungen; Satz- und Matchansicht aus Bestand übernommen.
- Tests als `node TEST_PAKET_1_2.js` mit 13 Prüfungen, zusätzlich `node --check app.js`.

## Grenzen – fachliche Freigabe steht aus
- L4: Michael, Dirk, Johann vorne, Jonas hinten. L5: Jonas, Michael, Dirk vorne, Johann hinten. Diese Viererzuordnung reicht NICHT zur eindeutigen P1–P6-Matrix. Die beiden fehlenden Spieler, die Reihenfolge P4/P3/P2 und die konkreten K1-Laufwege müssen bestätigt werden.
- Die Angriffswege sind Rollen-Defaults, keine individuell bestätigten K1-Läufer-Sonderwege. Nicht als vollständige 5:1-Taktik freigegeben.
- Browser-E2E war in dieser Laufzeit durch ERR_BLOCKED_BY_ADMINISTRATOR gesperrt. 13/13 bedeutet ausschließlich automatisierte Node-Logik-/Strukturprüfungen, kein echter Klicktest.
- Keine automatische Übernahme alter Spielstände in einen neuen Test empfohlen. Vor Upload JSON-/Matchdaten sichern.

## Vor Veröffentlichung manuell auf GitHub Pages prüfen
1. Versionsanzeige V7.8.1 und zwei Liberos je Mannschaft.
2. L4/L5: reale P1–P6-Aufstellung einstellen; in K1 alle tatsächlichen Angreifer und Laufwege kontrollieren.
3. A0 gerettet: kein Punkt. A0 direkter Punkt: genau ein Punkt; Undo stellt Punkt/Statistik zurück.
4. EVV Sideout: Rotation genau einmal. K2 Ass: keine Rotation; Aufschlagfehler: K1.
5. Blocktouch/Block-out, Dankeball und zweiter Ball: nur Punkt nach echtem Rallye-Ende.
6. Satzende, nächster Satz, S1/S2/MATCH, Zielpunkte und Undo nach Ace.

## GitHub
Bestehenden `main` vorab als Branch sichern; neue Dateien auf Test-Branch hochladen. Erst nach iPad-Test nach `main` übernehmen.
