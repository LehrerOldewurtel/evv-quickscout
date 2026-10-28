# evv-quickscout
EVV QuickScout - Volleyball Live Scouting

## V8-Release-Kandidat

Entwicklung auf `release/v8-final-candidate`, keine produktive Freigabe.
Die Produktversionskennung bleibt bis zur Geräteabnahme unverändert.

```sh
npm ci --ignore-scripts
npm start
```

`npm run qa:release` führt die aktuelle vollständige Regression aus, darunter
100 detaillierte synthetische Matches. Danach erstellen
`python3 scripts/package_release.py` und `node scripts/verify-package.cjs`
das ZIP und prüfen seinen tatsächlichen Inhalt im Browser.

Abnahme, Zählwerte und Einschränkungen: [finaler Bericht](docs/FINAL_RELEASE_REPORT.md).
Das Paket enthält einen separaten Mac-/WLAN-Teststarter und eine Anleitung.
Keine echten Spieldaten verwenden; kein Merge oder Deployment ohne Freigabe.
