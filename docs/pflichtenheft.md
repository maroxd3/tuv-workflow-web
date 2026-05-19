# Pflichtenheft

Stand: 2026-05-17  
System: TÜV Prüfstelle Pro mit React/Vite, Express API und MariaDB.

## 1. Ziel

Die Anwendung unterstützt eine Prüfstelle bei Terminplanung,
Fahrzeugverwaltung, Mängelerfassung, Statistik und Berichtsausgabe. Daten
werden zentral in MariaDB gespeichert und über eine Express-API bereitgestellt.

## 2. Systemgrenzen

Im Scope:

- Fahrzeuge, Halter, Termine und Mängel verwalten
- Stammdaten für Status, Prüfarten, Prüfer und Mangelkategorien
- Workflow-Regel: kein `Bestanden` bei blockierenden Mängeln
- Statistik- und Berichtsansichten
- PDF-Ausgabe über Browser-Druck
- Lokaler Betrieb mit MariaDB, Express API und Vite

Nicht im Scope:

- Benutzer- und Rollenverwaltung
- Mandantenfähigkeit
- amtliche Schnittstellen zu TÜV/KBA
- Online-Zahlung
- automatische Synchronisation ohne laufende API

## 3. Funktionale Anforderungen

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| F-01 | Halter verwalten | Halter können angelegt, bearbeitet, gelöscht und gelistet werden |
| F-02 | Fahrzeuge verwalten | Fahrzeuge können mit Halterbezug gepflegt werden |
| F-03 | Termine planen | Termine können Fahrzeugen zugeordnet und nach Datum angezeigt werden |
| F-04 | Status pflegen | Statuswechsel sind über UI und API möglich |
| F-05 | WF-01 durchsetzen | `Bestanden` wird bei HM/GM verhindert |
| F-06 | Mängel erfassen | Mängel können mit Kategorie und Beschreibung gespeichert werden |
| F-07 | Statistik anzeigen | Kennzahlen und Diagramme basieren auf MariaDB-Daten |
| F-08 | Berichte erzeugen | Prüfberichte können angezeigt und gedruckt werden |
| F-09 | Demo-Daten laden | `/api/admin/demo` erzeugt reproduzierbare Beispieldaten |
| F-10 | Daten zurücksetzen | `/api/admin/reset` entfernt Bewegungsdaten |

## 4. Nicht-funktionale Anforderungen

| ID | Anforderung | Ziel |
|---|---|---|
| NF-01 | Startbarkeit | API und Frontend starten mit dokumentierten npm-Skripten |
| NF-02 | Datenkonsistenz | MariaDB erzwingt FKs, UNIQUE und CHECK-Constraints |
| NF-03 | Mehrclient-Fähigkeit | Mehrere Browser greifen auf dieselbe MariaDB zu |
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

- MariaDB-Zugangsdaten werden über `.env` geladen.
- `.env` ist in `.gitignore` ausgeschlossen.
- Das Frontend bekommt keine Datenbank-Credentials.
- Die API nutzt parametrisierte Queries.
- Für produktiven Betrieb sind Authentifizierung, HTTPS, Backups und
  rollenbasierte Datenbankrechte nachzuziehen.

## 7. Betrieb

### Zielmodell: On-Premise pro Prüfstelle

Jede Prüfstelle betreibt einen eigenen Server-PC mit Docker Compose. MariaDB
und die Express-API laufen lokal; Mitarbeiter verbinden sich vom Empfangs-,
Prüfer- oder Chef-Gerät über das interne Netzwerk.

### Empfohlener Start (Docker Compose)

```powershell
copy .env.example .env
docker compose up -d
npm install
npm run dev
```

### Alternativer Start (manuelles MariaDB)

```powershell
npm run api
npm run dev
```

Die API laeuft standardmäßig auf Port `8787`, das Frontend auf Vite-Port
`5173`. Vite proxyt `/api` an die API.

## 8. Abnahmekriterien

- `npm run build` ist erfolgreich.
- `npm run typecheck` ist erfolgreich.
- `GET /api/health` liefert `{ ok: true }`.
- `GET /api/fahrzeuge` liefert Daten aus MariaDB.
- Demo-Daten können geladen und danach in Tagesplan, Fahrzeuge, Statistik und
  Berichte verwendet werden.
- Ein Termin mit HM/GM kann nicht als `Bestanden` gespeichert werden.

## 9. Offene Erweiterungen

- Authentifizierung und Benutzerrollen (Phase 2)
- Backup-/Restore-Konzept teilweise umgesetzt (siehe `docs/backup.md`); Tier-2-
  und Tier-3-Skripte stehen aus
- Migrationsversionierung für Schema-Änderungen
- API-Tests gegen eine isolierte Testdatenbank (insbesondere WF-01-Endpunkt)
- Polling- oder Server-Sent-Events-Sync zwischen mehreren Clients in derselben
  Prüfstelle (aktuell nur Refresh nach eigenen Schreiboperationen)

## 10. Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 3.0 | 2026-05-17 | Dokumentation auf MariaDB/Express umgestellt |
| 3.1 | 2026-05-17 | On-Premise-Produktmodell, Docker-Compose-Betrieb und Backup-Roadmap ergänzt |
