/**
 * Repository-Schicht: alle SQL-Operationen leben hier, gekapselt als
 * Funktionen mit type-safem Input/Output.
 *
 * Diese Trennung folgt dem klassischen Repository-Pattern:
 *   - Views/Hooks rufen NUR Funktionen aus dieser Datei
 *   - SQL-Logik bleibt zentral und testbar
 *   - Drizzle-Imports leaken nicht in den Rest der App
 *
 * Geschäftsregel WF-01 (kein BESTANDEN bei Hauptmangel) wird in
 * `updTerminStatus` durchgesetzt — Defense-in-Depth (App-Layer-Guard
 * zusätzlich zur strikten Anwendungslogik im UI).
 */

import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./client";
import {
  halter,
  fahrzeug,
  termin,
  mangel,
  mangelKategorie,
  type Halter,
  type NeuerHalter,
  type Fahrzeug,
  type NeuesFahrzeug,
  type Termin,
  type NeuerTermin,
  type Mangel,
  type NeuerMangel,
} from "./schema";

// ════════════════════════════════════════════════════════════
// HALTER
// ════════════════════════════════════════════════════════════

export async function listHalter(): Promise<Halter[]> {
  const db = await getDb();
  return db.select().from(halter).orderBy(halter.name);
}

export async function getHalterById(id: string): Promise<Halter | null> {
  const db = await getDb();
  const rows = await db.select().from(halter).where(eq(halter.halterId, id)).limit(1);
  return rows[0] ?? null;
}

export async function addHalter(data: NeuerHalter): Promise<Halter> {
  const db = await getDb();
  const [created] = await db.insert(halter).values(data).returning();
  return created;
}

export async function updHalter(id: string, patch: Partial<NeuerHalter>): Promise<Halter | null> {
  const db = await getDb();
  const [updated] = await db
    .update(halter)
    .set(patch)
    .where(eq(halter.halterId, id))
    .returning();
  return updated ?? null;
}

export async function delHalter(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(halter).where(eq(halter.halterId, id));
}

// ════════════════════════════════════════════════════════════
// FAHRZEUG
// ════════════════════════════════════════════════════════════

export async function listFahrzeuge(): Promise<Fahrzeug[]> {
  const db = await getDb();
  return db.select().from(fahrzeug).orderBy(fahrzeug.kennzeichen);
}

export async function getFahrzeugById(id: string): Promise<Fahrzeug | null> {
  const db = await getDb();
  const rows = await db.select().from(fahrzeug).where(eq(fahrzeug.fahrzeugId, id)).limit(1);
  return rows[0] ?? null;
}

export async function findFahrzeugByKennzeichen(kennzeichen: string): Promise<Fahrzeug | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(fahrzeug)
    .where(eq(fahrzeug.kennzeichen, kennzeichen.trim().toUpperCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function addFahrzeug(data: NeuesFahrzeug): Promise<Fahrzeug> {
  const db = await getDb();
  const [created] = await db.insert(fahrzeug).values(data).returning();
  return created;
}

export async function updFahrzeug(id: string, patch: Partial<NeuesFahrzeug>): Promise<Fahrzeug | null> {
  const db = await getDb();
  const [updated] = await db
    .update(fahrzeug)
    .set(patch)
    .where(eq(fahrzeug.fahrzeugId, id))
    .returning();
  return updated ?? null;
}

export async function delFahrzeug(id: string): Promise<void> {
  // Cascade-Delete erledigt Termine + Mängel automatisch (ON DELETE CASCADE)
  const db = await getDb();
  await db.delete(fahrzeug).where(eq(fahrzeug.fahrzeugId, id));
}

// ════════════════════════════════════════════════════════════
// TERMIN — mit Geschäftsregel WF-01
// ════════════════════════════════════════════════════════════

export async function listTermine(): Promise<Termin[]> {
  const db = await getDb();
  return db.select().from(termin).orderBy(desc(termin.datum), termin.uhrzeit);
}

export async function listTermineDatum(datum: string): Promise<Termin[]> {
  const db = await getDb();
  return db.select().from(termin).where(eq(termin.datum, datum)).orderBy(termin.uhrzeit);
}

export async function getTerminById(id: string): Promise<Termin | null> {
  const db = await getDb();
  const rows = await db.select().from(termin).where(eq(termin.terminId, id)).limit(1);
  return rows[0] ?? null;
}

export async function addTermin(data: NeuerTermin): Promise<Termin> {
  const db = await getDb();
  const [created] = await db.insert(termin).values(data).returning();
  return created;
}

export async function updTermin(id: string, patch: Partial<NeuerTermin>): Promise<Termin | null> {
  const db = await getDb();
  const [updated] = await db
    .update(termin)
    .set(patch)
    .where(eq(termin.terminId, id))
    .returning();
  return updated ?? null;
}

export async function delTermin(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(termin).where(eq(termin.terminId, id));
}

/**
 * WF-01 enforcement: setzt den Status eines Termins, lehnt aber
 * "BESTANDEN" ab wenn ein Hauptmangel/gefährlicher Mangel existiert.
 *
 * Defense in Depth: App-Layer prüft schon, aber wir verifizieren noch
 * mal am Repository — wenn jemand die App-Logik umgeht, fängt der
 * Guard hier auch.
 */
export async function updTerminStatus(
  terminId: string,
  neuerStatus: string,
): Promise<{ ok: true; termin: Termin } | { ok: false; reason: string }> {
  const db = await getDb();

  if (neuerStatus === "Bestanden") {
    const blocker = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(mangel)
      .innerJoin(mangelKategorie, eq(mangel.kategorieCode, mangelKategorie.kategorieCode))
      .where(and(eq(mangel.terminId, terminId), eq(mangelKategorie.blockiertBestanden, true)));

    if ((blocker[0]?.count ?? 0) > 0) {
      return {
        ok: false,
        reason: "BESTANDEN nicht möglich bei Hauptmangel oder gefährlichem Mangel (§29 StVZO)",
      };
    }
  }

  const [updated] = await db
    .update(termin)
    .set({ statusCode: neuerStatus })
    .where(eq(termin.terminId, terminId))
    .returning();

  return { ok: true, termin: updated };
}

// ════════════════════════════════════════════════════════════
// MANGEL — mit Auto-Demotion bei Hauptmangel-Hinzufügung
// ════════════════════════════════════════════════════════════

export async function listMangelByTermin(terminId: string): Promise<Mangel[]> {
  const db = await getDb();
  return db.select().from(mangel).where(eq(mangel.terminId, terminId));
}

export async function addMangel(data: NeuerMangel): Promise<{
  mangel: Mangel;
  terminDemoted: boolean;
}> {
  const db = await getDb();

  // Mangel anlegen
  const [created] = await db.insert(mangel).values(data).returning();

  // Auto-Demotion: war Termin BESTANDEN und neuer Mangel ist HM/GM?
  let terminDemoted = false;
  const [kat] = await db
    .select()
    .from(mangelKategorie)
    .where(eq(mangelKategorie.kategorieCode, data.kategorieCode));

  if (kat?.blockiertBestanden) {
    const [t] = await db
      .select({ statusCode: termin.statusCode })
      .from(termin)
      .where(eq(termin.terminId, data.terminId));

    if (t?.statusCode === "Bestanden") {
      await db
        .update(termin)
        .set({ statusCode: "Nicht bestanden" })
        .where(eq(termin.terminId, data.terminId));
      terminDemoted = true;
    }
  }

  return { mangel: created, terminDemoted };
}

export async function delMangel(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(mangel).where(eq(mangel.mangelId, id));
}

// ════════════════════════════════════════════════════════════
// AGGREGATE QUERIES — komplexere Read-Operationen mit JOINs
// ════════════════════════════════════════════════════════════

/**
 * Liefert alle Termine eines Tages, angereichert mit Fahrzeug-,
 * Halter-, Status- und Mangel-Info. Eine einzige Query mit JOINs
 * statt N+1 wie früher bei Firestore.
 */
export async function getTagesplan(datum: string) {
  const db = await getDb();

  const termine = await db.query.termin.findMany({
    where: eq(termin.datum, datum),
    orderBy: termin.uhrzeit,
    with: {
      fahrzeug: { with: { halter: true } },
      pruefart: true,
      pruefer: true,
      status: true,
      mängel: { with: { kategorie: true } },
    },
  });

  return termine;
}

/**
 * Fahrzeuge mit fälliger oder überfälliger HU.
 * Repliziert die SQL-View v_hu_faellig aus datenmodell.md §3.5.
 */
export async function getHuFaellig(tageVoraus: number = 90) {
  const db = await getDb();
  return db.execute(sql`
    SELECT
      f.kennzeichen,
      f.hersteller || ' ' || f.modell AS fahrzeug,
      h.name AS halter,
      h.telefon,
      h.email,
      f.hu_faellig,
      (f.hu_faellig - CURRENT_DATE) AS tage_bis_faellig,
      CASE
        WHEN f.hu_faellig < CURRENT_DATE THEN 'ueberfaellig'
        WHEN f.hu_faellig < CURRENT_DATE + ${tageVoraus}::int THEN 'kritisch'
        ELSE 'ok'
      END AS status
    FROM fahrzeug f
    JOIN halter h ON h.halter_id = f.halter_id
    WHERE f.hu_faellig IS NOT NULL
    ORDER BY f.hu_faellig
  `);
}

// ════════════════════════════════════════════════════════════
// COUNT QUERIES — Performance: SELECT COUNT statt voll laden
// ════════════════════════════════════════════════════════════

export async function countFahrzeuge(): Promise<number> {
  const db = await getDb();
  const [r] = await db.select({ c: sql<number>`count(*)`.mapWith(Number) }).from(fahrzeug);
  return r?.c ?? 0;
}

export async function countTermine(): Promise<number> {
  const db = await getDb();
  const [r] = await db.select({ c: sql<number>`count(*)`.mapWith(Number) }).from(termin);
  return r?.c ?? 0;
}
