/**
 * Flow 5 — Fahrzeug-Anlage-Validierung durch die UI
 * (Sidebar-Navigation → FahrzeugeView → FahrzeugModal → useDb → API).
 *
 * Leere Pflichtfelder / ungültiges Kennzeichen: Fehlermeldungen erscheinen,
 * die API wird NICHT gerufen. Gültige Eingabe: addFahrzeugMitHalter läuft
 * seinen echten useDb-Weg (addHalter → addFahrzeug) mit korrekten DB-Feldern.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../../db/apiClient", () => import("./apiClientMock.js"));
vi.mock("sonner", () => {
  const toastFn = vi.fn();
  toastFn.success = vi.fn();
  toastFn.error = vi.fn();
  toastFn.warning = vi.fn();
  return { toast: toastFn, Toaster: () => null };
});

import { toast } from "sonner";
import * as api from "../../db/apiClient";
import { primeApi, renderApp, BENUTZER, FZ_1, HALTER_1 } from "./testUtils";

const apiMock = vi.mocked(api);

beforeEach(() => {
  vi.resetAllMocks();
  window.localStorage.removeItem(api.TOKEN_STORAGE_KEY);
});

/** App als chef rendern, zur Fahrzeuge-View navigieren, Modal öffnen. */
async function openFahrzeugModal(user) {
  renderApp();
  await user.click(await screen.findByRole("button", { name: "Fahrzeuge" }, { timeout: 10_000 }));
  await user.click(
    await screen.findByRole("button", { name: "Fahrzeug erfassen" }, { timeout: 10_000 }),
  );
  return await screen.findByRole("dialog", { name: "Fahrzeug neu erfassen" });
}

/**
 * Füllt das Formular gültig aus (Hersteller über den "Sonstiger"-Zweig,
 * damit keine Referenzlisten-Konsistenzprüfung greift).
 */
async function fillForm(dialog, user, { kennzeichen = "H-XY 999" } = {}) {
  const d = within(dialog);
  await user.type(d.getByLabelText("Kennzeichen *"), kennzeichen);
  await user.selectOptions(d.getByLabelText("Hersteller *"), "__SONSTIGER__");
  await user.type(d.getByPlaceholderText("z. B. Tatra, Lada, Tuning-Werkstatt"), "Tatra");
  await user.type(d.getByLabelText("Modell / Variante *"), "815");
  await user.type(d.getByLabelText("Name / Firma *"), "Karin Test");
}

describe("Flow: Fahrzeug-Anlage", () => {
  it("leeres Formular: Pflichtfeld-Fehler erscheinen, keine API-Calls", async () => {
    primeApi(apiMock, { benutzer: BENUTZER.chef });
    const user = userEvent.setup();
    const dialog = await openFahrzeugModal(user);

    await user.click(within(dialog).getByRole("button", { name: "Fahrzeug erfassen" }));

    // Kennzeichen, Hersteller, Modell, Halter-Name → 4× "Pflichtfeld"
    expect(await within(dialog).findAllByText("Pflichtfeld")).toHaveLength(4);
    expect(apiMock.addHalter).not.toHaveBeenCalled();
    expect(apiMock.addFahrzeug).not.toHaveBeenCalled();
    // Modal bleibt offen
    expect(screen.getByRole("dialog", { name: "Fahrzeug neu erfassen" })).toBeInTheDocument();
  }, 15000);

  it("ungültiges Kennzeichen (unbekannter Kreis-Code): Fehler, keine API-Calls", async () => {
    primeApi(apiMock, { benutzer: BENUTZER.chef });
    const user = userEvent.setup();
    const dialog = await openFahrzeugModal(user);

    await fillForm(dialog, user, { kennzeichen: "ZZZ-AB 123" });
    await user.click(within(dialog).getByRole("button", { name: "Fahrzeug erfassen" }));

    expect(
      await within(dialog).findByText(/kein gültiger Kreis-Code/),
    ).toBeInTheDocument();
    expect(apiMock.addHalter).not.toHaveBeenCalled();
    expect(apiMock.addFahrzeug).not.toHaveBeenCalled();
  }, 15000);

  it("gültige Eingabe: addHalter + addFahrzeug mit korrekten DB-Feldern", async () => {
    const fahrzeugeData = [FZ_1];
    const halterData = [HALTER_1];
    primeApi(apiMock, { benutzer: BENUTZER.chef, fahrzeuge: fahrzeugeData, halter: halterData });
    apiMock.addHalter.mockImplementation(async (h) => {
      const halter = {
        halterId: h.halterId,
        name: h.name,
        telefon: h.telefon ?? null,
        email: h.email ?? null,
        anschrift: null,
        erfasstAm: "2026-07-05T10:00:00.000Z",
      };
      halterData.push(halter);
      return halter;
    });
    apiMock.addFahrzeug.mockImplementation(async (f) => {
      const fz = { ...f, erfasstAm: "2026-07-05T10:00:00.000Z" };
      fahrzeugeData.push(fz);
      return fz;
    });
    const user = userEvent.setup();
    const dialog = await openFahrzeugModal(user);

    await fillForm(dialog, user);
    await user.click(within(dialog).getByRole("button", { name: "Fahrzeug erfassen" }));

    await waitFor(() => expect(apiMock.addFahrzeug).toHaveBeenCalledTimes(1));

    // Halter neu angelegt (kein Dedupe-Treffer bei "Karin Test") ...
    expect(apiMock.addHalter).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Karin Test" }),
    );
    // ... und das Fahrzeug hängt per halterId am frisch angelegten Halter
    const neueHalterId = apiMock.addHalter.mock.calls[0][0].halterId;
    expect(apiMock.addFahrzeug).toHaveBeenCalledWith(
      expect.objectContaining({
        kennzeichen: "H-XY 999",
        hersteller: "Tatra",
        modell: "815",
        typ: "PKW",
        fin: null,
        halterId: neueHalterId,
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Fahrzeug erfasst");

    // Modal schließt, neue Fahrzeug-Karte erscheint im Grid
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Fahrzeug neu erfassen" })).not.toBeInTheDocument(),
    );
    expect(screen.getByText("H-XY 999")).toBeInTheDocument();
  }, 15000);
});
