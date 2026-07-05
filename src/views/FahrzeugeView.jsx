import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Pencil, Trash2, X, User, Gauge, ClipboardList,
  AlertTriangle, Car,
  Calendar as CalIcon,
} from "lucide-react";
import { C } from "../styles/theme";
import { FAHRZEUG_TYPEN } from "../constants/fahrzeug";
import { PRUEFUNG_ARTEN, PRUEFER } from "../constants/pruefung";
import { fmtDate, toIsoDateStr, toTimeStr } from "../utils/date";
import { StatusPill } from "../components/ui/StatusPill";
import { MangelPill } from "../components/ui/MangelPill";
import { EmptyState } from "../components/ui/EmptyState";
import { Kpi } from "../components/ui/Kpi";
import { SectionHead } from "../components/ui/SectionHead";
import { Inp, Sel } from "../components/ui/inputs";
import { BtnG, BtnP } from "../components/ui/buttons";
import { ConfirmModal } from "../components/modal/ConfirmModal";
import { FahrzeugModal } from "../features/fahrzeug/FahrzeugModal";
import { useRechte } from "../auth/AuthContext";
import { FahrzeugShape, HalterShape, TerminShape } from "../types/propTypes";

/* Wiederkehrende Muster */
const META_ITEM_CLS = "flex items-center gap-[3px] text-[11px] text-t4";
const HISTORY_TILE_CLS = "rounded-lg border border-line bg-surface-up";
const SIDEBAR_ICON_BTN_CLS = "flex cursor-pointer rounded-[7px] border border-line bg-glass p-[7px] text-t3 transition-all duration-150 hover:scale-[1.08] hover:bg-[rgba(0,0,0,0.07)] max-[768px]:p-[9px]";
const TYPE_PILL_CLS = "rounded-full border border-line bg-glass px-2.5 py-[3px] font-mono text-[10px]";

export function FahrzeugeView({ fahrzeuge, halter, termine, addFahrzeugMitHalter, updFahrzeug, updHalter, delFahrzeug, toast }) {
  const [q, setQ] = useState("");
  const [typFilter, setTypFilter] = useState("Alle");
  const [showModal, setShowModal] = useState(false);
  const [editFz, setEditFz] = useState(null);
  const [sel, setSel] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [sortBy, setSortBy] = useState("kennzeichen");
  const { darfLoeschen } = useRechte(); // Fahrzeug loeschen: nur Rolle chef

  const typen = ["Alle", ...new Set(fahrzeuge.map(f => f.typ))];
  const halterMap = useMemo(() => Object.fromEntries(halter.map(h => [h.halterId, h])), [halter]);
  const halterName = f => halterMap[f.halterId]?.name || "";

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    const hName = f => halterMap[f.halterId]?.name || "";
    const sortVal = f => (sortBy === "halterName" ? hName(f) : f[sortBy]) ?? "";
    return fahrzeuge
      .filter(f => (typFilter === "Alle" || f.typ === typFilter) &&
        (!ql || f.kennzeichen.toLowerCase().includes(ql) || hName(f).toLowerCase().includes(ql) ||
          (f.hersteller || "").toLowerCase().includes(ql) || (f.modell || "").toLowerCase().includes(ql) ||
          (f.fin || "").toLowerCase().includes(ql)))
      .sort((a, b) => sortVal(a).toString().localeCompare(sortVal(b).toString()) || 0);
  }, [fahrzeuge, halterMap, q, typFilter, sortBy]);

  function getLastTr(fzId) { return termine.filter(t => t.fahrzeugId === fzId).sort((a, b) => toIsoDateStr(b.datum).localeCompare(toIsoDateStr(a.datum)))[0]; }
  function getTrCnt(fzId) { return termine.filter(t => t.fahrzeugId === fzId).length; }
  function getHuStatus(fz) {
    if (!fz.huFaellig) return null;
    const days = Math.ceil((new Date(fz.huFaellig) - new Date()) / (1000 * 60 * 60 * 24));
    return { days, color: days < 0 ? C.redL : days < 30 ? C.orangeL : days < 90 ? C.amberL : C.greenL, label: days < 0 ? `${Math.abs(days)}d überfällig` : `in ${days}d` };
  }

  async function save(form) {
    // Das Formular liefert Fahrzeug- und Halter-Felder flach —
    // hier in die beiden DB-Entitaeten aufteilen.
    const fzDaten = {
      kennzeichen: form.kennzeichen,
      fin: form.fin || null,
      hersteller: form.hersteller,
      modell: form.modell,
      baujahr: form.baujahr ?? null,
      farbe: form.farbe || null,
      typ: form.typ,
      kilometerstand: form.kilometerstand ?? null,
      huFaellig: form.huFaellig || null,
    };
    const halterDaten = {
      name: form.halterName,
      telefon: form.telefon || null,
      email: form.email || null,
    };
    try {
      if (editFz) {
        await updHalter(editFz.halterId, halterDaten);
        await updFahrzeug(editFz.fahrzeugId, fzDaten);
        toast("Fahrzeug aktualisiert", "success");
        if (sel?.fahrzeugId === editFz.fahrzeugId) setSel({ ...editFz, ...fzDaten });
      } else {
        // addFahrzeugMitHalter dedupet den Halter (case-insensitiver
        // Name-Match) und ergaenzt ggf. Kontaktdaten — siehe useDb.
        await addFahrzeugMitHalter(fzDaten, halterDaten);
        toast("Fahrzeug erfasst", "success");
      }
      setShowModal(false); setEditFz(null);
    } catch (e) {
      toast(e?.message || "Speichern fehlgeschlagen", "error");
    }
  }

  const sidebarTr = sel ? termine.filter(t => t.fahrzeugId === sel.fahrzeugId).sort((a, b) => toIsoDateStr(b.datum).localeCompare(toIsoDateStr(a.datum))) : [];

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] max-w-[400px] flex-[1_1_240px]">
          <Search size={13} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-t4" />
          <Inp value={q} onChange={e => setQ(e.target.value)} placeholder="Suche..." className="pl-[34px]" />
        </div>
        <div className="min-w-[140px] max-w-[220px] flex-[1_1_140px]">
          <Sel value={typFilter} onChange={e => setTypFilter(e.target.value)}>
            {typen.map(t => <option key={t}>{t}</option>)}
          </Sel>
        </div>
        <div className="min-w-[140px] max-w-[200px] flex-[1_1_140px]">
          <Sel value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="kennzeichen">Sortierung: KFZ</option>
            <option value="halterName">Sortierung: Halter</option>
            <option value="hersteller">Sortierung: Marke</option>
          </Sel>
        </div>
        <BtnP onClick={() => { setEditFz(null); setShowModal(true); }} icon={Plus}>Fahrzeug erfassen</BtnP>
      </div>

      {/* Summary row */}
      <div className="mb-5 grid grid-cols-4 gap-2.5 max-[768px]:grid-cols-2">
        <Kpi label="Fahrzeuge gesamt" value={fahrzeuge.length} accent={C.blue} icon={Car} />
        <Kpi label="PKW" value={fahrzeuge.filter(f => f.typ === "PKW").length} accent={C.cyan} icon={Car} />
        <Kpi label="Nutzfahrzeuge" value={fahrzeuge.filter(f => ["LKW", "Transporter", "Sattel", "Bus"].includes(f.typ)).length} accent={C.amber} icon={Car} />
        <Kpi label="HU überfällig" value={fahrzeuge.filter(f => f.huFaellig && new Date(f.huFaellig) < new Date()).length} accent={C.red} icon={AlertTriangle} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-2.5">
        {filtered.map(fz => {
          const lastT = getLastTr(fz.fahrzeugId); const cnt = getTrCnt(fz.fahrzeugId); const hu = getHuStatus(fz);
          const fzTyp = FAHRZEUG_TYPEN.find(t => t.id === fz.typ);
          return (
            <motion.div key={fz.fahrzeugId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => setSel(fz)}
              className={[
                "cursor-pointer rounded-xl border px-[18px] py-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]",
                "transition-all duration-[0.18s] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.10)]",
                sel?.fahrzeugId === fz.fahrzeugId ? "border-blue bg-surface-high" : "border-line bg-surface",
              ].join(" ")}>
              <div className="mb-2.5 flex items-start justify-between">
                <div>
                  <div className="font-mono text-[17px] font-bold tracking-[0.06em] text-t1">{fz.kennzeichen}</div>
                  <div className="mt-0.5 text-[12px] text-t3">{fz.hersteller} {fz.modell} {fz.baujahr ? `(${fz.baujahr})` : ""}</div>
                </div>
                <div className="text-right">
                  <div className="mb-1 text-[11px] text-t4">{fzTyp?.icon} {fz.typ}</div>
                  {lastT && <StatusPill status={lastT.statusCode} />}
                </div>
              </div>
              <div className={`flex flex-wrap gap-3 ${hu ? "mb-2" : "mb-0"}`}>
                <span className={META_ITEM_CLS}><User size={10} />{halterName(fz)}</span>
                {fz.kilometerstand && <span className={META_ITEM_CLS}><Gauge size={10} />{fz.kilometerstand.toLocaleString("de-DE")} km</span>}
                <span className={META_ITEM_CLS}><ClipboardList size={10} />{cnt} Prüfung{cnt !== 1 ? "en" : ""}</span>
              </div>
              {hu && (
                <div className="flex items-center gap-1.5 border-t border-line pt-2">
                  <CalIcon size={10} color={hu.color} />
                  {/* Laufzeitwerte: HU-Ampelfarbe wird aus der Restlaufzeit berechnet */}
                  <span className="font-mono text-[11px]" style={{ color: hu.color }}>HU {fmtDate(fz.huFaellig)}</span>
                  <span className="rounded-full border px-[7px] py-px text-[10px]"
                    style={{ color: hu.color, background: `${hu.color}18`, borderColor: `${hu.color}30` }}>{hu.label}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      {filtered.length === 0 && <EmptyState icon={Car} title="Keine Fahrzeuge gefunden" sub="Ändere deine Suche oder erfasse ein neues Fahrzeug." />}

      {/* Sidebar detail */}
      <AnimatePresence>
        {sel && (
          <div className="fixed inset-0 z-[100]" onClick={() => setSel(null)}>
            <motion.div initial={{ x: 480, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 480, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 flex w-[460px] flex-col overflow-y-auto border-l border-line bg-bg max-[768px]:w-full max-[768px]:max-w-full">
              {/* Sidebar header */}
              <div className="sticky top-0 z-[1] border-b border-line bg-surface px-6 py-5">
                <div className="mb-2.5 flex items-start justify-between">
                  <div>
                    <div className="font-mono text-[23px] font-bold tracking-[0.05em] text-t1">{sel.kennzeichen}</div>
                    <div className="text-[13px] text-t3">{sel.hersteller} {sel.modell}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={e => { e.stopPropagation(); setEditFz(sel); setShowModal(true); }}
                      aria-label="Bearbeiten" className={SIDEBAR_ICON_BTN_CLS}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setSel(null)}
                      aria-label="Schließen" className={SIDEBAR_ICON_BTN_CLS}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sidebarTr[0] && <StatusPill status={sidebarTr[0].statusCode} />}
                  <span className={`${TYPE_PILL_CLS} text-t3`}>{FAHRZEUG_TYPEN.find(t => t.id === sel.typ)?.icon} {sel.typ}</span>
                  {sel.fin && <span className={`${TYPE_PILL_CLS} text-t4`}>{sel.fin}</span>}
                </div>
              </div>

              <div className="flex-1 px-6 py-5">
                {/* Details */}
                <div className="mb-5 grid grid-cols-2 gap-2">
                  {[
                    ["Baujahr", sel.baujahr || "—"], ["Farbe", sel.farbe || "—"],
                    ["Kilometerstand", sel.kilometerstand ? `${sel.kilometerstand.toLocaleString("de-DE")} km` : "—"],
                    ["Halter", halterName(sel)],
                    ["Telefon", halterMap[sel.halterId]?.telefon || "—"], ["E-Mail", halterMap[sel.halterId]?.email || "—"],
                    ["HU fällig", sel.huFaellig ? fmtDate(sel.huFaellig) : "—"],
                  ].map(([k, v]) => (
                    <div key={k} className={`${HISTORY_TILE_CLS} px-3 py-[9px]`}>
                      <div className="mb-[3px] text-[9px] uppercase tracking-[0.1em] text-t4">{k}</div>
                      <div className="break-all text-[12px] text-t1">{v}</div>
                    </div>
                  ))}
                </div>

                {/* History */}
                <SectionHead label="Prüfungshistorie" />
                {sidebarTr.length === 0 && <div className="py-4 text-[13px] text-t4">Keine Prüfungen.</div>}
                <div className="flex flex-col gap-[7px]">
                  {sidebarTr.map(t => {
                    const art = PRUEFUNG_ARTEN.find(a => a.id === t.prueftCode);
                    const pr = PRUEFER.find(p => p.id === t.prueferKuerzel);
                    return (
                      <div key={t.terminId} className={`${HISTORY_TILE_CLS} px-[13px] py-2.5`}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-mono text-[12px] text-t3">{fmtDate(t.datum)} {toTimeStr(t.uhrzeit)}</span>
                          <StatusPill status={t.statusCode} />
                        </div>
                        <div className="text-[12px] text-t4">{art?.label || t.prueftCode} · {pr?.name || t.prueferKuerzel}</div>
                        {t.maengel?.length > 0 && <div className="mt-1.5 flex flex-wrap gap-[3px]">{t.maengel.map(m => <MangelPill key={m.mangelId} kat={m.kategorieCode} />)}</div>}
                        {t.notiz && <div className="mt-1.5 border-t border-line pt-1.5 text-[11px] text-t4">{t.notiz}</div>}
                      </div>
                    );
                  })}
                </div>
                {darfLoeschen && (
                  <div className="mt-5 border-t border-line pt-4">
                    <BtnG onClick={() => setConfirmDel(sel.fahrzeugId)} danger icon={Trash2}>Fahrzeug löschen</BtnG>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDel && <ConfirmModal title="Fahrzeug löschen?" msg="Alle Termine dieses Fahrzeugs werden ebenfalls gelöscht."
          onConfirm={async () => {
            const id = confirmDel;
            setConfirmDel(null);
            try {
              await delFahrzeug(id);
              if (sel?.fahrzeugId === id) setSel(null);
              toast("Fahrzeug gelöscht", "info");
            } catch (e) {
              toast(e?.message || "Löschen fehlgeschlagen", "error");
            }
          }}
          onCancel={() => setConfirmDel(null)} />}
        {showModal && <FahrzeugModal
          initial={editFz ? {
            ...editFz,
            huFaellig: toIsoDateStr(editFz.huFaellig),
            halterName: halterMap[editFz.halterId]?.name || "",
            telefon: halterMap[editFz.halterId]?.telefon || "",
            email: halterMap[editFz.halterId]?.email || "",
          } : {}}
          fahrzeuge={fahrzeuge} onSave={save} onClose={() => { setShowModal(false); setEditFz(null); }} />}
      </AnimatePresence>
    </div>
  );
}

FahrzeugeView.propTypes = {
  fahrzeuge: PropTypes.arrayOf(FahrzeugShape).isRequired,
  halter: PropTypes.arrayOf(HalterShape).isRequired,
  termine: PropTypes.arrayOf(TerminShape).isRequired,
  addFahrzeugMitHalter: PropTypes.func.isRequired,
  updFahrzeug: PropTypes.func.isRequired,
  updHalter: PropTypes.func.isRequired,
  delFahrzeug: PropTypes.func.isRequired,
  toast: PropTypes.func.isRequired,
};
