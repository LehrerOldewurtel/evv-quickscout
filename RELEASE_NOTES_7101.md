# 7.10.1 RC – Libero-Aufschlag / Zielzonen

- Ein Libero wird in der EVV-Konfiguration niemals als Aufschläger angezeigt. Vor dem Aufschlag des vertretenen Mittelblockers auf P1 erfolgt die automatische Rückkehr des Mittelblockers.
- Wenn der vertretene Mittelblocker die Vorderreihe erreicht, wird der Libero automatisch deaktiviert; in der Hinterreihe wird er nach der gespeicherten Zuordnung wieder eingesetzt. Manuelle Zuordnung im Coach wird gespeichert.
- Die ursprüngliche Zuordnung bleibt auch während der temporären Rückkehr erhalten; Undo umfasst sie.
- Zielzonen-Dialog nach eigenem Ass, eigenem Kill oder Gegner-Kill deutlicher gestaltet, große antippbare Felder.
- Cache-Busting / Versionsanzeige aktualisiert.

## Grenzen / vor Freigabe
- Keine vollständige FIVB-Regelprüfung der Zwei-Libero-Austauschintervalle, Aufstellungszettel und Libero-Replacements. Automatik bildet die gewünschte MB/Libero-Grundzuordnung ab.
- iPad Chrome und Apple Pencil müssen praktisch geprüft werden; Browser-Tests hier nur simuliert.
- Bestehender historischer Static-Test `test_patch_797_static.js` prüft veraltete Quelltext-Fragmente/Cacheversion und schlägt erwartungsgemäß fehl; kein funktionaler Test.
- Backup vor Veröffentlichung exportieren. Noch kein uneingeschränkt freigegebenes 8.0 Release.
