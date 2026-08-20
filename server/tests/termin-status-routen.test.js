/**
 * Regressionstests fuer die Rechte-Haertung der Termin-Routen.
 *
 * Regel: Der Status eines Termins wird AUSSCHLIESSLICH ueber
 * PATCH /api/termine/:id/status gesetzt. Nur dort greift
 * requireAuth("status") (Rolle pruefer/chef) und nur dort sitzt der
 * WF-01-Guard mit fachlicher Begruendung.
 *
 * Vorher konnten POST /api/termine und PATCH /api/termine/:id den
 * status_code mitschreiben — beide verlangen nur "schreiben". Damit
 * konnte die Rolle empfang ein Pruefergebnis setzen, obwohl die
 * Rechte-Matrix in server/auth.js das ausschliesst. Diese Tests halten
 * die Luecke geschlossen.
 *
 * Die Regel ist bewusst rollen-unabhaengig: die Routen lehnen statusCode
 * mit HTTP 400 ab, egal wer fragt. Das ist auch mit AUTH_ENABLED=false
 * (dev/CI-Default, jeder Request laeuft als Dev-Chef) pruefbar.
 *
 * Vorbedingung: laufender Stack (`docker compose up -d` bzw. die
 * API + MariaDB-Service in der CI). Sonst werden die Tests uebersprungen.
 *
 * @vitest-environment node
 */
import "dotenv/config";
import { describe, it, expect, beforeEach } from "vitest";

const API = process.env.TUV_API_URL || "http://localhost:8787";

// Pre-flight wie in wf01.test.js: describe.skipIf() wertet die Bedingung
// schon bei der Test-Collection aus, deshalb top-level await.
const stackUp = await (async () => {
  try {
    const r = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    return false;
  }
})();

async function seedDemo() {
  const r = await fetch(`${API}/api/admin/demo`, {
    method: "POST",
    headers: { "X-Admin-Token": process.env.ADMIN_TOKEN || "" },
  });
  if (!r.ok) throw new Error(`Demo-Seed fehlgeschlagen: HTTP ${r.status}`);
  return r.json();
}

const listTermine = () => fetch(`${API}/api/termine`).then((r) => r.json());

async function ersterFahrzeugId() {
  const fahrzeuge = await fetch(`${API}/api/fahrzeuge`).then((r) => r.json());
  expect(fahrzeuge.length).toBeGreaterThan(0);
  return fahrzeuge[0].fahrzeugId;
}

/** Termin mit Status 'Geplant' aus dem Seed. */
async function geplanterTermin() {
  const t = (await listTermine()).find((x) => x.statusCode === "Geplant");
  if (!t) throw new Error("Kein 'Geplant'-Termin im Seed gefunden");
  return t;
}

const postJson = (pfad, body) =>
  fetch(`${API}${pfad}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const patchJson = (pfad, body) =>
  fetch(`${API}${pfad}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// Weit in der Zukunft + eigene Uhrzeit pro Test: haelt den UNIQUE-Key
// (fahrzeug_id, datum, uhrzeit) frei von Kollisionen mit dem Seed.
const ZUKUNFT = "2099-01-15";

beforeEach(async () => {
  if (!stackUp) return;
  await seedDemo();
});

describe.skipIf(!stackUp)("Termin-Routen: Status nur über den Status-Endpunkt", () => {
  it("PATCH /api/termine/:id lehnt statusCode mit 400 ab und ändert nichts", async () => {
    const termin = await geplanterTermin();

    const res = await patchJson(`/api/termine/${termin.terminId}`, { statusCode: "Bestanden" });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.errors.map((e) => e.field)).toEqual(["statusCode"]);
    expect(body.errors[0].message).toMatch(/\/api\/termine\/:id\/status/);

    const nachher = (await listTermine()).find((t) => t.terminId === termin.terminId);
    expect(nachher.statusCode).toBe(termin.statusCode);
  });

  it("PATCH /api/termine/:id lehnt auch einen harmlosen Status ('Geplant') ab", async () => {
    const termin = await geplanterTermin();

    const res = await patchJson(`/api/termine/${termin.terminId}`, { statusCode: "Geplant" });

    expect(res.status).toBe(400);
    const nachher = (await listTermine()).find((t) => t.terminId === termin.terminId);
    expect(nachher.statusCode).toBe("Geplant");
  });

  it("PATCH /api/termine/:id ändert die übrigen Felder weiterhin normal", async () => {
    const termin = await geplanterTermin();

    const res = await patchJson(`/api/termine/${termin.terminId}`, { notiz: "Regressionstest" });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notiz).toBe("Regressionstest");
    expect(body.statusCode).toBe(termin.statusCode);
  });

  it("POST /api/termine lehnt einen mitgelieferten Status ab", async () => {
    const fahrzeugId = await ersterFahrzeugId();
    const vorher = (await listTermine()).length;

    const res = await postJson("/api/termine", {
      fahrzeugId,
      datum: ZUKUNFT,
      uhrzeit: "07:15:00",
      prueftCode: "HU",
      statusCode: "Bestanden",
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors.map((e) => e.field)).toEqual(["statusCode"]);

    // Nichts angelegt — die Validierung laeuft vor dem INSERT.
    expect((await listTermine()).length).toBe(vorher);
  });

  it("POST /api/termine legt ohne statusCode einen Termin mit 'Geplant' an", async () => {
    const fahrzeugId = await ersterFahrzeugId();

    const res = await postJson("/api/termine", {
      fahrzeugId,
      datum: ZUKUNFT,
      uhrzeit: "07:30:00",
      prueftCode: "HU",
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.statusCode).toBe("Geplant");
  });

  it("POST /api/termine akzeptiert statusCode 'Geplant' als No-op", async () => {
    const fahrzeugId = await ersterFahrzeugId();

    const res = await postJson("/api/termine", {
      fahrzeugId,
      datum: ZUKUNFT,
      uhrzeit: "07:45:00",
      prueftCode: "HU",
      statusCode: "Geplant",
    });

    expect(res.status).toBe(201);
    expect((await res.json()).statusCode).toBe("Geplant");
  });

  it("Der Status-Endpunkt setzt den Status weiterhin", async () => {
    const termin = await geplanterTermin();

    const res = await patchJson(`/api/termine/${termin.terminId}/status`, {
      statusCode: "In Prüfung",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.termin.statusCode).toBe("In Prüfung");
  });
});

describe.skipIf(stackUp)("Termin-Routen (Stack nicht erreichbar — Tests uebersprungen)", () => {
  it.skip("Stack starten mit: docker compose up -d", () => {});
});
