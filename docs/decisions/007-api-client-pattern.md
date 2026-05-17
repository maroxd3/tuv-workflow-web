# 007 - API-Client Pattern im Frontend

Status: accepted  
Datum: 2026-05-17

## Kontext

Die Views sollen keine HTTP-Details und keine Datenbankdetails kennen.
Gleichzeitig nutzt ein Teil der UI noch die alte View-Datenform mit Feldern wie
`fahrzeug.id`, `fahrzeug.besitzer` und `termin.maengel`.

## Entscheidung

Das Frontend nutzt `src/db/apiClient.ts` als zentrale HTTP-Schicht. `useDb.ts`
verwaltet React-State und ruft den API-Client auf. `useStoreCompat.ts` bildet
die MariaDB/API-Daten auf die bestehende View-Datenform ab.

## Begruendung

- Views bleiben von API-Pfaden und JSON-Mapping entkoppelt.
- Fehlerbehandlung und Request-Header sind zentral.
- Der Wechsel der Persistenz betrifft hauptsaechlich API-Client und Backend.
- Optimistische UI-Updates bleiben im Hook gekapselt.

## Konsequenzen

- Neue Datenoperationen brauchen API-Endpunkt plus API-Client-Funktion.
- Das Frontend kann leichter gemockt getestet werden.
- SQL bleibt im Backend. Views und Hooks sprechen nur mit dem API-Client.
