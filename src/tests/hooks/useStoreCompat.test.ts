/**
 * Tests fuer den Kompatibilitaets-Adapter useStoreCompat
 * (src/hooks/useStoreCompat.ts) — das Feld-Mapping zwischen DB-Form
 * (fahrzeugId, kilometerstand, prueftCode, ...) und Legacy-View-Form
 * (id, kmStand, art, ...).
 *
 * Teststrategie:
 *   - useDb wird gemockt und liefert ein handgebautes UseDbResult-Objekt
 *     (plain vi.fn()s) — kein Netzwerk, keine echte State-Maschine.
 *   - Read-Richtung: DB-Form → Legacy-Form (Feld-Renames, "FR"-Default,
 *     Datums-/Uhrzeit-Normalisierung, Besitzer-Aufloesung via halterId).
 *   - Write-Richtung: Legacy-Form → DB-Form. Ein Tippfehler in einem
 *     Feldnamen (z. B. kmStand statt kilometerstand) laesst diese Tests
 *     fehlschlagen — genau die Bug-Klasse, die das Review moniert hat.
 *   - Halter-Dedupe in addFz (gleicher Name case-insensitive → Wiederverwendung).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("../../hooks/useDb", () => ({ useDb: vi.fn() }));

import { useDb } from "../../hooks/useDb";
import type { UseDbResult } from "../../hooks/useDb";
import { useStoreCompat } from "../../hooks/useStoreCompat";
import type {
  Fahrzeug,
  Halter,
  Mangel,
  NeuerHalter,
  NeuerMangel,
  NeuerTermin,
  NeuesFahrzeug,
  Termin,
} from "../../db/types";

const useDbMock = vi.mocked(useDb);

// ── Fixtures (DB-Form) ──
const HALTER_DB: Halter = {
  halterId: "11111111-1111-4111-8111-111111111111",
  name: "Klaus Müller",
  telefon: "0176 1234567",
  email: "k.mueller@mail.de",
  anschrift: null,
  erfasstAm: "2026-05-01T08:00:00.000Z",
};

const FZ_DB: Fahrzeug = {
  fahrzeugId: "22222222-2222-4222-8222-222222222222",
  kennzeichen: "H-AB 1234",
  fin: "WBA3A5C50CF256985",
  hersteller: "BMW",
  modell: "320d",
  baujahr: 2019,
  farbe: "Schwarz",
  typ: "PKW",
  kilometerstand: 87420,
  huFaellig: "2026-08-01",
  halterId: HALTER_DB.halterId,
  erfasstAm: "2026-05-02T09:00:00.000Z",
};

const MANGEL_OHNE_CODE: Mangel = {
  mangelId: "33333333-3333-4333-8333-333333333333",
  terminId: "44444444-4444-4444-8444-444444444444",
  codeStvzo: null, // → Legacy-Code "FR" (freier Mangel)
  beschreibung: "Wischerblatt porös",
  kategorieCode: "GM",
  behoben: false,
  erfasstAm: "2026-07-01T09:00:00.000Z",
};

const MANGEL_MIT_CODE: Mangel = {
  mangelId: "77777777-7777-4777-8777-777777777777",
  terminId: "44444444-4444-4444-8444-444444444444",
  codeStvzo: "6.1.a",
  beschreibung: "Bremsscheibe verschlissen",
  kategorieCode: "EM",
  behoben: true,
  erfasstAm: "2026-07-01T09:05:00.000Z",
};

const TERMIN_DB: UseDbResult["termine"][number] = {
  terminId: "44444444-4444-4444-8444-444444444444",
  fahrzeugId: FZ_DB.fahrzeugId,
  datum: new Date(2026, 6, 10), // 10.07.2026 — als Date-Objekt (mariadb-Treiber-Form)
  uhrzeit: "08:30:00",
  prueftCode: "HU",
  prueferKuerzel: "MW",
  statusCode: "In Prüfung",
  notiz: "Kunde wartet",
  erfasstAm: "2026-07-01T08:00:00.000Z",
  mängel: [MANGEL_OHNE_CODE, MANGEL_MIT_CODE],
};

const NEU_HALTER_ID = "88888888-8888-4888-8888-888888888888";
const NEU_FZ_ID = "99999999-9999-4999-8999-999999999999";

// Handgebautes UseDbResult: Daten + vi.fn()-Stubs mit minimal plausiblen
// Rueckgaben (addFz braucht halterId/fahrzeugId aus den Ergebnissen).
function makeDb(overrides: Partial<UseDbResult> = {}): UseDbResult {
  return {
    ready: true,
    error: null,
    halter: [HALTER_DB],
    fahrzeuge: [FZ_DB],
    termine: [TERMIN_DB],
    refresh: vi.fn(async () => {}),
    addHalter: vi.fn(async (h: NeuerHalter): Promise<Halter> => ({
      halterId: h.halterId ?? NEU_HALTER_ID,
      name: h.name,
      telefon: h.telefon ?? null,
      email: h.email ?? null,
      anschrift: h.anschrift ?? null,
      erfasstAm: "2026-07-04T10:00:00.000Z",
    })),
    updHalter: vi.fn(async () => null),
    delHalter: vi.fn(async () => {}),
    addFahrzeug: vi.fn(async (f: NeuesFahrzeug): Promise<Fahrzeug> => ({
      ...f,
      fahrzeugId: f.fahrzeugId ?? NEU_FZ_ID,
      fin: f.fin ?? null,
      baujahr: f.baujahr ?? null,
      farbe: f.farbe ?? null,
      kilometerstand: f.kilometerstand ?? null,
      huFaellig: f.huFaellig ?? null,
      erfasstAm: "2026-07-04T10:00:00.000Z",
    })),
    updFahrzeug: vi.fn(async () => null),
    delFahrzeug: vi.fn(async () => {}),
    addTermin: vi.fn(async (t: NeuerTermin): Promise<Termin> => ({
      ...t,
      terminId: t.terminId ?? "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      uhrzeit: t.uhrzeit ?? null,
      prueferKuerzel: t.prueferKuerzel ?? null,
      statusCode: t.statusCode ?? "Geplant",
      notiz: t.notiz ?? null,
      erfasstAm: "2026-07-04T10:00:00.000Z",
    })),
    updTermin: vi.fn(async () => null),
    delTermin: vi.fn(async () => {}),
    updTerminStatus: vi.fn(
      async (): ReturnType<UseDbResult["updTerminStatus"]> => ({
        ok: true,
        termin: { ...TERMIN_DB },
      }),
    ),
    addMangel: vi.fn(async (m: NeuerMangel) => ({
      mangel: {
        ...m,
        mangelId: m.mangelId ?? "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        codeStvzo: m.codeStvzo ?? null,
        behoben: m.behoben ?? false,
        erfasstAm: "2026-07-04T10:00:00.000Z",
      },
      terminDemoted: false,
    })),
    delMangel: vi.fn(async () => {}),
    resetAllData: vi.fn(async () => {}),
    loadDemoData: vi.fn(async () => {}),
    ...overrides,
  };
}

function renderCompat(db: UseDbResult) {
  useDbMock.mockReturnValue(db);
  return renderHook(() => useStoreCompat()).result;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Read-Richtung: DB-Form → Legacy-Form ──────────────────────────────

describe("useStoreCompat — Read-Mapping Fahrzeug", () => {
  it("mappt DB-Felder auf Legacy-Felder inkl. Besitzer-Auflösung via halterId", () => {
    const result = renderCompat(makeDb());

    expect(result.current.fahrzeuge).toEqual([{
      id: FZ_DB.fahrzeugId,             // fahrzeugId → id
      kennzeichen: "H-AB 1234",
      fin: "WBA3A5C50CF256985",
      hersteller: "BMW",
      modell: "320d",
      baujahr: 2019,
      farbe: "Schwarz",
      typ: "PKW",
      kmStand: 87420,                   // kilometerstand → kmStand
      besitzer: "Klaus Müller",         // halter.name via halterId
      telefon: "0176 1234567",          // halter.telefon
      email: "k.mueller@mail.de",       // halter.email
      hu_faellig: "2026-08-01",         // huFaellig → hu_faellig
      createdAt: "2026-05-02",          // erfasstAm → createdAt (Datum-Anteil)
    }]);
  });

  it("liefert besitzer '' wenn der Halter nicht (mehr) existiert", () => {
    const result = renderCompat(makeDb({ halter: [] }));

    expect(result.current.fahrzeuge[0].besitzer).toBe("");
    expect(result.current.fahrzeuge[0].telefon).toBeNull();
    expect(result.current.fahrzeuge[0].email).toBeNull();
  });
});

describe("useStoreCompat — Read-Mapping Termin + Mangel", () => {
  it("mappt Termin-Felder, normalisiert Datum (Date-Objekt, lokal) und Uhrzeit", () => {
    const result = renderCompat(makeDb());
    const t = result.current.termine[0];

    expect(t.id).toBe(TERMIN_DB.terminId);      // terminId → id
    expect(t.fahrzeugId).toBe(FZ_DB.fahrzeugId);
    expect(t.datum).toBe("2026-07-10");         // Date-Objekt → lokaler yyyy-mm-dd-String
    expect(t.uhrzeit).toBe("08:30");            // "08:30:00" → "08:30"
    expect(t.art).toBe("HU");                   // prueftCode → art
    expect(t.pruefer).toBe("MW");               // prueferKuerzel → pruefer
    expect(t.status).toBe("In Prüfung");        // statusCode → status
    expect(t.notiz).toBe("Kunde wartet");
    expect(t.createdAt).toBe("2026-07-01");
  });

  it("mappt Mängel: codeStvzo null → Code 'FR', sonst Code durchreichen", () => {
    const result = renderCompat(makeDb());

    expect(result.current.termine[0].mängel).toEqual([
      {
        id: MANGEL_OHNE_CODE.mangelId,   // mangelId → id
        code: "FR",                       // codeStvzo null → "FR" (freier Mangel)
        text: "Wischerblatt porös",       // beschreibung → text
        kat: "GM",                        // kategorieCode → kat
        behoben: false,
      },
      {
        id: MANGEL_MIT_CODE.mangelId,
        code: "6.1.a",                    // codeStvzo bleibt erhalten
        text: "Bremsscheibe verschlissen",
        kat: "EM",
        behoben: true,
      },
    ]);
  });
});

// ── Write-Richtung: Legacy-Form → DB-Form ─────────────────────────────

describe("useStoreCompat — addFz", () => {
  const legacyInput = {
    kennzeichen: "H-NE 999",
    fin: "",
    hersteller: "Audi",
    modell: "A4",
    baujahr: 2021,
    farbe: "Rot",
    typ: "PKW",
    kmStand: 50000,
    besitzer: "Neue Person",
    telefon: "0511 998877",
    email: "neu@person.de",
    hu_faellig: "2027-01-01",
  };

  it("legt neuen Halter an und ruft addFahrzeug mit DB-Feldnamen auf", async () => {
    const db = makeDb();
    const result = renderCompat(db);

    const r = await result.current.addFz(legacyInput);

    expect(db.addHalter).toHaveBeenCalledWith({
      name: "Neue Person",
      telefon: "0511 998877",
      email: "neu@person.de",
    });
    // Exakte DB-Feldnamen — ein Tippfehler (z. B. kmStand statt
    // kilometerstand) schlägt hier fehl.
    expect(db.addFahrzeug).toHaveBeenCalledWith({
      kennzeichen: "H-NE 999",
      fin: null,                    // "" → null
      hersteller: "Audi",
      modell: "A4",
      baujahr: 2021,
      farbe: "Rot",
      typ: "PKW",
      kilometerstand: 50000,        // kmStand → kilometerstand
      huFaellig: "2027-01-01",      // hu_faellig → huFaellig
      halterId: NEU_HALTER_ID,      // vom frisch angelegten Halter
    });
    expect(r.id).toBe(NEU_FZ_ID);
  });

  it("Halter-Dedupe: gleicher Name (case-insensitive, getrimmt) reused halterId", async () => {
    const db = makeDb();
    const result = renderCompat(db);

    await result.current.addFz({
      ...legacyInput,
      besitzer: "  klaus müller ",     // existiert bereits als "Klaus Müller"
      telefon: HALTER_DB.telefon,
      email: HALTER_DB.email,
    });

    expect(db.addHalter).not.toHaveBeenCalled();
    expect(db.updHalter).not.toHaveBeenCalled(); // Kontaktdaten identisch → kein Silent-Update
    expect(db.addFahrzeug).toHaveBeenCalledWith(
      expect.objectContaining({ halterId: HALTER_DB.halterId }),
    );
  });

  it("Halter-Dedupe: abweichende Kontaktdaten werden still beim Halter ergänzt", async () => {
    const db = makeDb();
    const result = renderCompat(db);

    await result.current.addFz({
      ...legacyInput,
      besitzer: "Klaus Müller",
      telefon: "0176 0000000",         // neu
      email: HALTER_DB.email,
    });

    expect(db.addHalter).not.toHaveBeenCalled();
    expect(db.updHalter).toHaveBeenCalledWith(HALTER_DB.halterId, {
      telefon: "0176 0000000",
      email: HALTER_DB.email,
    });
  });
});

describe("useStoreCompat — updFz", () => {
  it("remappt Fahrzeug-Felder (kmStand → kilometerstand, hu_faellig → huFaellig)", async () => {
    const db = makeDb();
    const result = renderCompat(db);

    await result.current.updFz(FZ_DB.fahrzeugId, {
      kmStand: 90000,
      hu_faellig: "2027-02-02",
      fin: "",
      farbe: "Blau",
    });

    expect(db.updHalter).not.toHaveBeenCalled(); // keine Besitzer-Felder im Patch
    expect(db.updFahrzeug).toHaveBeenCalledWith(FZ_DB.fahrzeugId, {
      kilometerstand: 90000,
      huFaellig: "2027-02-02",
      fin: null,
      farbe: "Blau",
    });
  });

  it("leitet Besitzer-Felder an updHalter des zugehörigen Halters weiter", async () => {
    const db = makeDb();
    const result = renderCompat(db);

    await result.current.updFz(FZ_DB.fahrzeugId, { besitzer: "Neuer Name" });

    expect(db.updHalter).toHaveBeenCalledWith(HALTER_DB.halterId, {
      name: "Neuer Name",
      telefon: undefined,
      email: undefined,
    });
    expect(db.updFahrzeug).not.toHaveBeenCalled(); // keine Fahrzeug-Felder im Patch
  });
});

describe("useStoreCompat — addTr / updTr", () => {
  it("addTr remappt art → prueftCode, pruefer → prueferKuerzel und setzt Defaults", async () => {
    const db = makeDb();
    const result = renderCompat(db);

    await result.current.addTr({
      fahrzeugId: FZ_DB.fahrzeugId,
      datum: "2026-07-15",
      uhrzeit: "",
      art: "AU",
      pruefer: "",
      notiz: "",
    });

    expect(db.addTermin).toHaveBeenCalledWith({
      fahrzeugId: FZ_DB.fahrzeugId,
      datum: "2026-07-15",
      uhrzeit: null,                // "" → null
      prueftCode: "AU",             // art → prueftCode
      prueferKuerzel: null,         // pruefer "" → null
      statusCode: "Geplant",        // Default
      notiz: null,
    });
  });

  it("updTr leitet Status-Wechsel über updTerminStatus (WF-01-Guard)", async () => {
    const db = makeDb();
    const result = renderCompat(db);

    await result.current.updTr(TERMIN_DB.terminId, { status: "Bestanden" });

    expect(db.updTerminStatus).toHaveBeenCalledWith(TERMIN_DB.terminId, "Bestanden");
    expect(db.updTermin).not.toHaveBeenCalled(); // keine weiteren Felder im Patch
  });

  it("updTr wirft, wenn der Status-Guard ablehnt", async () => {
    const db = makeDb({
      updTerminStatus: vi.fn(
        async (): ReturnType<UseDbResult["updTerminStatus"]> => ({
          ok: false,
          reason: "WF-01: blockierender Mangel offen",
        }),
      ),
    });
    const result = renderCompat(db);

    await expect(
      result.current.updTr(TERMIN_DB.terminId, { status: "Bestanden" }),
    ).rejects.toThrow(/WF-01/);
    expect(db.updTermin).not.toHaveBeenCalled();
  });

  it("updTr remappt Nicht-Status-Felder auf DB-Form", async () => {
    const db = makeDb();
    const result = renderCompat(db);

    await result.current.updTr(TERMIN_DB.terminId, {
      datum: "2026-08-01",
      art: "NP",
      pruefer: "",
      notiz: "Nachprüfung",
    });

    expect(db.updTerminStatus).not.toHaveBeenCalled();
    expect(db.updTermin).toHaveBeenCalledWith(TERMIN_DB.terminId, {
      datum: "2026-08-01",
      prueftCode: "NP",             // art → prueftCode
      prueferKuerzel: null,         // pruefer "" → null
      notiz: "Nachprüfung",
    });
  });
});

describe("useStoreCompat — addMangel / delMangel", () => {
  it("addMangel remappt text → beschreibung, kat → kategorieCode; Code 'FR' → codeStvzo null", async () => {
    const db = makeDb();
    const result = renderCompat(db);

    await result.current.addMangel(TERMIN_DB.terminId, {
      code: "FR",
      text: "Innenraumbeleuchtung defekt",
      kat: "GM",
    });

    expect(db.addMangel).toHaveBeenCalledWith({
      terminId: TERMIN_DB.terminId,
      codeStvzo: null,              // "FR" (freier Mangel) → null in der DB
      beschreibung: "Innenraumbeleuchtung defekt",
      kategorieCode: "GM",
      behoben: false,               // Default
    });
  });

  it("addMangel reicht echte StVZO-Codes durch", async () => {
    const db = makeDb();
    const result = renderCompat(db);

    await result.current.addMangel(TERMIN_DB.terminId, {
      code: "6.1.a",
      text: "Bremsscheibe verschlissen",
      kat: "EM",
      behoben: true,
    });

    expect(db.addMangel).toHaveBeenCalledWith(
      expect.objectContaining({ codeStvzo: "6.1.a", behoben: true }),
    );
  });

  it("delMangel ignoriert die Legacy-terminId und löscht per mangelId", async () => {
    const db = makeDb();
    const result = renderCompat(db);

    await result.current.delMangel(TERMIN_DB.terminId, MANGEL_OHNE_CODE.mangelId);

    expect(db.delMangel).toHaveBeenCalledWith(MANGEL_OHNE_CODE.mangelId);
  });
});
