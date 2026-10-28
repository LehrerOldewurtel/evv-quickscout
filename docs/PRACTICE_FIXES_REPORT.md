# EVV QuickScout V8 · Praxistest-Korrekturen

Stand: 28.10.2026. Entwicklungskandidat auf `dev/v8-practice-fixes`, keine stabile
V8-Freigabe. Produktkennung bleibt `7.19.0-k1-auto-mb`.

## Tatsächliche Ursachen und Korrekturen

1. **Formationen:** Der alte Editor enthielt nur eigene taktische Ziele und
   ersetzte seinen Arbeitsstand bei Navigation ohne Rückfrage. Die bestehende
   Formationsbibliothek speichert jetzt zusätzlich Ausgangsstellungen und nach
   Gegnerrotation getrennte Bilder. Beide Teams sind auf demselben Feld editierbar.
   Speichern, Speichern unter, Vorlage laden, Kopieren und Zurücksetzen sind
   verfügbar. Status, Verwerfungsabfrage und Browserwarnung schützen Änderungen.
   Ein Speicherfehler wird nicht als erfolgreicher Write bestätigt.
2. **Libero:** Die Vorschau verwendete den aktuellen Aufschlagstatus auch bei K1.
   Dadurch fehlte in den gemeldeten R3/R6-Fällen der Libero auf P1. Die reine
   Anzeige berechnet jetzt Startrotation, tatsächliche MB-Rollen, aktuelle
   Aufstellung/Wechsel und gewählte Phase. In K2 schlägt auf P1 weiterhin der
   Mittelblocker auf. Die Live-Libero-Synchronisation wurde nicht verändert.
3. **Gegnerdaten:** Die Analyse nutzte fest codierte Positionsnummern. Sie zeigt
   jetzt die erfassten Trikots und die dokumentierte Rotation. Sechs Nummern
   genügen auch für die Scouting-Auswahl; Namen werden nicht vorausgesetzt.
4. **Verschieben:** Beide Teams und beide Stellungsebenen sind bearbeitbar.
   Pointer-Capture bleibt am stabilen SVG; Auswahl/Zielklick ist ebenfalls möglich.
   Die Auswahlmarkierung verändert nicht mehr die Geometrie des Symbols.
5. **K2:** R1–R6 × IV/III/II werden separat gespeichert. Die Zuordnung erfolgt nach
   tatsächlichem Feldplatz und verwendet beim Anzeigen aktuelle Spieler und Libero.
6. **Auszeit:** Vergrößern öffnet eine Bildschirm-Präsentation mit beiden Teams,
   gespeicherten Wegen, K1/IV/III/II und sichtbarer Rotationsvorschau. Sie ist lesend.
   Auch auf dem iPhone bleiben Schließen und Verkleinern vollständig erreichbar.
7. **Kader und Symbole:** Alle taktischen Spieleransichten einschließlich alter
   Skizzen und Gegneranalyse verwenden Kreise: EVV blau, Gegner rot, Libero mit
   eigener Markierung. Niklas ergänzt den Kader als MB mit #5, ohne alte Startsechsen
   zu ändern. Eine bereits anders vergebene #5 bleibt erhalten. Unbekannte Nummern
   bleiben leer/?; bekannte Nummern sind vor versehentlicher Änderung geschützt.

## Ausgeführte Tests

| Prüfung | Bestanden | Fehlgeschlagen | Übersprungen |
|---|---:|---:|---:|
| Node einschließlich unabhängiger Match-Oracles | 167 | 0 | 0 |
| Chromium · vollständige Browserregression | 135 | 0 | 0 |
| WebKit · ausgewählte Regression und alle neuen Zwei-Team-Fälle | 78 | 0 | 0 |

Getesteter App-Code: `ca8f6b0`; finale Darstellung/Teststand: `3529b6e`.
Der vollständige Node-Lauf prüfte bereits exakt dieselben App-, HTML- und
Versionsdateien. Nach den abschließenden reinen CSS-Korrekturen wurde die
vollständige Chromium-Suite erneut ausgeführt; der erneute WebKit-Lauf prüft
ebenfalls die finale Darstellung. Diese Wiederverwendung ist mit alten und neuen
Asset-Hashes sowie tatsächlichen Start-/Endzeiten in `qa-run.json` dokumentiert.
Keine historischen Testergebnisse werden als neue Testausführung gezählt.

Die **100 detaillierten Matches** (Seeds 501–600) umfassen 400 Sätze,
17,213 Rallyes, 271,405 Kontakte, 800 Wechsel/Rückwechsel,
1220 Undo/Wiederholungen und 331 Wiederanläufe. Alle **100/100**
unabhängig erzeugten Match-Digests stimmen mit dem vorherigen Cockpit-Stand überein.
Hinzu kommen 100 Quick-Matches und 100 isolierte Kontaktketten.

Chromium und WebKit führten je drei vollständige Matches direkt über die Oberfläche
aus. Die bestehenden Tests decken Punkte, Undo, K1/K2, Rotationsampel und Turnaround
ab. Transition → Spieler → Kill bleibt bei drei Eingaben mit geprüfter Zuordnung.

Neue UI-Prüfungen erfassen beide Teams per Maus, Auswahl/Zielklick per Touch,
Ausgangsstellungsprüfung, alle 18 K2-Bilder, Vorlagen, Schutz ungespeicherter
Änderungen, Gegner-Sideout/Nummern, alle sechs Libero-Rotationen einschließlich
Niklas-Wechsel, Satzwechsel und Reload sowie die Präsentation bei 1024×768,
820×1180 und 390×844. Exakte gespeicherte Positionen und Zeichnungen werden nach
Reload mit dem Sollzustand verglichen. Live-Spielstand und Regelaufstellung
bleiben bei Editor/Vorschau unverändert.

Chromium-CDP prüft zusätzlich echte emulierte Touch-Drag-Eingaben beider Teams.
WebKit prüft Maus-Drag und native Playwright-Touch-Taps mit Auswahl/Zielposition;
Hardware-Touch-Drag auf einem echten iPad wurde nicht behauptet. Die WebKit-Auswahl
enthält keinen Chromium-CDP-Test und keinen Chromium-Prozess-Neustart; beide liefen
in Chromium. Innerhalb der ausgeführten Suiten gab es keine übersprungenen Tests.

## Visuelle Belege und manueller Test

44 neue Screenshots: Mac 1440×1000, iPad quer 1024×768,
iPad hoch 820×1180 und iPhone 390×844. Jeweils elf Ansichten einschließlich
aller angeforderten zehn Motive. Repräsentative Präsentations-, Libero-, Editor-
und Gegnerbilder wurden visuell kontrolliert. Alle Formationen und zusätzlichen
Testnummern wurden über die UI in frischen Kontexten angelegt.

[Galerie](https://github.com/LehrerOldewurtel/evv-quickscout/blob/dev/v8-practice-fixes/docs/screenshots/practice/README.md)

1. ZIP entpacken und den enthaltenen `TEST_START.py` mit Python 3 starten.
   Die genaue Ein-Zeilen-Anleitung steht in `ANLEITUNG.txt` und beim Download.
2. Synthetisches Testspiel starten. Gegner aufstellen: #31–#36 an P1–P6 eintragen.
3. Taktik → EVV R3 → Abwehr IV → Trainer-Editor. Beide Teams verschieben,
   Wege zeichnen und unter einem Testnamen speichern.
4. Andere Rotation öffnen, zurückwechseln und Positionen prüfen. Reload durchführen,
   Taktik erneut öffnen und dieselbe eigene/Gegnerrotation sowie Formation wählen.
   Alternativ lädt die benannte Vorlage ihren vollständigen Kontext.
5. K1 in R3 und R6 prüfen: der tatsächliche Hinterfeld-MB erscheint als Libero.
   In K2 bleibt der eigene Aufschläger auf P1. Spielerwechsel mit Niklas kontrollieren.
6. Ausgangsstellung bearbeiten: vertauschte Reihenfolge muss abgewiesen werden.
   Die taktische Stellung darf frei verändert werden. Ungespeicherten Wechsel
   abbrechen und prüfen, dass die Arbeitskopie erhalten bleibt.
7. Vergrößern → K1/IV/III/II wechseln → Schließen. Anschließend Punkte/Undo prüfen.

## Paket, Daten und Grenzen

Die ZIP wird aus den geprüften Assets gebaut, vollständig entpackt und mit ihrem
eigenen Starter in Chromium/WebKit bei vier Bildschirmgrößen gestartet. Der
separate Paketprüfbericht nennt ZIP-SHA256, Manifestprüfung und tatsächliche
Ergebnisse. Ein Download von GitHub wird erneut gegen SHA256 und Inhalt geprüft.
Die finale Paketverifikation steht in der beigefügten `.verification.json`.

Der neue Ordner `EVV-QuickScout-V8-Praxistest` verhindert eine Verwechslung mit alten
Paketen. Der Starter verwendet weiterhin ausschließlich den getrennten
Cockpit-Test-Namensraum. Kein produktives Browserprofil, kein echtes Backup und
keine realen Spieldaten wurden für Tests geöffnet oder verändert. Am gleichen
Test-Origin bleiben vorhandene Cockpit-Testspiele erhalten; für die Abnahme ein
frisches synthetisches Spiel verwenden. Geräte speichern unabhängig.

Echte Mac-/iPad-/iPhone-/Safari-/Pencil-Abnahme bleibt ausstehend. Linux-WebKit ist
kein echter Safari-Gerätetest. WLAN-HTTP garantiert auf iPad keinen PWA-Offline-
oder Mikrofonbetrieb. Gegneraufstellungen sind bei einem neuen Satz ausdrücklich
zu bestätigen; unvollständige Aufstellungen werden nicht erfunden. Die Prüfung
von Ausgangsstellungen bewertet Symbolmittelpunkte, keine realen Fußpositionen.
Sehr kleine Ansichten und optionale Editoren/Details dürfen scrollen. Kein natives
V8-Release und keine vollständige Verbandsabnahme von Sonderwechseln.

`main` und produktive GitHub Pages wurden weder geändert noch veröffentlicht.
Kein Merge und keine produktive Freigabe wurden vorgenommen.
