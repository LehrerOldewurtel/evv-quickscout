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
