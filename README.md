# TÜV Prüfstelle Pro

Verwaltungssystem für TÜV-Prüfstellen: Terminplanung, Fahrzeugverwaltung,
Mängelerfassung, Statistik und Prüfberichte aus einer React/Vite-Codebasis.

Diese Variante nutzt eine zentrale **MariaDB-Datenbank** über eine
**Express-API** in `server/index.js`. Die Browser-App spricht nicht direkt mit
der Datenbank, sondern ausschließlich über HTTP-Endpunkte unter `/api`.

[![Tests](https://img.shields.io/badge/tests-136%20passing-brightgreen)](#testing)
[![Lint](https://img.shields.io/badge/eslint-0%20errors-brightgreen)](#testing)
[![TypeScript](https://img.shields.io/badge/typescript-graduell-blue)](#tech-stack)
[![Database](https://img.shields.io/badge/db-MariaDB-003545)](#tech-stack)
[![Deployment](https://img.shields.io/badge/deployment-on--premise-blueviolet)](#deployment)
[![License](https://img.shields.io/badge/license-MIT-blue)](#lizenz)

## Features

- **Tagesplan**: Timeline- und Tabellenansicht, Termin-Anlage, Statuswechsel
  und Workflow-Guard für "Bestanden".
- **Fahrzeuge**: CRUD-Verwaltung mit Hersteller-, Modell- und Typ-Auswahl,
  Suche, Filter und HU-Fälligkeitsanzeige.
- **Mängelerfassung**: StVZO-Katalog plus Freitextmodus, Kategorien
  OM/GM/EM/GfM und Sperre für "Bestanden" bei blockierenden Mängeln.
- **Statistik**: Bestandsquoten, Prüfervergleich, Mängel nach Kategorie,
  Top-Mängel und Zeitraumfilter.
- **Berichte**: Suchbare Prüfliste mit Vorschau und A4-PDF-Export über den
  Browser-Print-Dialog.
- **Mobile-tauglich**: Bedienbar ab 360 px Viewport mit Sidebar-Overlay und
  Touch-tauglichen Controls.
- **Zentrale Persistenz**: MariaDB speichert Daten serverseitig, mehrere
  Browser/Clients in der Prüfstelle arbeiten auf demselben Datenbestand.
- **On-Premise pro Kunde**: Jede Prüfstelle betreibt einen eigenen lokalen
  Server. Kundendaten verlassen die Werkstatt nie.

## Architektur in 30 Sekunden

```text
                Prüfstelle (lokales Netzwerk, ohne Internet betreibbar)

                ┌─────────────────────────────────────────┐
                │ Server-PC                               │
                │   docker compose up                     │
                │   ├── MariaDB           (Port 3306)     │
                │   └── Express-API       (Port 8787)     │
                └─────────────────────────────────────────┘
                              ▲
                              │ HTTP/JSON (/api)
                              │
              ┌───────────────┼──────────────┐
              │               │              │
        ┌─────┴────┐   ┌──────┴───┐   ┌──────┴───┐
        │ Empfang  │   │ Prüfer   │   │  Chef    │
        │ Browser  │   │ Browser  │   │ Browser  │
        └──────────┘   └──────────┘   └──────────┘
```

Die UI bleibt von SQL entkoppelt. `useDb` verwaltet React-State und ruft
`apiClient.ts` auf. Die Express-API validiert zentrale Workflow-Regeln, fuehrt
SQL gegen MariaDB aus und erstellt Tabellen sowie Stammdaten beim Start.

## Tech Stack

| Layer | Technologie | Zweck |
|---|---|---|
| Frontend | React 19, Vite 8 | SPA und Entwicklungsserver |
| Sprache | TypeScript für neue Module, JSX für Legacy-Views | Typsicherheit dort, wo Datenformen wichtig sind |
| API | Express 5, CORS, dotenv | HTTP-Schnittstelle zwischen Browser und DB |
| Persistenz | MariaDB, `mariadb` Node.js Driver | Zentrale relationale Datenhaltung |
| Desktop-Wrapper | Tauri 2 | Desktop-Build aus derselben Frontend-Codebasis |
| Styling | Tailwind CSS 4 | Utility-first Styling |
| Animation | Framer Motion | UI-Transitions |
| Charts | Recharts | Statistikdiagramme |
| Tests | Vitest 4, React Testing Library | Unit-, Component-, Hook- und DB-Tests |
| Linting | ESLint 9 | Statische Codequalität |
| Container | Docker Compose | On-Premise-Deployment (MariaDB + API + Frontend in einem Befehl) |

## Getting Started

Es gibt zwei Wege das Projekt zu starten. **Docker Compose ist der empfohlene
Weg** — ein Befehl startet MariaDB und Express-API mit Binary-Logging für
Backups. Der manuelle Weg ist nur für Setups gedacht, in denen kein Docker
verfügbar ist.

### Variante A — Docker Compose (empfohlen)

#### Voraussetzungen

- Docker Desktop (Windows/Mac) oder Docker Engine (Linux)
- Node.js v18+ (nur für das Vite-Frontend)

#### Setup

```powershell
copy .env.example .env
docker compose up -d
```

Das startet MariaDB (Port 3306) und die Express-API (Port 8787). Tabellen und
Stammdaten werden beim ersten Start angelegt.

Frontend dazu starten:

```powershell
npm install
npm run dev
```

Die App ist unter `http://localhost:5173` erreichbar. Vite proxyt `/api` an
`http://127.0.0.1:8787`.

Demo-Daten laden:

```powershell
Invoke-RestMethod -Method Post http://localhost:8787/api/admin/demo
```

### Variante B — Manuelles Setup ohne Docker

#### Voraussetzungen

- Node.js v18+
- Laufender MariaDB-Server auf `127.0.0.1:3306`
- Optional: Rust für den Tauri-Desktop-Build

#### MariaDB einrichten

```sql
CREATE DATABASE IF NOT EXISTS tuv_workflow
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'tuv_app'@'localhost'
  IDENTIFIED BY 'tuv_app_pw';

GRANT ALL PRIVILEGES ON tuv_workflow.* TO 'tuv_app'@'localhost';
FLUSH PRIVILEGES;
```

`.env` erstellen (siehe `.env.example`), dann:

```powershell
npm install
npm run dev:api    # Terminal 1
npm run dev        # Terminal 2
```

Details stehen in [docs/mariadb-setup.md](docs/mariadb-setup.md).

### Production-Build (Frontend statisch)

```powershell
npm run build
```

Im On-Premise-Modell laeuft die gesamte Anwendung (MariaDB, API, Frontend) in
der Prüfstelle. Das statische Frontend kann über einen Webserver oder direkt
über die API ausgeliefert werden; `VITE_API_BASE_URL` muss zur erreichbaren
API zeigen.

## Deployment

Die Anwendung ist als **On-Premise-Lösung pro Prüfstelle** konzipiert. Jede
Werkstatt betreibt einen eigenen Server-PC im internen Netzwerk; Mitarbeiter
verbinden sich vom Empfang, von Prüfer-Geräten oder Chef-PCs über das LAN
mit der zentralen Instanz.

Vorteile dieses Modells:

- **Datenschutz**: Kundendaten verlassen die Werkstatt nicht.
- **Keine Cloud-Kosten** für den Betrieb.
- **Volle Kontrolle über Backups** (siehe [docs/backup.md](docs/backup.md)).
- **Internetausfall** beeintraechtigt den Betrieb nicht.

Auslieferung an einen Kunden: `docker-compose.yml`, `.env`-Vorlage und
`docs/backup.md` werden übergeben, ein Server-PC bekommt Docker installiert.

## Datenbank

Die physische MariaDB-Struktur wird in `server/db.js` erstellt:

- `halter`
- `fahrzeug`
- `termin`
- `mangel`
- `status`
- `prüfart`
- `prüfer`
- `mangel_kategorie`

Die wichtigsten Integritätsregeln liegen in MariaDB:

- Fremdschlüssel zwischen Halter, Fahrzeug, Termin und Mangel
- `ON DELETE CASCADE` für abhängige Termine und Mängel
- eindeutiges Kennzeichen und eindeutige FIN, soweit FIN gesetzt ist
- CHECK-Constraints für Baujahr und Kilometerstand
- Stammdatentabellen für Status, Prüfarten, Prüfer und Mangelkategorien

## Testing

```powershell
npm test
npm run test:watch
npm run lint
npm run typecheck
npm run build
```

Aktueller Stand dieser Arbeitskopie:

- `npm run build` erfolgreich
- `npm run typecheck` erfolgreich
- API-Healthcheck gegen MariaDB erfolgreich
- `/api/fahrzeuge` konnte Daten aus MariaDB lesen

## Projekt-Struktur

```text
server/
  db.js                 MariaDB-Konfiguration, Migration und Stammdaten
  index.js              Express-API mit CRUD- und Admin-Endpunkten

src/
  db/
    apiClient.ts        HTTP-Client für /api
    types.ts            TypeScript-Datentypen für die Frontend-Schicht
  hooks/
    useDb.ts            React-State-Hook über apiClient.ts
    useStoreCompat.ts   Adapter für Legacy-View-Shape
  views/                Tagesplan, Fahrzeuge, Statistik, Berichte
  features/             Modale für Fahrzeug, Termin und Mangel
  constants/            Status, Prüfarten, Mängelkatalog, KFZ-Referenzen
  utils/                Validatoren und Datumsfunktionen
  tests/                Vitest-Tests

docs/                   Projekt- und Abgabedokumentation
docs/decisions/         Architecture Decision Records
src-tauri/              Tauri/Rust-Desktop-Shell
.github/workflows/      CI/CD-Pipelines
```

Die aktive Persistenz liegt in `server/db.js` und MariaDB.

## Dokumentation

| Datei | Inhalt |
|---|---|
| [docs/mariadb-setup.md](docs/mariadb-setup.md) | Lokales MariaDB-Setup (Docker und manuell) |
| [docs/backup.md](docs/backup.md) | 3-Tier-Backup-Strategie für On-Premise-Betrieb |
| [docs/design.md](docs/design.md) | Architektur, Schichten, Datenfluss und Deployment |
| [docs/datenmodell.md](docs/datenmodell.md) | ER-Modell, 3NF-Schema und physisches MariaDB-Modell |
| [docs/pflichtenheft.md](docs/pflichtenheft.md) | Anforderungen, Akzeptanzkriterien und Rahmenbedingungen |
| [docs/testkonzept.md](docs/testkonzept.md) | Teststrategie und manuelle Smoke-Tests |
| [docs/test-coverage.md](docs/test-coverage.md) | Coverage- und Restrisiko-Übersicht |
| [docs/backlog.md](docs/backlog.md) | Product Backlog und Sprint-Historie |
| [docs/quellen.md](docs/quellen.md) | Quellenverzeichnis |
| [docs/decisions/README.md](docs/decisions/README.md) | Architekturentscheidungen |

## Lizenz

MIT - Marwan Saleh, Oussama Hlayhel
