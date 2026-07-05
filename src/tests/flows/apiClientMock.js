/**
 * Vollstaendiger Modul-Mock fuer src/db/apiClient — Grundlage aller
 * View-Level-Flow-Tests. Eingebunden per
 *   vi.mock("../../db/apiClient", () => import("./apiClientMock.js"));
 * Kein Netzwerk, keine DB — jede Funktion ist ein vi.fn(), das die Tests
 * selbst primen (siehe testUtils.primeApi).
 */
import { vi } from "vitest";

export const TOKEN_STORAGE_KEY = "tuv.auth.token";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────
export const authLogin = vi.fn();
export const authMe = vi.fn();
export const setAuthToken = vi.fn();
export const getAuthToken = vi.fn(() => null);
export const setOnUnauthorized = vi.fn();

// ── Stammdaten ────────────────────────────────────────────────────────
export const initDatabase = vi.fn();
export const listHalter = vi.fn();
export const addHalter = vi.fn();
export const updHalter = vi.fn();
export const delHalter = vi.fn();
export const listFahrzeuge = vi.fn();
export const addFahrzeug = vi.fn();
export const updFahrzeug = vi.fn();
export const delFahrzeug = vi.fn();

// ── Termine + Maengel ─────────────────────────────────────────────────
export const listTermine = vi.fn();
export const addTermin = vi.fn();
export const updTermin = vi.fn();
export const delTermin = vi.fn();
export const updTerminStatus = vi.fn();
export const listMangelByTermin = vi.fn();
export const addMangel = vi.fn();
export const delMangel = vi.fn();

// ── Sonstiges ─────────────────────────────────────────────────────────
export const countFahrzeuge = vi.fn();
export const clearAllDataTables = vi.fn();
export const loadDemoData = vi.fn();
