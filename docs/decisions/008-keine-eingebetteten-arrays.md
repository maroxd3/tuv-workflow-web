# 008 — Mangel und Halter als separate Tabellen, nicht eingebettet

* **Status:** accepted
* **Datum:** 2026-05-13
* **Entscheider:** Marwan Saleh

## Kontext und Problem

Beim Schema-Design (ADR-002, 3NF) bestand die Versuchung, das alte
Firestore-Modell beizubehalten und Mängel als JSONB-Array innerhalb des
Termins zu speichern (Postgres unterstützt JSONB nativ — kein
Implementierungs-Hindernis).

Dieselbe Frage stellte sich für den Halter: könnte als eingebettete
Spalten direkt im Fahrzeug bleiben.

Diese ADR macht explizit, **warum** wir es nicht so machen — auch wenn
die Versuchung dokumentiert sein soll.

## Entscheidungstreiber

* 3NF-Korrektheit (akademische Anforderung)
* Foreign-Key-Constraints auf einzelne Mangel/Halter-Datensätze
* Queries wie „alle HM nach Monat" oder „alle Fahrzeuge eines Halters"
* Update-Anomalien vermeiden

## Betrachtete Optionen

1. **Separate Tabellen mit FK** — wie in ADR-002 entschieden
2. **JSONB-Array im Termin/Fahrzeug** — Postgres-nativ, weniger Tabellen
3. **Mixed:** Halter als FK, Mangel als JSONB-Array (Kompromiss)

## Entscheidungsergebnis

**Gewählt: Option 1 — separate Tabellen für Halter UND Mangel.**

### Begründung im Detail

**Mangel als JSONB-Array wäre verlockend** weil:

* Ein Termin hat meistens nur 0–5 Mängel
* Atomare Read-Performance (ein SELECT ohne JOIN)
* Schreib-Performance besser (ein Termin = ein Row)

**ABER bricht harte Anforderungen:**

| Anforderung | JSONB-Array | Separate Tabelle |
|---|---|---|
| 1NF | ❌ atomar verletzt | ✓ |
| FK von Mangel → MangelKategorie | ❌ nicht möglich | ✓ |
| Query „alle HM letzter Monat" | nur via `jsonb_path_query`, langsam | ✓ einfach |
| WF-01 enforcement | komplex via SP+JSONB-Path | ✓ einfacher JOIN |
| Mangel-Statistik nach Kategorie | sehr aufwendig | trivial mit GROUP BY |
| Atomic single-Mangel-Update | erfordert Lese-Update-Schreib der ganzen JSONB | ✓ einfaches UPDATE |

**Halter als embedded Spalten wäre verlockend** weil:

* Bei Sprint-Start dachten wir: „Ein Fahrzeug hat genau einen Halter"
* Spart einen JOIN

**ABER:**

* Mehrere Fahrzeuge können denselben Halter haben (z. B. Firma mit
  Flotte) → Update-Anomalie wenn der Halter umzieht.
* Halter-Daten ändern sich, Fahrzeug-Daten ändern sich seltener → unterschiedliche Lebenszyklen.
* Realistische ERM-Beziehung ist `Halter 1 ── N Fahrzeug`, nicht
  `Halter ⊂ Fahrzeug`.

### Positive Konsequenzen

* Echte 3NF — akademisch korrekt.
* Saubere CRUD-Operationen pro Mangel und pro Halter.
* Statistiken (HM-Quote, Wiederholer-Quote) sind einfache SQL-Queries.

### Negative Konsequenzen

* Schreiben eines Termins mit 3 Mängeln = 4 INSERTs statt 1.
  Performance-Impact bei unseren Größenordnungen vernachlässigbar.
* Mehr Code in `seed.ts` und `queries.ts`.

## Bewertete Optionen im Detail

### Option 1 — Separate Tabellen (gewählt)
* **Gut:** 3NF, FK-Integrität, einfache Queries, keine Anomalien
* **Schlecht:** Mehr INSERTs beim Schreiben; JOIN beim Lesen

### Option 2 — JSONB-Arrays
* **Gut:** Atomic Reads, kompaktes Schema, Postgres-nativ via JSONB-Path
* **Schlecht:** Bricht 1NF, keine FK-Constraints in JSONB, Query-Performance
  bei aggregierten Statistiken miserabel, WF-01-Enforcement aufwändig

### Option 3 — Mixed (Halter FK, Mangel JSONB)
* **Gut:** Pragmatischer Kompromiss
* **Schlecht:** Inkonsistent — Reviewer fragen: warum unterschiedlich? Bricht das saubere ERM-Bild.

## Verwandte Entscheidungen

* **ADR-002** — 3NF-Normalisierung ist die Grundsatz-Entscheidung; ADR-008 begründet sie konkret für Mangel und Halter

## Quellen

* `docs/datenmodell.md` § 2.1 — Schritte der Normalisierung
* PostgreSQL JSONB-Documentation — https://www.postgresql.org/docs/current/datatype-json.html (zur Bewertung der Alternative)
* Codd's 1NF-Definition (1970) — verbiet mehrwertige Attribute auf der
  ersten Normalform-Ebene
