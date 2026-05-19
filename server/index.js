import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { db, ensureDatabase } from "./db.js";
import {
  check,
  validateHalter,
  validateFahrzeug,
  validateTermin,
  validateStatusUpdate,
  validateMangel,
} from "./validate.js";

const app = express();
const port = Number(process.env.API_PORT || 8787);

// CORS: nur lokales LAN und localhost erlauben. Wildcard-CORS (urspruenglich)
// liess jeder beliebigen Origin Calls machen — fuer ein On-Premise-Geraet
// im LAN unnoetig offen. Falls Origin fehlt (same-origin oder Server-to-Server)
// wird durchgelassen.
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const ALLOWED_ORIGIN_HOSTS = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map(s => s.trim()).filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  // explizite whitelist via .env
  if (ALLOWED_ORIGIN_HOSTS.includes(origin)) return true;
  try {
    const u = new URL(origin);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
    // Private LANs (RFC 1918): 10.x.x.x, 172.16-31.x.x, 192.168.x.x
    if (/^10\./.test(u.hostname)) return true;
    if (/^192\.168\./.test(u.hostname)) return true;
    if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(u.hostname)) return true;
  } catch { /* ignore */ }
  return false;
}

app.use(cors({
  origin: (origin, cb) => isAllowedOrigin(origin)
    ? cb(null, true)
    : cb(new Error(`CORS: origin ${origin} not allowed`)),
}));
app.use(express.json({ limit: "1mb" }));

// Admin-Token-Middleware: schuetzt destruktive /admin/*-Endpoints. Wenn die
// ADMIN_TOKEN env-Variable leer ist, gilt Dev-Modus (warn + durchlassen).
// In Produktion MUSS sie gesetzt sein und der Client muss sie als
// X-Admin-Token-Header schicken.
if (!ADMIN_TOKEN) {
  console.warn("[server] ADMIN_TOKEN not set — /api/admin/* endpoints are PUBLIC (dev mode).");
}
function requireAdminToken(req, res, next) {
  if (!ADMIN_TOKEN) return next();
  const provided = req.header("X-Admin-Token") || "";
  if (provided !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: "Admin-Token erforderlich oder ungültig" });
  }
  next();
}

const bool = (v) => Boolean(Number(v));
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
const isoDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

function toHalter(r) {
  return {
    halterId: r.halter_id,
    name: r.name,
    telefon: r.telefon,
    email: r.email,
    anschrift: r.anschrift,
    erfasstAm: r.erfasst_am,
  };
}

function toFahrzeug(r) {
  return {
    fahrzeugId: r.fahrzeug_id,
    kennzeichen: r.kennzeichen,
    fin: r.fin,
    hersteller: r.hersteller,
    modell: r.modell,
    baujahr: r.baujahr,
    farbe: r.farbe,
    typ: r.typ,
    kilometerstand: r.kilometerstand,
    huFaellig: r.hu_faellig,
    halterId: r.halter_id,
    erfasstAm: r.erfasst_am,
  };
}

function toTermin(r) {
  return {
    terminId: r.termin_id,
    fahrzeugId: r.fahrzeug_id,
    datum: r.datum,
    uhrzeit: r.uhrzeit,
    prueftCode: r.prueft_code,
    prueferKuerzel: r.pruefer_kuerzel,
    statusCode: r.status_code,
    notiz: r.notiz,
    erfasstAm: r.erfasst_am,
  };
}

function toMangel(r) {
  return {
    mangelId: r.mangel_id,
    terminId: r.termin_id,
    codeStvzo: r.code_stvzo,
    beschreibung: r.beschreibung,
    kategorieCode: r.kategorie_code,
    behoben: bool(r.behoben),
    erfasstAm: r.erfasst_am,
  };
}

async function one(sql, params = []) {
  const rows = await db().query(sql, params);
  return rows[0] ?? null;
}

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
}

// withTransaction(fn): holt eine Connection aus dem Pool, START TRANSACTION,
// fuehrt fn(conn) aus, COMMIT bei Erfolg, ROLLBACK bei Fehler. Garantiert
// All-or-Nothing-Semantik fuer Multi-Step-Writes (Demo-Seed, Mangel-Insert
// mit Demotion, Admin-Reset). Fuchs-relevant: Kapitel 5 TCL.
async function withTransaction(fn) {
  const conn = await db().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (e) {
    try { await conn.rollback(); } catch { /* swallow rollback errors */ }
    throw e;
  } finally {
    conn.release();
  }
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/halter", asyncRoute(async (_req, res) => {
  const rows = await db().query("SELECT * FROM halter ORDER BY name");
  res.json(rows.map(toHalter));
}));

app.post("/api/halter", check(validateHalter), asyncRoute(async (req, res) => {
  const id = req.body.halterId || randomUUID();
  await db().query(
    "INSERT INTO halter (halter_id, name, telefon, email, anschrift) VALUES (?, ?, ?, ?, ?)",
    [id, req.body.name, req.body.telefon ?? null, req.body.email ?? null, req.body.anschrift ?? null],
  );
  res.status(201).json(toHalter(await one("SELECT * FROM halter WHERE halter_id = ?", [id])));
}));

app.patch("/api/halter/:id", check(validateHalter), asyncRoute(async (req, res) => {
  const patch = clean({
    name: req.body.name,
    telefon: req.body.telefon,
    email: req.body.email,
    anschrift: req.body.anschrift,
  });
  const entries = Object.entries(patch);
  if (entries.length) {
    await db().query(
      `UPDATE halter SET ${entries.map(([k]) => `${k} = ?`).join(", ")} WHERE halter_id = ?`,
      [...entries.map(([, v]) => v), req.params.id],
    );
  }
  const row = await one("SELECT * FROM halter WHERE halter_id = ?", [req.params.id]);
  res.json(row ? toHalter(row) : null);
}));

app.delete("/api/halter/:id", asyncRoute(async (req, res) => {
  await db().query("DELETE FROM halter WHERE halter_id = ?", [req.params.id]);
  res.status(204).end();
}));

app.get("/api/fahrzeuge", asyncRoute(async (_req, res) => {
  const rows = await db().query("SELECT * FROM fahrzeug ORDER BY kennzeichen");
  res.json(rows.map(toFahrzeug));
}));

app.post("/api/fahrzeuge", check(validateFahrzeug), asyncRoute(async (req, res) => {
  const id = req.body.fahrzeugId || randomUUID();
  await db().query(
    `INSERT INTO fahrzeug
     (fahrzeug_id, kennzeichen, fin, hersteller, modell, baujahr, farbe, typ, kilometerstand, hu_faellig, halter_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      req.body.kennzeichen,
      req.body.fin ?? null,
      req.body.hersteller,
      req.body.modell,
      req.body.baujahr ?? null,
      req.body.farbe ?? null,
      req.body.typ,
      req.body.kilometerstand ?? null,
      req.body.huFaellig ?? null,
      req.body.halterId,
    ],
  );
  res.status(201).json(toFahrzeug(await one("SELECT * FROM fahrzeug WHERE fahrzeug_id = ?", [id])));
}));

app.patch("/api/fahrzeuge/:id", check(validateFahrzeug), asyncRoute(async (req, res) => {
  const map = {
    kennzeichen: "kennzeichen",
    fin: "fin",
    hersteller: "hersteller",
    modell: "modell",
    baujahr: "baujahr",
    farbe: "farbe",
    typ: "typ",
    kilometerstand: "kilometerstand",
    huFaellig: "hu_faellig",
    halterId: "halter_id",
  };
  const entries = Object.entries(map)
    .filter(([key]) => req.body[key] !== undefined)
    .map(([key, col]) => [col, req.body[key]]);
  if (entries.length) {
    await db().query(
      `UPDATE fahrzeug SET ${entries.map(([col]) => `${col} = ?`).join(", ")} WHERE fahrzeug_id = ?`,
      [...entries.map(([, v]) => v), req.params.id],
    );
  }
  const row = await one("SELECT * FROM fahrzeug WHERE fahrzeug_id = ?", [req.params.id]);
  res.json(row ? toFahrzeug(row) : null);
}));

app.delete("/api/fahrzeuge/:id", asyncRoute(async (req, res) => {
  await db().query("DELETE FROM fahrzeug WHERE fahrzeug_id = ?", [req.params.id]);
  res.status(204).end();
}));

app.get("/api/termine", asyncRoute(async (req, res) => {
  // Optionaler Zeitraum-Filter: ?from=YYYY-MM-DD&to=YYYY-MM-DD
  // Skalierungs-Vorbereitung: bei vielen tausend Terminen lohnt sich der
  // Pull "letzte 7 Tage + naechste 30 Tage" statt "alles". Ohne Parameter
  // liefert der Endpoint weiterhin die volle Liste — kompatibel zum
  // aktuellen Frontend, das BerichteView und StatistikView mit der
  // Komplett-Historie versorgt.
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const from = typeof req.query.from === "string" && dateRe.test(req.query.from) ? req.query.from : null;
  const to   = typeof req.query.to   === "string" && dateRe.test(req.query.to)   ? req.query.to   : null;
  let sql = "SELECT * FROM termin";
  const params = [];
  if (from && to) {
    sql += " WHERE datum BETWEEN ? AND ?";
    params.push(from, to);
  } else if (from) {
    sql += " WHERE datum >= ?";
    params.push(from);
  } else if (to) {
    sql += " WHERE datum <= ?";
    params.push(to);
  }
  sql += " ORDER BY datum DESC, uhrzeit ASC";
  const rows = await db().query(sql, params);
  const termine = rows.map(toTermin);

  // N+1-Fix: ?include=maengel laedt die Mangel-Liste pro Termin in einem
  // zusaetzlichen SQL (statt einem Roundtrip pro Termin). Bei 13 Termine =
  // 2 SQL-Queries statt 14 HTTP-Calls. Gruppierung erfolgt im Memory-Map.
  if (req.query.include === "maengel") {
    const allMaengel = await db().query(
      "SELECT * FROM mangel ORDER BY termin_id, erfasst_am",
    );
    const byTermin = new Map();
    for (const m of allMaengel) {
      const arr = byTermin.get(m.termin_id);
      if (arr) arr.push(toMangel(m));
      else byTermin.set(m.termin_id, [toMangel(m)]);
    }
    return res.json(
      termine.map((t) => ({ ...t, maengel: byTermin.get(t.terminId) || [] })),
    );
  }

  res.json(termine);
}));

app.post("/api/termine", check(validateTermin), asyncRoute(async (req, res) => {
  const id = req.body.terminId || randomUUID();
  await db().query(
    `INSERT INTO termin
     (termin_id, fahrzeug_id, datum, uhrzeit, prueft_code, pruefer_kuerzel, status_code, notiz)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      req.body.fahrzeugId,
      req.body.datum,
      req.body.uhrzeit ?? null,
      req.body.prueftCode,
      req.body.prueferKuerzel ?? null,
      req.body.statusCode ?? "Geplant",
      req.body.notiz ?? null,
    ],
  );
  res.status(201).json(toTermin(await one("SELECT * FROM termin WHERE termin_id = ?", [id])));
}));

app.patch("/api/termine/:id", check(validateTermin), asyncRoute(async (req, res) => {
  const map = {
    fahrzeugId: "fahrzeug_id",
    datum: "datum",
    uhrzeit: "uhrzeit",
    prueftCode: "prueft_code",
    prueferKuerzel: "pruefer_kuerzel",
    statusCode: "status_code",
    notiz: "notiz",
  };
  const entries = Object.entries(map)
    .filter(([key]) => req.body[key] !== undefined)
    .map(([key, col]) => [col, req.body[key]]);
  if (entries.length) {
    await db().query(
      `UPDATE termin SET ${entries.map(([col]) => `${col} = ?`).join(", ")} WHERE termin_id = ?`,
      [...entries.map(([, v]) => v), req.params.id],
    );
  }
  const row = await one("SELECT * FROM termin WHERE termin_id = ?", [req.params.id]);
  res.json(row ? toTermin(row) : null);
}));

app.patch("/api/termine/:id/status", check(validateStatusUpdate), asyncRoute(async (req, res) => {
  const neuerStatus = req.body.statusCode;
  if (neuerStatus === "Bestanden") {
    const blocker = await one(
      `SELECT COUNT(*) AS count
       FROM mangel m
       JOIN mangel_kategorie mk ON mk.kategorie_code = m.kategorie_code
       WHERE m.termin_id = ?
         AND mk.blockiert_bestanden = TRUE
         AND m.behoben = FALSE`,
      [req.params.id],
    );
    if (Number(blocker?.count ?? 0) > 0) {
      res.json({ ok: false, reason: "BESTANDEN nicht möglich bei erheblichem oder gefährlichem Mangel (§29 StVZO)" });
      return;
    }
  }

  await db().query("UPDATE termin SET status_code = ? WHERE termin_id = ?", [neuerStatus, req.params.id]);
  const row = await one("SELECT * FROM termin WHERE termin_id = ?", [req.params.id]);
  res.json({ ok: true, termin: toTermin(row) });
}));

app.delete("/api/termine/:id", asyncRoute(async (req, res) => {
  await db().query("DELETE FROM termin WHERE termin_id = ?", [req.params.id]);
  res.status(204).end();
}));

app.get("/api/termine/:id/maengel", asyncRoute(async (req, res) => {
  const rows = await db().query("SELECT * FROM mangel WHERE termin_id = ?", [req.params.id]);
  res.json(rows.map(toMangel));
}));

app.post("/api/maengel", check(validateMangel), asyncRoute(async (req, res) => {
  const id = req.body.mangelId || randomUUID();
  const istBehoben = Boolean(req.body.behoben);

  // Transaktion: Mangel-INSERT und ggf. Termin-Demotion sind logisch
  // atomar. Wenn die Demotion fehlschlaegt, soll der Mangel auch nicht
  // gespeichert werden — sonst haette der Termin den blockierenden Mangel
  // aber noch Status 'Bestanden' (Inkonsistenz).
  const { mangel, terminDemoted } = await withTransaction(async (conn) => {
    await conn.query(
      `INSERT INTO mangel (mangel_id, termin_id, code_stvzo, beschreibung, kategorie_code, behoben)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.body.terminId,
        req.body.codeStvzo ?? null,
        req.body.beschreibung,
        req.body.kategorieCode,
        req.body.behoben ?? false,
      ],
    );

    let demoted = false;
    const katRows = await conn.query(
      "SELECT blockiert_bestanden FROM mangel_kategorie WHERE kategorie_code = ?",
      [req.body.kategorieCode],
    );
    const kat = katRows[0] ?? null;
    if (!istBehoben && bool(kat?.blockiert_bestanden)) {
      const tRows = await conn.query(
        "SELECT status_code FROM termin WHERE termin_id = ?",
        [req.body.terminId],
      );
      const t = tRows[0] ?? null;
      if (t?.status_code === "Bestanden") {
        await conn.query(
          "UPDATE termin SET status_code = 'Nicht bestanden' WHERE termin_id = ?",
          [req.body.terminId],
        );
        demoted = true;
      }
    }

    const mangelRows = await conn.query(
      "SELECT * FROM mangel WHERE mangel_id = ?",
      [id],
    );
    return { mangel: toMangel(mangelRows[0]), terminDemoted: demoted };
  });

  res.status(201).json({ mangel, terminDemoted });
}));

app.delete("/api/maengel/:id", asyncRoute(async (req, res) => {
  await db().query("DELETE FROM mangel WHERE mangel_id = ?", [req.params.id]);
  res.status(204).end();
}));

app.get("/api/count/fahrzeuge", asyncRoute(async (_req, res) => {
  const row = await one("SELECT COUNT(*) AS count FROM fahrzeug");
  res.json({ count: Number(row?.count ?? 0) });
}));

app.post("/api/admin/reset", requireAdminToken, asyncRoute(async (_req, res) => {
  // Transaktion: alle vier DELETEs sind logisch atomar. Wenn z.B. der
  // halter-DELETE wegen FK-RESTRICT fehlschlaegt (sollte nicht passieren
  // weil mangel/termin/fahrzeug schon weg sind), bleibt nichts halb
  // geloescht.
  await withTransaction(async (conn) => {
    await conn.query("DELETE FROM mangel");
    await conn.query("DELETE FROM termin");
    await conn.query("DELETE FROM fahrzeug");
    await conn.query("DELETE FROM halter");
  });
  res.json({ ok: true });
}));

async function seedFullDemoData() {
  // Transaktion: alle Loeschungen und alle Inserts sollen all-or-nothing
  // sein. Wenn z.B. der mangel-INSERT auf einer FK-Verletzung scheitert,
  // soll die DB im vorherigen Stand bleiben, nicht halb-leer.
  return withTransaction(async (conn) => {
    await conn.query("DELETE FROM mangel");
    await conn.query("DELETE FROM termin");
    await conn.query("DELETE FROM fahrzeug");
    await conn.query("DELETE FROM halter");

    const halterIds = Array.from({ length: 8 }, () => randomUUID());
    const fahrzeugIds = Array.from({ length: 8 }, () => randomUUID());
    const terminIds = Array.from({ length: 13 }, () => randomUUID());
    const today = isoDate();

    await conn.batch(
      "INSERT INTO halter (halter_id, name, telefon, email) VALUES (?, ?, ?, ?)",
      [
        [halterIds[0], "Klaus Müller", "0176 1234567", "k.mueller@mail.de"],
        [halterIds[1], "Sabine Koch", "0178 9876543", "s.koch@web.de"],
        [halterIds[2], "Bau GmbH Lehmann", "089 55443322", "info@lehmann-bau.de"],
        [halterIds[3], "Tarek Osman", "0171 4445566", "t.osman@gmail.com"],
        [halterIds[4], "Anna Richter", "0162 7778899", "a.richter@outlook.de"],
        [halterIds[5], "Kurierdienst Schnell GmbH", "0211 3344556", "fuhrpark@schnell-gmbh.de"],
        [halterIds[6], "Dr. Julia Vogel", "069 77889900", "j.vogel@kanzlei-vogel.de"],
        [halterIds[7], "Malerbetrieb Heinz Schreiber", "0561 123456", "schreiber-maler@t-online.de"],
      ],
    );

    await conn.batch(
      `INSERT INTO fahrzeug
       (fahrzeug_id, kennzeichen, fin, hersteller, modell, baujahr, farbe, typ, kilometerstand, hu_faellig, halter_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        [fahrzeugIds[0], "B-TK 1234", "WBA3A5C50CF256985", "BMW", "320d xDrive", 2018, "Sophistograu", "PKW", 87420, isoDate(180), halterIds[0]],
        [fahrzeugIds[1], "HH-AB 5678", "WVWZZZ1KZ5W315264", "Volkswagen", "Golf VIII GTI", 2021, "Schwarzsilber", "PKW", 42100, isoDate(540), halterIds[1]],
        [fahrzeugIds[2], "M-XZ 9900", "3FADP4BJ1EM198765", "Ford", "Transit L3H2 2.0 TDCi", 2016, "Arktikweiß", "Transporter", 196300, isoDate(30), halterIds[2]],
        [fahrzeugIds[3], "S-LM 2233", "ZFA31200001234567", "Fiat", "Ducato 35 Maxi", 2015, "Polarweiß", "Transporter", 234000, isoDate(-14), halterIds[3]],
        [fahrzeugIds[4], "K-RP 4411", "WMWRC31060TJ32154", "MINI", "Cooper S Clubman", 2022, "Moonwalk Grey", "PKW", 18900, isoDate(720), halterIds[4]],
        [fahrzeugIds[5], "D-EF 7712", "WDD2052281A123456", "Mercedes-Benz", "Sprinter 316 CDI", 2019, "Arktikweiß", "Transporter", 141000, isoDate(60), halterIds[5]],
        [fahrzeugIds[6], "F-ML 3390", "WBAVD13500KX12345", "BMW", "iX3 M Sport", 2023, "Mineralweiß", "BEV", 22400, isoDate(900), halterIds[6]],
        [fahrzeugIds[7], "KS-TF 1100", "VF7RHN9HPEJ123456", "Citroën", "Berlingo M 1.5 BlueHDi", 2017, "Perla Nera", "Transporter", 178000, isoDate(-2), halterIds[7]],
      ],
    );

    await conn.batch(
      `INSERT INTO termin
       (termin_id, fahrzeug_id, datum, uhrzeit, prueft_code, pruefer_kuerzel, status_code, notiz)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        [terminIds[0], fahrzeugIds[0], today, "08:00:00", "HU_AU", "MW", "Bestanden", "Fahrzeug in sehr gutem Zustand. Geringer Mangel an Bremsflüssigkeit notiert."],
        [terminIds[1], fahrzeugIds[1], today, "09:00:00", "HU", "AF", "In Prüfung", null],
        [terminIds[2], fahrzeugIds[2], today, "10:30:00", "HU_AU", "SK", "Nicht bestanden", "Fahrzeug nicht verkehrssicher. Hauptmängel an Bremsen und Reifen."],
        [terminIds[3], fahrzeugIds[3], today, "13:00:00", "NP", "MW", "Geplant", "Nachprüfung nach HU vom 15.06."],
        [terminIds[4], fahrzeugIds[4], today, "14:30:00", "HU", "LN", "Geplant", null],
        [terminIds[5], fahrzeugIds[5], today, "15:00:00", "SP", "TB", "Geplant", "Regelmäßige SP für Gewerbebetrieb"],
        [terminIds[6], fahrzeugIds[6], today, "16:00:00", "HU_AU", "AF", "Geplant", "Erstprüfung BEV - OBD-Diagnose einplanen."],
        [terminIds[7], fahrzeugIds[1], isoDate(-1), "09:30:00", "AU", "TB", "Bestanden", null],
        [terminIds[8], fahrzeugIds[0], isoDate(1), "08:30:00", "HU", "MW", "Geplant", null],
        [terminIds[9], fahrzeugIds[7], today, "11:00:00", "HU_AU", "SK", "Nachprüfung", "Erhebliche Mängel. Nachprüfung in 4 Wochen empfohlen."],
        [terminIds[10], fahrzeugIds[2], isoDate(-1), "14:00:00", "Abnahme", "AF", "Bestanden", null],
        [terminIds[11], fahrzeugIds[5], isoDate(-2), "10:00:00", "HU_AU", "MW", "Bestanden", null],
        [terminIds[12], fahrzeugIds[3], isoDate(-2), "13:30:00", "HU", "LN", "Nicht bestanden", null],
      ],
    );

    await conn.batch(
      `INSERT INTO mangel (mangel_id, termin_id, code_stvzo, beschreibung, kategorie_code, behoben)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        [randomUUID(), terminIds[0], "2.5.1", "Bremsflüssigkeit: Wasseranteil zu hoch (> 3,5%)", "GM", false],
        [randomUUID(), terminIds[2], "2.1.1", "Betriebsbremse: Ungleichmäßige Bremswirkung", "EM", false],
        [randomUUID(), terminIds[2], "4.1.1", "Profiltiefe: Profiltiefe unter 1,6 mm", "EM", false],
        [randomUUID(), terminIds[2], "3.3.1", "Bremslicht: Bremslicht links defekt", "EM", false],
        [randomUUID(), terminIds[2], "2.3.1", "Bremsscheibe: Bremsscheibe stark verschlissen", "EM", false],
        [randomUUID(), terminIds[2], "5.6.2", "Kennzeichen: Hinteres Kennzeichen unleserlich", "EM", false],
        [randomUUID(), terminIds[9], "8.1.1", "Stoßdämpfer: Stoßdämpfer vorne defekt", "EM", false],
        [randomUUID(), terminIds[9], "4.1.2", "Profiltiefe: 1,6-3 mm (Empfehlung: wechseln)", "EM", false],
        [randomUUID(), terminIds[9], "3.5.3", "Blinker: Fahrtrichtungsanzeiger hinten links defekt", "EM", false],
        [randomUUID(), terminIds[10], "5.2.1", "Karosserie: Scharfe Kanten durch Unfallschaden", "EM", true],
        [randomUUID(), terminIds[12], "5.3.1", "Motorhaube: Motorhaube öffnet sich während Fahrt", "GfM", false],
        [randomUUID(), terminIds[12], "2.6.1", "Feststellbremse: Feststellbremse hält nicht ausreichend", "EM", false],
      ],
    );

    return { ok: true, halter: 8, fahrzeuge: 8, termine: 13, maengel: 12 };
  });
}

app.post("/api/admin/demo", requireAdminToken, asyncRoute(async (_req, res) => {
  res.json(await seedFullDemoData());
}));
// ── Statisches Frontend (Single-Container-Deployment) ────────────────
// In Produktion liefert Express das geba ute React-Frontend aus `dist/`
// gleich mit aus — keine separate Nginx-/Vite-Instanz nötig. Wenn
// `dist/` fehlt (z. B. im Dev-Modus ohne `npm run build`), bleibt nur
// die /api-Schnittstelle. SPA-Routing: jede nicht-/api-URL fällt auf
// `index.html` zurück, damit der Browser den React-Router clientseitig
// auflösen kann.
const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const distPath = resolve(__dirname, "..", "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });
  console.log(`[server] serving frontend from ${distPath}`);
} else {
  console.log(`[server] no dist/ found, running /api only (frontend via Vite dev server)`);
}

app.use((err, _req, res, _next) => {
  if (err && err.sqlState === "45000") {
    return res.status(422).json({ ok: false, reason: err.text || err.message });
  }
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

await ensureDatabase();
app.listen(port, () => {
  console.log(`TUV workflow API listening on http://127.0.0.1:${port}`);
});
