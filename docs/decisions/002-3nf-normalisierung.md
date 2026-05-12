# 002 — 3. Normalform mit eigenständigen Relationen für Halter und Mangel

* **Status:** accepted
* **Datum:** 2026-05-13
* **Entscheider:** Marwan Saleh, Oussama Hlayhel
* **Konsultiert:** Frau Fuchs

## Kontext und Problem

Das ursprüngliche Datenmodell (Sprint 1) bettete den Halter (Besitzer,
Telefon, E-Mail, Anschrift) **als Attribute direkt in das Fahrzeug** ein
und die Mängel **als JavaScript-Array im Termin**. Beide Designs sind
3NF-Verletzungen:

* Transitive Abhängigkeit `Fahrzeug → Halter-Name → Halter-Telefon`
* 1NF-Verletzung durch das mehrwertige `mängel`-Array

Mit dem Wechsel auf PostgreSQL (ADR-001) konnten wir das sauber lösen.

## Entscheidungstreiber

* Akademische Korrektheit (3NF-Normalform ist Pflicht-Stoff für Datenbanken-Vorlesungen)
* Vermeidung von Update-Anomalien (ein Halter ändert seine Telefonnummer → müsste in N Fahrzeug-Zeilen geändert werden)
* Realistisches Domänen-Modell (ein Halter kann mehrere Fahrzeuge besitzen)
* Foreign-Key-Constraints sauber durchsetzbar

## Betrachtete Optionen

1. **3NF voll** — Halter und Mangel werden eigene Relationen mit FK
2. **Embedded JSONB** — Halter/Mangel als JSONB-Spalten im Fahrzeug/Termin
3. **Bei eingebetteten Strukturen bleiben** — Status quo (Firestore-Style)

## Entscheidungsergebnis

**Gewählt: Option 1 — 3NF voll.**

### Konkrete Umstrukturierung

```
FAHRZEUG_alt = { …, besitzer, telefon, email, anschrift }
               + mangel-Array im Termin

→ 3NF:

HALTER         = { halter_id, name, telefon, email, anschrift }
FAHRZEUG       = { fahrzeug_id, kennzeichen, …, halter_id↗HALTER }
TERMIN         = { termin_id, fahrzeug_id↗FAHRZEUG, datum, … }
MANGEL         = { mangel_id, termin_id↗TERMIN, code_stvzo, …, kategorie_code↗MANGEL_KATEGORIE }

+ Domänen-Tabellen:
STATUS, PRUEFART, PRUEFER, MANGEL_KATEGORIE
```

### Positive Konsequenzen

* **Keine Update-Anomalien** — Halter-Daten ändern: ein UPDATE auf der Halter-Tabelle reicht.
* **Realistisches Halter→N-Fahrzeuge-Modell** — ein Halter kann beliebig viele Fahrzeuge haben.
* **FK-Constraints durchgesetzt** auf DB-Ebene — kein „verwaister Mangel ohne Termin" möglich.
* **CASCADE-Delete sauber** — Fahrzeug löschen → Termine + Mängel kaskadieren via FK.
* **Statistik-Queries einfacher** — z. B. „Wieviele HM hatten wir nach Halter gruppiert?" ist ein einfacher GROUP BY.

### Negative Konsequenzen

* Beim Anlegen eines neuen Fahrzeugs muss erst ein Halter gefunden oder
  angelegt werden — UI-Flow ist komplexer.
* Bei Reads wird häufiger ein JOIN benötigt (`fahrzeug ⋈ halter`).
  Performance-Impact bei unseren Datenmengen vernachlässigbar.

## Bewertete Optionen im Detail

### Option 1 — 3NF voll
* **Gut:** Akademisch korrekt; keine Anomalien; FK-Integrität
* **Schlecht:** Mehr Tabellen; UI-Aufwand bei Fahrzeug-Anlage

### Option 2 — Embedded JSONB
* **Gut:** Postgres unterstützt JSONB nativ; weniger Tabellen
* **Schlecht:** Halbgar — keine FK-Constraints in JSONB, Querying via `->>` ist
  unleserlich. Bricht die akademische Korrektheits-Anforderung.

### Option 3 — Status quo (embedded)
* **Gut:** Kein Migrations-Aufwand
* **Schlecht:** Bricht 3NF, kritisiert von Frau Fuchs, Anomalien bleiben.

## Verwandte Entscheidungen

* **ADR-001** — PGlite-Wahl ermöglicht relationales Schema
* **ADR-008** — explizit kein Embedded-Pattern für Halter/Mangel

## Quellen

* E. F. Codd, *A Relational Model of Data for Large Shared Data Banks* (1970)
* Date, *An Introduction to Database Systems*, 8. Auflage, Kapitel 12 (Normalisierung)
* `docs/datenmodell.md` § 2.1 — Schritte der Normalisierung dokumentiert
