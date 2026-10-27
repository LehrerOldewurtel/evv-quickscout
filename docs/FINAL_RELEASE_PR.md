Der bisherige Kandidat prüfte nur 20 detaillierte Matches und akzeptierte beschädigte Inhalte innerhalb der Undo-Historie. Dieser Release-Branch enthält alle vier V8-Entwicklungsstände, validiert Undo-Snapshots vor Import/Reload und liefert ein reproduzierbares, isoliertes Testpaket für die manuelle Abnahme. main, GitHub Pages und die Produktversionskennung bleiben unverändert.

- 100 detaillierte synthetische Matches mit unabhängigem Sollmodell nach jeder Rallye, beiden Matchsiegern, langen Sätzen, Wechseln, Undo und Wiederaufnahme; Replays stimmen in allen 100 Plan-Digests überein.
- 149 Node-Tests und 76 Chromium-Browsertests bestanden; keine übersprungenen oder flaky aktuellen Tests. Neue Import-/Touch-Regressionen, Ass-Grenze auf eine Eingabe verschärft.
- Der erste erweiterte Lauf überschritt den Node-Heap durch zurückgehaltene JSDOM-Kontexte. Ein Event-Loop-Wechsel nach geschlossenen Testmatches behebt die Infrastrukturursache ohne erhöhtes Heap-Limit oder gelockerte Assertions.
- ZIP-Builder mit QA-/Asset-Hash-Gate, Prüfsummenmanifest, Mac-/WLAN-Teststarter und echter Entpack-/Browserprüfung; CI prüft auch release/** und erstellt verifizierte Testartefakte, ohne Deployment.

Details und Nachweise: docs/FINAL_RELEASE_REPORT.md sowie docs/qa/final/. Acht alte inkompatible Skripte bleiben nachvollziehbar archiviert und getrennt von der grünen aktuellen Regression. Echte Apple-Geräte, WebKit/Firefox und HTTPS-Offlinebetrieb auf dem iPad sind noch abzunehmen. Freigabe nur zur kontrollierten manuellen Abnahme, kein Merge/Deployment ohne ausdrückliche Zustimmung.
