/**
 * WF-01 Defense-in-Depth: alle drei Verteidigungs-Layer sowie das
 * behoben=TRUE-Verhalten gegen den laufenden Docker-Stack pruefen.
 *
 * Vorbedingung: Stack muss laufen (`docker compose up -d`). Wenn nicht,
 * werden die Tests uebersprungen, damit `npm test` lokal ohne Docker nicht
 * fehlschlaegt.
 *
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach } from "vitest";
import { execSync } from "node:child_process";

const API = process.env.TUV_API_URL || "http://localhost:8787";
const MARIADB_CONTAINER = process.env.TUV_DB_CONTAINER || "tuv-mariadb";
const MARIADB_USER = process.env.MARIADB_USER || "tuv_app";
const MARIADB_PASSWORD = process.env.MARIADB_PASSWORD || "tuv_app_pw";
const MARIADB_DATABASE = process.env.MARIADB_DATABASE || "tuv_workflow";

// Pre-flight: pruefen, ob der Docker-Stack laeuft. Top-Level await, weil
// describe.skipIf(...) die Bedingung bei Test-Collection auswertet — wir
// muessen also schon vor der describe-Definition wissen, ob wir skippen.
const stackUp = await (async () => {
  try {
    const r = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    return false;
  }
})();

async function seedDemo() {
  const r = await fetch(`${API}/api/admin/demo`, { method: "POST" });
  if (!r.ok) throw new Error(`Demo-Seed fehlgeschlagen: HTTP ${r.status}`);
  return r.json();
}

async function listTermine() {
  return fetch(`${API}/api/termine`).then((r) => r.json());
}

async function listMaengel(terminId) {
  return fetch(`${API}/api/termine/${terminId}/maengel`).then((r) => r.json());
}

async function findTerminWithUnbehobenBlocker() {
  for (const t of await listTermine()) {
    const maengel = await listMaengel(t.terminId);
    const blocker = maengel.find(
      (m) => !m.behoben && (m.kategorieCode === "EM" || m.kategorieCode === "GfM"),
    );
    if (blocker) return { termin: t, maengel, blocker };
  }
  throw new Error("Kein Termin mit unbehobenem EM/GfM im Seed gefunden");
}

async function findTerminBestandenMitBehobenBlocker() {
  for (const t of await listTermine()) {
    if (t.statusCode !== "Bestanden") continue;
    const maengel = await listMaengel(t.terminId);
    const onlyBehobenBlocker =
      maengel.length > 0 &&
      maengel.every((m) => m.behoben || (m.kategorieCode !== "EM" && m.kategorieCode !== "GfM"));
    const hasBehobenBlocker = maengel.some(
      (m) => m.behoben && (m.kategorieCode === "EM" || m.kategorieCode === "GfM"),
    );
    if (hasBehobenBlocker && onlyBehobenBlocker) return { termin: t, maengel };
  }
  throw new Error("Kein Bestanden-Termin mit behobenem EM/GfM im Seed gefunden");
}

async function findCleanTermin() {
  for (const t of await listTermine()) {
    if (t.statusCode === "Bestanden") continue;
    const maengel = await listMaengel(t.terminId);
    const hasBlocker = maengel.some(
      (m) => !m.behoben && (m.kategorieCode === "EM" || m.kategorieCode === "GfM"),
    );
    if (!hasBlocker) return { termin: t, maengel };
  }
  throw new Error("Kein Nicht-Bestanden-Termin ohne Blocker im Seed gefunden");
}

beforeEach(async () => {
  if (!stackUp) return;
  await seedDemo();
});

const skipSqlBypass = process.env.TUV_SKIP_SQL_BYPASS === "1";

describe.skipIf(!stackUp)("WF-01 Defense-in-Depth", () => {
  it.skipIf(skipSqlBypass)("Layer 3 (DB-Trigger): direkter SQL-UPDATE wird abgelehnt", async () => {
    const { termin } = await findTerminWithUnbehobenBlocker();

    let stderr = "";
    let exitCode = 0;
    try {
      execSync(
        `docker exec ${MARIADB_CONTAINER} mariadb -u ${MARIADB_USER} -p${MARIADB_PASSWORD} ${MARIADB_DATABASE} -e "UPDATE termin SET status_code='Bestanden' WHERE termin_id='${termin.terminId}';"`,
        { stdio: ["ignore", "pipe", "pipe"] },
      );
    } catch (err) {
      stderr = String(err.stderr || err.message);
      exitCode = err.status ?? 1;
    }

    expect(exitCode).not.toBe(0);
    expect(stderr).toMatch(/ERROR 1644.*45000/);
    expect(stderr).toMatch(/WF-01/);

    const after = (await listTermine()).find((t) => t.terminId === termin.terminId);
    expect(after.statusCode).toBe(termin.statusCode);
  });

  it("Layer 2 (DB-Trigger via API): generischer PATCH liefert HTTP 422", async () => {
    const { termin } = await findTerminWithUnbehobenBlocker();

    const res = await fetch(`${API}/api/termine/${termin.terminId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusCode: "Bestanden" }),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.reason).toMatch(/WF-01/);

    const after = (await listTermine()).find((t) => t.terminId === termin.terminId);
    expect(after.statusCode).toBe(termin.statusCode);
  });

  it("Layer 1 (API-Guard): Status-Endpoint antwortet sauber mit ok:false", async () => {
    const { termin } = await findTerminWithUnbehobenBlocker();

    const res = await fetch(`${API}/api/termine/${termin.terminId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusCode: "Bestanden" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.reason).toMatch(/erheblichem|gefährlichem/i);

    const after = (await listTermine()).find((t) => t.terminId === termin.terminId);
    expect(after.statusCode).toBe(termin.statusCode);
  });

  it("Happy Path: Termin ohne blockierenden Mangel darf Bestanden werden", async () => {
    const { termin } = await findCleanTermin();

    const res = await fetch(`${API}/api/termine/${termin.terminId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusCode: "Bestanden" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.termin.statusCode).toBe("Bestanden");
  });

  it("behoben=TRUE-Maengel zaehlen nicht: Demote + Re-Bestanden funktioniert", async () => {
    const { termin } = await findTerminBestandenMitBehobenBlocker();

    const demote = await fetch(`${API}/api/termine/${termin.terminId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusCode: "Geplant" }),
    });
    expect(demote.status).toBe(200);

    const promote = await fetch(`${API}/api/termine/${termin.terminId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusCode: "Bestanden" }),
    });
    expect(promote.status).toBe(200);
    const body = await promote.json();
    expect(body.ok).toBe(true);
    expect(body.termin.statusCode).toBe("Bestanden");
  });

  it("Auto-Demotion: neuer unbehoben EM auf Bestanden-Termin setzt ihn auf Nicht bestanden", async () => {
    // Bestanden-Termin OHNE bestehende Maengel (Array.find mit async geht nicht
    // korrekt — daher hier expliziter Loop).
    const termine = await listTermine();
    let target = null;
    for (const t of termine) {
      if (t.statusCode !== "Bestanden") continue;
      const m = await listMaengel(t.terminId);
      if (m.length === 0) {
        target = t;
        break;
      }
    }
    expect(target).toBeDefined();
    expect(target).not.toBeNull();

    const post = await fetch(`${API}/api/maengel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        terminId: target.terminId,
        codeStvzo: "TEST.WF01",
        beschreibung: "Auto-Demotion-Test (unbehoben EM)",
        kategorieCode: "EM",
        behoben: false,
      }),
    });
    expect(post.status).toBe(201);
    const body = await post.json();
    expect(body.terminDemoted).toBe(true);

    const after = (await listTermine()).find((t) => t.terminId === target.terminId);
    expect(after.statusCode).toBe("Nicht bestanden");
  });

  it("Auto-Demotion: behoben=true blockierender Mangel laesst Termin auf Bestanden", async () => {
    const target = (await listTermine()).find((t) => t.statusCode === "Bestanden");
    expect(target).toBeDefined();

    const post = await fetch(`${API}/api/maengel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        terminId: target.terminId,
        codeStvzo: "TEST.WF01.behoben",
        beschreibung: "Behoben-Test (EM behoben=true)",
        kategorieCode: "EM",
        behoben: true,
      }),
    });
    expect(post.status).toBe(201);
    const body = await post.json();
    expect(body.terminDemoted).toBe(false);

    const after = (await listTermine()).find((t) => t.terminId === target.terminId);
    expect(after.statusCode).toBe("Bestanden");
  });
});

describe.skipIf(stackUp)("WF-01 (Docker-Stack nicht erreichbar — Tests uebersprungen)", () => {
  it.skip("Stack starten mit: docker compose up -d", () => {});
});
