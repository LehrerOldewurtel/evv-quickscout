# EVV QuickScout V8 · Vier gemeinsame Abwehrsysteme

Stand: 28.10.2026. Entwicklung auf `dev/v8-practice-fixes`, geprüfter App-Code
`8ddbe05`. Produktkennung bleibt `7.19.0-k1-auto-mb`; keine stabile V8-Freigabe,
kein Merge, kein produktives Deployment.

## Geliefert

- **ABWEHR IV:** P2/P3 Doppelblock, P4 Nahsicherung, P5 Diagonale außerhalb des
  schematischen Schattens, P6 Schatten/lang, P1 Linie.
- **ABWEHR II:** exakt geometrisch gespiegeltes IV-System; P3/P4 Doppelblock,
  P2 Nahsicherung, P1 Diagonale, P5 Linie, P6 Schatten/lang.
- **ABWEHR III:** ausschließlich P3 im Einerblock, P2/P4 Nahsicherung, P1/P5 bei
  5,49 m am Schattenrand, P6 tief mit Schwerpunkt hinter P5.
- **ABWEHR HINTERFELD I:** P3/P4 Doppelblock, P2 Nahsicherung, drei individuell
  editierbare Hinterfeldziele und einstellbarer Angriffsort.

Vier Standards sind in der App enthalten und in jeder Rotation sofort abrufbar.
Die gemeinsame Bibliothek speichert eine Trainer-Anpassung pro System genau einmal.
Alle sechs Rotationen greifen darauf zu. Individuelle Rotationsbilder behalten
Vorrang und werden durch gemeinsame Änderungen nicht verändert. Eine ausdrücklich
bestätigte Rückkehr zum Standard übernimmt auch dessen Wege und lässt separate
Ausgangsstellungen und Gegnerbilder erhalten. Ein deaktivierter/fehlender Standard
fällt auf neutrale Regelpositionen zurück.

Regelposition, Spielerrolle, Aufgabenfeld und aktiver Spieler sind getrennt.
Standardzuordnung: vorderer MB zentral, Außenangreifer links, Z/D rechts; im
Hinterfeld aktiver Libero/MB bevorzugt P5, Z/D bevorzugt P1, Außenangreifer P6.
Die eigene Regelaufstellung bleibt unverändert. Eine uneindeutige MB-Konfiguration
wird gekennzeichnet und auf Regelplätze zurückgeführt. Ältere individuelle Bilder
bleiben bewusst positionsgebunden, bis der Trainer sie ausdrücklich ablöst.

Runde Spieler zeigen Nummer/Namen. Blockmarkierung, schematische Schatten,
Abwehrbereiche und Aufgabenlegende sind einblendbar. Alle vier Systeme bleiben
in der Bildschirm-Präsentation direkt auswählbar. Der vorhandene Editor speichert
weiterhin Laufwege, Ballwege und Angriffsrouten. Punkte-, Wechsel-, Rotations-,
Live-Libero- und Statistik-Engine wurden nicht geändert. Hinterfeld I wird im
vorhandenen Live-Ablauf bei entsprechendem gegnerischen Zuspiel erkannt.

## Tatsächliche Prüfungen

| Prüfung | Bestanden | Fehlgeschlagen | Übersprungen |
|---|---:|---:|---:|
| Vollständige Node-Regression | 179 | 0 | 0 |
| Vollständige Chromium-Regression | 142 | 0 | 0 |
| WebKit-Auswahl einschließlich aller neuen Abwehrfälle | 85 | 0 | 0 |

Alle Läufe prüften die unveränderten finalen App-Assets. Hashes, tatsächliche
Kommandos, Start-/Endzeiten und Ergebnisse stehen in `docs/qa/defense/`.
Vorher fehlgeschlagene Regressionen sind ausdrücklich als Vorher-Belege abgelegt.
Keine historischen Ergebnisse werden als neue Ausführung gezählt.

Neue Sollwerte prüfen vier Systeme × sechs Rotationen, komplette Aufgabenlisten,
exakte IV/II-Spiegelung, Blockzahlen, P2-Nahsicherung bei I, 5–6-m-Abwehr und tiefe
Absicherung hinter P5. Rollen-/Libero-Zuordnung wird zusätzlich für alle sechs
Startaufstellungen und beide Aufschlagrechte geprüft. Bibliothekstests umfassen
individuelle Priorität, Wege-Vererbung, Gegner-/Ausgangsstellungs-Erhalt, Reload,
neues Spiel, ungültige Daten und Speicherfehler ohne Datenverlust.

Die Browser bedienten direkt die UI: alle 24 Bilder, exakte sichtbare Kreis-
Koordinaten, gemeinsamer Standard-Editor, einmaliges Speichern von Zielen/Wegen,
vorhandene Ausnahme, bewusste Ablösung, Reload, Niklas/Libero, Satzwechsel und die
Präsentation mit Legende bei iPad quer/hoch sowie Mac. Bestehende Maus-/Touch-,
Live-, Undo-, K1/K2-, Rotationsampel- und Turnaround-Regressionen liefen erneut.

100 detaillierte Matches (Seeds 501–600): **400 Sätze, 17,213 Rallyes,
271,405 Kontakte, 800 Wechsel/Rückwechsel und 1220 Undo-
Wiederholungen**. Alle **100/100** unabhängigen Match-Digests sind identisch zum
vorherigen Praxistest-Kandidaten. Zusätzlich 100 Quick-Matches und 100 isolierte
Kontaktketten. Chromium/WebKit führten je drei vollständige UI-Matches aus.
Transition → Spieler → Kill bleibt bei drei Eingaben mit korrekter Zuordnung.

Chromium prüft Touch-Drag per Browser-Emulation. WebKit prüft Maus und Touch-Taps;
Chromium-CDP-/Prozessneustart-Fälle liefen in Chromium. Innerhalb der gewählten
Suiten gab es keine übersprungenen Tests. Linux-WebKit ist kein echter iPad-Safari.

## Visuelle Belege und startbare Testversion

**36 neue Screenshots** zeigen alle vier Systeme, Aufgaben/Schatten und den
Standard-Editor auf iPad quer/hoch, Mac und iPhone. Die Präsentation wird auf
beiden iPad-Ausrichtungen und Mac vollständig sichtbar geprüft.
Repräsentative Bilder wurden visuell kontrolliert.

[Galerie](https://github.com/LehrerOldewurtel/evv-quickscout/blob/dev/v8-practice-fixes/docs/screenshots/defense/README.md) ·
[Koordinaten und Modell](https://github.com/LehrerOldewurtel/evv-quickscout/blob/dev/v8-practice-fixes/docs/DEFENSE_SYSTEM.md)

Das neue Paket heißt `EVV-QuickScout-V8-Abwehr.zip`, entpackter Ordner
`EVV-QuickScout-V8-Abwehr`. Der eigene Python-Starter verwendet einen separaten
Cockpit-Test-Namensraum. Keine echten Matchdaten oder produktiven Browserprofile
wurden für QA geöffnet, importiert oder verändert.

Das Paket wird vollständig entpackt und mit dem enthaltenen Starter tatsächlich
in Chromium/WebKit bei vier Bildschirmgrößen gestartet. Der separate
`.verification.json`-Bericht nennt ZIP-SHA256, Manifestprüfung und acht tatsächliche
Browserkontexte. Der erneute GitHub-Download wird anschließend auf Bytegleichheit,
ZIP-CRC und alle inneren SHA-256-Werte geprüft; Beleg `DOWNLOAD_VERIFIED.json`.

## Kurze manuelle Prüfung

1. ZIP in Downloads entpacken. Start:

```bash
python3 "$HOME/Downloads/EVV-QuickScout-V8-Abwehr/TEST_START.py" --lan --port 18766
```

2. Die ausgegebene Mac-Adresse in Chrome öffnen und Terminal geöffnet lassen.
   Auf dem iPad die ausgegebene WLAN-Adresse im selben vertrauten WLAN öffnen.
3. Synthetisches Testspiel beginnen. Taktik → eines der vier Systeme → Aufgaben
   einblenden → Rotationen R1–R6 vergleichen.
4. Trainer-Editor → **EVV-Standard · alle Rotationen** → Ziel/Laufweg verändern →
   **EVV-Standard speichern**. Andere Rotationen öffnen und nach Reload vergleichen.
5. Für eine Ausnahme **Individuell · diese Rotation** verwenden. Globale Änderungen
   müssen die Ausnahme erhalten. Zum bewussten Ablösen **EVV-Standard verwenden**.
6. III muss den Einerblock zeigen; Hinterfeld I den Doppelblock und Nahsicherung
   durch P2. Bei I den Angriffsort und die Hinterfeldziele anpassen.
7. Niklas/Libero prüfen, Vergrößern öffnen und alle vier Systeme durchschalten.

## Verbleibende Grenzen

Die sechs erwähnten Referenzabbildungen lagen hier nicht als lesbare Dateien vor.
Die Aufgaben folgen den schriftlichen Vorgaben; konkrete Koordinaten sind deshalb
**editierbare Vorschlagswerte**, keine behauptete Übernahme der Lehrbilder.
Dies gilt besonders für Hinterfeld I. Der Trainer kann nach Kontrolle die
Vorschlagsmarkierung lösen. Schematische Schatten/Abwehrflächen ersetzen keine
Messung einer dreidimensionalen Ballflugbahn.

Die Rollenprioritäten, insbesondere Libero bevorzugt in Abwehrzone P5, stehen
im Modellbericht. Eine davon abweichende dauerhafte Rollenverteilung benötigt
eine entsprechende Trainer-Festlegung. Regelaufstellung und bestehende
individuelle Bilder werden nicht umgedeutet.

Die praktische Abnahme auf echten Apple-Geräten steht aus. Keine native App,
keine Gerätesynchronisierung, kein zugesicherter iPad-PWA-Offline-/Mikrofonbetrieb
über WLAN-HTTP. Lange optionale Editor-/Detailansichten dürfen scrollen. Die
Version bleibt ein Testkandidat. `main` und produktive GitHub Pages bleiben
unverändert; keine Veröffentlichung der produktiven Version ohne Freigabe.
