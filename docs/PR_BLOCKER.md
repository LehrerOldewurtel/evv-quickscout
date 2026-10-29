# Draft-PR: konkreter externer Blocker

Die aktive Cloud-Netzwerkpolicy ist `restricted/enforced` und enthält `api.github.com` nicht. Native Git-Reads funktionieren; `gh api repos/LehrerOldewurtel/evv-quickscout` liefert `Forbidden`. Ein GitHub-CLI-Authfehler unter dieser Sperre beweist keinen abgelaufenen Token. Es wurden keine zusätzlichen Zugangsdaten verlangt und keine Umgehungsroute verwendet.

Der vorhandene Konfigurationsentwurf enthält die benötigte API-Domain bereits. Die Startanweisungen wurden für den Master-Kandidaten aktualisiert und das Speichern wurde vom Konfigurationstool bestätigt (`requires_publish: true`). Das aktiviert die Änderung noch nicht im laufenden Task.

[cloud-environment-onboarding:setup – SKILL.md](skill://plugin_connector_1p_ed5feb9070a08191b08c81c47947bc16/setup/SKILL.md) schreibt ausdrücklich: “Saving persists configuration; it does not execute scripts, apply runtime changes, or publish.” Die [zugehörige Erläuterung](skill://plugin_connector_1p_ed5feb9070a08191b08c81c47947bc16/setup/references/onboarding.md) trennt gespeicherten Entwurf und tatsächlichen Runtime-Zugriff.

Zum Fortsetzen: den Cloud-Umgebungsentwurf in den Umgebungseinstellungen prüfen/speichern und gemäß dem dortigen Ablauf als **Umgebung** veröffentlichen. Das ist kein Deployment der QuickScout-Webseite. Danach den API-Zugriff erneut prüfen und den bereits konkret vorbereiteten Draft anlegen:

```sh
cd /workspace/evv-quickscout
gh pr create --draft --repo LehrerOldewurtel/evv-quickscout --base main --head dev/v8-master-playbook --title "V8 Master: sechs Läufer, reale Teams und Trainer-Cockpit" --body-file docs/PR_MASTER_V8.md
```

[Vorbereiteter PR-Text](PR_MASTER_V8.md) · [Review-Vergleich auf GitHub](https://github.com/LehrerOldewurtel/evv-quickscout/compare/main...dev/v8-master-playbook?expand=1).

Alternativ kann der Eigentümer über diese Vergleichsseite in seinem bestehenden GitHub-Zugang einen Draft-Pull-Request anlegen. Weder Merge noch Veröffentlichung auf GitHub Pages sind freigegeben. Ein PR wird erst mit der tatsächlich zurückgegebenen PR-URL als erstellt bezeichnet. Das Ergebnis des automatischen Anlegeversuchs wird unter `docs/qa/master/pr-create.log` festgehalten.
