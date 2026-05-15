# MariaDB-Setup

Dieser Branch stellt die Persistenz von lokaler PGlite/IndexedDB auf eine zentrale MariaDB-Datenbank um.

## Architektur

```text
React/Vite Frontend
-> Express API (server/index.js)
-> MariaDB Server
```

Die fachlichen Tabellen bleiben gleich:

```text
halter
fahrzeug
termin
mangel
status
pruefart
pruefer
mangel_kategorie
```

## Lokaler Start

1. MariaDB starten.
2. Einen App-User in MariaDB anlegen.

```sql
CREATE DATABASE IF NOT EXISTS tuv_workflow
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'tuv_app'@'localhost'
  IDENTIFIED BY 'tuv_app_pw';

GRANT ALL PRIVILEGES ON tuv_workflow.* TO 'tuv_app'@'localhost';
FLUSH PRIVILEGES;
```

3. `.env.example` nach `.env` kopieren und Zugangsdaten anpassen.

```text
MARIADB_USER=tuv_app
MARIADB_PASSWORD=tuv_app_pw
MARIADB_DATABASE=tuv_workflow
```

4. API starten:

```powershell
npm run api
```

5. In zweitem Terminal Frontend starten:

```powershell
npm run dev
```

Die API erstellt die Tabellen automatisch. Der Windows-`root`-User von MariaDB kann per `auth_gssapi_client` konfiguriert sein; dieser Auth-Mechanismus wird vom Node-Treiber nicht unterstuetzt. Deshalb ist ein normaler App-User mit Passwort empfohlen.

## Daten Ansehen

```sql
SHOW DATABASES;
USE tuv_workflow;
SHOW TABLES;
SELECT * FROM termin;
```

```sql
SELECT
  t.datum,
  t.uhrzeit,
  f.kennzeichen,
  h.name AS halter,
  t.status_code
FROM termin t
JOIN fahrzeug f ON f.fahrzeug_id = t.fahrzeug_id
JOIN halter h ON h.halter_id = f.halter_id
ORDER BY t.datum, t.uhrzeit;
```
