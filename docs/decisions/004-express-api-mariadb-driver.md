# 004 - Express API mit MariaDB Driver

Status: accepted  
Datum: 2026-05-17

## Kontext

Browser-Code darf keine MariaDB-Zugangsdaten enthalten und kann MariaDB nicht
direkt sicher ansprechen. Zwischen React-App und Datenbank braucht es eine
Backend-Schicht.

## Entscheidung

Wir nutzen Express als HTTP-API und den `mariadb` Node.js Driver für
SQL-Zugriffe.

## Begründung

- Express ist leichtgewichtig und passt zum vorhandenen Node/Vite-Projekt.
- Der `mariadb` Driver unterstützt Connection Pools und parametrisierte Queries.
- API-Endpunkte können Frontend-Feldnamen auf Datenbankspalten mappen.
- Workflow-Regeln können serverseitig durchgesetzt werden.
- Die API ist lokal per `npm run dev:api` oder `npm run api` startbar.

## Konsequenzen

- SQL liegt zentral in `server/index.js`; Schema-Setup und Stammdaten liegen in
  `server/db.js`.
- Frontend-Tests können ohne echte DB laufen, API-Tests brauchen MariaDB.
- Für Produktion muss die API separat deployt und über HTTPS abgesichert
  werden.
