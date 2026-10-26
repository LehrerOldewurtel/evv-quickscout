# Historische Prüfungen: unverändertes Archiv

Die acht Dateien wurden aus dem Repository-Stamm hierher **unverändert** verschoben. Sie bleiben nachprüfbar; ihre Fehler sind keine bestandenen Tests. `node tests/legacy/audit.cjs` kopiert sie mit den aktuellen App-Dateien in ein temporäres Verzeichnis und führt sie aus. Exit 1 bedeutet weiterhin mindestens einen historischen Fehlschlag. Das bisher erfolgreiche `TEST_V792_ROLLEN.js` bleibt im Stamm.

| Skript | Fehlerkategorie | Nachgewiesene Ursache / aktueller Ersatz |
|---|---|---|
| LOOPTEST_V7_4.py | Veraltete Quelltextprüfung | Exakte Zeichenfolgen für Gegner-A0, Tab-Rückkehr, hart codierter Johann als Zuspieler, Undo ohne inzwischen nötige Entwurfsbereinigung. Verhalten: `legacy-migrated`, `unit`, `rotations`, Browser `scouting`. |
| LOOPTEST_V7_5.py | Veraltete Quelltextprüfung | Alte Receiver-Auswahl, Positions-Lane-Tabelle, UI-Titel, A0-/Undo-Schreibweise. Aktuell rollenabhängige Vorderreihe und Hinterfeld I/PIPE. Alle Rotationen und Angriffswege in `rotations`; A0/Undo/ohne Libero in `legacy-migrated`. |
| LOOPTEST_V7_6.py | Veraltete Quelltextprüfung | Alte Angriffstabelle, Receiver-Filter, Block-Dialogname und A0-Schreibweise. Aktuelle Blockwahl läuft in allen sechs Browser-Rotationen; Spielerstatistiken und Kontaktketten nach jeder Rallye in `matchday`. |
| LOOPTEST_V7_7.py | Veraltete Versionsannahme | Erwartet exakt `EVV_VERSION="7.7"`. Aktueller Verhaltenstest prüft geladene Version gegen sichtbare Anzeige. Zweite Bälle, Zurück und Blockabpraller zusätzlich migriert. |
| LOOPTEST_V7_7_1.py | Veraltete Versionsannahme | Erwartet 7.7.1 und Asset-URLs `?v=771`. Produktversion unverändert 7.19.0-k1-auto-mb. Tatsächliche Cache-Installation, Upgrade, Ausfall und Rollback im Browser geprüft. |
| TEST_PAKET_1_2.js | Veraltete Versionsannahme | 12/13 historische Assertions erfolgreich; nur fest erwartetes 7.9.4-release-candidate schlägt fehl. Syntax, Satzgrenzen, Positionen, Angriffsbeschränkungen, Libero und markiertes Undo sind aktuelle Verhaltenstests. |
| TEST_SATZWECHSEL.js | Unvollständige Testumgebung | Aus dem Quelltext extrahierte Funktion mit unvollständigem `st` und DOM; `clone(undefined)` vor eigentlichem Test. Migriert auf JSDOM mit vollständiger App und tatsächlichem Satzassistenten. Alte Erwartung „Libero immer aus“ ersetzt durch heutige ausdrückliche Übernahmeoption; dazu Regression für sofortige Aktivierung. |
| TEST_WECHSEL_V791.js | Unvollständige Testumgebung | Extrahierte Funktion ohne `st.liberoIds`; `.includes` scheitert vor Wechselprüfung. Migrierter Test prüft zwei Paare, Rückwechsel, Paarbindung und Ereignisprotokoll mit vollständigem Zustand. |

Keiner der **acht ursprünglichen Skriptfehlschläge** belegt einen aktuellen Funktionsfehler. Neue tatsächliche Fehler (Statistiknenner, Gegnerfehler, Libero nach Satzwechsel und HTTP-Fehlerfallback) sind separat rot reproduziert, korrigiert und als Regression gesichert. Die historischen Layout- und Wortlautprüfungen werden nicht als aktuelle Produktspezifikation übernommen. Ihre sinnvollen fachlichen Invarianten bleiben in den ausführbaren Tests erhalten.

Die alte starre Versionsprüfung wird nicht durch eine andere starre Zahl ersetzt. `version.js` wird in Auftrag 5 nicht geändert. Der Cache-Suffix kennzeichnet ausschließlich den internen Asset-Cache.
