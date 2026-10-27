# EVV QuickScout V8 RC – Download

Hier liegt das unveränderte, bereits geprüfte Release-Paket. Quellbuild:
`60c3b51d293f2bcb71240d338af549ef50802f38`. Keine Änderung an Spiellogik,
Produktversion, main oder GitHub Pages; ausschließlich Bereitstellungsdateien.

Vollständige ZIP: **77.434 Byte**.
SHA-256: `015219a76d07fe09aec72d3f16920ae940f065cea1001810e9063bb5176db863`.
16 enthaltene Dateien, ZIP-CRC und alle 15 Manifestprüfsummen erneut geprüft.

## Ganzer Download

`EVV-QuickScout-V8-RC.zip` anklicken und auf GitHub **Download raw file** wählen.
Die ZIP nicht aus der Quelltextvorschau speichern. Alternativ den bereitgestellten
GitHub-Raw-Link verwenden. Danach im Terminal im Downloadordner:

```sh
shasum -a 256 -c EVV-QuickScout-V8-RC.zip.sha256
unzip -t EVV-QuickScout-V8-RC.zip
```

## Falls nur die kleinen Teile heruntergeladen werden können

Alle drei Dateien `.part-01`, `.part-02`, `.part-03` unverändert in denselben
Ordner herunterladen. Dazu `EVV-QuickScout-V8-RC.parts.sha256` und
`EVV-QuickScout-V8-RC.zip.sha256` herunterladen. Terminal in diesem Ordner öffnen:

```sh
shasum -a 256 -c EVV-QuickScout-V8-RC.parts.sha256
cat EVV-QuickScout-V8-RC.zip.part-01 EVV-QuickScout-V8-RC.zip.part-02 EVV-QuickScout-V8-RC.zip.part-03 > EVV-QuickScout-V8-RC.zip
shasum -a 256 -c EVV-QuickScout-V8-RC.zip.sha256
unzip -t EVV-QuickScout-V8-RC.zip
```

Alle Prüfungen müssen OK melden. Die Teile sind rohe Dateistücke und lassen
sich erst nach dem Zusammensetzen entpacken. Niemals jeden Teil einzeln entpacken.

## Öffnen auf dem Mac / iPad

Vollständige ZIP entpacken, Terminal im entpackten Ordner öffnen und mit
installiertem Python 3 `python3 TEST_START.py --lan` ausführen. Die ausgegebenen
Mac-/WLAN-Adressen verwenden; Mac und iPad müssen im selben vertrauten WLAN sein.
Nur Testdaten verwenden. Dies ist kein produktives Deployment.
