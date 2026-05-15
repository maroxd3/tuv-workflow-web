import * as mariadb from "mariadb";
import dotenv from "dotenv";

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

  await migrate();
  await seedDomainTables();
}

export function db() {
  if (!pool) throw new Error("MariaDB pool is not initialized");
  return pool;
}

async function migrate() {
  const conn = await db().getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS status (
        status_code VARCHAR(40) PRIMARY KEY,
        bezeichnung VARCHAR(80) NOT NULL,
        ist_endzustand BOOLEAN NOT NULL DEFAULT FALSE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS pruefart (
        prueft_code VARCHAR(40) PRIMARY KEY,
        bezeichnung VARCHAR(120) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS pruefer (
        pruefer_kuerzel VARCHAR(20) PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        qualifikation VARCHAR(120)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS mangel_kategorie (
        kategorie_code VARCHAR(20) PRIMARY KEY,
        bezeichnung VARCHAR(120) NOT NULL,
        blockiert_bestanden BOOLEAN NOT NULL DEFAULT FALSE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS halter (
        halter_id CHAR(36) PRIMARY KEY,
        name VARCHAR(160) NOT NULL,
        telefon VARCHAR(80),
        email VARCHAR(160),
        anschrift TEXT,
        erfasst_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY halter_email_unique (email),
        KEY halter_name_idx (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS fahrzeug (
        fahrzeug_id CHAR(36) PRIMARY KEY,
        kennzeichen VARCHAR(32) NOT NULL,
        fin VARCHAR(32),
        hersteller VARCHAR(120) NOT NULL,
        modell VARCHAR(120) NOT NULL,
        baujahr INT,
        farbe VARCHAR(80),
        typ VARCHAR(80) NOT NULL,
        kilometerstand INT,
        hu_faellig DATE,
        halter_id CHAR(36) NOT NULL,
        erfasst_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY fahrzeug_kennzeichen_unique (kennzeichen),
        UNIQUE KEY fahrzeug_fin_unique (fin),
        KEY fahrzeug_hu_idx (hu_faellig),
        KEY fahrzeug_halter_idx (halter_id),
        CONSTRAINT fahrzeug_halter_fk
          FOREIGN KEY (halter_id) REFERENCES halter(halter_id)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fahrzeug_baujahr_check
          CHECK (baujahr IS NULL OR (baujahr BETWEEN 1885 AND 2100)),
        CONSTRAINT fahrzeug_km_check
          CHECK (kilometerstand IS NULL OR (kilometerstand BETWEEN 0 AND 3000000))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS termin (
        termin_id CHAR(36) PRIMARY KEY,
        fahrzeug_id CHAR(36) NOT NULL,
        datum DATE NOT NULL,
        uhrzeit TIME,
        prueft_code VARCHAR(40) NOT NULL,
        pruefer_kuerzel VARCHAR(20),
        status_code VARCHAR(40) NOT NULL DEFAULT 'Geplant',
        notiz TEXT,
        erfasst_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY termin_zeit_unique (fahrzeug_id, datum, uhrzeit),
        KEY termin_datum_idx (datum, uhrzeit),
        KEY termin_fahrzeug_idx (fahrzeug_id, datum),
        CONSTRAINT termin_fahrzeug_fk
          FOREIGN KEY (fahrzeug_id) REFERENCES fahrzeug(fahrzeug_id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT termin_pruefart_fk
          FOREIGN KEY (prueft_code) REFERENCES pruefart(prueft_code)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT termin_pruefer_fk
          FOREIGN KEY (pruefer_kuerzel) REFERENCES pruefer(pruefer_kuerzel)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT termin_status_fk
          FOREIGN KEY (status_code) REFERENCES status(status_code)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS mangel (
        mangel_id CHAR(36) PRIMARY KEY,
        termin_id CHAR(36) NOT NULL,
        code_stvzo VARCHAR(40),
        beschreibung TEXT NOT NULL,
        kategorie_code VARCHAR(20) NOT NULL,
        behoben BOOLEAN NOT NULL DEFAULT FALSE,
        erfasst_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY mangel_termin_idx (termin_id),
        KEY mangel_kategorie_idx (kategorie_code),
        CONSTRAINT mangel_termin_fk
          FOREIGN KEY (termin_id) REFERENCES termin(termin_id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT mangel_kategorie_fk
          FOREIGN KEY (kategorie_code) REFERENCES mangel_kategorie(kategorie_code)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } finally {
    conn.release();
  }
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

const MANGEL_KATEGORIE_SEED = [
  ["OM", "Ohne Mangel", false],
  ["LM", "Leichter Mangel", false],
  ["EM", "Erheblicher Mangel", false],
  ["HM", "Hauptmangel", true],
  ["GM", "Gefährlicher Mangel", true],
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
  } finally {
    conn.release();
  }
}
