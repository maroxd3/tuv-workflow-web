# Backlog

Stand: 2026-05-17  
Aktuelle Architektur: MariaDB + Express API + React/Vite.

## 1. Definition of Done

Eine Story gilt als erledigt, wenn:

- relevante UI-Flows funktionieren,
- Daten ueber die Express-API in MariaDB gespeichert werden,
- fachliche Regeln eingehalten werden,
- `npm run build` und `npm run typecheck` erfolgreich sind,
- Dokumentation bei Architektur- oder Datenmodell-Aenderungen aktualisiert ist.

## 2. Aktueller Stand

| Bereich | Status |
|---|---|
| Fahrzeug-CRUD | erledigt |
| Terminplanung | erledigt |
| Maengelerfassung | erledigt |
| Statistik | erledigt |
| Berichte/PDF | erledigt |
| MariaDB-Backend | erledigt |
| Dokumentation MariaDB | in diesem Stand aktualisiert |

## 3. Product Backlog

| ID | User Story | Prioritaet | Status |
|---|---|---|---|
| US-01 | Als Mitarbeiter moechte ich Fahrzeuge erfassen und bearbeiten | Must | done |
| US-02 | Als Mitarbeiter moechte ich Halter verwalten | Must | done |
| US-03 | Als Pruefer moechte ich Termine planen | Must | done |
| US-04 | Als Pruefer moechte ich Maengel dokumentieren | Must | done |
| US-05 | Als Pruefer moechte ich `Bestanden` bei HM/GM verhindern | Must | done |
| US-06 | Als Leitung moechte ich Statistiken sehen | Should | done |
| US-07 | Als Mitarbeiter moechte ich Pruefberichte drucken | Should | done |
| US-08 | Als Team moechten wir zentrale MariaDB-Persistenz | Must | done |
| US-09 | Als Team moechten wir API-Healthchecks | Should | done |
| US-10 | Als Betreiber moechte ich Zugangsdaten per `.env` setzen | Must | done |
| US-11 | Als Betreiber moechte ich Backups dokumentieren | Should | open |
| US-12 | Als Betreiber moechte ich Authentifizierung und Rollen | Could | open |
| US-13 | Als Team moechten wir API-Integrationstests mit Testdatenbank | Should | open |
| US-14 | Als Team moechten wir versionierte DB-Migrationen | Should | open |
| US-15 | Als Betreiber moechte ich ein Deployment-Konzept fuer API + DB | Should | open |

## 4. Sprint-Historie

| Sprint | Fokus | Ergebnis |
|---|---|---|
| 1 | Setup, Tooling, Grundlayout | erledigt |
| 2 | Fahrzeug- und Halterverwaltung | erledigt |
| 3 | Tagesplan und Termine | erledigt |
| 4 | Maengel, Berichte, Statistik | erledigt |
| 5 | Validierung, UX, Mobile, PDF | erledigt |
| 6 | Abgabe-Dokumentation und Stabilisierung | erledigt |
| 7 | Relationales Datenmodell und Tests | erledigt |
| 8 | MariaDB-Backend und Doku-Umstellung | erledigt |

## 5. Technische Schulden

- Historische Browserdatenbank-Dateien liegen noch im Repository, sind aber
  nicht mehr aktive Laufzeitarchitektur.
- API-Integrationstests sollten gegen eine isolierte MariaDB laufen.
- Schema-Aenderungen sollten mittelfristig versioniert werden.
- Produktiver Betrieb braucht Auth, HTTPS, Backups und Rollen.
