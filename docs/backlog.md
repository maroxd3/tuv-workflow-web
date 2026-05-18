# Backlog

Stand: 2026-05-17  
Aktuelle Architektur: MariaDB + Express API + React/Vite.

## 1. Definition of Done

Eine Story gilt als erledigt, wenn:

- relevante UI-Flows funktionieren,
- Daten über die Express-API in MariaDB gespeichert werden,
- fachliche Regeln eingehalten werden,
- `npm run build` und `npm run typecheck` erfolgreich sind,
- Dokumentation bei Architektur- oder Datenmodell-Änderungen aktualisiert ist.

## 2. Aktueller Stand

| Bereich | Status |
|---|---|
| Fahrzeug-CRUD | erledigt |
| Terminplanung | erledigt |
| Mängelerfassung | erledigt |
| Statistik | erledigt |
| Berichte/PDF | erledigt |
| MariaDB-Backend | erledigt |
| Dokumentation MariaDB | in diesem Stand aktualisiert |

## 3. Product Backlog

| ID | User Story | Prioritaet | Status |
|---|---|---|---|
| US-01 | Als Mitarbeiter moechte ich Fahrzeuge erfassen und bearbeiten | Must | done |
| US-02 | Als Mitarbeiter moechte ich Halter verwalten | Must | done |
| US-03 | Als Prüfer moechte ich Termine planen | Must | done |
| US-04 | Als Prüfer moechte ich Mängel dokumentieren | Must | done |
| US-05 | Als Prüfer möchte ich `Bestanden` bei EM/GfM verhindern | Must | done (3-Layer: UI + API + DB-Trigger) |
| US-06 | Als Leitung moechte ich Statistiken sehen | Should | done |
| US-07 | Als Mitarbeiter moechte ich Prüfberichte drucken | Should | done |
| US-08 | Als Team moechten wir zentrale MariaDB-Persistenz | Must | done |
| US-09 | Als Team moechten wir API-Healthchecks | Should | done |
| US-10 | Als Betreiber moechte ich Zugangsdaten per `.env` setzen | Must | done |
| US-11 | Als Betreiber moechte ich eine 3-Tier-Backup-Strategie | Should | in Arbeit (Konzept + Binlog: done; Skripte: open) |
| US-12 | Als Betreiber moechte ich Authentifizierung und Rollen | Could | open |
| US-13 | Als Team moechten wir API-Integrationstests mit Testdatenbank | Should | open |
| US-14 | Als Team moechten wir versionierte DB-Migrationen | Should | open |
| US-15 | Als Betreiber moechte ich Docker-Compose-Deployment für Kunden | Must | in Arbeit (docker-compose.yml angelegt, Doku ergaenzt) |
| US-16 | Als Prüfer moechte ich Änderungen anderer Mitarbeiter live sehen | Should | open (Polling-Sync geplant) |
| US-17 | Als Werkstatt-Inhaber moechte ich, dass Kundendaten on-premise bleiben | Must | done (kein Cloud-DB-Zugriff, alles im LAN) |

## 4. Sprint-Historie

| Sprint | Fokus | Ergebnis |
|---|---|---|
| 1 | Setup, Tooling, Grundlayout | erledigt |
| 2 | Fahrzeug- und Halterverwaltung | erledigt |
| 3 | Tagesplan und Termine | erledigt |
| 4 | Mängel, Berichte, Statistik | erledigt |
| 5 | Validierung, UX, Mobile, PDF | erledigt |
| 6 | Abgabe-Dokumentation und Stabilisierung | erledigt |
| 7 | Relationales Datenmodell und Tests | erledigt |
| 8 | MariaDB-Backend und Doku-Umstellung | erledigt |
| 9 | On-Premise-Deployment-Modell, Docker-Compose, Backup-Konzept | in Arbeit |

## 5. Technische Schulden

- API-Integrationstests gegen die Docker-MariaDB sind angelegt
  (`server/tests/wf01.test.js`, 7 Cases für alle drei WF-01-Layer + behoben-
  Semantik). Weitere Endpunkte (Halter, Fahrzeug, Termin-CRUD) sind offen.
- Schema-Änderungen sollten mittelfristig versioniert werden.
- Backup-Tier-2-Cron-Skript und Tier-3-Offsite-Sync sind als Konzept
  dokumentiert (`docs/backup.md`), die Skripte stehen aus.
- Produktiver Betrieb braucht zusaetzlich Auth, HTTPS und Rollen.
