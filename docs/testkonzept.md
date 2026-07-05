# Testkonzept

Stand: 2026-07-05  
Zielarchitektur: React/Vite + Express API (Login/Rollen) + MariaDB.

## 1. Testziele

Die Tests sollen fachliche Regeln, UI-Verhalten, API-Erreichbarkeit,
Zugriffsschutz und Datenkonsistenz absichern.

Schwerpunkte:

- Validatoren für Kennzeichen, FIN, Baujahr und Kilometerstand
  (Frontend **und** serverseitig in `server/validate.js`)
- Komponenten- und Hook-Verhalten
- UI-Flows (Login, Fahrzeug-Anlage, Termin-Anlage, WF-01-Status,
  Rollen-Gating) in `src/tests/flows/`
- Auth-Bausteine (Passwort-Hashing, Token, Rollen-Matrix) in
  `server/tests/auth.test.js`
- Workflow-Regel WF-01 (Integrationstests gegen echte MariaDB)
- MariaDB-API-Start und Healthcheck
- Build- und TypeScript-Prüfung

## 2. Testpyramide

| Ebene | Beispiele | Werkzeug |
|---|---|---|
| Unit | Validatoren (Frontend + `server/validate.js`), Datumsfunktionen, Auth-Funktionen (`server/auth.js`), reine Hilfsfunktionen | Vitest |
| Component | Modale, Buttons, Inputs, StatusPill | React Testing Library |
| Hook | `useDb`, optimistische Updates, Fehlerpfade, AuthContext | Vitest |
| UI-Flow | Login-Flow, Fahrzeug anlegen, Termin anlegen, WF-01-Statuswechsel, Rollen-Gating (`src/tests/flows/`, API gemockt) | React Testing Library |
| API-Integration | WF-01 über alle drei Layer plus Boot-Guard gegen laufende MariaDB (`server/tests/wf01.test.js`, CI mit MariaDB-Service) | Vitest |
| API-Smoke | `/api/health`, `/api/fahrzeuge` gegen MariaDB | PowerShell/HTTP |
| Manuell | Tagesplan, PDF, mobile Ansicht | Browser |

## 3. Testentwurfsverfahren

### Aequivalenzklassen

Beispiel Kennzeichen:

- gültige Standardkennzeichen
- ungültige Kreiskennzeichen
- zu lange Eingaben
- Sonderzeichen
- Saisonkennzeichen

### Grenzwertanalyse

Beispiele:

- Baujahr an den Grenzen 1885 und 2100
- Kilometerstand 0 und 3.000.000
- Mindestlaengen für Pflichtfelder

### Entscheidungstabelle

WF-01 (Kategorien nach HU-Richtlinie: OM/GM nicht blockierend, EM/GfM
blockierend; behobene Mängel zählen nicht):

| Mängel vorhanden | Kategorie | Zielstatus | Erwartung |
|---|---|---|---|
| nein | - | Bestanden | erlaubt |
| ja | OM/GM | Bestanden | erlaubt |
| ja | EM/GfM (nicht behoben) | Bestanden | blockiert |
| ja | EM/GfM (behoben) | Bestanden | erlaubt |
| ja | EM/GfM | Nicht bestanden | erlaubt |

### Zustandsbasierter Test

Terminstatus:

```text
Geplant -> In Prüfung -> Bestanden
Geplant -> In Prüfung -> Nicht bestanden -> Nachprüfung
```

## 4. Automatisierte Befehle

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

Die Suite umfasst aktuell 231 Tests (167 Frontend inkl. 12 UI-Flow-Tests,
38 Server-Validate, 17 Auth, 7 WF-01-Integration, 2 Boot-Guard). Die CI
(GitHub Actions) fährt dafür eine echte MariaDB als Service hoch; zusätzlich
läuft CodeQL. Achtung: `npm test` reseedet die per `.env` konfigurierte
Datenbank pro WF-01-Testfall — nie gegen einen Produktivstand laufen lassen.

Aktuell in dieser Arbeitskopie verifiziert:

- `npm run build`: erfolgreich
- `npm run typecheck`: erfolgreich
- API-Job mit `GET /api/health`: erfolgreich
- `GET /api/fahrzeuge`: Daten aus MariaDB gelesen

## 5. API-Smoke-Test

Voraussetzung: MariaDB und API laufen. Empfohlen über Docker Compose:

```powershell
docker compose up -d
Invoke-RestMethod http://localhost:8787/api/health
Invoke-RestMethod http://localhost:8787/api/fahrzeuge
```

Alternativ manuell mit lokalem MariaDB:

```powershell
npm run api
Invoke-RestMethod http://127.0.0.1:8787/api/health
Invoke-RestMethod http://127.0.0.1:8787/api/fahrzeuge
```

Erwartung:

- Healthcheck liefert `ok = true`
- Fahrzeug-Endpunkt liefert ein JSON-Array
- Bei fehlender Datenbankverbindung startet die API nicht erfolgreich

## 6. Manuelle Smoke-Tests

| Bereich | Schritte | Erwartung |
|---|---|---|
| Start | API und Frontend starten | App laedt ohne Endlos-Spinner |
| Demo | Demo-Daten laden | Fahrzeuge und Termine erscheinen |
| Fahrzeug | Fahrzeug anlegen, bearbeiten, löschen | Änderungen bleiben nach Reload sichtbar |
| Termin | Termin anlegen und Status ändern | Tagesplan aktualisiert sich |
| Mangel | EM/GfM hinzufuegen | `Bestanden` wird verhindert |
| Login | Mit `empfang` anmelden | Status-/Lösch-Aktionen sind ausgeblendet und serverseitig gesperrt |
| Bericht | Bericht öffnen und drucken | A4-Ansicht ist nutzbar |
| Mobile | 360 px Viewport prüfen | Navigation und Modale bleiben bedienbar |

## 7. Nicht automatisiert

- CRUD-Integrationstests für die übrigen API-Endpunkte gegen eine echte DB
  (automatisiert ist bislang nur der WF-01-Pfad in `server/tests/wf01.test.js`)
- Passwort-Self-Service existiert nicht — Passwort-Änderungen laufen manuell
  über die DB und sind entsprechend ungetestet
- echte Mehrbenutzer-Konflikte (der 5-Sekunden-Polling-Sync aus US-16 ist
  umgesetzt, Race-Szenarien mit mehreren Schreibern sind aber nicht
  automatisiert getestet)
- Lasttests mit vielen parallelen Clients
- Restore-Test gegen ein echtes Backup (siehe `docs/backup.md` Punkt 5)
- visuelle Regressionstests über alle Viewports

Diese Punkte sind dokumentierte Restrisiken.
