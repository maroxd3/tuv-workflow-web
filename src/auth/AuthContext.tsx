/**
 * Auth-State der App: wer ist eingeloggt, ist ein Login ueberhaupt noetig,
 * und welche UI-Rechte ergeben sich aus der Rolle.
 *
 * Ablauf beim Mount: GET /api/auth/me (mit evtl. in localStorage
 * gespeichertem Token). Drei Zustaende:
 *   - "laden"      — /me laeuft noch → neutraler Splash
 *   - "anmeldung"  — Auth aktiv, kein/ungueltiger Token → LoginView
 *   - "eingeloggt" — Benutzer bekannt (bei authRequired:false der
 *                    Dev-Benutzer des Servers, Rolle chef)
 *
 * Die Rechte-Helfer (useRechte) sind reine UI-Ausblendungen — durchgesetzt
 * werden die Rollen serverseitig (401/403 von requireAuth).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as api from "../db/apiClient";
import type { Benutzer } from "../db/apiClient";

export type AuthStatus = "laden" | "anmeldung" | "eingeloggt";

export interface AuthState {
  status: AuthStatus;
  benutzer: Benutzer | null;
  /** false = Server laeuft ohne Auth (Dev-Modus) — kein Logout anbieten. */
  authRequired: boolean;
}

export interface AuthContextValue extends AuthState {
  /** Wirft bei falschen Zugangsdaten (ApiError mit status 401). */
  login: (kuerzel: string, passwort: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "laden",
    benutzer: null,
    authRequired: true,
  });

  const logout = useCallback(() => {
    api.setAuthToken(null);
    setState({ status: "anmeldung", benutzer: null, authRequired: true });
  }, []);

  const login = useCallback(async (kuerzel: string, passwort: string) => {
    const r = await api.authLogin(kuerzel, passwort);
    api.setAuthToken(r.token);
    setState({ status: "eingeloggt", benutzer: r.benutzer, authRequired: true });
  }, []);

  // 401 auf einer fachlichen Route (Token abgelaufen waehrend der Arbeit)
  // → zurueck zum Login.
  useEffect(() => {
    api.setOnUnauthorized(logout);
    return () => api.setOnUnauthorized(null);
  }, [logout]);

  // Beim Mount: wer bin ich? (nutzt den evtl. gespeicherten Token)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.authMe();
        if (cancelled) return;
        setState({ status: "eingeloggt", benutzer: r.benutzer, authRequired: r.authRequired });
      } catch {
        // 401 (kein/abgelaufener Token) oder API nicht erreichbar →
        // Login anzeigen; ein evtl. gespeicherter, toter Token fliegt raus.
        if (cancelled) return;
        api.setAuthToken(null);
        setState({ status: "anmeldung", benutzer: null, authRequired: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth muss innerhalb von <AuthProvider> verwendet werden");
  return ctx;
}

// ── Rollen → UI-Rechte ────────────────────────────────────────────────
// Spiegelt die Server-Matrix (server/auth.js ROLLEN_RECHTE):
//   empfang — anlegen/aendern, aber kein Status, keine Maengel, kein Loeschen
//   pruefer — zusaetzlich Status setzen + Maengel erfassen/entfernen
//   chef    — alles, inkl. Loeschen und Admin-Aktionen (Reset/Demo-Daten)
// Unbekannte Rolle → alles false (fail-closed).

export interface Rechte {
  darfStatusSetzen: boolean;
  darfMaengel: boolean;
  darfLoeschen: boolean;
  darfAdmin: boolean;
}

export function rechteFuerRolle(rolle: string | null | undefined): Rechte {
  const fachlich = rolle === "pruefer" || rolle === "chef";
  const chef = rolle === "chef";
  return {
    darfStatusSetzen: fachlich,
    darfMaengel: fachlich,
    darfLoeschen: chef,
    darfAdmin: chef,
  };
}

export function useRechte(): Rechte {
  const { benutzer } = useAuth();
  return useMemo(() => rechteFuerRolle(benutzer?.rolle), [benutzer]);
}

/** Anzeige-Label pro Rolle (Topbar). */
export const ROLLEN_LABEL: Record<string, string> = {
  empfang: "Empfang",
  pruefer: "Prüfer",
  chef: "Chef",
};
