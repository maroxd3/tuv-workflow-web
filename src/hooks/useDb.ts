/**
 * State-Hook fuer die zentrale MariaDB-API.
 *
 * Ersatz fuer den alten View-Store: Daten werden ueber die Express-API aus
 * MariaDB geladen. Die App-API bleibt soweit moeglich gleich, damit Views
 * minimal angepasst werden muessen.
 *
 * Nach Schreiboperationen aktualisiert der Hook den lokalen React-State und
 * laedt bei Bedarf erneut von der API.
 */

import { useCallback, useEffect, useRef, useState } from "react";
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
} from "../db/types";

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

  // ── Polling-Race-Guard ──────────────────────────────────────────────
  // Zaehlt parallele Write-Operationen. Solange > 0 darf das 5-Sek-Polling
  // NICHT refreshen, sonst koennte ein langsamer Server-Write durch einen
  // Poll-Tick mit altem DB-Stand ueberschrieben werden.
  const writeInFlight = useRef(0);
  function tracked<T>(fn: () => Promise<T>): Promise<T> {
    writeInFlight.current++;
    return fn().finally(() => {
      writeInFlight.current--;
    });
  }

  const refresh = useCallback(async () => {
    try {
      // N+1-Fix: includeMaengel: true holt termine+maengel in 2 SQL-Queries
      // statt 14 (1 + N HTTP-Calls). Resultat hat .maengel-Array pro Termin.
      const [h, f, tWith] = await Promise.all([
        api.listHalter(),
        api.listFahrzeuge(),
        api.listTermine({ includeMaengel: true }),
      ]);
      setHalterList(h);
      setFahrzeuge(f);
      setTermine(tWith.map((tr) => ({ ...tr, mängel: tr.maengel })));
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

  // ── Live-Sync via Polling (US-16) ───────────────────────────────────
  // Empfang legt einen Termin an → Prüfer-Tablet sieht ihn spätestens
  // nach POLL_INTERVAL_MS, ohne dass der Prüfer F5 drücken muss.
  // Pausiert: (a) während der Tab im Hintergrund ist (Page-Visibility-API),
  // (b) solange eine eigene Write-Operation läuft (sonst koennte ein
  //     langsamer Server-Write durch einen Poll mit altem DB-Stand
  //     ueberschrieben werden — siehe writeInFlight oben).
  useEffect(() => {
    if (!ready) return;
    const POLL_INTERVAL_MS = 5000;
    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      if (writeInFlight.current > 0) return;
      void refresh();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [ready, refresh]);

  // ── Daten-Management (Sidebar-Buttons) ──
  const resetAllData = useCallback(async () => {
    await tracked(() => api.clearAllDataTables());
    await refresh();
  }, [refresh]);

  const loadDemoData = useCallback(async () => {
    await tracked(() => api.loadDemoData());
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
      const r = await tracked(() => api.addHalter({ ...h, halterId: optimisticHalter.halterId }));
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
      const r = await tracked(() => api.updHalter(id, p));
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
      await tracked(() => api.delHalter(id));
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
      const r = await tracked(() => api.addFahrzeug({ ...f, fahrzeugId: optimisticFahrzeug.fahrzeugId }));
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
      const r = await tracked(() => api.updFahrzeug(id, p));
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
      await tracked(() => api.delFahrzeug(id));
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
      const r = await tracked(() => api.addTermin({ ...t, terminId: optimisticTermin.terminId }));
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
      const r = await tracked(() => api.updTermin(id, p));
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
      await tracked(() => api.delTermin(id));
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
      const r = await tracked(() => api.updTerminStatus(id, status));
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
      const r = await tracked(() => api.addMangel({ ...m, mangelId: optimisticMangel.mangelId }));
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
      await tracked(() => api.delMangel(id));
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
