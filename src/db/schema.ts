/**
 * Drizzle-Schema-Definition für TÜV Prüfstelle Pro.
 *
 * Folgt 1:1 dem logischen Modell aus `docs/datenmodell.md` §2.2:
 * 3NF-normalisiert, mit eigenständigen Relationen für HALTER, MANGEL und
 * den Domänen-Tabellen STATUS, PRUEFART, PRUEFER, MANGEL_KATEGORIE.
 *
 * Drizzle generiert daraus automatisch:
 *   - Typsichere Query-Builder-Methoden
 *   - SQL-DDL-Migrationen (npm run db:generate)
 *   - Inferred TypeScript-Typen für jede Tabelle
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  date,
  time,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ════════════════════════════════════════════════════════════
// Domänen-Tabellen (Stamm-/Wahrheits-Tabellen)
// ════════════════════════════════════════════════════════════

export const status = pgTable("status", {
  statusCode: text("status_code").primaryKey(),
  bezeichnung: text("bezeichnung").notNull(),
  istEndzustand: boolean("ist_endzustand").notNull().default(false),
});

export const pruefart = pgTable("pruefart", {
  prueftCode: text("prueft_code").primaryKey(),
  bezeichnung: text("bezeichnung").notNull(),
});

export const pruefer = pgTable("pruefer", {
  prueferKuerzel: text("pruefer_kuerzel").primaryKey(),
  name: text("name").notNull(),
  qualifikation: text("qualifikation"),
});

export const mangelKategorie = pgTable("mangel_kategorie", {
  kategorieCode: text("kategorie_code").primaryKey(),
  bezeichnung: text("bezeichnung").notNull(),
  blockiertBestanden: boolean("blockiert_bestanden").notNull().default(false),
});

// ════════════════════════════════════════════════════════════
// Stamm-Tabelle HALTER (3NF: eigene Entität)
// ════════════════════════════════════════════════════════════

export const halter = pgTable("halter", {
  halterId: uuid("halter_id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  telefon: text("telefon"),
  email: text("email"),
  anschrift: text("anschrift"),
  erfasstAm: timestamp("erfasst_am", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailUnique: uniqueIndex("halter_email_unique").on(t.email),
  nameIdx: index("halter_name_idx").on(sql`LOWER(${t.name})`),
}));

// ════════════════════════════════════════════════════════════
// Stamm-Tabelle FAHRZEUG (mit halter_id Fremdschlüssel)
// ════════════════════════════════════════════════════════════

export const fahrzeug = pgTable("fahrzeug", {
  fahrzeugId: uuid("fahrzeug_id").primaryKey().defaultRandom(),
  kennzeichen: text("kennzeichen").notNull(),
  fin: text("fin"),
  hersteller: text("hersteller").notNull(),
  modell: text("modell").notNull(),
  baujahr: integer("baujahr"),
  farbe: text("farbe"),
  typ: text("typ").notNull(),
  kilometerstand: integer("kilometerstand"),
  huFaellig: date("hu_faellig"),
  halterId: uuid("halter_id").notNull().references(() => halter.halterId, {
    onDelete: "restrict",
    onUpdate: "cascade",
  }),
  erfasstAm: timestamp("erfasst_am", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  kennzeichenUnique: uniqueIndex("fahrzeug_kennzeichen_unique").on(t.kennzeichen),
  // Partial UNIQUE: FIN nur eindeutig wenn nicht NULL — siehe datenmodell.md §3.1
  finUnique: uniqueIndex("fahrzeug_fin_unique")
    .on(t.fin)
    .where(sql`${t.fin} IS NOT NULL`),
  huIdx: index("fahrzeug_hu_idx").on(t.huFaellig).where(sql`${t.huFaellig} IS NOT NULL`),
  baujahrCheck: check(
    "fahrzeug_baujahr_check",
    sql`${t.baujahr} BETWEEN 1885 AND EXTRACT(YEAR FROM CURRENT_DATE)::int + 1`
  ),
  kmCheck: check(
    "fahrzeug_km_check",
    sql`${t.kilometerstand} BETWEEN 0 AND 3000000`
  ),
}));

// ════════════════════════════════════════════════════════════
// Beziehungs-Tabelle TERMIN (verbindet Fahrzeug, Prüfart, Prüfer, Status)
// ════════════════════════════════════════════════════════════

export const termin = pgTable("termin", {
  terminId: uuid("termin_id").primaryKey().defaultRandom(),
  fahrzeugId: uuid("fahrzeug_id").notNull().references(() => fahrzeug.fahrzeugId, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  datum: date("datum").notNull(),
  uhrzeit: time("uhrzeit"),
  prueftCode: text("prueft_code").notNull().references(() => pruefart.prueftCode, {
    onDelete: "restrict",
  }),
  prueferKuerzel: text("pruefer_kuerzel").references(() => pruefer.prueferKuerzel, {
    onDelete: "set null",
  }),
  statusCode: text("status_code").notNull().default("GEPLANT").references(() => status.statusCode, {
    onDelete: "restrict",
  }),
  notiz: text("notiz"),
  erfasstAm: timestamp("erfasst_am", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // Ein Fahrzeug kann nicht zur gleichen Zeit zwei Termine haben
  zeitEindeutig: uniqueIndex("termin_zeit_unique").on(t.fahrzeugId, t.datum, t.uhrzeit),
  datumIdx: index("termin_datum_idx").on(t.datum, t.uhrzeit),
  fahrzeugIdx: index("termin_fahrzeug_idx").on(t.fahrzeugId, t.datum),
}));

// ════════════════════════════════════════════════════════════
// Beziehungs-Tabelle MANGEL (3NF: eigene Tabelle, war eingebettetes Array)
// ════════════════════════════════════════════════════════════

export const mangel = pgTable("mangel", {
  mangelId: uuid("mangel_id").primaryKey().defaultRandom(),
  terminId: uuid("termin_id").notNull().references(() => termin.terminId, {
    onDelete: "cascade",
  }),
  codeStvzo: text("code_stvzo"),
  beschreibung: text("beschreibung").notNull(),
  kategorieCode: text("kategorie_code").notNull().references(() => mangelKategorie.kategorieCode, {
    onDelete: "restrict",
  }),
  behoben: boolean("behoben").notNull().default(false),
  erfasstAm: timestamp("erfasst_am", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  terminIdx: index("mangel_termin_idx").on(t.terminId),
  kategorieIdx: index("mangel_kategorie_idx").on(t.kategorieCode),
}));

// ════════════════════════════════════════════════════════════
// Inferred TypeScript Types — für sicheren App-Code
// ════════════════════════════════════════════════════════════

export type Halter = typeof halter.$inferSelect;
export type NeuerHalter = typeof halter.$inferInsert;

export type Fahrzeug = typeof fahrzeug.$inferSelect;
export type NeuesFahrzeug = typeof fahrzeug.$inferInsert;

export type Termin = typeof termin.$inferSelect;
export type NeuerTermin = typeof termin.$inferInsert;

export type Mangel = typeof mangel.$inferSelect;
export type NeuerMangel = typeof mangel.$inferInsert;

export type Status = typeof status.$inferSelect;
export type Pruefart = typeof pruefart.$inferSelect;
export type Pruefer = typeof pruefer.$inferSelect;
export type MangelKategorie = typeof mangelKategorie.$inferSelect;
