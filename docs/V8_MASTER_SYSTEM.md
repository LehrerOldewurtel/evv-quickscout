# V8 Master Playbook: Umsetzung und Grenzen

## Nachgewiesene Ursachen und Korrekturen

| Ursache im bisherigen `app.js` | Korrektur | Regression |
|---|---|---|
| K1 ohne vollständige Läufer-Vorlagen; R-Label und Zuspielerposition nicht gleichbedeutend | Seed-Compiler, tatsächliche P-Position und drei getrennte Ebenen | `master-playbook.test.cjs`: sechs legale Vorlagen, abweichende Startaufstellung |
| Gegner nur als Nummern-Aliase, keine stabilen Wechselidentitäten | ID-basierter Gegnerkader, aktive Satzrollen, Paar-/Rückwechsel, getrennte Historie | Gegner-IDs, Nummernkorrektur, unabhängige Rotation, Rückwechsel/Undo |
| Vorschau stellte Libero für einen anderen MB dar; automatische Registrierung/Ersetzung vermischt | Reale Ersetzung mit tatsächlichem Partner, explizite Auto-Erlaubnis, reine Vorschau | beide MB über R1–R6, L1/L2, Rallye-Abstand, Satz/Reload |
| Ein Legacy-Pfeil je Spieler überschrieb die vorige Route | versionierte Pfeilliste, Einzelwahl, Körper/Endpunkte, Undo/Redo | fünf Pfeile, Maus/Touch, Export/Import |
| Pfeil-Treffererkennung fing Spieler-Zielklicks im Verschieben-Werkzeug ab | Pfeil-Hits nur im Auswahlwerkzeug | `practice.spec.cjs`: außermittiges Greifen, Auswahl/Zielklick, Abbruch |
| Mehrere Boards mit unterschiedlicher Darstellung | gemeinsame `boardFrame`/`boardProject`/`boardView`, alter Skizzenimport ohne Datenverlust | gemeinsame Kreise, Timeout, Startsechs, Editor, Quick/Detail |
| Undo-Validierung übernahm neue Team-Metadaten in ältere Snapshots | fehlende optionale Felder wie beim Restore wirklich entfernen | größter 100-Match-Seed und Draft-Reload |

Vor dem Umbau: 197 Node- und 158 Chromium-Tests bestanden. Neue P0-Reproduktionen schlugen zunächst fehl; rohe Ausgangsevidenz in `qa/master-baseline/`. Bestehende grüne Tests belegten also gerade nicht die fehlenden Funktionen.

## Eine Regelquelle, drei Ebenen

`teamState(team, rotation)` ist die gemeinsame, nur lesbare Sicht. EVV verwendet weiterhin den bewährten Matchzustand, damit historische Exporte nicht durch ein zweites schreibbares Modell auseinanderlaufen. Gegnerdaten liegen unter `opponentTeam`; Kontakte behalten ihre ursprünglichen Nummern. Neue Kontakte erhalten zusätzlich stabile Gegneridentitäten. Historischen Kontakten werden keine unbekannten IDs nachträglich zugeordnet.

Regelpositionen verwenden dieselbe `physicalPosition`-Rotation wie das Match. Nur der empfangende Rallyegewinner rotiert. Die Aufschlagkontakt-Ausgangsstellung ist von der freien taktischen Zielstellung getrennt. Taktisches Verschieben ändert weder Spieleridentität noch Regelrotation. Tatsächlicher Zuspieler auf P1 bedeutet Läufer I, auf P6 Läufer VI. Bei der Standardsechs folgt auf R1/Läufer I deshalb R2/Läufer VI, nicht Läufer II.

`data/formationen_5_1.seed.json` ist die unveränderte Eingabe. `scripts/build-master-formations.py` erzeugt `data/formationen_5_1.json` und die identische eingebettete Laufzeitbibliothek. `npm run verify:formations` prüft Übereinstimmung einschließlich Seed-SHA. Sechs eigenständige Annahmevorschläge mit drei Annahmespielern, legaler Reihenfolge links/rechts und vorne/hinten, getrennten Zielpositionen und Zuspielerwegen sind enthalten. Bei veränderter Rollenstartsechs werden tatsächliche Rollenpositionen geprüft. Die Validierung betrifft Symbolmittelpunkte mit Sicherheitsabstand, keine gemessenen Fußpositionen realer Spieler. Keine Bildrekonstruktion: die früheren Referenzabbildungen sind nicht im Paket enthalten.

Vorlagenpriorität: expliziter Rotationsoverride → Teamstandard für tatsächlichen Läufer/Phase → EVV-K2-Standard bzw. K1-Vorschlag → neutrale, ausdrücklich nicht eingerichtete Stellung bei unbekannten Rollen. Ein Teamstandard überschreibt keine individuelle Rotationsanpassung. Gegner-K1 und eigener K2 werden getrennt ausgewählt; unbekannte Rollen bleiben unbekannt.

## Reale Wechsel und Liberos

Nummern sind editierbare Eigenschaften stabiler IDs. Erlaubte Rollen und aktive Satzrolle sind getrennt; historische Scoutingereignisse behalten damalige Angaben. Normale Wechsel/Rückwechsel sind paargebunden, höchstens sechs pro Satz; abgeschlossene Paare dürfen nicht nochmals neu einwechseln. Libero-Ersetzungen zählen separat und verwenden nur registrierte L1/L2 sowie den realen Hinterfeldpartner. Keine siebte Person und kein Libero als regulärer Wechsel.

Neue Spiele registrieren Liberos ohne stillen Einsatz. Automatik ist eine ausdrücklich aktivierte Traineroption, greift erst bei realen Rallyeübergängen und beachtet tatsächlichen Hinterfeld-MB, Aufschlag-P1 und erforderlichen Rallye-Abstand. Reines Aufrufen einer anderen Rotation erzeugt niemals einen Wechsel. Zwischen Ersetzungen ist grundsätzlich eine abgeschlossene Rallye erforderlich. Eine ausdrücklich dokumentierte Verletzungsausnahme bei nicht mehr spielfähigem aktivem Libero ist möglich; dieser Spieler bleibt für das Match gesperrt. Das ist keine universelle Ausnahme für beliebige taktische Doppelwechsel. Unsichere oder nicht unterstützte Ausnahmesituationen werden abgewiesen. Die App ersetzt keine Schiedsrichterentscheidung.

Alte Schema-2-Matches und Formationsdaten bleiben importierbar. Neue optionale Metadaten werden streng validiert, fehlende historische Ereignisse nicht erfunden. Alte Skizzen können im gemeinsamen Editor geprüft und erst mit explizitem Speichern als Vorlage übernommen werden. Team-Undo ist gegen Übergehen einer inzwischen abgeschlossenen Rallye geschützt.

## Pfeile und Kennzahlen

Bis zu 100 Pfeile mit je 2–20 Punkten pro Vorlage. Auswahlwerkzeug: Körper oder sichtbare Start-/Endgriffe verschieben; Tastaturpfeile 1 %, mit Shift 5 %, Delete, Undo/Redo. Zeichnen bleibt nach dem ersten Pfeil aktiv. Koordinatenraum Teamhälfte oder gemeinsames Feld ist explizit gespeichert. Import validiert IDs, Grenzen und Typen. Alte Laufwege bleiben darstellbar.

Bestehende Scoutingdefinitionen und Nenner bleiben erhalten. A+ entspricht dokumentiert guter Annahme, unbekannte Ziele werden separat ausgewiesen. Mitte-Pacer zählt tatsächliche Mitte-Zuspiele unter geeigneten dokumentierten A+-Zuspielen mit bekanntem Ziel; Soll = dokumentierter Nenner × editierbares Trainerziel. Angriffserfolg ist ausdrücklich keine technische Zuspielnote. Dankeball-Direktkill und späterer Rallyegewinn bleiben getrennt. Punktestand-Pacer ist eine editierbare Zielkurve mit Interpolation und definierter Deuce-Fortsetzung, keine Gewinnprognose. Kleine Stichproben bleiben markiert und ohne irreführende Ampel.

## Gestaltung und Prüfung

Fünf Primäransichten, echte lokal eingebundene Lucide-SVGs (Lizenz: `THIRD_PARTY_NOTICES.md`), zentrale Dark-Glass-Stile, Lichtmodus, Blur-Fallback, reduzierte Bewegung und Fokusmarkierung. Quick zeigt ein kompaktes gemeinsames 9×18-Feld quer; Taktik/Präsentation dasselbe Feld hoch. Blaue/rote Kreise tragen nur Nummer und gegebenenfalls L; Namen stehen in zugänglichen Metadaten. Im Livebetrieb sind Positionsänderungen gesperrt, im Editor explizit möglich.

Automatisierte Viewports und Linux-Chromium/WebKit sind keine Abnahme auf physischem Mac/iPad und kein Nachweis bei Hallenlicht. Verbindliche tatsächliche Ergebnisse und Einschränkungen stehen in `ABNAHME.md`, Rohlogs in `docs/qa/master/`. Produktkennung bleibt 7.19.0; V8 ist ein Release-Kandidat ohne Native-/Store-Freigabe.
