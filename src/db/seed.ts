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

// ════════════════════════════════════════════════════════════
// Demo-Daten: Halter, Fahrzeuge, Termine, Mängel
// (Port der ehemaligen makeSeed()-Funktion aus useStore.js,
//  jetzt korrekt 3NF-normalisiert auf die neuen Tabellen verteilt.)
// ════════════════════════════════════════════════════════════

import { halter, fahrzeug, termin, mangel } from "./schema";
import { sql } from "drizzle-orm";

function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** Komplett-Reset aller Daten-Tabellen (Domänen bleiben). Für „Daten löschen". */
export async function clearAllDataTables() {
  const db = await getDb();
  await db.execute(sql`
    TRUNCATE mangel, termin, fahrzeug, halter
    RESTART IDENTITY CASCADE;
  `);
}

/** Lädt die typische Demo-Bestand: 5 Halter, 8 Fahrzeuge, 13 Termine, mit Mängeln. */
export async function seedDemoBestand() {
  const db = await getDb();

  // 5 Halter
  const halterRows = await db
    .insert(halter)
    .values([
      { name: "Klaus Müller", telefon: "0176 1234567", email: "k.mueller@mail.de" },
      { name: "Sabine Koch", telefon: "0178 9876543", email: "s.koch@web.de" },
      { name: "Bau GmbH Lehmann", telefon: "089 55443322", email: "info@lehmann-bau.de" },
      { name: "Tarek Osman", telefon: "0171 4445566", email: "t.osman@gmail.com" },
      { name: "Anna Richter", telefon: "0162 7778899", email: "a.richter@outlook.de" },
      { name: "Kurierdienst Schnell GmbH", telefon: "0211 3344556", email: "fuhrpark@schnell-gmbh.de" },
      { name: "Dr. Julia Vogel", telefon: "069 77889900", email: "j.vogel@kanzlei-vogel.de" },
      { name: "Malerbetrieb Heinz Schreiber", telefon: "0561 123456", email: "schreiber-maler@t-online.de" },
    ])
    .returning();

  const [hMueller, hKoch, hLehmann, hOsman, hRichter, hKurier, hVogel, hSchreiber] = halterRows;

  // 8 Fahrzeuge — jeweils einem Halter zugeordnet
  const today = isoDate();
  const fzRows = await db
    .insert(fahrzeug)
    .values([
      { kennzeichen: "B-TK 1234", fin: "WBA3A5C50CF256985", hersteller: "BMW", modell: "320d xDrive", baujahr: 2018, farbe: "Sophistograu", typ: "PKW", kilometerstand: 87420, huFaellig: isoDate(180), halterId: hMueller.halterId },
      { kennzeichen: "HH-AB 5678", fin: "WVWZZZ1KZ5W315264", hersteller: "Volkswagen", modell: "Golf VIII GTI", baujahr: 2021, farbe: "Schwarzsilber", typ: "PKW", kilometerstand: 42100, huFaellig: isoDate(540), halterId: hKoch.halterId },
      { kennzeichen: "M-XZ 9900", fin: "3FADP4BJ1EM198765", hersteller: "Ford", modell: "Transit L3H2 2.0 TDCi", baujahr: 2016, farbe: "Arktikweiß", typ: "Transporter", kilometerstand: 196300, huFaellig: isoDate(30), halterId: hLehmann.halterId },
      { kennzeichen: "S-LM 2233", fin: "ZFA31200001234567", hersteller: "Fiat", modell: "Ducato 35 Maxi", baujahr: 2015, farbe: "Polarweiß", typ: "Transporter", kilometerstand: 234000, huFaellig: isoDate(-14), halterId: hOsman.halterId },
      { kennzeichen: "K-RP 4411", fin: "WMWRC31060TJ32154", hersteller: "MINI", modell: "Cooper S Clubman", baujahr: 2022, farbe: "Moonwalk Grey", typ: "PKW", kilometerstand: 18900, huFaellig: isoDate(720), halterId: hRichter.halterId },
      { kennzeichen: "D-EF 7712", fin: "WDD2052281A123456", hersteller: "Mercedes-Benz", modell: "Sprinter 316 CDI", baujahr: 2019, farbe: "Arktikweiß", typ: "Transporter", kilometerstand: 141000, huFaellig: isoDate(60), halterId: hKurier.halterId },
      { kennzeichen: "F-ML 3390", fin: "WBAVD13500KX12345", hersteller: "BMW", modell: "iX3 M Sport", baujahr: 2023, farbe: "Mineralweiß", typ: "BEV", kilometerstand: 22400, huFaellig: isoDate(900), halterId: hVogel.halterId },
      { kennzeichen: "KS-TF 1100", fin: "VF7RHN9HPEJ123456", hersteller: "Citroën", modell: "Berlingo M 1.5 BlueHDi", baujahr: 2017, farbe: "Perla Nera", typ: "Transporter", kilometerstand: 178000, huFaellig: isoDate(-2), halterId: hSchreiber.halterId },
    ])
    .returning();

  const [f1, f2, f3, f4, f5, f6, f7, f8] = fzRows;

  // 13 Termine über die letzten Tage und heute
  const trRows = await db
    .insert(termin)
    .values([
      { fahrzeugId: f1.fahrzeugId, datum: today, uhrzeit: "08:00:00", prueftCode: "HU_AU", prueferKuerzel: "MW", statusCode: "BESTANDEN", notiz: "Fahrzeug in sehr gutem Zustand. Geringer Mangel an Bremsflüssigkeit notiert." },
      { fahrzeugId: f2.fahrzeugId, datum: today, uhrzeit: "09:00:00", prueftCode: "HU", prueferKuerzel: "AF", statusCode: "IN_PRUEFUNG", notiz: null },
      { fahrzeugId: f3.fahrzeugId, datum: today, uhrzeit: "10:30:00", prueftCode: "HU_AU", prueferKuerzel: "SK", statusCode: "NICHT_BESTANDEN", notiz: "Fahrzeug nicht verkehrssicher. Hauptmängel an Bremsen und Reifen." },
      { fahrzeugId: f4.fahrzeugId, datum: today, uhrzeit: "13:00:00", prueftCode: "NP", prueferKuerzel: "MW", statusCode: "GEPLANT", notiz: "Nachprüfung nach HU vom 15.06." },
      { fahrzeugId: f5.fahrzeugId, datum: today, uhrzeit: "14:30:00", prueftCode: "HU", prueferKuerzel: "LN", statusCode: "GEPLANT", notiz: null },
      { fahrzeugId: f6.fahrzeugId, datum: today, uhrzeit: "15:00:00", prueftCode: "SP", prueferKuerzel: "TB", statusCode: "GEPLANT", notiz: "Regelmäßige SP für Gewerbebetrieb" },
      { fahrzeugId: f7.fahrzeugId, datum: today, uhrzeit: "16:00:00", prueftCode: "HU_AU", prueferKuerzel: "AF", statusCode: "GEPLANT", notiz: "Erstprüfung BEV — OBD-Diagnose einplanen." },
      { fahrzeugId: f2.fahrzeugId, datum: isoDate(-1), uhrzeit: "09:30:00", prueftCode: "AU", prueferKuerzel: "TB", statusCode: "BESTANDEN", notiz: null },
      { fahrzeugId: f1.fahrzeugId, datum: isoDate(1), uhrzeit: "08:30:00", prueftCode: "HU", prueferKuerzel: "MW", statusCode: "GEPLANT", notiz: null },
      { fahrzeugId: f8.fahrzeugId, datum: today, uhrzeit: "11:00:00", prueftCode: "HU_AU", prueferKuerzel: "SK", statusCode: "NACHPRUEFUNG", notiz: "Erhebliche Mängel. Nachprüfung in 4 Wochen empfohlen." },
      { fahrzeugId: f3.fahrzeugId, datum: isoDate(-1), uhrzeit: "14:00:00", prueftCode: "Abnahme", prueferKuerzel: "AF", statusCode: "BESTANDEN", notiz: null },
      { fahrzeugId: f6.fahrzeugId, datum: isoDate(-2), uhrzeit: "10:00:00", prueftCode: "HU_AU", prueferKuerzel: "MW", statusCode: "BESTANDEN", notiz: null },
      { fahrzeugId: f4.fahrzeugId, datum: isoDate(-2), uhrzeit: "13:30:00", prueftCode: "HU", prueferKuerzel: "LN", statusCode: "NICHT_BESTANDEN", notiz: null },
    ])
    .returning();

  const [t1, t2, t3, , , , , , , t10, t11, , t13] = trRows;

  // Mängel zu ausgewählten Terminen
  await db.insert(mangel).values([
    { terminId: t1.terminId, codeStvzo: "2.5.1", beschreibung: "Bremsflüssigkeit: Wasseranteil zu hoch (> 3,5%)", kategorieCode: "LM" },
    { terminId: t3.terminId, codeStvzo: "2.1.1", beschreibung: "Betriebsbremse: Ungleichmäßige Bremswirkung", kategorieCode: "HM" },
    { terminId: t3.terminId, codeStvzo: "4.1.1", beschreibung: "Profiltiefe: Profiltiefe unter 1,6 mm", kategorieCode: "HM" },
    { terminId: t3.terminId, codeStvzo: "3.3.1", beschreibung: "Bremslicht: Bremslicht links defekt", kategorieCode: "HM" },
    { terminId: t3.terminId, codeStvzo: "2.3.1", beschreibung: "Bremsscheibe: Bremsscheibe stark verschlissen", kategorieCode: "HM" },
    { terminId: t3.terminId, codeStvzo: "5.6.2", beschreibung: "Kennzeichen: Hinteres Kennzeichen unleserlich", kategorieCode: "HM" },
    { terminId: t10.terminId, codeStvzo: "8.1.1", beschreibung: "Stoßdämpfer: Stoßdämpfer vorne defekt", kategorieCode: "EM" },
    { terminId: t10.terminId, codeStvzo: "4.1.2", beschreibung: "Profiltiefe: 1,6–3 mm (Empfehlung: wechseln)", kategorieCode: "EM" },
    { terminId: t10.terminId, codeStvzo: "3.5.3", beschreibung: "Blinker: Fahrtrichtungsanzeiger hinten links defekt", kategorieCode: "EM" },
    { terminId: t11.terminId, codeStvzo: "5.2.1", beschreibung: "Karosserie: Scharfe Kanten durch Unfallschaden", kategorieCode: "EM", behoben: true },
    { terminId: t13.terminId, codeStvzo: "6.1.1", beschreibung: "Abgasanlage: Undichtigkeit Abgasanlage", kategorieCode: "HM" },
    { terminId: t13.terminId, codeStvzo: "2.6.1", beschreibung: "Feststellbremse: Feststellbremse hält nicht ausreichend", kategorieCode: "HM" },
  ]);
}
