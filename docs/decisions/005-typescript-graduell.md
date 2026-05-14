# 005 — TypeScript-Einführung graduell, neue Module zuerst

* **Status:** accepted
* **Datum:** 2026-05-13
* **Entscheider:** Marwan Saleh, Oussama Hlayhel

## Kontext und Problem

Das Projekt startete als reines JavaScript-Projekt (Vite + React in `.jsx`).
Mit dem Wechsel auf PGlite + Drizzle (ADR-001, ADR-004) wurden die ersten
typsicheren Module nötig — Drizzle entfaltet seinen Wert nur mit
TypeScript-Inferenz.

Die Frage war: alles auf einmal zu TS migrieren oder graduell?

## Entscheidungstreiber

* Migrations-Risiko minimieren (~ 40 bestehende `.jsx`-Dateien)
* Neue Module sollen sofort typsicher sein (DB-Schicht)
* Tests dürfen nicht durch Mass-Refactor abbrechen
* IDE-Support für mixed JS/TS muss funktionieren

## Betrachtete Optionen

1. **Big-Bang-Migration** — alle Dateien in einem PR auf `.ts`/`.tsx`
2. **Graduelle Migration** — `allowJs: true`, neue Files in TS, bestehende JS-Files bleiben bis sie ohnehin angefasst werden
3. **JSDoc-Types** — bei JS bleiben, Types via `/** @typedef */`-Kommentare

## Entscheidungsergebnis

**Gewählt: Option 2 — graduelle Migration.**

### Begründung

* `allowJs: true` lässt JS und TS in derselben Codebase koexistieren.
* Neue DB-Schicht (`src/db/*.ts`) ist sofort typsicher → maximaler Nutzen
  durch Drizzle-Inferenz.
* Bestehende View-Komponenten bleiben `.jsx` bis sie ohnehin geändert
  werden — keine Bulk-Renames die den Git-Verlauf zerschießen.
* `strict: true` + `noUncheckedIndexedAccess: true` in `tsconfig.json` →
  neue TS-Files sind direkt streng.

### Positive Konsequenzen

* Sofortige Type-Safety in der kritischsten Schicht (DB).
* Kein Refactor-Risiko in den View-Komponenten (Stand 13.05.: nur
  `useStoreCompat.ts` und der gesamte `db/`-Ordner sind TS).
* IDE warnt bei TS↔JS-Grenzen automatisch, wo Type-Information fehlt.
* Future-Path klar: jede angefasste `.jsx` wird zu `.tsx` migriert.

### Negative Konsequenzen

* Mixed-Codebase wirkt visuell uneinheitlich.
* Manche TS-Strenge-Flags (z. B. `noImplicitAny`) greifen erst voll wenn
  alle Files migriert sind.

## Bewertete Optionen im Detail

### Option 1 — Big-Bang
* **Gut:** Konsistent, sauber
* **Schlecht:** Riesiges PR, alle Tests in einem Schritt riskieren zu brechen, Reviewer-Aufwand explodiert

### Option 2 — Graduell (gewählt)
* **Gut:** Niedriges Risiko, sofortiger Nutzen in neuer Schicht
* **Schlecht:** Mixed-Stil im Repo für eine Zeit

### Option 3 — JSDoc
* **Gut:** Kein Tooling-Setup, alle Files bleiben `.js`
* **Schlecht:** JSDoc-Types sind verbose, Inferenz schwächer als echtes TS,
  Drizzle-Generics funktionieren nicht via JSDoc

## Verwandte Entscheidungen

* **ADR-004** — Drizzle ORM braucht TS für volle Wirkung
* **ADR-007** — Repository-Pattern in `src/db/queries.ts` ist nativ TS

## Quellen

* TypeScript Handbook — *Migrating from JavaScript* — https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html
* `tsconfig.json` mit `allowJs: true`, `strict: true`
