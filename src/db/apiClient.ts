import type {
  Fahrzeug,
  NeuesFahrzeug,
  Halter,
  NeuerHalter,
  Termin,
  NeuerTermin,
  Mangel,
  NeuerMangel,
} from "./schema";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `${res.status} ${res.statusText}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
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

export function listTermine(): Promise<Termin[]> {
  return request("/termine");
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
