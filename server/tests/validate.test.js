/**
 * Unit-Tests fuer die server-seitigen Validatoren (server/validate.js).
 *
 * Teststrategie — analog zu src/tests/utils/validators.test.js:
 * Jeder Validator wird nach dem Schema Äquivalenzklassen + Grenzwerte
 * getestet:
 *   - mindestens ein gültiger Happy-Path-Fall (leere Fehlerliste)
 *   - jeder definierte Fehlerpfad (Pflichtfeld, Regex, unbekannter Enum-Wert,
 *     out-of-range, falsches UUID-Format)
 *   - Grenzwerte (Baujahr 1885 / nächstes Jahr, KM 0 / 3.000.000)
 *   - partial-Modus: fehlende Pflichtfelder sind bei PATCH erlaubt,
 *     vorhandene-aber-ungültige Werte bleiben Fehler
 *
 * Reine Funktionstests — kein Netzwerk, keine Datenbank.
 *
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import {
  validateHalter,
  validateFahrzeug,
  validateTermin,
  validateTerminAnlage,
  validateTerminAenderung,
  validateStatusUpdate,
  validateMangel,
  check,
} from "../validate.js";

// Gültige UUIDs (Format von crypto.randomUUID)
const UUID = "123e4567-e89b-12d3-a456-426614174000";
const UUID2 = "0f0e0d0c-0b0a-4321-8765-fedcba987654";

// Hilfsfunktion: nur die betroffenen Feldnamen aus der Fehlerliste ziehen
const fields = (errs) => errs.map((e) => e.field);

// ── validateHalter ────────────────────────────────────────────────────

describe("validateHalter", () => {
  it("liefert leere Fehlerliste für gültigen Halter", () => {
    expect(validateHalter({ name: "Klaus Müller" })).toEqual([]);
    expect(validateHalter({ name: "Klaus Müller", email: "k.mueller@mail.de", telefon: "0176 1234567" })).toEqual([]);
  });

  it("meldet fehlenden/leeren Namen als Pflichtfeld", () => {
    expect(fields(validateHalter({}))).toContain("name");
    expect(fields(validateHalter({ name: "" }))).toContain("name");
    expect(fields(validateHalter({ name: "   " }))).toContain("name");
    expect(validateHalter({})[0].message).toBe("Pflichtfeld");
  });

  it("lehnt ungültiges E-Mail-Format ab", () => {
    expect(fields(validateHalter({ name: "X", email: "notanemail" }))).toContain("email");
    expect(fields(validateHalter({ name: "X", email: "zwei@@at.de" }))).toContain("email");
    expect(fields(validateHalter({ name: "X", email: "leer @mail.de" }))).toContain("email");
  });

  it("erlaubt leere/fehlende E-Mail (Optional-Feld)", () => {
    expect(validateHalter({ name: "X", email: "" })).toEqual([]);
    expect(validateHalter({ name: "X", email: null })).toEqual([]);
  });

  it("prüft halterId auf UUID-Format", () => {
    const errs = validateHalter({ name: "X", halterId: "kein-uuid" });
    expect(fields(errs)).toContain("halterId");
    expect(errs[0].message).toMatch(/UUID/);
  });

  it("akzeptiert gültige halterId (auch Großschreibung) und fehlende halterId", () => {
    expect(validateHalter({ name: "X", halterId: UUID })).toEqual([]);
    expect(validateHalter({ name: "X", halterId: UUID.toUpperCase() })).toEqual([]);
    expect(validateHalter({ name: "X" })).toEqual([]);
  });

  it("partial: fehlender Name ist erlaubt, leerer Name bleibt Fehler", () => {
    expect(validateHalter({}, { partial: true })).toEqual([]);
    expect(fields(validateHalter({ name: "" }, { partial: true }))).toContain("name");
    expect(fields(validateHalter({ email: "kaputt" }, { partial: true }))).toContain("email");
  });
});

// ── validateFahrzeug ──────────────────────────────────────────────────

describe("validateFahrzeug", () => {
  const basis = {
    kennzeichen: "H-AB 1234",
    hersteller: "BMW",
    modell: "320d",
    typ: "PKW",
    halterId: UUID,
  };

  it("liefert leere Fehlerliste für gültiges Fahrzeug (nur Pflichtfelder)", () => {
    expect(validateFahrzeug(basis)).toEqual([]);
  });

  it("liefert leere Fehlerliste für gültiges Fahrzeug mit allen Optional-Feldern", () => {
    expect(validateFahrzeug({
      ...basis,
      fahrzeugId: UUID2,
      fin: "WBA3A5C50CF256985",
      baujahr: 2019,
      kilometerstand: 87420,
      huFaellig: "2026-08-01",
    })).toEqual([]);
  });

  it("meldet alle fehlenden Pflichtfelder", () => {
    const f = fields(validateFahrzeug({}));
    expect(f).toContain("kennzeichen");
    expect(f).toContain("hersteller");
    expect(f).toContain("modell");
    expect(f).toContain("typ");
    expect(f).toContain("halterId");
    expect(f).toHaveLength(5);
  });

  it("lehnt unbekannten Fahrzeugtyp ab", () => {
    const errs = validateFahrzeug({ ...basis, typ: "Raumschiff" });
    expect(fields(errs)).toEqual(["typ"]);
    expect(errs[0].message).toMatch(/Unbekannter Fahrzeugtyp/);
  });

  it("lehnt ungültige FIN ab (falsche Länge, verbotene Zeichen I/O/Q)", () => {
    expect(fields(validateFahrzeug({ ...basis, fin: "WBA3A5C50CF25698" }))).toContain("fin");   // 16 Zeichen
    expect(fields(validateFahrzeug({ ...basis, fin: "WBA3A5C50CF2569855" }))).toContain("fin"); // 18 Zeichen
    expect(fields(validateFahrzeug({ ...basis, fin: "WBA3A5C50CF256I85" }))).toContain("fin");  // enthält I
  });

  it("erlaubt leere/fehlende FIN (Optional-Feld)", () => {
    expect(validateFahrzeug({ ...basis, fin: "" })).toEqual([]);
    expect(validateFahrzeug({ ...basis, fin: null })).toEqual([]);
  });

  it("Baujahr-Grenzwerte: 1885 und nächstes Jahr sind gültig", () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(validateFahrzeug({ ...basis, baujahr: 1885 })).toEqual([]);
    expect(validateFahrzeug({ ...basis, baujahr: nextYear })).toEqual([]);
  });

  it("Baujahr-Grenzwerte: 1884 und übernächstes Jahr sind ungültig", () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(fields(validateFahrzeug({ ...basis, baujahr: 1884 }))).toContain("baujahr");
    expect(fields(validateFahrzeug({ ...basis, baujahr: nextYear + 1 }))).toContain("baujahr");
    expect(fields(validateFahrzeug({ ...basis, baujahr: "abc" }))).toContain("baujahr");
  });

  it("Kilometerstand-Grenzwerte: 0 und 3.000.000 sind gültig", () => {
    expect(validateFahrzeug({ ...basis, kilometerstand: 0 })).toEqual([]);
    expect(validateFahrzeug({ ...basis, kilometerstand: 3_000_000 })).toEqual([]);
  });

  it("Kilometerstand-Grenzwerte: -1 und 3.000.001 sind ungültig", () => {
    expect(fields(validateFahrzeug({ ...basis, kilometerstand: -1 }))).toContain("kilometerstand");
    expect(fields(validateFahrzeug({ ...basis, kilometerstand: 3_000_001 }))).toContain("kilometerstand");
    expect(fields(validateFahrzeug({ ...basis, kilometerstand: "abc" }))).toContain("kilometerstand");
  });

  it("huFaellig muss YYYY-MM-DD sein, ist aber optional", () => {
    expect(validateFahrzeug({ ...basis, huFaellig: "2026-08-01" })).toEqual([]);
    expect(validateFahrzeug({ ...basis, huFaellig: "" })).toEqual([]);
    expect(fields(validateFahrzeug({ ...basis, huFaellig: "01.08.2026" }))).toContain("huFaellig");
  });

  it("prüft fahrzeugId und halterId auf UUID-Format", () => {
    const errs1 = validateFahrzeug({ ...basis, fahrzeugId: "kein-uuid" });
    expect(fields(errs1)).toEqual(["fahrzeugId"]);
    expect(errs1[0].message).toMatch(/UUID/);
    // halterId ist nicht-leer (Pflichtfeld ok), aber kein UUID → nur UUID-Fehler
    const errs2 = validateFahrzeug({ ...basis, halterId: "abc" });
    expect(fields(errs2)).toEqual(["halterId"]);
    expect(errs2[0].message).toMatch(/UUID/);
  });

  it("partial: leeres Objekt erlaubt, vorhandene-aber-ungültige Felder bleiben Fehler", () => {
    expect(validateFahrzeug({}, { partial: true })).toEqual([]);
    expect(validateFahrzeug({ kilometerstand: 90000 }, { partial: true })).toEqual([]);
    expect(fields(validateFahrzeug({ kennzeichen: "" }, { partial: true }))).toContain("kennzeichen");
    expect(fields(validateFahrzeug({ typ: "Raumschiff" }, { partial: true }))).toContain("typ");
    expect(fields(validateFahrzeug({ baujahr: 1700 }, { partial: true }))).toContain("baujahr");
  });
});

// ── validateTermin ────────────────────────────────────────────────────

describe("validateTermin", () => {
  const basis = {
    fahrzeugId: UUID,
    datum: "2026-07-10",
    prueftCode: "HU",
  };

  it("liefert leere Fehlerliste für gültigen Termin", () => {
    expect(validateTermin(basis)).toEqual([]);
    expect(validateTermin({
      ...basis,
      terminId: UUID2,
      uhrzeit: "08:30",
      prueferKuerzel: "MW",
      statusCode: "Geplant",
    })).toEqual([]);
  });

  it("meldet alle fehlenden Pflichtfelder", () => {
    const f = fields(validateTermin({}));
    expect(f).toContain("fahrzeugId");
    expect(f).toContain("datum");
    expect(f).toContain("prueftCode");
    expect(f).toHaveLength(3);
  });

  it("lehnt Datum ausserhalb YYYY-MM-DD ab", () => {
    expect(fields(validateTermin({ ...basis, datum: "10.07.2026" }))).toContain("datum");
    expect(fields(validateTermin({ ...basis, datum: "blabla" }))).toContain("datum");
  });

  it("akzeptiert Uhrzeit als HH:MM und HH:MM:SS, lehnt andere Formate ab", () => {
    expect(validateTermin({ ...basis, uhrzeit: "08:30" })).toEqual([]);
    expect(validateTermin({ ...basis, uhrzeit: "08:30:00" })).toEqual([]);
    expect(validateTermin({ ...basis, uhrzeit: "" })).toEqual([]); // optional
    expect(fields(validateTermin({ ...basis, uhrzeit: "8:30" }))).toContain("uhrzeit");
    expect(fields(validateTermin({ ...basis, uhrzeit: "0830" }))).toContain("uhrzeit");
  });

  it("lehnt unbekannte Prüfart ab", () => {
    const errs = validateTermin({ ...basis, prueftCode: "TÜVX" });
    expect(fields(errs)).toEqual(["prueftCode"]);
    expect(errs[0].message).toMatch(/Unbekannte Prüfart/);
  });

  it("lehnt unbekanntes Prüfer-Kürzel ab, erlaubt registrierte", () => {
    expect(validateTermin({ ...basis, prueferKuerzel: "MW" })).toEqual([]);
    expect(fields(validateTermin({ ...basis, prueferKuerzel: "XX" }))).toContain("prueferKuerzel");
  });

  it("lehnt unbekannten Status ab, erlaubt registrierte", () => {
    expect(validateTermin({ ...basis, statusCode: "Nachprüfung" })).toEqual([]);
    expect(fields(validateTermin({ ...basis, statusCode: "Fertig" }))).toContain("statusCode");
  });

  it("prüft terminId und fahrzeugId auf UUID-Format", () => {
    const errs1 = validateTermin({ ...basis, terminId: "kein-uuid" });
    expect(fields(errs1)).toEqual(["terminId"]);
    expect(errs1[0].message).toMatch(/UUID/);
    const errs2 = validateTermin({ ...basis, fahrzeugId: "abc" });
    expect(fields(errs2)).toEqual(["fahrzeugId"]);
  });

  it("partial: fehlende Pflichtfelder erlaubt, ungültige Werte bleiben Fehler", () => {
    expect(validateTermin({}, { partial: true })).toEqual([]);
    expect(validateTermin({ uhrzeit: "09:15" }, { partial: true })).toEqual([]);
    expect(fields(validateTermin({ datum: "kaputt" }, { partial: true }))).toContain("datum");
    expect(fields(validateTermin({ prueftCode: "TÜVX" }, { partial: true }))).toContain("prueftCode");
    expect(fields(validateTermin({ statusCode: "Fertig" }, { partial: true }))).toContain("statusCode");
  });
});

// ── validateTerminAnlage / validateTerminAenderung ────────────────────
//
// Regressionstests zur Rechte-Haertung: der Status eines Termins darf NUR
// ueber PATCH /api/termine/:id/status (requireAuth("status")) gesetzt
// werden. Frueher schrieben POST /api/termine und PATCH /api/termine/:id
// status_code mit — damit konnte die Rolle empfang mit reinem
// Schreibrecht ein Pruefergebnis setzen.

describe("validateTerminAnlage (POST /api/termine)", () => {
  const basis = {
    fahrzeugId: UUID,
    datum: "2026-07-10",
    prueftCode: "HU",
  };

  it("akzeptiert einen Termin ohne statusCode", () => {
    expect(validateTerminAnlage(basis)).toEqual([]);
  });

  it("akzeptiert statusCode 'Geplant' als No-op (das Frontend sendet das Feld mit)", () => {
    expect(validateTerminAnlage({ ...basis, statusCode: "Geplant" })).toEqual([]);
  });

  it("lehnt jeden anderen Status bei der Anlage ab — auch gültige Werte", () => {
    for (const status of ["Bestanden", "In Prüfung", "Nicht bestanden", "Abgebrochen"]) {
      const errs = validateTerminAnlage({ ...basis, statusCode: status });
      expect(fields(errs)).toEqual(["statusCode"]);
      expect(errs[0].message).toMatch(/Geplant/);
      expect(errs[0].message).toMatch(/status/);
    }
  });

  it("meldet pro Feld genau einen Fehler (kein doppelter statusCode-Eintrag)", () => {
    const errs = validateTerminAnlage({ ...basis, statusCode: "Fertig" });
    expect(fields(errs)).toEqual(["statusCode"]);
  });

  it("prüft die übrigen Termin-Regeln unverändert weiter", () => {
    expect(fields(validateTerminAnlage({}))).toEqual(
      expect.arrayContaining(["fahrzeugId", "datum", "prueftCode"]),
    );
    expect(fields(validateTerminAnlage({ ...basis, prueftCode: "TÜVX" }))).toContain("prueftCode");
  });
});

describe("validateTerminAenderung (PATCH /api/termine/:id)", () => {
  const basis = {
    fahrzeugId: UUID,
    datum: "2026-07-10",
    prueftCode: "HU",
  };

  it("akzeptiert eine Änderung ohne statusCode", () => {
    expect(validateTerminAenderung(basis)).toEqual([]);
    expect(validateTerminAenderung({ notiz: "geändert" }, { partial: true })).toEqual([]);
  });

  it("lehnt statusCode grundsätzlich ab — auch 'Geplant'", () => {
    for (const status of ["Geplant", "Bestanden", "In Prüfung"]) {
      const errs = validateTerminAenderung({ statusCode: status }, { partial: true });
      expect(fields(errs)).toEqual(["statusCode"]);
      expect(errs[0].message).toMatch(/PATCH \/api\/termine\/:id\/status/);
    }
  });

  it("lehnt auch einen ungültigen Status mit dem Routen-Hinweis ab (eine Meldung)", () => {
    const errs = validateTerminAenderung({ statusCode: "Fertig" }, { partial: true });
    expect(fields(errs)).toEqual(["statusCode"]);
    expect(errs[0].message).toMatch(/statusSetzen/);
  });

  it("prüft die übrigen Termin-Regeln unverändert weiter", () => {
    expect(fields(validateTerminAenderung({ datum: "kaputt" }, { partial: true }))).toContain("datum");
    expect(fields(validateTerminAenderung({ prueferKuerzel: "XX" }, { partial: true }))).toContain("prueferKuerzel");
  });
});

// ── validateStatusUpdate ──────────────────────────────────────────────

describe("validateStatusUpdate", () => {
  it("akzeptiert alle registrierten Status-Werte", () => {
    for (const s of ["Geplant", "In Prüfung", "Bestanden", "Nicht bestanden", "Nachprüfung"]) {
      expect(validateStatusUpdate({ statusCode: s })).toEqual([]);
    }
  });

  it("meldet fehlenden/leeren statusCode als Pflichtfeld", () => {
    expect(validateStatusUpdate({})).toEqual([{ field: "statusCode", message: "Pflichtfeld" }]);
    expect(fields(validateStatusUpdate({ statusCode: "" }))).toContain("statusCode");
    expect(fields(validateStatusUpdate({ statusCode: "   " }))).toContain("statusCode");
  });

  it("lehnt unbekannten Status ab", () => {
    const errs = validateStatusUpdate({ statusCode: "Fertig" });
    expect(fields(errs)).toEqual(["statusCode"]);
    expect(errs[0].message).toMatch(/Unbekannter Status/);
  });
});

// ── validateMangel ────────────────────────────────────────────────────

describe("validateMangel", () => {
  const basis = {
    terminId: UUID,
    beschreibung: "Bremsscheibe vorn links verschlissen",
    kategorieCode: "EM",
  };

  it("liefert leere Fehlerliste für gültigen Mangel", () => {
    expect(validateMangel(basis)).toEqual([]);
    expect(validateMangel({ ...basis, mangelId: UUID2, codeStvzo: "6.1.a", behoben: true })).toEqual([]);
  });

  it("meldet alle fehlenden Pflichtfelder", () => {
    const f = fields(validateMangel({}));
    expect(f).toContain("terminId");
    expect(f).toContain("beschreibung");
    expect(f).toContain("kategorieCode");
    expect(f).toHaveLength(3);
  });

  it("lehnt unbekannte Kategorie ab (erwartet OM/GM/EM/GfM)", () => {
    const errs = validateMangel({ ...basis, kategorieCode: "XXL" });
    expect(fields(errs)).toEqual(["kategorieCode"]);
    expect(errs[0].message).toMatch(/OM\/GM\/EM\/GfM/);
  });

  it("akzeptiert alle registrierten Kategorien", () => {
    for (const k of ["OM", "GM", "EM", "GfM"]) {
      expect(validateMangel({ ...basis, kategorieCode: k })).toEqual([]);
    }
  });

  it("behoben muss Boolean sein, ist aber optional", () => {
    expect(validateMangel({ ...basis, behoben: false })).toEqual([]);
    expect(validateMangel({ ...basis })).toEqual([]);
    expect(fields(validateMangel({ ...basis, behoben: "ja" }))).toContain("behoben");
    expect(fields(validateMangel({ ...basis, behoben: 1 }))).toContain("behoben");
  });

  it("prüft mangelId und terminId auf UUID-Format", () => {
    const errs1 = validateMangel({ ...basis, mangelId: "kein-uuid" });
    expect(fields(errs1)).toEqual(["mangelId"]);
    expect(errs1[0].message).toMatch(/UUID/);
    // terminId nicht-leer (Pflichtfeld ok), aber kein UUID → nur UUID-Fehler
    const errs2 = validateMangel({ ...basis, terminId: "abc" });
    expect(fields(errs2)).toEqual(["terminId"]);
    expect(errs2[0].message).toMatch(/UUID/);
  });
});

// ── check(): Middleware-Verdrahtung ───────────────────────────────────
//
// Die Integrationstests (server/tests/termin-status-routen.test.js)
// brauchen eine laufende MariaDB. Diese Tests pruefen ohne Datenbank, dass
// die Middleware aus einer Fehlerliste tatsaechlich HTTP 400 mit
// { ok:false, errors:[...] } macht — und dass sie den partial-Modus an
// PATCH weiterreicht.

describe("check() als Express-Middleware", () => {
  // Minimale Attrappen: nur das, was check() anfasst.
  function fakeRes() {
    const res = { code: null, body: null };
    res.status = (c) => { res.code = c; return res; };
    res.json = (b) => { res.body = b; return res; };
    return res;
  }

  it("laesst gueltige Eingaben durch (next(), keine Antwort)", () => {
    const res = fakeRes();
    let weiter = false;
    check(validateTerminAnlage)(
      { method: "POST", body: { fahrzeugId: UUID, datum: "2026-07-10", prueftCode: "HU" } },
      res,
      () => { weiter = true; },
    );
    expect(weiter).toBe(true);
    expect(res.code).toBeNull();
  });

  it("antwortet auf statusCode im POST mit 400 und Feldliste", () => {
    const res = fakeRes();
    let weiter = false;
    check(validateTerminAnlage)(
      { method: "POST", body: { fahrzeugId: UUID, datum: "2026-07-10", prueftCode: "HU", statusCode: "Bestanden" } },
      res,
      () => { weiter = true; },
    );
    expect(weiter).toBe(false);
    expect(res.code).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.errors.map((e) => e.field)).toEqual(["statusCode"]);
  });

  it("antwortet auf statusCode im PATCH mit 400 (partial-Modus aktiv)", () => {
    const res = fakeRes();
    let weiter = false;
    check(validateTerminAenderung)(
      { method: "PATCH", body: { statusCode: "Bestanden" } },
      res,
      () => { weiter = true; },
    );
    expect(weiter).toBe(false);
    expect(res.code).toBe(400);
    expect(res.body.errors[0].message).toMatch(/\/api\/termine\/:id\/status/);
  });

  it("laesst eine PATCH-Aenderung ohne statusCode durch", () => {
    const res = fakeRes();
    let weiter = false;
    check(validateTerminAenderung)(
      { method: "PATCH", body: { notiz: "geändert" } },
      res,
      () => { weiter = true; },
    );
    expect(weiter).toBe(true);
    expect(res.code).toBeNull();
  });
});
