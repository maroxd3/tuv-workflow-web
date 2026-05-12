/**
 * Neuer State-Hook auf Basis von PGlite + Drizzle.
 *
 * Ersatz für `useStore.js` (Firestore) — verwendet PostgreSQL lokal im
 * Browser via PGlite. Die App-API bleibt soweit möglich gleich, damit
 * Views minimal angepasst werden müssen.
 *
 * Real-time-Sync war bei Firestore via onSnapshot gratis. Bei PGlite
 * gibt es das nicht — wir nutzen:
 *   - Optimistische lokale Updates (sofort sichtbar)
 *   - Re-fetch nach jedem Write (für Konsistenz)
 *   - Optionales Polling (für mehrere Tabs, hier vorerst nicht aktiv)
 */

import { useCallback, useEffect, useState } from "react";
import { runMigrations } from "../db/migrate";
import { seedDomainTables } from "../db/seed";
import * as q from "../db/queries";
import type {
  Fahrzeug,
  NeuesFahrzeug,
  Termin,
  NeuerTermin,
  NeuerMangel,
  Halter,
  NeuerHalter,
} from "../db/schema";

export interface UseDbResult {
  ready: boolean;
  error: string | null;
  halter: Halter[];
  fahrzeuge: Fahrzeug[];
  termine: (Termin & { mängel: Awaited<ReturnType<typeof q.listMangelByTermin>> })[];
  refresh: () => Promise<void>;
  // Halter
  addHalter: (h: NeuerHalter) => Promise<Halter>;
  updHalter: (id: string, p: Partial<NeuerHalter>) => Promise<Halter | null>;
  delHalter: (id: string) => Promise<void>;
  // Fahrzeug
  addFahrzeug: (f: NeuesFahrzeug) => Promise<Fahrzeug>;
  updFahrzeug: (id: string, p: Partial<NeuesFahrzeug>) => Promise<Fahrzeug | null>;
  delFahrzeug: (id: string) => Promise<void>;
  // Termin
  addTermin: (t: NeuerTermin) => Promise<Termin>;
  updTermin: (id: string, p: Partial<NeuerTermin>) => Promise<Termin | null>;
  delTermin: (id: string) => Promise<void>;
  updTerminStatus: (id: string, status: string) => ReturnType<typeof q.updTerminStatus>;
  // Mangel
  addMangel: (m: NeuerMangel) => ReturnType<typeof q.addMangel>;
  delMangel: (id: string) => Promise<void>;
}

export function useDb(): UseDbResult {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [halterList, setHalterList] = useState<Halter[]>([]);
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([]);
  const [termine, setTermine] = useState<UseDbResult["termine"]>([]);

  const refresh = useCallback(async () => {
    try {
      const [h, f, t] = await Promise.all([
        q.listHalter(),
        q.listFahrzeuge(),
        q.listTermine(),
      ]);
      // Mängel pro Termin nachladen (1 zusätzlicher Roundtrip, akzeptabel)
      const termineWithMangel = await Promise.all(
        t.map(async (tr) => ({
          ...tr,
          mängel: await q.listMangelByTermin(tr.terminId),
        })),
      );
      setHalterList(h);
      setFahrzeuge(f);
      setTermine(termineWithMangel);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await runMigrations();
        await seedDomainTables();
        if (cancelled) return;
        await refresh();
        if (cancelled) return;
        setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  // ── Halter ──────────────────────────────────────────────
  const addHalter = useCallback(async (h: NeuerHalter) => {
    const r = await q.addHalter(h);
    await refresh();
    return r;
  }, [refresh]);

  const updHalter = useCallback(async (id: string, p: Partial<NeuerHalter>) => {
    const r = await q.updHalter(id, p);
    await refresh();
    return r;
  }, [refresh]);

  const delHalter = useCallback(async (id: string) => {
    await q.delHalter(id);
    await refresh();
  }, [refresh]);

  // ── Fahrzeug ────────────────────────────────────────────
  const addFahrzeug = useCallback(async (f: NeuesFahrzeug) => {
    const r = await q.addFahrzeug(f);
    await refresh();
    return r;
  }, [refresh]);

  const updFahrzeug = useCallback(async (id: string, p: Partial<NeuesFahrzeug>) => {
    const r = await q.updFahrzeug(id, p);
    await refresh();
    return r;
  }, [refresh]);

  const delFahrzeug = useCallback(async (id: string) => {
    await q.delFahrzeug(id);
    await refresh();
  }, [refresh]);

  // ── Termin ──────────────────────────────────────────────
  const addTermin = useCallback(async (t: NeuerTermin) => {
    const r = await q.addTermin(t);
    await refresh();
    return r;
  }, [refresh]);

  const updTermin = useCallback(async (id: string, p: Partial<NeuerTermin>) => {
    const r = await q.updTermin(id, p);
    await refresh();
    return r;
  }, [refresh]);

  const delTermin = useCallback(async (id: string) => {
    await q.delTermin(id);
    await refresh();
  }, [refresh]);

  const updTerminStatus = useCallback(async (id: string, status: string) => {
    const r = await q.updTerminStatus(id, status);
    await refresh();
    return r;
  }, [refresh]);

  // ── Mangel ──────────────────────────────────────────────
  const addMangel = useCallback(async (m: NeuerMangel) => {
    const r = await q.addMangel(m);
    await refresh();
    return r;
  }, [refresh]);

  const delMangel = useCallback(async (id: string) => {
    await q.delMangel(id);
    await refresh();
  }, [refresh]);

  return {
    ready,
    error,
    halter: halterList,
    fahrzeuge,
    termine,
    refresh,
    addHalter, updHalter, delHalter,
    addFahrzeug, updFahrzeug, delFahrzeug,
    addTermin, updTermin, delTermin, updTerminStatus,
    addMangel, delMangel,
  };
}
