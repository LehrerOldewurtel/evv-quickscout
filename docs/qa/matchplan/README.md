# Tatsächliche Prüfungen · Matchplan

Finale App-Assets: `webkit-assets.json` und `qa-run.json`. Beide Engine-Läufe
müssen dieselben sieben Dateihashes enthalten. Aktuelle Zahlen und Zeiten stehen
in `release-candidate.json` und `webkit-focused.json`, zusammengefasst im
[MATCHPLAN_REPORT](../../MATCHPLAN_REPORT.md).

Ausgeführt:

```sh
npm ci --ignore-scripts --cache /workspace/.npm-cache
node scripts/release-qa.cjs
```

Der zweite Befehl führt `npm test` und `npm run test:e2e` vollständig aus und
schreibt Rohdaten vor der Reporterstellung neu. Node enthält die 100 detaillierten
Matches mit unabhängigem Sollmodell; `digest-comparison.json` vergleicht die
unveränderten Sollkontaktketten mit dem letzten Abwehrkandidaten. Jede tatsächliche
Kontaktkette wird während der Simulation mit diesem Sollmodell abgeglichen.

Zusätzlich tatsächlich ausgeführt (Linux-WebKit mit geprüften lokalen Bibliotheken):

```sh
PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright \
XDG_CACHE_HOME=/workspace/.cache \
EVV_BROWSER_LIBS=/workspace/.evv-webkit-libs/usr/lib/x86_64-linux-gnu \
npx playwright test --config /tmp/evv-matchplan-webkit.config.cjs \
  matchplan.spec.cjs defense.spec.cjs practice-fixes.spec.cjs cockpit.spec.cjs \
  practice.spec.cjs release.spec.cjs hybrid.spec.cjs matchday.spec.cjs \
  --grep-invert 'Echter Chromium-Neustart'
```

Die Konfiguration übernimmt `playwright.webkit.config.cjs`; allein Loopback-Port
4191, separates Ausgabeverzeichnis und Reporterpfad sind für gleichzeitige Läufe
angepasst. Der ausgeschlossene Fall erfordert Chromiums CDP und ist Bestandteil
des vollständigen Chromium-Laufs. Nicht alle Chromium-Dateien gehören zur
WebKit-Auswahl. Keine physischen Apple-Geräte wurden getestet.

Vorher-Belege: `before-unit.tap`, `before-browser.log`, `overflow-before.txt`.
Gezielte Zwischenprüfungen stehen in `focused-*` und `overflow-after.log` und
werden nicht zur finalen Anzahl addiert. Ein unvollständiger Node-/Chromium-Lauf
und ein unvollständiger WebKit-Lauf wurden vor der finalen Textumbruchkorrektur
beendet; sie sind keine Erfolgsevidenz. Abschließende Paketprüfung prüft das echte
entpackte ZIP zusätzlich; ihr Bericht liegt direkt beim Download.
