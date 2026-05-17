# MariaDB-Setup

Diese Anleitung beschreibt den aktuellen Stand des Projekts: React/Vite im
Frontend, Express als API und MariaDB als zentrale Datenbank.

## 1. Architektur

```text
Browser
  -> React/Vite App
  -> src/db/apiClient.ts
  -> Express API (server/index.js)
  -> MariaDB Pool (server/db.js)
  -> MariaDB Datenbank tuv_workflow
```

Der Browser spricht niemals direkt mit MariaDB. Dadurch bleiben Datenbankhost,
Benutzer und Passwort im Backend.

## 2. Voraussetzungen

- Node.js und npm
- MariaDB Server
- Projektabhaengigkeiten aus `package-lock.json`

## 3. Datenbank und Benutzer anlegen

In MariaDB als Admin ausfuehren:

```sql
CREATE DATABASE IF NOT EXISTS tuv_workflow
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'tuv_app'@'localhost'
  IDENTIFIED BY 'tuv_app_pw';

GRANT ALL PRIVILEGES ON tuv_workflow.* TO 'tuv_app'@'localhost';
FLUSH PRIVILEGES;
```

Falls MariaDB nicht auf demselben Rechner wie die API laeuft, muss der Host im
User passend gesetzt werden, zum Beispiel `'tuv_app'@'%'` oder ein konkreter
Servername.

## 4. Environment

Lokale Datei `.env` im Projektordner:

```text
MARIADB_HOST=127.0.0.1
MARIADB_PORT=3306
MARIADB_USER=tuv_app
MARIADB_PASSWORD=tuv_app_pw
MARIADB_DATABASE=tuv_workflow
API_PORT=8787
VITE_API_BASE_URL=/api
```

`.env` wird nicht committet. Die Vorlage liegt in `.env.example`.

## 5. Lokal starten

Terminal 1, API:

```powershell
cd C:\Users\user\tuv-workflow-web
npm run dev:api
```

Terminal 2, Frontend:

```powershell
cd C:\Users\user\tuv-workflow-web
npm run dev
```

Die App ist lokal unter `http://localhost:5173` erreichbar. Vite leitet `/api`
an `http://127.0.0.1:8787` weiter.

## 6. Demo-Daten laden

Der Demo-Endpunkt loescht die lokalen Fachdaten und legt den Demo-Stand neu an:

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:8787/api/admin/demo
```

Erwartete Antwort:

```text
ok        : True
halter    : 8
fahrzeuge : 8
termine   : 13
maengel   : 12
```

## 7. Pruefen

API erreichbar:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/api/health
Invoke-RestMethod http://127.0.0.1:8787/api/fahrzeuge
```

Direkt in MariaDB:

```sql
USE tuv_workflow;
SHOW TABLES;
SELECT COUNT(*) FROM halter;
SELECT COUNT(*) FROM fahrzeug;
SELECT COUNT(*) FROM termin;
SELECT COUNT(*) FROM mangel;
```

## 8. Tabellen

- `halter`
- `fahrzeug`
- `termin`
- `mangel`
- `status`
- `pruefart`
- `pruefer`
- `mangel_kategorie`

Die Tabellen und Stammdaten werden beim API-Start durch `server/db.js`
angelegt. Fachliche CRUD- und Demo-Endpunkte liegen in `server/index.js`.

## 9. Deployment-Hinweis

Firebase Hosting kann das statische Frontend ausliefern. Fuer gemeinsame Daten
braucht es zusaetzlich eine erreichbare Express-API und eine MariaDB-Datenbank.
Mehrere Benutzer sehen denselben Datenstand nur, wenn sie dieselbe API und
dieselbe MariaDB verwenden.
