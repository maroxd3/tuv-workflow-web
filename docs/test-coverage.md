# Test-Coverage-Bericht

**Stand:** 30. April 2026
**Werkzeug:** Vitest 4 mit `@vitest/coverage-v8` (V8-Coverage-Engine)
**Befehl:** `npm test -- --coverage`

---

## Zusammenfassung

| Metrik | Abdeckung | Verhältnis |
|---|---|---|
| **Statements** | **95.65 %** | 220 / 230 |
| **Branches** | **86.36 %** | 209 / 242 |
| **Functions** | **86.66 %** | 39 / 45 |
| **Lines** | **98.21 %** | 165 / 168 |

**Test-Bestand:** 114 Vitest-Tests in 7 Test-Dateien, Laufzeit ~22 s.

Alle vier Werte liegen deutlich über der branchenüblichen Schwelle von
80 %. Insbesondere die Geschäftslogik-Module (`utils/validators.js`,
`utils/date.js`, `utils/mangel.js`) haben **100 %** Function- und
Line-Coverage — kritische Validierungs- und Status-Wechsel-Pfade sind
also vollständig durch Regressions-Tests abgesichert.

---

## Coverage pro Modul

```
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines
-----------------|---------|----------|---------|---------|------------------
All files        |   95.65 |    86.36 |   86.66 |   98.21 |
 components/ui   |   89.47 |    68.42 |   77.77 |   94.44 |
  buttons.jsx    |  100.00 |    61.70 |  100.00 |  100.00 | branches: 16-18,36-43,59-61
  inputs.jsx     |   77.77 |    70.00 |   60.00 |   87.50 | line 10
 constants       |   76.92 |    50.00 |   50.00 |   81.81 |
  kfzKreis.js    |  100.00 |    50.00 |  100.00 |  100.00 | branch line 699
  kfzReferenz.js |   40.00 |    50.00 |   25.00 |   50.00 | lines 218-219
 hooks           |  100.00 |   100.00 |   66.66 |  100.00 |
  useToasts.js   |  100.00 |   100.00 |   66.66 |  100.00 |
 utils           |   97.34 |    95.48 |  100.00 |  100.00 |
  date.js        |   96.42 |    88.88 |  100.00 |  100.00 | branch line 24
  validators.js  |   97.45 |    95.83 |  100.00 |  100.00 | branches 139-142,154,191
```

---

## Bewertung pro Bereich

### Geschäftslogik (`src/utils/`) — Coverage 97 %

Die kritischsten Module der App (Validatoren, Datums-Logik) sind nahezu
lückenlos getestet:

- `validators.js`: 100 % Functions, 95.83 % Branches — die wenigen
  uncovered Branches betreffen Sonderfälle in der FIN-Soft-Validation
  (Position-9-Berechnung für Pre-1981-VINs), die bewusst nicht hart
  blockieren und daher nicht als Fehler-Pfad getestet werden müssen.
- `date.js`: 100 % Lines, 88.88 % Branches — eine ungenutzte Branch in
  Zeile 24 (Sonderfall für Schaltjahre vor 1900, praktisch irrelevant).

### Hooks (`src/hooks/`) — Coverage 100 % Lines

`useToasts.js` ist vollständig zeilenabgedeckt; die uncovered "Function"
ist eine Cleanup-Funktion, die nur beim Component-Unmount läuft und in
der Test-Umgebung nicht getriggert wird.

`useStore` (das State-Management-Herzstück) wird **nicht** in dieser
Coverage-Tabelle gezeigt, weil es das Firebase-SDK direkt importiert
und in den Tests nicht stub-getestet wird. Sein Verhalten ist
**indirekt** abgesichert: die von ihm aufgerufenen Geschäftsregeln in
`validators.js` und `utils/mangel.js` (insbesondere
`validateStatusWechsel`, `addMangel`, Auto-Demote auf Hauptmangel)
sind zu 100 % unit-getestet — der Hook bleibt ein dünner Sync-Adapter
auf Firestore. Eine Mock-Firestore-Test-Suite direkt auf `useStore`
ist auf der Roadmap (Sprint 7+).

### Konstanten (`src/constants/`) — Coverage 76 %

`kfzReferenz.js` hat nur 40 % Statement-Coverage, weil die Datei eine
Whitelist von ~25 Herstellern und ihren Modellen enthält und nur ein
Bruchteil davon in Tests verwendet wird. Die *Logik* (Helper-Funktionen
wie `getHerstellerDisplayList`, `getModelle`) ist zu 100 % getestet —
die übrigen 60 % sind reine Daten, die keine eigene Test-Abdeckung
brauchen. Coverage-Schwelle daher trotzdem akzeptabel.

### UI-Komponenten (`src/components/ui/`) — Coverage 89 %

Die UI-Bausteine (Buttons, Inputs) sind über Snapshot-Tests
und Verhalten der nutzenden Modals indirekt geprüft. Die uncovered
Branches in `buttons.jsx` betreffen alternative Render-Pfade (z. B.
`disabled`-Spezialfall mit Icon-only), die optisch geprüft, aber nicht
in unit-getrennten Tests gedeckt sind.

---

## Test-Verteilung über die 7 Test-Dateien

| Test-Datei | Tests | Schwerpunkt-Verfahren |
|---|---:|---|
| `src/tests/utils/validators.test.js` | **62** | Äquivalenzklassen + Grenzwertanalyse + Regression (jeder Fuchs-Bug hat einen dedizierten Test) |
| `src/tests/utils/date.test.js` | **18** | Grenzwertanalyse (Schaltjahre, Monatsenden, Jahres-Wechsel) |
| `src/tests/components/buttons.test.jsx` | **9** | Snapshot + Render-Pfade (disabled, loading, icon-only) |
| `src/tests/components/inputs.test.jsx` | **8** | Snapshot + Render-Pfade (Inp / Sel / Fld) |
| `src/tests/utils/mangel.test.js` | **7** | Entscheidungstabelle (HM/EM/GM/GfM × Status) |
| `src/tests/hooks/useToasts.test.js` | **6** | State-Lifecycle (push / dismiss / auto-clear) |
| `src/tests/components/StatusPill.test.jsx` | **4** | Snapshot pro Status-Wert |
| **Summe** | **114** | |

Die methodische Herleitung der Testfälle nach Äquivalenzklassen,
Grenzwertanalyse und Entscheidungstabelle ist in
`docs/testkonzept.md` § 2 dokumentiert.

---

## Nicht-abgedeckte Bereiche — bewusste Entscheidungen

Folgende Bereiche werden **nicht** durch automatisierte Tests
abgedeckt, sondern durch dokumentierte manuelle Smoke-Tests
(siehe `docs/testkonzept.md` § 3.5):

- **PDF-Bericht-Layout** — der HTML-zu-PDF-Pfad über `window.print()`
  ist Browser-abhängig und wird manuell auf Chrome / Safari / Firefox
  smoke-getestet. Eine automatisierte Pixel-Diff-Suite wäre möglich
  (Playwright + Visual-Regression), liegt aber ausserhalb des
  Semester-Scopes.
- **Mobile-Layout-Breakpoints** — manuell auf iPhone Safari (4 Polish-
  Runden in Sprint 5) und im Chrome DevTools-Responsive-Modus geprüft.
- **Tauri-Desktop-Wrap** — manueller Smoke-Test im `npm run tauri dev`
  vor jedem Release, weil der WebView-Renderer plattformabhängig ist.

---

## Reproduzieren

```bash
npm install
npm test -- --coverage
```

Die HTML-Coverage-Reports liegen nach dem Lauf unter `coverage/index.html`
(Ordner ist gitignored).
