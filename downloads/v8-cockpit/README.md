# EVV QuickScout V8 · Trainer-Cockpit-Testversion

Nur synthetische Spiele. Kein produktives Deployment.

**Datei:** EVV-QuickScout-V8-Cockpit.zip · 95789 Bytes.

**SHA-256:** `46f377dcd68ab8795f642e0f221e27b41a222669af0fab1b44fa0eb32328623a`

ZIP vollständig in einen neuen Ordner entpacken. Terminal beim enthaltenen
TEST_START.py öffnen und `python3 TEST_START.py --lan` starten (Python 3 erforderlich).
Die ausgegebene Mac-Adresse in Chrome/Safari öffnen, die WLAN-Adresse am iPad
im selben vertrauten WLAN. Terminal geöffnet lassen; Ctrl+C beendet den Server.
Die Testversion hat eigene Matchdaten, Präferenzen und Caches.

ANLEITUNG.txt im ZIP bzw. START.txt beschreibt den iPad-Praxistest.
Screenshots: ../../docs/screenshots/cockpit/README.md. Vollständiger Prüfbericht:
PRUEFBERICHT.md. main, GitHub Pages und bisherige Release-Pakete bleiben unverändert.

Falls der Download des ganzen ZIP scheitert, alle drei .part-Dateien in denselben
Mac-Ordner laden und im Terminal dort zusammensetzen:

```bash
cat EVV-QuickScout-V8-Cockpit.zip.part-01 EVV-QuickScout-V8-Cockpit.zip.part-02 EVV-QuickScout-V8-Cockpit.zip.part-03 > EVV-QuickScout-V8-Cockpit.zip
shasum -a 256 EVV-QuickScout-V8-Cockpit.zip
unzip -t EVV-QuickScout-V8-Cockpit.zip
```

Die Prüfsumme muss dem oben angegebenen Wert entsprechen. Alle Teile wurden
bereits wieder zusammengesetzt und bytegenau mit dem vollständig browsergeprüften
Paket verglichen. Das .verification.json-Protokoll bestätigt acht gestartete
Chromium-/WebKit-Kontexte einschließlich Offline-Wiederherstellung.
