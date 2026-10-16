# QuickScout VIP 7.9.4 – Release Candidate

## Umgesetzt in dieser Iteration
- iPhone-/iPad-Layout verbessert, Export und neuer JSON-Import mit Schema-, Größen- und Grundstrukturprüfung.
- Gegneraktionen nach erfasster Spielernummer aggregiert (Annahme, Angriff, Aufschlag), ohne nicht erfasste Werte zu erfinden.
- Rallye-Verlauf in 5er-Fenstern für Coach und Statistik.
- Taktiktafel: Grundordnung und editierbare Block-/Abwehr-Skizze; bewusst **keine** behauptete automatische Regelprüfung.
- Annahmevorlage AA1+AA2+Libero (wenn aktiv), sonst AA1+AA2+D. Pro Rotation frei editierbar; Michael kann über individuelle Annahmeplanung herausgenommen werden.
- Regressionstest für Versionsnummer auf 7.9.4 angepasst.

## Testdurchlauf (Node, keine echte Safari-Emulation)
- TEST_PAKET_1_2.js: 13/13
- tests/test_regression_core.js: 9/9
- TEST_V792_ROLLEN.js: bestanden
- TEST_WECHSEL_V791.js: bestanden
- tests/test_vip_794.js: bestanden
- node --check app.js: bestanden

## Nicht als abgeschlossen nachgewiesen
- Vollständig symmetrisches Gegner-Live-Scouting aller Aktionen und Positionen; Gegneranalyse basiert weiterhin auf den tatsächlich im Ablauf erfassten Aktionen.
- Regelgeprüfte Annahme-Startstellungen, Animation aller sechs Rotationen und automatisierte Laufwege.
- Regelkonforme Verwaltung von zwei Libero-Einsatzwechseln über vollständige Matches.
- Browser-End-to-End-Tests in echtem iOS Safari/iPadOS, Sprachbefehle mit Mikrofon und Service-Worker-Update nach Installation.
- Vollständige Matchsimulation inklusive Satz 5 und Import-Roundtrip im echten Browser.

**Freigabe:** Release Candidate / Testversion. Noch keine produktiv vollständig abgenommene Release-Version. Bestehende Spielstände vorher exportieren und neue Version separat testen.
