# Matchplan, Live-Pacer und Zuspielanalyse

Entwicklungskandidat auf `dev/v8-matchplan-pacer`. Produktkennung bleibt
7.19.0-k1-auto-mb. Nur synthetische Daten, keine produktive Veröffentlichung.

## Bedienung

Im Live-Kopf öffnet PACER den Matchplan. Im Coach-Tab stehen sechs Direktzugänge:
Pacer, K1, K2, A+-Mitte, Dankeball und Rotation. Die bestehenden Analysen und
Taktiksysteme bleiben erreichbar. Zusätzliche Live-Angaben liegen unter Mehr →
Kontext; ein eingehender Dankeball lässt sich unter Mehr ausdrücklich markieren.
Keine zusätzliche Pflichtmaske und kein zusätzlicher Kontakt sind erforderlich.

Der Matchplan enthält editierbare Vorschläge: erster Satz gewinnen, K1 60 %, K2
35 %, Mitte nach A+ 35 %, Angriff-Kill 45 %, direkter Dankeball-Kill 60 %.
Grenzen sind Trainerziele, keine Normwerte. Mindeststichprobe standardmäßig fünf.
Jede Quote zeigt Zähler/Nenner, Prozent oder fehlende Daten. Vorlagen werden
benannt gespeichert, bewusst geladen und erst nach Speichern übernommen.
Ein neues Match setzt den aktiven Plan zurück; benannte Vorlagen bleiben erhalten.
Ungültige Ziele/Kurven verändern den gespeicherten Plan nicht.

## Ereignisse und Herkunft

Bestehende Kontakte werden weder ergänzt noch rückwirkend umgeschrieben. Neue
Zusatzangaben liegen ausschließlich im optionalen `coaching`-Objekt der Rallye.
Ein vorhandenes EVV-Set zählt einmal; sein folgender Angriff liefert Ergebnis und
Angreifer, keinen zweiten Zuspielversuch. Ohne Set zählt nur ein tatsächlich neu
aufgezeichneter Angriffskontext als Auswertungszeile. Dokumentierte alte Zuspieler
bleiben auswertbar. Historische unzugeordnete Angriffe sowie reine Sprach-/Legacy-
Zusammenfassungen bleiben Datenlücken; daraus entsteht kein erfundenes Zuspiel.

Bei neuen Kontakten kann der eindeutig aktive Zuspieler automatisch erfasst
werden. Hat dieser bereits den ersten eigenen Kontakt übernommen, erfolgt keine
solche Annahme. Wechsel wirken auf neue Kontakte, nicht auf alte Aufzeichnungen.
Die Herkunft automatisch/manuell/dokumentierter Kontakt bleibt unterscheidbar.
Optionale Korrekturen ermöglichen auch andere tatsächliche Zuspieler. Eine
mehrdeutige Angriffsroute bleibt unbekannt. Regelaufstellung und Rollen ändern
sich durch diese Angaben nicht.

Eigene Annahme A3 → A+, A2 → A~, A1 → A−; A0 erscheint getrennt. Gegnerannahme
und Abwehr D3 sind keine eigene positive Annahme. Nach neuem Gegnerkontakt/
Transition wird keine alte Annahmequalität in den nächsten Angriff übertragen.
IV/III/II und Hinterfeld (PIPE/I/BACK) werden getrennt ausgewiesen. Kill und
Angriffsfehler verwenden ausschließlich bekannte Angriffsergebnisse. Die K1-/K2-
Gegenüberstellung hält Zuspieler-/Qualitätsfilter konstant; Differenzen werden in
Prozentpunkten gezeigt, nur wenn beide Stichproben vorhanden sind. K1/K2 bleibt
die dokumentierte Anfangsphase der Rallye, auch nach Transition.

## Dankeball

Eine Chance entsteht nur durch einen dokumentierten gegnerischen FREE-Kontakt
oder ausdrückliche Markierung. Eigener Freeball, CUT/OVER oder D3 alleine zählen
nicht. Wiederholtes Markieren derselben offenen Chance verdoppelt sie nicht.
Mehrere tatsächlich erfasste Chancen einer Rallye bleiben getrennt.

- Organisierter erster Angriff: tatsächliches Set mit folgendem Angriff oder
  ausdrückliche Trainerangabe. Sonst unbekannt, nicht automatisch negativ.
- Direkte Killquote: direkte erste Kills / Chancen mit bekanntem direktem Ausgang.
  Unvollständig beobachtete erste Angriffe bleiben außerhalb dieses Nenners.
- Punktquote: gewonnene / im Ergebnis bekannte Rallyes mit mindestens einer Chance.
  Eine Mehrfach-Chancen-Rallye zählt in dieser Quote einmal.
- Später gewonnen: bekannter Sieg ohne direkten Kill; unklare Sequenzen werden
  gesondert als nicht eindeutig einordenbare Siege ausgewiesen.

Die laufende Rallye steht separat und beeinflusst keine abgeschlossene Quote.
Eine Markierung erzeugt weder Annahme noch Abwehr noch Zuspiel noch Transition.
Quick → Detail und weitere explizite Dankebälle einer offenen Rallye bleiben
möglich. Angriff verteidigt lässt die Rallye weiterhin offen. Undo entfernt die
Zusatzangaben zusammen mit dem jeweiligen rückgängig gemachten Ereignis.

## Pacer und Satzauftakt

Vorgeschlagene Kurve (Gegner:EVV): 0:0, 5:8, 10:13, 15:18, 20:23. Zwischen
Stützpunkten wird linear interpoliert; oberhalb des letzten Punktes wird dessen
letzte Steigung fortgesetzt. Beispiel 20:15: Soll 18, Delta +2. Dies ist ein
Sollpfad, keine Siegprognose. Bei 0:0 bleibt die Anzeige neutral.
Satz 5 hat eine eigene editierbare Kurzkurve: 0:0, 3:5, 6:8, 9:11, 12:14.
Gegnerstützpunkte sind aufsteigende ganze Zahlen; EVV-Sollwerte nicht fallend.
Satzwechsel setzt den Live-Pacer auf den neuen Satzstand zurück.

Der erste-Satz-Auftakt wird am ersten dokumentierten Erreichen des konfigurierten
Gegnerstands beurteilt. Wird das EVV-Ziel vorher erreicht, ist dies ebenfalls
belegt. Fehlende Zwischenstände werden nicht rekonstruiert. Es erscheint höchstens
ein kurzer Auftakthinweis; spezifische K1-Empfehlungen benötigen die konfigurierte
Mindeststichprobe. Nach dem Auftakt gibt es keine wiederkehrende Warnflut.
Erster-Satz-Sieg wird erst bei belegtem Satzende beurteilt; fehlende Historie bleibt
als nicht dokumentiert sichtbar.

## Speicherung und Grenzen

Importe validieren Plan, Vorlagen und Zusatzangaben vor Übernahme; unbekannte oder
ungültige Metadaten werden nicht stillschweigend übernommen. Alte gültige Matches
ohne neue Felder bleiben gültig. Die Punkt-/Rotations-/Wechsel-Engine und ihre
ursprünglichen Kontaktobjekte bleiben erhalten. Keine Geräterekonstruktion und
keine automatische Synchronisierung. Der Paketstarter nutzt eigene Testablagen.
Linux-WebKit/Chromium und Viewports ersetzen keine echte Mac-/iPad-Abnahme.
