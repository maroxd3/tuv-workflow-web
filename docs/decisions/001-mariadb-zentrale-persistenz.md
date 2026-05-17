# 001 - MariaDB als zentrale Persistenz

Status: accepted  
Datum: 2026-05-17

## Kontext

Die Anwendung braucht relationale Datenhaltung fuer Halter, Fahrzeuge, Termine
und Maengel. Ein rein lokaler Browser-Speicher ist fuer mehrere Arbeitsplaetze
nicht ausreichend, weil Daten dann pro Browser getrennt bleiben.

## Entscheidung

Wir nutzen MariaDB als zentrale relationale Datenbank. Das Frontend greift nicht
direkt auf MariaDB zu, sondern ueber eine Express-API.

## Begruendung

- MariaDB erzwingt Fremdschluessel, UNIQUE- und CHECK-Constraints.
- Mehrere Clients koennen denselben Datenbestand nutzen.
- Die Datenbank ist lokal und serverseitig betreibbar.
- Zugangsdaten bleiben im Backend und gelangen nicht ins Frontend-Bundle.
- Das bestehende 3NF-Modell passt direkt zu MariaDB-Tabellen.

## Konsequenzen

- Die App benoetigt eine laufende API und MariaDB-Instanz.
- Offline-only ohne Backend ist nicht mehr Zielarchitektur.
- Produktivbetrieb braucht Backup, Authentifizierung und Betriebskonzept.
- Schema-Aenderungen sollten kuenftig versioniert migriert werden.
