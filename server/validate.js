// Server-seitige Validation pro Endpunkt. Liefert Liste von Fehlern als
// {field, message}. Wenn die Liste leer ist, ist die Eingabe sauber.
// Verzichtet bewusst auf zod/joi — der Aufwand ist klein, und der Lehrwert
// fuer die Abgabe ist die explizite Beschreibung der Regeln.
//
// Begruendung statt Frontend-Validation: das Frontend kann umgangen werden
// (direkter API-Call via curl, Adminer, anderer Client). Die DB-Constraints
// schuetzen Integritaet , aber liefern HTTP 500 mit SQL-Errors statt sauberer
// 4xx-Antworten. Dieses Modul liegt dazwischen.

const STATUS_VALUES = new Set([
  "Geplant", "In Prüfung", "Bestanden", "Nicht bestanden",
  "Nachprüfung", "Nicht erschienen", "Abgebrochen",
]);
const PRUEFART_VALUES = new Set([
  "HU", "AU", "HU_AU", "NP", "§21", "§19", "SP",
  "Saison", "GAS", "Abnahme", "OBD", "Licht",
]);
const KATEGORIE_VALUES = new Set(["OM", "GM", "EM", "GfM"]);
const FAHRZEUG_TYP_VALUES = new Set([
  "PKW", "LKW", "Transporter", "Motorrad", "BEV",
  "Wohnmobil", "Anhänger", "Bus", "Quad", "Trike",
  "Land/Forst", "Sondertransport", "Sonstiges",
]);
const PRUEFER_VALUES = new Set(["MW", "AF", "SK", "TB", "LN"]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const FIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// IDs (PK und FK) sind ueberall UUIDs (crypto.randomUUID, server- oder
// client-seitig fuer Optimistic Updates). Clients duerfen eigene IDs
// mitschicken, aber nur in diesem Format — sonst waeren beliebige Strings
// als Primary Key moeglich.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isString(v) { return typeof v === "string"; }
function isNonEmpty(v) { return isString(v) && v.trim().length > 0; }

// Prueft ein optionales oder Pflicht-ID-Feld auf UUID-Format (nur wenn es
// gesetzt ist — Pflichtfeld-Checks passieren separat).
function checkUuid(errs, body, field) {
  if (body[field] != null && body[field] !== "" && !UUID_RE.test(body[field])) {
    errs.push({ field, message: "Ungültiges ID-Format (UUID erwartet)" });
  }
}

// ── Validatoren pro Endpoint ──────────────────────────────────────────

export function validateHalter(body, { partial = false } = {}) {
  const errs = [];
  if (!partial || "name" in body) {
    if (!isNonEmpty(body.name)) errs.push({ field: "name", message: "Pflichtfeld" });
  }
  if (body.email != null && body.email !== "" && !EMAIL_RE.test(body.email)) {
    errs.push({ field: "email", message: "Ungültiges E-Mail-Format" });
  }
  checkUuid(errs, body, "halterId");
  return errs;
}

export function validateFahrzeug(body, { partial = false } = {}) {
  const errs = [];
  if (!partial || "kennzeichen" in body) {
    if (!isNonEmpty(body.kennzeichen)) errs.push({ field: "kennzeichen", message: "Pflichtfeld" });
  }
  if (!partial || "hersteller" in body) {
    if (!isNonEmpty(body.hersteller)) errs.push({ field: "hersteller", message: "Pflichtfeld" });
  }
  if (!partial || "modell" in body) {
    if (!isNonEmpty(body.modell)) errs.push({ field: "modell", message: "Pflichtfeld" });
  }
  if (!partial || "typ" in body) {
    if (!isNonEmpty(body.typ)) errs.push({ field: "typ", message: "Pflichtfeld" });
    else if (!FAHRZEUG_TYP_VALUES.has(body.typ)) {
      errs.push({ field: "typ", message: `Unbekannter Fahrzeugtyp '${body.typ}'` });
    }
  }
  if (!partial || "halterId" in body) {
    if (!isNonEmpty(body.halterId)) errs.push({ field: "halterId", message: "Pflichtfeld" });
  }
  if (body.fin != null && body.fin !== "" && !FIN_RE.test(body.fin)) {
    errs.push({ field: "fin", message: "FIN muss 17 Zeichen lang sein (ohne I, O, Q)" });
  }
  if (body.baujahr != null) {
    const y = Number(body.baujahr);
    if (!Number.isFinite(y) || y < 1885 || y > new Date().getFullYear() + 1) {
      errs.push({ field: "baujahr", message: "Baujahr unplausibel (1885 .. nächstes Jahr)" });
    }
  }
  if (body.kilometerstand != null) {
    const k = Number(body.kilometerstand);
    if (!Number.isFinite(k) || k < 0 || k > 3_000_000) {
      errs.push({ field: "kilometerstand", message: "Kilometerstand nicht negativ und unter 3.000.000" });
    }
  }
  if (body.huFaellig != null && body.huFaellig !== "" && !DATE_RE.test(body.huFaellig)) {
    errs.push({ field: "huFaellig", message: "Datum im Format YYYY-MM-DD erwartet" });
  }
  checkUuid(errs, body, "fahrzeugId");
  checkUuid(errs, body, "halterId");
  return errs;
}

export function validateTermin(body, { partial = false } = {}) {
  const errs = [];
  if (!partial || "fahrzeugId" in body) {
    if (!isNonEmpty(body.fahrzeugId)) errs.push({ field: "fahrzeugId", message: "Pflichtfeld" });
  }
  if (!partial || "datum" in body) {
    if (!isNonEmpty(body.datum)) errs.push({ field: "datum", message: "Pflichtfeld" });
    else if (!DATE_RE.test(body.datum)) errs.push({ field: "datum", message: "Format YYYY-MM-DD erwartet" });
  }
  if (body.uhrzeit != null && body.uhrzeit !== "" && !TIME_RE.test(body.uhrzeit)) {
    errs.push({ field: "uhrzeit", message: "Format HH:MM oder HH:MM:SS erwartet" });
  }
  if (!partial || "prueftCode" in body) {
    if (!isNonEmpty(body.prueftCode)) errs.push({ field: "prueftCode", message: "Pflichtfeld" });
    else if (!PRUEFART_VALUES.has(body.prueftCode)) {
      errs.push({ field: "prueftCode", message: `Unbekannte Prüfart '${body.prueftCode}'` });
    }
  }
  if (body.prueferKuerzel != null && body.prueferKuerzel !== "" && !PRUEFER_VALUES.has(body.prueferKuerzel)) {
    errs.push({ field: "prueferKuerzel", message: `Unbekanntes Prüfer-Kürzel '${body.prueferKuerzel}'` });
  }
  if (body.statusCode != null && !STATUS_VALUES.has(body.statusCode)) {
    errs.push({ field: "statusCode", message: `Unbekannter Status '${body.statusCode}'` });
  }
  checkUuid(errs, body, "terminId");
  checkUuid(errs, body, "fahrzeugId");
  return errs;
}

// ── Termin-Endpunkte: statusCode ist hier kein normales Feld ──────────
// Der Status eines Termins wird ausschliesslich ueber
// PATCH /api/termine/:id/status gesetzt. Nur dort greift
// requireAuth("status") (Rolle pruefer/chef) und nur dort sitzt der
// WF-01-Guard mit fachlicher Begruendung.
//
// Wuerden POST/PATCH /api/termine statusCode mitschreiben, koennte die
// Rolle empfang mit reinem Schreibrecht Pruefergebnisse aendern — die
// Rechte-Matrix in auth.js waere dann nur auf dem Papier durchgesetzt.
// Deshalb wird ein mitgeschicktes Feld ABGELEHNT statt still ignoriert:
// ein Client soll nicht glauben, der Status sei uebernommen worden.
const STATUS_ROUTE_HINWEIS =
  "Status wird ausschliesslich über PATCH /api/termine/:id/status gesetzt (Recht: statusSetzen)";

// Ersetzt eine evtl. schon vorhandene statusCode-Meldung, damit pro Feld
// genau eine Fehlermeldung zurueckkommt.
function mitStatusFehler(errs, message) {
  return [...errs.filter((e) => e.field !== "statusCode"), { field: "statusCode", message }];
}

// POST /api/termine — neue Termine starten immer als 'Geplant'.
// Ein mitgeschicktes statusCode: 'Geplant' ist ein No-op und bleibt
// erlaubt (das Frontend sendet das Feld mit); jeder andere Wert ist ein
// Fehler.
export function validateTerminAnlage(body, opts = {}) {
  const errs = validateTermin(body, opts);
  if (body.statusCode == null || body.statusCode === "Geplant") return errs;
  return mitStatusFehler(errs, `Neue Termine starten immer als 'Geplant'. ${STATUS_ROUTE_HINWEIS}`);
}

// PATCH /api/termine/:id — statusCode ist hier ueberhaupt kein Feld.
export function validateTerminAenderung(body, opts = {}) {
  const errs = validateTermin(body, opts);
  if (body.statusCode === undefined) return errs;
  return mitStatusFehler(errs, STATUS_ROUTE_HINWEIS);
}

export function validateStatusUpdate(body) {
  const errs = [];
  if (!isNonEmpty(body.statusCode)) {
    errs.push({ field: "statusCode", message: "Pflichtfeld" });
  } else if (!STATUS_VALUES.has(body.statusCode)) {
    errs.push({ field: "statusCode", message: `Unbekannter Status '${body.statusCode}'` });
  }
  return errs;
}

export function validateMangel(body) {
  const errs = [];
  if (!isNonEmpty(body.terminId)) errs.push({ field: "terminId", message: "Pflichtfeld" });
  if (!isNonEmpty(body.beschreibung)) errs.push({ field: "beschreibung", message: "Pflichtfeld" });
  if (!isNonEmpty(body.kategorieCode)) {
    errs.push({ field: "kategorieCode", message: "Pflichtfeld" });
  } else if (!KATEGORIE_VALUES.has(body.kategorieCode)) {
    errs.push({ field: "kategorieCode", message: `Unbekannte Kategorie '${body.kategorieCode}' (erwartet: OM/GM/EM/GfM)` });
  }
  if (body.behoben != null && typeof body.behoben !== "boolean") {
    errs.push({ field: "behoben", message: "Boolean erwartet (true/false)" });
  }
  checkUuid(errs, body, "mangelId");
  checkUuid(errs, body, "terminId");
  return errs;
}

// Middleware-Helfer: liefert 400 mit Fehler-Liste, oder ruft next() auf.
export function check(validatorFn) {
  return (req, res, next) => {
    const errs = validatorFn(req.body || {}, req.method === "PATCH" ? { partial: true } : {});
    if (errs.length > 0) {
      return res.status(400).json({ ok: false, errors: errs });
    }
    next();
  };
}
