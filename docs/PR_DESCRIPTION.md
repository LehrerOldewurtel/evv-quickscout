# QA-Grundlage für V8.0: alle Rotationen, Matchsimulationen und belegte Fehlerkorrekturen

D0 ließ eine Rallye bisher ohne Punkt weiterlaufen; ein als Libero gemeldeter Feldspieler konnte regulär eingewechselt werden. Drei gezielte Änderungen schließen diese nachgewiesenen Fehler. Die Projektrotation und produktive Speicherstruktur bleiben erhalten.

Neu: verbindliche AGENTS.md, Repository-Audit, QA-Playbook, eingefrorene npm-Abhängigkeiten, Node-Tests für alle sechs Startrotationen, 100 deterministische Testmatches mit unabhängigem Spielstands-Oracle sowie 36 Playwright-Touchfälle. Touch-Aufwand und offene Probleme sind mit Rohbelegen im Testbericht dokumentiert. GitHub Actions führt die QA für Entwicklungsbranches und Pull Requests aus.

Validierung in der Cloud-Instanz: 17/17 Node-Tests und 36/36 Chromium-Browsertests bestanden. Historische Tests: 1/9 bestanden; veraltete Fragmente/Versionen und unvollständige Harnesses sind gesondert dokumentiert. Die 100 Matches prüfen Quick-Scoring, keine vollständige unabhängige Spielerstatistik. Native Hybrid-Verpackung, echte Geräte und Offline-/Import-Abnahme bleiben offen.

Kein Merge, kein Deployment, keine produktiven Spieldaten. V8.0 bleibt ein Entwicklungsziel.
