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
| US-11 | Als Betreiber moechte ich eine 3-Tier-Backup-Strategie | Should | in Arbeit (Konzept + Binlog: done; Skripte: open) |
| US-12 | Als Betreiber moechte ich Authentifizierung und Rollen | Could | open |
| US-13 | Als Team moechten wir API-Integrationstests mit Testdatenbank | Should | open |
| US-14 | Als Team moechten wir versionierte DB-Migrationen | Should | open |
| US-15 | Als Betreiber moechte ich Docker-Compose-Deployment fuer Kunden | Must | in Arbeit (docker-compose.yml angelegt, Doku ergaenzt) |
| US-16 | Als Pruefer moechte ich Aenderungen anderer Mitarbeiter live sehen | Should | open (Polling-Sync geplant) |
| US-17 | Als Werkstatt-Inhaber moechte ich, dass Kundendaten on-premise bleiben | Must | done (kein Cloud-DB-Zugriff, alles im LAN) |

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
| 9 | On-Premise-Deployment-Modell, Docker-Compose, Backup-Konzept | in Arbeit |

## 5. Technische Schulden

- API-Integrationstests sollten gegen eine isolierte MariaDB laufen
  (insbesondere `PATCH /api/termine/:id/status` mit HM/GM-Maengeln).
- Schema-Aenderungen sollten mittelfristig versioniert werden.
- WF-01 ist nur in UI und API durchgesetzt, nicht in MariaDB (Trigger oder
  Stored Procedure als zusaetzliche Defense-in-Depth offen).
- Backup-Tier-2-Cron-Skript und Tier-3-Offsite-Sync sind als Konzept
  dokumentiert (`docs/backup.md`), die Skripte stehen aus.
- Produktiver Betrieb braucht zusaetzlich Auth, HTTPS und Rollen.
