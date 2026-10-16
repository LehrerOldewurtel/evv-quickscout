# QuickScout VIP 7.9.7 – Feldtest
- Liberonamen im Kader: Anmol (interne ID `amar`) und Sascha (interne ID `alex`). IDs absichtlich beibehalten, damit ältere lokale Spielstände lesbar bleiben.
- Mikrofon: expliziter Einmalstart pro Fingertipp. Kein automatischer Neustart nach Fehler, Ende, Bestätigung oder Verwerfen. Bei App-Wechsel und Schließen wird Aufnahme gestoppt.
- Gegnerfeld: zwischen Verschieben und Kill-Zonen-Tippmodus wechseln. Finger/Pencil-Punkt auf dem Feld zeigt die Zone und Koordinate an. Bisherige Rallyes bleiben unverändert. Spielerpositionen werden lokal gespeichert.
- Versions-/Cache-Bust auf 7.9.7.

## Teststand
Node-Syntax und vorhandene 9 Kern-, 6 VIP- und 5 Release-Prüfungen sowie 5 statische Patchprüfungen bestanden. Safari/iPad, Apple Pencil, echte Mikrofonberechtigungen, GitHub Pages und End-to-End-Tests **nicht** verifiziert. Kein finales Release.

## Veröffentlichung
Vor dem Überschreiben JSON exportieren. Den Inhalt des Ordners `evv-quickscout-main` ins GitHub-Repository kopieren. Auf iPad Safari Seite neu laden, bei altem Versionslabel Website-Daten/Cache der Seite prüfen. Falls die Seite abgestürzt ist: neu öffnen; mit `+ Neues Spiel` nur nach Datensicherung zurücksetzen.
