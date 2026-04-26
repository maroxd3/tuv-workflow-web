import { describe, it, expect } from "vitest";
import {
  validateKennzeichen,
  validateKennzeichenUnique,
  validateFin,
  validateBaujahr,
  validateKmStand,
  validateTelefon,
  validateEmail,
  validateFahrzeugtyp,
  validateHuDatum,
  validateFahrzeug,
  validateStatusWechsel,
  validateHerstellerModellKonsistenz,
  checkFinPruefziffer,
  KM_STAND_MAX,
  BAUJAHR_MIN,
} from "../../utils/validators";
import { STATUS } from "../../constants/status";

/**
 * Teststrategie — Validatoren:
 * Jede Validator-Funktion wird nach dem Schema Äquivalenzklassen + Grenzwerte
 * getestet:
 *   - mindestens ein gültiger Happy-Path-Fall
 *   - jeder definierte Fehlerpfad (Regex-Verletzung, Null, leer, out-of-range)
 *   - Grenzwerte (untere/obere Grenze für numerische Bereiche)
 * Damit sind die in der Mail von Frau Fuchs (24.04.2026) genannten
 * Dateneingabe-Bugs vollständig abgedeckt (negativer KM-Stand, Buchstaben in
 * Telefon, ungültige E-Mail, doppelte Kennzeichen, Fahrzeugtyp-Inkonsistenz).
 */

describe("validateKennzeichen", () => {
  it("akzeptiert gültige Deutsche Kennzeichen", () => {
    expect(validateKennzeichen("B-TK 1234")).toBeNull();
    expect(validateKennzeichen("HH-AB 5678")).toBeNull();
    expect(validateKennzeichen("M-XZ 9900")).toBeNull();
    expect(validateKennzeichen("KS-TF 1100")).toBeNull();
    expect(validateKennzeichen("B AB 12H")).toBeNull(); // Historisch (H-Kennzeichen)
    expect(validateKennzeichen("M XY 1E")).toBeNull();  // E-Kennzeichen
  });

  it("lehnt leere Eingaben als Pflichtfeld ab", () => {
    expect(validateKennzeichen("")).toBe("Pflichtfeld");
    expect(validateKennzeichen(null)).toBe("Pflichtfeld");
    expect(validateKennzeichen(undefined)).toBe("Pflichtfeld");
    expect(validateKennzeichen("   ")).toBe("Pflichtfeld");
  });

  it("lehnt offensichtlich falsche Formate ab", () => {
    expect(validateKennzeichen("ABC123")).toMatch(/Format/);
    expect(validateKennzeichen("BTK1234")).toMatch(/Format/);
    expect(validateKennzeichen("12345")).toMatch(/Format/);
  });
});

describe("validateKennzeichenUnique", () => {
  const fahrzeuge = [
    { id: "a", kennzeichen: "B-TK 1234" },
    { id: "b", kennzeichen: "HH-AB 5678" },
  ];

  it("erlaubt neues, nicht vergebenes Kennzeichen", () => {
    expect(validateKennzeichenUnique("M-XY 9999", fahrzeuge)).toBeNull();
  });

  it("blockiert Duplikat (case + whitespace insensitiv)", () => {
    expect(validateKennzeichenUnique("B-TK 1234", fahrzeuge)).toMatch(/vergeben/);
    expect(validateKennzeichenUnique("b-tk 1234", fahrzeuge)).toMatch(/vergeben/);
    expect(validateKennzeichenUnique("B-TK  1234  ", fahrzeuge)).toMatch(/vergeben/);
  });

  it("erlaubt Edit des eigenen Eintrags (über excludeId)", () => {
    expect(validateKennzeichenUnique("B-TK 1234", fahrzeuge, "a")).toBeNull();
  });

  it("lehnt leeres Kennzeichen still ab (nicht Aufgabe dieser Funktion)", () => {
    // Leer-Check liegt bei validateKennzeichen, hier nur Unique-Logik
    expect(validateKennzeichenUnique("", fahrzeuge)).toBeNull();
  });
});

describe("validateFin", () => {
  it("akzeptiert eine gültige 17-stellige FIN", () => {
    expect(validateFin("WBA3A5C50CF256985")).toBeNull();
    expect(validateFin("1FADP3F29EL123456")).toBeNull();
  });

  it("ist optional", () => {
    expect(validateFin("")).toBeNull();
    expect(validateFin(null)).toBeNull();
  });

  it("lehnt falsche Länge ab", () => {
    expect(validateFin("WBA3A5C50CF25698")).toMatch(/17/);
    expect(validateFin("WBA3A5C50CF2569855")).toMatch(/17/);
  });

  it("lehnt verbotene Zeichen (I, O, Q) und Sonderzeichen ab", () => {
    expect(validateFin("WBA3A5C50CF256I85")).toMatch(/ungültige Zeichen/);
    expect(validateFin("WBA3A5C50-CF25698")).toMatch(/ungültige Zeichen/);
  });
});

describe("validateBaujahr", () => {
  const currentYear = new Date().getFullYear();

  it("akzeptiert plausible Jahre", () => {
    expect(validateBaujahr(2018)).toBeNull();
    expect(validateBaujahr(1985)).toBeNull();
    expect(validateBaujahr(String(currentYear))).toBeNull();
  });

  it("ist optional", () => {
    expect(validateBaujahr("")).toBeNull();
    expect(validateBaujahr(null)).toBeNull();
    expect(validateBaujahr(undefined)).toBeNull();
  });

  it("lehnt Jahre vor Erfindung des Automobils ab (Grenzwert)", () => {
    expect(validateBaujahr(BAUJAHR_MIN - 1)).toMatch(/Baujahr muss zwischen/);
    expect(validateBaujahr(1000)).toMatch(/Baujahr muss zwischen/);
  });

  it("lehnt Zukunfts-Jahre jenseits +1 ab", () => {
    expect(validateBaujahr(currentYear + 2)).toMatch(/Baujahr muss zwischen/);
  });

  it("akzeptiert +1 (Vorregistrierung neuer Modelle ist üblich)", () => {
    expect(validateBaujahr(currentYear + 1)).toBeNull();
  });

  it("lehnt Nicht-Zahlen ab", () => {
    expect(validateBaujahr("abc")).toMatch(/Ungültiges Jahr/);
    expect(validateBaujahr("2019.5")).toMatch(/Ungültiges Jahr/);
  });
});

describe("validateKmStand — deckt den Bug 'negativer KM-Stand'", () => {
  it("akzeptiert 0 und positive Integer", () => {
    expect(validateKmStand(0)).toBeNull();
    expect(validateKmStand("0")).toBeNull();
    expect(validateKmStand(87420)).toBeNull();
    expect(validateKmStand("87420")).toBeNull();
  });

  it("ist optional", () => {
    expect(validateKmStand("")).toBeNull();
    expect(validateKmStand(null)).toBeNull();
  });

  it("lehnt negative Werte ab (Regression-Test Mail Fuchs)", () => {
    expect(validateKmStand(-1)).toMatch(/nicht negativ/);
    expect(validateKmStand(-500)).toMatch(/nicht negativ/);
    expect(validateKmStand("-42")).toMatch(/nicht negativ/);
  });

  it("lehnt Fließkommazahlen ab (KM wird als Integer geführt)", () => {
    expect(validateKmStand(123.5)).toMatch(/ganze Zahl/);
  });

  it("lehnt Werte jenseits der Plausibilitätsgrenze ab", () => {
    expect(validateKmStand(KM_STAND_MAX + 1)).toMatch(/Plausibilitätsgrenze/);
  });

  it("akzeptiert den Grenzwert selbst", () => {
    expect(validateKmStand(KM_STAND_MAX)).toBeNull();
  });
});

describe("validateTelefon — deckt den Bug 'Buchstaben in Telefonnr'", () => {
  it("akzeptiert übliche Formate", () => {
    expect(validateTelefon("0176 1234567")).toBeNull();
    expect(validateTelefon("+49 176 1234567")).toBeNull();
    expect(validateTelefon("+49-176-1234-567")).toBeNull();
    expect(validateTelefon("(030) 12345678")).toBeNull();
    expect(validateTelefon("089/1234567")).toBeNull();
  });

  it("ist optional", () => {
    expect(validateTelefon("")).toBeNull();
    expect(validateTelefon(null)).toBeNull();
  });

  it("lehnt Buchstaben ab (Regression Mail Fuchs)", () => {
    expect(validateTelefon("ABC123")).toMatch(/Buchstaben/);
    expect(validateTelefon("0176-HALLO")).toMatch(/Buchstaben/);
    expect(validateTelefon("01761234567x")).toMatch(/Buchstaben/);
  });

  it("lehnt Nummern mit zu wenig Ziffern ab", () => {
    // "1 2 3" passiert den Zeichen-Whitelist (5 Zeichen), hat aber nur 3 Ziffern
    expect(validateTelefon("1 2 3")).toMatch(/zu kurz/);
  });

  it("lehnt Sonderzeichen außerhalb des Whitelist ab", () => {
    expect(validateTelefon("0176@1234567")).toMatch(/ungültiges Telefonformat/i);
  });
});

describe("validateEmail — deckt den Bug 'ungültiges E-Mail-Format'", () => {
  it("akzeptiert gültige Adressen", () => {
    expect(validateEmail("name@mail.de")).toBeNull();
    expect(validateEmail("k.mueller@mail.de")).toBeNull();
    expect(validateEmail("info@schnell-gmbh.de")).toBeNull();
    expect(validateEmail("vor-nach@sub.firma.com")).toBeNull();
  });

  it("ist optional", () => {
    expect(validateEmail("")).toBeNull();
    expect(validateEmail(null)).toBeNull();
  });

  it("lehnt offensichtlich ungültige Formate ab (Regression Mail Fuchs)", () => {
    expect(validateEmail("notanemail")).toMatch(/E-Mail-Format/);
    expect(validateEmail("missing@tld")).toMatch(/E-Mail-Format/);
    expect(validateEmail("@nohost.de")).toMatch(/E-Mail-Format/);
    expect(validateEmail("two@@at.de")).toMatch(/E-Mail-Format/);
    expect(validateEmail("space in@mail.de")).toMatch(/E-Mail-Format/);
  });
});

describe("validateFahrzeugtyp", () => {
  it("akzeptiert in FAHRZEUG_TYPEN registrierte Werte", () => {
    expect(validateFahrzeugtyp("PKW")).toBeNull();
    expect(validateFahrzeugtyp("Motorrad")).toBeNull();
    expect(validateFahrzeugtyp("BEV")).toBeNull();
  });

  it("lehnt leere Eingabe als Pflichtfeld ab", () => {
    expect(validateFahrzeugtyp("")).toBe("Pflichtfeld");
  });

  it("lehnt unbekannte Typen ab", () => {
    expect(validateFahrzeugtyp("Raumschiff")).toMatch(/Unbekannter/);
  });
});

describe("validateHuDatum", () => {
  it("akzeptiert ISO-Datum und ist optional", () => {
    expect(validateHuDatum("2026-06-15")).toBeNull();
    expect(validateHuDatum("")).toBeNull();
    expect(validateHuDatum(null)).toBeNull();
  });

  it("lehnt ungültige Datumsstrings ab", () => {
    expect(validateHuDatum("blabla")).toBe("Ungültiges Datum");
  });
});

describe("validateFahrzeug — Integration aller Einzel-Validatoren", () => {
  const base = {
    kennzeichen: "B-TK 1234",
    hersteller: "BMW",
    modell: "320d",
    besitzer: "Klaus Müller",
    typ: "PKW",
  };

  it("liefert leeres Errors-Objekt für korrektes Fahrzeug", () => {
    expect(validateFahrzeug(base, [])).toEqual({});
  });

  it("meldet alle fehlenden Pflichtfelder", () => {
    const e = validateFahrzeug({}, []);
    expect(e.kennzeichen).toBeDefined();
    expect(e.hersteller).toBeDefined();
    expect(e.modell).toBeDefined();
    expect(e.besitzer).toBeDefined();
    expect(e.typ).toBeDefined();
  });

  it("erkennt Duplikat-Kennzeichen beim Neu-Anlegen", () => {
    const existing = [{ id: "x", kennzeichen: "B-TK 1234" }];
    const e = validateFahrzeug(base, existing);
    expect(e.kennzeichen).toMatch(/vergeben/);
  });

  it("erkennt Kombination negativer KM + Buchstaben in Telefon + falsche Email", () => {
    const schlecht = { ...base, kmStand: "-5", telefon: "abc", email: "kein@email" };
    const e = validateFahrzeug(schlecht, []);
    expect(e.kmStand).toBeDefined();
    expect(e.telefon).toBeDefined();
    expect(e.email).toBeDefined();
  });
});

describe("validateStatusWechsel — fängt 'Bestanden trotz Hauptmangel'", () => {
  it("erlaubt Bestanden ohne Mängel", () => {
    expect(validateStatusWechsel(STATUS.BESTANDEN, [])).toBeNull();
  });

  it("erlaubt Bestanden bei nur geringen / erheblichen Mängeln", () => {
    expect(validateStatusWechsel(STATUS.BESTANDEN, [{ kat: "LM" }])).toBeNull();
    expect(validateStatusWechsel(STATUS.BESTANDEN, [{ kat: "EM" }])).toBeNull();
  });

  it("blockiert Bestanden bei Hauptmangel (HM)", () => {
    expect(validateStatusWechsel(STATUS.BESTANDEN, [{ kat: "HM" }]))
      .toMatch(/Hauptmangel/);
  });

  it("blockiert Bestanden bei gefährlichem Mangel (GM-Key)", () => {
    expect(validateStatusWechsel(STATUS.BESTANDEN, [{ kat: "GM" }]))
      .toMatch(/Hauptmangel|gefährlicher/);
  });

  it("blockiert auch bei gemischten Mängeln (mindestens ein HM reicht)", () => {
    const maengel = [{ kat: "LM" }, { kat: "EM" }, { kat: "HM" }];
    expect(validateStatusWechsel(STATUS.BESTANDEN, maengel)).not.toBeNull();
  });

  it("greift nicht bei anderen Zielstatus", () => {
    expect(validateStatusWechsel(STATUS.NICHT_BESTANDEN, [{ kat: "HM" }])).toBeNull();
    expect(validateStatusWechsel(STATUS.NACHPRUEFUNG, [{ kat: "HM" }])).toBeNull();
    expect(validateStatusWechsel(STATUS.GEPLANT, [])).toBeNull();
  });
});

describe("validateHerstellerModellKonsistenz — harte Konsistenzprüfung", () => {
  it("liefert {} wenn Hersteller unbekannt ist (z. B. Tatra, Lada, Tuning) — Eintrag erlaubt", () => {
    expect(validateHerstellerModellKonsistenz("Tatra", "815", "LKW")).toEqual({});
  });

  it("liefert {} bei konsistenter Eingabe", () => {
    expect(validateHerstellerModellKonsistenz("BMW", "320d", "PKW")).toEqual({});
    expect(validateHerstellerModellKonsistenz("Volkswagen", "Golf VIII", "PKW")).toEqual({});
    expect(validateHerstellerModellKonsistenz("BMW", "R 1250 GS", "Motorrad")).toEqual({});
  });

  it("blockiert bei Typ-Mismatch (Regression: VW Golf als Motorrad)", () => {
    const r = validateHerstellerModellKonsistenz("Volkswagen", "Golf", "Motorrad");
    expect(r.typ).toMatch(/Motorrad/);
  });

  it("blockiert bei Modell-Mismatch (Regression: BMW Polo)", () => {
    const r = validateHerstellerModellKonsistenz("BMW", "Polo", "PKW");
    expect(r.modell).toMatch(/Polo/);
  });

  it("ist gegen Groß-/Kleinschreibung robust", () => {
    expect(validateHerstellerModellKonsistenz("bmw", "3er", "PKW")).toEqual({});
    expect(validateHerstellerModellKonsistenz("VW", "golf", "PKW")).toEqual({});
  });

  it("validateFahrzeug bündelt die Konsistenz-Fehler ins Errors-Objekt", () => {
    /* BMW + Polo → modell-Fehler; alle anderen Pflichtfelder ok, damit nur dieser Fehler übrig bleibt */
    const errs = validateFahrzeug({
      kennzeichen: "B-XX 1234",
      hersteller: "BMW",
      modell: "Polo",
      besitzer: "Test",
      typ: "PKW",
    }, []);
    expect(errs.modell).toMatch(/Polo/);
  });

  it("validateFahrzeug blockt VW Golf als Motorrad", () => {
    const errs = validateFahrzeug({
      kennzeichen: "B-XX 1234",
      hersteller: "Volkswagen",
      modell: "Golf",
      besitzer: "Test",
      typ: "Motorrad",
    }, []);
    expect(errs.typ).toMatch(/Motorrad/);
  });

  it("validateFahrzeug überschreibt nicht den 'Pflichtfeld'-Fehler bei leerem Modell", () => {
    const errs = validateFahrzeug({
      kennzeichen: "B-XX 1234",
      hersteller: "BMW",
      modell: "",
      besitzer: "Test",
      typ: "PKW",
    }, []);
    expect(errs.modell).toBe("Pflichtfeld");
  });
});

describe("checkFinPruefziffer — ISO 3779 / FMVSS 115", () => {
  it("akzeptiert eine FIN mit korrekter Prüfziffer (NHTSA-Beispiel)", () => {
    /* Standard-Lehrbuch-VIN aus NHTSA-Doku, Prüfziffer X an Position 9 */
    expect(checkFinPruefziffer("1M8GDM9AXKP042788")).toBeNull();
  });

  it("warnt bei falscher Prüfziffer (Regression: Quatsch-FIN aus Fuchs-Bericht)", () => {
    /* "BLABLUBB123435666" hat 17 Zeichen + erlaubte Buchstaben, aber falsche Prüfziffer */
    const r = checkFinPruefziffer("BLABLUBB123435666");
    expect(r).not.toBeNull();
    expect(r.warning).toMatch(/Prüfziffer/);
  });

  it("ignoriert leere/zu kurze FIN (Hard-Validator zuständig)", () => {
    expect(checkFinPruefziffer("")).toBeNull();
    expect(checkFinPruefziffer("   ")).toBeNull();
    expect(checkFinPruefziffer("ABC123")).toBeNull();
  });

  it("ignoriert FIN mit verbotenen Zeichen (Hard-Validator zuständig)", () => {
    /* Enthält 'I' an Position 1 — Format ist hartes Fehler, weicher Check skipped */
    expect(checkFinPruefziffer("IM8GDM9AXKP042788")).toBeNull();
  });

  it("ist gegen Kleinschreibung robust", () => {
    expect(checkFinPruefziffer("1m8gdm9axkp042788")).toBeNull();
  });
});
