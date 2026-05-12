import type { Config } from "drizzle-kit";

/**
 * Drizzle-Kit Konfiguration für Migrationen.
 *
 * Wir generieren SQL-Migrationsskripte aus der TypeScript-Schema-Definition.
 * Diese Skripte werden zur Laufzeit gegen PGlite (browser-WASM PostgreSQL)
 * ausgeführt. Die DB-Datei lebt entweder im IndexedDB (browser) oder als
 * lokale Datei (Tauri-Desktop).
 */
export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  verbose: true,
  strict: true,
} satisfies Config;
