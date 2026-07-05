/**
 * Flow 1 — Login durch die echte UI (App → Auth-Gate → LoginView → AppShell).
 *
 * Geprueft wird die Verdrahtung, nicht die Einzelteile:
 *   me→401 ⇒ LoginView; Formular-Submit ⇒ authLogin; Erfolg ⇒ App-Shell mit
 *   Benutzernamen in der Topbar; 401 beim Login ⇒ Fehlermeldung, LoginView bleibt.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

describe("Flow: Login", () => {
  it("me → 401: LoginView erscheint, App-Shell (useDb) bleibt ungemountet", async () => {
    primeApi(apiMock, { benutzer: null });
    renderApp();

    expect(
      await screen.findByRole("button", { name: "Anmelden" }, { timeout: 10_000 }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Kürzel")).toBeInTheDocument();
    expect(screen.getByLabelText("Passwort")).toBeInTheDocument();
    // Auth-Gate: solange der Login offen ist, darf useDb nicht laufen
    // (kein Daten-Polling gegen eine 401-API).
    expect(apiMock.initDatabase).not.toHaveBeenCalled();
  });

  it("erfolgreicher Login: App-Shell erscheint, Topbar zeigt den Benutzernamen", async () => {
    primeApi(apiMock, { benutzer: null, termine: [terminFixture()] });
    apiMock.authLogin.mockResolvedValue({ token: "tok-123", benutzer: BENUTZER.chef });
    const user = userEvent.setup();
    renderApp();

    await user.type(await screen.findByLabelText("Kürzel", {}, { timeout: 10_000 }), "AD");
    await user.type(screen.getByLabelText("Passwort"), "geheim");
    await user.click(screen.getByRole("button", { name: "Anmelden" }));

    // Topbar zeigt den eingeloggten Benutzer + Rollen-Label
    expect(await screen.findByText("Administrator", {}, { timeout: 10_000 })).toBeInTheDocument();
    expect(screen.getByText("Chef")).toBeInTheDocument();
    expect(apiMock.authLogin).toHaveBeenCalledWith("AD", "geheim");
    expect(apiMock.setAuthToken).toHaveBeenCalledWith("tok-123");

    // AppShell hat die Daten geladen — Tagesplan mit der Termin-Fixture
    expect(
      await screen.findByText(/Tagesplan — 1 Termine/, {}, { timeout: 10_000 }),
    ).toBeInTheDocument();
    // Login-Formular ist weg
    expect(screen.queryByLabelText("Kürzel")).not.toBeInTheDocument();
  }, 15000);

  it("falsche Zugangsdaten: Fehlermeldung sichtbar, LoginView bleibt stehen", async () => {
    primeApi(apiMock, { benutzer: null });
    apiMock.authLogin.mockRejectedValue(new api.ApiError(401, "Kürzel oder Passwort falsch"));
    const user = userEvent.setup();
    renderApp();

    await user.type(await screen.findByLabelText("Kürzel", {}, { timeout: 10_000 }), "XX");
    await user.type(screen.getByLabelText("Passwort"), "falsch");
    await user.click(screen.getByRole("button", { name: "Anmelden" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Kürzel oder Passwort falsch");
    // LoginView bleibt: Felder + Button weiterhin da, keine App-Shell
    expect(screen.getByLabelText("Kürzel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anmelden" })).toBeInTheDocument();
    expect(screen.queryByText("Administrator")).not.toBeInTheDocument();
    expect(apiMock.initDatabase).not.toHaveBeenCalled();
  }, 15000);
});
