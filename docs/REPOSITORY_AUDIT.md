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

## Folgeaudit Auftrag 5 (26.10.2026)

Die obigen Angaben beschreiben den ursprünglichen main-Bestand. Aktuelle Grundlage ist `dev/v8-tactics-reliability` bei `b01e62562eabc8de3159705b679165cb3fa396df`; neuer Folgebranch `dev/v8-matchday-rehearsal`.

| PR | Head | Base | bei Prüfung |
|---|---|---|---|
| #1 | dev/v8-qa-foundation · 935905e | main | offen, beide QA-Checks erfolgreich |
| #2 | dev/v8-hybrid-live · 72caf77 | dev/v8-qa-foundation | offen, beide QA-Checks erfolgreich |
| #3 | dev/v8-tactics-reliability · b01e625 | dev/v8-hybrid-live | offen, beide QA-Checks erfolgreich |

Die Abstammung wurde mit `git merge-base --is-ancestor` bestätigt. V7.9.0 (`7269d1e`) wurde durch V7.9.2 (`d10c1b5`) abgelöst; auch V7.9.2 liegt in der Historie des heutigen 7.19.0-Stands. Alle drei PRs sind enthalten; kein Zurücksetzen auf 7.9.2. Remote-main ist unverändert `f6b316bfbbcf30d4758fc954ef006bff59a1fc9e`. Kein Merge, kein Deployment, kein Versionsbump. Der Folge-PR muss gegen PR3s Branch geprüft werden; ein späteres Zusammenführen benötigt die richtige Reihenfolge und ausdrückliche Freigabe.

Die bestehende Hybrid-/Taktik-/Speicherimplementierung und alle bisherigen Verhaltenstests bleiben erhalten. Änderungen an App-Code beschränken sich auf nachgewiesene Fehler und den beauftragten Sprung von der Analyse in den Formationseditor. Cache-Lebenszyklus wird inzwischen in einem realen Chromium-Service-Worker geprüft; die historischen SW-Risiken oben gelten damit nicht unverändert fort. Die acht alten Skripte sind als unverändertes Archiv mit reproduzierbarem Audit und Ersatztests dokumentiert. Aktuelle Ergebnisse und Grenzen: `RELEASE_CANDIDATE_REPORT.md`.
