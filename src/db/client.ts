/**
 * PGlite-Client + Drizzle-Wrapper.
 *
 * PGlite ist PostgreSQL kompiliert zu WebAssembly. Es läuft komplett im
 * Browser, persistiert die Datenbank in IndexedDB, und bietet
 * vollständige PostgreSQL-Syntax (Triggers, JSONB, CTE, Window Functions,
 * Foreign Keys, etc.) — keine SQLite-Untermenge.
 *
 * Web-Vorteil: Keine Backend-Komponente nötig. Die App ist 100% lokal,
 * funktioniert offline, und kann sogar als statische Site deployed werden.
 *
 * Tauri-Vorteil (optional): Statt IndexedDB könnte man später auf
 * better-sqlite3 wechseln, die App-Bundle bleibt aber identisch.
 */

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";

// Singleton-Pattern: nur eine PGlite-Instanz pro Tab.
let _pglite: PGlite | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Initialisiert PGlite (idempotent) und gibt das Drizzle-Wrapper-Objekt zurück.
 *
 * Persistenz: `idb://tuvpro-db-v1` → wird im IndexedDB unter diesem Namen
 * gespeichert. Versionsnummer im Namen, falls wir später inkompatible
 * Schema-Änderungen machen.
 */
export async function getDb() {
  if (_db) return _db;

  _pglite = new PGlite("idb://tuvpro-db-v1");
  await _pglite.waitReady;

  _db = drizzle(_pglite, { schema, logger: import.meta.env.DEV });
  return _db;
}

/** Direkter Zugriff auf das rohe PGlite-Objekt (für DDL/Migrationen). */
export async function getPGlite(): Promise<PGlite> {
  if (!_pglite) await getDb();
  return _pglite!;
}

/** Drittpartei-Helper: kompletter DB-Reset für Tests + Dev. */
export async function resetDatabase() {
  const pg = await getPGlite();
  await pg.exec(`
    DROP TABLE IF EXISTS mangel CASCADE;
    DROP TABLE IF EXISTS termin CASCADE;
    DROP TABLE IF EXISTS fahrzeug CASCADE;
    DROP TABLE IF EXISTS halter CASCADE;
    DROP TABLE IF EXISTS mangel_kategorie CASCADE;
    DROP TABLE IF EXISTS status CASCADE;
    DROP TABLE IF EXISTS pruefart CASCADE;
    DROP TABLE IF EXISTS pruefer CASCADE;
  `);
}
