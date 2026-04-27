# TÜV Prüfstelle Pro

Verwaltungssystem für TÜV-Prüfstellen — Hauptuntersuchung-Workflow von der
Terminplanung bis zum amtlichen Prüfbericht. Web-App und native Desktop-App
aus einer Codebasis.

[![Tests](https://img.shields.io/badge/tests-114%20passing-brightgreen)](#testing)
[![Lint](https://img.shields.io/badge/eslint-0%20errors-brightgreen)](#testing)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)

**Live-Demo:** [tuv-workflow.web.app](https://tuv-workflow.web.app)

---

## Features

- **Tagesplan** — Timeline- oder Tabellenansicht mit Echtzeit-Status, Termin-Anlage per Klick auf einen Zeitslot, Auto-Workflow „Starten / Fertig"
- **Fahrzeuge** — Vollständige CRUD-Verwaltung mit abhängigen Dropdowns für Hersteller / Modell / Typ, Suche, Filter, HU-Fälligkeits-Anzeige farbcodiert
- **Mängelerfassung** — StVZO-Anlage-VIII-Katalog mit ~100 Einträgen, plus Freitext-Modus für Sonderfälle, mit Mehrstufiger Bestanden-bei-Hauptmangel-Sperre
- **Statistik** — Bestandsquoten-Trend, Prüfer-Leistungs-Vergleich, Mängel-nach-Kategorie-Pie, Top-10-Mängel, Zeitraumfilter (7/30/90/365 d)
- **Berichte** — Suchbare Liste aller Prüfungen mit Filtern, Vorschau-Modal, **Export als amtlich aussehendes A4-PDF** (Browser-Druck-Engine, keine externe Library)
- **Mobile-tauglich** — vollständig bedienbar ab 360 px Viewport, Sidebar als Overlay mit Hamburger-Menu, Touch-Targets ≥ 36 px
- **Offline-fähig** — LocalStorage-Cache mit 3-Sekunden-Loading-Fallback, falls Firestore nicht antwortet

## Validierung in drei Verteidigungslinien

1. **UX-Strukturierung** — Cascading Dropdowns verhindern Tippfehler strukturell
   („BMW Polo" oder „VW Golf als Motorrad" sind nicht auswählbar)
2. **Hard-Validation** — `validators.js` prüft Format und Wertebereich, KBA-
   Kreis-Code-Liste mit ~430 deutschen Codes, Saison-Kennzeichen-Format,
   Eindeutigkeit, Workflow-Regeln nach § 29 StVZO
3. **Soft-Warnings** — ISO-3779-FIN-Prüfziffer als Hinweis (blockt nicht, weil
   pre-1981 / nicht-Nordamerika-Fahrzeuge keine Prüfziffer tragen)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · Vite 8 |
| Persistenz | Firebase Firestore (EU-Region `europe-west1`) + LocalStorage-Fallback |
| Desktop-Wrapper | Tauri 2 (Rust) |
| Animation | Framer Motion |
| Charts | Recharts |
| Tests | Vitest 4 · React Testing Library |
| Linting | ESLint 9 (flat config) mit `react/prop-types: error` |

## Getting Started

### Voraussetzungen

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install) (nur für Tauri-Desktop-Build)

### Im Browser starten

```bash
npm install
npm run dev
```

Öffnet auf [http://localhost:5173](http://localhost:5173).

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

### Auf Firebase Hosting deployen

```bash
firebase deploy --only hosting --project tuv-prufstelle-pro
```

Live-URL: `https://tuv-workflow.web.app`

## Testing

```bash
npm test               # Vitest run, alle Tests
npm run test:watch     # Watch-Mode für Entwicklung
npm run lint           # ESLint-Check (muss 0 Errors zeigen)
```

**Aktuelle Bilanz:** 114 Tests grün (Unit + Component + Hook), 0 Lint-Errors.

Test-Verfahren (siehe `docs/testkonzept.md` für Details):
- Äquivalenzklassenbildung bei allen Validatoren
- Grenzwertanalyse bei numerischen Feldern
- Entscheidungstabelle bei Workflow-Regeln
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
  hooks/
    useStore.js         Firestore-Sync + LocalStorage-Cache + 3-s-Fallback
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
    mangel.js           hatHauptmangel-Helper
    date.js             Date-Formatter (de-DE)
  types/
    propTypes.js        Wiederverwendbare PropTypes-Shapes
  styles/
    theme.js            Color-Palette, Fonts, GLOBAL_CSS mit Mobile-Klassen
  tests/                Vitest-Tests
docs/                   Vollständige Projekt-Dokumentation (siehe unten)
src-tauri/              Tauri/Rust-Desktop-Shell
```

## Dokumentation

Vollständige Doku im `docs/`-Ordner — geschrieben für die Software-Projekt-
Abgabe (Hochschule Hannover, IIM-211-01):

| Datei | Inhalt | Umfang |
|---|---|---|
| [`pflichtenheft.md`](docs/pflichtenheft.md) | Funktionale + nicht-funktionale Anforderungen, Akzeptanzkriterien, Lastprofil, Performance-Begründung mit Nielsen-Tabelle, Datenschutz/Sicherheit | ~280 Zeilen |
| [`datenmodell.md`](docs/datenmodell.md) | ER-Diagramm, vollständige Attributlisten, 4 Integritätsebenen, NoSQL-vs-RDBMS-Diskussion mit SQL-Gegenentwurf | ~340 Zeilen |
| [`design.md`](docs/design.md) | Komponentendiagramm, Klassendiagramm, useStore-Hook, Validierungs-Pipeline, Bericht-PDF-Generierung, Mobile-Strategie | ~400 Zeilen |
| [`backlog.md`](docs/backlog.md) | Product Backlog (~25 User Stories, MoSCoW + Story Points), Definition of Done, 5 Sprint-Historie | ~210 Zeilen |
| [`testkonzept.md`](docs/testkonzept.md) | Testpyramide, 4 Testentwurfsverfahren mit Beispielen, manuelle Smoke-Test-Tabelle | ~210 Zeilen |
| [`antwort_mail_fuchs.md`](docs/antwort_mail_fuchs.md) | Mail-Entwurf für Dozentin nach Feedback-Runde 1 | ~95 Zeilen |
| [`treffen_brief.md`](docs/treffen_brief.md) | Spickzettel für f2f-Termin mit Dozentin | ~160 Zeilen |

Plus `praesentation.html` — 15-Slides-Projekt-Präsentation, druckbar als PDF
über Browser-Druck.

## Architektur in 30 Sekunden

```
┌────── PRÄSENTATION ──────┐
│  Tagesplan / Fahrzeuge  │
│  Statistik / Berichte   │
└─────────┬───────────────┘
          │ Custom Hooks
          ▼
┌──────── LOGIK ───────────┐
│  useStore  validators    │
│  useToasts  kfzReferenz  │
└─────────┬────────────────┘
          │
          ▼
┌──── INFRASTRUKTUR ───────┐
│  Firebase Firestore      │
│  LocalStorage  Tauri     │
└──────────────────────────┘
```

3-Schichten, Custom-Hook statt Redux, Inline-Styles + Theme-Modul statt CSS-
Module. Begründungen je Tech-Wahl in `docs/design.md` § 1.2.

## Sprint-Status

| Sprint | Fokus | Story Points | Status |
|---|---|---|---|
| 1 | Setup, Tooling | — | ✅ |
| 2 | Fahrzeug-CRUD | 15 | ✅ |
| 3 | Tagesplan & Termine | 15 | ✅ |
| 4 | Mängel, Berichte, Statistik | 37 | ✅ |
| 5 | Validierung, UX, Doku, PDF, Mobile | 63 | ✅ |
| 6 | Feinschliff & Abgabe | ~10 | ⏳ |

## Lizenz

MIT
