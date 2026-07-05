// Versionierte Schema-Migrationen. Jede Migration laeuft genau EINMAL pro
// Datenbank und wird in schema_migration protokolliert. Damit haben
// ALTER-Aenderungen an Bestandsinstallationen einen sauberen Weg in die DB —
// das alte Muster "CREATE TABLE IF NOT EXISTS bei jedem Boot" konnte neue
// Tabellen anlegen, aber bestehende nie veraendern.
//
// Regeln:
// - Migrationen sind append-only: nie eine ausgelieferte Migration aendern,
//   immer eine neue Version anhaengen. Bestandskunden haben die alte Version
//   bereits protokolliert und wuerden die Aenderung nie sehen.
// - version ist eine fortlaufende Ganzzahl, name ist Doku.
// - up(conn) bekommt eine Pool-Connection. MariaDB committet DDL implizit
//   (kein transaktionales DDL) — deshalb muss jede Migration so geschrieben
//   sein, dass ein Abbruch in der Mitte beim naechsten Boot gefahrlos
//   wiederholt werden kann (IF NOT EXISTS, idempotente UPDATEs).
// - Kein Down-Pfad: On-Premise-Rollback laeuft ueber das Backup-Konzept
//   (docs/backup.md), nicht ueber Reverse-Migrationen.
//
// Siehe ADR-011 (docs/decisions/011-versionierte-migrationen.md).

export const MIGRATIONS = [
  {
    version: 1,
    name: "initial-schema",
    // IF NOT EXISTS bewusst beibehalten: Bestandsinstallationen (vor
    // Einfuehrung dieses Frameworks) haben die Tabellen schon — Migration 1
    // muss auf ihnen als No-op durchlaufen und wird danach protokolliert.
    async up(conn) {
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
    },
  },

  {
    version: 2,
    name: "hu-richtlinie-kategorien",
    // Einmal-Migration vom alten Kategorie-Schema (OM/LM/EM/HM/GM mit
    // GM=Gefaehrlich) auf die HU-Richtlinie (OM/GM/EM/GfM mit GM=Gering).
    // Nutzt ON UPDATE CASCADE auf der FK mangel.kategorie_code, damit
    // mangel-Zeilen automatisch mitumbenannt werden. Idempotent.
    async up(conn) {
      // Schritt 1: Alte 'GM'-Zeile bedeutete "Gefaehrlicher Mangel". Heute
      // heisst 'GM' "Geringer Mangel". Erst umbenennen in 'GfM', damit der
      // Code 'GM' fuer die neue Bedeutung frei wird.
      const oldGmAsGefaehrlich = await conn.query(
        `SELECT 1 FROM mangel_kategorie
         WHERE kategorie_code = 'GM' AND bezeichnung LIKE '%Gefährlich%' LIMIT 1`,
      );
      if (oldGmAsGefaehrlich.length > 0) {
        await conn.query(
          `UPDATE mangel_kategorie
           SET kategorie_code = 'GfM', bezeichnung = 'Gefährlicher Mangel', blockiert_bestanden = TRUE
           WHERE kategorie_code = 'GM'`,
        );
      }

      // Schritt 2: 'LM' (Leichter Mangel) heisst nach HU-Richtlinie 'GM'
      // (Geringer Mangel). Umbenennen — FK cascadet auf mangel-Zeilen.
      const oldLm = await conn.query(
        `SELECT 1 FROM mangel_kategorie WHERE kategorie_code = 'LM' LIMIT 1`,
      );
      if (oldLm.length > 0) {
        await conn.query(
          `UPDATE mangel_kategorie
           SET kategorie_code = 'GM', bezeichnung = 'Geringer Mangel', blockiert_bestanden = FALSE
           WHERE kategorie_code = 'LM'`,
        );
      }

      // Schritt 3: 'HM' (Hauptmangel, veraltete Sprache) ist in der modernen
      // HU-Richtlinie ein Synonym fuer 'EM' (Erheblicher Mangel). Mangel-Zeilen
      // direkt umrouten (nicht via PK-Update, weil 'EM' bereits existiert),
      // dann alte Kategorie-Zeile loeschen.
      const oldHm = await conn.query(
        `SELECT 1 FROM mangel_kategorie WHERE kategorie_code = 'HM' LIMIT 1`,
      );
      if (oldHm.length > 0) {
        await conn.query(
          `UPDATE mangel SET kategorie_code = 'EM' WHERE kategorie_code = 'HM'`,
        );
        await conn.query(
          `DELETE FROM mangel_kategorie WHERE kategorie_code = 'HM'`,
        );
      }

      // Schritt 4: 'EM' war im alten Schema NICHT blockierend (Bug — laut
      // HU-Richtlinie verhindert ein Erheblicher Mangel die Plakette).
      await conn.query(
        `UPDATE mangel_kategorie SET blockiert_bestanden = TRUE WHERE kategorie_code = 'EM'`,
      );
    },
  },

  {
    version: 3,
    name: "benutzer-tabelle",
    // Benutzerkonzept (Login + Rollen empfang/pruefer/chef). Die Tabelle
    // haelt nur die Konten — die Default-Benutzer werden als Desired-State-
    // Seed in server/db.js angelegt (INSERT IGNORE), nicht hier, damit
    // fehlende Konten bei jedem Boot nachgezogen werden koennen.
    // IF NOT EXISTS: gefahrlos wiederholbar bei Abbruch (siehe Header).
    async up(conn) {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS benutzer (
          benutzer_id CHAR(36) PRIMARY KEY,
          kuerzel VARCHAR(20) NOT NULL,
          name VARCHAR(120) NOT NULL,
          rolle VARCHAR(20) NOT NULL,
          passwort_hash VARCHAR(255) NOT NULL,
          aktiv BOOLEAN NOT NULL DEFAULT TRUE,
          erstellt_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY benutzer_kuerzel_unique (kuerzel),
          CONSTRAINT benutzer_rolle_check
            CHECK (rolle IN ('empfang', 'pruefer', 'chef'))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    },
  },
];

// Fuehrt alle noch nicht protokollierten Migrationen in Versions-Reihenfolge
// aus. GET_LOCK serialisiert konkurrierende Boots (z. B. Container-Restart
// waehrend ein zweiter Prozess schon migriert) — der zweite Prozess wartet
// und sieht danach die protokollierten Versionen.
export async function runMigrations(pool) {
  const conn = await pool.getConnection();
  try {
    const [lock] = await conn.query(
      "SELECT GET_LOCK('tuv_schema_migration', 30) AS ok",
    );
    if (!Number(lock?.ok)) {
      throw new Error("Migrations-Lock nicht erhalten (anderer Prozess migriert seit >30s?)");
    }

    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS schema_migration (
          version INT PRIMARY KEY,
          name VARCHAR(120) NOT NULL,
          applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      const rows = await conn.query("SELECT version FROM schema_migration");
      const applied = new Set(rows.map((r) => Number(r.version)));

      const sorted = [...MIGRATIONS].sort((a, b) => a.version - b.version);
      for (const m of sorted) {
        if (applied.has(m.version)) continue;
        console.log(`[db] Migration ${m.version} (${m.name}) wird angewendet ...`);
        await m.up(conn);
        await conn.query(
          "INSERT INTO schema_migration (version, name) VALUES (?, ?)",
          [m.version, m.name],
        );
        console.log(`[db] Migration ${m.version} (${m.name}) angewendet.`);
      }
    } finally {
      await conn.query("SELECT RELEASE_LOCK('tuv_schema_migration')");
    }
  } finally {
    conn.release();
  }
}
