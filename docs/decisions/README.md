# Architecture Decision Records

Dieses Verzeichnis dokumentiert Architekturentscheidungen für den aktuellen
MariaDB-Branch.

## Aktuelle ADRs

| ADR | Status | Entscheidung | Datum |
|---|---|---|---|
| [001](001-mariadb-zentrale-persistenz.md) | accepted | MariaDB als zentrale Persistenz | 2026-05-17 |
| [002](002-3nf-normalisierung.md) | accepted | 3NF-Normalisierung für Halter, Fahrzeug, Termin und Mangel | 2026-05-13 |
| [003](003-wf01-enforcement.md) | accepted | WF-01 serverseitig und in der UI absichern | 2026-05-13 |
| [004](004-express-api-mariadb-driver.md) | accepted | Express API mit MariaDB Driver | 2026-05-17 |
| [005](005-typescript-graduell.md) | accepted | TypeScript graduell einführen | 2026-05-13 |
| [006](006-firebase-hosting.md) | accepted | Firebase Hosting nur für statische Frontend-Dateien | 2026-05-13 |
| [007](007-api-client-pattern.md) | accepted | API-Client Pattern im Frontend | 2026-05-17 |
| [008](008-keine-eingebetteten-arrays.md) | accepted | Mängel und Halter als eigene Tabellen | 2026-05-13 |
| [009](009-monolithischer-server.md) | accepted | Monolithischer Server statt geschichteter Architektur | 2026-05-19 |
| [010](010-hardening-roadmap.md) | accepted | Hardening Roadmap nach externem Code-Review (7/8 umgesetzt) | 2026-05-20 |

## Regeln

- ADRs beschreiben getroffene Entscheidungen, keine Wunscharchitektur.
- Veraltete Browserdatenbank-Entscheidungen wurden durch MariaDB-ADRs ersetzt.
- Neue Entscheidungen erhalten eine neue Nummer oder ersetzen bewusst eine
  veraltete Datei mit klarer Historie im Git-Verlauf.
