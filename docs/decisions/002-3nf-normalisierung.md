# 002 - 3NF-Normalisierung des Relationenschemas

Status: accepted
Datum: 2026-05-13
Aktualisiert:
- 2026-05-17 fuer MariaDB
- 2026-05-19 ausfuehrliche Nachweise (1NF/2NF/3NF) pro Relation in Fuchs-Terminologie

## Kontext

Das fachliche Datenmodell (Halter, Fahrzeug, Termin, Mangel und vier Stamm-
Relationen) muss frei von Insert-, Update- und Delete-Anomalien sein. Diese
entstehen durch Redundanzen, die wiederum durch partielle oder transitive
funktionale Abhaengigkeiten verursacht werden. Ziel ist eine verlustlose
Zerlegung des Schemas, die mindestens 3. Normalform erreicht.

## Entscheidung

Das Schema ist auf 3NF (in den meisten Faellen sogar BCNF) gebracht. Alle
Wertebereiche sind atomar (1NF). Halter, Fahrzeug, Termin und Mangel sind
eigene Relationen mit referentieller Integritaet ueber Fremdschluessel. Die vier
Stamm-Relationen (`status`, `pruefart`, `pruefer`, `mangel_kategorie`) sind
ebenfalls eigene Relationen — keine Enums in den Hauptrelationen, damit
Bezeichnungen und Geschaeftslogik (z. B. `blockiert_bestanden`) als Daten
gepflegt werden koennen.

## Begruendung und Normalformen-Nachweis

### 1NF — Atomare Wertebereiche

Alle Attribute haben atomare Wertebereiche: keine Listen, JSON-Spalten oder
kommagetrennten Werte. Insbesondere sind Maengel **nicht** als Array in
`termin` gespeichert (siehe ADR-008), Halter-Daten **nicht** als eingebettete
Struktur in `fahrzeug`.

### Schluesselkandidaten und Primaerschluessel pro Relation

Notation: Primaerschluessel **fett** unterstrichen, weitere Schluesselkandidaten
*kursiv* unterstrichen. UNIQUE-Constraints in MariaDB sind die Implementierung
weiterer Schluesselkandidaten.

| Relation         | Schluesselkandidaten                                        |
| ---------------- | ----------------------------------------------------------- |
| status           | **status_code**                                             |
| pruefart         | **prueft_code**                                             |
| pruefer          | **pruefer_kuerzel**                                         |
| mangel_kategorie | **kategorie_code**                                          |
| halter           | **halter_id**, *email* (UNIQUE)                             |
| fahrzeug         | **fahrzeug_id**, *kennzeichen* (UNIQUE), *fin* (UNIQUE)     |
| termin           | **termin_id**, *(fahrzeug_id, datum, uhrzeit)* (UNIQUE)     |
| mangel           | **mangel_id**                                               |

### Funktionale Abhaengigkeiten (FDs)

Pro Relation wird jede nicht-triviale funktionale Abhaengigkeit notiert
(Schreibweise: Determinante → abhaengiges Attribut). Triviale FDs (A → A,
M → A mit A ∈ M) sind ausgelassen.

**status**, **pruefart**, **pruefer**, **mangel_kategorie**:
- Jeweils nur eine FD vom Primaerschluessel auf alle Nicht-Schluessel-Attribute.
- Z. B. `kategorie_code → bezeichnung, blockiert_bestanden`.
- Einzige Determinante ist der Primaerschluessel → trivial 2NF und 3NF.

**halter**:
- `halter_id → name, telefon, email, anschrift, erfasst_am`
- `email → halter_id, name, telefon, anschrift, erfasst_am` (weil UNIQUE)
- Keine FDs zwischen Nicht-Schluessel-Attributen.

**fahrzeug**:
- `fahrzeug_id → kennzeichen, fin, hersteller, modell, baujahr, farbe, typ, kilometerstand, hu_faellig, halter_id, erfasst_am`
- `kennzeichen → fahrzeug_id` (UNIQUE) und damit transitiv alles weitere
- `fin → fahrzeug_id` (UNIQUE) und damit transitiv alles weitere
- Keine nicht-trivialen FDs zwischen Nicht-Schluessel-Attributen, die wir
  modellieren. Diskussion: Semantisch koennte `fin → hersteller, modell, baujahr`
  gelten (FIN ist standardisiert codiert). Da `fin` aber ein Schluesselkandidat
  ist, ist die Abhaengigkeit erlaubt (Determinante ist Superschluessel) — somit
  kein BCNF-Verstoss.

**termin**:
- `termin_id → fahrzeug_id, datum, uhrzeit, prueft_code, pruefer_kuerzel, status_code, notiz, erfasst_am`
- `(fahrzeug_id, datum, uhrzeit) → termin_id` und transitiv alles weitere (UNIQUE)
- Pruefen der 2NF fuer den zusammengesetzten Schluesselkandidaten
  `(fahrzeug_id, datum, uhrzeit)`: keine echte Teilmenge bestimmt allein ein
  Nicht-Schluessel-Attribut (`fahrzeug_id` allein bestimmt nicht `prueft_code`,
  `datum` allein bestimmt nichts, usw.) → 2NF erfuellt.
- Keine FDs zwischen Nicht-Schluessel-Attributen → 3NF erfuellt.

**mangel**:
- `mangel_id → termin_id, code_stvzo, beschreibung, kategorie_code, behoben, erfasst_am`
- **Diskussion einer potentiellen FD `code_stvzo → kategorie_code`**:
  Semantisch koennte ein StVZO-Code die Mangelkategorie eindeutig festlegen
  (Beispiel: `2.1.1 Betriebsbremse: ungleichmaessige Bremswirkung` ist nach
  HU-Richtlinie typischerweise EM). Wir modellieren `code_stvzo` aber als
  **rein dokumentarisches optionales Attribut** (`NULL` zulaessig) und lassen
  die Mangelkategorie vom Pruefer **explizit** setzen. Begruendung: ein und
  derselbe Code kann je nach Schadensbild als EM oder GfM eingestuft werden;
  die Determinante ist hier semantisch zu schwach, um eine echte FD zu sein.
  Damit liegt keine transitive Abhaengigkeit vor → 3NF erfuellt.

### Vermiedene Anomalien

- **Update-Anomalie:** Aendert sich die Anschrift eines Halters, wird sie nur in
  einer Zeile von `halter` aktualisiert, nicht in jedem zugehoerigen Fahrzeug.
- **Insert-Anomalie:** Ein Halter kann eingetragen werden, ohne dass schon ein
  Fahrzeug existiert (war frueher mit eingebetteten Halterdaten unmoeglich).
- **Delete-Anomalie:** Loescht man das letzte Fahrzeug eines Halters, bleibt der
  Halter erhalten. `ON DELETE RESTRICT` auf `fahrzeug.halter_id` verhindert
  zudem das versehentliche Loeschen eines Halters mit aktiven Fahrzeugen.

### Referentielle Integritaet

Alle Beziehungen sind durch Fremdschluessel mit explizitem `ON DELETE`/`ON
UPDATE`-Verhalten umgesetzt (`server/db.js`):

- `fahrzeug.halter_id` → `halter.halter_id`  (RESTRICT / CASCADE)
- `termin.fahrzeug_id` → `fahrzeug.fahrzeug_id`  (CASCADE / CASCADE)
- `termin.prueft_code` → `pruefart.prueft_code`  (RESTRICT / CASCADE)
- `termin.pruefer_kuerzel` → `pruefer.pruefer_kuerzel`  (SET NULL / CASCADE)
- `termin.status_code` → `status.status_code`  (RESTRICT / CASCADE)
- `mangel.termin_id` → `termin.termin_id`  (CASCADE / CASCADE)
- `mangel.kategorie_code` → `mangel_kategorie.kategorie_code`  (RESTRICT / CASCADE)

`ON UPDATE CASCADE` ist insbesondere fuer die HU-Richtlinie-Migration in
ADR-003 essenziell, weil sie eine PK-Umbenennung der Stamm-Relation
`mangel_kategorie` erlaubt, die automatisch in `mangel` cascadet wird —
verlustlose Zerlegung im Sinne der Vorlesung.

## Konsequenzen

- Lesende Operationen (`/api/termine/:id` mit Halter- und Fahrzeugdaten)
  brauchen JOINs. Performance-Auswirkung in unserer Groessenordnung (eine
  Pruefstelle, < 100k Termine/Jahr) vernachlaessigbar.
- Schreibende Operationen (Termin anlegen) benoetigen vorher ein Fahrzeug,
  und das Fahrzeug benoetigt vorher einen Halter. Das UI fuehrt durch diese
  Reihenfolge.
- Die DB bleibt fachlich korrekt und wartbar; alle Aenderungen an einem
  Domaenenobjekt (z. B. Halter-Anschrift) sind genau einmal zu schreiben.
- 4NF/5NF wurden nicht analysiert, da keine mehrwertigen Abhaengigkeiten im
  Datenmodell vorkommen (siehe Fuchs Kap. 6 Teil 2, Folie 241: "in vielen
  Faellen reicht eine Normalisierung bis zur 3. Normalform").
