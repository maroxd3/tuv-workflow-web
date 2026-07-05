# 011 - Versionierte Schema-Migrationen statt CREATE TABLE IF NOT EXISTS

Status: accepted
Datum: 2026-07-05

## Kontext

Das Schema wurde bisher bei jedem Prozessstart per `CREATE TABLE IF NOT
EXISTS` in `server/db.js` hergestellt. Das funktioniert für neue Tabellen,
hat aber eine strukturelle Lücke: **Änderungen an bestehenden Tabellen
kommen nie an**. `IF NOT EXISTS` überspringt existierende Tabellen — ein
später ergänztes `ALTER TABLE` (neue Spalte, geänderter Index, neuer
Constraint) hätte keinen Weg in eine Bestandsinstallation.

Im On-Premise-Modell (ADR-001, ADR-006) ist das kritisch: jede Prüfstelle
betreibt ihre eigene Datenbank über Jahre. Ein Software-Update muss das
Schema beim Kunden nachziehen können, ohne dass jemand manuell SQL
einspielt.

Externe Frameworks (Flyway, Liquibase, knex-migrations, postgrator) lösen
das, bringen aber eigene Runtimes bzw. Dependencies mit. Das Projekt
verzichtet bewusst auf schwere Abhängigkeiten (vgl. Begründung in
`server/validate.js`: Lehrwert der expliziten Lösung).

## Entscheidung

Handgerolltes, versioniertes Migrations-System in `server/migrations.js`
(~60 LOC Framework-Code):

- **`schema_migration`-Tabelle** protokolliert angewendete Versionen
  (`version INT PK, name, applied_at`).
- **`MIGRATIONS`-Array**: geordnete Liste `{ version, name, up(conn) }`.
  Append-only — ausgelieferte Migrationen werden nie geändert, nur neue
  angehängt.
- Beim Boot wendet `runMigrations()` alle noch nicht protokollierten
  Versionen in Reihenfolge an; `GET_LOCK('tuv_schema_migration')`
  serialisiert konkurrierende Prozess-Starts.
- Das bisherige Schema wurde als **Migration 1** (initial-schema, mit
  `IF NOT EXISTS`, damit Bestandsinstallationen sie als No-op durchlaufen)
  und **Migration 2** (HU-Richtlinie-Kategorien, vorher `migrateCategories`)
  übernommen.

**Nicht** in Migrationen leben: Stammdaten-Seeds (`INSERT IGNORE`) und der
WF-01-Trigger (`CREATE OR REPLACE`). Beides ist Desired-State und bewusst
idempotent bei jedem Boot — eine Trigger-Korrektur soll alle Instanzen
erreichen, ohne dass dafür eine Migrations-Version verbraucht wird.

## Begründung

1. **Bestandskunden-Upgrades werden möglich**: `ALTER TABLE` ist jetzt ein
   normaler Migrationsschritt. Vorher war die einzige Option "Tabelle von
   Hand ändern" oder "DB neu aufsetzen".
2. **Kein neues Dependency**: MariaDB committet DDL ohnehin implizit
   (kein transaktionales DDL) — der Hauptvorteil schwerer Frameworks
   (transaktionale Migrationen) existiert auf MariaDB gar nicht. Was
   bleibt, ist Buchführung + Reihenfolge, und das sind 60 Zeilen.
3. **Kein Down-Pfad**: Rollback läuft im On-Premise-Modell über die
   Backup-Strategie (docs/backup.md, Binlog + Dumps), nicht über
   Reverse-Migrationen. Down-Migrationen wären ungetesteter Code für einen
   Pfad, den es betrieblich nicht gibt.
4. **Idempotenz-Pflicht pro Migration** (dokumentiert im Datei-Header):
   weil DDL nicht transaktional ist, muss jede Migration einen Abbruch in
   der Mitte beim nächsten Boot gefahrlos wiederholen können.

## Konsequenzen

- Neue Schema-Änderung = neues Array-Element mit nächsthöherer Version.
  Nie eine bestehende Migration editieren (Bestandskunden haben sie schon
  protokolliert).
- `schema_migration` ist die Wahrheit darüber, auf welchem Stand eine
  Kundendatenbank ist — nützlich für Support ("SELECT * FROM
  schema_migration").
- Wechsel auf Flyway/knex bleibt möglich: die protokollierten Versionen
  ließen sich als Baseline importieren.
