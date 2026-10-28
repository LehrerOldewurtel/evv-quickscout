Live-Trainerentscheidungen waren auf lange Coachingtexte, mehrere Filter und direkt bearbeitbare Skizzen verteilt. Das neue Cockpit zeigt sechs Hauptkennzahlen mit Zähler/Nenner, eine phasengetrennte Rotationsampel und ein gesperrtes Zwei-Team-Taktikfeld mit direktem K1-/K2-Aufruf. Die bestehende Scouting-, Wechsel- und Turnaround-Engine bleibt maßgeblich.

- LIVE / MATCH / ROTATIONEN; optionale Detailfilter und maximal drei kurze Hinweise. Die Rotationskarte übernimmt Zeitraum/Filter und führt gezielt zur passenden Taktik.
- Konfigurierbare Mindeststichprobe, Leistungsprofile/Grenzen und deterministische Ampel-Hysterese. Keine Vermischung von K1 und K2, keine erfundenen Kontakte.
- Getrennter Spielbetrieb und Trainer-Editor; vorhandene Formationsbibliothek einschließlich optionaler Angriffsrouten, Kopie und Reset. Aktuelle Spielerwechsel/Libero sowie ausdrücklich konfigurierte Gegnerrotation und Trikotnummern.
- Hell/Dunkel/System, kompakte Touch-/Mausbedienung und getrennte Testdaten/Präferenzen/Caches. Keine Produktversionsanhebung.

Validierung: 163 Node-Tests, 112 Chromium-Tests und 56 WebKit-Tests bestanden, ohne Fehler/Skips/Flaky-Fälle. 100 detaillierte synthetische Matches mit unabhängigem Oracle (400 Sätze, 17.213 Rallyes, 271.405 Kontakte); 100/100 Plandigests identisch zur RC2-Referenz. Zusätzlich 100 Quick-Matches und sechs vollständige Browser-UI-Matches einschließlich Wechsel, Undo, Satzwechsel, Export/Import und Reload.

Acht echte Layout-/Kontrast-Kontexte bestanden; 68 Screenshots und 16 Vorher-/Nachher-Vergleiche liegen unter docs/screenshots/cockpit. Firefoxs unabhängiger Kontrollstart scheiterte an der Host-Sandbox; keine Firefox-App-Tests als bestanden gewertet. Echte Apple-Geräte/Mikrofon/Pencil und WLAN-HTTPS-Offlineabnahme bleiben manuell.

Testpaket: downloads/v8-cockpit/EVV-QuickScout-V8-Cockpit.zip; entpacken und python3 TEST_START.py --lan starten. Paketabnahme und ZIP-SHA256 stehen daneben. Screenshots: docs/screenshots/cockpit/README.md. Definitionen und Ergebnisbericht: docs/COCKPIT_DESIGN.md und docs/COCKPIT_REPORT.md.

Review gegen release/v8-final-candidate. Kein Merge, kein produktives Deployment und keine Änderung an main/GitHub Pages ohne ausdrückliche Freigabe. Lokale Testevidenz ist keine behauptete Remote-CI-Abnahme.
