/**
 * Kompatibilitäts-Adapter zwischen der neuen PGlite-Schicht (useDb)
 * und der alten Firestore-API-Form (useStore).
 *
 * **Zweck:** Migration des Daten-Layers ohne gleichzeitig alle Views
 * umzuschreiben. Die Views erhalten weiterhin die alte Datenform
 * (`fahrzeug.id`, `fahrzeug.besitzer`, `termin.status`, embedded
 * `termin.mängel`-Array, etc.), unter der Haube liefert / persistiert
 * jedoch echte PostgreSQL.
 *
 * **Aufräum-Roadmap:** Dieser Adapter ist temporär. In Welle 1 / Schritt
 * 4 werden die Views einzeln auf die native useDb-API umgestellt und der
 * Adapter wird entfernt.
 *
 * **Mapping-Tabelle:**
 *
 * | Alte (Firestore) Form     | Neue (PGlite) Form                       |
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
import * as q from "../db/queries";

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
 * intern aber via PGlite.
 */
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
          hu_faellig: f.huFaellig,
          createdAt: typeof f.erfasstAm === "string" ? f.erfasstAm : f.erfasstAm.toISOString().slice(0, 10),
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
        datum: t.datum,
        uhrzeit: t.uhrzeit,
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
        createdAt: typeof t.erfasstAm === "string" ? t.erfasstAm : t.erfasstAm.toISOString().slice(0, 10),
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
  const addTr = useCallback(
    async (data: any) => {
      const t = await db.addTermin({
        fahrzeugId: data.fahrzeugId,
        datum: data.datum,
        uhrzeit: data.uhrzeit || null,
        prueftCode: data.art,
        prueferKuerzel: data.pruefer || null,
        statusCode: data.status || "GEPLANT",
        notiz: data.notiz || null,
      });
      return { id: t.terminId, ...data };
    },
    [db],
  );

  // ── Write-Adapter: updTr (mit WF-01-Guard) ──
  const updTr = useCallback(
    async (id: string, patch: any) => {
      // Status-Wechsel? Über die Guard-Funktion
      if ("status" in patch) {
        const result = await db.updTerminStatus(id, patch.status);
        if (!result.ok) {
          // Fehler still schlucken — App-Layer hat eigene Guard.
          // In Produktion könnte man hier per Toast warnen.
          return;
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
