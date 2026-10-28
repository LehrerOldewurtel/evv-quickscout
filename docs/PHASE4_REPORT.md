# Entwicklungsauftrag 4 – Abschlussbericht

Basis: `dev/v8-hybrid-live` bei `72caf77` (PR #2). Folgebranch: `dev/v8-tactics-reliability`. Kein Merge, kein Deployment, keine Änderung der Produktversionskennung. Alle Tests verwenden synthetische Daten.

## Funktionen

**Interaktive Taktiktafel:** Unter „Taktik“: SVG-Feld mit korrektem Verhältnis 9 × 18 m, Netz und 3-m-Linien. Sechs Spieler einschließlich aktuell aktivem Libero. Finger-/Pointer-Drag, Spieler-Laufwege als blaue Pfeile und Ballwege als rote Pfeile. Annahme und Abwehr IV/III/II je R1–R6 speichern, laden, kopieren, bearbeiten und zurücksetzen. Zurücksetzen wird erst mit Speichern dauerhaft. Taktische Ziele werden nach Regel-Slot gespeichert, damit ein Libero-/Spielerwechsel die Formation nicht verliert. Regelaufstellung und Rotation bleiben unabhängig und unverändert. Bisherige `hybridFormations` bleiben erhalten und werden für den Editor übernommen, soweit eine passende Spielerzuordnung vorhanden ist.

**Satzassistent:** Im bestehenden Satzdialog kann die letzte Aufstellung übernommen oder eine gespeicherte Startvorlage ausgewählt werden. Die aktuelle Aufstellung lässt sich als Vorlage speichern. Alle sechs Spieler und Rollen bleiben vor dem Start editierbar. Libero-Konfiguration kann übernommen oder bewusst deaktiviert werden. Auswahl und Abbrechen ändern die Regelaufstellung nicht; erst die K1-/K2-Starttaste bestätigt. Annahme-/Abwehrbibliothek bleibt über Satz- und Spielwechsel erhalten; die aktuelle Rotation und gegnerische Angriffsrichtung bestimmen die automatisch geladene Formation. Ohne erfasste Angriffsrichtung ist IV die Vorgabe, keine behauptete Gegnerbeobachtung.

**Turnaround-Auswertung:** „Analyse“ zeigt Angriffe bis Kill, First-Attack-Kill-Quote, Kill bis zum zweiten/dritten Angriff, Transition-Chancen, Transition-Kill-/Punktquote, Chancen ohne Angriff und Mehrfach-Transition-Rallyes. Eigene Kills, Blockpunkte und Gegnerfehler werden getrennt ausgewiesen. Filter nach Satz, Rotation und K1/K2; Coaching-Hinweise erst ab fünf vollständig beobachteten Rallyes, sonst Stichprobenhinweis.

**Speicherung:** Schema 2 ergänzt laufenden Entwurf, Entwurfs-Undo, offene Zielzonenwahl und Modus/Ansicht. Bestehender Speicherkey und Export-Schema bleiben erhalten; alte gültige Spielstände werden additiv geladen, unbekannte Speicherversionen blockiert. Wiederaufnahme nach Reload oder in neuem Browserkontext. Offline-Core enthält alle App-Dateien; Cache-Fallback berücksichtigt Asset-Queryparameter, löscht keine fremden Cache-Namensräume und liefert HTML nur als Navigationsfallback. Fehlgeschlagene Core-Installation wird nicht mehr als Erfolg verschluckt.

**Import-/Fehlerschutz:** Validierung vor Änderung des Spielzustands und vor Bestätigung: Aufstellung, Rollen, Spieler, Punkte, Sätze/Rallyes, Geometrie, Laufwege, Entwürfe und gefährliche Prototype-Schlüssel. Fehlerhafte Dateien ändern weder Speicherbytes noch aktuellen Stand. Bei Quota-/Schreibfehler bleiben letzter dauerhafter Stand und neuer Stand im Arbeitsspeicher erhalten; eine dauerhafte Warnung fordert zum Export auf. Unlesbare Bestände werden nicht überschrieben; der Wiederherstellungsexport enthält ihre unveränderten Rohdaten, keinen frischen Ersatzstand.

## Kennzahlendefinitionen

- Eigene Angriffe zählen ausschließlich explizite eigene `Attack`-Ereignisse; gleiche Ereignis-IDs werden nicht doppelt gezählt. Zweite Bälle bleiben eigene Ereignistypen und werden nicht stillschweigend zu normalen Angriffen umgedeutet.
- Kontrollierte Chancen sind `TransitionChance` bzw. D2/D3-Abwehr. D0/D1 erzeugen keine kontrollierte Chance. Eine Chance ohne anschließenden eigenen Angriff wird gesondert gezählt.
- First-Attack-Kill und kumulative Kill-bis-2-/3-Quoten verwenden vollständig beobachtete Rallyes mit eigenem Angriff als Nenner. Eine unvollständige Schnellrallye behauptet keinen ersten Angriff.
- Transition-Kill-/Punktquote = erfolgreiche letzte Chance / alle dokumentierten kontrollierten Chancen. Eine Rallye mit mehreren Chancen erzeugt höchstens einen Punkt/Kill. Ein Blockpunkt oder Gegnerfehler ist ein eigener Punktgrund, kein eigener Kill.
- Neue unvollständig erfasste Rallyes werden explizit markiert. Altdaten ohne Kennzeichnung werden anhand vorhandener Ereignisketten ausgewertet; historische Vollständigkeit lässt sich nicht nachträglich beweisen.

## Ausgeführte Prüfungen

| Prüfung | Ergebnis |
|---|---:|
| Vollständige Node-Suite, bestehende und neue Fälle | **39/39 bestanden** |
| Vollständige Playwright-Suite | **66/66 bestanden** |
| Nach K1-Formationskorrektur und zusätzlichen Statistik-Sollwerten: betroffene Node-Fälle | **12/12 bestanden** |
| Bestehende 100 Quick-Matches und 100 vollständige Kontaktketten | bestanden, Bestandteil der Node-Suite |
| Erweiterte Auswertungs-Sollwerte über alle 100 Kontaktketten | bestanden, Bestandteil des gezielten Nachlaufs |
| Historische neun Skripte | **1 bestanden, 8 fehlgeschlagen**, getrennt dokumentiert |
| Installation aus Lockfile, Syntax und Diff-Prüfung | bestanden |

Keine deaktivierten Tests in den aktuellen Suiten. Die acht historischen Fehler sind die bereits dokumentierten alten Versions-/Quelltextannahmen bzw. unvollständigen isolierten Harnesses; sie wurden nicht durch gelockerte Erwartungen grün gemacht. `qa/phase4/legacy.json` enthält tatsächliche aktuelle Ausgaben.

Neue Browserabdeckung: Touch-Drag auf 768/1024 px, Lauf-/Ballpfeile, Kopien R1–R6, Reset, gespeicherte Abwehrformationen, Reload, aktiver Libero-Wechsel, Satzvorlage mit Abbruch/Bestätigung, neuer Browserkontext während einer Rallye, Offline-Reload mit laufender Rallye, beschädigte Imports, Quota-Fehler, Rohdatenexport und unterbrochene Zielzonenwahl ohne Doppelpunkt. Die Wiederherstellung ist mit einem neuen Browserkontext und übertragenem persistenten Browserzustand getestet, nicht mit einem echten iOS-Prozessabbruch.

Rohbelege: `qa/phase4/browser.json`, `node.log`, `targeted.log`, Reproduktionen `before.log`, `prototype-before.log` und `k1-before.log`.

## Gemessene Eingaben

Die bestehenden Playwright-Touchmessungen wurden bei 390 und 820 px erneut ausgeführt: Ass **1**, A0/D0 **2**, Angriffspunkt **2**, Abwehr gewonnen **1**, Transition → Kill **3**. Setup und Moduswahl sind ausgeschlossen; Undo wird danach separat geprüft. Rohwerte sind im Browserbericht gespeichert.

Der Satzassistent verwendet im geprüften Vorlagenablauf zwei Button-Taps (Öffnen/Starten) plus eine `selectOption`-Auswahl. Die Auswahl ist programmatisch und kein vermessener nativer iOS-Auswahldialog; hierfür wird keine erfundene Gesamtzahl an Hardware-Taps angegeben. Ein neuer Satz mit vorausgewählter letzter Aufstellung benötigt die beiden Start-/Öffnen-Aktionen.

## Behobene Fehler

- Laufende Rallye ging beim Reload verloren; offene Zielzonen konnten nicht wiederaufgenommen werden.
- Beschädigte/strukturell ungültige Imports sowie manipulierte Gegnerobjekte wurden nicht ausreichend vor Anwendung geprüft.
- Speicherfehler waren nur kurz sichtbar; Wiederherstellungsexport exportierte zuvor den Ersatzstand statt beschädigter Originalbytes.
- Nach Touch-Pfeilzeichnung konnte der folgende Speichern-Tap ohne Klickereignis bleiben. Editor-Tasten verarbeiten Pointer-Abschluss und unterdrücken den nachfolgenden doppelten Klick; Pointer-Cancel setzt die Bewegung zurück.
- Abwehrformation wurde in einer K1-Rallye nach dem Gegnerangriff fälschlich als Annahmeformation geladen. Die Auswahl folgt jetzt dem aktuellen Ereignisschritt statt nur dem ursprünglichen Aufschlagrecht.
- Taktik-/Vorlagenbibliothek wurde bei frischem Matchstart nicht übernommen.

## Grenzen und Freigabeempfehlung

Empfehlung: Review und kontrollierter Testbetrieb des Entwicklungsstands. **Keine V8.0-Versionsfreigabe.** Reale iPad-/iPhone-/Safari-/Pencil-Tests, native Verpackung sowie echter Betriebssystem-Prozessabbruch und Speicherverdrängung stehen aus. Offline ist nach erfolgreicher Erstinstallation geprüft; ein erstmaliger Start ganz ohne vorherigen Download kann nicht funktionieren. Cache-Upgrade/Rollback zwischen mehreren veröffentlichten Versionen ist nicht vollständig abgenommen.

Unspeicherte Editoränderungen sind bis zum expliziten Speichern lokal im Dialog und werden beim Wechsel des Editors verworfen; laufende Spielentwürfe werden dagegen automatisch gespeichert. Bei ausgeschöpftem Speicher muss der aktuelle Speicherstand exportiert werden; automatisches Kürzen/Löschen von Matchdaten findet bewusst nicht statt. Browserseitiges Löschen des gesamten Profils kann die App nicht verhindern. Es gibt keine neue Synchronisation über Geräte/Origins hinweg und keine Garantie für beliebige fremde oder beschädigte historische Formate. Vor Live-Einsatz weiterhin ein externes JSON-Backup anlegen.
