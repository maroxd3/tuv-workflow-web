# 007 — Repository-Pattern: SQL-Zugriff zentral in `src/db/queries.ts`

* **Status:** accepted
* **Datum:** 2026-05-13
* **Entscheider:** Marwan Saleh

## Kontext und Problem

Mit Drizzle-Calls (ADR-004) bestand die Gefahr, SQL-Code über die ganze
Codebase zu verteilen — jede View-Komponente könnte `db.select(...)`
selbst aufrufen. Das wäre:

* Schwer zu refactoren (Schema-Change → N Stellen)
* Schwer zu testen (jede View braucht DB-Mock)
* Schwer zu sichern (z. B. WF-01 muss überall enforced sein)

## Entscheidungstreiber

* **Single Source of Truth** für Daten-Zugriff
* **Testbarkeit** — Repository-Layer einfach zu mocken
* **Sicherheitsregeln** (WF-01, FK-Cascades) genau einmal implementiert
* **Refactor-Sicherheit** — Schema-Änderung erfordert Änderung an einer Stelle

## Betrachtete Optionen

1. **Repository-Pattern** — alle DB-Zugriffe in `src/db/queries.ts`, Views nutzen nur die exportierten Funktionen
2. **Hooks-only** — jeder Custom-Hook macht seine DB-Calls direkt
3. **Direct-Drizzle** — Views importieren `db` und nutzen Drizzle inline

## Entscheidungsergebnis

**Gewählt: Option 1 — Repository-Pattern.**

### Struktur

```
src/db/
├── client.ts        # PGlite + Drizzle Singleton
├── schema.ts        # Tabellen, Relations, Types
├── seed.ts          # Demo- und Domänen-Daten
├── migrate.ts       # SQL-Migrations-Runner
├── queries.ts       # ← Repository: alle CRUD-Funktionen typisiert
└── migrations/      # *.sql Files

src/hooks/
├── useDb.ts         # React-Hook der queries.ts wrappt
└── useStoreCompat.ts # Adapter für Legacy-View-Shape
```

`queries.ts` exportiert 30+ typsichere Funktionen wie:

```typescript
export async function updTerminStatus(
  terminId: string,
  neuerStatus: string,
): Promise<void> {
  // WF-01-Check direkt hier — die einzige Stelle
  if (neuerStatus === "Bestanden") {
    const blocker = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(mangel)
      .innerJoin(mangelKategorie, eq(mangel.kategorieCode, mangelKategorie.kategorieCode))
      .where(and(eq(mangel.terminId, terminId), eq(mangelKategorie.blockiertBestanden, true)));
    if (blocker[0].count > 0) {
      throw new Error("WF-01: kein BESTANDEN bei Hauptmangel");
    }
  }
  await db.update(termin).set({ statusCode: neuerStatus }).where(eq(termin.terminId, terminId));
}
```

### Positive Konsequenzen

* **WF-01 garantiert** — egal welche View, alle gehen durch `updTerminStatus()`.
* **Tests** — `db.test.ts` ruft Repository-Funktionen direkt auf, in-memory PGlite.
* **Schema-Refactor zentralisiert** — Spalte umbenannt? Nur `queries.ts` + `schema.ts` betroffen, nicht 15 View-Files.
* **Audit-Logging** könnte später trivial in jede Funktion eingebaut werden.

### Negative Konsequenzen

* Bei neuen Queries muss man neue Funktionen in `queries.ts` schreiben — etwas mehr Boilerplate als Direct-Drizzle.
* Bei Performance-Optimierung (komplexe Joins) muss die Repository-Funktion entsprechend gestaltet werden.

## Bewertete Optionen im Detail

### Option 1 — Repository (gewählt)
* **Gut:** SSoT, testbar, refactor-sicher, Sicherheits-Regeln zentral
* **Schlecht:** Boilerplate, indirekte Drizzle-Nutzung

### Option 2 — Hooks-only
* **Gut:** React-idiomatisch, jeder Hook ist Self-Contained
* **Schlecht:** WF-01 in jedem Hook nochmal? → DRY-Verstoß. Tests pro Hook nötig.

### Option 3 — Direct-Drizzle
* **Gut:** Maximale Flexibilität, weniger Code
* **Schlecht:** SQL-Splatter über die Codebase; Schema-Change wird zur Bug-Jagd

## Verwandte Entscheidungen

* **ADR-003** — WF-01 wird in `queries.ts` enforced (App-Layer)
* **ADR-004** — Drizzle ist das Tool, Repository ist das Pattern darüber

## Quellen

* Martin Fowler, *Patterns of Enterprise Application Architecture*, Chapter 14: Repository
* Eric Evans, *Domain-Driven Design*, Chapter 6
