# 004 — Drizzle ORM als typsichere SQL-Abstraktion

* **Status:** accepted
* **Datum:** 2026-05-13
* **Entscheider:** Marwan Saleh

## Kontext und Problem

Mit dem Wechsel zu PGlite (ADR-001) brauchten wir eine Abstraktion zwischen
TypeScript-Code und SQL. Drei Pfade:

1. Raw SQL in Strings (`pg.query("SELECT ...")`)
2. Query-Builder (Drizzle, Kysely)
3. Voll-ORM mit Active-Record (Prisma, TypeORM)

## Entscheidungstreiber

* **Type-Safety** — Spalten-Namen, Datentypen statisch geprüft
* **Migrations-Tooling** — Schema-Diff erkennen und SQL-Diff generieren
* **Bundle-Size** — Nicht 200 KB für ORM-Magic
* **PGlite-Kompatibilität** — muss mit der WASM-Postgres-Variante laufen
* **Lesbarkeit** — Code muss wie SQL lesbar bleiben (keine Magic-Aktiv-Record-Wand)

## Betrachtete Optionen

1. **Drizzle ORM** — Lightweight Query-Builder mit TypeScript-First-Design
2. **Kysely** — Sehr ähnlich zu Drizzle, etwas weniger Postgres-Features
3. **Prisma** — Voll-ORM mit Schema-DSL
4. **Raw SQL via pg-Client**

## Entscheidungsergebnis

**Gewählt: Option 1 — Drizzle ORM.**

### Begründung

* **Type-Safe** — Schema in TypeScript → inferred Types für alle Queries
* **Migrations via `drizzle-kit`** — `db:generate` erzeugt SQL-Diff aus Schema-Änderungen
* **Klein** — Core ist < 20 KB minified
* **PGlite-Adapter offiziell unterstützt** (`drizzle-orm/pglite`)
* **Code liest sich wie SQL** — kein Active-Record-Magic
* **Postgres-First** — alle Postgres-Features (JSONB, partial indexes,
  Stored Procedures, Views) sind nativ erreichbar

### Beispiel-Code

```typescript
import { eq, and } from "drizzle-orm";
import { termin, mangel, mangelKategorie } from "./schema";

// "Hat dieser Termin einen Hauptmangel?" — typsicher, JOIN ist explizit
const blocker = await db
  .select({ count: sql<number>`count(*)`.mapWith(Number) })
  .from(mangel)
  .innerJoin(mangelKategorie, eq(mangel.kategorieCode, mangelKategorie.kategorieCode))
  .where(and(eq(mangel.terminId, terminId), eq(mangelKategorie.blockiertBestanden, true)));
```

### Positive Konsequenzen

* IDE-Autocomplete für alle Spalten und Tabellen
* Schema-Änderung → `db:generate` → SQL-Migrations-File automatisch
* `db.query.termin.findMany({ with: { fahrzeug, mängel } })` für relationale Reads ohne N+1

### Negative Konsequenzen

* Drizzle ist „nur" ein Query-Builder, keine Auto-Schema-Migration wie
  Prisma — der Entwickler muss bewusst `db:generate` ausführen.
* Lernkurve: Schema-Syntax ist eigenes DSL (aber lesbar).

## Bewertete Optionen im Detail

### Option 1 — Drizzle (gewählt)
* **Gut:** Type-safe, klein, Postgres-First, PGlite-Adapter, Migrations-Tooling
* **Schlecht:** Junge Library (v0.4x, kürzlich v1.0); kleinere Community als Prisma

### Option 2 — Kysely
* **Gut:** Sehr ähnlicher Ansatz, etwas reifer
* **Schlecht:** Kein dediziertes Migrations-Tool, kein PGlite-Adapter
  out-of-the-box

### Option 3 — Prisma
* **Gut:** Sehr beliebt, riesige Community
* **Schlecht:** Voll-ORM mit eigenem Daemon-Prozess, ~70 KB Bundle.
  Kein offizielles PGlite-Support. Schema-DSL ist eigene Sprache
  (nicht TypeScript-nativ).

### Option 4 — Raw SQL
* **Gut:** Maximale Flexibilität
* **Schlecht:** Keine Type-Safety, keine Migrations, jeder Refactor riskant

## Verwandte Entscheidungen

* **ADR-001** — PGlite ist die DB-Engine, Drizzle ist die TS-Abstraktion darüber
* **ADR-005** — TypeScript-Wahl macht Type-Safe-ORM erst sinnvoll
* **ADR-007** — Repository-Pattern kapselt Drizzle-Calls

## Quellen

* Drizzle ORM Dokumentation — https://orm.drizzle.team
* PGlite + Drizzle integration guide — https://orm.drizzle.team/docs/get-started-postgresql#electric-sql--pglite
