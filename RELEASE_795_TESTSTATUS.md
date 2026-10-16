# QuickScout VIP 7.9.5 – Feldtest, noch KEIN endgültiges Release

## Behoben/ergänzt
- Neuer Spielstart mit expliziter Sicherheitsabfrage und optionalem JSON-Backup; alter Spielstand wird nicht automatisch wieder fortgeführt, wenn ein neues Spiel gewählt wird.
- Match-Ende explizit nach dem dritten gewonnenen Satz; kein voreiliges Ende bei 2:1. Satz 5 bis 15 mit zwei Punkten Abstand.
- Libero-Verwaltung im Coach: Amar/Alexandra auf hinterem MB, Auswahl zwischen Rallyes. Annahmevorlage verwendet aktiven Libero, sonst D als dritten Annahmespieler. Zwei Liberos im Kader; kein automatisches komplexes Doppel-Libero-Wechselsystem.
- Setup-Auswahl der zu ersetzenden Spieler aus dem vollständigen Kader.
- Gegner-Kill-Zonen als 3×3-Karte aus markierten EVV-Punkten, ergänzt um gegnerische Feldabwehr-Skizze. Keine gemessenen Block-/Abwehrdaten aus der Skizze ableiten.
- Mobile Touchflächen und Fokusindikatoren ergänzt.

## Automatisiert geprüft
- `node tests/test_regression_core.js`: 9/9
- `node tests/test_vip_794.js`: 6/6
- `node tests/test_release_795.js`: 5/5
- `node --check app.js`: OK
- Älterer TEST_PAKET_1_2: 12/13, verbleibender Test erwartet hartcodierte Versionskennung 7.9.4.

## Noch vor produktiver Freigabe
- Safari iPhone/iPad, Offline/PWA-Cache, Spracheingabe, Backup/Restore auf echten Geräten prüfen.
- Regelprüfung der Startaufstellungen/Überlappung sowie komplexe Libero-Wechsel nicht vollständig implementiert.
- Gegner-Kill-Karte umfasst nur mit Zielzone erfasste EVV-Punkte; Gegner-Kills auf unserem Feld benötigen separate Zielfeld-Erfassung.
- Aufstellungen und Libero-Einsatz nach jedem Satz praktisch durchspielen.
- Bestehende Spielstände vor Update exportieren. Github-Pages-Deployment erfolgt nicht automatisch.
