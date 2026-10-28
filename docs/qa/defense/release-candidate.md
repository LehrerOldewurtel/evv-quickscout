# Automatischer QA-Lauf

Erzeugt: 2026-10-28T19:38:58.292Z. Rohdaten: release-candidate.json.

| Prüfung | Bestanden | Fehlgeschlagen | Übersprungen |
|---|---:|---:|---:|
| Node | 179 | 0 | 0 |
| Playwright | 142 | 0 | 0 |

Detaillierte Simulation: 100 Matches, 400 Sätze, 17213 Rallyes, 271405 Kontakte, 1220 Undo/Wiederholungen, 800 Wechsel/Rückwechsel.

Bestehende Punktesimulation: 100 Matches, 400 Sätze, 19990 Rallyes. Zusätzlich 100 isolierte Kontaktketten.

Browser-Generalprobe: 3 vollständige Matches, 9 Sätze, 288 Rallyes.

| Breite | Match-Taps | Auswahlaktionen | Rallyes |
|---|---:|---:|---:|
| 390 | 245 | 18 | 96 |
| 820 | 245 | 18 | 96 |
| 1024 | 245 | 19 | 96 |

Auswahlaktionen per selectOption sind keine Messung nativer Menü-Taps. Je Match zusätzlich zwei Texteingaben und eine Ziehbewegung.

| Breite | Aktion | Taps | Ziel |
|---|---|---:|---:|
| 390 | ace | 1 | 1 |
| 390 | a0 | 2 | 2 |
| 390 | d0 | 2 | 2 |
| 390 | kill | 2 | 2 |
| 390 | transition | 1 | 1 |
| 390 | transitionKill | 3 | 3 |
| 820 | ace | 1 | 1 |
| 820 | a0 | 2 | 2 |
| 820 | d0 | 2 | 2 |
| 820 | kill | 2 | 2 |
| 820 | transition | 1 | 1 |
| 820 | transitionKill | 3 | 3 |
| 820 | transitionPlayerKill | 3 | 3 |
| 820 | transitionPlayerKill-R1-K1 | 3 | 3 |
| 820 | transitionPlayerKill-R2-K1 | 3 | 3 |
| 820 | transitionPlayerKill-R3-K1 | 3 | 3 |
| 820 | transitionPlayerKill-R4-K1 | 3 | 3 |
| 820 | transitionPlayerKill-R5-K1 | 3 | 3 |
| 820 | transitionPlayerKill-R6-K1 | 3 | 3 |
| 820 | transitionPlayerKill-R1-K2 | 3 | 3 |
| 820 | transitionPlayerKill-R2-K2 | 3 | 3 |
| 820 | transitionPlayerKill-R3-K2 | 3 | 3 |
| 820 | transitionPlayerKill-R4-K2 | 3 | 3 |
| 820 | transitionPlayerKill-R5-K2 | 3 | 3 |
| 820 | transitionPlayerKill-R6-K2 | 3 | 3 |
| 390 | undo | 1 | 1 |
| 820 | undo | 1 | 1 |
| 1024 | undo | 1 | 1 |

Prozess-Exitcodes: Node 0, Browser 0. Flaky: 0. Freigabeempfehlung und offene Risiken: ../../RELEASE_CANDIDATE_REPORT.md.
