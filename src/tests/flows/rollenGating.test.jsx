/**
 * Flow 2 — Rollen-Gating durch die gerenderte UI (nicht nur rechteFuerRolle).
 *
 * Eingeloggt als empfang: an der Termin-Zeile existiert weder Lösch- noch
 * Status-Button, die Sidebar zeigt keine Admin-Aktionen. Als chef ist
 * beides vorhanden — dieselbe UI, nur andere Rolle aus /auth/me.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

vi.mock("../../db/apiClient", () => import("./apiClientMock.js"));
vi.mock("sonner", () => {
  const toastFn = vi.fn();
  toastFn.success = vi.fn();
  toastFn.error = vi.fn();
  toastFn.warning = vi.fn();
  return { toast: toastFn, Toaster: () => null };
});

import * as api from "../../db/apiClient";
import { primeApi, renderApp, BENUTZER, terminFixture } from "./testUtils";

const apiMock = vi.mocked(api);

beforeEach(() => {
  vi.resetAllMocks();
  window.localStorage.removeItem(api.TOKEN_STORAGE_KEY);
});

/** Rendert die App eingeloggt und wartet, bis die Termin-Zeile sichtbar ist. */
async function renderTagesplanAls(benutzer) {
  primeApi(apiMock, { benutzer, termine: [terminFixture()] }); // Status "Geplant" → Advance-Button möglich
  renderApp();
  await screen.findByText("H-AB 1234", {}, { timeout: 10_000 });
}

describe("Flow: Rollen-Gating in Tagesplan + Sidebar", () => {
  it("empfang: kein Lösch-/Status-Button an der Zeile, Sidebar ohne 'Alle Daten löschen'", async () => {
    await renderTagesplanAls(BENUTZER.empfang);

    expect(screen.queryByRole("button", { name: "Löschen" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Starten" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Alle Daten löschen/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Beispieldaten laden/ })).not.toBeInTheDocument();

    // Empfang darf weiterhin anlegen/bearbeiten und Mängel ANSEHEN
    expect(screen.getByRole("button", { name: "Termin anlegen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bearbeiten" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mängel erfassen" })).toBeInTheDocument();
  }, 15000);

  it("chef: Status-Button 'Starten', Lösch-Button und 'Alle Daten löschen' vorhanden", async () => {
    await renderTagesplanAls(BENUTZER.chef);

    expect(screen.getByRole("button", { name: "Starten" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Löschen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Alle Daten löschen/ })).toBeInTheDocument();
  }, 15000);
});
