# EVV QuickScout V8 · Digitales Trainer-Cockpit

Geprüfter Schlusslauf: 28.10.2026 15:06 CET. Entwicklungsbranch: `dev/v8-trainer-cockpit`.
Basis ist RC2 `c66e671`. Geprüfter Quellcommit: `a0ac51d9a198c4341a29da4a543674c5c2f6d54c`.
Produktkennung bleibt 7.19.0-k1-auto-mb. Entwicklungskandidat zur Geräteabnahme,
keine stabile V8-Freigabe und keine produktive Veröffentlichung.

## Ergebnis und Bedienung

- Visuelles Dashboard mit sechs Hauptkennzahlen, Prozentwert/Zähler/Nenner und
  zurückhaltender Bewertung erst ab ausreichender Stichprobe. LIVE zeigt den
  aktuellen Satz; MATCH und ROTATIONEN das ganze Spiel. Detailfilter sind optional.
  Maximal drei knappe, datenbasierte Hinweise. Definitionen: [COCKPIT_DESIGN.md](COCKPIT_DESIGN.md).
- Kompakte Turnaround-Karte aus der unveränderten Ereignisauswertung. Aktuelle und
  abgeschlossene Rallyes bleiben getrennt, unvollständige Beobachtungen sind markiert.
  Keine aus Punkten erfundenen Angriffe oder Transition-Chancen.
- Permanente Rotationsampel am Spielstand: aktuelle Rotation und aktuell relevante
  K1- oder K2-Phase, Mindeststichprobe, drei Leistungsprofile, eigene Grenzen und
  deterministischer Stabilitätsabstand. Die Rotationskarte übernimmt den gewählten
  Analysezeitraum. K1-/K2-Karten öffnen direkt die passende Taktik.
- Gemeinsames Feld mit blauen EVV-Spielern, Namen/Nummern/Libero und roten Gegner-
  nummern. Getrennter, gesperrter Spielbetrieb und Trainer-Editor. K1 und Abwehr
  IV/III/II sofort anwählbar; aktuelle Spielerwechsel und Libero werden angezeigt.
  Vorschauen beider Mannschaften sind unabhängig und verändern keinen Punkt.
- Bestehende slotgebundene Formationsbibliothek weiterverwendet; Laufwege, Ballwege
  und optionale Angriffsrouten im selben Modell. Speichern, Kopieren und Reset.
  Fehlende/teilweise Formationen sowie fehlende Trikot-/Gegnerdaten werden markiert.
  Gegnerrotation entsteht nur aus bestätigter Zuordnung plus dokumentierten Sideouts.
- Ruhige Systemschrift, Karten, klare Team-/Statusfarben und zusätzliche Symbole,
  Hell/Dunkel/System, reduzierte Bewegung. Kernaktionen bleiben schnell; auf dem
  iPhone öffnet „Mehr“ die selten benötigte Satznavigation. 44-Pixel-Live-Touchziele.

## Behobene reproduzierte Probleme

1. Fehlende visuelle Kennzahlkarten, Filterführung, Ampel und gesperrte Spieltaktik.
2. Reload ergänzte bei frischen Spielen erst nachträglich ein leeres Skizzenfeld;
   neue Spiele sind jetzt von Beginn an konsistent normalisiert.
3. Ein neuer Dialog konnte eine alte Scrollposition bzw. Scroll-Anker übernehmen;
   Dialoge beginnen oben. Schließen bleibt direkt an der Analyse erreichbar.
4. Zu enge iPhone-Schalter und von der festen Leiste überdeckte Transition-Aktion:
   Modusschalter klar gruppiert, Feldhöhe reduziert und Satznavigation bedarfsweise.
5. Zunächst kollidierte die neue ausdrückliche Formationsbestätigung mit dem alten
   Reset-Verhalten. „Zurücksetzen → Speichern“ löscht weiterhin die Vorlage;
   die vorhandenen Tablet-Assertions sind unverändert erhalten.
6. Eine Rotationskarte verwendete anfangs den aktuellen Satz statt des gewählten
   Matchzeitraums. Sie übernimmt jetzt denselben Kontext und bietet direkte K1-/K2-Wege.

Die Punkt-/Rotations-/Wechsel-Engine und bestehenden Turnaround-Formeln wurden
nicht neu implementiert. Die 100 unabhängigen Ereignispläne stimmen mit RC2 überein.

## Tatsächliche Testergebnisse

| Prüfung | Bestanden | Fehler | Übersprungen |
|---|---:|---:|---:|
| Node einschließlich unabhängiger Cockpit-Sollwerte | 163 | 0 | 0 |
| Chromium · vollständige Regression | 112 | 0 | 0 |
| WebKit · Cockpit, Hybrid, Release, Praxistest und UI-Matches | 56 | 0 | 0 |
| Geometrie/Kontrast · vier Viewports, hell und dunkel | 8 | 0 | 0 |

Keine Flaky-Fälle. Lockfile-Installation, Syntaxprüfung und `git diff --check`
ausgeführt. WebKit-Auswahl schließt nur den ausdrücklich Chromium-spezifischen
Browserprozess-Neustart aus; dieser lief in Chromium tatsächlich. Allgemeine
WebKit-Offline-Abnahme erfolgt am real gestarteten ZIP mit echtem Serverstopp.

Detaillierte Simulation: **100 vollständige Matches**, 400 Sätze,
17,213 Rallyes, 271,405 Kontakte, 800 reguläre
Wechsel/Rückwechsel, 1220 Undo/Wiederholungen und 331 Wiederanläufe.
Seeds 501–600, unabhängiger Oracle und laufende Sollwertprüfung. **100/100 Digests**
stimmen mit dem vorherigen Kandidaten überein. Zusätzlich 100 Quick-Matches
mit 400 Sätzen/19,990 Rallyes und 100 Kontaktketten.

Chromium und WebKit führten jeweils drei vollständige Matches ausschließlich
über die Oberfläche durch: zusammen 6 Matches,
18 Sätze und 576 Rallyes.
Darin Setup, Rollen/Libero, Scouting, Rotation, Wechsel/Rückwechsel, Undo, Satzwechsel,
Speichern/Reload sowie tatsächlicher Export und Import. Neue Tests prüfen zusätzlich
Dashboard-Sollwerte/Filter, Ampel/Grenzen, beiderseitige Vorschauen, Gegner-Sideout,
Trikotnummern, gesperrte Taktik, Maus-/Touch-Editor, Pfade und Datenerhalt.

Transition → Spieler → Kill bleibt bei **drei Eingaben**; bestehende Tests messen
weiterhin alle sechs Rotationen in K1/K2 mit korrekter Spieler-ID.

## Visuelle Nachweise

[Galerie mit Vorher/Nachher und allen Ansichten](screenshots/cockpit/README.md).
68 echte Screenshots: 16 vor der Änderung, 52 danach; vier Bildschirmgrößen
(1024×768, 820×1180, 390×844, 1440×1000). Enthalten sind Live, Dashboard,
Rotationsvergleich/-ampel/-karte, Taktik, K1/K2, Editor, Wechsel, Satzwechsel und Dunkel.
16 automatisierte viewportbezogene RMSE-Vergleiche quantifizieren die beabsichtigte
Neugestaltung. Sie sind kein vorgetäuschter Pixel-Golden-Pass. Repräsentative Bilder
wurden zusätzlich direkt visuell angesehen.

Der unabhängige DOM-Audit prüft sofort sichtbare sechs Hauptkarten, keine
Überlappung, Feldgrenzen der Spielerkreise und mindestens 44×44 große Liveziele
oberhalb der festen Leiste. Mindestkontrast der Kennzahltexte:
5.64:1 in den acht geprüften Kontexten.

## Paket, Daten und Praxistest

Die separate Testversion wird mit `TEST_START.py --lan` gestartet. Der Starter
isoliert Matchdaten (`evvQuickScout_COCKPIT_TEST`), Präferenzen und Cache von
Produktion und älteren RC-Paketen. Nur synthetische Spiele/Backups verwenden.
Die App-Dateien im ZIP entsprechen den geprüften Asset-Hashes. Die Paketabnahme
muss das echte ZIP entpacken, seinen Starter ausführen und eine positive, zum
ZIP-SHA256 passende `.verification.json` erzeugen: Chromium/WebKit jeweils bei
390×1180, 820×1180, 1024×768 und 1440×1180, einschließlich Daten-/Präferenztrennung,
Taktik, Dashboard, Speicherung und Offline-Wiederherstellung. Ohne dieses Protokoll
keine bestätigte Paketabnahme.

Anleitung auf dem iPad: ZIP auf dem Mac in einen neuen Ordner entpacken, Python 3
prüfen, Terminal dort öffnen, `python3 TEST_START.py --lan` ausführen, die tatsächlich
ausgegebene WLAN-Adresse auf dem iPad im selben vertrauten WLAN öffnen. Terminal
offen lassen. Zuerst Gegnerpositionen und fehlende Nummern konfigurieren, dann
K1/K2, Ampel, Formation, regulären Wechsel/Libero und Undo mit Testpunkten prüfen.
Danach Satzwechsel, Export/Reload/Import und Hoch-/Querformat testen.

## Grenzen und Freigabe

Echte Mac-/iPad-/Safari-/Pencil-/Mikrofontests bleiben manuell. Firefox scheiterte
bereits beim unabhängigen Kontrollstart (Host-Sandbox/Renderer); **keine Firefox-
App-Tests ausgeführt**, nicht als bestanden gewertet. WLAN-HTTP garantiert auf dem
iPad weder Offline-PWA noch Mikrofon; hierfür ist ein separater HTTPS-Test-Origin
mit Geräteabnahme nötig. Kein nativer Container, kein Geräteabgleich. Bei kleinen
Displays, Zoom, erweiterten Aktionen und langen Details darf gescrollt werden.

Gegneraufstellungen müssen je Satz bestätigt werden. Vorschauen verwenden den
aktuellen Kader, keine Rekonstruktion historischer Spielerwechsel. Unbekannte Nummern
bleiben ?, fehlende Vorlagen bleiben nicht eingerichtet. Coaching-Grenzen sind
anpassbare Orientierung, keine wissenschaftlichen Normwerte. Ausnahmewechsel und
alle Verbandssonderfälle sind nicht uneingeschränkt abgenommen.

**main und GitHub Pages werden nicht verändert. Kein Merge und kein produktives
Deployment ohne Freigabe.** Der Entwicklungsbranch und Pull Request dienen nur der
Review. Tatsächlichen PR-/Remote-CI-Status getrennt prüfen; lokale Tests sind keine
behauptete Remote-CI-Abnahme. API-/Netzwerkblockaden sind externe Liefergrenzen.

Rohdaten: `docs/qa/cockpit/`. Zwischenläufe mit Fehlern bzw. Unterbrechungen bleiben
als solche dokumentiert und zählen nicht zum grünen Schlusslauf.
