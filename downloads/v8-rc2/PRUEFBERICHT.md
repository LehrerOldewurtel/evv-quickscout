# EVV QuickScout V8 · RC2 nach erstem Praxistest

Basis: release/v8-final-candidate bei b57f226. Geprüfter Quellstand: bff9fbdefa28f2064509f1ebeaafc0bb1b85b7d1.
Produktversion bleibt 7.19.0-k1-auto-mb; RC2 ist ein Kandidat zur manuellen Abnahme.
Die Dateihashes im TESTBERICHT.json/BUILD.json identifizieren die geprüften App-Dateien.

## Behobene Ursachen und Verhalten

- Transition führte bisher nur zum internen Detailzustand ohne klare Schnellführung.
  Jetzt: **Abwehr gewonnen → zulässigen Angreifer auswählen → Angriffsergebnis**.
  Die Auswahl selbst erzeugt keinen Angriff; drei Eingaben reichen für Transition → Kill.
- Wiederholte Ergebnisklicks nach CONTINUE konnten einen weiteren Angriff/Punkt erzeugen.
  Die Rallye bleibt jetzt offen; bis zur nächsten Ballkontrolle sind weitere eigene
  Angriffsergebnisse gesperrt. Doppelte Transitions werden verworfen. K1/K2 bleibt erhalten.
- Detail-/Quick-Wechsel ignorierte AttackResult bei der Sperre und konnte Abschluss-
  und Kontaktspieler unterschiedlich setzen. Der begonnene Angriff bleibt nun derselbe
  Kontakt mit derselben Spieler-ID. Gegnerabwehr blockiert keine eigene Transition mehr.
- SVG-Ziehen berücksichtigte den Greifpunkt nicht (reproduzierter Sprung etwa 14 px);
  Zielklicks auf leeres Feld wurden verworfen. Jetzt gibt es Greifpunktversatz,
  4-Pixel-Bewegungsschwelle, stabiles Pointer Capture und Auswahl/Zielklick.
  Die sechs Coach-Skizzen haben dieselbe Alternative, korrekte Innenkoordinaten und
  verwerfen abgebrochene Gesten. Taktik verändert keine offiziellen Regelpositionen.
- Kompakter Livebereich: Feld 178 px, auf schmalen Ansichten 164 px; Liveaktionen
  mindestens 44×44 CSS-Pixel. Feld und Aktionen stehen auf iPad nebeneinander.
  Marineblaue Spielstandskopfzeile, erkennbare Spielerwahl, grüne Punktaktionen,
  rote Verluste und blaue Fortsetzung erleichtern das schnelle Lesen.
- Aktuelle Rallye und abgeschlossene Rallyes sind in Analyse/Livezählern ausdrücklich
  getrennt. Nur Abschlüsse gehen in Historie und Quoten ein. Transition-Chancen,
  eigene Angriffe, Kills, Blockpunkte und Gegnerfehler bleiben getrennte Kennzahlen.
- Service-Worker-Cache auf practice-2 erhöht; Upgrade, Fehlversuch, Offline und
  kompatibler Rollback werden mit echten Worker-Lebenszyklen geprüft.

## Tatsächlich bestandener Schlusslauf

| Prüfung | Bestanden | Fehler | Übersprungen |
|---|---:|---:|---:|
| Node | 155 | 0 | 0 |
| Chromium / vollständige Playwright-Suite | 100 | 0 | 0 |
| WebKit / Hybrid, Release und Praxistest | 40 | 0 | 0 |

Keine als bestanden gewerteten Wiederholungs-/Flaky-Fälle. Syntax- und Diffprüfung
sowie Lockfile-Installation wurden ausgeführt. Remote-CI wurde für RC2 nicht gestartet.

Die detaillierte Matchserie verwendet Seeds 501–600 und einen unabhängigen Oracle:
**100 Matches, 400 Sätze, 17,213 Rallyes,
271,405 Kontakte, 800 Wechsel/Rückwechsel,
1220 Undo/Wiederholungen und 331 Wiederanläufe**.
100/100 Spielpläne stimmen mit dem vorherigen Kandidaten überein.
Zusätzlich 100 Quick-Matches mit 400 Sätzen und 19,990 Rallyes
sowie 100 Kontaktketten.
Die Browser-Generalprobe umfasst 3 vollständige UI-Matches,
9 Sätze und 288 Rallyes.

Transition → Spieler → Kill: **3 Eingaben**, im Mausablauf und zusätzlich per Touch
in allen sechs Rotationen sowohl in K1 als auch K2, mit geprüfter Spieler-ID.
Weitere Tests: Doppelklick, CONTINUE, Moduswechsel, Reload, Abbruch einer Ziehgeste,
Mausziehen und Auswahl/Zielklick in beiden Taktikoberflächen, Analyse und Historie.
Live-Aktionen bei 820×1180, 768×1024, 1024×768 und 1180×820 vollständig sichtbar,
ohne Scrollen und oberhalb der festen Aktionsleiste.

## Paket und Nachweise

TEST_START.py dient ausschließlich synthetischen Testspielen und verwendet einen
separaten Speicher-/Cache-Namensraum mit sichtbarem Testhinweis. Das ZIP wird in ein
frisches Verzeichnis entpackt und mit seinem eigenen Starter tatsächlich gestartet.
Die zugehörige .verification.json muss den ZIP-SHA256 und bestandene Kontexte für
Chromium/WebKit bei 390×1180, 820×1180, 1024×768 und 1440×1180 enthalten.
Dabei werden auch Liveaktionen mit eingeblendetem Testhinweis auf Überdeckung geprüft.
Speicherung, getrennte Testdaten, Taktik, Analyse, Statistik, Offline und alle inneren
Dateiprüfsummen sind Teil dieser Paketprüfung. Ohne positives Protokoll keine Paketabnahme.

Rohdaten: docs/qa/practice (Erstfehler, Testkorrekturen, Schlusslauf).
Ein früher voller Browserlauf und ein WebKit-Lauf wurden wegen neuer Testfehler
unterbrochen und sind ausdrücklich keine bestandenen Gesamtläufe. Dynamische
Testlocator-Auswahl, feste Kopfzeile und ganzzahlige WebKit-Pointerkoordinaten wurden
in den Tests präzisiert, ohne Bewegungs- oder Spielerzuordnungsassertionen zu lockern.

## Verbleibende Einschränkungen und Veröffentlichung

Linux Chromium/WebKit und Touch-/Viewport-Emulation ersetzen keinen echten
Mac-/iPad-/Safari-/Apple-Pencil-Test. Firefox wurde in diesem Korrekturlauf nicht
geprüft (der vorherige Host konnte dessen Renderer nicht starten).
WLAN-HTTP sichert auf dem iPad keinen Offline-/Mikrofonbetrieb zu; dafür ist ein
separater HTTPS-Test-Origin mit Geräteabnahme erforderlich. Es gibt keine native Hülle
und keine Synchronisierung zwischen Geräten. Auf kleinen Telefonen, mit vergrößerter
Schrift/Zoom oder erweiterter Aufstellung/Aktionsleiste darf die Seite scrollen.

**Keine Veröffentlichung, kein Push, kein Merge und kein Deployment von RC2.**
main bleibt f6b316bfbbcf30d4758fc954ef006bff59a1fc9e; der bestehende produktive
Stand und die frühere ZIP-Datei bleiben unverändert. Freigabe zur Veröffentlichung
oder uneingeschränkten Spieltagsnutzung ist damit nicht erteilt.
