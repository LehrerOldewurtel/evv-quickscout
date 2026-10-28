# Automatisiertes QA-Konzept für V8.0

## Reproduzierbarer Start

Voraussetzungen: Node 24, npm, Python 3, Chromium. Keine App-Secrets oder externen Spielservices erforderlich.

```sh
cd /workspace/evv-quickscout
npm ci --ignore-scripts --cache /workspace/.npm-cache
node --test tests/rotations.test.cjs
npm test
npm run test:e2e
npm start
```

Playwright startet/stoppt seinen eigenen Server auf Port 4173. Vor E2E einen manuell gestarteten Server beenden. `CHROMIUM_PATH` erlaubt einen anderen installierten Chromium-Pfad. CI installiert den zur Playwright-Version passenden Browser. Lockfile ist verbindlich; lokale Testartefakte liegen im ignorierten `artifacts/`, Fehlertraces in `test-results/`.

## Pflichtprüfungen

1. **Rotationen zuerst:** R1–R6, je sechs Sideouts. Ein unabhängiger Positionsrechner prüft P1–P6, die drei Vorderreihenspieler, automatisch eingesetzten Hinterfeld-MB/Libero, vier Annahmespieler, regulären Aufschläger und erlaubte Angriffswege. Projekt-Rotationszahlen sind von Feldpositionen zu unterscheiden.
2. **Unit/Regression:** Satzgrenzen, Tie-Break, Sideout, unzulässiger Sieger, Satzsperre, Wechsel/Rückwechsel, registrierter Libero, A0/D0, atomarer Undo und Speicherung. Vollständige App im JSDOM, keine fragilen aus dem Quelltext extrahierten Funktionskopien. Für schnelle Spielsimulationen ist nur Rendering im Test-Harness deaktiviert.
3. **Sechs Browser-Szenarien je Startrotation:** K1 Angriffspunkt/Zielzone/Undo; K2 Aufschlag–Annahme–Blockpunkt; lange Rallye mit zwei Transitions; A0 und D0 auf beiden Seiten; Wechsel und Rückwechsel; Satzwechsel mit Archiv und Reload. Echte Touch-Taps auf sichtbaren Bedienelementen in Chromium bei 820×1180. Beim Satzwechsel erzeugt die produktive Action-API die vorbereitenden 25 Punkte; diese Punkte sind keine Touch-Messung.
4. **100 vollständige Matches:** Seeds 1–100, LCG (1664525/1013904223, uint32). Festgelegte Punkte sorgen für Einstand in Sätzen 1–4; gerade Seeds erzwingen einen fünften Satz. Der Generator spielt über Quick-Aktionen. Ein getrennter Oracle berechnet jeden Zwischenstand, Aufschlagrecht, Rotation und K1/K2 aus dem Siegerstrom. Außerdem Satzarchive, Reset und Matchende nach drei gewonnenen Sätzen prüfen. Keine App-Scoringfunktion als Erwartungswert verwenden. Ergebnisse: `artifacts/100-matches.json`.
5. **Touch-Aufwand:** Taps je festem Szenario erfassen, Setup ausnehmen und Auswahlfelder separat erwähnen. Browser-Anhänge enthalten Zählwerte. Neue Dialoge nur bei fachlichem Bedarf oder Schutz vor Datenverlust.

## Fehlerkorrektur und Evidenz

Fehler zuerst rot reproduzieren, minimal korrigieren, dann den betroffenen Lauf und die Regression wiederholen. Ergebnisse einschließlich Fehlerausgabe, Laufzeitversionen und Einschränkungen in `docs/TEST_REPORT.md` festhalten. Baseline-Inventar mit SHA256: `docs/qa/baseline-inventory.json`; historische Tests separat als Legacy kennzeichnen. Keine alten PASS-Angaben übernehmen.

## Weitere Abnahme vor stabilem Hybrid-Release

Nicht von den Pflichtprüfungen abgedeckt: echtes iPad/Safari, Pencil, Mikrofon/Spracherkennung, native iOS-/Android-Verpackung, Hintergrundwechsel, vollständiger Offline-Cache-Lebenszyklus, Import-Migrationen und fehlerhafte Backups, Sonderwechsel/Verletzungen und vollständige DVV/FIVB-Regelkonformität. Die 100 Quick-Matches prüfen keine unabhängige vollständige Spielerstatistik. Für diese Bereiche eigene reproduzierbare Abnahmen ergänzen, bevor V8.0 stabil genannt wird.

## Nachprüfung von PR #1

Siehe `PR1_REVIEW.md`: zusätzliche Upgrade-/Speicher-/Sprach-/Libero-Regressionen in `tests/review.test.cjs` und `tests/e2e/review.spec.cjs`. Historische synthetische Fixtures sind eingecheckt und brauchen im normalen Testlauf weder Git-Historie noch Netz. Bei notwendiger Regeneration nur `node scripts/generate-upgrade-fixtures.cjs` ausführen (benötigt die beiden dokumentierten historischen Commits); die echten alten Apps laufen dabei isoliert in JSDOM. Keine produktiven Backups ersetzen. Die nächste Engine und die vollständige Hybrid-Abnahmematrix sind in `design/V8_HYBRID_TURNAROUND.md` spezifiziert, noch nicht implementiert.

## Hybrid-Entwicklung

`tests/hybrid.test.cjs` ergänzt 100 deterministische vollständige Kontaktketten und unabhängige Sollzähler; `tests/e2e/hybrid.spec.cjs` misst sechs Erfassungsabläufe bei 390/820 px mit echten Touch-Taps. Ergebnisgrenzen und Vorbereitung der taktischen Formationen stehen in `HYBRID_IMPLEMENTATION.md`. `npm test` und `npm run test:e2e` enthalten sämtliche bisherigen und neuen Fälle.

## Entwicklungsauftrag 4

`tests/advanced.test.cjs` und `tests/e2e/advanced.spec.cjs` ergänzen Formationseditor, Satzassistent, Auswertung, Wiederherstellung, Offline, Import- und Quota-Fälle. Der Folge- und Freigabebericht steht in `PHASE4_REPORT.md`; aktuelle Rohbelege unter `docs/qa/phase4/`. Die 100 Kontaktketten prüfen jetzt zusätzlich die erweiterten Statistikwerte mit unabhängigen Sollzählern. Aktuelle Verhaltenstests und historische fragmentbasierte Skripte getrennt berichten.

## Auftrag 5: vollständige Spieltage und Release-Kandidatenlauf

`npm run qa:release` führt alle Node- und Browserprüfungen aus, entfernt vorher nur die bekannten generierten QA-Artefakte und schreibt Prozess-Exitcodes, Zeitpunkte, TAP, Playwright-JSON sowie einen maschinell erzeugten Bericht unter `artifacts/release-candidate.{json,md}`. Veraltete Simulations-/Browserartefakte werden nicht als neue Evidenz akzeptiert. CI verwendet denselben Ablauf und lädt die Artefakte auch bei Fehlern hoch. Installation weiterhin `npm ci --ignore-scripts --cache /workspace/.npm-cache`; Syntax/Diff gesondert prüfen.

`tests/matchday-oracle.cjs` importiert keine App-Funktionen. Seeds 501–520 erzeugen Kontaktpläne, bevor die Aktionen ausgeführt werden. `tests/matchday.test.cjs` führt diese über die vollständige App aus und prüft **nach jeder Rallye** Score, Aufschlag, Rotation, K1/K2, sämtliche Kontakte, Historie, Spieler-/Rotations-/Turnaround-Statistik, Wechselprotokoll, Libero, Formationen und tatsächliches `saveLocal`. Rendering ist für diese Simulation im Harness deaktiviert; Speichern wird deshalb explizit ausgelöst. Nach jedem Match folgt ein vollständig neuer App-Kontext aus den gespeicherten Daten. SHA256 der Sollpläne erlaubt Replay-Vergleiche.

`tests/e2e/matchday.spec.cjs` spielt je ein vollständiges Match auf 390/820/1024 Pixeln ausschließlich über UI-Eingaben; `evaluate` liest nur Zustände. Dazu Setup, Detail-/Schnellmodus, Wechsel/Rückwechsel, Libero, Taktik, Reload, Satzvorlage, Matchende, Download und tatsächlicher Reimport. Ein weiterer Test schließt den Chromium-Prozess und startet ihn mit demselben **eigens angelegten temporären** Profil neu.

`tests/e2e/cache-lifecycle.spec.cjs` betreibt einen isolierten lokalen Test-Origin, installiert den unveränderten Auftrag-4-Service-Worker, aktualisiert auf den neuen Worker, erzwingt eine fehlgeschlagene Installation, prüft HTTP-503-Fallback und Offline-Reloads mit tatsächlich abgebrochenen Serververbindungen und installiert anschließend den vorherigen Worker erneut. Es handelt sich um einen Cache-/Worker-Rollback mit kompatiblem Datenschema, nicht um eine App-/Schema-Downgrade-Freigabe.

Historische Dateien liegen unverändert unter `tests/legacy/`. `node tests/legacy/audit.cjs` dokumentiert weiterhin acht Fehlschläge und einen Erfolg; Gründe und Migrationen: `tests/legacy/README.md`. Diese Inkompatibilitäten sind getrennt von echten aktuellen Produktfehlern zu zählen. Neue Releasebewertung: `docs/RELEASE_CANDIDATE_REPORT.md`.


## Finaler Release-Kandidat (27.10.2026)

Basis `c49a511`, Arbeitsbranch `release/v8-final-candidate`; Produktversion bleibt unverändert.
Die detaillierte Generalprobe umfasst jetzt Seeds 501–600: 100 vollständige Matches,
Drei- und Fünfsatzverläufe, beide Matchsieger, variable Endstände sowie verlängerte Sätze
(jeder fünfte Seed). Erzwungene kurze Startsequenzen sichern die Szenarioabdeckung;
danach werden legale Sieger aus dem unabhängigen, vorgegebenen Endstand gewichtet gezogen.
Kontaktpläne enthalten 0–3 zusätzliche Angriff-/Abwehrzyklen. Sie sind synthetische
Abnahmeszenarien, keine empirische Verteilung realer Ligaspiele.

Erwartungen für Score, Rotation, Aufschlag, Kontakte und sämtliche erfassten Spieler- und
Turnaround-Zähler stammen aus `matchday-oracle.cjs`; Vergleich nach jeder Rallye.
Asse, Aufschlagfehler und nicht beobachtete Gegneraufschlagfehler werden zusätzlich erfasst.
In jedem Match wird gezielt in Kontaktketten gespeichert und eine neue JSDOM-App gestartet.
Abschließend wird auch das komplette Match aus gespeichertem Zustand rekonstruiert.
Bei Fehlern schreibt der Simulator Seed, alle abgeschlossenen Pläne, den aktuellen Plan,
Zustand und Entwurf nach `artifacts/failure-seed-N.json`. Erfolgssummen und Plan-SHA256:
`artifacts/100-matchdays.json`. Ein event-loop yield nach jedem Match gibt geschlossene
JSDOM-Kontexte frei; die neue 100er-Serie darf nicht durch ein höheres Heap-Limit kaschiert werden.

Zusätzliche Tests: beschädigte Undo-Snapshots inklusive Import ohne Mutation,
Touchziele mindestens 44×44 Pixel und ein tatsächlicher Undo-Tap bei 390/820/1024 px.
Die ursprünglichen UI-Matches, 100 Quick-Matches, 100 isolierten Kontaktketten,
Migrations- und Cache-Lebenszyklusprüfungen bleiben erhalten.

Paketworkflow nach grüner Generalprobe:

```sh
python3 scripts/package_release.py
node scripts/verify-package.cjs artifacts/EVV-QuickScout-V8-RC.zip
```

Der Builder verlangt aktuelle, erfolgreiche QA-Ausgaben und identische App-Asset-Hashes.
Der Prüfer entpackt das echte ZIP in ein neues temporäres Verzeichnis, prüft alle Pflichtdateien
und SHA256-Einträge, startet dessen TEST_START.py und bedient den Inhalt bei 390/820/1440 px
inklusive Schnell-/Detailmodus, Taktik, Analyse, Statistik, Speicherung und Offline-Reload.
Ein synthetischer Sentinel im normalen Speicherschlüssel beweist die Speichertrennung.
Der abschließende ZIP-Hash und Paketprüfung stehen neben dem ZIP in .sha256/.verification.json.
Ein Download darf erst nach erfolgreichem Prüferlauf als verifiziert bezeichnet werden.


## Touch-Nachtest und zusätzliche WebKit-Abnahme

Der Schlusslauf umfasst 151 Node- und 79 Chromium-Tests. Zusätzlich wurden 19 Hybrid-/Releasefälle mit WebKit ausgeführt. Der Capture-Schutz in touchButton erhält Touch-Speichern nach Drag, fängt retargetete Kompatibilitätsklicks ab und lässt die nächste physische/Keyboard-Eingabe frei. Die bestehende Drag-Prüfung wurde nicht entfernt. Erstfehler und Gegenprüfungen stehen unter qa/final/.

Rootless-Setup unter Debian 13: `bash scripts/setup-extra-browsers.sh`. APT verwendet signierte Debian-Metadaten; vor Extraktion wird jedes Paket zusätzlich gegen dessen SHA256 geprüft. Keine Systeminstallation, kein Verändern der Browserbinärdateien. Anschließend:

```sh
export PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright
export XDG_CACHE_HOME=/workspace/.cache
export EVV_BROWSER_LIBS=/workspace/.evv-webkit-libs/usr/lib/x86_64-linux-gnu
npx playwright test --config playwright.webkit.config.cjs tests/e2e/release.spec.cjs tests/e2e/hybrid.spec.cjs
EVV_QA_BROWSERS=chromium,webkit node scripts/verify-package.cjs artifacts/EVV-QuickScout-V8-RC.zip
```

WebKit startet über die unterstützte executablePath/env-Option mit den unveränderten offiziellen WPE-Binärdateien: der mitgelieferte Wrapper überschreibt ansonsten den lokalen Bibliothekspfad. Der Paketprüfer beendet bei WebKit tatsächlich seinen eigenen Server für die Offlineprüfung; die Playwright-Offline-Umschaltung führte zu einem internen Navigationsfehler. Der vollständige Chromium-Offline-/Cache-Lauf bleibt zusätzlich bestehen. Dies ist keine echte iPad-/Safari-Abnahme. Firefoxs unabhängige Kontrollseite startete auch mit Software-Rendering/Xvfb nicht (Host-Sandbox-/Renderer-Timeout); keine Firefox-App-Tests als bestanden ausgeben.


## RC2 nach Praxistest

`tests/e2e/practice.spec.cjs` prüft den geführten Weg Transition → Angreifer → Kill
mit genau drei Eingaben und Spieler-ID, offene Rallyes nach CONTINUE, Doppelklicks,
Reload, getrennte Entwurfs-/Abschlussanalyse sowie Maus-Drag und Auswahl/Zielklick
im SVG-Formationseditor und in den sechs Coach-Skizzen. Die Layoutprüfung misst
alle Live-Aktionen oberhalb der festen Aktionsleiste bei 820×1180, 768×1024,
1024×768 und 1180×820; jede Live-Touchfläche bleibt mindestens 44×44 CSS-Pixel groß.
Die neuen Node-Regressionen liegen in hybrid.test.cjs und decken auch den
Detail-/Quick-Wechsel und die Unterscheidung eigener/gegnerischer Abwehr ab.

Erstfehlerprotokolle und Schlusslauf werden unter docs/qa/practice/ aufbewahrt.
Den neuen SW-Namensraum `practice-2` in der echten Cache-Lebenszyklusprüfung
beachten. Keine Geräte- oder macOS-Abnahme aus Linux-Emulation ableiten.

Testkorrekturen während RC2: dynamische `:last:not([disabled])`-Locatoren
werden nach der Auswahl über die zuvor gelesene Spieler-ID aufgelöst; sonst
wechselte der Locator bei der erneuten Freigabe anderer Spieler. Mausziele
werden in die sichtbare Feldmitte gescrollt (feste Kopfzeile) und Zielklicks
auf ganzzahlige CSS-Koordinaten gesetzt, wie WebKit sie als Pointerevent liefert.
Bewegung und Zielposition bleiben mit derselben Toleranz (<0,5 px) geprüft.
Der erste vollständige Browserlauf und die erste WebKit-Serie wurden zur
Korrektur dieser Testfehler unterbrochen und zählen nicht als bestanden.

RC2 bauen: `python3 scripts/package_release.py --evidence-dir docs/qa/practice
--output /workspace/evv-rc2-download/EVV-QuickScout-V8-RC2.zip`
(in einer Zeile ausführen). So enthält das Paket den zum Assethash passenden
neuen WebKit-Bericht; der Builder prüft auch dessen Fehler-/Skip-/Flaky-Zähler.
Die erweiterte ZIP-Abnahme prüft vier Viewports pro Browser einschließlich
1024×768 mit sichtbarem Testhinweis.

Mit den oben dokumentierten WebKit-Umgebungsvariablen die 40 Fälle reproduzieren:
`npx playwright test --config playwright.webkit.config.cjs tests/e2e/hybrid.spec.cjs tests/e2e/practice.spec.cjs tests/e2e/release.spec.cjs`.
Paketabnahme: `EVV_QA_BROWSERS=chromium,webkit node scripts/verify-package.cjs /workspace/evv-rc2-download/EVV-QuickScout-V8-RC2.zip`.
