/**
 * Tests fuer den useDb-Hook (src/hooks/useDb.ts) — die riskanteste Stelle
 * des Daten-Layers: Optimistic Updates mit Rollback bei API-Fehlern.
 *
 * Teststrategie:
 *   - apiClient wird komplett gemockt (vi.mock) — kein Netzwerk, keine DB.
 *   - Fuer Rollback-Tests wird der API-Call als Deferred-Promise gemockt,
 *     damit wir den optimistischen Zwischenzustand VOR der Server-Antwort
 *     beobachten koennen.
 *   - Die Tests laufen alle unter 5 Sekunden ab, damit der Polling-Timer
 *     (POLL_INTERVAL_MS = 5000) nie feuert — keine Fake-Timer noetig.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("../../db/apiClient", () => ({
  initDatabase: vi.fn(),
  listHalter: vi.fn(),
  listFahrzeuge: vi.fn(),
  listTermine: vi.fn(),
  addHalter: vi.fn(),
  updHalter: vi.fn(),
  delHalter: vi.fn(),
  addFahrzeug: vi.fn(),
  updFahrzeug: vi.fn(),
  delFahrzeug: vi.fn(),
  addTermin: vi.fn(),
  updTermin: vi.fn(),
  delTermin: vi.fn(),
  updTerminStatus: vi.fn(),
  listMangelByTermin: vi.fn(),
  addMangel: vi.fn(),
  delMangel: vi.fn(),
  countFahrzeuge: vi.fn(),
  clearAllDataTables: vi.fn(),
  loadDemoData: vi.fn(),
}));

import * as api from "../../db/apiClient";
import type { TerminMitMaengeln } from "../../db/apiClient";
import { useDb } from "../../hooks/useDb";
import type { Fahrzeug, Halter, Mangel, Termin } from "../../db/types";

const apiMock = vi.mocked(api);

// Deferred-Promise: der Test entscheidet selbst, wann (und ob erfolgreich)
// der gemockte API-Call abschliesst.
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// ── Fixtures (DB-Form, wie sie die API liefert) ──
const HALTER_1: Halter = {
  halterId: "11111111-1111-4111-8111-111111111111",
  name: "Klaus Müller",
  telefon: "0176 1234567",
  email: "k.mueller@mail.de",
  anschrift: null,
  erfasstAm: "2026-05-01T08:00:00.000Z",
};

const FZ_1: Fahrzeug = {
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
  halterId: HALTER_1.halterId,
  erfasstAm: "2026-05-01T08:05:00.000Z",
};

const MANGEL_1: Mangel = {
  mangelId: "33333333-3333-4333-8333-333333333333",
  terminId: "44444444-4444-4444-8444-444444444444",
  codeStvzo: "6.1.a",
  beschreibung: "Bremsscheibe verschlissen",
  kategorieCode: "GM",
  behoben: false,
  erfasstAm: "2026-07-01T09:00:00.000Z",
};

const TERMIN_1: Termin = {
  terminId: "44444444-4444-4444-8444-444444444444",
  fahrzeugId: FZ_1.fahrzeugId,
  datum: "2026-07-10",
  uhrzeit: "08:30:00",
  prueftCode: "HU",
  prueferKuerzel: "MW",
  statusCode: "In Prüfung",
  notiz: "Kunde wartet",
  erfasstAm: "2026-07-01T08:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  apiMock.initDatabase.mockResolvedValue(undefined);
  apiMock.listHalter.mockResolvedValue([HALTER_1]);
  apiMock.listFahrzeuge.mockResolvedValue([FZ_1]);
  const terminMitMaengeln: TerminMitMaengeln = { ...TERMIN_1, maengel: [MANGEL_1] };
  apiMock.listTermine.mockResolvedValue([terminMitMaengeln]);
});

// Rendert den Hook und wartet den initialen Load ab (ready === true).
async function renderReadyHook() {
  const rendered = renderHook(() => useDb());
  await waitFor(() => expect(rendered.result.current.ready).toBe(true));
  return rendered;
}

describe("useDb — initialer Load", () => {
  it("befüllt State aus der API und setzt ready", async () => {
    const { result } = await renderReadyHook();

    expect(apiMock.initDatabase).toHaveBeenCalledTimes(1);
    expect(apiMock.listTermine).toHaveBeenCalledWith({ includeMaengel: true });
    expect(result.current.error).toBeNull();
    expect(result.current.halter).toEqual([HALTER_1]);
    expect(result.current.fahrzeuge).toEqual([FZ_1]);
    // Termine kommen mit eingebettetem maengel-Array (includeMaengel) an
    expect(result.current.termine).toHaveLength(1);
    expect(result.current.termine[0].terminId).toBe(TERMIN_1.terminId);
    expect(result.current.termine[0].maengel).toEqual([MANGEL_1]);
  });

  it("setzt error, wenn die API beim Start nicht erreichbar ist", async () => {
    apiMock.initDatabase.mockRejectedValue(new Error("API nicht erreichbar"));
    const { result } = renderHook(() => useDb());

    await waitFor(() => expect(result.current.error).toBe("API nicht erreichbar"));
    expect(result.current.ready).toBe(false);
  });
});

describe("useDb — addFahrzeug (Optimistic Insert + Rollback)", () => {
  const NEU_ID = "55555555-5555-4555-8555-555555555555";
  const neuesFz = {
    fahrzeugId: NEU_ID,
    kennzeichen: "H-NE 999",
    hersteller: "Audi",
    modell: "A4",
    typ: "PKW",
    halterId: HALTER_1.halterId,
  };

  it("Insert erscheint sofort optimistisch, Server-Ergebnis ersetzt ihn danach", async () => {
    const { result } = await renderReadyHook();

    const serverFz: Fahrzeug = {
      ...neuesFz,
      fin: null,
      baujahr: null,
      farbe: null,
      kilometerstand: null,
      huFaellig: null,
      erfasstAm: "2026-07-04T10:00:00.000Z", // Server-Timestamp
    };
    const d = deferred<Fahrzeug>();
    apiMock.addFahrzeug.mockReturnValue(d.promise);

    let p!: Promise<Fahrzeug>;
    act(() => {
      p = result.current.addFahrzeug(neuesFz);
    });

    // Optimistisch: sofort im State, noch bevor der Server geantwortet hat
    expect(result.current.fahrzeuge).toHaveLength(2);
    expect(result.current.fahrzeuge[0].fahrzeugId).toBe(NEU_ID);
    expect(apiMock.addFahrzeug).toHaveBeenCalledWith(
      expect.objectContaining({ fahrzeugId: NEU_ID, kennzeichen: "H-NE 999" }),
    );

    await act(async () => {
      d.resolve(serverFz);
      await p;
    });

    // Server-Version (mit Server-erfasstAm) hat den optimistischen Eintrag ersetzt
    expect(result.current.fahrzeuge).toEqual([serverFz, FZ_1]);
  });

  it("rollt bei API-Fehler auf den Stand vor dem Insert zurück", async () => {
    const { result } = await renderReadyHook();

    const d = deferred<Fahrzeug>();
    apiMock.addFahrzeug.mockReturnValue(d.promise);

    let p!: Promise<Fahrzeug>;
    act(() => {
      p = result.current.addFahrzeug(neuesFz);
    });
    const abgefangen = p.catch(() => {});

    expect(result.current.fahrzeuge).toHaveLength(2); // optimistisch drin

    await act(async () => {
      d.reject(new Error("API down"));
      await abgefangen;
    });

    await expect(p).rejects.toThrow("API down");
    expect(result.current.fahrzeuge).toEqual([FZ_1]); // Rollback: alter Snapshot
  });
});

describe("useDb — addFahrzeugMitHalter (Halter-Dedupe)", () => {
  const fzInput = {
    kennzeichen: "H-NE 999",
    fin: null,
    hersteller: "Audi",
    modell: "A4",
    baujahr: 2021,
    farbe: "Rot",
    typ: "PKW",
    kilometerstand: 50000,
    huFaellig: "2027-01-01",
  };

  it("legt neuen Halter an und ruft addFahrzeug mit dessen halterId auf", async () => {
    const { result } = await renderReadyHook();

    apiMock.addHalter.mockImplementation(async (h) => ({
      halterId: h.halterId!,
      name: h.name,
      telefon: h.telefon ?? null,
      email: h.email ?? null,
      anschrift: h.anschrift ?? null,
      erfasstAm: "2026-07-05T10:00:00.000Z",
    }));
    apiMock.addFahrzeug.mockImplementation(async (f) => ({
      ...fzInput,
      ...f,
      fahrzeugId: f.fahrzeugId!,
      halterId: f.halterId,
      erfasstAm: "2026-07-05T10:00:00.000Z",
    }) as Fahrzeug);

    let neu!: Fahrzeug;
    await act(async () => {
      neu = await result.current.addFahrzeugMitHalter(fzInput, {
        name: "Neue Person",
        telefon: "0511 998877",
        email: "neu@person.de",
      });
    });

    expect(apiMock.addHalter).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Neue Person",
        telefon: "0511 998877",
        email: "neu@person.de",
      }),
    );
    expect(apiMock.updHalter).not.toHaveBeenCalled();
    // Exakte DB-Feldnamen + halterId des frisch angelegten Halters
    const neueHalterId = apiMock.addHalter.mock.calls[0][0].halterId;
    expect(apiMock.addFahrzeug).toHaveBeenCalledWith(
      expect.objectContaining({
        kennzeichen: "H-NE 999",
        kilometerstand: 50000,
        huFaellig: "2027-01-01",
        halterId: neueHalterId,
      }),
    );
    expect(neu.halterId).toBe(neueHalterId);
  });

  it("Halter-Dedupe: gleicher Name (case-insensitive, getrimmt) reused halterId", async () => {
    const { result } = await renderReadyHook();

    apiMock.addFahrzeug.mockImplementation(async (f) => ({
      ...fzInput,
      ...f,
      fahrzeugId: f.fahrzeugId!,
      erfasstAm: "2026-07-05T10:00:00.000Z",
    }) as Fahrzeug);

    await act(async () => {
      await result.current.addFahrzeugMitHalter(fzInput, {
        name: "  klaus müller ", // existiert bereits als "Klaus Müller"
        telefon: HALTER_1.telefon,
        email: HALTER_1.email,
      });
    });

    expect(apiMock.addHalter).not.toHaveBeenCalled();
    expect(apiMock.updHalter).not.toHaveBeenCalled(); // Kontaktdaten identisch → kein Silent-Update
    expect(apiMock.addFahrzeug).toHaveBeenCalledWith(
      expect.objectContaining({ halterId: HALTER_1.halterId }),
    );
  });

  it("Halter-Dedupe: abweichende Kontaktdaten werden still beim Halter ergänzt", async () => {
    const { result } = await renderReadyHook();

    apiMock.updHalter.mockImplementation(async (id, p) => ({
      ...HALTER_1,
      ...p,
      halterId: id,
    }) as Halter);
    apiMock.addFahrzeug.mockImplementation(async (f) => ({
      ...fzInput,
      ...f,
      fahrzeugId: f.fahrzeugId!,
      erfasstAm: "2026-07-05T10:00:00.000Z",
    }) as Fahrzeug);

    await act(async () => {
      await result.current.addFahrzeugMitHalter(fzInput, {
        name: "Klaus Müller",
        telefon: "0176 0000000", // neu
        email: HALTER_1.email,
      });
    });

    expect(apiMock.addHalter).not.toHaveBeenCalled();
    expect(apiMock.updHalter).toHaveBeenCalledWith(HALTER_1.halterId, {
      telefon: "0176 0000000",
      email: HALTER_1.email,
    });
    expect(apiMock.addFahrzeug).toHaveBeenCalledWith(
      expect.objectContaining({ halterId: HALTER_1.halterId }),
    );
  });
});

describe("useDb — updTermin (Optimistic Patch + Rollback)", () => {
  it("Patch erscheint sofort, wird bei API-Fehler zurückgerollt", async () => {
    const { result } = await renderReadyHook();

    const d = deferred<Termin | null>();
    apiMock.updTermin.mockReturnValue(d.promise);

    let p!: Promise<Termin | null>;
    act(() => {
      p = result.current.updTermin(TERMIN_1.terminId, { notiz: "geändert" });
    });
    const abgefangen = p.catch(() => {});

    // Optimistisch gepatcht
    expect(result.current.termine[0].notiz).toBe("geändert");

    await act(async () => {
      d.reject(new Error("HTTP 500"));
      await abgefangen;
    });

    await expect(p).rejects.toThrow("HTTP 500");
    expect(result.current.termine[0].notiz).toBe(TERMIN_1.notiz); // Rollback
    expect(result.current.termine[0].maengel).toEqual([MANGEL_1]); // Mängel unversehrt
  });

  it("Erfolgsfall: Server-Ergebnis wird in den Termin gemergt", async () => {
    const { result } = await renderReadyHook();

    apiMock.updTermin.mockResolvedValue({ ...TERMIN_1, notiz: "vom Server" });

    await act(async () => {
      await result.current.updTermin(TERMIN_1.terminId, { notiz: "vom Server" });
    });

    expect(result.current.termine[0].notiz).toBe("vom Server");
    expect(result.current.termine[0].maengel).toEqual([MANGEL_1]);
  });
});

describe("useDb — delFahrzeug (Optimistic Delete + Rollback)", () => {
  it("entfernt Fahrzeug + zugehörige Termine sofort, stellt beide bei Fehler wieder her", async () => {
    const { result } = await renderReadyHook();

    const d = deferred<void>();
    apiMock.delFahrzeug.mockReturnValue(d.promise);

    let p!: Promise<void>;
    act(() => {
      p = result.current.delFahrzeug(FZ_1.fahrzeugId);
    });
    const abgefangen = p.catch(() => {});

    // Optimistisch weg — inklusive der Termine des Fahrzeugs
    expect(result.current.fahrzeuge).toHaveLength(0);
    expect(result.current.termine).toHaveLength(0);

    await act(async () => {
      d.reject(new Error("FK-Constraint"));
      await abgefangen;
    });

    await expect(p).rejects.toThrow("FK-Constraint");
    expect(result.current.fahrzeuge).toEqual([FZ_1]);       // Rollback Fahrzeuge
    expect(result.current.termine).toHaveLength(1);          // Rollback Termine
    expect(result.current.termine[0].terminId).toBe(TERMIN_1.terminId);
  });
});

describe("useDb — addMangel (Erfolgsfall: Server-Ergebnis mergen)", () => {
  const NEU_MANGEL_ID = "66666666-6666-4666-8666-666666666666";
  const neuerMangel = {
    mangelId: NEU_MANGEL_ID,
    terminId: TERMIN_1.terminId,
    beschreibung: "Handbremse ohne Wirkung",
    kategorieCode: "EM",
  };

  it("hängt den Server-Mangel an den Termin und übernimmt die Auto-Demotion", async () => {
    const { result } = await renderReadyHook();

    const serverMangel: Mangel = {
      ...neuerMangel,
      codeStvzo: "6.2.b",
      behoben: false,
      erfasstAm: "2026-07-04T11:00:00.000Z",
    };
    apiMock.addMangel.mockResolvedValue({ mangel: serverMangel, terminDemoted: true });

    await act(async () => {
      await result.current.addMangel(neuerMangel);
    });

    expect(apiMock.addMangel).toHaveBeenCalledWith(
      expect.objectContaining({ mangelId: NEU_MANGEL_ID, terminId: TERMIN_1.terminId }),
    );
    const termin = result.current.termine[0];
    // Server-Version (mit codeStvzo + Server-Timestamp) ersetzt den optimistischen Eintrag
    expect(termin.maengel).toEqual([MANGEL_1, serverMangel]);
    // terminDemoted: true → Status wurde auf "Nicht bestanden" gesetzt (WF-01)
    expect(termin.statusCode).toBe("Nicht bestanden");
  });

  it("rollt bei API-Fehler den Mängel-Stand des Termins zurück", async () => {
    const { result } = await renderReadyHook();

    const d = deferred<{ mangel: Mangel; terminDemoted: boolean }>();
    apiMock.addMangel.mockReturnValue(d.promise);

    let p!: ReturnType<typeof result.current.addMangel>;
    act(() => {
      p = result.current.addMangel(neuerMangel);
    });
    const abgefangen = p.catch(() => {});

    expect(result.current.termine[0].maengel).toHaveLength(2); // optimistisch drin

    await act(async () => {
      d.reject(new Error("422 Validation"));
      await abgefangen;
    });

    await expect(p).rejects.toThrow("422 Validation");
    expect(result.current.termine[0].maengel).toEqual([MANGEL_1]); // Rollback
  });
});
