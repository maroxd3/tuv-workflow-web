/**
 * Flow 3 — Termin anlegen durch die UI (Tagesplan → TerminModal → useDb → API).
 *
 * Klick auf "Termin anlegen", Fahrzeug/Datum/Zeit/Prüfart im Modal setzen,
 * Speichern: addTermin des gemockten apiClient muss die DB-Feldnamen
 * (fahrzeugId, datum, uhrzeit, prueftCode, statusCode) bekommen und der
 * neue Termin muss sofort im Tagesplan auftauchen (Optimistic Update).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, within, waitFor, fireEvent } from "@testing-library/react";
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
import { primeApi, renderApp, BENUTZER, FZ_1, HEUTE } from "./testUtils";

const apiMock = vi.mocked(api);

beforeEach(() => {
  vi.resetAllMocks();
  window.localStorage.removeItem(api.TOKEN_STORAGE_KEY);
});

describe("Flow: Termin anlegen", () => {
  it("TerminModal → addTermin mit DB-Feldern, Termin erscheint im Tagesplan", async () => {
    const termineData = []; // leer → kein Duplikat-Dialog, Zähler 0 → 1
    primeApi(apiMock, { benutzer: BENUTZER.chef, termine: termineData });
    apiMock.addTermin.mockImplementation(async (t) => {
      const termin = { ...t, erfasstAm: "2026-07-05T09:00:00.000Z" };
      termineData.push({ ...termin, maengel: [] }); // Poll-Refresh bleibt konsistent
      return termin;
    });
    const user = userEvent.setup();
    renderApp();

    expect(
      await screen.findByText(/Tagesplan — 0 Termine/, {}, { timeout: 10_000 }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Termin anlegen" }));
    const dialog = await screen.findByRole("dialog", { name: "Prüftermin anlegen" });

    // Fahrzeug wählen + Datum/Zeit/Prüfart setzen
    await user.selectOptions(within(dialog).getByLabelText("Fahrzeug *"), FZ_1.fahrzeugId);
    fireEvent.change(within(dialog).getByLabelText("Datum *"), { target: { value: HEUTE } });
    await user.selectOptions(within(dialog).getByLabelText("Uhrzeit"), "09:30");
    await user.selectOptions(within(dialog).getByLabelText("Art der Prüfung"), "AU");

    await user.click(within(dialog).getByRole("button", { name: "Termin anlegen" }));

    // API bekommt exakt die DB-Shape (nicht die Formular-Shape)
    await waitFor(() =>
      expect(apiMock.addTermin).toHaveBeenCalledWith(
        expect.objectContaining({
          fahrzeugId: FZ_1.fahrzeugId,
          datum: HEUTE,
          uhrzeit: "09:30",
          prueftCode: "AU",
          prueferKuerzel: "MW",
          statusCode: "Geplant",
          notiz: null,
        }),
      ),
    );

    // Modal hat sich geschlossen (erst abwarten — waehrend der Exit-Animation
    // steht das Kennzeichen sonst doppelt im DOM: Zeile + Modal-Infobox)
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Prüftermin anlegen" })).not.toBeInTheDocument(),
    );

    // Neuer Termin sichtbar im Tagesplan (Header-Zähler + Kennzeichen-Zeile)
    expect(
      await screen.findByText(/Tagesplan — 1 Termine/, {}, { timeout: 10_000 }),
    ).toBeInTheDocument();
    expect(screen.getByText("H-AB 1234")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Termin angelegt");
  }, 15000);
});
