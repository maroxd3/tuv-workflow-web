/**
 * Tests fuer den AuthContext (src/auth/AuthContext.tsx).
 *
 * Der apiClient ist komplett gemockt — kein Netzwerk. Geprueft wird die
 * Zustandsmaschine (laden → anmeldung/eingeloggt), der Login-/Logout-Flow
 * inklusive Token-Persistenz-Aufrufe und der 401-Callback (Token laeuft
 * waehrend der Arbeit ab → App faellt zum Login zurueck).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("../../db/apiClient", () => ({
  authMe: vi.fn(),
  authLogin: vi.fn(),
  setAuthToken: vi.fn(),
  setOnUnauthorized: vi.fn(),
}));

import * as api from "../../db/apiClient";
import type { Benutzer } from "../../db/apiClient";
import { AuthProvider, useAuth, rechteFuerRolle } from "../../auth/AuthContext";

const apiMock = vi.mocked(api);

const CHEF: Benutzer = { kuerzel: "AD", name: "Administrator", rolle: "chef" };
const PRUEFER: Benutzer = { kuerzel: "MW", name: "M. Weber", rolle: "pruefer" };

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

/** Letzten an setOnUnauthorized uebergebenen (nicht-null) Callback holen. */
function letzter401Callback(): () => void {
  const calls = apiMock.setOnUnauthorized.mock.calls
    .map(([cb]) => cb)
    .filter((cb): cb is () => void => cb !== null);
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthContext — Mount (/api/auth/me)", () => {
  it("authRequired:false (Dev-Modus) → direkt eingeloggt als Dev-Benutzer", async () => {
    apiMock.authMe.mockResolvedValue({ authRequired: false, benutzer: CHEF });

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.status).toBe("laden");

    await waitFor(() => expect(result.current.status).toBe("eingeloggt"));
    expect(result.current.benutzer).toEqual(CHEF);
    expect(result.current.authRequired).toBe(false);
  });

  it("me → 401 → Zustand anmeldung, toter Token wird geloescht", async () => {
    apiMock.authMe.mockRejectedValue(new Error("Anmeldung erforderlich"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("anmeldung"));
    expect(result.current.benutzer).toBeNull();
    expect(apiMock.setAuthToken).toHaveBeenCalledWith(null);
  });

  // adminAktionenVerfuegbar ist fail-closed: /api/admin/* verlangt den
  // X-Admin-Token-Header, den das Frontend bewusst nicht kennt. Meldet der
  // Server das Feld nicht oder meldet er false, muss die UI die Aktionen
  // ausblenden, statt einen sicheren 401 zu produzieren.
  it("adminAktionenVerfuegbar: fehlt das Feld, gilt false (fail-closed)", async () => {
    apiMock.authMe.mockResolvedValue({ authRequired: true, benutzer: CHEF });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("eingeloggt"));
    expect(result.current.adminAktionenVerfuegbar).toBe(false);
  });

  it("adminAktionenVerfuegbar: true wird uebernommen", async () => {
    apiMock.authMe.mockResolvedValue({
      authRequired: false,
      benutzer: CHEF,
      adminAktionenVerfuegbar: true,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("eingeloggt"));
    expect(result.current.adminAktionenVerfuegbar).toBe(true);
  });

  it("me mit gueltigem Token → eingeloggt mit authRequired:true", async () => {
    apiMock.authMe.mockResolvedValue({ authRequired: true, benutzer: PRUEFER });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("eingeloggt"));
    expect(result.current.benutzer).toEqual(PRUEFER);
    expect(result.current.authRequired).toBe(true);
  });
});

describe("AuthContext — login / logout", () => {
  it("login-Erfolg speichert den Token und setzt den Benutzer", async () => {
    apiMock.authMe.mockRejectedValue(new Error("401"));
    apiMock.authLogin.mockResolvedValue({ token: "tok-123", benutzer: PRUEFER });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("anmeldung"));

    await act(() => result.current.login("MW", "geheim"));

    expect(apiMock.authLogin).toHaveBeenCalledWith("MW", "geheim");
    expect(apiMock.setAuthToken).toHaveBeenCalledWith("tok-123");
    expect(result.current.status).toBe("eingeloggt");
    expect(result.current.benutzer).toEqual(PRUEFER);
  });

  it("login-Fehler (401) wirft und laesst den Zustand auf anmeldung", async () => {
    apiMock.authMe.mockRejectedValue(new Error("401"));
    apiMock.authLogin.mockRejectedValue(new Error("Kürzel oder Passwort falsch"));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("anmeldung"));

    await expect(
      act(() => result.current.login("XX", "falsch")),
    ).rejects.toThrow("Kürzel oder Passwort falsch");
    expect(result.current.status).toBe("anmeldung");
    expect(result.current.benutzer).toBeNull();
    expect(apiMock.setAuthToken).not.toHaveBeenCalledWith("tok-123");
  });

  it("logout loescht Token und Benutzer (kein Server-Call)", async () => {
    apiMock.authMe.mockResolvedValue({ authRequired: true, benutzer: CHEF });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("eingeloggt"));

    act(() => result.current.logout());

    expect(apiMock.setAuthToken).toHaveBeenCalledWith(null);
    expect(result.current.status).toBe("anmeldung");
    expect(result.current.benutzer).toBeNull();
  });

  it("401 auf fachlicher Route (onUnauthorized-Callback) loggt aus", async () => {
    apiMock.authMe.mockResolvedValue({ authRequired: true, benutzer: PRUEFER });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("eingeloggt"));

    // Der Provider hat seinen Logout als 401-Callback registriert —
    // simuliert einen abgelaufenen Token mitten in der Arbeit.
    const cb = letzter401Callback();
    act(() => cb());

    expect(result.current.status).toBe("anmeldung");
    expect(result.current.benutzer).toBeNull();
    expect(apiMock.setAuthToken).toHaveBeenCalledWith(null);
  });
});

describe("rechteFuerRolle — UI-Rechte-Matrix", () => {
  it("empfang: schreiben ja, aber kein Status/Maengel/Loeschen/Admin", () => {
    expect(rechteFuerRolle("empfang")).toEqual({
      darfStatusSetzen: false,
      darfMaengel: false,
      darfLoeschen: false,
      darfAdmin: false,
    });
  });

  it("pruefer: Status + Maengel ja, Loeschen/Admin nein", () => {
    expect(rechteFuerRolle("pruefer")).toEqual({
      darfStatusSetzen: true,
      darfMaengel: true,
      darfLoeschen: false,
      darfAdmin: false,
    });
  });

  it("chef: alles erlaubt", () => {
    expect(rechteFuerRolle("chef")).toEqual({
      darfStatusSetzen: true,
      darfMaengel: true,
      darfLoeschen: true,
      darfAdmin: true,
    });
  });

  it("unbekannte Rolle / kein Benutzer: fail-closed (alles false)", () => {
    for (const rolle of ["admin", "", null, undefined]) {
      const r = rechteFuerRolle(rolle);
      expect(Object.values(r).every(v => v === false)).toBe(true);
    }
  });
});
