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
| US-01 | Als Mitarbeiter möchte ich Fahrzeuge erfassen und bearbeiten | Must | done |
| US-02 | Als Mitarbeiter möchte ich Halter verwalten | Must | done |
| US-03 | Als Prüfer möchte ich Termine planen | Must | done |
| US-04 | Als Prüfer möchte ich Mängel dokumentieren | Must | done |
| US-05 | Als Prüfer möchte ich `Bestanden` bei EM/GfM verhindern | Must | done (3-Layer: UI + API + DB-Trigger) |
| US-06 | Als Leitung möchte ich Statistiken sehen | Should | done |
| US-07 | Als Mitarbeiter möchte ich Prüfberichte drucken | Should | done |
| US-08 | Als Team möchten wir zentrale MariaDB-Persistenz | Must | done |
| US-09 | Als Team möchten wir API-Healthchecks | Should | done |
| US-10 | Als Betreiber möchte ich Zugangsdaten per `.env` setzen | Must | done |
| US-11 | Als Betreiber möchte ich eine 3-Tier-Backup-Strategie | Should | in Arbeit (Konzept + Binlog: done; Skripte: open) |
| US-12 | Als Betreiber möchte ich Authentifizierung und Rollen | Could | done (Login + Rollen empfang/pruefer/chef, serverseitig erzwungen; in dev/CI deaktiviert) |
| US-13 | Als Team möchten wir API-Integrationstests mit Testdatenbank | Should | done (WF-01-Integrationstests + validate-/auth-Unit-Tests, CI gegen echte MariaDB) |
| US-14 | Als Team möchten wir versionierte DB-Migrationen | Should | done (`server/migrations.js`, schema_migration-Tabelle, ADR-011) |
| US-15 | Als Betreiber möchte ich Docker-Compose-Deployment für Kunden | Must | done (Compose mit production-Defaults, ADMIN_TOKEN-Pflicht, DB nur localhost) |
| US-16 | Als Prüfer möchte ich Änderungen anderer Mitarbeiter live sehen | Should | done (5-Sek-Polling in `useDb.ts`, pausiert bei Tab-Hintergrund) |
| US-17 | Als Werkstatt-Inhaber möchte ich, dass Kundendaten on-premise bleiben | Must | done (kein Cloud-DB-Zugriff, alles im LAN) |

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
| 9 | On-Premise-Deployment-Modell, Docker-Compose, Backup-Konzept | erledigt |
| 10 | Hardening + Architektur-Reife: API-404/409-Semantik, helmet/Rate-Limit, Compat-Layer-Abbau (ein View-Model), versionierte Migrationen (ADR-011), Benutzer/Rollen, Tailwind-Migration, UI-Interaktionstests | in Arbeit |

## 5. Technische Schulden

- CRUD-Integrationstests für Halter/Fahrzeug/Termin gegen die Docker-MariaDB
  sind offen (WF-01-Layer und Validierung sind abgedeckt, die Negativfälle
  laufen als Unit-Tests gegen `server/validate.js`).
- Backup-Tier-2-Cron-Skript und Tier-3-Offsite-Sync sind als Konzept
  dokumentiert (`docs/backup.md`), die Skripte stehen aus.
- Produktiver Betrieb über Netzwerkgrenzen hinweg bräuchte HTTPS
  (im LAN-Modell bewusst nicht umgesetzt); Passwort-Änderung läuft aktuell
  über die DB, ein Self-Service-Endpunkt fehlt.
