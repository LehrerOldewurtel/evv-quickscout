# V8 Master Playbook: durchgängiges Trainer-Cockpit

Bisher fehlten nutzbare K1-Läufer und stabile Gegner-/Libero-Zuordnungen; taktische Vorschauen und tatsächliche Ersetzungen konnten auseinanderlaufen, weitere Pfeile überschrieben bestehende Routen. Der Kandidat verwendet nun eine gemeinsame Boardsicht, tatsächliche Spieleridentitäten und getrennte Regel-/Ausgangs-/Taktikebenen. Einmal bestätigte Startsechsen erzeugen alle sechs Läufer; Teamstandards bleiben neben Rotationsausnahmen erhalten.

Enthalten: vervollständigte Seed-Bibliothek, Gegnerrollen/Nummern/Wechsel, reale L1/L2-Historien beider Teams, fünf gleichzeitig editierbare Pfeile, vier K2-Systeme, Zuspiel-/Dankeballanalyse, Matchplan/Punktestand- und Mitte-Pacer sowie einheitliche Dark-Glass-Oberfläche mit fünf Lucide-Zugängen. Altbestände und historische Kontaktzuordnungen bleiben erhalten.

Validierung am Quellstand `eaac8beb3cb21dde181ae557f4b653618aad91de`: 221 Node-, 174 Chromium- und 116 zusätzliche WebKit-Tests grün; keine Fehler, übersprungenen oder flaky Fälle. 100 detaillierte Matches mit 17213 Rallyes; Kontakt-/Score-Digests identisch zum vorigen Kandidaten. Transition → Spieler → Kill benötigt drei Eingaben. Maus, CDP-Touch, Reload/Export/Import und Offline geprüft.

[Abnahme](https://github.com/LehrerOldewurtel/evv-quickscout/blob/dev/v8-master-playbook/ABNAHME.md) · [46 Screenshots](https://github.com/LehrerOldewurtel/evv-quickscout/blob/dev/v8-master-playbook/docs/screenshots/master/README.md) · [Ursachen/Migration](https://github.com/LehrerOldewurtel/evv-quickscout/blob/dev/v8-master-playbook/docs/V8_MASTER_SYSTEM.md) · [Test-Download](https://github.com/LehrerOldewurtel/evv-quickscout/blob/dev/v8-master-playbook/downloads/v8-master/README.md).

Keine physische Apple-Geräteabnahme, keine exakte Bildrekonstruktion, keine stabile V8-/Native-Freigabe. Produktversion, `main` und GitHub Pages bleiben unverändert. Ausschließlich synthetische Testdaten. Draft zur Review; kein Merge/Deployment ohne ausdrückliche Freigabe.
