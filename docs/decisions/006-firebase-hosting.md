# 006 - Firebase Hosting nur für statische Dateien

Status: accepted  
Datum: 2026-05-13  
Aktualisiert: 2026-05-17 für MariaDB-Backend

## Kontext

Das Frontend kann als statische Vite-App gebaut werden. Die Datenbank liegt aber
nicht in Firebase, sondern in MariaDB hinter einer Express-API.

## Entscheidung

Firebase Hosting darf für statische Frontend-Dateien genutzt werden. Die
Datenhaltung liegt in MariaDB hinter der Express-API.

## Begründung

- `firebase.json` und Hosting-Workflow existieren bereits.
- Hosting liefert nur HTML, CSS und JavaScript aus.
- MariaDB-Zugriffe laufen über die separat betriebene API.
- HTTPS und einfache statische Deployments bleiben nutzbar.

## Konsequenzen

- Für Produktion reicht Hosting allein nicht aus; API und MariaDB muessen
  zusaetzlich betrieben werden.
- `VITE_API_BASE_URL` muss zur erreichbaren API passen.
