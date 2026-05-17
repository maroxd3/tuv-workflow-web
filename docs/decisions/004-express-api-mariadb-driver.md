# 004 - Express API mit MariaDB Driver

Status: accepted  
Datum: 2026-05-17

## Kontext

Browser-Code darf keine MariaDB-Zugangsdaten enthalten und kann MariaDB nicht
direkt sicher ansprechen. Zwischen React-App und Datenbank braucht es eine
Backend-Schicht.

## Entscheidung

Wir nutzen Express als HTTP-API und den offiziellen `mariadb` Node.js Driver fuer
SQL-Zugriffe.

## Begruendung

- Express ist leichtgewichtig und passt zum vorhandenen Node/Vite-Projekt.
- Der `mariadb` Driver unterstuetzt Connection Pools und parametrisierte Queries.
- API-Endpunkte koennen Frontend-Feldnamen auf Datenbankspalten mappen.
- Workflow-Regeln koennen serverseitig durchgesetzt werden.
- Die API ist lokal einfach per `npm run api` startbar.

## Konsequenzen

- SQL liegt zentral in `server/index.js` und Schema-Setup in `server/db.js`.
- Frontend-Tests koennen ohne echte DB laufen, API-Tests brauchen MariaDB.
- Fuer Produktion muss die API separat deployt und ueber HTTPS abgesichert
  werden.
