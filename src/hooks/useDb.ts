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
import * as api from "../db/apiClient";
import type {
  Fahrzeug,
  NeuesFahrzeug,
  Termin,
  NeuerTermin,
  NeuerMangel,
  Halter,
  NeuerHalter,
  Mangel,
} from "../db/schema";

export interface UseDbResult {
  ready: boolean;
  error: string | null;
  halter: Halter[];
  fahrzeuge: Fahrzeug[];
  termine: (Termin & { mängel: Mangel[] })[];
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
  updTerminStatus: (id: string, status: string) => ReturnType<typeof api.updTerminStatus>;
  // Mangel
  addMangel: (m: NeuerMangel) => ReturnType<typeof api.addMangel>;
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
        api.listHalter(),
        api.listFahrzeuge(),
        api.listTermine(),
      ]);
      // Mängel pro Termin nachladen (1 zusätzlicher Roundtrip, akzeptabel)
      const termineWithMangel = await Promise.all(
        t.map(async (tr) => ({
          ...tr,
          mängel: await api.listMangelByTermin(tr.terminId),
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
        await api.initDatabase();
        
        if (cancelled) return;

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
    await api.clearAllDataTables();
    await refresh();
  }, [refresh]);

  const loadDemoData = useCallback(async () => {
    await api.loadDemoData();
    await refresh();
  }, [refresh]);

  // ── Halter ──────────────────────────────────────────────
  const addHalter = useCallback(async (h: NeuerHalter) => {
    const optimisticHalter = {
      ...h,
      halterId: h.halterId ?? crypto.randomUUID(),
      telefon: h.telefon ?? null,
      email: h.email ?? null,
      anschrift: h.anschrift ?? null,
      erfasstAm: new Date(),
    } as Halter;

    setHalterList((current) => [optimisticHalter, ...current]);

    try {
      const r = await api.addHalter({ ...h, halterId: optimisticHalter.halterId });
      setHalterList((current) =>
        current.map((item) => item.halterId === optimisticHalter.halterId ? r : item),
      );
      return r;
    } catch (e) {
      setHalterList((current) =>
        current.filter((item) => item.halterId !== optimisticHalter.halterId),
      );
      throw e;
    }
  }, [refresh]);

  const updHalter = useCallback(async (id: string, p: Partial<NeuerHalter>) => {
    let previous: Halter[] | null = null;
    setHalterList((current) => {
      previous = current;
      return current.map((item) => item.halterId === id ? { ...item, ...p } : item);
    });

    try {
      const r = await api.updHalter(id, p);
      if (!r) {
        if (previous) setHalterList(previous);
        else await refresh();
        return r;
      }
      setHalterList((current) =>
        current.map((item) => item.halterId === id ? r : item),
      );
      return r;
    } catch (e) {
      if (previous) setHalterList(previous);
      else await refresh();
      throw e;
    }
  }, [refresh]);

  const delHalter = useCallback(async (id: string) => {
    let removed: Halter | null = null;
    setHalterList((current) => {
      removed = current.find((item) => item.halterId === id) ?? null;
      return current.filter((item) => item.halterId !== id);
    });

    try {
      await api.delHalter(id);
    } catch (e) {
      if (removed) setHalterList((current) => [removed!, ...current]);
      else await refresh();
      throw e;
    }
  }, [refresh]);

  // ── Fahrzeug ────────────────────────────────────────────
  const addFahrzeug = useCallback(async (f: NeuesFahrzeug) => {
    const optimisticFahrzeug = {
      ...f,
      fahrzeugId: f.fahrzeugId ?? crypto.randomUUID(),
      fin: f.fin ?? null,
      baujahr: f.baujahr ?? null,
      farbe: f.farbe ?? null,
      kilometerstand: f.kilometerstand ?? null,
      huFaellig: f.huFaellig ?? null,
      erfasstAm: new Date(),
    } as Fahrzeug;

    setFahrzeuge((current) => [optimisticFahrzeug, ...current]);

    try {
      const r = await api.addFahrzeug({ ...f, fahrzeugId: optimisticFahrzeug.fahrzeugId });
      setFahrzeuge((current) =>
        current.map((item) => item.fahrzeugId === optimisticFahrzeug.fahrzeugId ? r : item),
      );
      return r;
    } catch (e) {
      setFahrzeuge((current) =>
        current.filter((item) => item.fahrzeugId !== optimisticFahrzeug.fahrzeugId),
      );
      throw e;
    }
  }, [refresh]);

  const updFahrzeug = useCallback(async (id: string, p: Partial<NeuesFahrzeug>) => {
    let previous: Fahrzeug[] | null = null;
    setFahrzeuge((current) => {
      previous = current;
      return current.map((item) => item.fahrzeugId === id ? { ...item, ...p } : item);
    });

    try {
      const r = await api.updFahrzeug(id, p);
      if (!r) {
        if (previous) setFahrzeuge(previous);
        else await refresh();
        return r;
      }
      setFahrzeuge((current) =>
        current.map((item) => item.fahrzeugId === id ? r : item),
      );
      return r;
    } catch (e) {
      if (previous) setFahrzeuge(previous);
      else await refresh();
      throw e;
    }
  }, [refresh]);

  const delFahrzeug = useCallback(async (id: string) => {
    let previousFahrzeuge: Fahrzeug[] | null = null;
    let previousTermine: UseDbResult["termine"] | null = null;

    setFahrzeuge((current) => {
      previousFahrzeuge = current;
      return current.filter((item) => item.fahrzeugId !== id);
    });
    setTermine((current) => {
      previousTermine = current;
      return current.filter((tr) => tr.fahrzeugId !== id);
    });

    try {
      await api.delFahrzeug(id);
    } catch (e) {
      if (previousFahrzeuge) setFahrzeuge(previousFahrzeuge);
      if (previousTermine) setTermine(previousTermine);
      if (!previousFahrzeuge || !previousTermine) await refresh();
      throw e;
    }
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
      const r = await api.addTermin({ ...t, terminId: optimisticTermin.terminId });
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
    let previous: UseDbResult["termine"] | null = null;
    setTermine((current) => {
      previous = current;
      return current.map((tr) => tr.terminId === id ? { ...tr, ...p } : tr);
    });

    try {
      const r = await api.updTermin(id, p);
      if (!r) {
        if (previous) setTermine(previous);
        else await refresh();
        return r;
      }
      setTermine((current) =>
        current.map((tr) => tr.terminId === id ? { ...tr, ...r } : tr),
      );
      return r;
    } catch (e) {
      if (previous) setTermine(previous);
      else await refresh();
      throw e;
    }
  }, [refresh]);

  const delTermin = useCallback(async (id: string) => {
    let removed: UseDbResult["termine"][number] | null = null;

    setTermine((current) => {
      removed = current.find((tr) => tr.terminId === id) ?? null;
      return current.filter((tr) => tr.terminId !== id);
    });

    try {
      await api.delTermin(id);
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
      const r = await api.updTerminStatus(id, status);
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
      const r = await api.addMangel({ ...m, mangelId: optimisticMangel.mangelId });
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
      await api.delMangel(id);
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
