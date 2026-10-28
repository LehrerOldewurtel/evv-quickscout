# Vier EVV-Abwehrsysteme

Stand: 28.10.2026. Entwicklungsbranch `dev/v8-practice-fixes`.
Die schriftlichen Trainer-Vorgaben bestimmen die Aufgaben. Die erwähnten sechs
Lehrabbildungen waren in diesem Auftrag nicht als lesbare Dateien verfügbar.
Deshalb sind die konkreten Zielkoordinaten ausdrücklich editierbare Vorschläge,
keine behauptete Übernahme oder Abnahme dieser Abbildungen. Das gilt besonders
für Hinterfeld I. Die Vorschlagsmarkierung kann der Trainer nach Kontrolle lösen.

## Vier direkt auswählbare Grundordnungen

| Abwehr | Block | Nahsicherung | Hinterfeld |
|---|---|---|---|
| IV | P2 + P3 | P4 | P1 Linie, P5 Diagonale, P6 Blockschatten/lang |
| II | P3 + P4 | P2 | P5 Linie, P1 Diagonale, P6 Blockschatten/lang |
| III | nur P3 | P2 + P4 | P1/P5 am Schattenrand, P6 tief hinter P5 |
| Hinterfeld I | P3 + P4 | P2 | P1/P5/P6 an den tatsächlichen Winkel anpassen |

III wechselt nicht automatisch zum Dreierblock. Die Aufgaben sind pro System
festgelegt; frei verschiebbare taktische Ziele verändern weder diese Standard-
Blockzahl noch die echte Regelaufstellung. Es werden keine zusätzlichen Kontakte,
Angriffe, Punkte oder Transition-Ereignisse erzeugt.

Koordinaten: x = Prozent der Breite aus EVV-Sicht von links nach rechts;
y = Prozent der eigenen 9-m-Hälfte ab Netz. y=33⅓ entspricht 3 m, y=61 entspricht
5,49 m. Die Tabelle beschreibt taktische Zonen, keine Spielernamen.

| Zone | IV (x,y) | II (x,y) | III (x,y) | Hinterfeld I (x,y) |
|---|---|---|---|---|
| P1 | 93,72 | 76,65 | 63,61 | 79,67 |
| P2 | 82,7 | 78,33 | 78,32 | 78,33 |
| P3 | 65,7 | 35,7 | 50,7 | 35,7 |
| P4 | 22,33 | 18,7 | 22,32 | 18,7 |
| P5 | 24,65 | 7,72 | 37,61 | 17,70 |
| P6 | 57,88 | 43,88 | 32,89 | 47,89 |

II wird aus IV mit x′=100−x und dem Tausch P1↔P5, P2↔P4 erzeugt.
P3 und P6 bleiben dieselben Zonen und werden ebenfalls geometrisch gespiegelt.
Die einblendbaren Abwehrflächen und der Blockschatten sind schematische
Orientierungshilfen. Der Angriffsort lässt sich im Editor horizontal und in der
Tiefe einstellen. Sie sind keine gemessenen dreidimensionalen Flugbahnen.

## Regelposition, Rolle, Aufgabe und aktiver Spieler

Die vier Ebenen sind getrennt: `rulePosition`, `role`, `task`, `playerId`.
`tacticalPosition` bezeichnet das Aufgabenfeld P1–P6. Regelposition und taktische
Zone dürfen sich unterscheiden, ohne die Match-Engine zu verändern.

Standardzuordnung: der einzelne vordere Mittelblocker übernimmt die zentrale
Zone P3; Außenangreifer bevorzugt P4, Zuspieler/Diagonalspieler P2. Im Hinterfeld
übernimmt der tatsächlich aktive Libero bevorzugt P5, sonst der hintere MB;
Zuspieler/Diagonalspieler bevorzugt P1 und Außenangreifer P6. Front-/Hinterreihe
bleiben getrennt. Bei nicht eindeutiger MB-Konfiguration wird ausdrücklich auf
die Regelplätze zurückgefallen und ein Hinweis angezeigt. Es wird keine
fehlende Aufstellung erfunden. 
Die vier Abwehrsysteme verwenden das tatsächliche aktuelle Aufschlagrecht für
die Libero-Projektion. Ein MB auf P1 schlägt weiterhin selbst auf; ein empfangender
Libero wird in der Abwehrdarstellung nicht durch ein pauschales K2-Etikett entfernt.
Die bestehende explizite K1-Annahmevorschau bleibt erhalten. `rotationMatrix`,
Punkteberechnung, Wechselregeln, Live-Libero-Synchronisation und Statistikformeln
wurden nicht geändert.

Ältere individuelle Bilder bleiben positionsgebunden, solange der Trainer sie
nicht ausdrücklich ablöst. Ihre Zielkoordinaten und Wege werden nicht stillschweigend
in ein neues Rollensystem umgedeutet. Die Herkunft wird im Taktikkontext angezeigt.

## Eine gemeinsame Bibliothek, sichere Priorität

1. Eigene Rotationsanpassung in `formationBook[Rotation:Art]`.
2. Gemeinsamer EVV-Standard in `defenseStandards[Art]`, sonst mitgelieferter Standard.
3. Neutrale Regelpositionen bei ausdrücklich deaktiviertem/fehlendem Standard.

Die mitgelieferten vier Standards sind dauerhaft Bestandteil der App. Trainer-
Änderungen werden pro System genau einmal im Match gespeichert, exportiert,
geladen und beim neuen Spiel übernommen. Es werden keine sechs Kopien angelegt.
Ein gemeinsamer Write verändert keine individuelle Rotationsanpassung. Eine
leere eigene Anpassung erbt auch Laufwege und Ballwege aus dem Standard;
Ausgangsstellungen und Gegnerbilder bleiben dabei separat erhalten. Vorhandene
ältere Teilbilder oder reine Routenskizzen bleiben individuelle Anpassungen.

Bedienung: Taktik → gewünschtes System → Trainer-Editor → Speicherbereich
**EVV-Standard · alle Rotationen** vor dem Bearbeiten wählen. Ziele und Wege
bearbeiten und **EVV-Standard speichern**. Für eine Ausnahme Speicherbereich
**Individuell · diese Rotation** verwenden. **EVV-Standard verwenden** löst eine
eigene taktische Anpassung erst nach ausdrücklicher Bestätigung. Das betrifft
weder die Ausgangsstellung noch Gegnerbilder. Ungespeicherte Änderungen werden
vor dem Verwerfen zusätzlich abgefragt. **EVV-Vorschlag laden** lädt im Standard-
Editor zunächst nur eine Arbeitskopie; erst Speichern ändert die Bibliothek.

Der gemeinsame Standardbereich speichert nur eigene taktische Ziele, keine
gegnerische Aufstellung und keine Regel-Ausgangsstellung. Gegner und eigene
Ausgangsstellungen bleiben im individuellen Editor bearbeitbar. Bekannte Gegner-
Nummern und aktuelle EVV-Spieler werden aus der bestehenden Verwaltung gelesen.

## Darstellung und Auszeit

Runde Symbole zeigen Trikotnummer und Namen. Die kleine P-Anzeige bezeichnet bei
rollenbasierten Vorlagen die taktische Zone; die zusätzliche Regel-P-Zahl und die
Legende zeigen die unveränderte Regelposition. **Aufgaben & Abwehrbereiche** blendet
Blockmarkierung, Schatten, Abwehrflächen, Angriffsort und sechs kurze Aufgabentexte
ein. Gespeicherte Lauf-, Ball- und Angriffsrouten bleiben sichtbar.

**Vergrößern** öffnet die Bildschirm-Präsentation. K1 und alle vier Abwehrsysteme
bleiben direkt erreichbar. Die Auswahl ist lesend, keine Animation oder weitere
Speicherung erforderlich. Auf kleinen Telefonen dürfen ausführliche Editor-/
Detailansichten scrollen. Echte Geräteabnahme bleibt zusätzlich erforderlich.
