/**
 * Kompatibilitaets-Adapter zwischen der MariaDB-API-Schicht (useDb)
 * und der alten View-Datenform.
 *
 * **Zweck:** Migration des Daten-Layers ohne gleichzeitig alle Views
 * umzuschreiben. Die Views erhalten weiterhin die alte Datenform
 * (`fahrzeug.id`, `fahrzeug.besitzer`, `termin.status`, embedded
 * `termin.mängel`-Array, etc.), unter der Haube liefert / persistiert
 * jedoch die zentrale Express/MariaDB-API.
 *
 * **Mapping-Tabelle:**
 *
 * | Alte View-Form            | MariaDB/API-Form                         |
 * |---------------------------|------------------------------------------|
 * | `fahrzeug.id`             | `fahrzeug.fahrzeugId`                    |
 * | `fahrzeug.besitzer`       | `halter.name` (per `fahrzeug.halterId`)  |
 * | `fahrzeug.telefon`        | `halter.telefon`                         |
 * | `fahrzeug.email`          | `halter.email`                           |
 * | `fahrzeug.kmStand`        | `fahrzeug.kilometerstand`                |
 * | `fahrzeug.createdAt`      | `fahrzeug.erfasstAm`                     |
 * | `termin.id`               | `termin.terminId`                        |
 * | `termin.art`              | `termin.prueftCode`                      |
 * | `termin.pruefer`          | `termin.prueferKuerzel`                  |
 * | `termin.status`           | `termin.statusCode`                      |
 * | `termin.mängel` (embedded)| `mangel`-Tabelle, FK auf termin          |
 * | `mangel.code`             | `mangel.codeStvzo` (Default "FR")        |
 * | `mangel.text`             | `mangel.beschreibung`                    |
 * | `mangel.kat`              | `mangel.kategorieCode`                   |
 */

import { useCallback, useMemo } from "react";
import { useDb } from "./useDb";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Legacy-Form: ein Fahrzeug-Objekt wie es die alten Views erwarten
interface LegacyFahrzeug {
  id: string;
  kennzeichen: string;
  fin: string | null;
  hersteller: string;
  modell: string;
  baujahr: number | null;
  farbe: string | null;
  typ: string;
  kmStand: number | null;
  besitzer: string;
  telefon: string | null;
  email: string | null;
  hu_faellig: string | null;
  createdAt: string;
}

interface LegacyMangel {
  id: string;
  code: string;
  text: string;
  kat: string;
  behoben: boolean;
}

interface LegacyTermin {
  id: string;
  fahrzeugId: string;
  datum: string;
  uhrzeit: string | null;
  art: string;
  pruefer: string | null;
  status: string;
  notiz: string | null;
  mängel: LegacyMangel[];
  createdAt: string;
}

/**
 * Liefert ein Objekt mit der Form des alten `useStore()`-Rückgabewerts,
 * intern aber via Express/MariaDB-API.
 */
// Defensive Normalisierung:
// API/Browser-Code liefert date/time-Werte je nach Quelle als String oder
// Date-Objekt zurueck. Die bestehenden Views vergleichen
// stets gegen `"yyyy-mm-dd"`-Strings (datum) und `"HH:MM"`-Strings
// (uhrzeit) — also normalisieren wir hier einmal zentral.
function normDateStr(d: unknown): string {
  if (typeof d === "string") return d.slice(0, 10);
  if (d instanceof Date) {
    // LOKAL-Zeit (nicht UTC), sonst springt das Datum um Mitternacht eine
    // Zeitzone in den vorherigen Tag und matchet TagesplanView's
    // isoDate()-Filter nicht mehr.
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}
function normDateStrOrNull(d: unknown): string | null {
  if (d === null || d === undefined || d === "") return null;
  return normDateStr(d);
}
function normTimeStrOrNull(u: unknown): string | null {
  if (u === null || u === undefined || u === "") return null;
  if (typeof u === "string") return u.slice(0, 5); // "08:00:00" → "08:00"
  if (u instanceof Date) {
    return `${String(u.getHours()).padStart(2, "0")}:${String(u.getMinutes()).padStart(2, "0")}`;
  }
  return null;
}

export function useStoreCompat() {
  const db = useDb();

  // ── Read-Adapter: Fahrzeug ──
  const halterMap = useMemo(() => {
    const m = new Map<string, typeof db.halter[number]>();
    for (const h of db.halter) m.set(h.halterId, h);
    return m;
  }, [db.halter]);

  const fahrzeuge: LegacyFahrzeug[] = useMemo(
    () =>
      db.fahrzeuge.map((f) => {
        const h = halterMap.get(f.halterId);
        return {
          id: f.fahrzeugId,
          kennzeichen: f.kennzeichen,
          fin: f.fin,
          hersteller: f.hersteller,
          modell: f.modell,
          baujahr: f.baujahr,
          farbe: f.farbe,
          typ: f.typ,
          kmStand: f.kilometerstand,
          besitzer: h?.name ?? "",
          telefon: h?.telefon ?? null,
          email: h?.email ?? null,
          hu_faellig: normDateStrOrNull(f.huFaellig),
          createdAt: normDateStr(f.erfasstAm),
        };
      }),
    [db.fahrzeuge, halterMap],
  );

  // ── Read-Adapter: Termin ──
  const termine: LegacyTermin[] = useMemo(
    () =>
      db.termine.map((t) => ({
        id: t.terminId,
        fahrzeugId: t.fahrzeugId,
        datum: normDateStr(t.datum),
        uhrzeit: normTimeStrOrNull(t.uhrzeit),
        art: t.prueftCode,
        pruefer: t.prueferKuerzel,
        status: t.statusCode,
        notiz: t.notiz,
        mängel: t.mängel.map((m) => ({
          id: m.mangelId,
          code: m.codeStvzo ?? "FR",
          text: m.beschreibung,
          kat: m.kategorieCode,
          behoben: m.behoben,
        })),
        createdAt: normDateStr(t.erfasstAm),
      })),
    [db.termine],
  );

  // ── Write-Adapter: addFz (splittet Besitzer-Daten in Halter ab) ──
  const addFz = useCallback(
    async (data: any) => {
      const besitzer = (data.besitzer ?? "").trim();
      let halterId: string | undefined;

      // Existiert ein Halter mit diesem Namen? → wiederverwenden.
      // Heuristik: gleicher Name (case-insensitive). Für Produktiv wäre
      // ein explizites Halter-Auswahl-Modal in der Fahrzeug-Form sauberer.
      const existing = db.halter.find(
        (h) => h.name.trim().toLowerCase() === besitzer.toLowerCase(),
      );
      if (existing) {
        halterId = existing.halterId;
        // Falls Telefon/Email mitkamen, ergänze sie still beim Halter
        if (
          (data.telefon && data.telefon !== existing.telefon) ||
          (data.email && data.email !== existing.email)
        ) {
          await db.updHalter(existing.halterId, {
            telefon: data.telefon || existing.telefon,
            email: data.email || existing.email,
          });
        }
      } else {
        const h = await db.addHalter({
          name: besitzer || "(unbekannt)",
          telefon: data.telefon || null,
          email: data.email || null,
        });
        halterId = h.halterId;
      }

      const f = await db.addFahrzeug({
        kennzeichen: data.kennzeichen,
        fin: data.fin || null,
        hersteller: data.hersteller,
        modell: data.modell,
        baujahr: data.baujahr ?? null,
        farbe: data.farbe || null,
        typ: data.typ,
        kilometerstand: data.kmStand ?? null,
        huFaellig: data.hu_faellig || null,
        halterId: halterId!,
      });
      return { id: f.fahrzeugId, ...data };
    },
    [db],
  );

  // ── Write-Adapter: updFz ──
  const updFz = useCallback(
    async (id: string, patch: any) => {
      // Halter-Felder ggf. updaten
      if ("besitzer" in patch || "telefon" in patch || "email" in patch) {
        const f = db.fahrzeuge.find((x) => x.fahrzeugId === id);
        if (f) {
          await db.updHalter(f.halterId, {
            name: patch.besitzer ?? undefined,
            telefon: patch.telefon ?? undefined,
            email: patch.email ?? undefined,
          });
        }
      }
      // Fahrzeug-Felder
      const fzPatch: any = {};
      if ("kennzeichen" in patch) fzPatch.kennzeichen = patch.kennzeichen;
      if ("fin" in patch) fzPatch.fin = patch.fin || null;
      if ("hersteller" in patch) fzPatch.hersteller = patch.hersteller;
      if ("modell" in patch) fzPatch.modell = patch.modell;
      if ("baujahr" in patch) fzPatch.baujahr = patch.baujahr;
      if ("farbe" in patch) fzPatch.farbe = patch.farbe;
      if ("typ" in patch) fzPatch.typ = patch.typ;
      if ("kmStand" in patch) fzPatch.kilometerstand = patch.kmStand;
      if ("hu_faellig" in patch) fzPatch.huFaellig = patch.hu_faellig;
      if (Object.keys(fzPatch).length > 0) {
        await db.updFahrzeug(id, fzPatch);
      }
    },
    [db],
  );

  const delFz = useCallback(async (id: string) => {
    // Cascade-Delete via FK kümmert sich um Termine + Mängel
    await db.delFahrzeug(id);
  }, [db]);

  // ── Write-Adapter: addTr ──
  // Status-Default "Geplant" — matches STATUS.GEPLANT aus constants/status.js.
  // try/catch + console.error: TagesplanView awaitet den Promise nicht;
  // ohne den Catch würden FK-/CHECK-Fehler im "unhandledrejection"-Limbo
  // verschwinden. Wir loggen prominent und werfen weiter — der Caller
  // (App / Toast-System) kann darauf reagieren.
  const addTr = useCallback(
    async (data: any) => {
      try {
        const t = await db.addTermin({
          fahrzeugId: data.fahrzeugId,
          datum: data.datum,
          uhrzeit: data.uhrzeit || null,
          prueftCode: data.art,
          prueferKuerzel: data.pruefer || null,
          statusCode: data.status || "Geplant",
          notiz: data.notiz || null,
        });
        return { id: t.terminId, ...data };
      } catch (e) {
        console.error("[useStoreCompat.addTr] INSERT failed", { data, error: e });
        throw e;
      }
    },
    [db],
  );

  // ── Write-Adapter: updTr (mit WF-01-Guard) ──
  const updTr = useCallback(
    async (id: string, patch: any) => {
      // Status-Wechsel? Über die Guard-Funktion. Bei Ablehnung (WF-01-Trigger
      // oder API-Layer-Block) Error werfen, damit der Caller im View eine
      // sichtbare Fehlermeldung als Toast zeigen kann.
      if ("status" in patch) {
        const result = await db.updTerminStatus(id, patch.status);
        if (!result.ok) {
          throw new Error(result.reason || "Status-Wechsel abgelehnt");
        }
      }
      const trPatch: any = {};
      if ("datum" in patch) trPatch.datum = patch.datum;
      if ("uhrzeit" in patch) trPatch.uhrzeit = patch.uhrzeit;
      if ("art" in patch) trPatch.prueftCode = patch.art;
      if ("pruefer" in patch) trPatch.prueferKuerzel = patch.pruefer || null;
      if ("notiz" in patch) trPatch.notiz = patch.notiz;
      if (Object.keys(trPatch).length > 0) {
        await db.updTermin(id, trPatch);
      }
    },
    [db],
  );

  const delTr = useCallback(async (id: string) => {
    await db.delTermin(id);
  }, [db]);

  // ── Write-Adapter: addMangel / delMangel ──
  const addMangel = useCallback(
    async (tid: string, m: any) => {
      await db.addMangel({
        terminId: tid,
        codeStvzo: m.code === "FR" ? null : m.code,
        beschreibung: m.text,
        kategorieCode: m.kat,
        behoben: m.behoben ?? false,
      });
    },
    [db],
  );

  const delMangel = useCallback(
    async (_tid: string, mid: string) => {
      // Old API passed terminId + mangelId, new only needs mangelId
      await db.delMangel(mid);
    },
    [db],
  );

  // ── resetAll = "Alle Daten löschen" (Sidebar-Button) ──
  const resetAll = useCallback(async () => {
    await db.resetAllData();
  }, [db]);

  // ── loadDemo = "Beispieldaten laden" ──
  const loadDemo = useCallback(async () => {
    await db.loadDemoData();
  }, [db]);

  return {
    fahrzeuge,
    termine,
    ready: db.ready,
    error: db.error,
    refresh: db.refresh,
    addFz,
    updFz,
    delFz,
    addTr,
    updTr,
    delTr,
    addMangel,
    delMangel,
    resetAll,
    loadDemo,
  };
}
