# TUV Prufstelle Pro

A vehicle inspection management system for TUV facilities, built as a Tauri desktop application with a React web frontend.

## Features

- **Tagesplan (Daily Schedule)** — Timeline and table views for managing daily inspections with real-time status tracking
- **Fahrzeuge (Vehicles)** — Full CRUD management of vehicle records with search, filtering, and inspection history
- **Statistik (Analytics)** — Interactive dashboards with pass-rate trends, inspector performance, defect breakdowns, and KPIs
- **Berichte (Reports)** — Generate, preview, and export official inspection reports as `.txt` files

## Tech Stack

| Layer       | Technology                            |
|-------------|---------------------------------------|
| Frontend    | React 19, Vite 8                      |
| Backend     | Firebase Firestore (Cloud NoSQL)      |
| Desktop     | Tauri 2 (Rust)                        |
| Styling     | Tailwind CSS 4, Framer Motion         |
| Charts      | Recharts                              |
| Testing     | Vitest, React Testing Library         |
| Linting     | ESLint 9 (flat config)                |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri desktop builds)

### Run in Browser

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run as Desktop App

```bash
npm install
npm run tauri dev
```

### Build for Production

```bash
npm run build          # web build
npm run tauri build    # desktop installer
```

## Testing

```bash
npm test               # run all tests
npm run test:watch     # watch mode
npm run lint           # ESLint check
```

## Project Structure

```
src/
  views/          Page-level components (Tagesplan, Fahrzeuge, Statistik, Berichte)
  components/     Reusable UI components (buttons, inputs, modals, pills)
  features/       Feature-specific forms (FahrzeugModal, TerminModal, MaengelModal)
  hooks/          Custom hooks (useStore, useToasts)
  constants/      Lookup tables (status, inspection types, defect catalog)
  utils/          Helper functions (date formatting, defect logic)
  styles/         Theme configuration
  tests/          Unit and component tests
src-tauri/        Tauri (Rust) desktop shell
```

## License

MIT
