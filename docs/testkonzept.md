# Test-Konzept — TÜV Prüfstelle Pro

**Zweck dieses Dokuments:** Begründung der Teststrategie, Herleitung der Testfälle
nach etablierten Testentwurfsverfahren, Abdeckungsziele und Grenzen.

---

## 1. Teststrategie — Grundlagen

### 1.1 Testpyramide

Wir folgen der klassischen **Testpyramide** nach Mike Cohn:

```
         ╱ e2e  ╲   (wenige, langsame, teure Tests)
        ╱────────╲
       ╱ Component╲  (mittel — testen Rendering + Interaktion)
      ╱────────────╲
     ╱   Unit Tests ╲  (viele, schnell, günstig)
    ╱────────────────╲
```

**Warum diese Form?** Unit-Tests sind schnell und isoliert, fangen die meisten
Logik-Fehler ab. Component-Tests validieren UI-Bausteine als Ganzes.
End-to-End-Tests sind teuer in Wartung und Laufzeit — wir verzichten im
Prototyp-Scope komplett darauf, dokumentieren aber, wie sie einzuführen wären
(s. Abschnitt 6).

### 1.2 Was wir NICHT testen und warum

| Nicht getestet | Grund |
|---|---|
| Framer-Motion-Animationen | Visuelles Verhalten, nicht funktional relevant |
| Firestore-Integration direkt | Externe Abhängigkeit, würde Firebase-Emulator brauchen (im Prototyp-Scope nicht aufgebaut) |
| Statistik-Charts (Recharts-Rendering) | Visual-Regression wäre ein Test-Framework für sich; nur Aggregations-Funktionen werden getestet |
| Tauri-spezifische APIs | In der SPA-Code-Pfad nicht genutzt |

## 2. Testentwurfsverfahren

Jeder Testfall in `src/tests/` ist nach einem der folgenden Verfahren hergeleitet.
Die Wahl des Verfahrens hängt vom Typ der zu testenden Einheit ab.

### 2.1 Äquivalenzklassenbildung (bei allen Validatoren)

**Vorgehen:** Eingaben werden in Klassen partitioniert, innerhalb derer sich der
Code identisch verhält. Pro Klasse wird mindestens **ein repräsentativer
Eingabe-Wert** getestet.

**Beispiel `validateKmStand`:**

| Klasse | Wert(e) | Erwartetes Ergebnis |
|---|---|---|
| gültig – typisch | `87420`, `"87420"` | null (ok) |
| gültig – leer (optional) | `""`, `null` | null (ok) |
| ungültig – negativ | `-1`, `-500` | Fehlermeldung "nicht negativ" |
| ungültig – kein Integer | `123.5` | Fehlermeldung "ganze Zahl" |
| ungültig – zu groß | `10_000_000` | Fehlermeldung "Plausibilitätsgrenze" |

→ 5 Klassen × mind. 1 Wert = mind. 5 Testfälle.

### 2.2 Grenzwertanalyse (bei allen numerischen Validatoren)

**Vorgehen:** An den Rändern zulässiger Bereiche werden jeweils die Werte
*gerade innerhalb*, *am Rand* und *gerade außerhalb* getestet.

**Beispiel `validateBaujahr` mit Bereich [1885, aktuelles Jahr + 1]:**

| Wert | Position | Erwartung |
|---|---|---|
| `1884` | gerade unterhalb | Fehler |
| `1885` | untere Grenze | ok |
| `1886` | gerade innerhalb | ok |
| `aktuellesJahr + 1` | obere Grenze | ok |
| `aktuellesJahr + 2` | gerade oberhalb | Fehler |

→ 5 Randwerte = 5 Testfälle mindestens.

Analog bei `validateKmStand` mit `0`, `1`, `KM_STAND_MAX`, `KM_STAND_MAX + 1`.

### 2.3 Spezielle Regressions-Tests (aus Mail Fuchs 2026-04-24)

Zusätzlich zu Äquivalenzklassen und Grenzwerten sind **alle konkret von der
Dozentin gemeldeten Fehleingaben** als dedizierte Regressions-Testfälle
abgebildet:

| Regression | Testfall | Wo im Test-File |
|---|---|---|
| Negativer KM-Stand | `validateKmStand(-1)` | `validators.test.js` → `describe('validateKmStand')` |
| Buchstaben in Telefon | `validateTelefon("ABC123")` | `describe('validateTelefon')` |
| Ungültiges E-Mail-Format | `validateEmail("notanemail")` | `describe('validateEmail')` |
| Bestanden trotz 2 Hauptmängel | `validateStatusWechsel(BESTANDEN, [{kat:'HM'}, {kat:'HM'}])` | `describe('validateStatusWechsel')` |
| Doppelte Kennzeichen | `validateKennzeichenUnique("B-TK 1234", [...existing])` | `describe('validateKennzeichenUnique')` |
| VW Golf als Motorrad | `checkHerstellerModellKonsistenz("VW", "Golf", "Motorrad")` | `describe('checkHerstellerModellKonsistenz')` |
| BMW Polo | `checkHerstellerModellKonsistenz("BMW", "Polo", "PKW")` | `describe('checkHerstellerModellKonsistenz')` |

### 2.4 Entscheidungstabelle (bei Workflow-Regel WF-01)

`validateStatusWechsel` hat zwei Eingaben (Ziel-Status × Mängelliste) — eine
Entscheidungstabelle erzwingt die systematische Abdeckung aller Kombinationen:

| Ziel-Status | Mängel | Erwartetes Ergebnis | Testfall |
|---|---|---|---|
| `BESTANDEN` | leer | ok | Happy-Path |
| `BESTANDEN` | nur `LM` / `EM` | ok | keine Hauptmängel |
| `BESTANDEN` | enthält `HM` | Fehler | Regression Fuchs |
| `BESTANDEN` | enthält `GM` | Fehler | Gefährlicher Mangel blockt ebenfalls |
| `BESTANDEN` | mix + mind. 1 HM | Fehler | Auch bei gemischtem Set reicht 1 HM |
| `NICHT_BESTANDEN` | mit HM | ok | Korrekte Zielrichtung |
| `NACHPRUEFUNG` | mit HM | ok | Auch hier kein Blocker |
| `GEPLANT` | leer | ok | Nicht-BESTANDEN-Fälle immer durch |

→ 8 Zeilen = 8 Testfälle, vollständige Kombinations-Abdeckung.

### 2.5 State-based-Test (bei Komponenten mit State)

Für State-halte Komponenten (z. B. `Inp` mit Fokus-State, `BtnP` mit
disabled/danger) testen wir die beiden relevanten Zustände jeweils.

**Beispiel `BtnP`:**

| State | Test |
|---|---|
| default | Rendert "Speichern", `onClick` wird bei Click aufgerufen |
| `disabled = true` | `onClick` wird **nicht** aufgerufen, CSS zeigt niedrige Opacity |
| `danger = true` | Rendert in roter Farbe |
| `icon = Shield` | Icon-Element wird vor Children gerendert |

## 3. Testbereiche & aktuelle Abdeckung

Das Repo enthält Tests in `src/tests/`:

### 3.1 Unit-Tests (reine Funktionen)

| Datei | Test-Gegenstand | Abdeckung |
|---|---|---|
| `utils/date.test.js` | `isoDate`, `addDays`, `fmtDate`, `dayName`, `dayShort` | 13 Testfälle, alle Zeitzonen-kritischen Pfade |
| `utils/mangel.test.js` | `hatHauptmangel` | 7 Testfälle, Äquivalenzklassen für Mängelkategorien |
| `utils/validators.test.js` | Alle Validatoren (neu in Sprint 5) | 50+ Testfälle, Äquivalenzklassen + Grenzwerte + Regression Fuchs |

### 3.2 Component-Tests (React Testing Library)

| Datei | Test-Gegenstand | Abdeckung |
|---|---|---|
| `components/StatusPill.test.jsx` | `StatusPill` | 4 Testfälle: Rendering aller Statuswerte + Größenvarianten |
| `components/buttons.test.jsx` | `BtnP`, `BtnG`, `IconBtn` | 13 Testfälle: Rendering, Click, disabled, danger |
| `components/inputs.test.jsx` | `Inp`, `Sel`, `Fld` | Testfälle: Default-Wert, onChange, Error-State, placeholder |

### 3.3 Hook-Tests

| Datei | Test-Gegenstand | Abdeckung |
|---|---|---|
| `hooks/useToasts.test.js` | `useToasts` | 6 Testfälle: Sonner-Integration (success/error/info/warn) |

### 3.4 Absichtlich **nicht** abgedeckt

- `useStore`-Hook: Würde einen Firestore-Mock brauchen. Geplant in US-66 bei DB-Migration, wenn wir ohnehin die Persistenz-Schicht überarbeiten.
- Views (FahrzeugeView, TagesplanView, StatistikView, BerichteView): Zu viel Aggregation, würde hauptsächlich Mock-Daten testen. Business-Logik wurde in Utilities ausgelagert, die separat getestet werden.
- Modals (FahrzeugModal, TerminModal, MaengelModal): Form-Logik ruft Utilities auf, diese sind getestet. Rendering ist mit PropTypes dokumentiert.

## 4. Abdeckungs-Ziele

| Ebene | Ziel | Aktuell |
|---|---|---|
| `src/utils/` | > 90 % Statement-Coverage | nicht gemessen; alle Funktionen mit > 5 Testfällen |
| `src/components/ui/` | > 70 % Statement-Coverage | StatusPill, buttons, inputs getestet |
| Gesamt | > 70 % | geschätzt ~60–70 % (ohne Coverage-Lauf) |

**Messung:** Vitest kann `--coverage` via `@vitest/coverage-v8`; wird bei
Bedarf in CI aktiviert. Für den Prototyp-Scope ist manuelle Zählung der
Testfälle pro Einheit ausreichend.

## 5. Testprozess im Team

- Jeder Pull Request läuft lokal `npm run test` grün, bevor Review startet
- Neue Business-Logik = neue Testfälle (Definition of Done Punkt 6)
- Bei Bug-Reports wird zuerst ein fehlschlagender Regression-Test geschrieben, dann der Fix — so wie bei den Fuchs-Regressionen vorgegangen wurde

## 6. Ausblick

- **Integrations-Tests gegen Firestore-Emulator:** `@firebase/rules-unit-testing` ermöglicht das isolierte Testen der Store-Layer. Geplant bei Umstellung auf Auth/Security Rules (US-60, US-61).
- **E2E-Tests:** Playwright oder Cypress könnten den Kernflow "Fahrzeug → Termin → Mängel → Bericht" abdecken. Aufwand ~2 Sprints, daher nicht im Prototyp-Scope.
- **Visual-Regression:** Percy oder Chromatic für Chart-Darstellungen.
- **Last-Tests:** k6 oder Artillery, relevant erst ab realem Nutzerstamm.

## 7. Glossar

| Begriff | Bedeutung |
|---|---|
| Äquivalenzklasse | Menge von Eingaben, die vom Code gleich behandelt werden — 1 Testfall pro Klasse reicht für funktionale Abdeckung |
| Grenzwertanalyse | Testet an den Rändern von Bereichen (häufige Bug-Quelle) |
| Regression | Wiederherstellen eines bereits gefixten Bugs; Regression-Tests dagegen sichern permanent ab |
| DoD (Definition of Done) | Team-weite Liste von Kriterien, die jede Story erfüllen muss |
| SUT | System Under Test — der Code, der gerade getestet wird |
