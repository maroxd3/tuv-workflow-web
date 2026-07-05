/**
 * Unit-Tests fuer server/auth.js (Passwort-Hashing, Token-Signierung,
 * Rollen-Matrix).
 *
 * Teststrategie — analog zu validate.test.js: pro Funktion Happy-Path plus
 * jeder definierte Fehlerpfad (falsches Passwort, manipulierter Hash,
 * falsches Secret, manipulierte Payload, abgelaufenes exp). Die
 * Rollen-Matrix wird vollstaendig durchgetestet (alle 3 Rollen x alle
 * 3 Rechte-Helfer plus unbekannte Rolle = fail-closed).
 *
 * Reine Funktionstests — kein Netzwerk, keine Datenbank.
 *
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  darfSchreiben,
  darfStatusSetzen,
  darfLoeschen,
  ROLLEN_RECHTE,
  TOKEN_GUELTIGKEIT_MS,
} from "../auth.js";

const SECRET = "test-secret-mindestens-32-zeichen-lang!!";

// ── hashPassword / verifyPassword ─────────────────────────────────────

describe("hashPassword / verifyPassword", () => {
  it("Roundtrip: korrektes Passwort verifiziert gegen eigenen Hash", () => {
    const stored = hashPassword("start123");
    expect(verifyPassword("start123", stored)).toBe(true);
  });

  it("erzeugt das dokumentierte Format scrypt$N$r$p$salt$hash", () => {
    const stored = hashPassword("start123");
    const teile = stored.split("$");
    expect(teile).toHaveLength(6);
    expect(teile[0]).toBe("scrypt");
    expect(Number(teile[1])).toBeGreaterThan(1); // N
    expect(teile[4]).toMatch(/^[0-9a-f]+$/); // salt hex
    expect(teile[5]).toMatch(/^[0-9a-f]+$/); // hash hex
  });

  it("salzt: zwei Hashes desselben Passworts sind verschieden", () => {
    expect(hashPassword("start123")).not.toBe(hashPassword("start123"));
  });

  it("lehnt falsches Passwort ab", () => {
    const stored = hashPassword("start123");
    expect(verifyPassword("start124", stored)).toBe(false);
    expect(verifyPassword("", stored)).toBe(false);
  });

  it("lehnt manipulierten Hash ab", () => {
    const stored = hashPassword("start123");
    // letztes Hex-Zeichen des Hash-Teils kippen
    const letzt = stored.at(-1);
    const manipuliert = stored.slice(0, -1) + (letzt === "0" ? "1" : "0");
    expect(verifyPassword("start123", manipuliert)).toBe(false);
  });

  it("lehnt kaputte/fremde Formate ab statt zu werfen", () => {
    expect(verifyPassword("start123", "")).toBe(false);
    expect(verifyPassword("start123", "kein-hash")).toBe(false);
    expect(verifyPassword("start123", "bcrypt$10$abc$def$ghi$jkl")).toBe(false);
    expect(verifyPassword("start123", "scrypt$999999999$8$1$aa$bb")).toBe(false);
    expect(verifyPassword("start123", null)).toBe(false);
    expect(verifyPassword(null, hashPassword("x"))).toBe(false);
  });
});

// ── signToken / verifyToken ───────────────────────────────────────────

describe("signToken / verifyToken", () => {
  const payload = () => ({
    kuerzel: "MW",
    name: "Marwan Saleh",
    rolle: "pruefer",
    exp: Date.now() + TOKEN_GUELTIGKEIT_MS,
  });

  it("Roundtrip: verifyToken liefert die signierte Payload zurueck", () => {
    const p = payload();
    const token = signToken(p, SECRET);
    expect(verifyToken(token, SECRET)).toEqual(p);
  });

  it("lehnt Token mit falschem Secret ab", () => {
    const token = signToken(payload(), SECRET);
    expect(verifyToken(token, "anderes-secret")).toBeNull();
  });

  it("lehnt manipulierte Payload ab (Rollen-Eskalation)", () => {
    const token = signToken(payload(), SECRET);
    const [, sig] = token.split(".");
    const boese = Buffer.from(
      JSON.stringify({ ...payload(), rolle: "chef" }),
    ).toString("base64url");
    expect(verifyToken(`${boese}.${sig}`, SECRET)).toBeNull();
  });

  it("lehnt abgelaufenes exp ab — auch mit gueltiger Signatur", () => {
    const abgelaufen = { ...payload(), exp: Date.now() - 1000 };
    const token = signToken(abgelaufen, SECRET);
    expect(verifyToken(token, SECRET)).toBeNull();
  });

  it("lehnt fehlendes/nicht-numerisches exp ab", () => {
    const ohneExp = { kuerzel: "MW", name: "Marwan Saleh", rolle: "pruefer" };
    expect(verifyToken(signToken(ohneExp, SECRET), SECRET)).toBeNull();
    const stringExp = { ...ohneExp, exp: "9999999999999" };
    expect(verifyToken(signToken(stringExp, SECRET), SECRET)).toBeNull();
  });

  it("lehnt Muell-Tokens ab statt zu werfen", () => {
    expect(verifyToken("", SECRET)).toBeNull();
    expect(verifyToken("nur-ein-teil", SECRET)).toBeNull();
    expect(verifyToken("a.b.c", SECRET)).toBeNull();
    expect(verifyToken(null, SECRET)).toBeNull();
  });
});

// ── Rollen-Matrix ─────────────────────────────────────────────────────

describe("Rollen-Matrix", () => {
  it("kennt genau die drei Rollen empfang, pruefer, chef", () => {
    expect(Object.keys(ROLLEN_RECHTE).sort()).toEqual(["chef", "empfang", "pruefer"]);
  });

  it("empfang: schreiben ja, Status nein, loeschen nein", () => {
    expect(darfSchreiben("empfang")).toBe(true);
    expect(darfStatusSetzen("empfang")).toBe(false);
    expect(darfLoeschen("empfang")).toBe(false);
  });

  it("pruefer: schreiben ja, Status ja, loeschen nein", () => {
    expect(darfSchreiben("pruefer")).toBe(true);
    expect(darfStatusSetzen("pruefer")).toBe(true);
    expect(darfLoeschen("pruefer")).toBe(false);
  });

  it("chef: schreiben ja, Status ja, loeschen ja", () => {
    expect(darfSchreiben("chef")).toBe(true);
    expect(darfStatusSetzen("chef")).toBe(true);
    expect(darfLoeschen("chef")).toBe(true);
  });

  it("unbekannte Rollen sind fail-closed (alles false)", () => {
    for (const rolle of ["admin", "", null, undefined, "Chef"]) {
      expect(darfSchreiben(rolle)).toBe(false);
      expect(darfStatusSetzen(rolle)).toBe(false);
      expect(darfLoeschen(rolle)).toBe(false);
    }
  });
});
