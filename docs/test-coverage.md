# Test Coverage

Stand: 2026-05-17

## 1. Automatisierte Abdeckung

Die vorhandenen Tests decken vor allem Validatoren, UI-Komponenten, Hooks und
fachliche Regeln ab. Die aktive Persistenzschicht ist MariaDB hinter einer
Express-API.

Wichtige Testbereiche:

- Kennzeichen-, FIN-, Baujahr- und Kilometerstandsvalidierung
- Termin- und Mangel-Workflow
- Statuslogik
- UI-Komponenten und Modale
- Hook-Verhalten in `useDb`
- Build- und TypeScript-Pruefung

## 2. Laufende Checks

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

In dieser Arbeitskopie wurden erfolgreich ausgefuehrt:

- `npm run build`
- `npm run typecheck`
- API-Smoke-Test gegen MariaDB

## 3. MariaDB-spezifische Pruefung

Der wichtigste Integrationspfad ist:

```text
React Hook -> apiClient.ts -> Express API -> MariaDB
```

Smoke-Test:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/api/health
Invoke-RestMethod http://127.0.0.1:8787/api/fahrzeuge
```

Damit wird geprueft, dass die API startet, `.env` liest, MariaDB erreicht und
Daten serialisiert.

## 4. Restrisiken

- Es gibt noch keine isolierte MariaDB-Testdatenbank fuer jeden Testlauf.
- API-Endpunkte sind teilweise nur per Smoke-Test statt vollstaendig per
  automatisiertem Integrationstest abgedeckt.
- Produktive Themen wie Authentifizierung, Backups und Rollenkonzepte sind
  nicht automatisiert getestet.
- Browser-PDF-Ausgabe wird manuell geprueft.

## 5. Naechste sinnvolle Tests

- API-Integrationstests gegen eine temporare MariaDB-Datenbank
- Tests fuer alle Fehlerpfade bei UNIQUE/FK/CHECK-Verletzungen
- E2E-Test: Demo-Daten laden, Termin bearbeiten, Bericht oeffnen
- Test fuer WF-01 direkt gegen `/api/termine/:id/status`
