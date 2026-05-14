# Architecture Decision Records (ADR)

> An [Architectural Decision (AD)](https://adr.github.io/) is a justified
> software design choice that addresses a functional or non-functional
> requirement that is architecturally significant.

Diese Datei listet alle architekturrelevanten Entscheidungen des Projekts
mit ihrem aktuellen Status. Jeder ADR folgt dem **MADR-Format** (Markdown
Architectural Decision Records, Version 4.0.0) — eine internationale
Konvention.

## Wofür ADRs?

In einem akademischen oder professionellen Projekt müssen Entscheidungen
**nachvollziehbar** sein. Ein ADR dokumentiert:

1. **Was** wurde entschieden?
2. **Warum** wurde es so entschieden?
3. **Welche Alternativen** gab es?
4. **Welche Konsequenzen** ergeben sich?
5. **Wann** wurde es entschieden? (Datum + Kontext)

So können neue Projektbeteiligte die Genese der Architektur verstehen, ohne
den Git-Verlauf durchforsten zu müssen.

## Status-Lebenszyklus eines ADR

```
proposed → accepted → [superseded by ADR-XYZ]
                  ↘ [deprecated]
                  ↘ [rejected]
```

## Übersicht aller ADRs

| Nr. | Status | Titel | Datum |
|---|---|---|---|
| [001](001-pglite-statt-firestore.md) | accepted | PGlite statt Firestore für lokale relationale Persistenz | 2026-05-13 |
| [002](002-3nf-normalisierung.md) | accepted | 3. Normalform mit eigenständigen Relationen für Halter und Mangel | 2026-05-13 |
| [003](003-wf01-enforcement.md) | accepted | WF-01 Defense-in-Depth: App-Layer + Stored Procedure, kein DB-Trigger | 2026-05-13 |
| [004](004-drizzle-orm.md) | accepted | Drizzle ORM als typsichere SQL-Abstraktion | 2026-05-13 |
| [005](005-typescript-graduell.md) | accepted | TypeScript-Einführung graduell, neue Module zuerst | 2026-05-13 |
| [006](006-firebase-hosting.md) | accepted | Firebase Hosting für statische Dateien (nicht für DB) | 2026-05-13 |
| [007](007-repository-pattern.md) | accepted | Repository-Pattern: SQL-Zugriff zentral in `src/db/queries.ts` | 2026-05-13 |
| [008](008-keine-eingebetteten-arrays.md) | accepted | Mangel und Halter als separate Tabellen, nicht eingebettet | 2026-05-13 |

## Wie ein neues ADR anlegen

1. Höchste Nummer in der Tabelle oben raussuchen, um 1 erhöhen
2. Kopie von `_template.md` machen, neue Nummer und Titel als Dateiname
3. Inhalt ausfüllen
4. Zur Übersichts-Tabelle hier hinzufügen
5. Commit mit Message `docs(adr): NNN — kurze Beschreibung`

## Quellen / Inspirationen

- Michael Nygard, *Documenting Architecture Decisions* (2011) —
  https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- MADR — Markdown Architectural Decision Records, v4.0.0 —
  https://adr.github.io/madr
- Google Cloud Solution Architecture Documentation Standards
