# MariaDB-Setup

Diese Projektvariante nutzt MariaDB als zentrale Datenbank. Das Frontend greift
nur ueber die Express-API auf Daten zu.

## Architektur

```text
React/Vite Frontend
-> src/db/apiClient.ts
-> Express API (server/index.js)
-> MariaDB Driver (server/db.js)
-> MariaDB Datenbank tuv_workflow
```

## Voraussetzungen

- Node.js v18+
- MariaDB Server
- npm-Abhaengigkeiten aus `package-lock.json`

## Datenbank und Benutzer anlegen

```sql
CREATE DATABASE IF NOT EXISTS tuv_workflow
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'tuv_app'@'localhost'
  IDENTIFIED BY 'tuv_app_pw';

GRANT ALL PRIVILEGES ON tuv_workflow.* TO 'tuv_app'@'localhost';
FLUSH PRIVILEGES;
```

## .env

```text
MARIADB_HOST=127.0.0.1
MARIADB_PORT=3306
MARIADB_USER=tuv_app
MARIADB_PASSWORD=tuv_app_pw
MARIADB_DATABASE=tuv_workflow
API_PORT=8787
VITE_API_BASE_URL=/api
```

`.env` darf nicht committet werden. Eine Vorlage liegt in `.env.example`.

## Start

Terminal 1:

```powershell
npm run api
```

Terminal 2:

```powershell
npm run dev
```

Die API erstellt Tabellen und Stammdaten automatisch. Der Vite-Dev-Server
proxyt `/api` an `http://127.0.0.1:8787`.

## Pruefen

```powershell
Invoke-RestMethod http://127.0.0.1:8787/api/health
Invoke-RestMethod http://127.0.0.1:8787/api/fahrzeuge
```

In MariaDB:

```sql
USE tuv_workflow;
SHOW TABLES;
SELECT * FROM fahrzeug;
SELECT * FROM termin;
```

## Tabellen

- `halter`
- `fahrzeug`
- `termin`
- `mangel`
- `status`
- `pruefart`
- `pruefer`
- `mangel_kategorie`

## Hinweis zu Windows/MariaDB

Der Windows-`root`-User kann mit einem Authentifizierungsmechanismus
konfiguriert sein, den der Node-Treiber nicht unterstuetzt. Deshalb ist ein
normaler App-User mit Passwort empfohlen.
