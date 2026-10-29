# evv-quickscout
EVV QuickScout - Volleyball Live Scouting

## V8-Release-Kandidat

Entwicklung auf `dev/v8-master-playbook`, keine produktive Freigabe.
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

## Master Playbook V8

[Abnahme](ABNAHME.md) · [46 Screenshots](docs/screenshots/master/README.md) · [geprüfter Test-Download](downloads/v8-master/README.md) · [Datenmodell und Grenzen](docs/V8_MASTER_SYSTEM.md).

Sechs geprüfte K1-Läufer, direkte Gegnerrollen, echte L1/L2-Ersetzungen, gemeinsame Boards und einzeln editierbare Pfeile. Matchplan und Analyse verwenden dokumentierte Ereignisse. `npm run verify:formations` prüft Seed, vervollständigte JSON und eingebettete Offline-Bibliothek.
