# Software-Design — TÜV Prüfstelle Pro

**Dokumentiert:** Architektur-Entscheidungen, Komponentenstruktur, Klassenmodell,
Datenfluss und Begründungen der gemachten Design-Entscheidungen.

---

## 1. Architekturüberblick

### 1.1 Layer-Struktur

```
┌─────────────────────────────────────────────────────────────┐
│                         PRÄSENTATION                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Tagesplan │  │Fahrzeuge │  │Statistik │  │Berichte  │    │
│  │  View    │  │  View    │  │  View    │  │  View    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│       │             │             │             │            │
│       └─────────────┴──────┬──────┴─────────────┘            │
│                            ▼                                 │
│                      ┌──────────┐                            │
│                      │  App.jsx │  Routing, Layout, State    │
│                      └──────────┘                            │
├─────────────────────────────────────────────────────────────┤
│                         LOGIK                                │
│     ┌──────────────┐      ┌────────────────┐                 │
│     │  useStore    │      │   useToasts    │                 │
│     │   Hook       │      │     Hook       │                 │
│     └──────────────┘      └────────────────┘                 │
│            │                                                 │
│            ▼                                                 │
│     ┌──────────────┐      ┌──────────────┐                   │
│     │  validators  │      │    mangel    │                   │
│     │  (utils)     │      │   (utils)    │                   │
│     └──────────────┘      └──────────────┘                   │
├─────────────────────────────────────────────────────────────┤
│                    INFRASTRUKTUR                             │
│      ┌───────────────────┐       ┌─────────────────┐         │
│      │ Firebase Firestore│       │  LocalStorage   │         │
│      │   (primär)        │       │  (Offline Cache)│         │
│      └───────────────────┘       └─────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technologie-Entscheidungen mit Begründung

| Entscheidung | Alternative(n) | Begründung |
|---|---|---|
| **React 19** mit Vite | Next.js, Remix | SPA ausreichend (kein SEO, keine Serverseitiges Rendering nötig); Vite bietet schnellsten DX mit HMR; React 19 bringt stabile `useOptimistic`/Actions — für künftige Auth-Integration hilfreich |
| **Tauri 2** (Rust) | Electron, PWA | Kompakte Binary (~6 MB vs. ~150 MB Electron), native Performance, Rust-Backend reduziert Angriffsfläche — für künftige lokale Hardware-Integration (OBD-Diagnose) kriticher als Electron |
| **Firestore (NoSQL)** | PostgreSQL + Node-Backend, Supabase | **Diese Entscheidung wurde von Frau Fuchs kritisch hinterfragt** — ausführliche Diskussion in `datenmodell.md` Abschnitt "NoSQL vs. RDBMS". Kurzfassung: Echtzeit-Sync out-of-the-box, serverloses Backend, realistisches Modell für eingebettete Mängel — ABER: bei wachsendem Reporting-Bedarf wäre RDBMS mittelfristig sauberer |
| **Recharts** | Chart.js, D3 | React-nativ, deklarativ, ausreichend für die 3–4 benötigten Chart-Typen |
| **Framer Motion** | CSS-only, react-spring | Deklarative Animationen direkt auf Komponenten; unterstützt `AnimatePresence` für Seitenübergänge |
| **Keine zentrale State-Management-Lib** (Redux/Zustand) | Redux Toolkit, Zustand | Bei ~20 Top-Level-Komponenten reicht `useStore`-Custom-Hook; kein Props-Drilling-Problem, das Redux rechtfertigen würde |
| **Inline-Styles + Tailwind-Resets** | CSS-Module, styled-components | Rapid Prototyping; Theme-Objekt `C` in `styles/theme.js` zentralisiert Farben; Tailwind wurde ursprünglich für Utility-Klassen eingebunden, hat sich in der Umsetzung aber auf globale Resets beschränkt |

### 1.3 Kern-Entwurfsprinzipien

1. **Single Responsibility** — jede Komponente hat genau eine Aufgabe. `Kpi.jsx`
   zeigt eine Kennzahl; `StatusPill.jsx` rendert genau einen Status als Pill.
2. **Composition over Configuration** — Views komponieren UI-Bausteine, statt
   sie über große Prop-Objekte zu konfigurieren.
3. **Custom Hooks isolieren Logik** — `useStore`, `useToasts` trennen
   Geschäftslogik/State-Management von UI-Komponenten.
4. **Shared Shapes** — `src/types/propTypes.js` enthält wiederverwendbare
   PropTypes-Definitionen (`FahrzeugShape`, `TerminShape`, `MangelShape`,
   `ToastShape`), damit Typ-Definitionen nicht dupliziert werden.
5. **Defense in Depth bei Business-Regeln** — Regel "kein BESTANDEN bei
   Hauptmangel" wird auf **vier** Ebenen durchgesetzt: UI-Button (disabled),
   Dropdown-Option (disabled), auto-advance-Funktion, Store-Guard. Beim Ausfall
   einer Ebene greifen die anderen.

## 2. Komponentendiagramm

```mermaid
graph TB
  subgraph "Einstiegspunkt"
    main[main.jsx]
    app[App.jsx]
  end

  subgraph "Layout"
    sidebar[Sidebar]
    topbar[Topbar]
  end

  subgraph "Views"
    tp[TagesplanView]
    fv[FahrzeugeView]
    sv[StatistikView]
    bv[BerichteView]
  end

  subgraph "Feature-Modals"
    fm[FahrzeugModal]
    tm[TerminModal]
    mm[MaengelModal]
  end

  subgraph "UI-Bausteine"
    modal[Modal]
    confirm[ConfirmModal]
    inputs["Inp / Sel / Fld"]
    buttons["BtnP / BtnG / IconBtn"]
    pills["StatusPill / MangelPill / HauptmangelBadge"]
    others["Kpi / EmptyState / SectionHead / Toast"]
  end

  subgraph "Logik"
    useStore[useStore hook]
    useToasts[useToasts hook]
    validators[utils/validators]
    mangelU[utils/mangel]
    dateU[utils/date]
  end

  subgraph "Infrastruktur"
    firestore[(Firebase Firestore)]
    localstorage[(LocalStorage)]
  end

  main --> app
  app --> sidebar & topbar
  app --> tp & fv & sv & bv
  app --> useStore & useToasts

  tp --> fm
  tp --> tm
  tp --> mm
  fv --> fm
  fv --> confirm

  fm --> modal & inputs & buttons & validators
  tm --> modal & inputs & buttons & mangelU
  mm --> modal & inputs & buttons & pills & mangelU
  confirm --> modal & buttons

  tp & fv & sv & bv --> pills & others

  useStore --> firestore
  useStore --> localstorage
  useStore --> mangelU
```

**Wichtige Abhängigkeits-Regeln:**

- UI-Bausteine importieren **keine** Logik-Hooks — sie sind rein visuell
- Views importieren UI-Bausteine und Custom Hooks; keine direkten Firestore-Aufrufe
- `utils/*` enthält reine Funktionen (pure) ohne Seiteneffekte
- Infrastruktur-Zugriff nur über `useStore` — keine direkten `setDoc`-Aufrufe in Views

## 3. Klassendiagramm / Typen-Modell

JavaScript hat keine Klassen im traditionellen Sinne; das Datenmodell ist als
Objekt-Schema definiert. Die folgende UML-Notation zeigt die logischen
Entitäten und ihre Beziehungen.

```mermaid
classDiagram
  class Fahrzeug {
    +string id «PK, uid»
    +string kennzeichen «unique, DE-Format»
    +string fin «17 Zeichen, optional»
    +string hersteller «required»
    +string modell «required»
    +number baujahr «≥ 1885, ≤ Jahr+1»
    +string farbe
    +string typ «aus FAHRZEUG_TYPEN»
    +number kmStand «≥ 0»
    +string besitzer «required»
    +string telefon «nur Ziffern/+()-/»
    +string email «RFC-basic»
    +string hu_faellig «ISO-Datum»
    +string createdAt «ISO-Datum»
  }

  class Termin {
    +string id «PK, uid»
    +string fahrzeugId «FK → Fahrzeug.id»
    +string datum «ISO-Datum»
    +string uhrzeit «HH:MM, 30-min-Raster»
    +string art «aus PRUEFUNG_ARTEN»
    +string pruefer «aus PRUEFER»
    +string status «aus STATUS»
    +string notiz
    +Mangel[] mängel «eingebettet»
    +string createdAt
  }

  class Mangel {
    +string id «PK, uid»
    +string code «StVZO-Referenz»
    +string text
    +string kat «OM|LM|EM|HM|GM»
    +bool behoben
  }

  class STATUS {
    <<enumeration>>
    GEPLANT
    IN_PRUEFUNG
    BESTANDEN
    NICHT_BESTANDEN
    NACHPRUEFUNG
    NICHT_ERSCHIENEN
    ABGEBROCHEN
  }

  class MANGEL_KATEGORIE {
    <<enumeration>>
    OM «Ohne Mangel»
    LM «Geringer Mangel»
    EM «Erheblicher Mangel»
    HM «Hauptmangel»
    GM «Gefährlicher Mangel»
  }

  Fahrzeug "1" --o "N" Termin : hat
  Termin "1" --o "N" Mangel : enthält
  Termin --> STATUS : kat
  Mangel --> MANGEL_KATEGORIE : kat
```

### 3.1 Designentscheidungen am Modell

| Entscheidung | Begründung |
|---|---|
| **`Mangel` als eingebettetes Array in `Termin`** (nicht eigene Top-Level-Collection) | Mängel haben keine eigenständige Existenz — sie gehören immer zu genau einem Termin, werden immer im Kontext gelesen/geschrieben. Eingebettetes Modell spart Firestore-Reads (1 statt N+1). Wäre als JOIN in SQL unelegant, in Firestore idiomatisch |
| **`fahrzeugId` als Fremdschlüssel in `Termin`** | Klassische 1:N-Relation. Fahrzeug kann viele Termine haben, jeder Termin gehört zu genau einem Fahrzeug. Kein `terminIds`-Array im Fahrzeug, da die Richtung N→1 effizienter ist |
| **IDs als UUIDs (client-generiert via `uid()`)** | Ermöglicht optimistisches Update (Client erzeugt die ID vor dem Write, zeigt das neue Objekt sofort an) |
| **Status und Mangelkategorie als Enumerations in eigenen Konstanten-Modulen** | Zentrale Wahrheit; Änderungen an zulässigen Werten an einer Stelle |
| **`kmStand`, `baujahr` nullable** | Nicht jedes Fahrzeug hat bei Erstanlage alle Daten; Pflicht wären Kennzeichen + Hersteller/Modell + Halter |
| **`HU_FAELLIG` als ISO-Datum-String** (nicht Firestore `Timestamp`) | Vereinfacht Vergleiche und Sortierung; Firestore-Timestamps hätten Serialisierungs-Overhead |

## 4. State-Management: `useStore`

```mermaid
sequenceDiagram
  participant UI as Views / Modals
  participant Hook as useStore
  participant Local as LocalStorage
  participant Cloud as Firestore
  
  Note over Hook: Mount
  Hook->>Cloud: onSnapshot(fahrzeuge)
  Hook->>Cloud: onSnapshot(termine)
  Cloud-->>Hook: Snapshot Fahrzeuge
  Cloud-->>Hook: Snapshot Termine
  Hook->>Local: Cache schreiben
  Hook->>UI: State-Update

  Note over UI: User speichert Fahrzeug
  UI->>Hook: addFz(data)
  Hook->>Hook: uid() + createdAt
  Hook->>UI: Optimistisches Update
  Hook->>Cloud: setDoc(...)
  Cloud-->>Hook: onSnapshot fires again
  Hook->>UI: Reconciliation
```

**Kernverantwortlichkeiten:**

- **Subscription-Management** für beide Collections (`fahrzeuge`, `termine`)
- **CRUD-API** für Components: `addFz`, `updFz`, `delFz`, `addTr`, `updTr`, `delTr`, `addMangel`, `delMangel`, `resetAll`
- **Business-Rule-Guard** in `updTr` und `addMangel` (Workflow-Regel BESTANDEN
  bei HM/GM ablehnen bzw. auto-demoten)
- **Offline-Fallback** via LocalStorage, falls Firestore-Verbindung scheitert
- **Seed-Daten** bei erster Nutzung (wenn beide Collections leer)

## 5. Datenfluss bei Mängelerfassung (Beispielszenario)

```mermaid
sequenceDiagram
  actor Pruefer
  participant TP as TagesplanView
  participant MM as MaengelModal
  participant Hook as useStore
  participant Val as validators
  participant FS as Firestore

  Pruefer->>TP: Klickt auf "Mängel erfassen"
  TP->>MM: Öffnet Modal mit termin
  Pruefer->>MM: Wählt Mangelcode "2.1.1 (HM)"
  MM->>Hook: addMangel(tid, mangel)
  Hook->>Hook: mängel.push + status-check
  alt Termin war BESTANDEN
    Hook->>Hook: Auto-Demote zu NICHT_BESTANDEN
  end
  Hook->>FS: setDoc(termin)
  Hook-->>MM: State-Update (neuer termin)
  MM->>MM: hasHM = true → BESTANDEN-Button disabled
  Pruefer->>MM: Klickt "Nicht bestanden"
  MM->>Hook: onStatus(tid, NICHT_BESTANDEN)
  Hook->>Val: validateStatusWechsel ✓ (nicht BESTANDEN)
  Hook->>FS: setDoc(termin)
```

## 6. Fehler- und Eingabe-Validierung

Zwei Ebenen:

1. **Formular-Validierung** (hart, blockt Speichern): `validators.validateFahrzeug`,
   `validators.validateStatusWechsel` — Einzelfeldprüfungen nach Äquivalenzklassen
2. **Plausibilitäts-Warnungen** (weich, UI-Hinweis, nicht blockierend):
   `validators.checkHerstellerModellKonsistenz` — prüft gegen Referenzliste

Begründung der Trennung: Formularvalidierung schützt vor falschem Datentyp/
ungültigem Format. Plausibilität soll seltene Fälle (Oldtimer, Importe, Umbauten)
nicht blockieren, aber typische Fehler (BMW Polo, VW Golf als Motorrad) markieren.

## 7. Barrel-Exports

`src/components/ui/index.js` und `src/components/modal/index.js` bündeln die
Exporte, damit Views über `import { Inp, Sel, Fld } from "../components/ui"`
importieren statt jeden Pfad einzeln zu kennen. Nach Feedback evaluieren wir,
ob wir die Barrel-Exports komplett nutzen oder aus Tree-Shaking-Gründen
entfernen.
