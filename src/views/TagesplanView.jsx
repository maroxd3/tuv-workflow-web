import { useState, useMemo, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Clock, Plus, ArrowRight,
  ClipboardList, Pencil, Trash2, AlertOctagon, CheckCircle2, XCircle, Calendar,
  Play, CheckCheck,
} from "lucide-react";
import { C } from "../styles/theme";
import { STATUS, STATUS_CFG } from "../constants/status";
import { TIME_SLOTS } from "../constants/fahrzeug";
import { PRUEFUNG_ARTEN, PRUEFER } from "../constants/pruefung";
import { isoDate, addDays, parseIsoLocal, fmtDate, fmtDateLong, dayName, dayShort, toIsoDateStr, toTimeStr } from "../utils/date";
import { hatHauptmangel } from "../utils/mangel";
import { StatusPill } from "../components/ui/StatusPill";
import { MangelPill } from "../components/ui/MangelPill";
import { HauptmangelBadge } from "../components/ui/HauptmangelBadge";
import { EmptyState } from "../components/ui/EmptyState";
import { Kpi } from "../components/ui/Kpi";
import { IconBtn, BtnP } from "../components/ui/buttons";
import { ConfirmModal } from "../components/modal/ConfirmModal";
import { TerminModal } from "../features/termin/TerminModal";
import { MaengelModal } from "../features/mangel/MaengelModal";
import { useRechte } from "../auth/AuthContext";
import { FahrzeugShape, HalterShape, TerminShape } from "../types/propTypes";

/* Wiederkehrende Muster */
const PANEL_CLS = "overflow-hidden rounded-[14px] border border-line bg-surface-up";
const PANEL_HEAD_LABEL_CLS = "text-[11px] font-bold uppercase tracking-[0.1em] text-t3";
const DATE_NAV_BTN_CLS = "flex cursor-pointer rounded-lg border border-line bg-glass px-2.5 py-[7px] text-t2";
const TD_CLS = "px-3.5 py-2.5";

function ContextMenu({ menu, onClose, onNewTr, onEdit, onDelete, onMaengel, onAdvance }) {
  const ref = useRef();
  // Rollen-Gating: Starten/Abschließen nur fuer Pruefer+Chef, Loeschen nur Chef.
  const { darfStatusSetzen, darfLoeschen } = useRechte();

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [onClose]);

  const items = menu.termin
    ? [
        darfStatusSetzen && menu.termin.statusCode === STATUS.GEPLANT && { icon: <Play size={13} />, label: "Starten", color: C.blue, action: () => { onAdvance(menu.termin); onClose(); } },
        darfStatusSetzen && menu.termin.statusCode === STATUS.IN_PRUEFUNG && { icon: <CheckCheck size={13} />, label: "Abschließen", color: C.green, action: () => { onAdvance(menu.termin); onClose(); } },
        { icon: <Pencil size={13} />, label: "Bearbeiten", color: C.t2, action: () => { onEdit(menu.termin); onClose(); } },
        { icon: <ClipboardList size={13} />, label: "Mängel erfassen", color: C.amber, action: () => { onMaengel(menu.termin.terminId); onClose(); } },
        ...(darfLoeschen
          ? ["divider", { icon: <Trash2 size={13} />, label: "Löschen", color: C.red, action: () => { onDelete(menu.termin.terminId); onClose(); } }]
          : []),
      ].filter(Boolean)
    : [
        { icon: <Plus size={13} />, label: `Termin anlegen — ${menu.slot}`, color: C.blue, action: () => { onNewTr(menu.slot); onClose(); } },
      ];

  // Clamp position to viewport
  const x = Math.min(menu.x, window.innerWidth - 220);
  const y = Math.min(menu.y, window.innerHeight - (items.length * 36 + 16));

  return (
    <div ref={ref}
      className="fixed z-[9999] min-w-[210px] rounded-xl border border-line-med bg-surface p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.16),0_0_0_1px_rgba(0,0,0,0.05)]"
      style={{ left: x, top: y }} // Laufzeitwerte: Mausposition
    >
      {items.map(item =>
        item === "divider"
          ? <div key="divider" className="my-1 h-px bg-line" />
          : (
            <button key={item.label} onClick={item.action}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-[7px] border-none bg-transparent px-3 py-2 text-left text-[13px] font-medium transition-colors duration-100 hover:bg-glass"
              style={{ color: item.color }} // Laufzeitwert: Farbe pro Menü-Eintrag
            >
              {item.icon}
              {item.label}
            </button>
          )
      )}
    </div>
  );
}

export function TagesplanView({ fahrzeuge, halter, termine, addTermin, updTermin, updTerminStatus, delTermin, addMangel, delMangel, toast }) {
  const [date, setDate] = useState(isoDate());
  const [showTrModal, setShowTrModal] = useState(false);
  const [editTr, setEditTr] = useState(null);
  const [maengelId, setMaengelId] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, slot, termin? }
  const [newTrInit, setNewTrInit] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [viewMode, setViewMode] = useState("timeline");
  const [tableScope, setTableScope] = useState("day");
  const rechte = useRechte(); // UI-Gating — serverseitig erzwingt requireAuth

  const fzMap = useMemo(() => Object.fromEntries(fahrzeuge.map(f => [f.fahrzeugId, f])), [fahrzeuge]);
  const halterMap = useMemo(() => Object.fromEntries(halter.map(h => [h.halterId, h])), [halter]);
  const dayTr = useMemo(() =>
    termine.filter(t => toIsoDateStr(t.datum) === date)
      .sort((a, b) => (toTimeStr(a.uhrzeit) || "").localeCompare(toTimeStr(b.uhrzeit) || "")),
    [termine, date]
  );
  const tableTr = useMemo(() => {
    const source = tableScope === "all" ? termine : dayTr;
    return [...source].sort((a, b) =>
      `${toIsoDateStr(a.datum)} ${toTimeStr(a.uhrzeit) || ""}`.localeCompare(`${toIsoDateStr(b.datum)} ${toTimeStr(b.uhrzeit) || ""}`)
    );
  }, [dayTr, tableScope, termine]);
  const statsTr = viewMode === "table" && tableScope === "all" ? tableTr : dayTr;
  const maengelTr = maengelId ? termine.find(t => t.terminId === maengelId) : null;

  const stats = useMemo(() => ({
    total: statsTr.length,
    bestanden: statsTr.filter(t => t.statusCode === STATUS.BESTANDEN).length,
    failed: statsTr.filter(t => t.statusCode === STATUS.NICHT_BESTANDEN).length,
    offen: statsTr.filter(t => t.statusCode === STATUS.GEPLANT || t.statusCode === STATUS.IN_PRUEFUNG).length,
    hm: statsTr.filter(t => hatHauptmangel(t.maengel)).length,
  }), [statsTr]);
  const passRate = (stats.bestanden + stats.failed) > 0 ? Math.round(stats.bestanden / (stats.bestanden + stats.failed) * 100) : null;

  function openCtx(e, slot, termin = null) {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, slot, termin });
  }

  function newTrAtSlot(slot) {
    setEditTr(null);
    setNewTrInit({ uhrzeit: slot, datum: date });
    setShowTrModal(true);
  }

  async function saveTr(form) {
    try {
      if (editTr) {
        // Status-Wechsel IMMER über die Guard-Funktion (WF-01): bei
        // Ablehnung (blockierender Mangel offen / API-Block) kein
        // weiterer Patch, sondern sichtbare Fehlermeldung als Toast.
        // Nur bei tatsaechlicher Aenderung aufrufen — sonst wuerde die
        // Rolle empfang (darf keinen Status setzen) beim blossen
        // Bearbeiten von Datum/Notiz ein 403 vom Server kassieren.
        if (form.statusCode !== editTr.statusCode) {
          const r = await updTerminStatus(editTr.terminId, form.statusCode);
          if (!r.ok) {
            toast(r.reason || "Status-Wechsel abgelehnt", "error");
            return;
          }
        }
        await updTermin(editTr.terminId, {
          datum: form.datum,
          uhrzeit: form.uhrzeit || null,
          prueftCode: form.prueftCode,
          prueferKuerzel: form.prueferKuerzel || null,
          notiz: form.notiz || null,
        });
        toast("Termin aktualisiert", "success");
      } else {
        await addTermin({
          fahrzeugId: form.fahrzeugId,
          datum: form.datum,
          uhrzeit: form.uhrzeit || null,
          prueftCode: form.prueftCode,
          prueferKuerzel: form.prueferKuerzel || null,
          statusCode: form.statusCode || STATUS.GEPLANT,
          notiz: form.notiz || null,
        });
        toast("Termin angelegt", "success");
      }
      setShowTrModal(false); setEditTr(null);
    } catch (e) {
      toast(e?.message || "Speichern fehlgeschlagen", "error");
    }
  }

  async function advance(t) {
    const hasHM = hatHauptmangel(t.maengel);
    const next = t.statusCode === STATUS.GEPLANT
      ? STATUS.IN_PRUEFUNG
      : t.statusCode === STATUS.IN_PRUEFUNG
        ? (hasHM ? STATUS.NICHT_BESTANDEN : STATUS.BESTANDEN)
        : null;
    if (!next) return;
    try {
      const r = await updTerminStatus(t.terminId, next);
      if (!r.ok) {
        toast(r.reason || "Status-Wechsel abgelehnt", "error");
        return;
      }
      toast(`→ ${next}`, hasHM && next === STATUS.NICHT_BESTANDEN ? "warn" : "success");
    } catch (e) {
      toast(e?.message || "Status-Wechsel abgelehnt", "error");
    }
  }

  // Wochenleiste: Montag der ausgewaehlten Woche + 6 Folgetage.
  // Lokal-sicher ueber parseIsoLocal/addDays — new Date("yyyy-mm-dd") wuerde
  // UTC-Mitternacht parsen und die Woche in Zeitzonen westlich von UTC
  // um einen Tag verschieben. (getDay(): So=0 ... Sa=6)
  const weekDays = useMemo(() => {
    const monday = addDays(date, 1 - parseIsoLocal(date).getDay());
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [date]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(d => addDays(d, -1))} className={DATE_NAV_BTN_CLS}>
            <ChevronLeft size={15} />
          </button>
          <div className="min-w-[140px] px-2 text-center">
            <div className="whitespace-nowrap text-[18px] font-bold tracking-[-0.02em] text-t1">{dayName(date)}</div>
            <div className="whitespace-nowrap font-mono text-[11px] text-t4">{fmtDateLong(date)}</div>
          </div>
          <button onClick={() => setDate(d => addDays(d, 1))} className={DATE_NAV_BTN_CLS}>
            <ChevronRight size={15} />
          </button>
          {date !== isoDate() && (
            <button onClick={() => setDate(isoDate())}
              className="cursor-pointer rounded-lg border border-[rgba(75,140,247,0.22)] bg-[rgba(75,140,247,0.10)] px-3 py-[7px] text-[12px] font-semibold text-blue-l">Heute</button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 rounded-[10px] border border-line bg-surface-up p-[3px]">
            {[["timeline", "Zeitplan"], ["table", "Tabelle"]].map(([v, l]) => (
              <button key={v} onClick={() => setViewMode(v)}
                className={[
                  "cursor-pointer rounded-[7px] border-none px-3.5 py-1.5 text-[12px] transition-all duration-150",
                  viewMode === v
                    ? "bg-surface font-semibold text-t1 shadow-[0_1px_4px_rgba(15,23,42,0.10)]"
                    : "bg-transparent font-normal text-t3 shadow-none",
                ].join(" ")}>
                {l}
              </button>
            ))}
          </div>
          <BtnP onClick={() => { setEditTr(null); setShowTrModal(true); }} icon={Plus}>Termin anlegen</BtnP>
        </div>
      </div>

      {/* Week mini-nav */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(d => {
          const cnt = termine.filter(t => toIsoDateStr(t.datum) === d).length;
          const isToday = d === isoDate(); const isSel = d === date;
          return (
            <button key={d} onClick={() => setDate(d)}
              className={[
                "cursor-pointer rounded-lg border px-1 py-[7px] text-center transition-all duration-150",
                isSel ? "border-transparent bg-blue" : isToday ? "border-[rgba(75,140,247,0.26)] bg-[rgba(75,140,247,0.10)]" : "border-line bg-glass",
              ].join(" ")}>
              <div className={`mb-0.5 text-[10px] ${isSel ? "text-[rgba(255,255,255,0.8)]" : "text-t4"}`}>{dayShort(d)}</div>
              <div className={`font-mono text-[14px] font-bold ${isSel ? "text-white" : isToday ? "text-blue" : "text-t2"}`}>
                {parseIsoLocal(d).getDate()}
              </div>
              {cnt > 0 && <div className={`mt-0.5 font-mono text-[9px] ${isSel ? "text-[rgba(255,255,255,0.75)]" : "text-t4"}`}>{cnt}</div>}
            </button>
          );
        })}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-2.5 max-[768px]:grid-cols-2">
        <Kpi label="Termine" value={stats.total} accent={C.blue} icon={Calendar} />
        <Kpi label="Bestanden" value={stats.bestanden} sub={passRate != null ? `${passRate}%` : ""} accent={C.green} icon={CheckCircle2} />
        <Kpi label="Nicht bestanden" value={stats.failed} accent={C.red} icon={XCircle} />
        <Kpi label="Ausstehend" value={stats.offen} accent={C.amber} icon={Clock} />
        <Kpi label="Mit Hauptmangel" value={stats.hm} accent={C.purple} icon={AlertOctagon} />
      </div>

      {/* Timeline view */}
      {viewMode === "timeline" && (
        <div className={PANEL_CLS}>
          <div className="flex items-center gap-2 border-b border-line px-5 py-3">
            <Clock size={12} color={C.blue} />
            <span className={PANEL_HEAD_LABEL_CLS}>
              Tagesplan — {dayTr.length} Termine
            </span>
          </div>
          <div>
            {TIME_SLOTS.map(slot => {
              const slotTr = dayTr.filter(t => toTimeStr(t.uhrzeit) === slot);
              return (
                <div key={slot} onContextMenu={e => openCtx(e, slot)}
                  className={`flex border-b border-line ${slotTr.length ? "" : "min-h-10"}`}>
                  <div className="w-[68px] shrink-0 border-r border-line py-3 pl-5 pr-4 text-right">
                    <span className="font-mono text-[11px] text-t4">{slot}</span>
                  </div>
                  <div className={`flex flex-1 flex-col gap-1.5 ${slotTr.length ? "px-4 py-2" : "px-4 py-0"}`}>
                    {slotTr.length === 0 ? (
                      <button onClick={() => newTrAtSlot(slot)}
                        className="flex h-10 w-full cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-left text-[11px] italic text-t4 hover:text-blue-l">
                        <Plus size={12} />
                        Termin um {slot} anlegen
                      </button>
                    ) : slotTr.map(t => {
                      const fz = fzMap[t.fahrzeugId];
                      const fzHalter = fz ? halterMap[fz.halterId] : null;
                      const sc = STATUS_CFG[t.statusCode] || STATUS_CFG[STATUS.GEPLANT];
                      const hmV = hatHauptmangel(t.maengel);
                      const art = PRUEFUNG_ARTEN.find(a => a.id === t.prueftCode);
                      const pruefer = PRUEFER.find(p => p.id === t.prueferKuerzel);
                      const canAdv = t.statusCode === STATUS.GEPLANT || t.statusCode === STATUS.IN_PRUEFUNG;
                      return (
                        <motion.div key={t.terminId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          onContextMenu={e => { e.stopPropagation(); openCtx(e, slot, t); }}
                          className="flex flex-wrap cursor-context-menu items-center gap-3 rounded-[10px] border border-l-[3px] bg-surface px-3.5 py-[11px] shadow-[0_1px_4px_rgba(15,23,42,0.06)] transition-colors duration-[0.12s] hover:bg-[rgba(79,70,229,0.06)]"
                          // Laufzeitwerte: Rahmenfarben pro Status aus STATUS_CFG
                          style={{ borderColor: sc.border, borderLeftColor: sc.dot }}>
                          <div className="min-w-0 flex-1">
                            <div className="mb-[5px] flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[15px] font-bold tracking-[0.05em] text-t1">{fz?.kennzeichen || "—"}</span>
                              <span className="text-[12px] text-t3">{fz?.hersteller} {fz?.modell}</span>
                              <StatusPill status={t.statusCode} />
                              {hmV && <HauptmangelBadge />}
                            </div>
                            <div className="flex flex-wrap items-center gap-3.5">
                              <span className="text-[11px] text-t3">{art?.label || t.prueftCode}</span>
                              <span className="text-[11px] text-t4">·</span>
                              <span className="text-[11px] text-t3">{pruefer?.name || t.prueferKuerzel}</span>
                              <span className="text-[11px] text-t4">·</span>
                              <span className="text-[11px] text-t3">{fzHalter?.name}</span>
                              {t.maengel?.length > 0 && (
                                <span className="font-mono text-[11px] text-amber-l">{t.maengel.length} Mangel{t.maengel.length !== 1 ? "..." : ""}</span>
                              )}
                              {art?.dauer && <span className="text-[10px] text-t4">~{art.dauer} min</span>}
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-[5px]">
                            {canAdv && rechte.darfStatusSetzen && (
                              <button onClick={() => advance(t)}
                                className="flex cursor-pointer items-center gap-1 rounded-md border-none bg-[linear-gradient(135deg,#2563EB,#3B82F6)] px-2.5 py-[5px] font-mono text-[10px] font-bold text-white shadow-[0_2px_6px_rgba(37,99,235,0.3)] transition-all duration-[0.18s] hover:-translate-y-px hover:brightness-110 hover:shadow-[0_6px_24px_rgba(79,70,229,0.35)] active:translate-y-0">
                                <ArrowRight size={11} />
                                {t.statusCode === STATUS.GEPLANT ? "Starten" : "Fertig"}
                              </button>
                            )}
                            <IconBtn onClick={() => setMaengelId(t.terminId)} icon={<ClipboardList size={13} />} color={C.amberL} title="Mängel erfassen" />
                            <IconBtn onClick={() => { setEditTr(t); setShowTrModal(true); }} icon={<Pencil size={13} />} color={C.t3} title="Bearbeiten" />
                            {rechte.darfLoeschen && (
                              <IconBtn onClick={() => setConfirmDel(t.terminId)} icon={<Trash2 size={13} />} color={C.redL} danger title="Löschen" />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table view */}
      {viewMode === "table" && (
        <div className={PANEL_CLS}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <Calendar size={12} color={C.blue} />
              <span className={PANEL_HEAD_LABEL_CLS}>
                {tableScope === "all" ? `Alle Termine — ${tableTr.length}` : `Termine am ${fmtDate(date)} — ${tableTr.length}`}
              </span>
            </div>
            <div className="flex gap-0.5 rounded-[10px] border border-line bg-surface p-[3px]">
              {[["day", "Dieser Tag"], ["all", "Alle Termine"]].map(([v, l]) => (
                <button key={v} onClick={() => setTableScope(v)}
                  className={[
                    "cursor-pointer rounded-[7px] border-none px-3 py-1.5 text-[12px]",
                    tableScope === v ? "bg-[rgba(75,140,247,0.12)] font-bold text-blue-l" : "bg-transparent font-medium text-t3",
                  ].join(" ")}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-up">
                  {["Datum", "Zeit", "Kennzeichen", "Fahrzeug", "Prüfart", "Prüfer", "Status", "Mängel", "Aktionen"].map(h => (
                    <th key={h} className="whitespace-nowrap px-3.5 py-[11px] text-left text-[10px] font-bold uppercase tracking-[0.1em] text-t3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableTr.length === 0 && (
                  <tr><td colSpan={9}><EmptyState icon={Calendar} title="Keine Termine" sub={tableScope === "all" ? "Es sind noch keine Termine gespeichert." : "Auf einen leeren Zeitslot oder oben rechts auf 'Termin anlegen' tippen."} /></td></tr>
                )}
                {tableTr.map((t, i) => {
                  const fz = fzMap[t.fahrzeugId];
                  const art = PRUEFUNG_ARTEN.find(a => a.id === t.prueftCode);
                  const pr = PRUEFER.find(p => p.id === t.prueferKuerzel);
                  const hmV = hatHauptmangel(t.maengel);
                  return (
                    <tr key={t.terminId} className={`border-b border-line ${i % 2 === 0 ? "bg-glass" : "bg-transparent"}`}>
                      <td className={`${TD_CLS} whitespace-nowrap font-mono text-[12px] text-t2`}>{fmtDate(t.datum)}</td>
                      <td className={`${TD_CLS} whitespace-nowrap font-mono text-[12px] text-t2`}>{toTimeStr(t.uhrzeit)}</td>
                      <td className={`${TD_CLS} font-mono text-[13px] font-bold text-t1`}>{fz?.kennzeichen || "—"}</td>
                      <td className={`${TD_CLS} text-[12px] text-t3`}>{fz?.hersteller} {fz?.modell}</td>
                      <td className={`${TD_CLS} whitespace-nowrap text-[11px] text-t3`}>{art?.label || t.prueftCode}</td>
                      <td className={`${TD_CLS} text-[11px] text-t3`}>{pr?.name || t.prueferKuerzel}</td>
                      <td className={TD_CLS}><StatusPill status={t.statusCode} /></td>
                      <td className={TD_CLS}>
                        {t.maengel?.length > 0 ? (
                          <div className="flex flex-wrap gap-[3px]">
                            {t.maengel.map(m => <MangelPill key={m.mangelId} kat={m.kategorieCode} />)}
                            {hmV && <span className="text-[9px] font-bold text-red-l">EM/GfM</span>}
                          </div>
                        ) : <span className="text-[11px] text-t4">—</span>}
                      </td>
                      <td className={TD_CLS}>
                        <div className="flex gap-1">
                          <IconBtn sm onClick={() => setMaengelId(t.terminId)} icon={<ClipboardList size={11} />} color={C.amberL} title="Mängel erfassen" />
                          <IconBtn sm onClick={() => { setEditTr(t); setShowTrModal(true); }} icon={<Pencil size={11} />} color={C.t3} title="Bearbeiten" />
                          {rechte.darfLoeschen && (
                            <IconBtn sm onClick={() => setConfirmDel(t.terminId)} icon={<Trash2 size={11} />} color={C.redL} danger title="Löschen" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ctxMenu && (
        <ContextMenu
          menu={ctxMenu}
          onClose={() => setCtxMenu(null)}
          onNewTr={newTrAtSlot}
          onEdit={t => { setEditTr(t); setNewTrInit(null); setShowTrModal(true); }}
          onDelete={id => setConfirmDel(id)}
          onMaengel={id => setMaengelId(id)}
          onAdvance={advance}
        />
      )}

      <AnimatePresence>
        {confirmDel && <ConfirmModal title="Termin löschen?" msg="Diese Aktion kann nicht rückgängig gemacht werden."
          onConfirm={async () => {
            const id = confirmDel;
            setConfirmDel(null);
            try {
              await delTermin(id);
              toast("Termin gelöscht", "info");
            } catch (e) {
              toast(e?.message || "Löschen fehlgeschlagen", "error");
            }
          }}
          onCancel={() => setConfirmDel(null)} />}
        {showTrModal && <TerminModal fahrzeuge={fahrzeuge} halter={halter} termine={termine}
          initial={editTr ? { ...editTr } : { datum: date, ...(newTrInit || {}) }}
          onSave={saveTr} onClose={() => { setShowTrModal(false); setEditTr(null); setNewTrInit(null); }} />}
        {maengelTr && <MaengelModal termin={maengelTr} fahrzeug={fzMap[maengelTr.fahrzeugId]}
          onAdd={addMangel} onDel={delMangel}
          onStatus={async (id, s) => {
            try {
              const r = await updTerminStatus(id, s);
              if (!r.ok) {
                toast(r.reason || "Status-Wechsel abgelehnt", "error");
                return;
              }
              toast(`Status: ${s}`, "success");
            } catch (e) {
              toast(e?.message || "Status-Wechsel abgelehnt", "error");
            }
          }}
          onClose={() => setMaengelId(null)} />}
      </AnimatePresence>
    </div>
  );
}

ContextMenu.propTypes = {
  menu: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    slot: PropTypes.string,
    termin: TerminShape,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onNewTr: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onMaengel: PropTypes.func.isRequired,
  onAdvance: PropTypes.func.isRequired,
};

TagesplanView.propTypes = {
  fahrzeuge: PropTypes.arrayOf(FahrzeugShape).isRequired,
  halter: PropTypes.arrayOf(HalterShape).isRequired,
  termine: PropTypes.arrayOf(TerminShape).isRequired,
  addTermin: PropTypes.func.isRequired,
  updTermin: PropTypes.func.isRequired,
  updTerminStatus: PropTypes.func.isRequired,
  delTermin: PropTypes.func.isRequired,
  addMangel: PropTypes.func.isRequired,
  delMangel: PropTypes.func.isRequired,
  toast: PropTypes.func.isRequired,
};
