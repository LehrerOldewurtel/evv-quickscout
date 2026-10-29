# EVV QuickScout V8 – MASTER PLAYBOOK FÜR CODEX
**Status:** Verbindlicher End-to-End-Implementierungsauftrag | **Ziel:** Fertige, nachweislich getestete Release-Candidate-Version | **Repository:** `LehrerOldewurtel/evv-quickscout` | **Produktiv:** `https://lehreroldewurtel.github.io/evv-quickscout/`

## 0. Auftrag und Definition of Done
Du bist verantwortlicher Lead Engineer, Volleyball-Regel- und Taktikprüfer, UX-Designer und QA-Engineer. **Implementiere** das gesamte Playbook selbstständig im Repository; liefere nicht nur Pläne, Mockups oder unverbindliche Empfehlungen. Die Kernanforderung lautet: **Einmal Startaufstellung festlegen → alle sechs regelkonformen Rotationen automatisch → K1/K2-Taktikvorlagen direkt nutzbar → Gegner schnell erfassen → Libero-Ersetzungen korrekt → Pfeile dauerhaft editierbar → Matchplan und Scouting mit minimalen Klicks → einheitliches, gut lesbares Design.**

Arbeite in einem neuen Branch und erstelle am Ende einen Pull Request mit überprüfbaren Belegen. **Nicht nach `main` mergen, keine produktive Veröffentlichung ohne ausdrückliche Nutzerfreigabe.** Beachte `AGENTS.md`, vorhandene Versionierung, Tests, Architektur und Migrationsregeln. Keine unnötigen Rückfragen; bei echten Blockern dokumentiere die genaue Ursache und arbeite an unabhängig lösbaren Teilen weiter. Erfinde weder Testergebnisse noch verifizierte Bildübereinstimmungen.

### Mitgelieferte Projektgrundlage
- `formationen_5_1.json`: strukturierte Seed-Daten für Läufer I–VI und K2-Abwehrprinzipien. **Diese Daten sind keine pixelgetreue Rekonstruktion der früher gezeigten Bilder und keine bereits vollständig validierten K1-Annahmepositionen.** Prüfe und vervollständige sie fachlich und geometrisch.
- `CODEX_AUFTRAG.md`: bisheriger Reparaturauftrag. Dieses Master Playbook integriert und erweitert ihn und hat bei Abweichungen Vorrang.
- `README.md`: Paketbeschreibung.
- Referenzdesign: dunkles, halbtransparentes, abgerundetes Frosted-Glass-Panel mit feiner Kontur, zurückhaltender unterer Icon-Navigation und großen Zahlen (Glassmorphism / Apple-inspiriert). **Keine Original-Screenshots als im Repository vorhanden ausgeben.**
- Frühere Volleyballfreak-/Volleyball-Insider-Referenzen: sechs 5:1-Läuferbilder. Wenn im Codex-Kontext nicht verfügbar, aus belastbaren 5:1-Grundprinzipien eigenständige, klar als solche deklarierte und regelgeprüfte K1-Vorlagen bauen; exakte Bildübereinstimmung nicht behaupten.

## 1. Technische Bestandsaufnahme (verpflichtend vor Umbau)
1. Repository, AGENTS.md, Build, State-Management, Scouting-Eventmodell, SVG-Boards, Speicherformate und bestehende Tests inspizieren.
2. Bestehende Tests zuerst ausführen; dokumentiere reproduzierbare Fehler: fehlende K1-Läufer, Gegnerrollen, wiederholtes manuelles Aufstellen, Gegner-Libero/MB1-MB2, nur ein nicht editierbarer Pfeil, getrennte Boards, Speichern/Reload.
3. Root-Cause-Liste mit konkreten Dateien und Testfällen erstellen. Architektur so konsolidieren, dass nicht mehrere konkurrierende Rotations- oder Spielfeldmodelle existieren.
4. Sichere Migration bestehender Matchdaten/Formationstemplates; ältere Exporte weiter importierbar halten oder ausdrücklich dokumentierte Migration liefern.

## 2. Kanonisches Volleyball-Datenmodell
Ein `TeamState` pro Mannschaft, getrennt für EVV und Gegner: stabile Spieler-ID, Name optional, Trikotnummer, mehrere erlaubte Rollen, aktive Satzrolle, Startsechs, aktuelle Regelposition P1–P6, aktuelles Aufschlagrecht, Satz-/Rallyestatus, reguläre Wechselhistorie, bis zu zwei registrierte Liberos, tatsächliche Libero-Ersetzungen samt ersetztem Spieler und Regelposition, Vorlagen/Overrides. Keine Spieleridentität aus Trikotnummer allein ableiten, wenn Nummern korrigiert werden.

**Drei strikt getrennte Koordinaten-/Zustandsebenen:** (a) regelgebundene Rotation/Spieleridentität, (b) rechtmäßige Ausgangsstellung bei Aufschlagkontakt, (c) freie taktische Stellung nach Aufschlag. Editieren von (c) darf (a) nie verändern. Nur die Mannschaft rotiert, die durch Sideout das Aufschlagrecht gewinnt. Bei eigenem Aufschlag und Punktgewinn keine Rotation. Satzwechsel, Startaufschlag, Korrekturen und Undo konsistent.

**5:1:** Läufer I–VI bezeichnet die **tatsächliche Regelposition des Zuspielers** I=P1, II=P2, III=P3, IV=P4, V=P5, VI=P6. Die App-R1–R6-Bezeichnung muss explizit gemappt werden. Nicht annehmen, dass R1 gleich Läufer I ist. Grundaufstellung mit gegenüberliegenden Paaren Z/D, AA1/AA2, MB1/MB2; Rotation durch regelkonforme Positionsverschiebung. Eine einmal eingegebene Startsechs muss alle sechs Rotationen ohne manuelles Neuaufstellen erzeugen.

## 3. Vollständige, nutzbare K1-Läufer-Vorlagen
Für **alle sechs Läufer I–VI** echte, editierbare 5:1-Annahmeformationen bereitstellen, aus den Seed-Daten abgeleitet und fachlich überprüft. Jede Vorlage enthält:
- sechs legale Regelpositionszuordnungen, visuell erkennbare Hinter-/Vorderreihe;
- plausible Annahmeformation mit 2 oder 3 Annahmespielern, Libero nach tatsächlich zulässiger Ersetzung;
- legalen Aufstellungszustand zum Aufschlagkontakt, insbesondere Links/Rechts- und Vorne/Hinten-Überlappungen;
- separate taktische Zielpositionen nach dem Aufschlag, Zuspieler-Laufweg, typische Angriffslinien, optional mehrere Pass- und Angriffsvarianten;
- individuelle Overrides je Mannschaft, Rotation, Phase (K1/K2), Gegnerangriffsseite; Teamdefaults einmal speichern und in weiteren Spielen laden.

Baue eine nachvollziehbare **Overlap-Validierung**, die rechtmäßige Aufstellungspositionen anhand der tatsächlichen relativen Positionen prüft. Eine Vorlage gilt erst als abgenommen, wenn alle sechs Rotationen geprüft sind. Taktikpositionen nach Aufschlag unterliegen nicht denselben Overlap-Vorgaben.

## 4. Gegner direkt am Board erfassen
Gegnerische Kreise antippen → Trikotnummer eingeben/korrigieren → Rolle auswählen: **AA, MB, D, Z, L, ?**. Optional detailliert AA1/AA2, MB1/MB2. Standardvorschlag 5:1 mit 2 AA, 2 MB, 1 D, 1 Z und bis zu 2 Liberos. Unbekannte Rollen/Nummern sind erlaubt und können im laufenden Satz nachgetragen werden. Keine Pflicht zur vollständigen Gegneranalyse vor Matchbeginn. Schnellwechsel: `#raus → #rein`, Rolle vorschlagen, ggf. ändern, regelkonform dokumentieren, Rückwechsel/Undo unterstützen. Alle Views aktualisieren sich aus einer Datenquelle.

## 5. Libero-Logik vollständig reparieren (P0)
Je Mannschaft bis zu zwei eingetragene Liberos. **Der aktuelle Hinterfeld-Mittelblocker ist nicht immer MB1 und nicht immer auf P5 oder P6.** Wenn MB1 hinten/MB2 vorne, kann der Libero MB1 ersetzen; wenn MB2 hinten/MB1 vorne, entsprechend MB2. Die konkrete Ersetzung hängt von der echten Spielhistorie und den geltenden Regeln ab. Kein blindes Auto-Einwechseln beim bloßen Anzeigen einer anderen Rotation.

Getrennte Vorgänge: taktische Vorschau, reale Libero-Ersetzung, Rückkehr des ersetzten Spielers, regelkonformer Wechsel zwischen zwei Liberos, regulärer Spielerwechsel. Schnellmenü auf EVV- und Gegnerboard mit L1/L2, Nummernkorrektur und legalen Optionen. Prüfe Hinterfeldberechtigung, Ersetzungspartner, notwendige Rallye zwischen Ersetzungen und zulässige Ausnahmen nach relevantem Regelwerk. Kein siebter Spieler, kein Libero als regulärer Wechsel, keine fiktiven Wechselereignisse. Wechsel-/Rallye-/Undo-/Satzwechseltests mit beiden MBs über sechs Rotationen.

## 6. Ein einziges, konsistentes Spielfeld für alle Ansichten
Gemeinsame SVG-/Board-Engine für Live, eigene Aufstellung, Gegneraufstellung, K1, K2, Rotationsvorschau, Editor, Timeout und gespeicherte Vorlagen. Beide Mannschaften gleichzeitig darstellbar, Netz, 3-m-Linien, korrekte Geometrie. EVV **blaue Kreise**, Gegner **rote Kreise**, darin ausschließlich gut lesbare Trikotnummer, Libero mit `L` markiert. Keine rechteckigen Spielerplatzhalter. Einheitliche Auswahl-/Drag-Logik, skalierbare große Timeout-Ansicht.

Zwei klare Betriebsarten: **LIVE** (sicher gegen unbeabsichtigte Positionsänderung; schnell scouten) und **EDITOR** (taktische Positionen, Pfeile, Vorlagen verändern). Gespeicherte Änderungen müssen Reload, Satzwechsel, Export/Import überstehen. Rotation darf nicht durch Verschieben von Taktik-Kreisen geändert werden.

## 7. Pfeile und taktische Zeichenwerkzeuge reparieren (P0)
Beliebig viele, sinnvoll begrenzte Pfeile je Vorlage, auch mehrere alternative Angriffsrouten gleichzeitig: Ballweg, Zuspielweg, Angriffslaufweg, Spielerweg, ggf. Block-/Abwehrweg. Nach dem ersten Pfeil muss das Werkzeug weiter benutzbar sein. Jeden Pfeil einzeln auswählen, ganzen Pfeil ziehen, Start-/Endpunkt separat ziehen, Richtung/Länge ändern, löschen, Undo/Redo, speichern/laden/exportieren/importieren. Pointer-/Touch-Ereignisse für iPad und Maus; sichtbare Auswahlgriffe, nicht nur Hover. Mindestens fünf Pfeile in einer Vorlage automatisiert testen.

## 8. K2-Abwehrvorlagen
Aus `formationen_5_1.json` editierbare, rollengebundene Grundvorlagen für alle Rotationen ableiten; keine starren Trikotnummern. Gegen gegnerischen Angriff von IV: eigener Doppelblock P2/P3, P4 Nahsicherung, P1 Linie, P5 Diagonale, P6 tiefe Sicherung/Blockschatten. Gegen II: Doppelblock P3/P4, P2 Nahsicherung, P5 Linie, P1 Diagonale, P6 tief. Gegen Mitte III: bevorzugter **Einzelblock P3**, P2/P4 Nahsicherung, P1/P5 um Blockschatten, P6 tief. Gegen Hinterfeld I: **Doppelblock P3/P4**, P2 Nahsicherung, übrige Feldabwehr. Als Trainerpräferenzen speichern und anpassen können, nicht als universell zwingende Technik ausgeben. K1 und K2 dürfen nicht verwechselt werden.

## 9. EVV-Stammdaten (ohne Duplikate)
Johann **#6 Z**; David **#10 AA/Z**; Jens **#7 MB/D**; Felix **#20 AA**; Anmol **#99 L**; Lion **#8 D**; Niklas **#5 MB**. Bestehende andere Datensätze/Nummern beibehalten, keine erfundenen Trikotnummern. Mehrfachrollen sind erlaubt; tatsächlich gespielte Rolle pro Satz festlegen. Rolle darf für kommende Aufstellungen geändert werden, ohne historische Statistiken rückwirkend umzudeuten.

## 10. Zuspieler-Cockpit: Johann und jeder andere aktive Zuspieler
Minimaler Zusatzaufwand: vorhandene Annahme- und Angriffsereignisse nutzen. Zuspielziel **IV/III/II/Hinterfeld**, aktiver Zuspieler, optional Angreifer, K1/K2, Annahmequalität **A+ / A~ / A−** (bestehende Bewertungsstufen nur nach geprüfter Zuordnung abbilden), Angriffspunkt/-fehler. Wenn Zuspieler oder Ziel eindeutig aus dem protokollierten Ablauf ableitbar, automatisch erfassen; sonst kurze optionale Auswahl. **Nie Daten erfinden.**

Kennzahlen: Passverteilung nach Ziel; Mitte-Nutzung bei A+, A~, A−; Angriffspunktquote und Angriffsfehlerquote je Ziel; K1/K2, Satz/Gesamt; absolute Zähler und Nenner. Trenne **Erfolg des nachfolgenden Angriffs** ausdrücklich von **technischer Zuspielqualität**. Optionale spätere Bewertung Z+/Z~/Z− darf keine Pflichtaktion werden. Mitte-Pacer: Ist-Mitte-Pässe vs Soll auf Basis tatsächlich dokumentierter geeigneter Zuspiele.

## 11. Dankeball- und Scoutinglogik
Bestehende Schnell-/Detail-Erfassung, Aces, direkte Annahme-/Abwehrfehler, Angriffspunkte, Blocks, K1/K2, Rotationsampel und Undo erhalten. **Abwehrgewinn/Transition und nachfolgender Angriff sind getrennte Ereignisse**; keine erfundenen Angriffe. Dankeball als explizit dokumentierte Chance: erster organisierter Angriff, direkter Angriffspunkt, späterer Rallyegewinn getrennt auswerten. Zwei unterschiedliche Quoten mit korrekt definiertem Nenner: direkte Dankeball-Killquote und Dankeball-Punktquote. Nicht dokumentierte Chancen nicht mitzählen.

## 12. Matchplan und Live-Pacer
Leitmotiv **„Den Gegner schwindlig spielen!“**. Ziele konfigurierbar, keine als universell behaupteten Normen: erster Satz gewinnen, früh in Führung gehen, K1-Sideout, K2-Break, Mitte bei A+, Angriffspunktquote, leichte Dankeball-Chancen. Voreinstellungen z. B. K1 60 %, K2 35 %, Mitte A+ 35 %, Angriffspunktquote 45 %, Dankeball-Killquote 60 % – ausdrücklich **nur bearbeitbare Trainer-Vorschläge**.

**Punktestand-Pacer**: editierbare Zielkurve `(Gegnerpunkte → Soll-EVV-Punkte)`, z. B. (5→8), (10→13), (15→18), (20→23). Dazwischen definierte Interpolation, bei Überlänge/Deuce klare Behandlung. Anzeige Ist, Soll, `+/-` Abweichung, farbliche Statusanzeige; **keine Gewinnprognose**. Erster Satz mit besonderem Startphasen-Ziel. **Mitte-Pacer** mit Soll/Ist auf Basis guter Annahmen. Matchplan-Leiste: Live-Pacer, K1, K2, Mitte A+, Dankeball, Rotationsampel; Kennzahlen antippbar, Details mit Stichprobengröße. Bei kleiner Stichprobe nicht irreführend rot/grün werten; klare Kennzeichnung.

## 13. Glassmorphism / Icon-Redesign (nach funktionalen P0/P1-Fixes)
Design wie in den drei Nutzerreferenzen: **Dark Glassmorphism / Frosted Glass**, halbtransparente dunkle Paneele, dezenter `backdrop-filter: blur(...)`, feine Konturen, ruhige Rundungen, hochwertige Typografie, kompakte untere Navigation. Lucide-SVG-Icons statt uneinheitlicher Bildbuttons; Navigation **Live / Aufstellung / Taktik / Analyse / Matchplan**, jeweils Icon + kurze Beschriftung. Auf iPad/Mac/Smartphone adaptiv, keine überdeckten Spielfelder oder Bedienelemente. Große Scores, klare Nummern, kontraststarke primäre Scoutingaktionen. Touch-Ziele ca. 44 × 44 px, Tastaturzugänglichkeit, sichtbare Fokuszustände, reduzierte Bewegung, Blur-Fallback. **Lesbarkeit bei heller Hallenbeleuchtung und Geschwindigkeit gehen vor dekorativer Transparenz.** Designsystem zentralisieren; keine inkompatiblen Stilinseln.

## 14. Implementierungsreihenfolge ohne unnötige Zwischenfreigaben
**P0:** Audit → kanonisches Modell → Rotationen/K1 → Gegnerrollen → Libero → einheitliches Board → Pfeile/Persistenz. **P1:** K2, Zuspiel-/Dankeballstatistik, Matchplan/Pacer. **P2:** Glassmorphism/Icons, responsive Polish. In jeder Phase Code, Tests und Screenshots erstellen; eigenständig bis zum Gesamtziel fortfahren. Bei Architekturänderungen bestehende Matches und gespeicherte Vorlagen migrationssicher halten.

## 15. Abnahme – alle Punkte müssen nachweislich funktionieren
- **6 Läufer I–VI:** pro Mannschaft gesetzte Startsechs, sechs rechtmäßige Ausgangsstellungen und plausible editierbare K1-Formationen, Setterwege, kein manuelles Neuaufstellen.
- **Gegner:** Nummern und AA/MB/D/Z/L/? direkt am Feld erfassen, korrigieren, regulär wechseln und rückwechseln; Änderungen sofort überall sichtbar.
- **Rotation:** EVV/Gegner unabhängig, korrekter Sideout, Aufschlagrecht, Satzwechsel, Undo.
- **Libero:** MB1 hinten/MB2 vorne und umgekehrt, über alle sechs Rotationen, zwei Liberos je Mannschaft, Rückkehr, Rallye-Abstände, keine sieben Spieler, keine fiktiven Events.
- **Pfeile:** fünf gleichzeitig zeichnen, einzeln verschieben, Endpunkte bearbeiten, löschen, Undo, Reload, Export/Import, Touch.
- **Boards:** Live/Editor/K1/K2/Timeout gleiche Engine, nummerierte blaue/rote Kreise, Taktikänderung verändert nicht Rotation.
- **Stats:** Zuspielziel/A+ und Mitte, K1/K2, Angriffsquoten, Dankeball-Quoten mit echten Nennern, Undo und Spielerwechsel.
- **Pacer:** Soll/Ist-Zielkurve, Startphase, Mitte-Soll/Ist, Deuce, kleine Stichprobe, keine Prognosebehauptung.
- **Design:** Glassmorphism, Lucide-Icons, responsive iPad/Mac/Telefon, Kontrast/Touch/Bedienbarkeit.
- **Tests:** Node-/Unit-/Integrationstests, echte Browser-UI-Tests Chromium und WebKit, Touchsimulation, synthetisches vollständiges Match mit mehreren Sätzen, Reload, Offline-/Persistenzpfade. Echte iPad-Safari-Tests nur als durchgeführt markieren, wenn tatsächlich auf iPad getestet.

## 16. Verbindliche Lieferobjekte
1. Funktionierender Code auf eigenem Branch und **Draft-PR**.
2. Importierte und vervollständigte `formationen_5_1.json`-Vorlagen plus dokumentierte Mapping-/Overlap-Prüfung.
3. Screenshots aller sechs Läufer, EVV-/Gegnerboard, Rollenzuordnung, Libero-Szenarien, Pfeile, K1/K2, Matchplan/Pacer und Design.
4. Maschinenlesbare Testergebnisse/Logs, Testanzahl, klare Angabe fehlgeschlagener/übersprungener Tests.
5. Kurze `ABNAHME.md`: jede Anforderung mit `PASS`, `FAIL` oder `NICHT GETESTET`, Belegpfad, verbleibende Einschränkungen.
6. Anleitung, wie der Nutzer die RC-Version auf Mac und iPad sicher testet, ohne produktive Daten zu überschreiben.

**Abschlussbedingung:** Nicht „fertig“ melden, solange ein P0-Abnahmetest fehlschlägt oder die behauptete Funktion nur als Mockup existiert. Wenn einzelne Ziele blockiert sind, ehrlich und präzise melden; übrige Aufgaben vollständig implementieren. **Kein Merge, kein Deployment ohne Freigabe.**
