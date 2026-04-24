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
import { isoDate, addDays, fmtDateLong, dayName, dayShort } from "../utils/date";
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
import { FahrzeugShape, TerminShape } from "../types/propTypes";

function ContextMenu({ menu, onClose, onNewTr, onEdit, onDelete, onMaengel, onAdvance }) {
  const ref = useRef();

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
        menu.termin.status === STATUS.GEPLANT && { icon: <Play size={13} />, label: "Starten", color: C.blue, action: () => { onAdvance(menu.termin); onClose(); } },
        menu.termin.status === STATUS.IN_PRUEFUNG && { icon: <CheckCheck size={13} />, label: "Abschließen", color: C.green, action: () => { onAdvance(menu.termin); onClose(); } },
        { icon: <Pencil size={13} />, label: "Bearbeiten", color: C.t2, action: () => { onEdit(menu.termin); onClose(); } },
        { icon: <ClipboardList size={13} />, label: "Mängel erfassen", color: C.amber, action: () => { onMaengel(menu.termin.id); onClose(); } },
        "divider",
        { icon: <Trash2 size={13} />, label: "Löschen", color: C.red, action: () => { onDelete(menu.termin.id); onClose(); } },
      ].filter(Boolean)
    : [
        { icon: <Plus size={13} />, label: `Termin anlegen — ${menu.slot}`, color: C.blue, action: () => { onNewTr(menu.slot); onClose(); } },
      ];

  // Clamp position to viewport
  const x = Math.min(menu.x, window.innerWidth - 220);
  const y = Math.min(menu.y, window.innerHeight - (items.length * 36 + 16));

  return (
    <div ref={ref} style={{
      position: "fixed", zIndex: 9999, left: x, top: y,
      background: C.surface, border: `1px solid ${C.lineMed}`,
      borderRadius: 12, padding: "6px",
      boxShadow: "0 8px 30px rgba(15,23,42,0.16), 0 0 0 1px rgba(0,0,0,0.05)",
      minWidth: 210,
    }}>
      {items.map((item, i) =>
        item === "divider"
          ? <div key={i} style={{ height: 1, background: C.line, margin: "4px 0" }} />
          : (
            <button key={i} onClick={item.action} style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "8px 12px", borderRadius: 7,
              background: "transparent", border: "none",
              color: item.color, cursor: "pointer", fontSize: 13, fontWeight: 500,
              textAlign: "left", transition: "background 0.1s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = C.glass}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {item.icon}
              {item.label}
            </button>
          )
      )}
    </div>
  );
}

export function TagesplanView({ fahrzeuge, termine, addTr, updTr, delTr, addMangel, delMangel, toast }) {
  const [date, setDate] = useState(isoDate());
  const [showTrModal, setShowTrModal] = useState(false);
  const [editTr, setEditTr] = useState(null);
  const [maengelId, setMaengelId] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, slot, termin? }
  const [newTrInit, setNewTrInit] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [viewMode, setViewMode] = useState("timeline");

  const fzMap = useMemo(() => Object.fromEntries(fahrzeuge.map(f => [f.id, f])), [fahrzeuge]);
  const dayTr = useMemo(() =>
    termine.filter(t => t.datum === date).sort((a, b) => a.uhrzeit.localeCompare(b.uhrzeit)),
    [termine, date]
  );
  const maengelTr = maengelId ? termine.find(t => t.id === maengelId) : null;

  const stats = useMemo(() => ({
    total: dayTr.length,
    bestanden: dayTr.filter(t => t.status === STATUS.BESTANDEN).length,
    failed: dayTr.filter(t => t.status === STATUS.NICHT_BESTANDEN).length,
    offen: dayTr.filter(t => t.status === STATUS.GEPLANT || t.status === STATUS.IN_PRUEFUNG).length,
    hm: dayTr.filter(t => hatHauptmangel(t.mängel)).length,
  }), [dayTr]);
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

  function saveTr(form) {
    if (editTr) { updTr(editTr.id, form); toast("Termin aktualisiert", "success"); }
    else { addTr(form); toast("Termin angelegt", "success"); }
    setShowTrModal(false); setEditTr(null);
  }

  function advance(t) {
    const hasHM = hatHauptmangel(t.mängel);
    const next = t.status === STATUS.GEPLANT
      ? STATUS.IN_PRUEFUNG
      : t.status === STATUS.IN_PRUEFUNG
        ? (hasHM ? STATUS.NICHT_BESTANDEN : STATUS.BESTANDEN)
        : null;
    if (!next) return;
    updTr(t.id, { status: next });
    toast(`→ ${next}`, hasHM && next === STATUS.NICHT_BESTANDEN ? "warn" : "success");
  }

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(
    isoDate(new Date(new Date(date).setDate(new Date(date).getDate() - new Date(date).getDay() + 1 + i))), 0
  )), [date]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setDate(d => addDays(d, -1))}
            style={{ background: C.glass, border: `1px solid ${C.line}`, borderRadius: 8, padding: "7px 10px", color: C.t2, cursor: "pointer", display: "flex" }}>
            <ChevronLeft size={15} />
          </button>
          <div style={{ minWidth: 220, textAlign: "center" }}>
            <div style={{ fontSize: 21, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em" }}>{dayName(date)}</div>
            <div style={{ fontSize: 12, color: C.t4, fontFamily: C.mono }}>{fmtDateLong(date)}</div>
          </div>
          <button onClick={() => setDate(d => addDays(d, 1))}
            style={{ background: C.glass, border: `1px solid ${C.line}`, borderRadius: 8, padding: "7px 10px", color: C.t2, cursor: "pointer", display: "flex" }}>
            <ChevronRight size={15} />
          </button>
          {date !== isoDate() && (
            <button onClick={() => setDate(isoDate())}
              style={{ background: "rgba(75,140,247,0.10)", border: `1px solid rgba(75,140,247,0.22)`, borderRadius: 8, padding: "7px 12px", color: C.blueL, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Heute</button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", background: C.surfaceUp, border: `1px solid ${C.line}`, borderRadius: 10, padding: 3, gap: 2 }}>
            {[["timeline", "Zeitplan"], ["table", "Tabelle"]].map(([v, l]) => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                padding: "6px 14px", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 12,
                fontWeight: viewMode === v ? 600 : 400, transition: "all 0.15s",
                background: viewMode === v ? C.surface : "transparent",
                color: viewMode === v ? C.t1 : C.t3,
                boxShadow: viewMode === v ? "0 1px 4px rgba(15,23,42,0.10)" : "none",
              }}>
                {l}
              </button>
            ))}
          </div>
          <BtnP onClick={() => { setEditTr(null); setShowTrModal(true); }} icon={Plus}>Termin anlegen</BtnP>
        </div>
      </div>

      {/* Week mini-nav */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {weekDays.map(d => {
          const cnt = termine.filter(t => t.datum === d).length;
          const isToday = d === isoDate(); const isSel = d === date;
          return (
            <button key={d} onClick={() => setDate(d)}
              style={{ background: isSel ? C.blue : isToday ? "rgba(75,140,247,0.10)" : C.glass, border: `1px solid ${isSel ? "transparent" : isToday ? "rgba(75,140,247,0.26)" : C.line}`, borderRadius: 8, padding: "7px 4px", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
              <div style={{ fontSize: 10, color: isSel ? "rgba(255,255,255,0.8)" : C.t4, marginBottom: 2 }}>{dayShort(d)}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: isSel ? "#fff" : isToday ? C.blue : C.t2, fontFamily: C.mono }}>
                {new Date(d).getDate()}
              </div>
              {cnt > 0 && <div style={{ fontSize: 9, color: isSel ? "rgba(255,255,255,0.75)" : C.t4, marginTop: 2, fontFamily: C.mono }}>{cnt}</div>}
            </button>
          );
        })}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
        <Kpi label="Termine" value={stats.total} accent={C.blue} icon={Calendar} />
        <Kpi label="Bestanden" value={stats.bestanden} sub={passRate != null ? `${passRate}%` : ""} accent={C.green} icon={CheckCircle2} />
        <Kpi label="Nicht bestanden" value={stats.failed} accent={C.red} icon={XCircle} />
        <Kpi label="Ausstehend" value={stats.offen} accent={C.amber} icon={Clock} />
        <Kpi label="Mit Hauptmangel" value={stats.hm} accent={C.purple} icon={AlertOctagon} />
      </div>

      {/* Timeline view */}
      {viewMode === "timeline" && (
        <div style={{ background: C.surfaceUp, border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={12} color={C.blue} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Tagesplan — {dayTr.length} Termine
            </span>
          </div>
          <div>
            {TIME_SLOTS.map(slot => {
              const slotTr = dayTr.filter(t => t.uhrzeit === slot);
              return (
                <div key={slot} onContextMenu={e => openCtx(e, slot)} style={{ display: "flex", borderBottom: `1px solid ${C.line}`, minHeight: slotTr.length ? undefined : 40 }}>
                  <div style={{ width: 68, flexShrink: 0, padding: "12px 16px 12px 20px", textAlign: "right", borderRight: `1px solid ${C.line}` }}>
                    <span style={{ fontSize: 11, color: C.t4, fontFamily: C.mono }}>{slot}</span>
                  </div>
                  <div style={{ flex: 1, padding: slotTr.length ? "8px 16px" : "0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {slotTr.length === 0 ? (
                      <div style={{ height: 40, display: "flex", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: C.t4, fontStyle: "italic" }}>Keine Termine — Rechtsklick zum Hinzufügen</span>
                      </div>
                    ) : slotTr.map(t => {
                      const fz = fzMap[t.fahrzeugId];
                      const sc = STATUS_CFG[t.status] || STATUS_CFG[STATUS.GEPLANT];
                      const hmV = hatHauptmangel(t.mängel);
                      const art = PRUEFUNG_ARTEN.find(a => a.id === t.art);
                      const pruefer = PRUEFER.find(p => p.id === t.pruefer);
                      const canAdv = t.status === STATUS.GEPLANT || t.status === STATUS.IN_PRUEFUNG;
                      return (
                        <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          onContextMenu={e => { e.stopPropagation(); openCtx(e, slot, t); }}
                          className="termin-row"
                          style={{ background: C.surface, border: `1px solid ${sc.border}`, borderLeft: `3px solid ${sc.dot}`, borderRadius: 10, padding: "11px 14px", display: "flex", alignItems: "center", gap: 16, cursor: "context-menu", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: C.t1, fontFamily: C.mono, letterSpacing: "0.05em" }}>{fz?.kennzeichen || "—"}</span>
                              <span style={{ fontSize: 12, color: C.t3 }}>{fz?.hersteller} {fz?.modell}</span>
                              <StatusPill status={t.status} />
                              {hmV && <HauptmangelBadge />}
                            </div>
                            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                              <span style={{ fontSize: 11, color: C.t3 }}>{art?.label || t.art}</span>
                              <span style={{ fontSize: 11, color: C.t4 }}>·</span>
                              <span style={{ fontSize: 11, color: C.t3 }}>{pruefer?.name || t.pruefer}</span>
                              <span style={{ fontSize: 11, color: C.t4 }}>·</span>
                              <span style={{ fontSize: 11, color: C.t3 }}>{fz?.besitzer}</span>
                              {t.mängel?.length > 0 && (
                                <span style={{ fontSize: 11, color: C.amberL, fontFamily: C.mono }}>{t.mängel.length} Mangel{t.mängel.length !== 1 ? "..." : ""}</span>
                              )}
                              {art?.dauer && <span style={{ fontSize: 10, color: C.t4 }}>~{art.dauer} min</span>}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                            {canAdv && (
                              <button onClick={() => advance(t)}
                                className="btn-primary"
                                style={{ display: "flex", alignItems: "center", gap: 4, background: "linear-gradient(135deg,#2563EB,#3B82F6)", border: "none", borderRadius: 6, padding: "5px 10px", color: "#fff", cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: C.mono, boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}>
                                <ArrowRight size={11} />
                                {t.status === STATUS.GEPLANT ? "Starten" : "Fertig"}
                              </button>
                            )}
                            <IconBtn onClick={() => setMaengelId(t.id)} icon={<ClipboardList size={13} />} color={C.amberL} title="Mängel erfassen" />
                            <IconBtn onClick={() => { setEditTr(t); setShowTrModal(true); }} icon={<Pencil size={13} />} color={C.t3} title="Bearbeiten" />
                            <IconBtn onClick={() => setConfirmDel(t.id)} icon={<Trash2 size={13} />} color={C.redL} danger title="Löschen" />
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
        <div style={{ background: C.surfaceUp, border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.line}`, background: C.surfaceUp }}>
                  {["Zeit", "Kennzeichen", "Fahrzeug", "Prüfart", "Prüfer", "Status", "Mängel", "Aktionen"].map(h => (
                    <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayTr.length === 0 && (
                  <tr><td colSpan={8}><EmptyState icon={Calendar} title="Keine Termine" sub="Rechtsklick auf einen Zeitslot zum Anlegen." /></td></tr>
                )}
                {dayTr.map((t, i) => {
                  const fz = fzMap[t.fahrzeugId];
                  const art = PRUEFUNG_ARTEN.find(a => a.id === t.art);
                  const pr = PRUEFER.find(p => p.id === t.pruefer);
                  const hmV = hatHauptmangel(t.mängel);
                  return (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${C.line}`, background: i % 2 === 0 ? C.glass : "transparent" }}>
                      <td style={{ padding: "10px 14px", fontFamily: C.mono, fontSize: 12, color: C.t2, whiteSpace: "nowrap" }}>{t.uhrzeit}</td>
                      <td style={{ padding: "10px 14px", fontFamily: C.mono, fontWeight: 700, fontSize: 13, color: C.t1 }}>{fz?.kennzeichen || "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: C.t3 }}>{fz?.hersteller} {fz?.modell}</td>
                      <td style={{ padding: "10px 14px", fontSize: 11, color: C.t3, whiteSpace: "nowrap" }}>{art?.label || t.art}</td>
                      <td style={{ padding: "10px 14px", fontSize: 11, color: C.t3 }}>{pr?.name || t.pruefer}</td>
                      <td style={{ padding: "10px 14px" }}><StatusPill status={t.status} /></td>
                      <td style={{ padding: "10px 14px" }}>
                        {t.mängel?.length > 0 ? (
                          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                            {t.mängel.map(m => <MangelPill key={m.id} kat={m.kat} />)}
                            {hmV && <span style={{ fontSize: 9, color: C.redL, fontWeight: 700 }}>HM</span>}
                          </div>
                        ) : <span style={{ fontSize: 11, color: C.t4 }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <IconBtn sm onClick={() => setMaengelId(t.id)} icon={<ClipboardList size={11} />} color={C.amberL} />
                          <IconBtn sm onClick={() => { setEditTr(t); setShowTrModal(true); }} icon={<Pencil size={11} />} color={C.t3} />
                          <IconBtn sm onClick={() => setConfirmDel(t.id)} icon={<Trash2 size={11} />} color={C.redL} danger />
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
          onConfirm={() => { delTr(confirmDel); setConfirmDel(null); toast("Termin gelöscht", "info"); }}
          onCancel={() => setConfirmDel(null)} />}
        {showTrModal && <TerminModal fahrzeuge={fahrzeuge}
          initial={editTr ? { ...editTr } : { datum: date, ...(newTrInit || {}) }}
          onSave={saveTr} onClose={() => { setShowTrModal(false); setEditTr(null); setNewTrInit(null); }} />}
        {maengelTr && <MaengelModal termin={maengelTr} fahrzeug={fzMap[maengelTr.fahrzeugId]}
          onAdd={addMangel} onDel={delMangel}
          onStatus={(id, s) => { updTr(id, { status: s }); toast(`Status: ${s}`, "success"); }}
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
  termine: PropTypes.arrayOf(TerminShape).isRequired,
  addTr: PropTypes.func.isRequired,
  updTr: PropTypes.func.isRequired,
  delTr: PropTypes.func.isRequired,
  addMangel: PropTypes.func.isRequired,
  delMangel: PropTypes.func.isRequired,
  toast: PropTypes.func.isRequired,
};
