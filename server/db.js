import * as mariadb from "mariadb";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { runMigrations } from "./migrations.js";
import { hashPassword } from "./auth.js";

dotenv.config();

const config = {
  host: process.env.MARIADB_HOST || "127.0.0.1",
  port: Number(process.env.MARIADB_PORT || 3306),
  user: process.env.MARIADB_USER || "root",
  password: process.env.MARIADB_PASSWORD || "",
  database: process.env.MARIADB_DATABASE || "tuv_workflow",
};

let pool;

export async function ensureDatabase() {
  const admin = await mariadb.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true,
  });

  await admin.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.database}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await admin.end();

  pool = mariadb.createPool({
    ...config,
    connectionLimit: 8,
    dateStrings: true,
    supportBigNumbers: true,
  });

  // Schema-Aenderungen laufen versioniert (einmal pro DB, protokolliert in
  // schema_migration). Seeds und Trigger sind dagegen Desired-State: sie
  // beschreiben den SOLL-Zustand und sind idempotent — bei jedem Boot
  // anwendbar, damit z. B. eine Trigger-Korrektur ohne neue Migration bei
  // allen Instanzen ankommt (CREATE OR REPLACE / INSERT IGNORE).
  await runMigrations(pool);
  await seedDomainTables();
  await migrateTriggers();
}

export function db() {
  if (!pool) throw new Error("MariaDB pool is not initialized");
  return pool;
}

const STATUS_SEED = [
  ["Geplant", "Geplant", false],
  ["In Prüfung", "In Prüfung", false],
  ["Bestanden", "Bestanden", true],
  ["Nicht bestanden", "Nicht bestanden", true],
  ["Nachprüfung", "Nachprüfung", false],
  ["Nicht erschienen", "Nicht erschienen", true],
  ["Abgebrochen", "Abgebrochen", true],
];

const PRUEFART_SEED = [
  ["HU", "Hauptuntersuchung (HU)"],
  ["AU", "Abgasuntersuchung (AU)"],
  ["HU_AU", "HU + AU (kombiniert)"],
  ["NP", "Nachprüfung"],
  ["§21", "Einzelgenehmigung § 21 StVZO"],
  ["§19", "Teilegutachten § 19 StVZO"],
  ["SP", "Sicherheitsprüfung (SP)"],
  ["Saison", "Saisonzulassung"],
  ["GAS", "Gasanlagenprüfung (CNG/LPG)"],
  ["Abnahme", "Fahrzeugabnahme / Umrüstung"],
  ["OBD", "OBD-Prüfung"],
  ["Licht", "Lichttest / Scheinwerfereinst."],
];

const PRUEFER_SEED = [
  ["MW", "Marwan Saleh", "Sachverständiger"],
  ["AF", "Andre Fischer", "Sachverständiger"],
  ["SK", "Sandra Krüger", "Sachverständige"],
  ["TB", "Tobias Bauer", "Sachverständiger"],
  ["LN", "Lena Neumann", "Sachverständige"],
];

// Mangel-Kategorien nach HU-Richtlinie (§29 StVZO, Anlage VIII Nr. 3).
// Konsistent in DB, Backend, Frontend — keine Doppel-Sprache
// blockiert_bestanden = TRUE: Termin darf nicht auf "Bestanden" gesetzt werden.
const MANGEL_KATEGORIE_SEED = [
  ["OM",  "Ohne Mangel",          false],
  ["GM",  "Geringer Mangel",      false],
  ["EM",  "Erheblicher Mangel",   true],
  ["GfM", "Gefährlicher Mangel",  true],
];

// WF-01 als 3. Defense-Layer: blockiert in MariaDB selbst, dass ein Termin
// auf 'Bestanden' gesetzt wird, solange er einen Hauptmangel (HM) oder
// gefaehrlichen Mangel (GM) hat. Der UI-Guard und der API-Guard koennen
// umgangen werden (direkter SQL-Zugriff, generischer PATCH-Endpoint) — der
// Trigger nicht. Idempotent dank CREATE OR REPLACE.
async function migrateTriggers() {
  const conn = await db().getConnection();
  try {
    await conn.query(`
      CREATE OR REPLACE TRIGGER trg_termin_wf01_update
      BEFORE UPDATE ON termin
      FOR EACH ROW
      BEGIN
        IF NEW.status_code = 'Bestanden' AND OLD.status_code <> 'Bestanden' THEN
          IF EXISTS (
            SELECT 1
            FROM mangel m
            JOIN mangel_kategorie mk ON mk.kategorie_code = m.kategorie_code
            WHERE m.termin_id = NEW.termin_id
              AND mk.blockiert_bestanden = TRUE
              AND m.behoben = FALSE
          ) THEN
            SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'WF-01: BESTANDEN nicht moeglich bei erheblichem oder gefaehrlichem Mangel (§29 StVZO)';
          END IF;
        END IF;
      END
    `);
  } finally {
    conn.release();
  }
}

// Default-Benutzer fuer das Rollen-Login (empfang/pruefer/chef). Alle drei
// starten mit demselben Default-Passwort (env DEFAULT_USER_PASSWORT,
// Fallback "start123"). Das Kunden-Setup MUSS die Passwoerter aendern —
// der Default ist nur fuer Erst-Inbetriebnahme und Demo gedacht.
// INSERT IGNORE greift auf dem UNIQUE-Key kuerzel: bestehende Konten
// (inkl. geaenderter Passwoerter) werden beim Boot NIE ueberschrieben.
const BENUTZER_SEED = [
  ["empfang", "Empfang",       "empfang"],
  ["MW",      "Marwan Saleh",  "pruefer"],
  ["chef",    "Chef",          "chef"],
];

async function seedDomainTables() {
  const conn = await db().getConnection();
  try {
    await conn.batch(
      "INSERT IGNORE INTO status (status_code, bezeichnung, ist_endzustand) VALUES (?, ?, ?)",
      STATUS_SEED,
    );
    await conn.batch(
      "INSERT IGNORE INTO pruefart (prueft_code, bezeichnung) VALUES (?, ?)",
      PRUEFART_SEED,
    );
    await conn.batch(
      "INSERT IGNORE INTO pruefer (pruefer_kuerzel, name, qualifikation) VALUES (?, ?, ?)",
      PRUEFER_SEED,
    );
    await conn.batch(
      "INSERT IGNORE INTO mangel_kategorie (kategorie_code, bezeichnung, blockiert_bestanden) VALUES (?, ?, ?)",
      MANGEL_KATEGORIE_SEED,
    );
    // Hash einmal berechnen (scrypt ist absichtlich teuer) — alle drei
    // Default-Konten teilen sich das Default-Passwort.
    const defaultHash = hashPassword(process.env.DEFAULT_USER_PASSWORT || "start123");
    await conn.batch(
      "INSERT IGNORE INTO benutzer (benutzer_id, kuerzel, name, rolle, passwort_hash) VALUES (?, ?, ?, ?, ?)",
      BENUTZER_SEED.map(([kuerzel, name, rolle]) => [randomUUID(), kuerzel, name, rolle, defaultHash]),
    );
  } finally {
    conn.release();
  }
}
