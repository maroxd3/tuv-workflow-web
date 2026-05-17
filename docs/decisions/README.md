# Architecture Decision Records

Dieses Verzeichnis dokumentiert Architekturentscheidungen fuer den aktuellen
MariaDB-Branch.

## Aktuelle ADRs

| ADR | Status | Entscheidung | Datum |
|---|---|---|---|
| [001](001-mariadb-zentrale-persistenz.md) | accepted | MariaDB als zentrale Persistenz | 2026-05-17 |
| [002](002-3nf-normalisierung.md) | accepted | 3NF-Normalisierung fuer Halter, Fahrzeug, Termin und Mangel | 2026-05-13 |
| [003](003-wf01-enforcement.md) | accepted | WF-01 serverseitig und in der UI absichern | 2026-05-13 |
| [004](004-express-api-mariadb-driver.md) | accepted | Express API mit MariaDB Driver | 2026-05-17 |
| [005](005-typescript-graduell.md) | accepted | TypeScript graduell einfuehren | 2026-05-13 |
| [006](006-firebase-hosting.md) | accepted | Firebase Hosting nur fuer statische Frontend-Dateien | 2026-05-13 |
| [007](007-api-client-pattern.md) | accepted | API-Client Pattern im Frontend | 2026-05-17 |
| [008](008-keine-eingebetteten-arrays.md) | accepted | Maengel und Halter als eigene Tabellen | 2026-05-13 |

## Regeln

- ADRs beschreiben getroffene Entscheidungen, keine Wunscharchitektur.
- Veraltete Browserdatenbank-Entscheidungen wurden durch MariaDB-ADRs ersetzt.
- Neue Entscheidungen erhalten eine neue Nummer oder ersetzen bewusst eine
  veraltete Datei mit klarer Historie im Git-Verlauf.
