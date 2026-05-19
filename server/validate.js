// Server-seitige Validation pro Endpunkt. Liefert Liste von Fehlern als
// {field, message}. Wenn die Liste leer ist, ist die Eingabe sauber.
// Verzichtet bewusst auf zod/joi — der Aufwand ist klein, und der Lehrwert
// fuer die Abgabe ist die explizite Beschreibung der Regeln.
//
// Begruendung statt Frontend-Validation: das Frontend kann umgangen werden
// (direkter API-Call via curl, Adminer, anderer Client). Die DB-Constraints
// schuetzen Integritaet, aber liefern HTTP 500 mit SQL-Errors statt sauberer
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
const KENNZEICHEN_RE = /^[A-ZÄÖÜ]{1,3}[- ][A-Z]{1,2} \d{1,4}( H| E)?(\s\d{2}-\d{2})?$/;
const FIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isString(v) { return typeof v === "string"; }
function isNonEmpty(v) { return isString(v) && v.trim().length > 0; }
function isInt(v) { return typeof v === "number" && Number.isInteger(v); }

// ── Validatoren pro Endpoint ──────────────────────────────────────────

export function validateHalter(body, { partial = false } = {}) {
  const errs = [];
  if (!partial || "name" in body) {
    if (!isNonEmpty(body.name)) errs.push({ field: "name", message: "Pflichtfeld" });
  }
  if (body.email != null && body.email !== "" && !EMAIL_RE.test(body.email)) {
    errs.push({ field: "email", message: "Ungültiges E-Mail-Format" });
  }
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
  return errs;
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
