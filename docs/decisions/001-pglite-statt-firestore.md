# 001 — PGlite statt Firestore für lokale relationale Persistenz

* **Status:** accepted
* **Datum:** 2026-05-13
* **Entscheider:** Marwan Saleh, Oussama Hlayhel


## Kontext und Problem

Die ursprüngliche Persistenz über Firebase Firestore (Dokumenten-DB) passte
nicht mehr zum überarbeiteten, hochstrukturierten Datenmodell mit klaren
Relationen zwischen Fahrzeug, Termin, Mangel und Halter. Für die weitere
Ausarbeitung wurde deshalb eine **lokale relationale Datenbank** als Ziel
festgelegt.

Wir mussten die Persistenz-Schicht so umstellen, dass:

1. Echte SQL-Relationen mit Fremdschlüssel-Constraints, 3NF-Normalform.
2. Lokal lauffähig (kein eigener Backend-Server).
3. Auf dem User-Gerät installierbar / persistent.
4. Idealerweise PostgreSQL-Syntax-kompatibel (akademischer Standard).

## Entscheidungstreiber

* **Akademische Korrektheit** — Datenbank-Schicht muss relational sein.
* **Lokale Persistenz** — keine Cloud, kein Server.
* **Postgres-Kompatibilität** — wenn das Projekt skaliert, Migration auf richtigen Postgres-Server muss trivial bleiben.
* **Bundle-Size** — < 5 MB zusätzlich akzeptabel.
* **Browser-tauglich** — die App ist eine Vite/React-SPA, alles läuft im Browser.

## Betrachtete Optionen

1. **PGlite** (`@electric-sql/pglite`) — PostgreSQL als WebAssembly im Browser
2. **SQLite via sql.js** — SQLite als WASM, breite Verbreitung
3. **better-sqlite3 nur Tauri** — native SQLite, aber nur in Desktop-Build
4. **PostgreSQL in Docker** — vollwertiger Postgres-Server, lokal hostbar
5. **Bei Firestore bleiben** — Status quo, NoSQL

## Entscheidungsergebnis

**Gewählt: Option 1 — PGlite.**

Begründung: PGlite ist der einzige Kandidat, der **alle** Anforderungen
erfüllt:

* Es ist echtes PostgreSQL (nicht SQLite) und passt damit zum relationalen Modell.
* Es läuft im Browser ohne Backend (WASM, 3.2 MB).
* Persistiert in IndexedDB → echte Datei auf User-Gerät.
* Unterstützt alle Postgres-Features: Foreign Keys, CHECK, partielle Indizes, Stored Procedures, Views, JSONB.
* Spätere Migration auf vollständigen Postgres-Server (Docker / Hosted): DDL identisch, nur Connection-String ändert sich.

### Positive Konsequenzen

* Akademische Anforderung „lokale relationale DB" wörtlich erfüllt.
* 3NF-Schema mit echten FK-Constraints lebt jetzt im Code.
* Type-safe SQL via Drizzle ORM, kein „raw string" Risiko.
* Bundle wächst um ~3 MB (lazy-loaded), aber keine Backend-Kosten.

### Negative Konsequenzen

* Real-time-Sync via `onSnapshot` (Firestore-Feature) entfällt. Wir nutzen
  ein periodisches Refresh nach Schreiboperationen.
* Multi-Tab-Synchronisation muss manuell gelöst werden (Storage-Event,
  Broadcast-Channel). Im aktuellen Single-User-Prototyp keine Priorität.
* PGlite ist v0.x — vor 1.0. Stabil genug für unsere Größenordnung, aber
  kein langfristiger Enterprise-Stack.

## Bewertete Optionen im Detail

### Option 1 — PGlite
* **Gut:** Echtes Postgres, WASM, IndexedDB-Persistenz, type-safe via Drizzle
* **Schlecht:** ~3 MB Bundle-Overhead; v0.x

### Option 2 — SQLite via sql.js
* **Gut:** Sehr verbreitet, klein (~1 MB)
* **Schlecht:** SQLite ist *nicht* Postgres — andere Datentypen, kein RETURNING bis vor kurzem, weniger Constraint-Optionen. „Relationale DB" akademisch OK, aber kein Postgres.

### Option 3 — better-sqlite3 in Tauri
* **Gut:** Native Performance, echte .sqlite-Datei
* **Schlecht:** Funktioniert nur im Tauri-Desktop-Build, nicht im Browser-Build. Two-Track-Architektur wäre nötig.

### Option 4 — PostgreSQL in Docker
* **Gut:** „Echtester" Postgres, Production-Standard
* **Schlecht:** User muss Docker installieren — verstößt gegen „lokale Browser-App"-Spirit. Plus Backend-Schicht (Node/Express) für Browser→DB nötig.

### Option 5 — Bei Firestore bleiben
* **Gut:** Status quo, kein Migrations-Aufwand
* **Schlecht:** Passt nicht mehr zum normalisierten relationalen Datenmodell.

## Verwandte Entscheidungen

* **ADR-002** — 3NF-Normalisierung (wird durch PGlite erst möglich)
* **ADR-004** — Drizzle ORM als Query-Layer
* **ADR-008** — Halter/Mangel als eigene Tabellen statt eingebettet

## Quellen

* PGlite Dokumentation — https://pglite.dev
* `docs/datenmodell.md` § 5 — ausführliche Pro/Kontra-Tabelle PostgreSQL vs. Firestore
