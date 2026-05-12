/**
 * Integration tests against a real PGlite in-memory instance.
 *
 * Bypasses the singleton in client.ts — each test gets a fresh PGlite
 * instance so test state never leaks. We execute the same migration SQL
 * that production runs, then drive the queries layer end-to-end.
 *
 * No mocks. Real SQL, real foreign keys, real CHECK constraints.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import {
  halter,
  fahrzeug,
  termin,
  mangel,
  status,
  pruefart,
  pruefer,
  mangelKategorie,
} from "./schema";

// Read migration SQL synchronously at module load (Node-side, not Vite glob)
function loadMigrationsSql(): string[] {
  const dir = join(process.cwd(), "src", "db", "migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(dir, f), "utf-8"));
}

let pg: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;

beforeAll(async () => {
  pg = new PGlite();
  await pg.waitReady;
  db = drizzle(pg, { schema });

  // Run migrations
  for (const sql of loadMigrationsSql()) {
    const statements = sql.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await pg.exec(stmt);
    }
  }
});

afterAll(async () => {
  await pg.close();
});

beforeEach(async () => {
  // Reset between tests — keep schema, clear all data
  await pg.exec(`
    TRUNCATE mangel, termin, fahrzeug, halter,
             mangel_kategorie, status, pruefart, pruefer
    RESTART IDENTITY CASCADE;
  `);

  // Re-seed domain tables
  await db.insert(status).values([
    { statusCode: "GEPLANT", bezeichnung: "Geplant", istEndzustand: false },
    { statusCode: "IN_PRUEFUNG", bezeichnung: "In Prüfung", istEndzustand: false },
    { statusCode: "BESTANDEN", bezeichnung: "Bestanden", istEndzustand: true },
    { statusCode: "NICHT_BESTANDEN", bezeichnung: "Nicht bestanden", istEndzustand: true },
  ]);
  await db.insert(pruefart).values([
    { prueftCode: "HU", bezeichnung: "Hauptuntersuchung" },
    { prueftCode: "HU_AU", bezeichnung: "HU+AU" },
  ]);
  await db.insert(pruefer).values([
    { prueferKuerzel: "MW", name: "Marwan Saleh" },
  ]);
  await db.insert(mangelKategorie).values([
    { kategorieCode: "OM", bezeichnung: "Ohne Mangel", blockiertBestanden: false },
    { kategorieCode: "LM", bezeichnung: "Leichter Mangel", blockiertBestanden: false },
    { kategorieCode: "HM", bezeichnung: "Hauptmangel", blockiertBestanden: true },
    { kategorieCode: "GM", bezeichnung: "Gefährlicher Mangel", blockiertBestanden: true },
  ]);
});

describe("DB integration — Halter CRUD", () => {
  it("creates and reads a Halter", async () => {
    const [h] = await db
      .insert(halter)
      .values({ name: "Klaus Müller", telefon: "0176 1234567" })
      .returning();
    expect(h.name).toBe("Klaus Müller");
    expect(h.halterId).toMatch(/^[0-9a-f-]{36}$/);

    const all = await db.select().from(halter);
    expect(all).toHaveLength(1);
  });
});

describe("DB integration — Fahrzeug + FK to Halter", () => {
  it("creates a Fahrzeug linked to a Halter", async () => {
    const [h] = await db.insert(halter).values({ name: "Klaus Müller" }).returning();
    const [f] = await db
      .insert(fahrzeug)
      .values({
        kennzeichen: "B-TK 1234",
        hersteller: "BMW",
        modell: "320d",
        typ: "PKW",
        halterId: h.halterId,
      })
      .returning();
    expect(f.kennzeichen).toBe("B-TK 1234");
    expect(f.halterId).toBe(h.halterId);
  });

  it("enforces ON DELETE RESTRICT for Halter with Fahrzeuge", async () => {
    const [h] = await db.insert(halter).values({ name: "Klaus Müller" }).returning();
    await db.insert(fahrzeug).values({
      kennzeichen: "B-TK 1234",
      hersteller: "BMW",
      modell: "320d",
      typ: "PKW",
      halterId: h.halterId,
    });
    await expect(db.delete(halter).where(eq(halter.halterId, h.halterId))).rejects.toThrow();
  });

  it("enforces UNIQUE on Kennzeichen", async () => {
    const [h] = await db.insert(halter).values({ name: "Klaus" }).returning();
    await db.insert(fahrzeug).values({
      kennzeichen: "B-TK 1234",
      hersteller: "BMW",
      modell: "320d",
      typ: "PKW",
      halterId: h.halterId,
    });
    await expect(
      db.insert(fahrzeug).values({
        kennzeichen: "B-TK 1234",
        hersteller: "Audi",
        modell: "A4",
        typ: "PKW",
        halterId: h.halterId,
      }),
    ).rejects.toThrow();
  });

  it("partial UNIQUE on FIN — NULL FINs allowed multiple times", async () => {
    const [h] = await db.insert(halter).values({ name: "Klaus" }).returning();
    await db.insert(fahrzeug).values({
      kennzeichen: "B-TK 1111",
      fin: null,
      hersteller: "BMW",
      modell: "320d",
      typ: "PKW",
      halterId: h.halterId,
    });
    // Second Fahrzeug also without FIN — allowed
    await expect(
      db.insert(fahrzeug).values({
        kennzeichen: "B-TK 2222",
        fin: null,
        hersteller: "BMW",
        modell: "318i",
        typ: "PKW",
        halterId: h.halterId,
      }),
    ).resolves.toBeDefined();
  });

  it("partial UNIQUE on FIN — duplicate non-NULL FIN blocked", async () => {
    const [h] = await db.insert(halter).values({ name: "Klaus" }).returning();
    const fin = "WBA3A5C50CF256985";
    await db.insert(fahrzeug).values({
      kennzeichen: "B-TK 1111",
      fin,
      hersteller: "BMW",
      modell: "320d",
      typ: "PKW",
      halterId: h.halterId,
    });
    await expect(
      db.insert(fahrzeug).values({
        kennzeichen: "B-TK 2222",
        fin,
        hersteller: "BMW",
        modell: "318i",
        typ: "PKW",
        halterId: h.halterId,
      }),
    ).rejects.toThrow();
  });
});

describe("DB integration — Termin + ON DELETE CASCADE", () => {
  it("CASCADEs Termine when Fahrzeug is deleted", async () => {
    const [h] = await db.insert(halter).values({ name: "Klaus" }).returning();
    const [f] = await db.insert(fahrzeug).values({
      kennzeichen: "B-TK 1234",
      hersteller: "BMW",
      modell: "320d",
      typ: "PKW",
      halterId: h.halterId,
    }).returning();

    await db.insert(termin).values({
      fahrzeugId: f.fahrzeugId,
      datum: "2026-06-01",
      uhrzeit: "10:00:00",
      prueftCode: "HU",
      prueferKuerzel: "MW",
      statusCode: "GEPLANT",
    });

    expect(await db.select().from(termin)).toHaveLength(1);
    await db.delete(fahrzeug).where(eq(fahrzeug.fahrzeugId, f.fahrzeugId));
    expect(await db.select().from(termin)).toHaveLength(0);
  });
});

describe("DB integration — Mangel + Termin Cascade", () => {
  it("CASCADEs Mängel when Termin is deleted", async () => {
    const [h] = await db.insert(halter).values({ name: "Klaus" }).returning();
    const [f] = await db.insert(fahrzeug).values({
      kennzeichen: "B-TK 1234",
      hersteller: "BMW",
      modell: "320d",
      typ: "PKW",
      halterId: h.halterId,
    }).returning();
    const [t] = await db.insert(termin).values({
      fahrzeugId: f.fahrzeugId,
      datum: "2026-06-01",
      prueftCode: "HU",
      statusCode: "GEPLANT",
    }).returning();
    await db.insert(mangel).values({
      terminId: t.terminId,
      beschreibung: "Bremse hinten links",
      kategorieCode: "HM",
    });

    expect(await db.select().from(mangel)).toHaveLength(1);
    await db.delete(termin).where(eq(termin.terminId, t.terminId));
    expect(await db.select().from(mangel)).toHaveLength(0);
  });
});

describe("DB integration — CHECK constraints", () => {
  it("rejects baujahr < 1885", async () => {
    const [h] = await db.insert(halter).values({ name: "Klaus" }).returning();
    await expect(
      db.insert(fahrzeug).values({
        kennzeichen: "B-TK 1234",
        baujahr: 1700,
        hersteller: "BMW",
        modell: "320d",
        typ: "PKW",
        halterId: h.halterId,
      }),
    ).rejects.toThrow();
  });

  it("rejects negativen Kilometerstand", async () => {
    const [h] = await db.insert(halter).values({ name: "Klaus" }).returning();
    await expect(
      db.insert(fahrzeug).values({
        kennzeichen: "B-TK 1234",
        kilometerstand: -1,
        hersteller: "BMW",
        modell: "320d",
        typ: "PKW",
        halterId: h.halterId,
      }),
    ).rejects.toThrow();
  });

  it("rejects km > 3 Mio (Plausibilitätsgrenze)", async () => {
    const [h] = await db.insert(halter).values({ name: "Klaus" }).returning();
    await expect(
      db.insert(fahrzeug).values({
        kennzeichen: "B-TK 1234",
        kilometerstand: 99_999_999,
        hersteller: "BMW",
        modell: "320d",
        typ: "PKW",
        halterId: h.halterId,
      }),
    ).rejects.toThrow();
  });
});

describe("DB integration — Domain integrity", () => {
  it("rejects ungültigen Status-Code via FK", async () => {
    const [h] = await db.insert(halter).values({ name: "Klaus" }).returning();
    const [f] = await db.insert(fahrzeug).values({
      kennzeichen: "B-TK 1234",
      hersteller: "BMW",
      modell: "320d",
      typ: "PKW",
      halterId: h.halterId,
    }).returning();
    await expect(
      db.insert(termin).values({
        fahrzeugId: f.fahrzeugId,
        datum: "2026-06-01",
        prueftCode: "HU",
        statusCode: "WURSTHANDLUNG", // existiert nicht in der status-Tabelle
      }),
    ).rejects.toThrow();
  });
});
