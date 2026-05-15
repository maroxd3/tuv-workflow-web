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
import { seedDomainTables, seedDemoBestand, clearAllDataTables } from "../db/seed";
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
  // Daten-Management
  resetAllData: () => Promise<void>;
  loadDemoData: () => Promise<void>;
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

        // Auto-Seed bei leerer DB — außer der User hat explizit "Alle Daten löschen" geklickt
        const cleared = (() => {
          try { return localStorage.getItem("tuvpro_user_cleared") === "1"; }
          catch { return false; }
        })();
        const fzCount = await q.countFahrzeuge();
        if (fzCount === 0 && !cleared) {
          await seedDemoBestand();
        }

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

  // ── Daten-Management (Sidebar-Buttons) ──
  const resetAllData = useCallback(async () => {
    await clearAllDataTables();
    try { localStorage.setItem("tuvpro_user_cleared", "1"); } catch { /* ignore */ }
    await refresh();
  }, [refresh]);

  const loadDemoData = useCallback(async () => {
    try { localStorage.removeItem("tuvpro_user_cleared"); } catch { /* ignore */ }
    await clearAllDataTables();
    await seedDemoBestand();
    await refresh();
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
    const optimisticTermin = {
      ...t,
      terminId: t.terminId ?? crypto.randomUUID(),
      uhrzeit: t.uhrzeit ?? null,
      prueferKuerzel: t.prueferKuerzel ?? null,
      statusCode: t.statusCode ?? "Geplant",
      notiz: t.notiz ?? null,
      erfasstAm: new Date(),
      mängel: [],
    } as UseDbResult["termine"][number];

    setTermine((current) => [optimisticTermin, ...current]);

    try {
      const r = await q.addTermin({ ...t, terminId: optimisticTermin.terminId });
      setTermine((current) =>
        current.map((tr) =>
          tr.terminId === optimisticTermin.terminId ? { ...r, mängel: [] } : tr,
        ),
      );
      return r;
    } catch (e) {
      setTermine((current) =>
        current.filter((tr) => tr.terminId !== optimisticTermin.terminId),
      );
      throw e;
    }
  }, [refresh]);

  const updTermin = useCallback(async (id: string, p: Partial<NeuerTermin>) => {
    const r = await q.updTermin(id, p);
    await refresh();
    return r;
  }, [refresh]);

  const delTermin = useCallback(async (id: string) => {
    let removed: UseDbResult["termine"][number] | null = null;

    setTermine((current) => {
      removed = current.find((tr) => tr.terminId === id) ?? null;
      return current.filter((tr) => tr.terminId !== id);
    });

    try {
      await q.delTermin(id);
    } catch (e) {
      if (removed) setTermine((current) => [removed!, ...current]);
      else await refresh();
      throw e;
    }
  }, [refresh]);

  const updTerminStatus = useCallback(async (id: string, status: string) => {
    let previous: UseDbResult["termine"] | null = null;

    setTermine((current) => {
      previous = current;
      return current.map((tr) =>
        tr.terminId === id ? { ...tr, statusCode: status } : tr,
      );
    });

    try {
      const r = await q.updTerminStatus(id, status);
      if (!r.ok) {
        if (previous) setTermine(previous);
        else await refresh();
        return r;
      }

      setTermine((current) =>
        current.map((tr) =>
          tr.terminId === id ? { ...tr, ...r.termin } : tr,
        ),
      );
      return r;
    } catch (e) {
      if (previous) setTermine(previous);
      else await refresh();
      throw e;
    }
  }, [refresh]);

  // ── Mangel ──────────────────────────────────────────────
  const addMangel = useCallback(async (m: NeuerMangel) => {
    const optimisticMangel = {
      ...m,
      mangelId: m.mangelId ?? crypto.randomUUID(),
      codeStvzo: m.codeStvzo ?? null,
      behoben: m.behoben ?? false,
      erfasstAm: new Date(),
    };

    let previous: UseDbResult["termine"] | null = null;
    setTermine((current) => {
      previous = current;
      return current.map((tr) =>
        tr.terminId === optimisticMangel.terminId
          ? { ...tr, mängel: [...tr.mängel, optimisticMangel] }
          : tr,
      );
    });

    try {
      const r = await q.addMangel({ ...m, mangelId: optimisticMangel.mangelId });
      setTermine((current) =>
        current.map((tr) => {
          if (tr.terminId !== optimisticMangel.terminId) return tr;
          return {
            ...tr,
            statusCode: r.terminDemoted ? "Nicht bestanden" : tr.statusCode,
            mängel: tr.mängel.map((item) =>
              item.mangelId === optimisticMangel.mangelId ? r.mangel : item,
            ),
          };
        }),
      );
      return r;
    } catch (e) {
      if (previous) setTermine(previous);
      else await refresh();
      throw e;
    }
  }, [refresh]);

  const delMangel = useCallback(async (id: string) => {
    let previous: UseDbResult["termine"] | null = null;
    setTermine((current) => {
      previous = current;
      return current.map((tr) => ({
        ...tr,
        mängel: tr.mängel.filter((m) => m.mangelId !== id),
      }));
    });

    try {
      await q.delMangel(id);
    } catch (e) {
      if (previous) setTermine(previous);
      else await refresh();
      throw e;
    }
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
    resetAllData, loadDemoData,
  };
}
