# EVV QuickScout V8 · finaler Release-Kandidat

Stand des aktuellen vollständigen QA-Laufs: 27.10.2026 18:39 CET. Arbeitsbranch
`release/v8-final-candidate`, Basis `c49a511b4563747d07edea2e4ed36ab0d7bfa323`.
Den endgültigen Build-Commit und die Asset-SHA256 enthält `BUILD.json` im ZIP.
Produktversion unverändert **7.19.0-k1-auto-mb**. Kein stabiler V8-Versionsbump.

## Entscheidung und Grenzen

**GO für die kontrollierte manuelle Release-Abnahme, sobald die zum ZIP gehörende
`.verification.json` `passed: true` meldet.** Die vollständige automatische
Anwendungsregression ist grün; im geprüften Umfang sind keine bekannten P0-/P1-Defekte offen.
Keine uneingeschränkte Spieltags-, Apple-Geräte- oder Produktionsfreigabe.
Eine endgültige Veröffentlichung erfordert weiterhin die ausdrückliche Nutzerfreigabe.

## Basis und erhaltene Funktionen

Die Abstammung enthält vollständig: QA-Foundation `935905e`, Hybrid-Live `72caf77`,
Taktik/Zuverlässigkeit `b01e625`, Spieltags-Generalprobe `c49a511`.
Keine PRs wurden nach main gemergt. Remote-main bleibt
`f6b316bfbbcf30d4758fc954ef006bff59a1fc9e`.
Git-PR-Referenzen #1–#4 zeigen diese Entwicklungsstände. Aktueller PR-Status und
remote CI-Checks sind wegen gesperrter GitHub-API nicht neu verifiziert.

Erhalten und automatisiert geprüft: Schnell-/Detailmodus mit gemeinsamer Kontaktkette,
sechs aktive Spieler, R1–R6 und K1/K2, direkte A0/D0-/Aufschlag-/Angriffsfehler,
Kill/Block/Gegnerfehler, Spielerberechtigungen, sechs reguläre Wechsel mit Paar-Rückwechsel,
zwei Liberos ohne Libero-Aufschlag, Satzvorlagen und Kontingent-Reset,
getrennte Regel-/Taktikpositionen, Formationsbibliothek und Pointer-Bedienung,
Turnaround-Zähler und getrennte Chancen-/Rallyequoten, Satz-/Spieler-/Rotationsstatistiken,
Autosave/Restart/Export/Import und Service-Worker-Lebenszyklus.

## Neue Korrekturen und Sicherungen

1. **Beschädigte Undo-Historie im Import/Reload:** Die bisherige oberflächliche Prüfung
akzeptierte etwa `rallies: null`, ungültige Rollen/Rotationen oder einen eingeschleusten
`rallyUndo`-Wert im Snapshot. Ein späteres Undo konnte den Zustand unbrauchbar machen.
Negativtest zuerst fehlgeschlagen; Snapshots werden jetzt vor Mutation wie Live-Zustände
validiert. Doppelte Spieler und rekursiv eingeschleuste Undo-Stacks werden abgewiesen.
Browserprüfung: Import bleibt abgelehnt, ursprünglicher Stand und gespeicherte Bytes
bleiben identisch, reguläres Undo funktioniert anschließend.
2. **Testinfrastruktur für 100 Matches:** Der erste Vollversuch brach nach 39 bestandenen
Matches am standardmäßigen Node-Heap-Limit ab. Synchrone Tests hielten geschlossene
JSDOM-Kontexte bis zum Event-Loop-Wechsel. Der Test gibt nach jedem Match die Event Loop
frei. Beide folgenden 100er-Läufe bestanden ohne erhöhtes Heap-Limit und ohne gestrichene
Assertions. Das ist keine behauptete Produkt-Memory-Korrektur.
3. **Releaseauslieferung:** reproduzierbarer ZIP-Builder, SHA256-Manifest, isolierter
Mac-Teststarter und tatsächlicher ZIP-Entpack-/Browserprüfer. CI für `release/**` ergänzt;
kein Deployment-Job. Ass-Testgrenze von 2 auf die geforderte 1 Eingabe verschärft.

Rot-/Grünbelege und aktueller Legacy-Audit stehen unter `docs/qa/final/`.

## Tatsächlich ausgeführte Schlussregression

| Prüfung | Bestanden | Fehlgeschlagen | Übersprungen |
|---|---:|---:|---:|
| Node (einschließlich 100 Matchtests) | 149 | 0 | 0 |
| Playwright / Chromium | 76 | 0 | 0 |

Keine flaky Browsertests. Installation per unverändertem Lockfile, alle vier JS-Syntaxprüfungen
und `git diff --check` erfolgreich. Alle Testdaten synthetisch; frische Testprofile.

| Serie im Schlusslauf | Matches | Sätze | Rallyes |
|---|---:|---:|---:|
| Detaillierte Kontaktketten, Seeds 501–600 | 100 | 400 | 17213 |
| Beibehaltene Punktesimulation | 100 | 400 | 19990 |
| Vollständige echte UI-Bedienabläufe | 3 | 9 | 288 |

Die detaillierte Serie umfasst **271405 Kontakte**, **1220 Undo/Wiederholungen**,
**800 Wechsel/Rückwechsel**, **331 Wiederaufnahmen in laufenden
Kontaktketten** und **80 verlängerte Sätze**. 50 Drei- und 50 Fünfsatzmatches;
beide Mannschaften gewinnen je 50 Matches. Neue Startsechsen/Rotationen je Satz,
Libero-Ersetzungen und Formationen R1–R6 werden mitgeprüft.

Der Simulator erzeugt legale synthetische Kontaktpläne und Zielendstände vor Ausführung.
Erzwungene Anfangssequenzen sichern die Ereignisabdeckung; danach folgen gewichtete,
legale Punktefolgen. Keine behauptete empirische Häufigkeitsverteilung realer Ligaspiele.
Ein unabhängiges Modell prüft nach jeder Rallye Score, Aufschlagrecht, Rotation,
Kontaktfolge, aktuelle und archivierte Historie, erfasste Spielerzähler und Turnaround-Statistik.

Zusätzlicher vollständiger Replay-Lauf: nochmals 100 detaillierte Matches, 400 Sätze,
17.213 Rallyes; **100/100 Plan-Digests identisch**. Dies sind dieselben 100 Seeds,
keine weiteren 100 unterschiedlichen Szenarien. Die früheren Teil-/Diagnoseläufe sind
nicht als bestandene zusätzliche Abnahmeserien gezählt.
Die beibehaltenen 100 isolierten Kontaktketten sind ebenfalls keine vollständigen Matches.

Enden der detaillierten Rallyes: `{"A0": 1440, "D0": 3028, "ace": 916, "attackError": 3064, "block": 2291, "kill": 2260, "opponentError": 2361, "opponentServeError": 768, "serveError": 1085}`.
Gegneraufschlagfehler über Quick werden als unvollständig beobachtet gespeichert;
keine erfundene eigene Annahme oder eigener Kill.

## Tatsächliche Eingaben und Browsergrenzen

Ab eingerichtetem Schnellmodus auf 390/820 px: Ass **1**, A0 **2**, D0 **2**,
Angriffspunkt **2**, Abwehr/Transition **1**, Transition → Kill **3**.
Undo **1** auf 390/820/1024 px. Alle geforderten Grenzen erreicht.
Geprüfte Schnellmodus-/Spieler-/Modus-Touchziele mindestens 44×44 CSS-Pixel.
Volle UI-Matches: 245/244/244 Taps bei 390/820/1024 px plus 18/18/19 Auswahlaktionen,
je zwei Texteingaben und eine Ziehbewegung. Native Select-Menü-Taps sind nicht gemessen.

Die UI-Matches bedienen Setup, Spieler-/Libero-Auswahl, beide Modi, Rallyes,
Wechsel/Rückwechsel, Taktik, Formation speichern, Satzvorlage, Matchende,
Statistik, Dateiexport, tatsächlichen Reimport und Reload. Ein separater Test
schließt und startet den Chromium-Prozess mit einem eigens angelegten Testprofil.
Dies ist Browseremulation auf Linux, keine echte Mac-/iPad-Geräteabnahme.

## Daten, Migration und Offline

V7.9.2- und frühere-main-Fixtures, Undo nach Migration, beschädigte/importierte Daten,
Rohdatenrettung und Quota-Warnung bestanden. Größter synthetischer Speicherstand:
2,427,962 UTF-16-Codeeinheiten. Reale Gerätequota bleibt variabel.
Bei Speicherfehlern wird der letzte dauerhaft gespeicherte Stand bewahrt und Export verlangt.
Cacheprüfung: funktionierendes Upgrade, absichtlich fehlgeschlagene Installation,
503-Fallback, tatsächliche Netzunterbrechung und kompatibler Worker-Rollback.
Kein allgemeiner App-/Schema-Downgrade zugesichert.

## Paket und separate Testversion

Pflichtinhalt: index.html und alle sieben benötigten Webdateien, TEST_START.py,
ANLEITUNG.txt, BUILD.json, Testbericht, Einschränkungen und CHECKSUMS.sha256.
ZIP-SHA256 steht zusätzlich in der gleichnamigen `.zip.sha256`-Datei.
`node scripts/verify-package.cjs <ZIP>` prüft das echte ZIP in einem neuen temporären
Verzeichnis, startet dessen enthaltenen Starter, prüft 390/820/1440 px und vergleicht
die Dateiprüfsummen nach dem Browserlauf erneut. Ergebnis: `.verification.json` neben dem ZIP.

Die Webdateien im Archiv sind identisch mit den QA-geprüften Quellen.
Nur bei Auslieferung ergänzt TEST_START.py einen Testhinweis sowie getrennte
localStorage-/Cache-Namen. Es werden ausschließlich freigegebene Webdateien ausgeliefert.
Die normale lokale Speicherung wird im Pakettest durch einen synthetischen Sentinel geschützt.

Mac: ZIP entpacken, Terminal dort öffnen, `python3 TEST_START.py --lan` starten.
Die tatsächlich ausgegebene Mac-Adresse bzw. WLAN-Adresse auf dem iPad öffnen;
beide Geräte im selben vertrauenswürdigen WLAN, Terminal offen lassen.
Python 3 muss vorhanden sein. Ohne iPad genügt `python3 TEST_START.py`.
Keine Routerfreigaben, kein produktiver Upload, keine echten Backups importieren.

## Noch offene Risiken und externe Blocker

- Echte iPad-/iPhone-/Safari-/Pencil-/Mikrofonabnahme offen. WebKit und Firefox wurden
nicht ausgeführt: offizielle Downloadserver liefern hier CONNECT HTTP 403.
- Offline am iPad über WLAN-HTTP ist nicht zugesichert. Dafür ist ein separater HTTPS-Test-Origin
nötig; die automatisierten Loopback-Offlinetests ersetzen das nicht.
- Betriebssystemabbruch, Stromverlust, Speicherverdrängung und gerätespezifische Quota
sind nicht durch geordneten Chromium-Neustart vollständig abgedeckt. Kein Cloud-Backup.
- Sonder-/Verletzungswechsel und eine vollständige DVV/FIVB-Abnahme aller Sonderfälle offen.
Keine native iOS-/Android-Hülle im Lieferumfang.
- Acht archivierte Legacy-Skripte weiterhin inkompatibel, ein historischer Test bestanden.
Aktuelle Ersatztests sind grün; keine Legacy-Datei zur Grünfärbung entfernt.
- Öffentliche Vorschau nicht verbunden; geprüfter Tunnel-Zugang gesperrt. Geprüftes
lokales Paket ist die sichere Alternative.
- GitHub API mit CONNECT HTTP 403 gesperrt. Release-Branch kann per nativem Git gepusht werden;
PR-Anlage und aktuelle Remote-Check-Abfrage bleiben bis zur Netzwerkfreigabe blockiert.
Kein PR oder erfolgreicher Remote-CI-Lauf wird ohne tatsächliche Bestätigung behauptet.

Benötigte API-/Browser-Domains sowie install_script/start_skill wurden im Cloud-Entwurf
gespeichert. Sie müssen in den Umgebungseinstellungen geprüft/gespeichert und die
**Cloud-Umgebung** veröffentlicht werden; dies veröffentlicht keine QuickScout-Webseite.
Danach API-Zugriff erneut prüfen, den vorbereiteten PR gegen main anlegen und reviewen;
kein Merge ohne ausdrückliche Freigabe.
