# TÜV Prüfstelle Pro

Verwaltungssystem für TÜV-Prüfstellen — Hauptuntersuchung-Workflow von der
Terminplanung bis zum amtlichen Prüfbericht. Web-App und native Desktop-App
aus einer Codebasis. Lokale PostgreSQL-Persistenz im Browser ohne Backend-Server.

[![Tests](https://img.shields.io/badge/tests-133%20passing-brightgreen)](#testing)
[![Lint](https://img.shields.io/badge/eslint-0%20errors-brightgreen)](#testing)
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue)](#tech-stack)
[![Database](https://img.shields.io/badge/db-PostgreSQL%20%28PGlite%29-336791)](#tech-stack)
[![License](https://img.shields.io/badge/license-MIT-blue)](#lizenz)

**Live-Demo:** [tuv-workflow.web.app](https://tuv-workflow.web.app)

---

## Features

- **Tagesplan** — Timeline- oder Tabellenansicht mit Echtzeit-Status, Termin-Anlage per Klick auf einen Zeitslot, Auto-Workflow „Starten / Fertig"
- **Fahrzeuge** — Vollständige CRUD-Verwaltung mit abhängigen Dropdowns für Hersteller / Modell / Typ, Suche, Filter, HU-Fälligkeits-Anzeige farbcodiert
- **Mängelerfassung** — StVZO-Anlage-VIII-Katalog mit ~100 Einträgen, plus Freitext-Modus für Sonderfälle, mit mehrstufiger Bestanden-bei-Hauptmangel-Sperre (WF-01)
- **Statistik** — Bestandsquoten-Trend, Prüfer-Leistungs-Vergleich, Mängel-nach-Kategorie-Pie, Top-10-Mängel, Zeitraumfilter (7/30/90/365 d)
- **Berichte** — Suchbare Liste aller Prüfungen mit Filtern, Vorschau-Modal, **Export als amtlich aussehendes A4-PDF** (Browser-Druck-Engine, keine externe Library)
- **Mobile-tauglich** — vollständig bedienbar ab 360 px Viewport, Sidebar als Overlay mit Hamburger-Menu, Touch-Targets ≥ 36 px
- **Offline-first** — komplette Daten-Schicht im Browser via PGlite (PostgreSQL als WebAssembly), Persistenz in IndexedDB, keine Cloud nötig

## Architektur in 30 Sekunden

```
┌─────────── PRÄSENTATION ──────────┐
│  TagesplanView · FahrzeugeView    │
│  StatistikView · BerichteView     │
└────────────┬──────────────────────┘
             │ React-Hooks (useDb, useStoreCompat)
             ▼
┌─────────── DOMÄNE ────────────────┐
│  queries.ts (Repository-Pattern)  │
│  validators.js (3-Linien-Modell)  │
│  WF-01 Defense-in-Depth           │
└────────────┬──────────────────────┘
             │ Drizzle ORM (type-safe SQL)
             ▼
┌─────────── PERSISTENZ ────────────┐
│  PGlite — Postgres als WASM       │
│  IndexedDB (browser-lokal)        │
│  3NF-Schema mit FK-Constraints    │
└───────────────────────────────────┘
```

**Drei sauber getrennte Schichten** — Präsentation, Domäne, Persistenz.
Die Begründung jeder Tech-Wahl liegt als eigenes Architecture-Decision-Record
unter `docs/decisions/` (siehe [Dokumentation](#dokumentation)).

## Tech Stack

| Layer | Technologie | Warum |
|---|---|---|
| Frontend | React 19 · Vite 8 | Moderne Hooks-API, schnelles Dev-Tooling |
| Sprache | TypeScript (strict) für neue Module, JSX für Legacy | Type-Safety wo es zählt (siehe ADR-005) |
| Persistenz | **PGlite 0.4** (PostgreSQL als WebAssembly) + IndexedDB | Echte relationale DB ohne Backend (siehe ADR-001) |
| ORM | **Drizzle ORM 0.45** | Type-safe SQL, Migration-Tooling (siehe ADR-004) |
| Desktop-Wrapper | Tauri 2 (Rust) | Cross-Platform-Desktop aus selber Codebasis |
| Styling | Tailwind CSS 4 | Utility-First, keine globalen CSS-Konflikte |
| Animation | Framer Motion | Komponenten-basierte Transitions |
| Charts | Recharts | Deklaratives Charting für React |
| Tests | **Vitest 4** · React Testing Library | 133 Tests, 95%+ Coverage |
| Linting | ESLint 9 (flat config) | `react/prop-types: error` |
| CI/CD | GitHub Actions | Lint + Test + Build auf jeden PR (siehe `.github/workflows/`) |
| Hosting | Firebase Hosting | Statische Dateien — nicht Firestore (siehe ADR-006) |

## Validierung in drei Verteidigungslinien

1. **UX-Strukturierung** — Cascading Dropdowns verhindern Tippfehler strukturell
   („BMW Polo" oder „VW Golf als Motorrad" sind nicht auswählbar)
2. **Hard-Validation (App-Layer)** — `validators.js` prüft Format und Wertebereich,
   KBA-Kreis-Code-Liste mit ~430 deutschen Codes, Saison-Kennzeichen-Format,
   Kennzeichen-Eindeutigkeit, FIN-Eindeutigkeit (partial UNIQUE), Workflow-Regeln
   nach § 29 StVZO
3. **DB-Layer Constraints** — FK-Constraints (CASCADE / RESTRICT), partielle
   UNIQUE-Indizes, CHECK-Constraints für Wertebereiche (`baujahr >= 1900`,
   `kilometerstand >= 0`)

Plus **Soft-Warnings** — ISO-3779-FIN-Prüfziffer als Hinweis (blockt nicht, weil
pre-1981 / nicht-Nordamerika-Fahrzeuge keine Prüfziffer tragen).

## Getting Started

### Voraussetzungen

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install) (nur für Tauri-Desktop-Build)

### Im Browser starten

```bash
npm install
npm run dev
```

Öffnet auf [http://localhost:5173](http://localhost:5173). Beim ersten Start wird
automatisch eine lokale PostgreSQL-Datenbank in der IndexedDB des Browsers angelegt
und mit Beispieldaten gefüllt.

### Als Desktop-App starten

```bash
npm install
npm run tauri dev
```

### Production-Builds

```bash
npm run build          # Web-Build (dist/)
npm run tauri build    # Desktop-Installer (Win/Mac/Linux)
```

### Datenbank-Workflow

```bash
npm run db:generate    # Schema-Änderungen → neue SQL-Migration
npm run db:studio      # Drizzle-Studio (visuelle DB-Inspektion)
```

### Auf Firebase Hosting deployen

```bash
firebase deploy --only hosting --project tuv-prufstelle-pro
```

Live-URL: `https://tuv-workflow.web.app`

GitHub Actions deployt automatisch bei Push auf `master` — siehe
`.github/workflows/deploy.yml`.

## Testing

```bash
npm test               # Vitest run, alle Tests
npm run test:watch     # Watch-Mode für Entwicklung
npm run lint           # ESLint-Check (muss 0 Errors zeigen)
npm run typecheck      # TypeScript strict mode (muss 0 Errors zeigen)
```

**Aktuelle Bilanz:** 133 Tests grün (Unit + Component + Hook + DB-Integration),
0 Lint-Errors, 0 TypeScript-Errors.

Test-Verfahren (siehe [`docs/testkonzept.md`](docs/testkonzept.md) für Details):
- Äquivalenzklassenbildung bei allen Validatoren
- Grenzwertanalyse bei numerischen Feldern
- Entscheidungstabelle bei Workflow-Regeln
- DB-Integrations-Tests gegen In-Memory-PGlite (FK, CASCADE, UNIQUE, CHECK)
- Regression-Tests aus Bug-Reports
- Manuelle Smoke-Tests vor jeder Abgabe (mobile, PDF-Export)

## Projekt-Struktur

```
src/
  views/                Page-Level-Komponenten
    TagesplanView.jsx   Timeline + Tabellenansicht der Tages-Termine
    FahrzeugeView.jsx   Fahrzeug-CRUD mit Detail-Slide-In
    StatistikView.jsx   KPIs + Recharts-Diagramme
    BerichteView.jsx    Listen-View + buildBerichtHtml für PDF-Export
  components/
    ui/                 Wiederverwendbare UI-Bausteine (Inp, Sel, BtnP, Kpi, Pills)
    modal/              Modal + ConfirmModal
  features/
    fahrzeug/           FahrzeugModal mit Cascading-Dropdowns
    termin/             TerminModal mit Status-Workflow-Guard
    mangel/             MaengelModal mit StVZO-Katalog-Browser
  db/                   Datenbank-Schicht (TypeScript strict)
    schema.ts           Drizzle-Schema mit Relations
    client.ts           PGlite + Drizzle Singleton
    queries.ts          Repository-Pattern, 30+ typsichere Funktionen
    seed.ts             Domain- und Demo-Daten
    migrate.ts          SQL-Migrations-Runner
    migrations/         Auto-generierte SQL-Migrations-Files
    db.test.ts          12 DB-Integrations-Tests
  hooks/
    useDb.ts            Native React-Hook über queries.ts
    useStoreCompat.ts   Adapter für Legacy-View-Shape
    useToasts.js        Sonner-Wrapper
    useIsMobile.js      Viewport-Detection für responsive Layout
  constants/
    fahrzeug.js         FAHRZEUG_TYPEN-Enum
    status.js           STATUS-Enum + STATUS_CFG (Farben, Labels)
    pruefung.js         PRÜFUNG_ARTEN, PRÜFER
    mangel.js           MANGEL_KATEGORIEN (OM/LM/EM/HM/GM)
    kfzReferenz.js      ~25 Hersteller mit Modellen + Typen
    kfzKreis.js         ~430 deutsche KBA-Kreis-Codes
    nav.js              Sidebar-Navigationseinträge
  utils/
    validators.js       Hard- und Soft-Validatoren
    date.js             Date-Formatter (de-DE)
  styles/
    theme.js            Color-Palette, Fonts, GLOBAL_CSS mit Mobile-Klassen
  tests/                Vitest-Tests
docs/                   Vollständige Projekt-Dokumentation (siehe unten)
docs/decisions/         Architecture Decision Records (8 ADRs)
src-tauri/              Tauri/Rust-Desktop-Shell
.github/workflows/      CI/CD-Pipelines (ci.yml, deploy.yml)
```

## Dokumentation

Vollständige Doku im `docs/`-Ordner — geschrieben für die Software-Projekt-
Abgabe (Hochschule Hannover, IIM-211-01):

### Pflicht-Dokumente

| Datei | Inhalt | Umfang |
|---|---|---|
| [`pflichtenheft.md`](docs/pflichtenheft.md) | Funktionale + nicht-funktionale Anforderungen, Akzeptanzkriterien, Lastprofil, Datenschutz/Sicherheit | ~280 Zeilen |
| [`datenmodell.md`](docs/datenmodell.md) | **3-Schichten-DB-Doku (v2.0)**: konzeptuelles ER, logisches 3NF-Schema, physisches PostgreSQL/PGlite-Modell | ~540 Zeilen |
| [`design.md`](docs/design.md) | Komponentendiagramm, Klassendiagramm, Validierungs-Pipeline, Bericht-PDF-Generierung, Mobile-Strategie | ~400 Zeilen |
| [`architecture-map.html`](docs/architecture-map.html) | Interaktive Architekturkarte nach der PGlite-Migration |
| [`backlog.md`](docs/backlog.md) | Product Backlog (~25 User Stories, MoSCoW + Story Points), Definition of Done, Sprint-Historie | ~210 Zeilen |
| [`testkonzept.md`](docs/testkonzept.md) | Testpyramide, 4 Testentwurfsverfahren mit Beispielen, manuelle Smoke-Test-Tabelle | ~210 Zeilen |
| [`test-coverage.md`](docs/test-coverage.md) | Coverage-Bericht mit V8-Engine | ~120 Zeilen |

### Architektur-Entscheidungen (ADRs)

| Datei | Entscheidung |
|---|---|
| [`decisions/001-pglite-statt-firestore.md`](docs/decisions/001-pglite-statt-firestore.md) | PGlite statt Firestore — lokale relationale DB |
| [`decisions/002-3nf-normalisierung.md`](docs/decisions/002-3nf-normalisierung.md) | 3NF-Schema mit eigenen Relationen für Halter und Mangel |
| [`decisions/003-wf01-enforcement.md`](docs/decisions/003-wf01-enforcement.md) | Defense-in-Depth: App + Stored Procedure, kein Trigger |
| [`decisions/004-drizzle-orm.md`](docs/decisions/004-drizzle-orm.md) | Drizzle ORM als typsichere SQL-Abstraktion |
| [`decisions/005-typescript-graduell.md`](docs/decisions/005-typescript-graduell.md) | TypeScript-Einführung graduell, neue Module zuerst |
| [`decisions/006-firebase-hosting.md`](docs/decisions/006-firebase-hosting.md) | Firebase Hosting (nicht Firestore) für statische Dateien |
| [`decisions/007-repository-pattern.md`](docs/decisions/007-repository-pattern.md) | Repository-Pattern: SQL zentral in `queries.ts` |
| [`decisions/008-keine-eingebetteten-arrays.md`](docs/decisions/008-keine-eingebetteten-arrays.md) | Mangel und Halter als separate Tabellen, nicht JSONB |

### Quellen und KI-Transparenz

| Datei | Inhalt |
|---|---|
| [`quellen.md`](docs/quellen.md) | **Literaturverzeichnis** — Kemper/Eickler, Codd, Chen, Fowler, Evans, Scrum-Guide, StVZO, VdTÜV-916, mit Zitier-Konvention |
| [`ki-nutzung.md`](docs/ki-nutzung.md) | Methodik der KI-Nutzung — verwendete Tools, Beispiel-Prompts, 3-Linien-Validierungs-Strategie, Domänen-Experte-Argument |
| [`ki_nutzungserklaerung.md`](docs/ki_nutzungserklaerung.md) | Formelle KI-Nutzungs-Erklärung mit Unterschrift |
| [`eigenstaendigkeitserklaerung.md`](docs/eigenstaendigkeitserklaerung.md) | Eigenständigkeitserklärung mit Aufgabenverteilung |

### Nacharbeit

| Datei | Inhalt |
|---|---|
| [`nacharbeit_fuchs.html`](docs/nacharbeit_fuchs.html) | Übersichtsdokument der Nacharbeit nach dem Review-Termin vom 12. Mai |

## Sprint-Status

| Sprint | Fokus | Status |
|---|---|---|
| 1 | Setup, Tooling | ✅ |
| 2 | Fahrzeug-CRUD | ✅ |
| 3 | Tagesplan & Termine | ✅ |
| 4 | Mängel, Berichte, Statistik | ✅ |
| 5 | Validierung, UX, Doku, PDF, Mobile (Sprint-5-Feedback Frau Fuchs) | ✅ |
| 6 | Feinschliff, Security, Code-Splitting, Abgabe-Doku | ✅ |
| 7 | **PGlite-Migration, 3NF-Schema, ADRs, CI/CD, Doku-Refactor** | ✅ |

## Lizenz

MIT — Marwan Saleh, Oussama Hlayhel
