/**
 * Initial-Daten für die Domänen-Tabellen (Status, Prüfart, Prüfer, Mangel-Kategorie).
 *
 * Diese Daten sind das Wahrheits-Universum der App und müssen bei jeder
 * frischen Datenbank vorhanden sein, damit Fremdschlüssel-Referenzen
 * funktionieren.
 */

import { getDb } from "./client";
import {
  status,
  pruefart,
  pruefer,
  mangelKategorie,
} from "./schema";

const STATUS_SEED = [
  { statusCode: "GEPLANT",          bezeichnung: "Geplant",          istEndzustand: false },
  { statusCode: "IN_PRUEFUNG",      bezeichnung: "In Prüfung",       istEndzustand: false },
  { statusCode: "BESTANDEN",        bezeichnung: "Bestanden",        istEndzustand: true },
  { statusCode: "NICHT_BESTANDEN",  bezeichnung: "Nicht bestanden",  istEndzustand: true },
  { statusCode: "NACHPRUEFUNG",     bezeichnung: "Nachprüfung",      istEndzustand: false },
  { statusCode: "NICHT_ERSCHIENEN", bezeichnung: "Nicht erschienen", istEndzustand: true },
  { statusCode: "ABGEBROCHEN",      bezeichnung: "Abgebrochen",      istEndzustand: true },
];

const PRUEFART_SEED = [
  { prueftCode: "HU",       bezeichnung: "Hauptuntersuchung" },
  { prueftCode: "AU",       bezeichnung: "Abgasuntersuchung" },
  { prueftCode: "HU_AU",    bezeichnung: "HU + AU kombiniert" },
  { prueftCode: "NP",       bezeichnung: "Nachprüfung" },
  { prueftCode: "SP",       bezeichnung: "Sicherheitsprüfung" },
  { prueftCode: "Abnahme",  bezeichnung: "Abnahme nach Reparatur" },
];

const PRUEFER_SEED = [
  { prueferKuerzel: "MW", name: "Marwan Saleh", qualifikation: "Sachverständiger" },
  { prueferKuerzel: "AF", name: "Andre Fischer", qualifikation: "Sachverständiger" },
  { prueferKuerzel: "SK", name: "Sandra Krüger", qualifikation: "Sachverständige" },
  { prueferKuerzel: "TB", name: "Tobias Bauer",  qualifikation: "Sachverständiger" },
  { prueferKuerzel: "LN", name: "Lena Neumann",  qualifikation: "Sachverständige" },
];

const MANGEL_KATEGORIE_SEED = [
  { kategorieCode: "OM", bezeichnung: "Ohne Mangel",         blockiertBestanden: false },
  { kategorieCode: "LM", bezeichnung: "Leichter Mangel",     blockiertBestanden: false },
  { kategorieCode: "EM", bezeichnung: "Erheblicher Mangel",  blockiertBestanden: false },
  { kategorieCode: "HM", bezeichnung: "Hauptmangel",         blockiertBestanden: true },
  { kategorieCode: "GM", bezeichnung: "Gefährlicher Mangel", blockiertBestanden: true },
];

/** Schreibt alle Domänen-Daten idempotent (ON CONFLICT DO NOTHING). */
export async function seedDomainTables() {
  const db = await getDb();

  await db.insert(status).values(STATUS_SEED).onConflictDoNothing();
  await db.insert(pruefart).values(PRUEFART_SEED).onConflictDoNothing();
  await db.insert(pruefer).values(PRUEFER_SEED).onConflictDoNothing();
  await db.insert(mangelKategorie).values(MANGEL_KATEGORIE_SEED).onConflictDoNothing();
}
