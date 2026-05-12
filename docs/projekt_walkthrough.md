# Projekt-Walkthrough — TÜV Prüfstelle Pro

**Zweck dieses Dokuments:** Du gehst dieses Dokument vor dem Termin mit Frau Fuchs einmal komplett durch — danach hast du **jeden Bereich des Projekts** so internalisiert, dass du ihre Fragen entspannt beantworten kannst, ohne den Code öffnen zu müssen.

**Lesezeit:** ca. 30 Minuten.

---

## 1. Was ist das Projekt überhaupt? (in 30 Sekunden erklärbar)

> *„TÜV Prüfstelle Pro ist ein digitales Verwaltungssystem für TÜV-Prüfstellen. Es ersetzt Excel- und Papierlisten durch eine echte Web-App mit Echtzeit-Sync. Vier Hauptansichten: Tagesplan mit Terminen, Fahrzeug-Stammdaten, Mängelerfassung nach StVZO-Katalog und Statistik-Dashboard. Plus eine A4-PDF-Berichtsausgabe im amtlichen Layout. Läuft als Web-App im Browser und als native Desktop-App über Tauri 2."*

### Wer ist die Zielgruppe?
- **Prüfingenieur** (Sachverständiger) — führt die HU/AU durch, erfasst Mängel
- **Prüfstellenleiter** — plant Termine, überwacht KPIs
- **Verwaltung** — pflegt Fahrzeug-Stammdaten und Halterdaten

### Was tut das System NICHT? (Scope-Abgrenzung, wichtig wenn sie fragt)
- Keine Authentifizierung (Prototyp = Single-Tenant)
- Keine echte KBA-/TÜV-Schnittstelle (Modell-Demo)
- Keine Abrechnung / Buchhaltung
- Keine Foto-Dokumentation (im Ausblick)
- Keine Hardware-Integration (Bremsenprüfstand, OBD)

→ Steht alles im **Pflichtenheft § 1.2 "Abgrenzung"** — sie respektiert klare Scope-Definition.

---

## 2. Architektur — die 3 Schichten

```
┌─── PRÄSENTATION (Views + UI-Komponenten) ───┐
│  TagesplanView · FahrzeugeView              │
│  BerichteView · StatistikView                │
│  + Modals (FahrzeugModal, TerminModal, ...)  │
└─────────────────┬────────────────────────────┘
                  │ Custom Hooks
                  ▼
┌─────── LOGIK (Hooks + Utilities) ───────────┐
│  useStore (State-Management + Firestore)     │
│  validators.js · mangel.js · date.js         │
│  useToasts · useIsMobile                     │
└─────────────────┬────────────────────────────┘
                  │
                  ▼
┌──── INFRASTRUKTUR (Firebase + Browser) ─────┐
│  Firestore (eu-west-1) — Live-Sync           │
│  LocalStorage — Offline-Fallback             │
│  Tauri 2 — Desktop-Shell (Rust)              │
└──────────────────────────────────────────────┘
```

### Warum 3 Schichten?
> *„Separation of Concerns. UI-Komponenten wissen nichts über Firestore — sie rufen Methoden auf dem `useStore` Hook auf. Der Hook kümmert sich um Persistenz. Wenn wir morgen Firestore gegen PostgreSQL austauschen wollten, müssten wir nur den Hook anfassen, nicht 30 Komponenten."*

### Die wichtigste Regel
- **Views importieren keine Firebase-Module direkt** — alles geht über `useStore`
- **`utils/`-Module sind pure Funktionen** — keine Seiteneffekte, keine DOM-Zugriffe → leicht testbar
- **Konstanten leben in `constants/`** — kein hardcoded String in einer Komponente

---

## 3. Technologie-Stack — jede Wahl, jede Begründung

| Wahl | Alternative die wir verworfen haben | Warum |
|---|---|---|
| **React 19** | Vue, Svelte, Angular | Bekanntester Stack in der Industrie, größte Community, gutes Lernmaterial |
| **Vite 8** | Next.js, Create-React-App | SPA reicht (kein SSR nötig), Vite hat schnellsten HMR, minimales Setup |
| **Firestore (NoSQL)** | PostgreSQL + Backend, Supabase | Echtzeit-Sync gratis, serverless, idiomatisch für eingebettete Arrays (Mängel im Termin). **ABER: Frau Fuchs hat berechtigt kritisiert — Details siehe Punkt 11.** |
| **Tauri 2 (Rust)** | Electron, PWA | 6 MB Binary statt 150 MB, native Performance, Rust ist sicherer als Node |
| **Recharts** | Chart.js, D3, Plotly | React-nativ, deklarativ, reicht für unsere 3-4 Diagramme |
| **Framer Motion** | CSS-only, react-spring | Deklarative Animationen, `AnimatePresence` für Page-Transitions |
| **Kein Redux/Zustand** | Redux Toolkit, Zustand, Jotai | Bei ~20 Komponenten ist Props-Drilling kein Problem — Custom-Hook reicht |
| **Inline-Styles + Tailwind-Reset** | CSS Modules, styled-components | Schneller Prototyp, Theme-Objekt für zentrale Farben |
| **Vitest** | Jest, Mocha | Vite-nativ, schneller, kompatibler mit React 19 |
| **Sonner** | react-hot-toast, custom | Modernste API, weniger Code, gutes a11y |

### Wenn sie fragt „Warum React und nicht Vue?"
> *„Marktanteil und Lern-Investment. React ist Industriestandard, das, was unsere Zielgruppe an Devs typischerweise schon kennt — wenn dieses Projekt mal jemand übernimmt, ist React weniger ungewohnt. Vue wäre technisch auch valide gewesen."*

---

## 4. Datenmodell — die drei Entitäten

```
FAHRZEUG (1)---(N) TERMIN (1)---(N) MANGEL
```

### Entität `Fahrzeug`
**Was ist das?** Ein einzelnes Kfz mit allen Stammdaten.

**Wichtigste Attribute:**
- `kennzeichen` — DE-Format, **global unique** (KBA-Realität), case/whitespace-insensitiv normalisiert
- `fin` — 17-Zeichen-Code, **optional**, ohne `I`, `O`, `Q` (ISO-3779)
- `hersteller`, `modell`, `typ` — **abhängige Dropdowns** (BMW kann nur BMW-Modelle haben)
- `baujahr` — Integer, 1885 ≤ x ≤ aktuelles Jahr + 1
- `kmStand` — Integer, 0 ≤ x ≤ 3.000.000
- `besitzer`, `telefon`, `email` — Halter-Daten (siehe Schwachpunkt unten)
- `hu_faellig` — ISO-Datum für die nächste HU

### Entität `Termin`
**Was ist das?** Ein konkreter Prüf-Termin für ein Fahrzeug.

**Wichtigste Attribute:**
- `fahrzeugId` — Foreign Key auf Fahrzeug
- `datum`, `uhrzeit` — 30-min-Slots zwischen 07:00 und 17:30
- `art` — Prüfungsart (HU+AU, HU, Nachprüfung, GAP, ...) — 12 Stück
- `pruefer` — wer prüft (Marwan/Oussama/etc.)
- `status` — **7 mögliche Werte**: Geplant, In Prüfung, Bestanden, Nicht bestanden, Nachprüfung, Nicht erschienen, Abgebrochen
- `mängel` — **eingebettetes Array** (siehe Designentscheidung unten)

### Entität `Mangel` (eingebettet in `Termin.mängel`)
**Was ist das?** Ein einzelner Mangel, der bei einer Prüfung gefunden wurde.

**Wichtigste Attribute:**
- `code` — StVZO-Anlage-VIII-Referenz (z.B. "2.1.1") oder "FR" für Freitext
- `text` — beschreibender Mangel-Text
- `kat` — Kategorie: **OM** (Ohne Mangel) / **LM** (Leicht) / **EM** (Erheblich) / **HM** (Hauptmangel) / **GM** (Gefährlich)

### Wichtige Designentscheidung: Mängel als Array, nicht als eigene Collection

> *„Mängel haben keine eigenständige Existenz — sie gehören immer zu genau einem Termin und werden nur im Kontext des Termins gelesen/geschrieben. In Firestore ist das Einbetten idiomatisch und spart Reads (1 statt N+1). In SQL wäre es eine eigene Tabelle gewesen mit JOIN."*

### Schwachpunkt: Halter im Fahrzeug eingebettet

> *„Wir haben `besitzer`, `telefon`, `email` als Attribute des Fahrzeugs modelliert, nicht als eigene `Halter`-Entität. Im Produktivbetrieb wäre 3NF besser — ein Halter kann mehrere Fahrzeuge haben. Das steht aber bewusst dokumentiert in `datenmodell.md § 2` als Designentscheidung mit Hinweis auf den Migrationsweg."*

→ **Wenn sie das anspricht: ZUGEBEN dass sie recht hat, auf die Doku verweisen, Ende.**

---

## 5. Die 4 Hauptansichten — was kann jede?

### 5.1 `TagesplanView.jsx` — Termin-Verwaltung des Tages

**Wo:** `src/views/TagesplanView.jsx`

**Was siehst du:**
- Datum-Picker oben + Wochen-Navigator
- Zwei Ansichts-Modi: **Timeline** (vertikal, 30-min-Slots) ODER **Tabelle** (Liste aller Termine)
- Pro Termin: Status-Pill (farbcodiert), Fahrzeug-Kennzeichen, Prüfer, Status-Button

**Was kannst du tun:**
- **Klick auf leeren Slot** → Termin anlegen (Touch-Geräte) oder Rechtsklick (Desktop) → Kontextmenü
- **Statuswechsel per Button** "Starten/Fertig" — automatisches Routing: nach "Fertig" → Status "Bestanden" oder "Nicht bestanden" je nach Mängellage
- **Rechtsklick auf Termin** → Kontextmenü: Bearbeiten, Mängel erfassen, Löschen

**Live-Demo-Pfad falls Frau Fuchs es sehen will:**
1. Datum auf heute setzen
2. Auf einen leeren Slot klicken → Termin-Modal öffnet sich
3. Fahrzeug auswählen, Prüfungsart, los
4. Im Tagesplan auf den neuen Termin Rechtsklick → "Starten"
5. Wieder Rechtsklick → "Mängel erfassen" → Modal öffnet
6. Mangel "2.1.1 — Bremsanlage" auswählen, Kategorie HM
7. Modal schließen, Termin auf "Fertig" → automatisch "Nicht bestanden"

### 5.2 `FahrzeugeView.jsx` — Fahrzeug-Stammdaten

**Wo:** `src/views/FahrzeugeView.jsx`

**Was siehst du:**
- Suchfeld (Volltext über Kennzeichen/FIN/Halter/Hersteller/Modell)
- Filter nach Fahrzeugtyp (PKW, LKW, Motorrad, etc.)
- Liste aller Fahrzeuge mit HU-Fälligkeits-Anzeige (rot/orange/amber/grün je nach Restzeit)
- Klick auf Fahrzeug → Slide-In-Panel mit allen Details + zugehörigen Terminen

**Wichtige UX-Sicherheit:**
- **Cascading Dropdowns**: Wenn man BMW wählt, sieht man nur BMW-Modelle. Wenn man "Sonstiger" wählt, kann man Freitext eintippen.
- **KBA-Kreis-Code-Validierung**: Kennzeichen wird gegen die Liste der ~430 deutschen Kreis-Codes geprüft (in `constants/kfzKreis.js`)
- **Saison-Kennzeichen**: Format `B-TK 1234 04-10` wird unterstützt (April bis Oktober)

### 5.3 `BerichteView.jsx` — PDF-Berichts-Generierung

**Wo:** `src/views/BerichteView.jsx`

**Was siehst du:**
- Liste aller abgeschlossenen Prüfungen (Status nicht "Geplant" oder "In Prüfung")
- Filter: Hauptmängel ja/nein, Status, Datum
- Klick auf Bericht → Vorschau-Modal mit allen Inhalten
- Button "PDF" → öffnet einen neuen Tab mit dem Bericht im A4-Layout, ruft `window.print()` auf

**Was ist besonders am PDF?**
- **Keine externe Library** (kein jsPDF/html2pdf — 150 KB gespart)
- **Browser-natives `window.print()`** erzeugt Vector-PDF
- **A4-konformes Layout** mit `@page { size: A4; margin: 16mm 14mm 24mm; }`
- **Eigene Brand "TPP — Prüfstelle Pro"** (kein TÜV/DEKRA/GTÜ — Markenrecht!)
- **Berichts-Nr. im Format `TPP-NDS-2026-XXXXXXX`**
- **Römische Sektionen** (I. Fahrzeug, II. Halter, III. Mängel, IV. Bemerkungen)
- **Unterschriftsfelder** (Ort/Datum + Stempel)
- **Rechtshinweis nach § 29 StVZO** im Footer

### 5.4 `StatistikView.jsx` — KPI-Dashboard

**Wo:** `src/views/StatistikView.jsx`

**Was siehst du:**
- **Zeitraumfilter**: 7 / 30 / 90 / 365 Tage
- **4 KPI-Kacheln**: Bestehensquote, Gesamtzahl Prüfungen, Mängel gesamt, Hauptmängel-Anteil
- **Area-Chart**: Bestehensquote-Trend über die Zeit
- **Bar-Chart**: Leistung pro Prüfer (Anzahl + Bestehensquote)
- **Pie-Chart**: Mängel nach Kategorie (OM/LM/EM/HM/GM)
- **Top-10-Mängel**: häufigste Codes (mit Bezeichnung)

---

## 6. Validierungs-Strategie — die 3 Ebenen

### Ebene 1: UX-Strukturierung (verhindert Fehleingaben **strukturell**)
- **Abhängige Dropdowns** in Hersteller/Modell/Typ → "BMW Polo" kann gar nicht erst eingetippt werden
- **Status-Buttons nach Workflow-Regeln** → "Bestanden"-Button ist deaktiviert wenn Hauptmangel vorhanden ist
- **Dropdown-Liste mit nur gültigen Optionen** für Prüfungsart, Prüfer

### Ebene 2: Hard-Validierung (`utils/validators.js`)
Diese werden beim Speichern aufgerufen und **blockieren** den Speichervorgang bei Fehlern.

Wichtige Validatoren:
- `validateFahrzeug(fz)` — alle Pflichtfelder + Format-Checks
- `validateKennzeichen(kz)` — Regex + KBA-Kreis-Code aus `kfzKreis.js`
- `validateKmStand(km)` — Integer, 0 ≤ x ≤ 3.000.000
- `validateBaujahr(jahr)` — 1885 ≤ x ≤ aktuelles Jahr + 1
- `validateTelefon(tel)` — Regex `[+()\d\s\-/]{5,30}`, keine Buchstaben, ≥ 5 Ziffern
- `validateEmail(email)` — RFC-Basic-Regex
- `validateKennzeichenUnique(kz, existing)` — Verhindert Doppel-Anlage
- `validateHerstellerModellKonsistenz(h, m, t)` — Prüft gegen `kfzReferenz.js`
- `validateStatusWechsel(neuerStatus, mängelliste)` — **Wichtigste Workflow-Regel**: "Bestanden" mit HM/GM ist verboten (§ 29 StVZO)

### Ebene 3: Soft-Warnings (UI-Hinweis, blockiert NICHT)
- `checkFinPruefziffer(fin)` — ISO-3779-Prüfziffer an Position 9. **Bewusst weich**, weil pre-1981er und Nicht-NA-Fahrzeuge keine Prüfziffer tragen → würde Oldtimer fälschlich blockieren.

### Defense in Depth — die WF-01 Regel ("kein BESTANDEN bei Hauptmangel") wird an 4 Stellen durchgesetzt:
1. **MaengelModal** — der "Bestanden"-Button ist disabled
2. **TerminModal** — die "Bestanden"-Option im Status-Dropdown ist disabled
3. **TagesplanView.advance()** — Auto-Routing fertig→Bestanden wird umgeleitet auf "Nicht bestanden" bei HM
4. **useStore.updTr()** — Guard im State-Hook lehnt programmatische Patches ab

→ **Falls eine Schicht ausfällt, fangen die anderen.**

---

## 7. State Management — der `useStore` Hook

**Wo:** `src/hooks/useStore.js`

**Was tut er:**
- **Subscription** auf 2 Firestore-Collections: `fahrzeuge` und `termine`
- **CRUD-API** für Komponenten: `addFz`, `updFz`, `delFz`, `addTr`, `updTr`, `delTr`, `addMangel`, `delMangel`
- **Business-Rule-Guard** in `updTr` und `addMangel`
- **Offline-Fallback** via LocalStorage
- **3-Sekunden-Loading-Fallback** — wenn Firestore nicht antwortet, lade aus Cache/Seed

**Warum Custom-Hook statt Redux?**
> *„Bei ~20 Top-Level-Komponenten und linearen State-Flows ist Redux Overkill. Ein Custom-Hook mit `onSnapshot` als Source-of-Truth reicht — keine Action/Reducer-Boilerplate, kein Selectors-Pattern für nichts."*

**Optimistisches Update (wichtig für UX-Erklärung):**
- Wenn der User auf "Speichern" klickt, generieren wir die ID schon clientseitig per `uid()`-Helper
- Das neue Objekt erscheint **sofort** im UI
- Im Hintergrund läuft `setDoc(...)` Richtung Firestore
- Wenn Firestore's `onSnapshot` zurückkommt, gibt es nichts zu rekonsilieren — die ID ist schon stabil

---

## 8. Tests — die Zahlen, die du auswendig wissen solltest

**Stand:** 114/114 Tests grün · **95,65 %** Statement-Coverage · **98,21 %** Lines-Coverage

### Test-Pyramide
```
       ╱  e2e   ╲     0 Tests   (bewusst weggelassen, Aufwand zu hoch)
      ╱─────────╲
     ╱ Component ╲   ~25 Tests  (UI-Bausteine, React Testing Library)
    ╱─────────────╲
   ╱  Unit-Tests   ╲  ~89 Tests (utils/, validators, mangel, date)
  ╱─────────────────╲
```

### Testentwurfsverfahren (sie LIEBT solche Begriffe)

1. **Äquivalenzklassenbildung** — Bei jedem Validator: pro Gültigkeits-Klasse 1 Wert testen
2. **Grenzwertanalyse** — Werte „gerade innerhalb", „am Rand", „gerade außerhalb" der zulässigen Bereiche
3. **Entscheidungstabelle** — Bei der WF-01 Workflow-Regel: alle 8 Kombinationen von Ziel-Status × Mängelliste
4. **State-based Test** — Für Komponenten mit State (BtnP disabled/danger, Inp focus)
5. **Regression-Tests** — Jede einzelne Eingabe aus Fuchs's Feedback (-1 KM, Buchstaben in Tel, etc.) hat einen eigenen Testfall

### Was wir NICHT testen (proaktiv ansprechen!)
- **Framer-Motion-Animationen** — visuell, nicht funktional
- **Firestore-Integration direkt** — würde Firebase-Emulator brauchen
- **Statistik-Charts (Recharts-Rendering)** — Aggregations-Funktionen ja, das Pixel-Rendering nein
- **Tauri-spezifische APIs** — in der SPA nicht genutzt
- **PDF-Layout-Korrektheit** — visuelle Sache, manuell geprüft gegen Referenz-Datensatz

---

## 9. Sprint-Geschichte — was wann gemacht wurde

| Sprint | Wochen | Velocity | Fokus |
|---|---|---|---|
| **1** | W1–2 | — | Setup: Vite+React-Gerüst, Tauri 2 angebunden, Tailwind 4, Firebase-Projekt aufgesetzt |
| **2** | W3–4 | 15 SP | Epic 1: Fahrzeug-CRUD — US-01 bis US-05, HU-Fälligkeits-Anzeige |
| **3** | W5–6 | 15 SP | Epic 2: Tagesplan & Termine — Timeline + Tabelle, Statuswechsel, Wochen-Navigator |
| **4** | W7–9 | 37 SP | Epics 3–5: Mängel-Erfassung, Berichte (anfangs .txt), Statistik (Recharts) |
| **5** | W10–12 | **63 SP** | **FIX-Sprint nach Fuchs-Feedback** — 13 Stories adressiert |
| **6** | W13+ | 12 SP | Polish: Security-Hardening, Code-Splitting, CI, Doku-Finalisierung |

### Was war Sprint 5 konkret?
Frau Fuchs hat am 24.04.2026 eine ausführliche Feedback-Mail geschickt. Wir haben **alle** Punkte als Sprint-5-Backlog genommen:

| Story | Was sie kritisierte | Was wir gemacht haben |
|---|---|---|
| US-06 | Hersteller-Modell-Mismatch ("BMW Polo") | Cascading Dropdowns + Hard-Validator + Sonstiger-Modus |
| US-07 | Bug-Liste (negKM, Buchstaben in Tel, ...) | Alle 6 hart blockiert + Regression-Tests pro Bug |
| US-08 | Kennzeichen-Validierung schwach | KBA-Kreis-Code-Liste (430 Codes) + Saison-Kennzeichen-Format |
| US-09 | FIN nicht geprüft | ISO-3779-Prüfziffer (weich, mit Begründung) |
| US-10b | App hängt beim Laden | 3-Sekunden-Fallback aus Cache/Seed |
| US-23 | Bestanden trotz Hauptmangel möglich | 4-Stellen-Defense, Auto-Demotion |
| US-50 | ESLint hat 187 Errors | Eigene Config, 0 Errors, PropTypes als error |
| US-51 | Keine Typ-Validierung | PropTypes für alle 22 Komponenten, shared shapes |
| US-52 | Doku fehlt | 5 Markdown-Dokumente in `docs/` (236+197+325+318+193 Zeilen) |
| US-53 | Performance-Zahlen ohne Begründung | Nielsen-Tabelle 50/100/200 ms + Test-Methode mit Referenzgerät |
| US-54 | NoSQL-Wahl nicht begründet | Pro-/Kontra-Tabelle + SQL-Gegenentwurf + ehrliche Bewertung |
| US-55 | Bericht nur als .txt | Print-to-PDF im professionellen A4-Layout |
| US-56 | Mobile-Bedienung fehlt | Responsive auf 360 px, Sidebar als Overlay, Touch-Targets ≥ 36 px |

→ **63 SP = größter Sprint überhaupt.** Das ist auch ein gutes Argument, falls sie nachfragt warum wir nicht von Anfang an alles richtig gemacht haben: "Sie haben uns die richtigen Fragen gestellt — ohne diese Iteration wäre das Projekt 30% schlechter."

---

## 10. Was Frau Fuchs kritisierte — und unsere Antworten

### Kritik 1: „NoSQL ist falsch für strukturierte Daten"
**Sie hatte teilweise recht.**

Wir haben in `datenmodell.md § 6` einen ausführlichen Vergleich gemacht:
- **Pro Firestore**: Echtzeit-Sync gratis, serverless, eingebettete Mängel idiomatisch
- **Pro PostgreSQL**: Strukturierte Daten passen besser, Reporting via SQL einfacher, ACID-Transaktionen, FK-Constraints

**Unsere Bewertung im Doku-Text:** *„Für den Prototyp Firestore akzeptabel, nicht optimal. Für Produktiv wäre PostgreSQL sauberer."*

**Plus:** Wir haben einen kompletten **SQL-Gegenentwurf** mit allen Tabellen, FK-Constraints UND einem Trigger, der die WF-01-Regel deklarativ durchsetzt:
```sql
CREATE OR REPLACE FUNCTION trg_termin_status_check() ...
```

→ **Wenn sie das anspricht: einfach zustimmen, auf die Doku verweisen, weiter.**

### Kritik 2: „Warum 100 ms? Wie testet ihr das?"
**Sie wollte explizite Begründung der Performance-Zahlen.**

Wir haben jetzt eine **Nielsen-Tabelle** im Pflichtenheft § 3.1:

| Schwelle | Was Forschung sagt | Bezug zu uns |
|---|---|---|
| < 50 ms | Mensch kann's nicht von 0-Latenz unterscheiden (Card et al. 1991) | Über-Spezifikation, Engineering-Aufwand ohne UX-Gewinn |
| **≈ 100 ms** | **Nielsen 1993 — "0.1 s = Grenze für 'direktes Manipulationsgefühl'"** | **Genau das wollen wir → Sweet Spot** |
| ≈ 200 ms | Nielsen: 0.1–1.0 s = "merkt dass System gerade reagiert", Direkt-Gefühl weg | Zu lasch für interaktive Filter |
| > 1000 ms | Aufmerksamkeit driftet ab | Nur für seltene Operationen (Bericht-Generierung) |

**Test-Methode:**
1. Synthetische Lastdaten: 500 Termine + 200 Fahrzeuge (10× typische Last)
2. Vitest-Benchmark mit `bench()` über 100 Durchläufe
3. React Profiler misst Render-Zeit
4. Pass-Kriterium: p95 unter Schwellwert auf Referenzgerät (i5-8250U / 8 GB / Chrome)

### Kritik 3: „Bug-Liste"
**Sie hatte 6 konkrete Bug-Beispiele:**
1. negativer KM-Stand
2. Buchstaben im Telefonfeld
3. ungültige E-Mail-Adresse
4. Bestanden trotz Hauptmangel
5. Doppelte Kennzeichen
6. „BMW Polo" als Hersteller/Modell-Kombi
7. „VW Golf als Motorrad" als Hersteller/Typ-Kombi

**Alle 7 sind jetzt hart blockiert** + jede einzelne hat einen Regression-Test in `validators.test.js`.

### Kritik 4: „ESLint sauber?"
Wir hatten 187 Errors mit ihrer empfohlenen Config. Jetzt:
- **0 Errors** mit `eslint:recommended` + `react/recommended` + `react-hooks/recommended` + `jsx-runtime` + `prop-types: error`
- 3 unused imports raus, 22 Komponenten mit PropTypes

### Kritik 5: „Doku?"
**War komplett fair.** Wir hatten am Anfang gar nichts. Jetzt:
- `pflichtenheft.md` (236 Zeilen) — Anforderungen, Akzeptanzkriterien, NFAs
- `datenmodell.md` (325 Zeilen) — ER + Integrität + SQL-Vergleich
- `design.md` (318 Zeilen) — Architektur, Komponentendiagramm, useStore
- `backlog.md` (197 Zeilen) — User Stories, Sprint-Historie, Velocity
- `testkonzept.md` (193 Zeilen) — Testpyramide, Verfahren, Coverage

---

## 11. Bekannte Schwächen — proaktiv ansprechen!

**Wichtigster Hack des Gesprächs:** Wenn DU die Schwächen selbst nennst, hat sie nichts mehr zu kritisieren.

### Schwäche 1: Bundle-Size 1.1 MB / 332 KB gzip
> *„Eine Sache, die wir selbst sehen: unser JS-Bundle ist 1,1 MB minified, 332 KB gzipped. Das ist über dem Vite-Default-Limit. Ursache sind Recharts plus Framer-Motion plus Firebase-SDK. Sauberer Fix wäre Code-Splitting per Route — Statistik-View und Charts in einen separaten Chunk lazy-loaden. Haben wir aufs Backlog für Sprint 6."*

### Schwäche 2: FIN-Prüfziffer bewusst weich
> *„Eine Stelle, wo wir bewusst weich validieren: die FIN-Prüfziffer nach ISO 3779. Position 9 sollte aus den anderen 16 Stellen berechnet werden. Wir prüfen das, blockieren aber nicht, weil pre-1981er und Nicht-Nordamerika-Fahrzeuge keine korrekte Prüfziffer tragen — Hard-Block würde Importe und Oldtimer fälschlich abweisen."*

### Schwäche 3: Halter im Fahrzeug eingebettet (3NF-Verletzung)
> *„In unserem Datenmodell ist der Halter als Attribut des Fahrzeugs modelliert, nicht als eigene Entität. Im Produktivbetrieb wäre die 3NF-Variante mit eigener Halter-Tabelle besser — ein Halter kann mehrere Fahrzeuge besitzen. Steht so in `datenmodell.md § 2` als Designentscheidung dokumentiert, mit Hinweis auf die Migrations-Variante."*

### Schwäche 4: NoSQL-Wahl nicht optimal
> *„Sie hatten teilweise recht — bei strukturierten Daten wie unseren wäre PostgreSQL der saubere Weg. Wir haben Firestore für den Prototyp wegen Echtzeit-Sync und Serverless gewählt, aber das ist explizit als 'akzeptabel, nicht optimal' in `datenmodell.md § 6` bewertet, mit kompletten SQL-Gegenentwurf."*

### Schwäche 5: Kein Audit-Trail
> *„Im Pflichtenheft Datenschutz-Abschnitt explizit als 'für Produktivbetrieb erforderlich' aufgelistet. Im Prototyp-Scope wegelassen. Eine produktive Version müsste loggen: wer hat wann welchen Status gesetzt? — siehe Pflichtenheft NF-DS-05."*

### Schwäche 6: Keine Authentifizierung
> *„Single-Tenant-Prototyp ohne Auth. Für Produktiv wäre Firebase Auth + Firestore Security Rules mit Rollen-Modell (Prüfer/Leitung/Admin) zwingend. Im Pflichtenheft NF-DS-02 als 'Ausblick' dokumentiert."*

---

## 12. Frequent Q&A — vorbereitete Antworten

### „Warum nicht von Anfang an Postgres?"
> *„Echtzeit-Sync war ein konkretes UX-Goal — wenn ein Prüfer einen Termin auf 'In Prüfung' setzt, soll der Empfang das sofort sehen, ohne refresh. Mit Postgres hätten wir Websockets / Polling selbst bauen müssen. Im Prototyp-Scope war Firestore der pragmatische Weg. Im Produktiv-Scope mit echten Reporting-Anforderungen würden wir migrieren — die Tabellen sind in `datenmodell.md` schon designed."*

### „Warum kein Redux?"
> *„Bei ~20 Top-Level-Komponenten und unserem State-Flow (View → Hook → Firestore) gibt es kein Props-Drilling-Problem, das Redux lösen würde. Ein Custom-Hook mit `useStore` reicht. Redux würde Action/Reducer/Selectors-Boilerplate für nichts hinzufügen."*

### „Warum Tauri statt Electron?"
> *„Drei Gründe: 1) Binary-Größe — Tauri ~6 MB, Electron ~150 MB. 2) Rust-Backend ist sicherer als Node.js für lokale Dateisystem-Operationen. 3) Tauri nutzt den OS-eigenen Webview-Renderer, Electron bringt Chromium mit — bei langfristigem Betrieb sicherer."*

### „Wie ist die Bedienung auf Mobil?"
> *„Voll responsive ab 360 px Viewport. Sidebar wird zum Overlay mit Hamburger-Menu, KPI-Grids stacken von 4 auf 2 Spalten, Modals werden 1-spaltig. Touch-Targets ≥ 36 px (über Apple's 44-px-Standard, weil wir Information-Density priorisieren). Tagesplan-Slot wird per Klick statt Rechtsklick angelegt — auf Phones gibt's kein Rechtsklick."*

### „Was würdet ihr heute anders machen?"
**Ehrlich antworten:**
> *„Wahrscheinlich von Anfang an PostgreSQL + ein leichtes Backend (z.B. tRPC oder PostgREST), weil unsere Daten strukturierter sind als Firestore es belohnt. Außerdem hätten wir die Validatoren von Anfang an ins UX-Design gezogen — die Cascading-Dropdowns sind die saubere Lösung. Die haben wir leider erst in Sprint 5 nach Ihrem Feedback gebaut."*

### „Wie ist der Tauri-Desktop-Build?"
> *„Identisch zur Web-App, weil Tauri den Browser-Renderer der Plattform nutzt. Vorteil ist die kleine Binary und die Möglichkeit, später lokale Hardware anzubinden — OBD-Diagnose, Bremsenprüfstand. Die App läuft offline und synct, wenn wieder Netz da ist."*

### „Wo sind die Zwischenstände dokumentiert?"
> *„In Git-Commits und im Backlog-Doc. Sprint-Historie steht in `backlog.md`, jeder Commit hat eine ausführliche Message — Sie können auf GitHub die Branch-Historie sehen. github.com/maroxd3/tuv-workflow-web"*

### „Wie geht ihr mit echten KBA-Daten um?"
> *„Aktuell haben wir eine kuratierte Liste von ~430 Kreis-Codes und ~25 Herstellern mit ihren Modellen — in `constants/kfzKreis.js` und `constants/kfzReferenz.js`. Für den Produktiv-Betrieb wäre die KBA-Schlüsselnummer-Datenbank über DAT oder Schwacke der Standard — das ist eine Lizenz-Frage, nicht eine Technik-Frage. Im Prototyp-Scope reicht unsere Liste."*

---

## 13. Live-Demo-Pfad (wenn sie die App sehen will)

**Falls sie sagt „zeigen Sie mir mal":**

1. **Browser auf `tuv-workflow.web.app`** öffnen
2. **Tagesplan-View** zeigen — heutiges Datum
3. **Klick auf leeren Slot um 10:30** → Termin-Modal öffnet
4. **Fahrzeug auswählen** (vorhandenes, z.B. "B-TK 1234")
5. **Prüfungsart "HU+AU"** wählen, Prüfer "Marwan"
6. **"Anlegen"** klicken
7. Termin erscheint im Tagesplan in Status "Geplant"
8. **Rechtsklick auf Termin** → Kontextmenü → **"Starten"** → Status wird "In Prüfung"
9. **Rechtsklick wieder** → **"Mängel erfassen"** → Modal öffnet
10. **Mangel auswählen**: "2.1.1 — Bremsanlage, Wirkung ungenügend", Kategorie HM
11. **Modal schließen** → Termin hat jetzt einen Hauptmangel
12. **Termin auf "Fertig" setzen** → wegen HM automatisch "Nicht bestanden" (zeigt die WF-01-Regel live)
13. **Berichte-View** öffnen → der neue Bericht ist da → **"PDF"-Button** klicken → druckbares A4-Layout

**Bonus: Validation-Demo**
- Versuche bei der Fahrzeug-Anlage **"BMW + Polo"** — Polo erscheint nicht im Modell-Dropdown
- Versuche Kennzeichen **"QWE-AB 1234"** — Fehler: "QWE ist kein gültiger Kreis-Code"
- Versuche KM-Stand **"-1"** — Fehler: "darf nicht negativ sein"

---

## 14. Glossar — Begriffe die du flüssig nutzen solltest

| Begriff | Was es bedeutet (kurz) |
|---|---|
| **ArbZG** | Arbeitszeitgesetz — Gesetz das wir nicht direkt nutzen, aber gotakt schon |
| **StVZO** | Straßenverkehrs-Zulassungs-Ordnung — § 29 + Anlage VIII regelt HU |
| **HU** | Hauptuntersuchung — alle 2 Jahre für PKW |
| **AU** | Abgasuntersuchung — meist zusammen mit HU |
| **WF-01** | Workflow-Regel-Nr.01: "Kein BESTANDEN bei Hauptmangel" — unser zentrales Beispiel |
| **HM** | Hauptmangel (Kategorie) — führt zu "Nicht bestanden" |
| **GM** | Gefährlicher Mangel — ebenfalls blockierend |
| **NoSQL** | Dokumenten-DB (z.B. Firestore) — wir nutzen das |
| **3NF** | Third Normal Form — DB-Normalisierung; Halter-Entität wäre 3NF |
| **DoD** | Definition of Done — Team-Liste was eine Story "fertig" macht |
| **SP** | Story Points — Größen-Schätzung pro User Story (Fibonacci 1/2/3/5/8/13) |
| **MoSCoW** | Must / Should / Could / Won't — Priorisierungs-Methode |
| **Defense in Depth** | Schicht-Sicherung: Wenn eine Validierungs-Schicht versagt, fangen die anderen |
| **CRUD** | Create / Read / Update / Delete |
| **HMR** | Hot Module Replacement — Vite-Feature, Code-Änderung ohne Browser-Reload |
| **PropTypes** | React-Runtime-Validierung von Komponenten-Schnittstellen |
| **ISO 3779** | FIN-Format-Standard |
| **KBA** | Kraftfahrt-Bundesamt — die Kreis-Codes auf Kennzeichen sind KBA-vergeben |
| **DSGVO** | Datenschutz-Grundverordnung — wir sind im Prototyp nicht voll konform |
| **Tauri** | Rust-basierte Alternative zu Electron für Desktop-Apps |
| **Recharts** | React-native Chart-Bibliothek, deklarativ |
| **`onSnapshot`** | Firestore-API für Echtzeit-Listeners auf Collections |

---

## 15. Was du am Vorabend / am Morgen machen solltest

**Heute Abend (Mittwoch 12.05.):**
1. ⬜ Diesen Walkthrough einmal komplett lesen (30 Min)
2. ⬜ Spickzettel `treffen_brief.md` einmal durchlesen (10 Min)
3. ⬜ Eigenständigkeitserklärung + KI-Nutzungserklärung **unterschreiben** und **in Tasche**
4. ⬜ Laptop laden, Adapter dabei

**Morgen früh (Donnerstag 13.05.):**
1. ⬜ Browser geöffnet mit `tuv-workflow.web.app` (vor dem Termin schon laden)
2. ⬜ GitHub-Tab parallel offen: `github.com/maroxd3/tuv-workflow-web`
3. ⬜ Spickzettel auf Handy für Toilette-Refresher 😅
4. ⬜ Notizblock zum Action-Items-Mitschreiben
5. ⬜ Mit Oussama um 09:30 kurz syncen, wer was sagt
6. ⬜ Ankommen 09:55 — rechtzeitig

---

## 16. Mantra für den Termin

> **Du hast die Zahlen. Sie hat keine Substanz mehr zum Draufhauen.**
>
> 114/114 Tests grün · 95,65 % Coverage · 0 ESLint-Errors · 5 vollständige Markdown-Doks · 5 UML-Diagramme · Sprint 5 mit 63 SP komplett ausgeliefert.
>
> Geh entspannt rein. Hör zu. Nimm Notizen mit. Antworte ehrlich. Wenn du was nicht weißt, sag das. Wenn sie recht hat, gib es zu — sie ist sofort zufrieden. Wenn sie was missversteht, korrigier sanft.
>
> Du bist nicht der Bittsteller. Du bist der Lieferant einer fertigen Software. Sie ist deine Stakeholder-Rolle. Stakeholder hören sich an, was Lieferanten sagen — nicht andersrum.

---

**Viel Erfolg morgen um 10. 🫡**
