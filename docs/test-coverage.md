# Test Coverage

Stand: 2026-05-19  
Ausgeführt mit: `npm test` und `npx vitest run --coverage`

## 1. Ergebnis der aktuellen Testausfuehrung

```text
Test Files  8 passed (8)
Tests       135 passed | 1 skipped (136)
```

Die zusätzlichen 11 Tests gegenüber dem Stand vom 17.05. stammen aus
`server/tests/wf01.test.js` (API-Test für den WF-01-DB-Trigger über
`PATCH /api/termine/:id/status`) sowie aus Regressionstests für die
HU-Richtlinie-Kategorien (OM/GM/EM/GfM).

Coverage mit V8:

| Kennzahl | Abdeckung |
|---|---:|
| Statements | 95,68 % |
| Branches | 87,07 % |
| Functions | 88,46 % |
| Lines | 98,37 % |

```text
Statements   : 95.68% (244/255)
Branches     : 87.07% (229/263)
Functions    : 88.46% (46/52)
Lines        : 98.37% (182/185)
```

## 2. Testdateien

| Datei | Schwerpunkt |
|---|---|
| `src/tests/utils/validators.test.js` | Kennzeichen, FIN, Baujahr, Kilometerstand, Telefon, E-Mail, HU-/Termin-Datum, Statuswechsel |
| `src/tests/utils/mangel.test.js` | EM/GfM-Erkennung (Alias `hatHauptmangel`), Mängelkatalog-Konsistenz, Kategorie-Validierung |
| `src/tests/utils/date.test.js` | Datumsformatierung und lokale Datumskonvertierung |
| `src/tests/components/buttons.test.jsx` | UI-Buttons, Varianten, Zustaende |
| `src/tests/components/inputs.test.jsx` | Eingabekomponenten |
| `src/tests/components/StatusPill.test.jsx` | Statusanzeige |
| `src/tests/hooks/useToasts.test.js` | Toast-Hook |
| `server/tests/wf01.test.js` | Express-API + MariaDB-Trigger: WF-01 blockiert `Bestanden` bei EM/GfM auf DB-Ebene |

## 3. Was wird gut abgedeckt?

- Eingabevalidierung für Fahrzeug- und Terminformulare
- Aequivalenzklassen und Grenzwerte bei Kennzeichen, FIN, Baujahr und Kilometerstand
- Workflow-Regel auf allen drei Ebenen: UI-Guard, API-Guard und MariaDB-Trigger blockieren `Bestanden` bei EM/GfM (siehe `server/tests/wf01.test.js`)
- Mängelkatalog: Eintraege, eindeutige Codes, alle vier HU-Richtlinie-Kategorien (OM/GM/EM/GfM)
- Wiederverwendbare UI-Komponenten
- Hilfsfunktionen für Datum und Toasts

## 4. MariaDB-spezifische Prüfung

Die aktive Laufzeitarchitektur ist:

```text
React Hook -> apiClient.ts -> Express API -> MariaDB
```

Für diesen Pfad wurde ein Smoke-Test gegen die lokale MariaDB ausgeführt:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/api/health
Invoke-RestMethod http://127.0.0.1:8787/api/fahrzeuge
```

Ergebnis:

- API startet mit `.env`
- MariaDB ist erreichbar
- `/api/health` liefert `ok = true`
- `/api/fahrzeuge` liefert Daten aus MariaDB

Alte Browserdatenbank- und Schema-Tests wurden entfernt, weil sie nicht mehr zur
aktuellen MariaDB-Architektur gehören. Automatisierte
Express/MariaDB-Integrationstests sind der nächste sinnvolle Schritt.

## 5. Coverage nach Bereichen

| Bereich | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `components/ui` | 89,47 % | 68,42 % | 77,77 % | 94,44 % |
| `constants` | 86,36 % | 50,00 % | 70,00 % | 88,23 % |
| `hooks` | 100,00 % | 100,00 % | 66,66 % | 100,00 % |
| `utils` | 97,05 % | 95,45 % | 100,00 % | 100,00 % |

## 6. Befehle

Normale Tests:

```powershell
npm test
```

Coverage:

```powershell
npx vitest run --coverage
```

Weitere Qualitätschecks:

```powershell
npm run typecheck
npm run build
npm run lint
```

## 7. Was fehlt noch?

- Vollständige automatisierte Integrationstests gegen eine echte MariaDB-Testdatenbank (`server/tests/wf01.test.js` deckt aktuell den WF-01-Pfad ab, weitere Endpoints folgen)
- API-Tests für die übrigen Express-Endpunkte (`/api/halter`, `/api/fahrzeuge`, `/api/termine`, `/api/mängel`)
- Fehlerpfad-Tests für MariaDB-Fehler: UNIQUE, FK, CHECK
- Mehrbenutzer-/Parallelitaets-Tests (Polling-Race-Conditions in `useDb`)
- Automatisierte E2E-Tests im Browser

## 8. Bewertung

Die Testabdeckung ist für Validatoren, Hilfsfunktionen und zentrale
UI-Bausteine hoch. Für die MariaDB-Architektur ist der wichtigste nächste
Schritt, automatisierte Express/MariaDB-Integrationstests aufzubauen. Aktuell
ist dieser Teil per Smoke-Test geprüft, aber noch nicht vollständig
automatisiert.
