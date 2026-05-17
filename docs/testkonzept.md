# Testkonzept

Stand: 2026-05-17  
Zielarchitektur: React/Vite + Express API + MariaDB.

## 1. Testziele

Die Tests sollen fachliche Regeln, UI-Verhalten, API-Erreichbarkeit und
Datenkonsistenz absichern.

Schwerpunkte:

- Validatoren fuer Kennzeichen, FIN, Baujahr und Kilometerstand
- Komponenten- und Hook-Verhalten
- Workflow-Regel WF-01
- MariaDB-API-Start und Healthcheck
- Build- und TypeScript-Pruefung

## 2. Testpyramide

| Ebene | Beispiele | Werkzeug |
|---|---|---|
| Unit | Validatoren, Datumsfunktionen, reine Hilfsfunktionen | Vitest |
| Component | Modale, Buttons, Views mit Testdaten | React Testing Library |
| Hook | `useDb`, optimistische Updates, Fehlerpfade | Vitest |
| API-Smoke | `/api/health`, `/api/fahrzeuge` gegen MariaDB | PowerShell/HTTP |
| Manuell | Tagesplan, PDF, mobile Ansicht | Browser |

## 3. Testentwurfsverfahren

### Aequivalenzklassen

Beispiel Kennzeichen:

- gueltige Standardkennzeichen
- ungueltige Kreiskennzeichen
- zu lange Eingaben
- Sonderzeichen
- Saisonkennzeichen

### Grenzwertanalyse

Beispiele:

- Baujahr an den Grenzen 1885 und 2100
- Kilometerstand 0 und 3.000.000
- Mindestlaengen fuer Pflichtfelder

### Entscheidungstabelle

WF-01:

| Maengel vorhanden | Blockierende Kategorie | Zielstatus | Erwartung |
|---|---|---|---|
| nein | nein | Bestanden | erlaubt |
| ja | LM/EM | Bestanden | erlaubt |
| ja | HM/GM | Bestanden | blockiert |
| ja | HM/GM | Nicht bestanden | erlaubt |

### Zustandsbasierter Test

Terminstatus:

```text
Geplant -> In Pruefung -> Bestanden
Geplant -> In Pruefung -> Nicht bestanden -> Nachpruefung
```

## 4. Automatisierte Befehle

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

Aktuell in dieser Arbeitskopie verifiziert:

- `npm run build`: erfolgreich
- `npm run typecheck`: erfolgreich
- API-Job mit `GET /api/health`: erfolgreich
- `GET /api/fahrzeuge`: Daten aus MariaDB gelesen

## 5. API-Smoke-Test

Voraussetzung: MariaDB laeuft und `.env` ist gesetzt.

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
| Fahrzeug | Fahrzeug anlegen, bearbeiten, loeschen | Aenderungen bleiben nach Reload sichtbar |
| Termin | Termin anlegen und Status aendern | Tagesplan aktualisiert sich |
| Mangel | HM/GM hinzufuegen | `Bestanden` wird verhindert |
| Bericht | Bericht oeffnen und drucken | A4-Ansicht ist nutzbar |
| Mobile | 360 px Viewport pruefen | Navigation und Modale bleiben bedienbar |

## 7. Nicht automatisiert

- echte Mehrbenutzer-Konflikte
- Lasttests mit vielen parallelen Clients
- produktive Backup-/Restore-Prozesse
- visuelle Regressionstests ueber alle Viewports

Diese Punkte sind fuer den lokalen Prototyp dokumentierte Restrisiken.
