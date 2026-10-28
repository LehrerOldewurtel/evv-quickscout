# EVV QuickScout V8 · Matchplan & Live-Pacer

[ZIP herunterladen](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-matchplan-pacer/downloads/v8-matchplan/EVV-QuickScout-V8-Matchplan.zip) · 128,625 Bytes · 19 Dateien.

SHA-256: `4f9b2817f13d13815b7d0b0d34e06259766cc9e69dbb3ece3bb105f917e14ddf`

Erneuter GitHub-Download bestätigt: HTTP 200, bytegleich zum tatsächlich
gestarteten Paket. Alle vier Teilstücke wurden ebenfalls heruntergeladen und
bytegleich zusammengesetzt. [Download-Prüfprotokoll](DOWNLOAD_VERIFIED.json).

Editierbare Trainerziele/Vorlagen, Pacer, Zuspieler-Cockpit und Dankeball-Verwertung.
Bestehende Erfassung, Statistiken und vier Abwehrsysteme bleiben erhalten.

1. ZIP vollständig in Downloads entpacken. Neuer Ordner: `EVV-QuickScout-V8-Matchplan`.
2. Diese ganze Zeile ins Terminal kopieren:

```sh
python3 "$HOME/Downloads/EVV-QuickScout-V8-Matchplan/TEST_START.py" --lan --port 18767
```

3. Die ausgegebene **Mac:**-Adresse im Browser öffnen. Terminal geöffnet lassen.
   Auf dem iPad die ausgegebene WLAN-Adresse im selben vertrauten WLAN öffnen.

PACER im Live-Kopf öffnet den Matchplan. Im Coach-Tab stehen sechs Direktzugänge.
Mehr → Dankeball markiert ausschließlich eine tatsächlich beobachtete Chance.
Mehr → Zuspiel-Kontext ist optional. Fehlende Altangaben werden nicht geraten.
Nur synthetische Testspiele verwenden; Mac und iPad speichern unabhängig.
Echte Apple-Geräteabnahme steht noch aus. Keine produktive Veröffentlichung.

[Prüfbericht](../../docs/MATCHPLAN_REPORT.md) · [Ereignisdefinitionen](../../docs/MATCHPLAN_SYSTEM.md) ·
[32 Screenshots](../../docs/screenshots/matchplan/README.md) ·
[Paketprüfung](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-matchplan-pacer/downloads/v8-matchplan/EVV-QuickScout-V8-Matchplan.verification.json)

Falls der vollständige Download scheitert: alle Teilstücke einzeln in Downloads speichern.

- [Teil 1](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-matchplan-pacer/downloads/v8-matchplan/EVV-QuickScout-V8-Matchplan.zip.part-01)
- [Teil 2](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-matchplan-pacer/downloads/v8-matchplan/EVV-QuickScout-V8-Matchplan.zip.part-02)
- [Teil 3](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-matchplan-pacer/downloads/v8-matchplan/EVV-QuickScout-V8-Matchplan.zip.part-03)
- [Teil 4](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-matchplan-pacer/downloads/v8-matchplan/EVV-QuickScout-V8-Matchplan.zip.part-04)

Auf dem Mac zusammensetzen:

```sh
cd "$HOME/Downloads"
cat EVV-QuickScout-V8-Matchplan.zip.part-* > EVV-QuickScout-V8-Matchplan.zip
shasum -a 256 EVV-QuickScout-V8-Matchplan.zip
```

Die Prüfsumme muss dem oben angegebenen SHA-256 entsprechen. Danach entpacken.
Alle Teilstücke wurden bytegenau zum Original zusammengesetzt und geprüft.
`main` und produktive GitHub-Pages-Webseite bleiben unverändert.
