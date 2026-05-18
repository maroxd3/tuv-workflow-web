# 003 - WF-01 in UI, API und Datenbank absichern

Status: accepted
Datum: 2026-05-13
Aktualisiert:
- 2026-05-17 Express/MariaDB-Stack
- 2026-05-18 DB-Trigger als 3. Defense-Layer
- 2026-05-18 HU-Richtlinie-Korrektur (OM/GM/EM/GfM) + `behoben`-Check

## Kontext

Ein Termin mit blockierendem Mangel der Kategorie EM (Erheblicher Mangel) oder
GfM (Gefährlicher Mangel) darf nicht den Status `Bestanden` erhalten — §29
StVZO Anlage VIII Nr. 3. Behobene Mängel zaehlen nicht.

## Entscheidung

### Mangel-Kategorien nach HU-Richtlinie

Die DB-Tabelle `mangel_kategorie` enthaelt genau 4 Kategorien:

| Code | Bezeichnung           | blockiert_bestanden |
| ---- | --------------------- | ------------------- |
| OM   | Ohne Mangel           | 0                   |
| GM   | Geringer Mangel       | 0                   |
| EM   | Erheblicher Mangel    | 1                   |
| GfM  | Gefährlicher Mangel  | 1                   |

Frueher (Stand vor 18.05.2026) gab es 5 Kategorien (OM, GM, EM, GfM mit
GM=Gefährlich). Die Codes waren inkonsistent mit der offiziellen HU-Richtlinie
und EM war faelschlich nicht blockierend. Die Korrektur erfolgt einmalig durch
`migrateCategories()` in `server/db.js` (siehe unten).

### Drei Defense-Layer

Die Regel wird in drei Schichten umgesetzt:

1. **UI-Guard:** `validateStatusWechsel()` und `hatBlockierendenMangel()`
   verhindern den Statuswechsel im Frontend; `HauptmangelBadge` markiert den
   Termin sichtbar als "NICHT VERKEHRSSICHER".
2. **API-Guard:** `PATCH /api/termine/:id/status` prüft in MariaDB, ob
   blockierende Mängel mit `behoben=FALSE` existieren, und antwortet bei
   Konflikt mit `{ok:false, reason:"..."}`. Auto-Demotion in
   `POST /api/mängel` setzt Bestanden auf Nicht bestanden, wenn ein neuer
   nicht behobener EM/GfM angelegt wird.
3. **DB-Guard:** `trg_termin_wf01_update` (BEFORE UPDATE auf `termin`)
   verhindert die Status-Änderung auf `Bestanden`, wenn ein nicht behobener
   blockierender Mangel existiert. Wirft `SIGNAL SQLSTATE '45000'` mit
   `§29 StVZO`-Begründung.

## Begründung

- **UI** gibt sofortiges Feedback im Tagesplan-Workflow.
- **API** schuetzt gegen fehlerhafte oder direkte HTTP-Aufrufe, auch für
  Endpunkte ausserhalb von `/status` (z. B. der generische
  `PATCH /api/termine/:id` setzte zuvor `status_code` ohne WF-01-Check — wird
  jetzt vom Trigger abgefangen und vom Error-Handler in 422 übersetzt).
- **DB-Trigger** schuetzt gegen direkten SQL-Zugriff (Mariadb-Client,
  Adminer-Web-UI, zukuenftige Tools, Backup-Restore-Skripte). Ist die einzige
  Schicht, die WF-01 noch garantiert, wenn jemand die API komplett umgeht.
- Trigger ist idempotent angelegt (`CREATE OR REPLACE`), wird bei jedem
  Server-Start in `server/db.js → migrateTriggers()` neu deklariert.
- `behoben=TRUE`-Mängel werden überall ignoriert — ein gefixter Mangel ist
  praktisch kein Mangel mehr.

## Migrations-Pfad

`migrateCategories()` in `server/db.js` nutzt die FK-Option
`ON UPDATE CASCADE` auf `mangel.kategorie_code`, um die Umbenennung der
Kategorie-Codes automatisch auf alle Kind-Zeilen zu propagieren:

1. `GM` (alt: "Gefährlich") → `GfM`
2. `LM` (alt: "Leichter Mangel") → `GM` (jetzt "Geringer Mangel")
3. `HM` (alt: "Hauptmangel") → `EM` (direkter UPDATE auf `mangel`, dann
   DELETE der HM-Zeile aus `mangel_kategorie`)
4. `EM` auf `blockiert_bestanden = TRUE` setzen

Die Migration ist idempotent: laeuft sie auf einer schon migrierten DB, ist
keine Zeile mehr betroffen.

## Konsequenzen

- Neue Status-Endpunkte muessen die API-Layer-Regel weiter beachten, damit
  Konflikte als 422 statt als 500 zurückkommen. Der zentrale Error-Handler
  in `server/index.js` mappt SQLSTATE 45000 generisch auf
  `422 {ok:false, reason}`.
- Der Trigger ist auf `BEFORE UPDATE` beschraenkt — INSERT-Path wurde
  bewusst nicht zusaetzlich abgesichert, weil bei einer Termin-Neuanlage
  noch keine Mängel verknuepft sein koennen (FK `mangel.termin_id`).
- API-Tests sollten alle drei Layer explizit prüfen:
  1. Direkter SQL-Update (Trigger isoliert)
  2. `PATCH /api/termine/:id` mit `statusCode: Bestanden` (Trigger via API)
  3. `PATCH /api/termine/:id/status` (saubere API-Antwort)
- `log_bin_trust_function_creators = 1` ist in `docker/mariadb/my.cnf`
  gesetzt, weil mit aktivem Binlog der App-Nutzer sonst kein Trigger
  anlegen darf (siehe Kommentar dort). Für On-Premise-Single-Instance
  unkritisch.
- Frontend-Konstante `MANGEL_KATEGORIEN` in `src/constants/mangel.js` ist
  jetzt single source of truth für Label, Farbe und `blockiert`-Flag im UI.
  `hatHauptmangel` ist Alias für `hatBlockierendenMangel` (Backwards-Compat
  für bestehende Views).
