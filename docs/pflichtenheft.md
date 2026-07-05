# Pflichtenheft

Stand: 2026-07-05  
System: TÜV Prüfstelle Pro mit React/Vite, Express API (Login/Rollen) und MariaDB.

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
- Login mit drei Rollen (empfang/pruefer/chef), serverseitig durchgesetzt
- Lokaler Betrieb mit MariaDB, Express API und Vite

Nicht im Scope:

- Benutzer-Selbstverwaltung (Passwort ändern, Konten anlegen über die UI)
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
| F-05 | WF-01 durchsetzen | `Bestanden` wird bei nicht behobenem EM/GfM verhindert |
| F-06 | Mängel erfassen | Mängel können mit Kategorie und Beschreibung gespeichert werden |
| F-07 | Statistik anzeigen | Kennzahlen und Diagramme basieren auf MariaDB-Daten |
| F-08 | Berichte erzeugen | Prüfberichte können angezeigt und gedruckt werden |
| F-09 | Demo-Daten laden | `/api/admin/demo` erzeugt reproduzierbare Beispieldaten |
| F-10 | Daten zurücksetzen | `/api/admin/reset` entfernt Bewegungsdaten |
| F-11 | Login und Rollen | `POST /api/auth/login` liefert ein Token; Schreiben/Status/Löschen ist rollenabhängig serverseitig gesperrt (empfang/pruefer/chef) |

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
| NF-09 | API-Härtung | Security-Header (helmet), Rate-Limits in Produktion, timing-sichere Token-Vergleiche, keine SQL-Fehlertexte in Fehlerantworten |

## 5. Datenhaltung

Die Datenhaltung erfolgt in MariaDB. Das Frontend speichert keine produktiven
Daten dauerhaft im Browser. Die Express-API:

- erstellt die Datenbank bei Bedarf,
- baut und aktualisiert das Schema über versionierte Migrationen
  (`server/migrations.js`, protokolliert in `schema_migration`, siehe ADR-011),
- seedet Stammdaten und Default-Benutzer idempotent,
- mappt Datenbankfelder auf Frontend-Felder,
- kapselt direkte SQL-Zugriffe vor den Views.

## 6. Sicherheit und Datenschutz

- MariaDB-Zugangsdaten werden über `.env` geladen.
- `.env` ist in `.gitignore` ausgeschlossen.
- Das Frontend bekommt keine Datenbank-Credentials.
- Die API nutzt parametrisierte Queries.
- Authentifizierung mit Rollen (empfang/pruefer/chef) ist umgesetzt:
  scrypt-Passwort-Hashes, HMAC-SHA256-Tokens (12 h), serverseitige
  Rechteprüfung pro Endpunkt; in Produktion per Default aktiv.
- API-Härtung: helmet-Security-Header, Rate-Limits in Produktion
  (inkl. Login-Brute-Force-Schutz), CORS auf LAN begrenzt,
  Admin-Endpunkte zusätzlich per `X-Admin-Token` geschützt.
- Für produktiven Betrieb noch nachzuziehen: HTTPS/TLS im LAN,
  Passwort-Self-Service und rollenbasierte Datenbankrechte.

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
- Ein Termin mit nicht behobenem EM/GfM kann nicht als `Bestanden`
  gespeichert werden.

## 9. Offene Erweiterungen

Inzwischen umgesetzt (Stand 2026-07-05):

- Authentifizierung und Benutzerrollen (empfang/pruefer/chef, siehe F-11)
- Migrationsversionierung für Schema-Änderungen (ADR-011)
- WF-01-Integrationstests gegen echte MariaDB (lokal per Docker-Stack,
  in der CI gegen einen MariaDB-Service)
- Polling-Sync zwischen mehreren Clients (5-Sekunden-Polling in `useDb`, US-16)

Weiterhin offen:

- Backup-/Restore-Konzept teilweise umgesetzt (siehe `docs/backup.md`); Tier-2-
  und Tier-3-Skripte stehen aus
- CRUD-Integrationstests für die übrigen API-Endpunkte gegen eine isolierte
  Testdatenbank
- Passwort-Self-Service und Benutzerverwaltung über die UI
- HTTPS/TLS im LAN

## 10. Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 3.0 | 2026-05-17 | Dokumentation auf MariaDB/Express umgestellt |
| 3.1 | 2026-05-17 | On-Premise-Produktmodell, Docker-Compose-Betrieb und Backup-Roadmap ergänzt |
| 3.2 | 2026-07-05 | Login/Rollen als F-11 aufgenommen, Sicherheit/Erweiterungen an den Ist-Stand angeglichen, WF-01-Kategorien auf EM/GfM korrigiert |
