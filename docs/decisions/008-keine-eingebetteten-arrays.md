# 008 - Keine eingebetteten Maengel oder Halterdaten

Status: accepted  
Datum: 2026-05-13  
Aktualisiert: 2026-05-17 fuer MariaDB

## Kontext

Maengel koennten theoretisch als JSON in einem Termin gespeichert werden.
Halterdaten koennten theoretisch direkt im Fahrzeug stehen. Beides wuerde aber
das relationale Modell schwaechen.

## Entscheidung

Maengel und Halter bleiben eigene MariaDB-Tabellen mit Fremdschluesseln.

## Begruendung

- Maengel brauchen eigene IDs, Kategorien und Auswertbarkeit.
- Halter koennen mehrere Fahrzeuge besitzen.
- MariaDB kann FKs nur zwischen echten Tabellen erzwingen.
- Statistiken nach Kategorie, Zeitraum oder Halter bleiben einfach.

## Konsequenzen

- Lesen braucht teilweise JOINs.
- Schreiben erfolgt ueber mehrere Tabellen.
- Das Modell bleibt 3NF-konform und konsistent.
