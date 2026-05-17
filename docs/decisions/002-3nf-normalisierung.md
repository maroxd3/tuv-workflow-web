# 002 - 3NF-Normalisierung

Status: accepted  
Datum: 2026-05-13  
Aktualisiert: 2026-05-17 fuer MariaDB

## Kontext

Halter, Fahrzeuge, Termine und Maengel haben klare relationale Beziehungen. Eine
eingebettete Speicherung von Halterdaten im Fahrzeug oder Maengeln im Termin
wuerde Update-Anomalien erzeugen und Fremdschluessel verhindern.

## Entscheidung

Wir modellieren Halter, Fahrzeuge, Termine und Maengel als eigene Tabellen in
3NF. Stammdaten wie Status, Pruefart, Pruefer und Mangelkategorie sind ebenfalls
eigene Tabellen.

## Begruendung

- Halter koennen mehrere Fahrzeuge besitzen.
- Ein Termin kann mehrere Maengel haben.
- MariaDB kann referenzielle Integritaet erzwingen.
- Statistiken koennen per JOIN/GROUP BY sauber berechnet werden.
- Aenderungen an Halterdaten muessen nur einmal gespeichert werden.

## Konsequenzen

- Das UI muss Halter beim Fahrzeugbezug auswaehlen oder anlegen.
- Einige Reads brauchen JOINs.
- Die Datenbank bleibt fachlich korrekt und wartbar.
