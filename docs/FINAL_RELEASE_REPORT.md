# EVV QuickScout V8 · Matchplan & Live-Pacer

Stand: 28.10.2026. Branch `dev/v8-matchplan-pacer`, geprüfter App-Code
`b5780be`. Produktkennung unverändert
`7.19.0-k1-auto-mb`. Entwicklungskandidat zur praktischen Abnahme, kein Merge und
keine produktive Veröffentlichung.

## Geliefert

- Editierbarer Matchplan pro Spiel, wiederverwendbare benannte Vorlagen und
  sechs Direktzugänge im Coach-Cockpit. Live bleibt beim kleinen PACER-Zugang.
- Satz-Pacer mit nachvollziehbarer linearer Zielkurve, Sollstand, Delta, Farbe
  und Fortschritt; eigene Kurve für Satz 5. 20:15 ergibt bei Standardkurve +2.
- Höchstens ein kurzer datenbasierter Auftakthinweis im ersten Satz.
- Zuspieler-Cockpit für Johann und weitere dokumentierte Zuspieler, Verteilung
  IV/III/II/Hinterfeld, Mitte nach A+/A~/A−, Angriffspunkt-/Fehlerquoten und
  K1-/K2-Vergleich. Automatische aktuelle Zuordnung nur bei Eindeutigkeit;
  ansonsten optionale Kontextauswahl. Keine zusätzliche Pflichtmaske.
- Explizite Dankeball-Erfassung, organisierter erster Angriff, direkter Kill und
  späterer Rallyesieg getrennt. Mehrfachchancen, unbekannte Sequenzen und aktuelle
  Rallye werden sichtbar getrennt; alle Quoten mit Zähler/Nenner und Stichprobe.
- Vorhandene Live-Erfassung, Turnaround, Statistiken, Vier-System-Abwehrbibliothek,
  Rollen-/Wechsel-/Libero-Zuordnung und gespeicherte Altdaten bleiben erhalten.

Bestehende Kontaktobjekte werden nicht umgeschrieben. Neue optionale Metadaten
werden validiert, gespeichert und mit Undo zurückgenommen. Unbekannte historische
Zuspieler werden nicht aus der heutigen Aufstellung rekonstruiert. Ein Set mit
anschließendem Angriff zählt einmal. A0 und gegnerische Annahme sind keine eigene
A+-Annahme. Dankeball-Punktquote zählt eine Rallye auch bei mehreren Chancen einmal;
die direkte Killquote verwendet nur Chancen mit bekanntem direktem Ausgang.
Ausführliche Ereignis- und Nennerdefinitionen: MATCHPLAN_SYSTEM.md.

## Tatsächlich ausgeführte Prüfungen

| Prüfung | Bestanden | Fehlgeschlagen | Übersprungen |
|---|---:|---:|---:|
| Vollständige Node-Regression | 197 | 0 | 0 |
| Vollständige Chromium-Regression | 158 | 0 | 0 |
| WebKit-Auswahl einschließlich aller neuen Matchplan-Fälle | 101 | 0 | 0 |

18 neue Berechnungstests und 16 neue echte Browserfälle decken Verteilung,
Qualitäts-/Phasennenner, tatsächlichen Zuspielerwechsel, unbekannte Altwerte,
Dankeball direkt/später, mehrere Chancen, Quick→Detail, Interpolation/Konfiguration,
Satzwechsel, Undo, Importvalidierung, Vorlagen, Reload und vier Viewports ab.
Der gefüllte Coach-Screen sichert den korrigierten Textumbruch ab. Ein weiterer
Browserfall prüft mindestens 4,5:1 Textkontrast für grüne, gelbe und rote neue
Statuswerte im dunklen sowie automatischen Farbschema.
Bestehende Chromium-Tests prüfen Maus und Touch; die WebKit-Auswahl prüft auch
Maus-Drag und Touch-Auswahl. Chromium-spezifische CDP-Fälle sind nicht als WebKit-
Tests ausgegeben. Keine Flaky-Wiederholungen als Erfolg: Chromium 0, WebKit 0.

Detaillierte unabhängige Matchsimulation: 100 Spiele, 400 Sätze,
17213 Rallyes, 271405 Kontakte, 1220 Undo/Wiederholungen,
800 Wechsel/Rückwechsel und 331 Speicherneustarts.
**100/100 Matchdigests entsprechen dem vorherigen Abwehrkandidaten**: Original-
Kontaktketten und Spielresultate bleiben gleich. Ergänzend 100 Quick-
Simulationen und 100 isolierte Kontaktketten.
Die Browser-Generalproben spielen pro Engine drei vollständige Matches über die
Oberfläche. Transition → Spieler → Kill bleibt bei drei Eingaben.

Rohlogs, Start-/Endzeiten, Kommandos, Asset-Hashes, Vorher-Fehler und unabhängiger
Digestvergleich: `docs/qa/matchplan/`. Zwei vorläufige Gesamtläufe wurden für die
visuell gefundene Textumbruchkorrektur beendet und nicht als bestandene Läufe gezählt.
Der finale Bericht verwendet ausschließlich anschließend vollständig ausgeführte
Prüfungen derselben finalen App-Assets.

## Screenshots und Testpaket

32 über sichtbare UI erstellte Screenshots: Mac (1440), iPad quer (1024),
iPad hoch (820), iPhone (390), jeweils Live, Coach, Pacer, Zuspieler, Dankeball,
Plan-Editor sowie Coach/Pacer im Dunkelmodus. Ausschließlich synthetisches TEST-Match.

[Galerie](https://github.com/LehrerOldewurtel/evv-quickscout/blob/dev/v8-matchplan-pacer/docs/screenshots/matchplan/README.md)

Testpaket: `EVV-QuickScout-V8-Matchplan.zip`, eigener Ordner und empfohlener Port
18767. Nach Entpacken auf dem Mac:

```sh
python3 "$HOME/Downloads/EVV-QuickScout-V8-Matchplan/TEST_START.py" --lan --port 18767
```

Die ausgegebene Mac-Adresse öffnen. Für das iPad die ausgegebene WLAN-Adresse
verwenden; beide Geräte im selben vertrauten WLAN, Terminal geöffnet lassen.
Der Starter nutzt eigene Testablagen und einen eigenen Cache-Namensraum.
Keine echten Backups importieren. Mac und iPad synchronisieren nicht automatisch.
ZIP-CRC, SHA-256, innere Prüfsummen und tatsächlicher Start des entpackten Pakets
werden separat in der mitgelieferten `.verification.json` dokumentiert; der
GitHub-Download wird anschließend erneut auf Bytegleichheit geprüft.

## Grenzen

Linux-Chromium/WebKit und emulierte Touch-/Viewport-Bedienung ersetzen keine
physische Mac-/iPad-/Safari-/Pencil-Abnahme. WLAN-HTTP garantiert auf dem iPad
keinen Offline-/Mikrofonbetrieb. Historische fehlende Zuspieler und reine Sprach-/
Legacy-Zusammenfassungen ohne passenden Kontaktkontext bleiben gekennzeichnete
Datenlücken. Unvollständige Dankeballbeobachtungen verkleinern den jeweiligen
Nenner; es wird keine Genauigkeit erfunden. Ziele und Pacer sind bearbeitbare
Trainerorientierungen, keine Leistungsnormen oder Siegprognosen. Lange optionale
Details und kleine Telefonansichten dürfen scrollen.

`main`, Release-Branch und produktive GitHub-Pages-Webseite bleiben unverändert.
