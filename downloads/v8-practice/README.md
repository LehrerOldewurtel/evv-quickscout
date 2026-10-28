# EVV QuickScout V8 · neuer Praxistest-Kandidat

[ZIP herunterladen](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-practice-fixes/downloads/v8-practice/EVV-QuickScout-V8-Praxistest.zip) · 102,306 Bytes · 17 Dateien.

SHA-256: `b63e9d5f071bdfcd6be8aa938ce2b030b7874b5135bfe2805ba51b50d376c66c`

1. Die ZIP in Downloads entpacken. Der neue Ordner heißt `EVV-QuickScout-V8-Praxistest`.
2. Diese ganze Zeile ins Terminal kopieren und Enter drücken:

```bash
python3 "$HOME/Downloads/EVV-QuickScout-V8-Praxistest/TEST_START.py" --lan
```

3. Die ausgegebene **Mac:**-Adresse in Chrome öffnen. Terminal geöffnet lassen.
   Auf dem iPad die ausgegebene WLAN-Adresse im selben vertrauten WLAN öffnen.
   Falls noch die alte Testversion läuft: dort Ctrl+C drücken oder `--port 18765` ergänzen.

Nur synthetische Testspiele anlegen. Produktion bleibt unverändert.

[Prüfbericht](https://github.com/LehrerOldewurtel/evv-quickscout/blob/dev/v8-practice-fixes/docs/PRACTICE_FIXES_REPORT.md) ·
[Screenshots](https://github.com/LehrerOldewurtel/evv-quickscout/blob/dev/v8-practice-fixes/docs/screenshots/practice/README.md) ·
[Paketprüfung](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-practice-fixes/downloads/v8-practice/EVV-QuickScout-V8-Praxistest.verification.json)

Falls der vollständige Download erneut scheitert, die Teile einzeln herunterladen:

- [Teil 1](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-practice-fixes/downloads/v8-practice/EVV-QuickScout-V8-Praxistest.zip.part-01)
- [Teil 2](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-practice-fixes/downloads/v8-practice/EVV-QuickScout-V8-Praxistest.zip.part-02)
- [Teil 3](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-practice-fixes/downloads/v8-practice/EVV-QuickScout-V8-Praxistest.zip.part-03)
- [Teil 4](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-practice-fixes/downloads/v8-practice/EVV-QuickScout-V8-Praxistest.zip.part-04)

Alle Teile in denselben Downloads-Ordner legen. Auf dem Mac zusammensetzen:

```bash
cd "$HOME/Downloads"
cat EVV-QuickScout-V8-Praxistest.zip.part-* > EVV-QuickScout-V8-Praxistest.zip
shasum -a 256 EVV-QuickScout-V8-Praxistest.zip
```

Die Prüfsumme muss dem oben angegebenen SHA-256 entsprechen. Danach ZIP entpacken.
Die Teilstücke wurden vor Lieferung bytegenau zum Original zusammengesetzt.
Die Testpaket-Datei ist kein Deployment der produktiven Webseite.
