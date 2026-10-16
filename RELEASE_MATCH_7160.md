# EVV QuickScout 7.16.0-match — Match-Build

## Verifiziert (automatisiert)
- JS-Syntax, Kern-Regression, Satzende, Libero-Auswahl, Libero-Aufschlag, Touch-/Zonen-Regression, VIP-Funktionen.
- Versions-/Cache-Busting auf 7.16.0-match aktualisiert.
- Historisch ungueltige Auszeiten werden in der Anzeige auf 2/2 begrenzt und weiterhin mit Warnung markiert. Die Rohdaten bleiben fuer Nachpruefung erhalten.

## Noch nicht als erfolgreich nachgewiesen
- Reales Match ueber 5 Saetze, offizielle Zwei-Libero-Wechselfaelle, Praezision aller Pencil-Gesten auf Hardware, Browser-Reload mit echtem GitHub-Pages-Cache.

## Matchtag
1. Vor dem Hochladen: JSON-Export der bisherigen Daten.
2. Alle Dateien des Ordners ins Repository-Stammverzeichnis hochladen.
3. Seite neu laden und Version 7.16.0-match pruefen.
4. Testballwechsel + Undo, Libero-Wechsel, Rotation, Auszeit, Export/Import pruefen.
5. Papierbogen als Fallback bereithalten.

Die Anwendung ist eine statische HTML/CSS/JS-App; ein nativer Compiler ist nicht erforderlich.
