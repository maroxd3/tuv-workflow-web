import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Pencil, Trash2, X, User, Gauge, ClipboardList,
  AlertTriangle, Car,
  Calendar as CalIcon,
} from "lucide-react";
import { C } from "../styles/theme";
import { STATUS } from "../constants/status";
import { FAHRZEUG_TYPEN } from "../constants/fahrzeug";
import { PRUEFUNG_ARTEN, PRUEFER } from "../constants/pruefung";
import { fmtDate } from "../utils/date";
import { StatusPill } from "../components/ui/StatusPill";
import { MangelPill } from "../components/ui/MangelPill";
import { EmptyState } from "../components/ui/EmptyState";
import { Kpi } from "../components/ui/Kpi";
import { SectionHead } from "../components/ui/SectionHead";
import { Inp, Sel } from "../components/ui/inputs";
import { BtnG, BtnP } from "../components/ui/buttons";
import { ConfirmModal } from "../components/modal/ConfirmModal";
import { FahrzeugModal } from "../features/fahrzeug/FahrzeugModal";

export function FahrzeugeView({ fahrzeuge, termine, addFz, updFz, delFz, toast }) {
  const [q, setQ] = useState("");
  const [typFilter, setTypFilter] = useState("Alle");
  const [showModal, setShowModal] = useState(false);
  const [editFz, setEditFz] = useState(null);
  const [sel, setSel] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [sortBy, setSortBy] = useState("kennzeichen");

  const typen = ["Alle", ...new Set(fahrzeuge.map(f => f.typ))];

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return fahrzeuge
      .filter(f => (typFilter === "Alle" || f.typ === typFilter) &&
        (!ql || f.kennzeichen.toLowerCase().includes(ql) || (f.besitzer || "").toLowerCase().includes(ql) ||
          (f.hersteller || "").toLowerCase().includes(ql) || (f.modell || "").toLowerCase().includes(ql) ||
          (f.fin || "").toLowerCase().includes(ql)))
      .sort((a, b) => a[sortBy]?.toString().localeCompare(b[sortBy]?.toString()) || 0);
  }, [fahrzeuge, q, typFilter, sortBy]);

  function getLastTr(fzId) { return termine.filter(t => t.fahrzeugId === fzId).sort((a, b) => b.datum.localeCompare(a.datum))[0]; }
  function getTrCnt(fzId) { return termine.filter(t => t.fahrzeugId === fzId).length; }
  function getHuStatus(fz) {
    if (!fz.hu_faellig) return null;
    const days = Math.ceil((new Date(fz.hu_faellig) - new Date()) / (1000 * 60 * 60 * 24));
    return { days, color: days < 0 ? C.redL : days < 30 ? C.orangeL : days < 90 ? C.amberL : C.greenL, label: days < 0 ? `${Math.abs(days)}d überfällig` : `in ${days}d` };
  }

  function save(form) {
    if (editFz) { updFz(editFz.id, form); toast("Fahrzeug aktualisiert", "success"); if (sel?.id === editFz.id) setSel({ ...editFz, ...form }); }
    else { addFz(form); toast("Fahrzeug erfasst", "success"); }
    setShowModal(false); setEditFz(null);
  }

  const sidebarTr = sel ? termine.filter(t => t.fahrzeugId === sel.id).sort((a, b) => b.datum.localeCompare(a.datum)) : [];

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.t4 }} />
          <Inp value={q} onChange={e => setQ(e.target.value)} placeholder="Kennzeichen, FIN, Besitzer, Hersteller..." style={{ paddingLeft: 34 }} />
        </div>
        <Sel value={typFilter} onChange={e => setTypFilter(e.target.value)} style={{ width: 200 }}>
          {typen.map(t => <option key={t}>{t}</option>)}
        </Sel>
        <Sel value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 160 }}>
          <option value="kennzeichen">Sortierung: KFZ</option>
          <option value="besitzer">Sortierung: Halter</option>
          <option value="hersteller">Sortierung: Marke</option>
        </Sel>
        <BtnP onClick={() => { setEditFz(null); setShowModal(true); }} icon={Plus}>Fahrzeug erfassen</BtnP>
      </div>

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        <Kpi label="Fahrzeuge gesamt" value={fahrzeuge.length} accent={C.blue} icon={Car} />
        <Kpi label="PKW" value={fahrzeuge.filter(f => f.typ === "PKW").length} accent={C.cyan} icon={Car} />
        <Kpi label="Nutzfahrzeuge" value={fahrzeuge.filter(f => ["LKW", "Transporter", "Sattel", "Bus"].includes(f.typ)).length} accent={C.amber} icon={Car} />
        <Kpi label="HU überfällig" value={fahrzeuge.filter(f => f.hu_faellig && new Date(f.hu_faellig) < new Date()).length} accent={C.red} icon={AlertTriangle} />
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 10 }}>
        {filtered.map(fz => {
          const lastT = getLastTr(fz.id); const cnt = getTrCnt(fz.id); const hu = getHuStatus(fz);
          const fzTyp = FAHRZEUG_TYPEN.find(t => t.id === fz.typ);
          return (
            <motion.div key={fz.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => setSel(fz)} className="fz-card"
              style={{ background: sel?.id === fz.id ? C.surfaceHigh : C.surface, border: `1px solid ${sel?.id === fz.id ? C.blue : C.line}`, borderRadius: 12, padding: "16px 18px", cursor: "pointer", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: C.t1, fontFamily: C.mono, letterSpacing: "0.06em" }}>{fz.kennzeichen}</div>
                  <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{fz.hersteller} {fz.modell} {fz.baujahr ? `(${fz.baujahr})` : ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: C.t4, marginBottom: 4 }}>{fzTyp?.icon} {fz.typ}</div>
                  {lastT && <StatusPill status={lastT.status} />}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: hu ? 8 : 0 }}>
                <span style={{ fontSize: 11, color: C.t4, display: "flex", alignItems: "center", gap: 3 }}><User size={10} />{fz.besitzer}</span>
                {fz.kmStand && <span style={{ fontSize: 11, color: C.t4, display: "flex", alignItems: "center", gap: 3 }}><Gauge size={10} />{fz.kmStand.toLocaleString("de-DE")} km</span>}
                <span style={{ fontSize: 11, color: C.t4, display: "flex", alignItems: "center", gap: 3 }}><ClipboardList size={10} />{cnt} Prüfung{cnt !== 1 ? "en" : ""}</span>
              </div>
              {hu && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 8, borderTop: `1px solid ${C.line}` }}>
                  <CalIcon size={10} color={hu.color} />
                  <span style={{ fontSize: 11, color: hu.color, fontFamily: C.mono }}>HU {fmtDate(fz.hu_faellig)}</span>
                  <span style={{ fontSize: 10, color: hu.color, background: `${hu.color}18`, border: `1px solid ${hu.color}30`, borderRadius: 999, padding: "1px 7px" }}>{hu.label}</span>
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
          <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setSel(null)}>
            <motion.div initial={{ x: 480, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 480, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 460, background: C.bg, borderLeft: `1px solid ${C.line}`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
              {/* Sidebar header */}
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.line}`, background: C.surface, position: "sticky", top: 0, zIndex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 23, fontWeight: 700, color: C.t1, fontFamily: C.mono, letterSpacing: "0.05em" }}>{sel.kennzeichen}</div>
                    <div style={{ fontSize: 13, color: C.t3 }}>{sel.hersteller} {sel.modell}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={e => { e.stopPropagation(); setEditFz(sel); setShowModal(true); }}
                      style={{ background: C.glass, border: `1px solid ${C.line}`, borderRadius: 6, padding: 6, cursor: "pointer", color: C.t3, display: "flex" }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setSel(null)}
                      style={{ background: C.glass, border: `1px solid ${C.line}`, borderRadius: 6, padding: 6, cursor: "pointer", color: C.t3, display: "flex" }}>
                      <X size={13} />
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {sidebarTr[0] && <StatusPill status={sidebarTr[0].status} />}
                  <span style={{ fontSize: 10, background: C.glass, border: `1px solid ${C.line}`, borderRadius: 999, padding: "3px 10px", color: C.t3, fontFamily: C.mono }}>{FAHRZEUG_TYPEN.find(t => t.id === sel.typ)?.icon} {sel.typ}</span>
                  {sel.fin && <span style={{ fontSize: 10, background: C.glass, border: `1px solid ${C.line}`, borderRadius: 999, padding: "3px 10px", color: C.t4, fontFamily: C.mono }}>{sel.fin}</span>}
                </div>
              </div>

              <div style={{ padding: "20px 24px", flex: 1 }}>
                {/* Details */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                  {[
                    ["Baujahr", sel.baujahr || "—"], ["Farbe", sel.farbe || "—"],
                    ["Kilometerstand", sel.kmStand ? `${sel.kmStand.toLocaleString("de-DE")} km` : "—"],
                    ["Halter", sel.besitzer],
                    ["Telefon", sel.telefon || "—"], ["E-Mail", sel.email || "—"],
                    ["HU fällig", sel.hu_faellig ? fmtDate(sel.hu_faellig) : "—"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: C.surfaceUp, borderRadius: 8, padding: "9px 12px", border: `1px solid ${C.line}` }}>
                      <div style={{ fontSize: 9, color: C.t4, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{k}</div>
                      <div style={{ fontSize: 12, color: C.t1, wordBreak: "break-all" }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* History */}
                <SectionHead label="Prüfungshistorie" />
                {sidebarTr.length === 0 && <div style={{ fontSize: 13, color: C.t4, padding: "16px 0" }}>Keine Prüfungen.</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {sidebarTr.map(t => {
                    const art = PRUEFUNG_ARTEN.find(a => a.id === t.art);
                    const pr = PRUEFER.find(p => p.id === t.pruefer);
                    return (
                      <div key={t.id} style={{ background: C.surfaceUp, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 13px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: C.t3, fontFamily: C.mono }}>{fmtDate(t.datum)} {t.uhrzeit}</span>
                          <StatusPill status={t.status} />
                        </div>
                        <div style={{ fontSize: 12, color: C.t4 }}>{art?.label || t.art} · {pr?.name || t.pruefer}</div>
                        {t.mängel?.length > 0 && <div style={{ marginTop: 6, display: "flex", gap: 3, flexWrap: "wrap" }}>{t.mängel.map(m => <MangelPill key={m.id} kat={m.kat} />)}</div>}
                        {t.notiz && <div style={{ marginTop: 6, fontSize: 11, color: C.t4, borderTop: `1px solid ${C.line}`, paddingTop: 6 }}>{t.notiz}</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
                  <BtnG onClick={() => setConfirmDel(sel.id)} danger icon={Trash2}>Fahrzeug löschen</BtnG>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDel && <ConfirmModal title="Fahrzeug löschen?" msg="Alle Termine dieses Fahrzeugs werden ebenfalls gelöscht."
          onConfirm={() => { delFz(confirmDel); setSel(null); setConfirmDel(null); toast("Fahrzeug gelöscht", "info"); }}
          onCancel={() => setConfirmDel(null)} />}
        {showModal && <FahrzeugModal initial={editFz || {}} onSave={save} onClose={() => { setShowModal(false); setEditFz(null); }} />}
      </AnimatePresence>
    </div>
  );
}
