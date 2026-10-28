# EVV QuickScout V8 · vier gemeinsame Abwehrsysteme

[ZIP herunterladen](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-practice-fixes/downloads/v8-defense/EVV-QuickScout-V8-Abwehr.zip) · 110,857 Bytes · 18 Dateien.

SHA-256: `be61f3ca0b3a8104b64a516a48472c6a3cd639fc0ed8c816d1bba6eb1f784867`

Vier Systeme: ABWEHR IV, II, III (Einerblock), HINTERFELD I.
Gemeinsame Bibliothek für alle sechs Rotationen; individuelle Bilder haben Vorrang.
Rollenbasierte Standardzuordnung, unveränderte Regelpositionen und Match-Engine.

1. ZIP in Downloads entpacken. Der neue Ordner heißt `EVV-QuickScout-V8-Abwehr`.
2. Diese ganze Zeile ins Terminal kopieren:

```bash
python3 "$HOME/Downloads/EVV-QuickScout-V8-Abwehr/TEST_START.py" --lan --port 18766
```

3. Die ausgegebene **Mac:**-Adresse in Chrome öffnen. Terminal geöffnet lassen.
   Auf dem iPad die ausgegebene WLAN-Adresse im selben vertrauten WLAN öffnen.

Im Editor vor der Bearbeitung **EVV-Standard · alle Rotationen** wählen und einmal
speichern. Vorhandene Rotationsanpassungen bleiben bestehen. Zum bewussten Ablösen
**EVV-Standard verwenden** wählen. Nur synthetische Testspiele anlegen.

Die erwähnten sechs Referenzabbildungen waren hier nicht als lesbare Dateien
verfügbar. Die Aufgaben folgen den schriftlichen Vorgaben, konkrete Koordinaten
bleiben editierbare Vorschlagswerte. Echte Apple-Geräteabnahme steht noch aus.

[Prüfbericht](https://github.com/LehrerOldewurtel/evv-quickscout/blob/dev/v8-practice-fixes/docs/DEFENSE_REPORT.md) · [Modell/Koordinaten](https://github.com/LehrerOldewurtel/evv-quickscout/blob/dev/v8-practice-fixes/docs/DEFENSE_SYSTEM.md) ·
[36 Screenshots](https://github.com/LehrerOldewurtel/evv-quickscout/blob/dev/v8-practice-fixes/docs/screenshots/defense/README.md) ·
[Paketprüfung](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-practice-fixes/downloads/v8-defense/EVV-QuickScout-V8-Abwehr.verification.json)

Falls der vollständige Download scheitert: alle Teilstücke einzeln in Downloads speichern.

- [Teil 1](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-practice-fixes/downloads/v8-defense/EVV-QuickScout-V8-Abwehr.zip.part-01)
- [Teil 2](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-practice-fixes/downloads/v8-defense/EVV-QuickScout-V8-Abwehr.zip.part-02)
- [Teil 3](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-practice-fixes/downloads/v8-defense/EVV-QuickScout-V8-Abwehr.zip.part-03)
- [Teil 4](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-practice-fixes/downloads/v8-defense/EVV-QuickScout-V8-Abwehr.zip.part-04)

Auf dem Mac zusammensetzen:

```bash
cd "$HOME/Downloads"
cat EVV-QuickScout-V8-Abwehr.zip.part-* > EVV-QuickScout-V8-Abwehr.zip
shasum -a 256 EVV-QuickScout-V8-Abwehr.zip
```

Die Prüfsumme muss dem oben angegebenen SHA-256 entsprechen. Danach ZIP entpacken.
Die Teilstücke wurden bytegenau zum Original zusammengesetzt.

Kein Merge und keine Veröffentlichung auf der produktiven Webseite.
