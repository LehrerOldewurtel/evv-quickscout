# Repository-Audit · 26.10.2026

Basis: `main` bei `f6b316bfbbcf30d4758fc954ef006bff59a1fc9e`. Ausgangscheckout ohne lokale Änderungen. Entwicklung ausschließlich auf `dev/v8-qa-foundation`.

## Bestand und Architektur

Alle 55 Ausgangsdateien sind mit Größe und SHA256 unter `qa/baseline-inventory.json` erfasst. Geprüft wurden die vier JavaScript-Dateien der App (einschließlich Versions-/Cache-/UI-Dateien), HTML, CSS, Manifest, vier JavaScript-Testskripte, fünf Python-Looptests sowie vorhandene README-, Release- und Testdokumente. Das PDF enthält Spieltags-/Trainingsvorlagen, keine zusätzliche Software.

- `app.js`: 778 Zeilen, rund 90 KB, große IIFE mit DOM-Rendering, Spielzustand, Aktionen, Statistiken, Wechseln, Sprache, Import/Export und taktischen Skizzen. Bereits vorhandene `EVV_QS_TEST`-Schnittstelle.
- `index.html`: statischer Einstieg, Setup und Spielbedienung; `styles.css`: gewachsene Folge von UI-/Responsive-Overrides. `compact.js`: Aufstellungs-/Aktionsmenü auf schmalen Ansichten.
- `version.js`: `7.19.0-k1-auto-mb`; App-Fallback identisch. HTML-Assetparameter und SW-Registrierung noch `7180`; Manifestname noch V7.7; Service-Worker-Fallback 7.9.0. Dokumentation umfasst V6 bis V7.18, mehrfach widersprüchliche Rotationsangaben.
- `sw.js`: Network-first-Cache, Core-Liste ohne `compact.js` und Manifest. Aktivierung löscht alle anders benannten Caches dieses Origins. Offline-/Update-Verhalten benötigt eine separate Abnahme.
- Daten ausschließlich im Browser-localStorage `evvQuickScoutV77`; Export-Schema `EVV-QuickScout-1`. Kein Backend, keine Cloud-Datenbank, kein nativer Hybrid-Container, kein Paketmanifest/Lockfile/CI im Ausgangsstand.
- Zwei Satzvorbereitungsimplementierungen (`nextSetPrep` und `prepareNextSet`); der aktuelle UI-Pfad nutzt `prepareNextSet`. Keine Bereinigung ohne gezielten Fehlernachweis vorgenommen.

## Historische Tests tatsächlich ausgeführt

`qa/legacy-results.json` enthält Exitcodes und Ausgaben aller neun vorhandenen Skripte. Ein Skript bestand (`TEST_V792_ROLLEN.js`), acht scheiterten. Das sind keine acht nachgewiesenen Anwendungsfehler:

- Fünf Python-Looptests suchen überwiegend feste Quelltextfragmente und/oder alte Versionen.
- `TEST_PAKET_1_2.js`: 12/13 interne Checks bestanden, feste Version 7.9.4 scheitert.
- `TEST_SATZWECHSEL.js`: unvollständiger Harness (`lineupEditor` fehlt).
- `TEST_WECHSEL_V791.js`: unvollständiger Harness (`syncLiberoRotation` fehlt).

Die Legacy-Dateien bleiben als historische Evidenz unverändert. Das neue QA-System lädt die vollständige App und prüft Verhalten. Historische PASS-Berichte wurden nicht als aktuelle Testergebnisse übernommen.

## Nachgewiesene und korrigierte Fehler

1. EVV- und Gegner-D0 führten zum zweiten Ball statt zum Punkt für die andere Mannschaft. Regression zuerst fehlgeschlagen; beide Action-Zweige beenden jetzt atomar die Rallye.
2. Ein im Libero-Dialog gemeldeter Spieler mit ursprünglicher Feldspielerrolle konnte regulär eingewechselt werden. Wechselvalidierung prüft jetzt zusätzlich die aktuelle Libero-Meldung.

Die Rotationstests R1–R6 bestanden bereits vor diesen Korrekturen. Die Projektrotation wurde nicht geändert. Produktive Spielstände und das Speicherformat wurden nicht verändert.

## Offener Bedarf

V8.0 benötigt weiterhin eine Entscheidung und Implementierung für den nativen Hybrid-Container, echte Geräteabnahme, vollständige Import-/Migrations-/Sicherheitsprüfungen und einen Offline-/Cache-Update-Test. Die Versionsabweichungen sind dokumentiert; ein pauschales Umbenennen in „V8.0 stabil“ wäre nicht durch Tests gedeckt. Siehe Testbericht und QA-Playbook für genaue Nachweisgrenzen.

## Review-Nachtrag

Die Überprüfung des ersten PR steht in `PR1_REVIEW.md`, mit Versionsnachweis ab V7.9.2, gezielten Update-/Sprach-/Libero-/Speicherfehlerkorrekturen und Abgrenzung der bestehenden Chain zur erst geplanten Turnaround-Engine. Das ursprüngliche Audit und seine Rohbelege bleiben als Ausgangsbefund erhalten.
