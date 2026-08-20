import type {
  Fahrzeug,
  NeuesFahrzeug,
  Halter,
  NeuerHalter,
  Termin,
  NeuerTermin,
  Mangel,
  NeuerMangel,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

// ── Auth: Token-Handling + 401-Callback ───────────────────────────────
// Der Token wird in localStorage persistiert (Key TOKEN_STORAGE_KEY),
// damit ein Reload den Login nicht verwirft. Alle Zugriffe laufen ueber
// try/catch — localStorage kann fehlen (Privacy-Modus, alte WebViews).

export const TOKEN_STORAGE_KEY = "tuv.auth.token";

export type Rolle = "empfang" | "pruefer" | "chef";

export interface Benutzer {
  kuerzel: string;
  name: string;
  rolle: Rolle;
}

/** Serverseitig gemeldete Faehigkeit: sind /api/admin/* aus dem Browser
 *  heraus nutzbar? Sie verlangen zusaetzlich den X-Admin-Token-Header, den
 *  das Frontend bewusst nicht kennt — bei gesetztem ADMIN_TOKEN (Produktion)
 *  ist das Feld deshalb false und die UI blendet die Aktionen aus. */
export interface AuthMeAntwort {
  authRequired: boolean;
  benutzer: Benutzer;
  adminAktionenVerfuegbar?: boolean;
}

export interface LoginAntwort {
  token: string;
  benutzer: Benutzer;
  adminAktionenVerfuegbar?: boolean;
}

/** Fehler mit HTTP-Status — z. B. um 401 (Login falsch) von Netzwerk-
 *  Problemen unterscheiden zu koennen. */
export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

let authToken: string | null = readStoredToken();

export function setAuthToken(token: string | null): void {
  authToken = token;
  try {
    if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage nicht verfuegbar — Token lebt dann nur im Speicher.
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

// Callback bei 401 auf einer fachlichen Route (Token abgelaufen/ungueltig):
// die App registriert hier ihren Logout, damit sie zum Login zurueckfaellt.
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(cb: (() => void) | null): void {
  onUnauthorized = cb;
}

interface RequestOpts {
  /** true fuer Auth-Routen (/auth/login, /auth/me): dort ist 401 eine
   *  normale Antwort und darf NICHT den globalen Logout ausloesen. */
  skip401Handler?: boolean;
}

async function request<T>(path: string, init?: RequestInit, opts?: RequestOpts): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401 && !opts?.skip401Handler) onUnauthorized?.();
    const body: { error?: string } | null = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error || `${res.status} ${res.statusText}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function authLogin(kuerzel: string, passwort: string): Promise<LoginAntwort> {
  return request(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ kuerzel, passwort }) },
    { skip401Handler: true },
  );
}

export function authMe(): Promise<AuthMeAntwort> {
  return request("/auth/me", undefined, { skip401Handler: true });
}

export async function initDatabase(): Promise<void> {
  await request<{ ok: boolean }>("/health");
}

export function listHalter(): Promise<Halter[]> {
  return request("/halter");
}

export function addHalter(data: NeuerHalter): Promise<Halter> {
  return request("/halter", { method: "POST", body: JSON.stringify(data) });
}

export function updHalter(id: string, patch: Partial<NeuerHalter>): Promise<Halter | null> {
  return request(`/halter/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function delHalter(id: string): Promise<void> {
  return request(`/halter/${id}`, { method: "DELETE" });
}

export function listFahrzeuge(): Promise<Fahrzeug[]> {
  return request("/fahrzeuge");
}

export function addFahrzeug(data: NeuesFahrzeug): Promise<Fahrzeug> {
  return request("/fahrzeuge", { method: "POST", body: JSON.stringify(data) });
}

export function updFahrzeug(id: string, patch: Partial<NeuesFahrzeug>): Promise<Fahrzeug | null> {
  return request(`/fahrzeuge/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function delFahrzeug(id: string): Promise<void> {
  return request(`/fahrzeuge/${id}`, { method: "DELETE" });
}

export interface TerminMitMaengeln extends Termin {
  maengel: Mangel[];
}

export interface ListTermineOptions {
  includeMaengel?: boolean;
  from?: string; // YYYY-MM-DD inclusive
  to?: string;   // YYYY-MM-DD inclusive
}

export function listTermine(): Promise<Termin[]>;
export function listTermine(opts: ListTermineOptions & { includeMaengel: true }): Promise<TerminMitMaengeln[]>;
export function listTermine(opts: ListTermineOptions): Promise<Termin[]>;
export function listTermine(opts?: ListTermineOptions): Promise<Termin[] | TerminMitMaengeln[]> {
  const params = new URLSearchParams();
  if (opts?.includeMaengel) params.set("include", "maengel");
  if (opts?.from) params.set("from", opts.from);
  if (opts?.to) params.set("to", opts.to);
  const qs = params.toString();
  return request(`/termine${qs ? `?${qs}` : ""}`);
}

export function addTermin(data: NeuerTermin): Promise<Termin> {
  return request("/termine", { method: "POST", body: JSON.stringify(data) });
}

export function updTermin(id: string, patch: Partial<NeuerTermin>): Promise<Termin | null> {
  return request(`/termine/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function delTermin(id: string): Promise<void> {
  return request(`/termine/${id}`, { method: "DELETE" });
}

export function updTerminStatus(
  id: string,
  status: string,
): Promise<{ ok: true; termin: Termin } | { ok: false; reason: string }> {
  return request(`/termine/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ statusCode: status }),
  });
}

export function listMangelByTermin(terminId: string): Promise<Mangel[]> {
  return request(`/termine/${terminId}/maengel`);
}

export function addMangel(data: NeuerMangel): Promise<{ mangel: Mangel; terminDemoted: boolean }> {
  return request("/maengel", { method: "POST", body: JSON.stringify(data) });
}

export function delMangel(id: string): Promise<void> {
  return request(`/maengel/${id}`, { method: "DELETE" });
}

export async function countFahrzeuge(): Promise<number> {
  const r = await request<{ count: number }>("/count/fahrzeuge");
  return r.count;
}

export async function clearAllDataTables(): Promise<void> {
  await request("/admin/reset", { method: "POST", body: "{}" });
}

export async function loadDemoData(): Promise<void> {
  await request("/admin/demo", { method: "POST", body: "{}" });
}
