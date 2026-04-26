/**
 * Validatoren für Fahrzeug- und Termindaten.
 *
 * Zwei-Ebenen-Konzept:
 *  - Hard-Validatoren geben bei Fehler einen String (Fehlertext) zurück,
 *    sonst null. Sie BLOCKEN das Speichern.
 *  - Soft-Validatoren (`check*`) geben { warning: string } zurück oder null.
 *    Sie zeigen nur eine Warnung, blocken aber nicht — das akzeptiert auch
 *    Sonderfälle wie Oldtimer, seltene Importe, Tuning-Hersteller.
 *
 * Alle Eingaben sind defensiv behandelt (null/undefined/Strings mit Whitespace).
 */

import { FAHRZEUG_TYPEN } from "../constants/fahrzeug";
import { HERSTELLER_REFERENZ, normalizeHersteller } from "../constants/kfzReferenz";
import { STATUS } from "../constants/status";

const KENNZEICHEN_REGEX = /^[A-ZÄÖÜ]{1,3}[-\s][A-Z]{1,2}\s?\d{1,4}[HE]?$/i;
const FIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;
const TELEFON_REGEX = /^[+()\d\s\-/]{5,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const KM_STAND_MAX = 3_000_000;
export const BAUJAHR_MIN = 1885;

/* ═══════════════════════════════════════════════════════════════════
   HARD-VALIDATOREN — Rückgabe: String (Fehlertext) oder null
   ═══════════════════════════════════════════════════════════════════ */

export function validateKennzeichen(raw) {
  const v = (raw || "").trim();
  if (!v) return "Pflichtfeld";
  if (!KENNZEICHEN_REGEX.test(v)) return "Ungültiges Format (z. B. B-TK 1234)";
  return null;
}

export function validateKennzeichenUnique(raw, fahrzeuge = [], excludeId = null) {
  const v = (raw || "").trim().toUpperCase().replace(/\s+/g, " ");
  if (!v) return null;
  const duplicate = fahrzeuge.some(f =>
    f.id !== excludeId &&
    (f.kennzeichen || "").trim().toUpperCase().replace(/\s+/g, " ") === v
  );
  return duplicate ? "Kennzeichen bereits vergeben" : null;
}

export function validateFin(raw) {
  const v = (raw || "").trim();
  if (!v) return null;
  if (v.length !== 17) return "FIN muss 17 Zeichen haben";
  if (!FIN_REGEX.test(v)) return "FIN enthält ungültige Zeichen (I, O, Q nicht erlaubt)";
  return null;
}

export function validateBaujahr(raw) {
  if (raw === "" || raw === null || raw === undefined) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return "Ungültiges Jahr";
  const max = new Date().getFullYear() + 1;
  if (n < BAUJAHR_MIN || n > max) return `Baujahr muss zwischen ${BAUJAHR_MIN} und ${max} liegen`;
  return null;
}

export function validateKmStand(raw) {
  if (raw === "" || raw === null || raw === undefined) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return "Ungültige Zahl";
  if (n < 0) return "Kilometerstand darf nicht negativ sein";
  if (!Number.isInteger(n)) return "Kilometerstand muss eine ganze Zahl sein";
  if (n > KM_STAND_MAX) return `Kilometerstand überschreitet Plausibilitätsgrenze (${KM_STAND_MAX.toLocaleString("de-DE")} km)`;
  return null;
}

export function validateTelefon(raw) {
  const v = (raw || "").trim();
  if (!v) return null;
  if (/[A-Za-z]/.test(v)) return "Telefonnummer darf keine Buchstaben enthalten";
  if (!TELEFON_REGEX.test(v)) return "Ungültiges Telefonformat";
  const digits = v.replace(/\D/g, "");
  if (digits.length < 5) return "Telefonnummer zu kurz";
  return null;
}

export function validateEmail(raw) {
  const v = (raw || "").trim();
  if (!v) return null;
  if (!EMAIL_REGEX.test(v)) return "Ungültiges E-Mail-Format";
  return null;
}

export function validateFahrzeugtyp(raw) {
  const v = (raw || "").trim();
  if (!v) return "Pflichtfeld";
  if (!FAHRZEUG_TYPEN.some(t => t.id === v)) return "Unbekannter Fahrzeugtyp";
  return null;
}

export function validateHuDatum(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "Ungültiges Datum";
  return null;
}

/* ═══════════════════════════════════════════════════════════════════
   KOMBINIERTE FAHRZEUG-VALIDIERUNG
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Validiert alle Pflichtfelder und Formate eines Fahrzeug-Formulars.
 * Gibt ein Objekt { feldname: "Fehlertext" } zurück (leer = alles ok).
 */
export function validateFahrzeug(form, allFahrzeuge = [], editId = null) {
  const errors = {};

  const eKennzeichen = validateKennzeichen(form.kennzeichen);
  if (eKennzeichen) errors.kennzeichen = eKennzeichen;
  else {
    const eUnique = validateKennzeichenUnique(form.kennzeichen, allFahrzeuge, editId);
    if (eUnique) errors.kennzeichen = eUnique;
  }

  if (!form.hersteller?.trim()) errors.hersteller = "Pflichtfeld";
  if (!form.modell?.trim()) errors.modell = "Pflichtfeld";
  if (!form.besitzer?.trim()) errors.besitzer = "Pflichtfeld";

  const eTyp = validateFahrzeugtyp(form.typ);
  if (eTyp) errors.typ = eTyp;

  const eBj = validateBaujahr(form.baujahr);
  if (eBj) errors.baujahr = eBj;

  const eFin = validateFin(form.fin);
  if (eFin) errors.fin = eFin;

  const eKm = validateKmStand(form.kmStand);
  if (eKm) errors.kmStand = eKm;

  const eTel = validateTelefon(form.telefon);
  if (eTel) errors.telefon = eTel;

  const eMail = validateEmail(form.email);
  if (eMail) errors.email = eMail;

  const eHu = validateHuDatum(form.hu_faellig);
  if (eHu) errors.hu_faellig = eHu;

  return errors;
}

/* ═══════════════════════════════════════════════════════════════════
   SOFT-VALIDATOREN — Warnungen statt Fehler (blocken nicht)
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Prüft, ob Hersteller+Modell+Typ zusammenpassen.
 *  - Hersteller unbekannt → kein Warnung (könnte Oldtimer / Import sein)
 *  - Hersteller bekannt, Typ nicht im Portfolio → Warnung
 *  - Hersteller bekannt, Modell nicht in Referenzliste → Warnung
 */
export function checkHerstellerModellKonsistenz(hersteller, modell, typ) {
  const ref = HERSTELLER_REFERENZ[normalizeHersteller(hersteller)];
  if (!ref) return null;

  const warnings = [];

  if (typ && !ref.typen.includes(typ)) {
    warnings.push(`${ref.display} baut üblicherweise keine Fahrzeuge vom Typ "${typ}"`);
  }

  const modellTrim = (modell || "").trim();
  if (modellTrim) {
    const modellLow = modellTrim.toLowerCase();
    const passt = ref.modelle.some(m => modellLow.includes(m.toLowerCase()));
    if (!passt) {
      warnings.push(`"${modellTrim}" ist kein bekanntes ${ref.display}-Modell — bitte prüfen`);
    }
  }

  return warnings.length ? { warning: warnings.join(". ") } : null;
}

/**
 * Soft-Validator für die FIN-Prüfziffer nach ISO 3779 / FMVSS 115.
 * Position 9 einer FIN ist eine Prüfziffer, berechnet aus den anderen 16 Stellen.
 * Bewusst weich: Die Prüfziffer ist faktisch nur für Nordamerika-Markt-Fahrzeuge
 * ab 1981 verpflichtend. Europäische/japanische FINs vor 2010 erfüllen sie oft
 * nicht — Hard-Block würde Importe und Oldtimer fälschlich abweisen.
 */
const VIN_VALUES = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,
  J:1,K:2,L:3,M:4,N:5,
  P:7,R:9,
  S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9,
  "0":0,"1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,
};
const VIN_WEIGHTS = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];

export function checkFinPruefziffer(raw) {
  const v = (raw || "").trim().toUpperCase();
  if (v.length !== 17 || !FIN_REGEX.test(v)) return null;
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += VIN_VALUES[v[i]] * VIN_WEIGHTS[i];
  }
  const remainder = sum % 11;
  const expected = remainder === 10 ? "X" : String(remainder);
  if (v[8] === expected) return null;
  return { warning: `FIN-Prüfziffer (Position 9) ist "${v[8]}", erwartet "${expected}" — möglicher Tippfehler oder Nicht-Nordamerika-Fahrzeug` };
}

/* ═══════════════════════════════════════════════════════════════════
   TERMIN / PRÜFUNG-WORKFLOW
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Prüft, ob der gewünschte Ziel-Status bei gegebener Mängel-Liste zulässig ist.
 * Rechtsgrundlage: HU nach § 29 StVZO — bei Hauptmängeln (HM) oder gefährlichen
 * Mängeln (GM-Key / GF-Anzeige) kann die Prüfung nicht bestanden werden.
 *
 * Rückgabe: Fehlertext (String) bei Blockade, sonst null.
 */
export function validateStatusWechsel(zielStatus, maengel = []) {
  if (zielStatus !== STATUS.BESTANDEN) return null;
  const hasHm = maengel.some(m => m.kat === "HM" || m.kat === "GM");
  if (hasHm) {
    return "Bestanden nicht möglich — Hauptmangel oder gefährlicher Mangel vorhanden";
  }
  return null;
}
