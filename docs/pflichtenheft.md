# Pflichtenheft

Stand: 2026-05-17  
System: TUEV Pruefstelle Pro mit React/Vite, Express API und MariaDB.

## 1. Ziel

Die Anwendung unterstuetzt eine Pruefstelle bei Terminplanung,
Fahrzeugverwaltung, Maengelerfassung, Statistik und Berichtsausgabe. Daten
werden zentral in MariaDB gespeichert und ueber eine Express-API bereitgestellt.

## 2. Systemgrenzen

Im Scope:

- Fahrzeuge, Halter, Termine und Maengel verwalten
- Stammdaten fuer Status, Pruefarten, Pruefer und Mangelkategorien
- Workflow-Regel: kein `Bestanden` bei blockierenden Maengeln
- Statistik- und Berichtsansichten
- PDF-Ausgabe ueber Browser-Druck
- Lokaler Betrieb mit MariaDB, Express API und Vite

Nicht im Scope:

- Benutzer- und Rollenverwaltung
- Mandantenfaehigkeit
- amtliche Schnittstellen zu TUEV/KBA
- Online-Zahlung
- automatische Synchronisation ohne laufende API

## 3. Funktionale Anforderungen

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| F-01 | Halter verwalten | Halter koennen angelegt, bearbeitet, geloescht und gelistet werden |
| F-02 | Fahrzeuge verwalten | Fahrzeuge koennen mit Halterbezug gepflegt werden |
| F-03 | Termine planen | Termine koennen Fahrzeugen zugeordnet und nach Datum angezeigt werden |
| F-04 | Status pflegen | Statuswechsel sind ueber UI und API moeglich |
| F-05 | WF-01 durchsetzen | `Bestanden` wird bei HM/GM verhindert |
| F-06 | Maengel erfassen | Maengel koennen mit Kategorie und Beschreibung gespeichert werden |
| F-07 | Statistik anzeigen | Kennzahlen und Diagramme basieren auf MariaDB-Daten |
| F-08 | Berichte erzeugen | Pruefberichte koennen angezeigt und gedruckt werden |
| F-09 | Demo-Daten laden | `/api/admin/demo` erzeugt reproduzierbare Beispieldaten |
| F-10 | Daten zuruecksetzen | `/api/admin/reset` entfernt Bewegungsdaten |

## 4. Nicht-funktionale Anforderungen

| ID | Anforderung | Ziel |
|---|---|---|
| NF-01 | Startbarkeit | API und Frontend starten mit dokumentierten npm-Skripten |
| NF-02 | Datenkonsistenz | MariaDB erzwingt FKs, UNIQUE und CHECK-Constraints |
| NF-03 | Mehrclient-Faehigkeit | Mehrere Browser greifen auf dieselbe MariaDB zu |
| NF-04 | Wartbarkeit | SQL liegt zentral in `server/index.js`/`server/db.js` |
| NF-05 | Portabilitaet | Zugangsdaten liegen in `.env` |
| NF-06 | Datenschutz | Keine geheimen Zugangsdaten im Frontend-Bundle |
| NF-07 | Performance | CRUD-Operationen laufen lokal im LAN ohne spuerbare UI-Blockade |
| NF-08 | Testbarkeit | Build, Typecheck und Vitest sind automatisierbar |

## 5. Datenhaltung

Die Datenhaltung erfolgt in MariaDB. Das Frontend speichert keine produktiven
Daten dauerhaft im Browser. Die Express-API:

- erstellt die Datenbank bei Bedarf,
- erstellt Tabellen bei Bedarf,
- seedet Stammdaten idempotent,
- mappt Datenbankfelder auf Frontend-Felder,
- kapselt direkte SQL-Zugriffe vor den Views.

## 6. Sicherheit und Datenschutz

- MariaDB-Zugangsdaten werden ueber `.env` geladen.
- `.env` ist in `.gitignore` ausgeschlossen.
- Das Frontend bekommt keine Datenbank-Credentials.
- Die API nutzt parametrisierte Queries.
- Fuer produktiven Betrieb sind Authentifizierung, HTTPS, Backups und
  rollenbasierte Datenbankrechte nachzuziehen.

## 7. Betrieb

Lokaler Betrieb:

```powershell
npm run api
npm run dev
```

Die API laeuft standardmaessig auf Port `8787`, das Frontend auf Vite-Port
`5173`. Vite proxyt `/api` an die API.

## 8. Abnahmekriterien

- `npm run build` ist erfolgreich.
- `npm run typecheck` ist erfolgreich.
- `GET /api/health` liefert `{ ok: true }`.
- `GET /api/fahrzeuge` liefert Daten aus MariaDB.
- Demo-Daten koennen geladen und danach in Tagesplan, Fahrzeuge, Statistik und
  Berichte verwendet werden.
- Ein Termin mit HM/GM kann nicht als `Bestanden` gespeichert werden.

## 9. Offene Erweiterungen

- Authentifizierung und Benutzerrollen
- produktives Backup-/Restore-Konzept
- Migrationsversionierung fuer Schema-Aenderungen
- API-Tests gegen eine isolierte Testdatenbank
- Deployment-Konzept fuer API plus MariaDB

## 10. Aenderungshistorie

| Version | Datum | Aenderung |
|---|---|---|
| 3.0 | 2026-05-17 | Dokumentation auf MariaDB/Express umgestellt |
