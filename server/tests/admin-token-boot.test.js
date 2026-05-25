/**
 * Production-Boot-Guard: der Server muss sich weigern zu starten, wenn
 * NODE_ENV=production gesetzt ist und ADMIN_TOKEN fehlt. Sonst waeren die
 * /api/admin/*-Endpoints (DB-Reset, Demo-Reseed) im LAN oeffentlich, ohne
 * dass es jemand sofort merkt.
 *
 * Der Test spawnt den Server als Child-Prozess, weil die Pruefung beim
 * Modul-Laden passiert und process.exit(1) auslost — das laesst sich nicht
 * sauber inline im Vitest-Prozess testen.
 *
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const SERVER_ENTRY = resolve(
  fileURLToPath(import.meta.url),
  "..", "..", "index.js",
);

function runServer(env) {
  return new Promise((resolveResult) => {
    const child = spawn(process.execPath, [SERVER_ENTRY], {
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });

    // Sicherheits-Timeout: wenn der Server entgegen Erwartung doch hochfaehrt
    // (z. B. mit gesetztem Token), killen wir ihn, statt den Test ewig zu
    // blockieren.
    const killTimer = setTimeout(() => {
      child.kill("SIGTERM");
    }, 3000);

    child.on("exit", (code, signal) => {
      clearTimeout(killTimer);
      resolveResult({ code, signal, stdout, stderr });
    });
  });
}

describe("Production-Boot-Guard fuer ADMIN_TOKEN", () => {
  it("verweigert den Start bei NODE_ENV=production und leerem ADMIN_TOKEN", async () => {
    const r = await runServer({ NODE_ENV: "production", ADMIN_TOKEN: "" });

    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/FATAL: ADMIN_TOKEN must be set/);
  }, 8000);

  it("loggt im Dev-Modus die Warnung statt Fail-fast (NODE_ENV=development, leerer Token)", async () => {
    // In Dev darf der Token leer sein — der Server soll aber loud warnen, nicht
    // FATAL exit(1)en. Der eigentliche Server-Start kann je nach lokalem MariaDB
    // trotzdem fehlschlagen; geprueft wird hier nur, dass der Production-Guard
    // nicht falsch ausloest und die Dev-Warnung erscheint.
    const r = await runServer({ NODE_ENV: "development", ADMIN_TOKEN: "" });

    expect(r.stderr).not.toMatch(/FATAL: ADMIN_TOKEN/);
    const combined = r.stdout + r.stderr;
    expect(combined).toMatch(/ADMIN_TOKEN not set/);
  }, 8000);
});
