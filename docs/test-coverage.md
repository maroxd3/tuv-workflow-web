# Test Coverage

Stand: 2026-08-20  
Ausgeführt mit: `npm test` (Achtung: reseedet die konfigurierte DB — nie
gegen einen Produktivstand laufen lassen)

## 1. Ergebnis der aktuellen Testausfuehrung

Die Suite umfasst **251 Tests**:

| Bereich | Tests |
|---|---:|
| Frontend (`src/tests/`, davon 13 UI-Flow-Tests in `src/tests/flows/`) | 168 |
| Server-Validierung + Middleware (`server/tests/validate.test.js`) | 51 |
| Auth-Bausteine (`server/tests/auth.test.js`) | 17 |
| WF-01-Integration gegen echte MariaDB (`server/tests/wf01.test.js`) | 6 |
| Termin-Routen-Regression gegen echte MariaDB (`server/tests/termin-status-routen.test.js`) | 7 |
| Boot-Guard (`server/tests/admin-token-boot.test.js`) | 2 |
| **Gesamt** | **251** |

Ohne laufende MariaDB überspringt Vitest die 13 Integrationstests
automatisch (Health-Pre-Flight): ein lokaler Lauf ohne Stack meldet dann
**238 grün, 15 übersprungen** (13 Integrationstests + 2 Platzhalter in den
Skip-Zweigen).

Die Integrationstests laufen in der GitHub-Actions-CI gegen einen echten
MariaDB-Service; der SQL-Bypass-Test (Ebene 3) benötigt lokal den
Docker-Stack und ist in CI via `TUV_SKIP_SQL_BYPASS=1` ausgenommen.
Zusätzlich läuft CodeQL als statische Analyse.

Beide Integrationsdateien reseeden dieselbe Datenbank. Die Vitest-Konfiguration
(`vite.config.js`) trennt deshalb zwei Projekte: `frontend` (jsdom, Dateien
parallel) und `server` (node, `fileParallelism: false` — Dateien laufen
nacheinander, damit sie sich die Testdaten nicht gegenseitig löschen).

Die früher hier dokumentierten V8-Coverage-Prozentwerte stammen vom Stand
2026-05-19 und sind nach dem Umbau (Auth, Migrationen, UI-Flows) nicht mehr
aussagekräftig; ein frischer Lauf mit `npx vitest run --coverage` liefert
die aktuellen Zahlen.

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
| `src/tests/hooks/useDb.test.ts` | State-Hook: Laden, optimistische Updates, Fehlerpfade, Halter-Dedupe |
| `src/tests/auth/AuthContext.test.tsx` | Login/Logout-Zustände, Token-Handling, `useRechte()` |
| `src/tests/flows/*.test.jsx` | UI-Flows mit gemockter API: Login, Fahrzeug-Anlage, Termin-Anlage (inkl. gesperrtem Status-Feld), WF-01-Status, Rollen-Gating |
| `server/tests/validate.test.js` | Serverseitige Eingabe-Validierung inkl. UUID-Format für Client-IDs |
| `server/tests/auth.test.js` | scrypt-Hashing, HMAC-Token (Signatur/Ablauf), Rollen-Matrix |
| `server/tests/admin-token-boot.test.js` | Boot-Verweigerung ohne `ADMIN_TOKEN` in Produktion |
| `server/tests/wf01.test.js` | Express-API + MariaDB-Trigger: WF-01 blockiert `Bestanden` bei EM/GfM auf DB-Ebene |
| `server/tests/termin-status-routen.test.js` | Rechte-Härtung: Status ist nur über `PATCH /api/termine/:id/status` änderbar; `POST /api/termine` legt immer `Geplant` an |

## 3. Was wird gut abgedeckt?

- Eingabevalidierung für Fahrzeug- und Terminformulare — im Frontend und
  serverseitig (`server/validate.js`)
- Aequivalenzklassen und Grenzwerte bei Kennzeichen, FIN, Baujahr und Kilometerstand
- Workflow-Regel auf allen drei Ebenen: UI-Guard, API-Guard und MariaDB-Trigger blockieren `Bestanden` bei EM/GfM (siehe `server/tests/wf01.test.js`)
- Auth-Bausteine: Passwort-Hashing, Token-Signatur und -Ablauf, Rollen-Matrix
  (fail-closed für unbekannte Rollen)
- UI-Flows von Login bis WF-01-Statuswechsel mit gemockter API
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
aktuellen MariaDB-Architektur gehören. Der WF-01-Pfad ist inzwischen als
Integrationstest gegen eine echte MariaDB automatisiert (lokal und in CI);
CRUD-Integrationstests für die übrigen Endpunkte stehen noch aus.

## 5. Coverage nach Bereichen

Die letzte veröffentlichte Bereichs-Coverage stammt vom Stand 2026-05-19
(vor Auth-, Migrations- und Flow-Test-Umbau) und wird hier nicht mehr als
aktuell ausgewiesen. Aktuelle Zahlen: `npx vitest run --coverage`.

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

- CRUD-Integrationstests für die übrigen Express-Endpunkte (`/api/halter`,
  `/api/fahrzeuge`, `/api/maengel`) gegen eine echte Testdatenbank —
  automatisiert sind bislang der WF-01-Pfad und die Termin-Status-Routen
- Passwort-Self-Service existiert nicht (Passwort-Änderung nur manuell in der
  DB) und ist entsprechend ungetestet
- Fehlerpfad-Tests für MariaDB-Fehler auf API-Ebene: UNIQUE, FK, CHECK
  (das Fehler-Mapping in `server/index.js` ist implementiert, aber nicht
  per Integrationstest abgedeckt)
- Mehrbenutzer-/Parallelitaets-Tests (Polling-Race-Conditions in `useDb`)
- Automatisierte E2E-Tests im echten Browser (die UI-Flow-Tests laufen in
  jsdom mit gemockter API)

## 8. Bewertung

Die Testabdeckung ist für Validatoren (beidseitig), Auth-Bausteine,
Hilfsfunktionen, zentrale UI-Bausteine und die wichtigsten UI-Flows hoch.
Der WF-01-Kern ist end-to-end gegen eine echte MariaDB abgesichert — auch in
CI. Wichtigste offene Punkte sind CRUD-Integrationstests für die übrigen
Endpunkte und der fehlende Passwort-Self-Service.
