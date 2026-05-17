# Test Coverage

Stand: 2026-05-17  
Ausgeführt mit: `npm test` und `npx vitest run --coverage`

## 1. Ergebnis der aktuellen Testausführung

```text
Test Files  8 passed (8)
Tests       136 passed (136)
```

Coverage mit V8:

| Kennzahl | Abdeckung |
|---|---:|
| Statements | 93,61 % |
| Branches | 87,07 % |
| Functions | 80,59 % |
| Lines | 95,19 % |

```text
Statements   : 93.61% (264/282)
Branches     : 87.07% (229/263)
Functions    : 80.59% (54/67)
Lines        : 95.19% (198/208)
```

## 2. Testdateien

| Datei | Schwerpunkt |
|---|---|
| `src/tests/utils/validators.test.js` | Kennzeichen, FIN, Baujahr, Kilometerstand, Telefon, E-Mail, HU-/Termin-Datum, Statuswechsel |
| `src/tests/utils/mangel.test.js` | HM/GM-Erkennung und Mängelkatalog-Konsistenz |
| `src/tests/utils/date.test.js` | Datumsformatierung und lokale Datumskonvertierung |
| `src/tests/components/buttons.test.jsx` | UI-Buttons, Varianten, Zustände |
| `src/tests/components/inputs.test.jsx` | Eingabekomponenten |
| `src/tests/components/StatusPill.test.jsx` | Statusanzeige |
| `src/tests/hooks/useToasts.test.js` | Toast-Hook |
| `src/db/db.test.ts` | Relationales Schema, Fremdschlüssel, UNIQUE, CHECK und Cascades gegen eine isolierte SQL-Testdatenbank |

## 3. Was wird gut abgedeckt?

- Eingabevalidierung für Fahrzeug- und Terminformulare
- Äquivalenzklassen und Grenzwerte bei Kennzeichen, FIN, Baujahr und Kilometerstand
- Workflow-Regel auf UI-/Hilfsfunktions-Ebene: HM/GM blockiert `Bestanden`
- Mängelkatalog: Einträge, eindeutige Codes, bekannte Kategorien
- Wiederverwendbare UI-Komponenten
- Hilfsfunktionen für Datum und Toasts
- Relationale Integrität im Schema-Test: FK, CASCADE, UNIQUE und CHECK

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

Wichtig: Die automatisierten DB-Tests in `src/db/db.test.ts` prüfen aktuell noch
das relationale Schema in einer isolierten SQL-Testumgebung. Sie sind nützlich
für Modellregeln, ersetzen aber noch keine vollständigen Express/MariaDB-
Integrationstests.

## 5. Coverage nach Bereichen

| Bereich | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `components/ui` | 89,47 % | 68,42 % | 77,77 % | 94,44 % |
| `constants` | 86,36 % | 50,00 % | 70,00 % | 88,23 % |
| `db` | 74,07 % | 100,00 % | 53,33 % | 69,56 % |
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

- Vollständige automatisierte Integrationstests gegen eine echte MariaDB-Testdatenbank
- API-Tests für alle Express-Endpunkte (`/api/halter`, `/api/fahrzeuge`, `/api/termine`, `/api/maengel`)
- Fehlerpfad-Tests für MariaDB-Fehler: UNIQUE, FK, CHECK
- Direkter Test für `PATCH /api/termine/:id/status` mit HM/GM in MariaDB
- Mehrbenutzer-/Parallelitäts-Tests
- Automatisierte E2E-Tests im Browser

## 8. Bewertung

Die Testabdeckung ist für Validatoren, Hilfsfunktionen und zentrale UI-Bausteine
hoch. Für die neue MariaDB-Architektur ist der wichtigste nächste Schritt,
automatisierte Express/MariaDB-Integrationstests aufzubauen. Aktuell ist dieser
Teil per Smoke-Test geprüft, aber noch nicht vollständig automatisiert.
