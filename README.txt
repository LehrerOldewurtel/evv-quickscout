EVV QuickScout V7
=================

Start:
1. ZIP entpacken.
2. Den kompletten Ordner zusammenlassen.
3. index.html im Browser öffnen. styles.css und app.js müssen im selben Ordner liegen.

V7 enthält:
- Satz 1–4 bis 25 mit 2 Punkten Abstand
- Satz 5 / Tie-Break bis 15 mit 2 Punkten Abstand
- kein Satz 6; Matchende
- Satzstartdialog mit freier Rotation und Aufschlagrecht/K1/K2
- Satz-/Match-Navigation (historisch read-only)
- Rally-Undo als vollständiger Rally-Zustand
- ± Punkt ohne Statistik-/Rotationsänderung
- aktive Sechs direkt unter Heim/Gegner
- Wechsel: ausgewechselter Spieler verschwindet aus Live-Aktionen; Jens kann eingewechselt werden
- Gegner-Setup: Zuspieler, Libero, vier Annahmespieler
- Gegner-Scouting: Annahme, Zuspielrichtung IV/III/II/PIPE, Ergebnis
- Coach-/Auszeitansicht mit Mindeststichprobe für Aufschlagziel
- optionale Kill-/Punktkarte per Feldtap
- Match-/Satzstatistik

Wichtig:
Die bestätigte Projekt-Rotationsfolge R5 -> R1 -> R6 ist als Regression hinterlegt.

SELFTEST.txt dokumentiert die automatischen Kernprüfungen.


V7 VOICE – iPad
---------------
Sprachmodus ist für Safari/iPad vorgesehen.
Wichtig: Mikrofon-Spracherkennung benötigt einen sicheren HTTPS-Kontext. Die lokale ZIP/file://-Version bleibt vollständig per Touch bedienbar, zeigt für Sprache aber einen Hinweis.

Beispielbefehle:
- "Johann Aufschlag Ace"
- "Johann Aufschlag Fehler"
- "Felix Annahme A3"
- "Jens Angriff vier Kill"
- "Janik Block"
- "Punkt EVV"
- "Punkt Gegner"
- "Undo"
- "Wechsel Jens Jonas" (erster genannter Spieler = rein, zweiter = raus)

Sicherheitsprinzip:
Ein erkannter Sprachbefehl wird vor der Wertung sichtbar angezeigt und muss mit "Übernehmen" bestätigt werden. Touch bleibt immer als Fallback.


V7.1 LOOP-FIX
- Ass und Kill: einheitliche 9-Zonen-Zielwahl
- Aufschlag IN führt direkt zur Gegnerannahme
- K1-Angriff: keine 24 Kombinationen mehr; nur rollen-/positionsgerechte Optionen
- Zuspieler und Libero nie als normale Angreifer
- Zielzone wird zusätzlich zur Koordinate gespeichert
- Voice-Ace nutzt ebenfalls die 9-Zonen-Wahl


V7.2 LIVE-TEST FIX
- Kopfbereich und Eingabebereich zentral ausgerichtet
- sichtbarer Sprachstatus oben entfernt
- aktueller Aufschläger wird namentlich angezeigt
- Johann hart aus Angreiferwahl und Voice-Kill ausgeschlossen
- Kill/Ace Zielwahl sichtbar als echtes 3x3-Feld mit Zonen 1-9
- Rotation nach Live-Test korrigiert: R5 -> R6 -> R1


V7.3
- reduzierte Satzvorbereitung für Satz 2-5
- Gegnername bleibt, Aufstellungen können je Satz angepasst werden
- vollständige Satzstatistik: Annahme, Aufschlag, Angriff, Block, K1/K2, Landepunkte
- GitHub-Pages/iPad-Anleitung enthalten

V7.4 Stability Loop:
- Atomarer Undo für Rallyes mit Zielpunkt: Snapshot vor Markierung/Statistik.
- Gegner-A0 = sofort EVV-Punkt; kein falscher Sprung zu Gegner-Zuspiel.
- Nach abgeschlossener Rallye automatisch zurück zu Rallye/LIVE.
- Beim Setup ermittelte EVV-Annahme bleibt beim Start erhalten.
- Satz-Weiter-Altfehler st.ended bereinigt.
- Rallyelog zeigt vorhandene Aktionskette aussagekräftiger.
