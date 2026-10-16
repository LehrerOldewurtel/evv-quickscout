# QuickScout VIP 7.9.8 – Release Candidate für Chrome auf iPad

## Änderungen
- Libero 1 und 2 vor dem Match per Texteingabe konfigurierbar (auch nur einer oder keiner).
- Kadernamen der Liberos werden im lokalen Speicher und JSON-Export mitgesichert; alte Exporte ohne Kader bleiben lesbar.
- Libero-Auswahl beim Setup wird aus den eingegebenen Namen aufgebaut; kein hartcodiertes „Amar/Alexandra“ mehr.
- Cache-Version aktualisiert, damit Chrome auf iPad neue Assets abruft.
- Mikrofon bleibt manuell, ohne automatische Wiederaufnahme (aus Version 7.9.7).
- Taktiktafel und Gegnerfeld mit Pointer-Events für Touch/Stift (aus Version 7.9.7).

## Grenzen der Freigabe
- Keine echte Chrome-iPad- oder Pencil-Hardwareprüfung in dieser Umgebung.
- Vollständige regelkonforme Zwei-Libero-Verwaltung und Rotationsüberlappung weiterhin nicht nachgewiesen.
- 7.9.8 ist daher ein Release Candidate, kein abschließend zertifizierter Spielbetrieb-Release.

## Installation
Vor Update Match als JSON exportieren. Inhalt des Ordners evv-quickscout-main in GitHub veröffentlichen; danach Chrome-Tab schließen und neu öffnen. Versionsanzeige muss 7.9.8-rc zeigen. Bei alten Assets Cache/Sitedaten für die GitHub-Pages-Seite kontrollieren; Achtung: Sitedaten-Löschung entfernt unexportierte lokale Matches.
