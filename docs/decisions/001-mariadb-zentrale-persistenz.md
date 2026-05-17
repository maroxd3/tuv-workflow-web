# 001 - MariaDB als zentrale Persistenz

Status: accepted  
Datum: 2026-05-17

## Kontext

Die Anwendung verwaltet Halter, Fahrzeuge, Prueftermine und Maengel. Diese
Daten haben klare Beziehungen und muessen von mehreren Benutzern gemeinsam
gesehen werden koennen. Ein lokaler Browser-Speicher waere dafuer falsch, weil
jeder Browser seinen eigenen Datenstand haette.

## Entscheidung

Wir nutzen MariaDB als zentrale relationale Datenbank. Das Frontend greift nur
ueber die Express-API auf die Daten zu.

## Begruendung

- MariaDB erzwingt Fremdschluessel, UNIQUE- und CHECK-Constraints.
- Mehrere Clients koennen denselben Datenbestand nutzen.
- Die Datenbank ist lokal und serverseitig betreibbar.
- Zugangsdaten bleiben im Backend und gelangen nicht ins Frontend-Bundle.
- Das bestehende 3NF-Modell passt direkt zu MariaDB-Tabellen.

## Konsequenzen

- Lokal muessen MariaDB und die API laufen.
- Offline-only ohne Backend ist nicht mehr Zielarchitektur.
- Produktivbetrieb braucht Backup, Authentifizierung und Betriebskonzept.
- Schema-Aenderungen sollten kuenftig versioniert migriert werden.
