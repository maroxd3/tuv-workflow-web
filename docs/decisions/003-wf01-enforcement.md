# 003 — WF-01 Defense-in-Depth: App-Layer + Stored Procedure, kein DB-Trigger

* **Status:** accepted
* **Datum:** 2026-05-13
* **Entscheider:** Marwan Saleh, Oussama Hlayhel

## Kontext und Problem

Die Geschäftsregel **WF-01** lautet:

> Ein `Termin` mit mindestens einem Mangel der Kategorie `HM`
> (Hauptmangel) oder `GM` (Gefährlicher Mangel) darf **nicht** den
> Status `BESTANDEN` haben. (Quelle: § 29 StVZO Anlage VIII)

Diese Regel ist **relationsübergreifend** (sie referenziert MANGEL und
TERMIN gleichzeitig) und kann daher **nicht** als CHECK-Constraint im
logischen Modell ausgedrückt werden — das SQL-Standard verbietet
Subqueries in CHECK, und `CREATE ASSERTION` ist in keinem produktiven
DBMS implementiert.

## Entscheidungstreiber

* Regel muss durchgesetzt sein, auch wenn jemand die App umgeht
* Logisches DB-Modell soll **rein deklarativ** bleiben (keine prozedurale Logik in Tabellen-Definitionen)
* Trigger sind physische Implementierungslogik und gehören nicht in das konzeptuelle oder logische Modell
* Defense-in-Depth: wenn eine Sicherungs-Schicht ausfällt, fangen die anderen

## Betrachtete Optionen

1. **A — Nur Anwendungsschicht** (App-Layer-Guard in `useStore` / `useStoreCompat.updTr`)
2. **B — Nur Stored Procedure** (PG-Funktion als einziger Schreib-Pfad, REVOKE direct UPDATE)
3. **C — Nur Trigger** (BEFORE UPDATE OF status_code)
4. **D — Defense-in-Depth A + B** (App-Guard primär, SP als zweite Linie auf DB-Ebene)
5. **E — Defense-in-Depth A + B + C** (alle drei Mechanismen)

## Entscheidungsergebnis

**Gewählt: Option D — App-Guard + Stored Procedure, ohne Trigger.**

### Begründung

* **App-Guard (A)** ist die primäre, schnelle, gut testbare Defense. UI
  blockiert die Status-Änderung bevor sie überhaupt zur DB kommt
  (Button disabled bei HM, Modal verweigert das Speichern).
* **Stored Procedure (B)** ist die zweite Verteidigungslinie auf DB-Ebene
  für den Fall, dass jemand die App-Logik umgeht (direkter SQL-Zugriff,
  fehlerhafte Migrations-Skripte). Der `status_code` ist von
  `REVOKE UPDATE` ausgeschlossen, Änderungen nur über
  `sp_termin_status_setzen(termin_id, neuer_status)` möglich.
* **Trigger (C) bewusst NICHT.** Trigger erzeugen „Black-Box-Verhalten",
  erscheinen unsichtbar bei jedem INSERT/UPDATE und erschweren Debugging
  sowie Nachvollziehbarkeit. Zwei Verteidigungslinien (A + B) reichen, drei
  wären Overkill.

### Positive Konsequenzen

* WF-01 ist redundant gesichert.
* Logisches DB-Modell bleibt frei von prozeduraler Logik (saubere
  akademische Schichtung Konzeptuell → Logisch → Physisch).
* SP ist explizit dokumentiert und nachvollziehbar — kein „magisches"
  Trigger-Verhalten.

### Negative Konsequenzen

* App-Code muss konsistent die SP nutzen (statt direktem UPDATE auf
  `termin.status_code`). Repository-Pattern hilft (ADR-007).
* Tests müssen WF-01 sowohl im App-Layer als auch in der SP prüfen
  (zwei Test-Suiten).

## Bewertete Optionen im Detail

### Option A — Nur App-Layer
* **Gut:** Schnell, gut testbar, kein DB-Overhead
* **Schlecht:** Single Point of Failure — wer SQL direkt nutzt umgeht die Regel komplett

### Option B — Nur Stored Procedure
* **Gut:** DB-zentral, App-Layer-frei
* **Schlecht:** App muss SP korrekt aufrufen; Fehler-Reporting an UI komplexer; Logik in PL/pgSQL ist schwerer testbar

### Option C — Nur Trigger
* **Gut:** Greift bei jedem Write, egal von welcher Quelle
* **Schlecht:** Black-Box-Verhalten, schwierig zu debuggen, vermischt physische mit logischer Schicht

### Option D — A + B (gewählt)
* **Gut:** Zwei explizit dokumentierte Verteidigungslinien; akademisch sauber
* **Schlecht:** Mehr Code als nur eine Schicht

### Option E — A + B + C
* **Gut:** Maximale Redundanz
* **Schlecht:** Overkill für eine einzelne Regel; behält die Nachteile von Triggern bei

## Verwandte Entscheidungen

* **ADR-001** — PGlite ermöglicht Stored Procedures
* **ADR-007** — Repository-Pattern stellt sicher dass UI nie direktes SQL macht

## Quellen

* § 29 StVZO Anlage VIII — Rechtsgrundlage der Regel
* `docs/datenmodell.md` § 3.3 — Tabelle der drei Implementierungsoptionen und Code-Beispiele
* `docs/datenmodell.md` § 1–3 — Trennung zwischen konzeptuellem, logischem und physischem Modell
