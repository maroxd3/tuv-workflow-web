/**
 * Migrations-Runner. Wird beim App-Start aufgerufen.
 *
 * Drizzle-Kit hat im Build-Schritt SQL-Migrationen in `src/db/migrations/`
 * generiert (z. B. `0000_spicy_sunfire.sql`). Wir importieren sie zur
 * Laufzeit über Vites `?raw`-Import (statisch in den Bundle gezogen)
 * und führen sie der Reihe nach gegen PGlite aus.
 *
 * Eine Marker-Tabelle `__drizzle_migrations` merkt sich, welche Skripte
 * schon liefen — idempotent gegen Reloads und neue Tabs.
 */

import { getPGlite } from "./client";

// Vites raw-Import zieht die SQL-Dateien direkt ins Bundle.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const migrationModules = import.meta.glob("./migrations/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const MIGRATION_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

export async function runMigrations(): Promise<{ applied: number }> {
  const pg = await getPGlite();
  await pg.exec(MIGRATION_TABLE_DDL);

  const sorted = Object.entries(migrationModules).sort(([a], [b]) => a.localeCompare(b));
  let applied = 0;

  for (const [path, sql] of sorted) {
    const name = path.split("/").pop()!.replace(/\.sql$/, "");
    const existing = await pg.query<{ name: string }>(
      "SELECT name FROM __drizzle_migrations WHERE name = $1",
      [name],
    );
    if (existing.rows.length > 0) continue;

    // SQL-Statements einzeln ausführen, getrennt am Drizzle-Marker
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await pg.exec(stmt);
    }
    await pg.query("INSERT INTO __drizzle_migrations (name) VALUES ($1)", [name]);
    applied++;
  }

  return { applied };
}
