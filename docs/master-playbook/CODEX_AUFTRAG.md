# EVV QuickScout – V8 Fertigstellung: verbindlicher Implementierungsauftrag

Repository: `LehrerOldewurtel/evv-quickscout`.
Ziel: voll funktionsfähige, getestete Release-Candidate-Version, nicht nur Planung oder Screenshots. Arbeite auf Feature-Branch, erstelle PR, nicht auf `main` mergen oder produktiv deployen ohne Freigabe.

## Zuerst
1. Repository und AGENTS.md prüfen, Tests ausführen, Ist-Zustand und Root Causes protokollieren.
2. `formationen_5_1.json` aus diesem Paket als **Seed-Vorlage** integrieren. Wenn Datei in Codex nicht verfügbar ist, den Nutzer um Upload der ZIP bitten; nicht behaupten, sie sei eingebaut.
3. Wichtig: Die sechs `LAEUFER_*`-Namen entsprechen der tatsächlichen **Regelposition des Zuspielers** (I=P1, II=P2, III=P3, IV=P4, V=P5, VI=P6). Mapping zu bisherigem R1–R6 explizit prüfen, niemals durch Stringgleichheit annehmen.
4. JSON enthält exakte regelpositionsbasierte, konservative **Startplatzhalter** und editierbare K2-Rollenprinzipien, **keine pixelgetreue Rekonstruktion der alten Volleyballfreak/Volleyball-Insider-Bilder**. Für K1 echte nutzbare 5:1-Annahmeformationen mit 2–3 Annahmespielern, Setterlaufwegen und korrekten Überlappungen als editierbare Vorlagen ausarbeiten. Aufschlagannahmepositionen regeltechnisch validieren. Nach Freigabe von Vorlagen als Mannschaftsdefaults speichern. Keine stillschweigende Behauptung, exakte Referenzgrafiken seien reproduziert.

## P0 – Datenmodell und Rotation
- Eine kanonische `TeamState` pro Mannschaft: Spieler-ID, Trikotnummer, Rolle(n), aktive Satzrolle, Startsechs, Rotationspositionen P1–P6, Aufschlagrecht, Libero-Registrierung, tatsächliche Ersetzungen, reguläre Wechsel, Taktik-Overrides.
- Einmalige Eingabe der Startsechs erzeugt alle sechs Rotationen, ohne erneutes Verschieben. Pre-serve legal position und post-serve tactical home strikt trennen.
- EVV und Gegner rotieren unabhängig nur beim Sideout, nicht bei jedem Punkt; Undo, Satzwechsel, Serve-Tracking, Persistenz korrekt.
- Gegner direkt am Feld: Trikotnummer eintippen und Rolle AA, MB, D, Z, L, ? zuweisen. Fehlende Angaben erlauben. Wechsel #raus → #rein samt Rolle, Rückwechsel und Historie.
- EVV-Datensätze ohne Duplikate aktualisieren: Johann #6 Z; David #10 AA/Z; Jens #7 MB/D; Felix #20 AA; Anmol #99 L; Lion #8 D; Niklas #5 MB. Andere Bestandsdaten bewahren.

## P0 – Libero reparieren
- Bis zu zwei eingetragene Liberos **je Mannschaft**. Nicht jede Registrierung ist automatisch ein zulässiger unmittelbarer Wechsel. Regelkonformität anhand tatsächlicher Libero-Ersetzungshistorie, ersetztem Spieler, Hinterfeldposition, Rallye-Abstand und Ausnahmen prüfen.
- Wenn MB1 hinten, MB2 vorne, ist MB1 Kandidat; bei umgekehrter Lage MB2. **Nicht** fest P5/P6 oder MB1 hartkodieren. Keine automatische Protokollierung bloßer taktischer Vorschauen.
- Eigenes und gegnerisches Team in allen sechs Rotationen, Wechseln, Rückwechseln, Undo und Satzwechseln testen; niemals sieben aktive Spieler.

## P0 – Ein Board, zwei Modi
- Gemeinsame Spielfeld-Engine für Live, eigene und gegnerische Aufstellung, K1, K2, Rotation, Editor und Timeout.
- Blaue EVV- und rote Gegner-Kreise mit großer Trikotnummer, Libero-Kennzeichnung, Linien/Netz, beide Seiten darstellbar.
- `Live` ist gegen unbeabsichtigtes Verschieben geschützt; `Editor` kann Spieler, Ballwege, Zuspiel-, Angriffs- und Laufwege bewegen. Taktische Änderungen verändern niemals die regelgebundene Rotation.
- Einmal gespeicherte Teamdefaults, je Rotation/Phase editierbare Overrides; speichern/laden/Export/Import/Undo.

## P0 – Pfeile vollständig nutzbar
- Mehrere Pfeile pro Vorlage und Pfeiltyp. Nach Zeichnen sofort erneut zeichnen können. Individuell auswählen, ganzen Pfeil verschieben, beide Endpunkte ziehen, löschen, Undo, Persistenz. Touch/Pointer und Maus testen. Sichtbare Selektionsgriffe.

## P1 – K1/K2 und Zuspiel
- K1 sechs Läufer-Vorlagen mit überprüfter Aufstellungslegalität und editierbaren Zuspielerwegen. K2 aus JSON mit IV-Doppelblock P2/P3, II-Doppelblock P3/P4, III-Einzelblock P3, Hinterfeld-I-Doppelblock P3/P4 als editierbare taktische Vorgaben; keine Rollen-/Positionsverwechslung.
- Johann-Zuspielstatistik: Passverteilung IV/III/II/HF, A+/A~/A− Annahmequalität, Mitte-Anteil bei A+, K1/K2, Angriffs-Kill-/Fehlerquote mit echten Nennern; automatische Ableitung nur wenn sicher. Null zusätzliche Pflichtdialoge.
- Dankeball-Chancen und direkte/spätere Verwertung getrennt zählen.

## P1 – Matchplan und Live-Pacer
- Editierbare Zielkurve (Gegnerpunkte → Soll-EVV-Punkte), Abweichung anzeigen, keine Gewinnwahrscheinlichkeit suggerieren.
- KPI-Leiste: K1, K2, Mitte A+, Dankeball, Rotationsampel. Erste-Satz-Startphase und leichte Punkte. Soll/Ist mit Stichprobengrößen.

## P2 – Design
- Dark Glassmorphism (halbtransparent, blur, kontrastreich), Lucide-SVG-Icons statt Bildbuttons, klare kurze Beschriftungen, 44px Touch-Ziele. Einheitliches iPad/Mac/Telefon-Layout, reduzierte Animationen und Blur-Fallback. Lesbarkeit geht vor Ästhetik.

## Abnahme: unbedingt ausführen und belegen
- 6 Rotationen EVV/Gegner, K1-Regelpositionen und Überlappungen, unabhängig korrekte Sideouts.
- Gegnernummern/Rollen direkt auf dem Feld; reguläre Wechsel; zwei Liberos; MB1/MB2 abwechselnd im Hinterfeld, echte Ersatzhistorie; Undo.
- Mindestens fünf Pfeile in einer Vorlage: bewegen, Endpunkte bearbeiten, löschen, speichern, reload, export/import.
- Einmalige Aufstellung ohne erneute manuelle Verschiebungen, rotierende taktische Overrides.
- Vollständiges synthetisches Match, Statistiken/Quoten/Pacer, Browser-Tests Chromium + WebKit, mobile Touchsimulation.
- Screenshots je Läufer, Gegnerrollen, Libero-Test, Pfeile, neues Board; Testlogs, verbleibende Fehler, PR-Link.
- Wenn echte iPad-Safari-Tests nicht durchgeführt wurden, ausdrücklich offen kennzeichnen.

**Abschluss bedeutet: funktionierender Code und überprüfbare Testresultate, nicht eine Beschreibung dessen, was implementiert werden sollte. Keine eigenmächtige Veröffentlichung.**
