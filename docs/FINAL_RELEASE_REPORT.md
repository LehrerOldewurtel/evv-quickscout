# EVV QuickScout V8 · finaler Release-Kandidat

Aktueller Schlusslauf: 27.10.2026 19:14 CET. Branch `release/v8-final-candidate`.
Basis `c49a511b4563747d07edea2e4ed36ab0d7bfa323`; endgültiger Commit und Asset-SHA256 im `BUILD.json` des ZIP.
Produktversionskennung unverändert **7.19.0-k1-auto-mb**; keine stabile V8-Freigabe.

## Entscheidung

**GO zur kontrollierten manuellen Release-Abnahme, verbindlich zusammen mit einem positiven,
zum ZIP-Hash passenden `.verification.json`-Paketprotokoll.** Keine uneingeschränkte
Spieltags-/Produktionsfreigabe. Im abschließend geprüften Umfang sind keine bekannten
P0-/P1-Fehler offen. Kein Merge oder Deployment ohne ausdrückliche Nutzerfreigabe.

## Repository und PR

Der Release-Branch enthält vollständig QA-Foundation `935905e`, Hybrid-Live `72caf77`,
Taktik/Zuverlässigkeit `b01e625` und Spieltags-Generalprobe `c49a511` (Git-Abstammung geprüft).
Keiner dieser PRs wurde nach main gemergt. Remote-main bleibt
`f6b316bfbbcf30d4758fc954ef006bff59a1fc9e`.

Die API war zunächst gesperrt und ist inzwischen wieder erreichbar. Alle fünf bestehenden
PRs wurden gelesen: #1–#4 offen, mergeable und mit erfolgreichen damaligen QA-Checks;
**[Draft-PR #5](https://github.com/LehrerOldewurtel/evv-quickscout/pull/5)** wurde tatsächlich
gegen main angelegt. Erster Release-Commit `2541d4c`: Remote-Unit-/Browserregression grün,
anschließende Paketprüfung fehlgeschlagen. Im unabhängigen WebKit-Nachtest wurde danach
der unten dokumentierte Touchfehler belegt. Der jeweils aktuelle Remote-CI-Status ist
am PR zu prüfen; dieses statische Dokument behauptet keinen noch laufenden CI-Erfolg.

## Erhaltene Funktionen und neue Korrekturen

Erhalten und geprüft: gemeinsame Schnell-/Detail-Erfassung, sechs aktive Spieler,
R1–R6/K1/K2, Aufschlag/Annahme/Zuspiel/Angriff/Block/Abwehr, direkte A0/D0-/Aufschlag-
und Angriffsfehler, Gegnerfehler ohne eigenen Kill, Undo, Rollen/Berechtigungen,
normales Sechs-Wechsel-Regelwerk mit Paar-Rückwechsel, zwei Liberos ohne Libero-Aufschlag,
Satzvorlagen und Kontingentreset, Regel-/Taktikpositionen getrennt, Formationen R1–R6,
Lauf-/Ballwege, Turnaround-/Spieler-/Satz-/Rotationsstatistik und lokale Datensicherung.

1. **Beschädigte Undo-Snapshots:** Import/Reload akzeptierten etwa `rallies: null`, ungültige
Rotation/Rollen, doppelte Spieler oder eingeschleuste Undo-Stacks im Snapshot. Jetzt wird
jeder Snapshot vor Zustandsmutation wie Live-Zustand validiert. Abgelehnter Import lässt
den vorherigen Stand und dessen gespeicherte Bytes unverändert; reguläres Undo bleibt nutzbar.
2. **Touch-Click-through und verlorenes Speichern nach Drag:** WebKit konnte nach einem
`pointerup`-Dialogschluss den Kompatibilitätsklick an Sprache/Punktkorrektur darunter senden.
Die reine Klick-Zwischenlösung verlor in Chromium nach Drag die Speicheraktion (zwei
bestehende Tests schlugen fehl). Die endgültige Lösung verarbeitet Touch bei `pointerup`
und fängt genau dessen Kompatibilitätsklick in der Dokument-Capturephase ab. Neue Pointer-
Eingabe und Tastatur lösen die Sperre sofort. Kein genereller Zeitfilter für weitere Taps.
Regressionsprüfungen beobachten tatsächlich aufgerufene Hintergrundhandler, nicht bloß
den vom Browser erzeugten, anschließend abgefangenen Rohklick.
3. **100-Match-Testinfrastruktur:** Erster Versuch nach 39 bestandenen Matches am normalen
Node-Heap abgebrochen. Synchrone Tests hielten geschlossene JSDOM-Kontexte bis zur nächsten
Event Loop. Ein Yield nach jedem Match behebt dies ohne erhöhtes Heap-Limit oder gestrichene
Assertions. Kein behaupteter Produkt-Memoryfix.
4. **Reale Auslieferung:** ZIP-Builder mit aktuellen QA-/Asset-Hash-Gates, isolierter Mac-
Teststarter, SHA256-Manifest und Entpack-/Browserprüfung. CI für `release/**` und Paketprüfung
ergänzt; kein Deployment-Job. Ass-Grenze von zwei auf die geforderte eine Eingabe verschärft.

Rot-/Grünbelege, Ereignisaufzeichnung und vollständige aktuelle Rohdaten: `docs/qa/final/`.

## Tatsächlich bestandene Prüfungen

| Schlusslauf | Bestanden | Fehlgeschlagen | Übersprungen |
|---|---:|---:|---:|
| Node einschließlich detaillierter Matchtests | 151 | 0 | 0 |
| vollständige Chromium-Suite | 79 | 0 | 0 |
| zusätzliche WebKit-Auswahl: Hybrid + Release | 19 | 0 | 0 |

Keine flaky aktuellen Browserfälle. WebKit-Auswahl ist kein behaupteter vollständiger Lauf
aller Chromium-spezifischen Tests. Firefox wurde offiziell heruntergeladen, konnte aber
selbst eine unabhängige data-URL-Kontrollseite nicht starten: Timeout/Rendererfehler und
`/proc/self/uid_map: EROFS`, auch mit virtuellem Bildschirm. **Null Firefox-App-Tests**;
dieser Umgebungsblocker ist weder ein App-Fehlschlag noch ein Firefox-PASS.
Lockfile-Installation, vier JS-Syntaxprüfungen und `git diff --check` bestanden.

| Serie im abschließenden Gesamtlauf | Matches | Sätze | Rallyes |
|---|---:|---:|---:|
| detaillierte Kontaktketten, Seeds 501–600 | 100 | 400 | 17213 |
| beibehaltene Quick-Punktesimulation | 100 | 400 | 19.990 |
| vollständige echte UI-Bedienabläufe | 3 | 9 | 288 |

Die detaillierte Serie enthält **271405 Kontakte**, **1220 Undo/Wiederholungen**,
**800 Wechsel/Rückwechsel**, **331 Wiederaufnahmen innerhalb laufender
Kontaktketten**, 50 Drei- und 50 Fünfsatzmatches sowie 80 verlängerte Sätze. Beide Teams
gewinnen je 50 Matches. Startsechsen/Rotationen je Satz, Liberos und Formationen mitgeprüft.

Ein unabhängiges Sollmodell erzeugt Kontaktpläne und Endstände vor der Ausführung und
vergleicht nach jeder Rallye Score, Aufschlagrecht, Rotation, K1/K2, Kontaktfolge,
Historie, erfasste Spielerzähler und Turnaround-Statistik. Erzwungene Anfangssequenzen
sichern Abdeckung; folgende Punkte sind gewichtet und regelkonform. Synthetische
Abnahmeszenarien, keine empirische Verteilung echter Ligaspiele. Aufschlagfehler/Asse,
A0/D0, mehrere Angriffe/Transitions, Block und Gegnerfehler sind tatsächlich enthalten.
Quick-Gegneraufschlagfehler bleiben als unvollständig beobachtet markiert.

Replayvergleich: 100/100 Plan-Digests stimmen mit zwei unabhängigen vollständigen
Referenzläufen überein. Insgesamt liefen während der Entwicklung vier vollständige
100er-Detailserien; eine Gesamt-QA enthielt dabei noch zwei UI-Fehlschläge. Dies sind
**100 unterschiedliche Seeds**, keine 400 unabhängigen Szenarien. Der abgebrochene
Heaplauf und gezielte Teilläufe werden nicht als zusätzliche abgeschlossene Abnahmeserien
gezählt. Die beibehaltenen 100 isolierten Kontaktketten sind keine vollständigen Matches.

## Gemessene Bedienung

Ab eingerichtetem Schnellmodus auf 390/820 px: Ass **1**, A0 **2**, D0 **2**, Kill **2**,
Transition **1**, Transition → Kill **3**. Undo **1** auf 390/820/1024 px.
Alle Zielwerte erreicht, geprüfte Touchflächen mindestens 44×44 CSS-Pixel.
Dialog-Sicherheit zusätzlich auf 390/820/1440 px. Die drei vollständigen UI-Matches
benötigen 245/244/244 Taps plus 18/18/19 Auswahlaktionen, je zwei Texteingaben und einen Drag.
Native Select-Menü-Taps sind keine behauptete Messung. UI-Abläufe umfassen Setup,
Spieler/Libero, beide Modi, Wechsel, Taktik, Vorlage/Satzwechsel, Matchende, Statistik,
Dateiexport/Reimport und Reload. Ein Test schließt/startet den Chromium-Prozess mit einem
eigens angelegten Testprofil. Alles Browseremulation auf Linux, keine Apple-Geräteabnahme.

## Datensicherheit und Paket

Migration von V7.9.2-/vorherigen-main-Fixtures, atomarer Undo, beschädigte Imports,
Rohdatenrettung und Quota-Warnung bestanden. Größter synthetischer Speicherstand:
2427962 UTF-16-Codeeinheiten; reale Gerätequota bleibt variabel.
Bei Speicherfehlern bleibt der letzte dauerhafte Stand erhalten, Export wird verlangt.
Service Worker: Upgrade, absichtlich fehlerhafte Installation, 503-Fallback, tatsächliche
Netzunterbrechung und kompatibler Worker-Rollback geprüft. Kein allgemeiner Schema-Downgrade.

Das ZIP enthält alle sieben Webdateien, TEST_START.py, ANLEITUNG.txt, BUILD.json,
Testbericht, Einschränkungen und CHECKSUMS.sha256. Der ZIP-Hash steht zusätzlich daneben.
Die zum Download angebotene Datei wird tatsächlich in ein neues Verzeichnis entpackt,
daraus gestartet und bei 390/820/1440 px bedient. `.verification.json` belegt den exakten
ZIP-Hash, Prüfsummenvergleich, Modi/Taktik/Analyse/Statistik, Speicher-/Cachetrennung und
Offline-Reload. Chromium verwendet dabei Playwrights Offline-Schalter; WebKit wird der
reale Server beendet, da sein Offline-Schalter einen internen Navigationsfehler lieferte.
Keine Offlineassertion wurde abgeschaltet. Bestehende Chromium-Offlinefälle bleiben erhalten.

Die Webdateien bleiben beim Verpacken byteidentisch mit den geprüften Quellen. Nur bei
Auslieferung ergänzt der Starter einen Testhinweis und separate Speicher-/Cache-Namen;
ein synthetischer Sentinel schützt den normalen Speicherschlüssel im Pakettest.
WebKit verwendet unveränderte offizielle Browserbinärdateien und lokale Debian-Bibliotheken:
APT prüft signierte Metadaten, zusätzlich wird jede .deb-SHA256 gegen diese Metadaten geprüft.
Keine TLS-, Signatur- oder Artefaktprüfung deaktiviert. Reproduktion:
`bash scripts/setup-extra-browsers.sh`, `playwright.webkit.config.cjs` und Paketprüfer mit
`EVV_BROWSER_LIBS` gemäß QA-Playbook. Kein Administratorzugriff erforderlich.

Mac: ZIP entpacken, Terminal darin öffnen, **`python3 TEST_START.py --lan`** starten.
Die ausgegebene Mac-/WLAN-Adresse am Mac bzw. iPad öffnen; beide im selben vertrauten WLAN.
Python 3 muss installiert sein, Terminal bleibt offen. Ohne iPad genügt Start ohne `--lan`.
Keine Routerfreigabe, keine produktiven Spieldaten/Backups, keine Cloud-Synchronisierung.

## Verbleibende Risiken

- Echte iPad/iPhone/Safari/Pencil/Mikrofon-Abnahme offen; WebKit-Linux ist kein Apple-Gerät.
- WLAN-HTTP am iPad garantiert keine Offline-PWA/Mikrofonfunktion; dafür eigener HTTPS-Test-Origin.
- Betriebssystemabbruch, Stromverlust, Speicherverdrängung, Gerätequota und Geräteverlust
  sind nicht vollständig abgedeckt. Regelmäßig exportieren; kein serverseitiges Backup.
- Sonder-/Verletzungswechsel und vollständige DVV/FIVB-Sonderfallabnahme offen;
  normales Sechs-Wechsel-Regelwerk geprüft. Keine native iOS-/Android-Hülle.
- Acht historische Skripte weiterhin inkompatibel archiviert, ein historischer Test bestanden.
  Aktuelle Ersatztests grün; keine Tests zur Grünfärbung entfernt.
- Firefox-Funktionstests durch beschriebenen Hostblocker nicht ausgeführt.
- Öffentliche Vorschau nicht verbunden; das geprüfte lokale Paket ist die sichere Alternative.

Installations-/Startanleitung und erforderliche Netzwerkdomains sind im Cloud-Entwurf
gespeichert. Für deren dauerhafte Übernahme Umgebungseinstellungen prüfen/speichern und
die **Cloud-Umgebung** veröffentlichen; dies veröffentlicht keine QuickScout-Webseite.
