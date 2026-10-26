# QA und Update-Schutz für QuickScout als Grundlage für V8.0

D0 ließ Rallyes ohne Punkt weiterlaufen, und gemeldete Liberos konnten regulär eingewechselt werden. Die Nachprüfung deckte außerdem ungewollte Libero-Aktivierung beim Update, einen ignorierten Libero-Ausschalter, Sprach-Undo in historischen Ansichten, einen veralteten Sprachannahme-Schritt, verwaiste Zielzonendialoge und Überschreiben unlesbarer lokaler Daten auf. Gezielte Regressionstests reproduzieren diese Fehler; die entsprechenden Pfade sind korrigiert. Historische Spielstände werden mit synthetischen, durch die echten Altversionen erzeugten Fixtures geprüft.

Basis ist `main` bei `f6b316b`, Version 7.19.0-k1-auto-mb. V7.9.2 (`d10c1b5`) ist dessen Vorfahr und enthalten. Kein Downgrade, kein Merge, kein Deployment und keine produktiven Spieldaten.

Neu: verbindliche AGENTS.md, Audit, QA-Playbook, eingefrorene Testabhängigkeiten und GitHub Actions. Die Tests führen die vollständige Spiellogik aus. Vorhandene Evidenz: 100 deterministische Quick-Matches mit 400 Sätzen und 19.990 Rallyes sowie 36 Touch-Browserfälle. Im Review wurden lokal gezielt 25 Node-Tests und 21 Browserfälle erfolgreich ausgeführt; die unveränderte 100-Match-Simulation wurde dabei nicht nochmals lokal gestartet. Reguläres CI umfasst jetzt 26 Node-Tests (inklusive Simulation) und 45 Browserfälle.

Grenzen: 100 Quick-Matches sind keine unabhängige vollständige Kontakt-/Spielerstatistik. Vollständige Importvalidierung, atomare Speicherung/Quota und Offline-Update-/Geräteabnahme bleiben Release-Aufgaben. Der PR ist eine QA-/Stabilisierungsgrundlage, kein stabiles V8.0-Hybrid-Release. Merge nur nach grünen aktuellen Checks und ausdrücklicher Freigabe.

Der kurze Reviewbericht steht in `docs/PR1_REVIEW.md`. Datenvertrag, Implementierungsschritte, Tap-Ziele und fehlende Hybrid-Testmatrix für die erst geplante Turnaround-Engine stehen in `docs/design/V8_HYBRID_TURNAROUND.md`.
