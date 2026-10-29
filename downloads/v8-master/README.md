# EVV QuickScout V8 · Master Playbook RC

[ZIP herunterladen](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-master-playbook/downloads/v8-master/EVV-QuickScout-V8-Master.zip) · 163,105 Bytes · 24 Dateien.

SHA-256: `9b49de01385ff5ada37b14eec3382240e13702524e40786e372b4c530d48fa0d`

Sechs editierbare, geometrisch geprüfte K1-Läufer; ein gemeinsames Feld für beide Teams;
Gegnerrollen, echte L1/L2-Ersetzungen, einzeln editierbare Pfeile, vier Abwehrsysteme,
Analyse, Matchplan sowie Punktestand- und Mitte-Pacer. V8 ist ein Entwicklungskandidat.

1. Das neue ZIP vollständig in Downloads entpacken. Ordner: `EVV-QuickScout-V8-Master`.
2. Diese **ganze Zeile** ins Terminal kopieren:

```sh
python3 "$HOME/Downloads/EVV-QuickScout-V8-Master/TEST_START.py" --lan --port 18768
```

3. Die vom Programm ausgegebene **Mac:**-Adresse in Chrome/Safari öffnen.
   Terminal geöffnet lassen. Auf dem iPad die ausgegebene WLAN-Adresse im selben
   vertrauten WLAN öffnen. Die Cloud-Umgebung selbst hat keine öffentliche Test-URL.

Nur synthetische Testspiele. Getrennter Test-Origin, Testablage und Cache;
keine echten Backups importieren. Mac und iPad speichern unabhängig.
WLAN-HTTP garantiert keine iPad-Offline-/Mikrofonfunktion. Physische Apple-Geräteabnahme offen.
Kein Merge und keine Veröffentlichung auf der produktiven Website.

[Abnahme](../../ABNAHME.md) · [46 Screenshots](../../docs/screenshots/master/README.md) ·
[System/Migration](../../docs/V8_MASTER_SYSTEM.md) ·
[Paketprüfung](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-master-playbook/downloads/v8-master/EVV-QuickScout-V8-Master.verification.json) ·
[Downloadprüfung](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-master-playbook/downloads/v8-master/DOWNLOAD_VERIFIED.json)

Falls der vollständige Download scheitert: alle folgenden Teile einzeln in Downloads speichern.

- [Teil 1](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-master-playbook/downloads/v8-master/EVV-QuickScout-V8-Master.zip.part-01)
- [Teil 2](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-master-playbook/downloads/v8-master/EVV-QuickScout-V8-Master.zip.part-02)
- [Teil 3](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-master-playbook/downloads/v8-master/EVV-QuickScout-V8-Master.zip.part-03)
- [Teil 4](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-master-playbook/downloads/v8-master/EVV-QuickScout-V8-Master.zip.part-04)
- [Teil 5](https://github.com/LehrerOldewurtel/evv-quickscout/raw/refs/heads/dev/v8-master-playbook/downloads/v8-master/EVV-QuickScout-V8-Master.zip.part-05)

Auf dem Mac zusammensetzen (alle Teile genau einmal, keine Duplikatdateien):

```sh
cd "$HOME/Downloads"
cat EVV-QuickScout-V8-Master.zip.part-* > EVV-QuickScout-V8-Master.zip
shasum -a 256 EVV-QuickScout-V8-Master.zip
```

Die Prüfsumme muss dem oben angegebenen SHA-256 entsprechen. Erst dann entpacken.
Alle Teile werden bei der Bereitstellung erneut heruntergeladen, zusammengesetzt und
mit dem tatsächlich gestarteten Paket bytegenau verglichen.
`main` und die produktive GitHub-Pages-Version bleiben unverändert.
