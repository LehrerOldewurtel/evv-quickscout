# Trainer-Cockpit: Definitionen und Bedienung

Das Cockpit projiziert die bestehenden Matchereignisse. Punktvergabe, Rotation,
reguläre Wechsel und Libero-Regeln verwenden unverändert die bestehende Engine.
K1 ist Annahme/Sideout, K2 eigener Aufschlag/Breakpoint; Transition ändert die Phase nicht.

## Dashboard

LIVE zeigt den aktuellen Satz und alle Rotationen, MATCH alle abgeschlossenen Rallyes,
ROTATIONEN vergleicht R1–R6 über das Match. Ein Ansichtswechsel setzt Detailfilter
zurück, niemals Matchereignisse. Weitere Satz-/Rotations-/Phasenfilter liegen in
„Details & Filter“. Die aktuelle Rallye zählt erst nach ihrem Abschluss in die Quoten.

| Kennzahl | Zähler | Nenner |
|---|---|---|
| K1 Sideout | EVV-Punkte aus K1 | abgeschlossene K1-Rallyes |
| K2 Breakpoint | EVV-Punkte aus K2 | abgeschlossene K2-Rallyes |
| Annahme positiv | dokumentierte A2 + A3 | dokumentierte Annahmen |
| Angriff-Killquote | KILL + BLOCK_OUT | dokumentierte eigene Angriffe |
| First-Attack-Kill | Kills beim ersten Angriff, vollständig beobachtet | vollständig beobachtete Rallyes mit eigenem Angriff |
| Transition-Killquote | eigene Transition-Kills | kontrollierte Transition-Chancen |

Die bestehende `turnaroundAnalysis` liefert unverändert die übrigen Werte.
Transition-Punktquote ist gewonnene Rallyes mit Chance / Rallyes mit Chance;
„Kill bis Angriff 2/3“ verwendet denselben Nenner wie First-Attack-Kill.
Die optionale chancenbezogene Verwertung bleibt im Detailtext erhalten.
Unvollständige Beobachtungen werden ausdrücklich ausgewiesen. Keine Angriffe,
Chancen oder Kontakte werden aus einem bloßen Punkt abgeleitet.

## Rotationsampel

Die Live-Ampel bewertet ausschließlich die aktuelle Rotation im aktuellen Satz,
und darin die aktuell relevante Phase (K1 bei Annahme, K2 bei eigenem Aufschlag).
Sie mischt die beiden Phasen nicht. Die Rotationskarte zeigt beide separat.

| Vereinsprofil | Rot unter | Grün ab |
|---|---:|---:|
| K1 | 40 % | 60 % |
| K2 | 20 % | 40 % |
| Annahme positiv | 45 % | 65 % |
| Angriff/FAK | 25 % | 45 % |
| Transition | 20 % | 40 % |

Standard: acht relevante Beobachtungen; darunter neutral/grau mit Beschriftung.
Das sind konfigurierbare Coaching-Orientierungen, keine wissenschaftlich normierten
Leistungsklassen oder Signifikanztests. „Entwicklung“ senkt die Grenzen um zehn,
„Leistung“ erhöht sie um zehn Prozentpunkte. Alle Grenzen können einzeln geändert werden.

Nach der ersten Einstufung muss die Live-Ampel eine Grenze mit fünf Prozentpunkten
Abstand überschreiten, bevor sie wechselt. Mindestmenge und Abstand sind einstellbar.
Eine chronologische, rein lesende Neuberechnung aus dem Ereignisverlauf macht
Reload und Undo deterministisch. Keine versteckte Statushistorie im Matchmodell.
Die sechs Dashboard-Karten zeigen dagegen die direkte aktuelle Quoteneinstufung.
Maximal drei knappe Hinweise nennen nur dokumentierte Auffälligkeiten.

## Taktik und Editor

„Taktik“ öffnet den gesperrten Spielbetrieb, „Editor“ die ausdrückliche Bearbeitung.
K1 und Abwehr IV/III/II sind direkt anwählbar. Ausgangsstellung und taktische
Stellung bleiben unterscheidbar. Vorschauen beider Mannschaften sind unabhängig
vom Livezustand; „Live folgen“ führt zur tatsächlichen EVV-Rotation zurück.

EVV-Ziele der bestehenden Bibliothek sind an Feldplätze R1–R6 gebunden. Die
Besetzung wird aus der aktuellen Aufstellung einschließlich Wechsel und Libero
abgeleitet. Das taktische Verschieben verändert keine regeltechnische Feldposition.
Fehlende Vorlagen werden als nicht eingerichtet angezeigt, Teilvorlagen als solche;
dann sind fehlende Spielerziele ausdrücklich als Basisposition markiert.
Erst „Speichern“ im Editor bestätigt alle sechs dort sichtbaren Positionen.
Laufwege, Ballwege und optionale Angriffsrouten gehören zur gleichen Bibliothek.
Speichern, Kopieren, Reset und Pfeil-Undo erfolgen ausschließlich im Editor.

Gegnernummern müssen für alle sechs aktuellen Positionen und die aktuelle Rotation
konfiguriert werden. Ab dieser bestätigten Zuordnung wird bei jedem gegnerischen
Sideout weiterrotiert. Optional wird ein ausdrücklich konfigurierter Libero für
seinen angegebenen Spieler im Hinterfeld dargestellt; er schlägt nicht auf.
Eine neue Satzaufstellung ist erneut zu bestätigen. Undo vor den Zuordnungszeitpunkt
markiert die Zuordnung als fehlend. Es werden weder Trikots noch Startaufstellungen
oder Gegner-Liberos geraten. EVV-Nummern können ebenfalls vervollständigt werden.

## Trennung und Darstellung

System/Hell/Dunkel und Ampelgrenzen sind reine lokale Bedienpräferenzen, getrennt
vom Matchzustand. Blau/Rot bezeichnet Mannschaften; Leistungsbewertung verwendet
zusätzliche Statussymbole und Texte. Reduzierte Bewegung respektiert das System.

Der lokale Cockpit-Starter isoliert Matchdaten, Präferenzen und Service-Worker-Cache
von Produktion und älteren RC-Testständen. Nur synthetische Spiele verwenden.
Eine automatisierte Linux-WebKit-Prüfung ersetzt keinen echten Safari-/iPad-Test.
