# TUEV Pruefstelle Pro

Verwaltungssystem fuer TUEV-Pruefstellen: Terminplanung, Fahrzeugverwaltung,
Maengelerfassung, Statistik und Pruefberichte aus einer React/Vite-Codebasis.

Diese Variante nutzt eine zentrale **MariaDB-Datenbank** ueber eine
**Express-API** in `server/index.js`. Die Browser-App spricht nicht direkt mit
der Datenbank, sondern ausschliesslich ueber HTTP-Endpunkte unter `/api`.

[![Tests](https://img.shields.io/badge/tests-133%20passing-brightgreen)](#testing)
[![Lint](https://img.shields.io/badge/eslint-0%20errors-brightgreen)](#testing)
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue)](#tech-stack)
[![Database](https://img.shields.io/badge/db-MariaDB-003545)](#tech-stack)
[![License](https://img.shields.io/badge/license-MIT-blue)](#lizenz)

## Features

- **Tagesplan**: Timeline- und Tabellenansicht, Termin-Anlage, Statuswechsel
  und Workflow-Guard fuer "Bestanden".
- **Fahrzeuge**: CRUD-Verwaltung mit Hersteller-, Modell- und Typ-Auswahl,
  Suche, Filter und HU-Faelligkeitsanzeige.
- **Maengelerfassung**: StVZO-Katalog plus Freitextmodus, Kategorien
  OM/LM/EM/HM/GM und Sperre fuer "Bestanden" bei blockierenden Maengeln.
- **Statistik**: Bestandsquoten, Pruefervergleich, Maengel nach Kategorie,
  Top-Maengel und Zeitraumfilter.
- **Berichte**: Suchbare Pruefliste mit Vorschau und A4-PDF-Export ueber den
  Browser-Print-Dialog.
- **Mobile-tauglich**: Bedienbar ab 360 px Viewport mit Sidebar-Overlay und
  Touch-tauglichen Controls.
- **Zentrale Persistenz**: MariaDB speichert Daten serverseitig, mehrere
  Browser/Clients arbeiten auf demselben Datenbestand.

## Architektur in 30 Sekunden

```text
React / Vite Frontend
  src/hooks/useDb.ts
  src/db/apiClient.ts
        |
        | HTTP / JSON (/api)
        v
Express API
  server/index.js
  server/db.js
        |
        | mariadb Node.js driver
        v
MariaDB
  halter, fahrzeug, termin, mangel
  status, pruefart, pruefer, mangel_kategorie
```

Die UI bleibt von SQL entkoppelt. `useDb` verwaltet React-State und ruft
`apiClient.ts` auf. Die Express-API validiert zentrale Workflow-Regeln, fuehrt
SQL gegen MariaDB aus und erstellt Tabellen sowie Stammdaten beim Start.

## Tech Stack

| Layer | Technologie | Zweck |
|---|---|---|
| Frontend | React 19, Vite 8 | SPA und Entwicklungsserver |
| Sprache | TypeScript fuer neue Module, JSX fuer Legacy-Views | Typsicherheit dort, wo Datenformen wichtig sind |
| API | Express 5, CORS, dotenv | HTTP-Schnittstelle zwischen Browser und DB |
| Persistenz | MariaDB, `mariadb` Node.js Driver | Zentrale relationale Datenhaltung |
| Desktop-Wrapper | Tauri 2 | Desktop-Build aus derselben Frontend-Codebasis |
| Styling | Tailwind CSS 4 | Utility-first Styling |
| Animation | Framer Motion | UI-Transitions |
| Charts | Recharts | Statistikdiagramme |
| Tests | Vitest 4, React Testing Library | Unit-, Component-, Hook- und DB-Tests |
| Linting | ESLint 9 | Statische Codequalitaet |
| Hosting | Firebase Hosting | Optionales Hosting der statischen Frontend-Dateien |

## Getting Started

### Voraussetzungen

- Node.js v18+
- Laufender MariaDB-Server auf `127.0.0.1:3306`
- Optional: Rust fuer den Tauri-Desktop-Build

### MariaDB einrichten

```sql
CREATE DATABASE IF NOT EXISTS tuv_workflow
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'tuv_app'@'localhost'
  IDENTIFIED BY 'tuv_app_pw';

GRANT ALL PRIVILEGES ON tuv_workflow.* TO 'tuv_app'@'localhost';
FLUSH PRIVILEGES;
```

`.env`:

```text
MARIADB_HOST=127.0.0.1
MARIADB_PORT=3306
MARIADB_USER=tuv_app
MARIADB_PASSWORD=tuv_app_pw
MARIADB_DATABASE=tuv_workflow
API_PORT=8787
VITE_API_BASE_URL=/api
```

Details stehen in [docs/mariadb-setup.md](docs/mariadb-setup.md).

### Lokal starten

Terminal 1:

```powershell
npm install
npm run api
```

Terminal 2:

```powershell
npm run dev
```

Vite oeffnet die App unter `http://localhost:5173` und proxyt `/api` an
`http://127.0.0.1:8787`. Die API legt Tabellen und Stammdaten automatisch an.

### Production-Build

```powershell
npm run build
```

Fuer den produktiven Webbetrieb muss die Express-API separat laufen und das
Frontend muss mit passender `VITE_API_BASE_URL` ausgeliefert werden.

## Datenbank

Die physische MariaDB-Struktur wird in `server/db.js` erstellt:

- `halter`
- `fahrzeug`
- `termin`
- `mangel`
- `status`
- `pruefart`
- `pruefer`
- `mangel_kategorie`

Die wichtigsten Integritaetsregeln liegen in MariaDB:

- Fremdschluessel zwischen Halter, Fahrzeug, Termin und Mangel
- `ON DELETE CASCADE` fuer abhaengige Termine und Maengel
- eindeutiges Kennzeichen und eindeutige FIN, soweit FIN gesetzt ist
- CHECK-Constraints fuer Baujahr und Kilometerstand
- Stammdatentabellen fuer Status, Pruefarten, Pruefer und Mangelkategorien

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
    apiClient.ts        HTTP-Client fuer /api
    schema.ts           TypeScript-Datentypen fuer die Frontend-Schicht
  hooks/
    useDb.ts            React-State-Hook ueber apiClient.ts
    useStoreCompat.ts   Adapter fuer Legacy-View-Shape
  views/                Tagesplan, Fahrzeuge, Statistik, Berichte
  features/             Modale fuer Fahrzeug, Termin und Mangel
  constants/            Status, Pruefarten, Maengelkatalog, KFZ-Referenzen
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
| [docs/mariadb-setup.md](docs/mariadb-setup.md) | Lokales MariaDB-Setup und Startbefehle |
| [docs/design.md](docs/design.md) | Architektur, Schichten, Datenfluss und Deployment |
| [docs/datenmodell.md](docs/datenmodell.md) | ER-Modell, 3NF-Schema und physisches MariaDB-Modell |
| [docs/pflichtenheft.md](docs/pflichtenheft.md) | Anforderungen, Akzeptanzkriterien und Rahmenbedingungen |
| [docs/testkonzept.md](docs/testkonzept.md) | Teststrategie und manuelle Smoke-Tests |
| [docs/test-coverage.md](docs/test-coverage.md) | Coverage- und Restrisiko-Uebersicht |
| [docs/backlog.md](docs/backlog.md) | Product Backlog und Sprint-Historie |
| [docs/quellen.md](docs/quellen.md) | Quellenverzeichnis |
| [docs/decisions/README.md](docs/decisions/README.md) | Architekturentscheidungen |

## Lizenz

MIT - Marwan Saleh, Oussama Hlayhel
