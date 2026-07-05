import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, ChevronUp, Eye, FileText, Printer,
} from "lucide-react";
import { C } from "../styles/theme";
import { STATUS } from "../constants/status";
import { PRUEFUNG_ARTEN, PRUEFER } from "../constants/pruefung";
import { fmtDate, toIsoDateStr, toTimeStr } from "../utils/date";
import { hatHauptmangel } from "../utils/mangel";
import { buildBerichtHtml, buildBerichtText } from "../features/bericht/reportHtml";
import { StatusPill } from "../components/ui/StatusPill";
import { MangelPill } from "../components/ui/MangelPill";
import { HauptmangelBadge } from "../components/ui/HauptmangelBadge";
import { EmptyState } from "../components/ui/EmptyState";
import { Inp } from "../components/ui/inputs";
import { BtnG, BtnP } from "../components/ui/buttons";
import { Modal } from "../components/modal/Modal";
import { ConfirmModal } from "../components/modal/ConfirmModal";
import { FahrzeugShape, HalterShape, TerminShape } from "../types/propTypes";

export function BerichteView({ termine, fahrzeuge, halter }) {
  const fzMap = useMemo(() => Object.fromEntries(fahrzeuge.map(f => [f.fahrzeugId, f])), [fahrzeuge]);
  const halterMap = useMemo(() => Object.fromEntries(halter.map(h => [h.halterId, h])), [halter]);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [sortDir, setSortDir] = useState("desc");
  const [preview, setPreview] = useState(null);
  const [popupBlocked, setPopupBlocked] = useState(false);

  const filtered = useMemo(() =>
    termine.filter(t => {
      if (filter === "bestanden" && t.statusCode !== STATUS.BESTANDEN) return false;
      if (filter === "failed" && t.statusCode !== STATUS.NICHT_BESTANDEN) return false;
      if (filter === "nachp" && t.statusCode !== STATUS.NACHPRUEFUNG) return false;
      if (filter === "maengel" && (!t.maengel || t.maengel.length === 0)) return false;
      if (filter === "hm" && !hatHauptmangel(t.maengel)) return false;
      if (q) { const ql = q.toLowerCase(); const fz = fzMap[t.fahrzeugId]; const h = fz ? halterMap[fz.halterId] : null; return (fz?.kennzeichen || "").toLowerCase().includes(ql) || (h?.name || "").toLowerCase().includes(ql) || (t.prueftCode || "").toLowerCase().includes(ql); }
      return true;
    }).sort((a, b) => sortDir === "desc"
      ? toIsoDateStr(b.datum).localeCompare(toIsoDateStr(a.datum))
      : toIsoDateStr(a.datum).localeCompare(toIsoDateStr(b.datum))),
    [termine, filter, q, sortDir, fzMap, halterMap]
  );

  function exportPdf(t) {
    const fz = fzMap[t.fahrzeugId];
    const html = buildBerichtHtml(t, fz, fz ? halterMap[fz.halterId] : null);
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) {
      setPopupBlocked(true);
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    // Drucken vom Opener aus anstossen: das Popup erbt unsere CSP, die
    // Inline-Scripts blockt — ein <script> im Bericht-HTML wuerde also
    // nie laufen. 350ms Delay wie vorher, damit Fonts/Layout stehen.
    setTimeout(() => {
      w.focus();
      w.print();
    }, 350);
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200, maxWidth: 360 }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.t4 }} />
          <Inp value={q} onChange={e => setQ(e.target.value)} placeholder="Suche..." style={{ paddingLeft: 34 }} />
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {[["all", "Alle"], ["bestanden", "Bestanden"], ["failed", "Nicht bestanden"], ["nachp", "Nachprüfung"], ["maengel", "Mit Mängeln"], ["hm", "Hauptmängel"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className="btn-ghost" style={{
              background: filter === k ? C.blue : C.surface,
              border: `1px solid ${filter === k ? C.blue : C.line}`,
              borderRadius: 8, padding: "7px 14px",
              color: filter === k ? "#fff" : C.t3,
              cursor: "pointer", fontSize: 12, fontWeight: filter === k ? 600 : 400,
              boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
            }}>{l}</button>
          ))}
        </div>
        <button onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")} className="btn-ghost"
          style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, padding: "7px 14px", color: C.t2, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 5, fontWeight: 500, boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}>
          {sortDir === "desc" ? <ChevronDown size={13} /> : <ChevronUp size={13} />} Datum
        </button>
        <span style={{ fontSize: 11, color: C.t4, fontFamily: C.mono, marginLeft: "auto" }}>{filtered.length} Einträge</span>
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {filtered.map(t => {
          const fz = fzMap[t.fahrzeugId];
          const h = fz ? halterMap[fz.halterId] : null;
          const hasHm = hatHauptmangel(t.maengel);
          const art = PRUEFUNG_ARTEN.find(a => a.id === t.prueftCode);
          const pr = PRUEFER.find(p => p.id === t.prueferKuerzel);
          return (
            <div key={t.terminId} className="fz-card" style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 6px rgba(15,23,42,0.05)", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.t1, fontFamily: C.mono, letterSpacing: "0.05em" }}>{fz?.kennzeichen || "—"}</span>
                  <span style={{ fontSize: 12, color: C.t3 }}>{fz?.hersteller} {fz?.modell}</span>
                  <StatusPill status={t.statusCode} />
                  {hasHm && <HauptmangelBadge />}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: C.t4, fontFamily: C.mono }}>{fmtDate(t.datum)} · {toTimeStr(t.uhrzeit)}</span>
                  <span style={{ fontSize: 11, color: C.t4 }}>{art?.label || t.prueftCode}</span>
                  <span style={{ fontSize: 11, color: C.t4 }}>{pr?.name || t.prueferKuerzel}</span>
                  <span style={{ fontSize: 11, color: C.t4 }}>{h?.name}</span>
                </div>
                {t.maengel?.length > 0 && <div style={{ marginTop: 5, display: "flex", gap: 3, flexWrap: "wrap" }}>{t.maengel.map(m => <MangelPill key={m.mangelId} kat={m.kategorieCode} />)}</div>}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => setPreview(t)}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: C.glass, border: `1px solid ${C.line}`, borderRadius: 7, padding: "6px 11px", color: C.t3, cursor: "pointer", fontSize: 11 }}>
                  <Eye size={11} />Vorschau
                </button>
                <button onClick={() => exportPdf(t)}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(75,140,247,0.08)", border: `1px solid rgba(75,140,247,0.22)`, borderRadius: 7, padding: "6px 11px", color: C.blueL, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                  <FileText size={11} />PDF
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <EmptyState icon={Search} title="Keine Einträge gefunden" sub="Versuche andere Filter oder Suchbegriffe." />}
      </div>

      {/* Preview modal */}
      <AnimatePresence>
        {preview && (
          <Modal title={`Bericht: ${fzMap[preview.fahrzeugId]?.kennzeichen || ""}`} onClose={() => setPreview(null)} width={720}>
            <pre style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: 16, fontSize: 11, color: C.t2, fontFamily: C.mono, overflowX: "auto", whiteSpace: "pre-wrap", maxHeight: 500, overflowY: "auto", lineHeight: 1.6 }}>
              {buildBerichtText(preview, fzMap[preview.fahrzeugId], halterMap[fzMap[preview.fahrzeugId]?.halterId])}
            </pre>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
              <BtnG onClick={() => setPreview(null)}>Schließen</BtnG>
              <BtnP onClick={() => exportPdf(preview)} icon={Printer}>PDF erzeugen</BtnP>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Pop-up-Blocker-Hinweis (ersetzt window.alert) */}
      <AnimatePresence>
        {popupBlocked && (
          <ConfirmModal
            title="Pop-up blockiert"
            msg="Bitte Pop-ups für diese Seite erlauben, damit die PDF-Vorschau geöffnet werden kann."
            danger={false}
            onConfirm={() => setPopupBlocked(false)}
            onCancel={() => setPopupBlocked(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

BerichteView.propTypes = {
  termine: PropTypes.arrayOf(TerminShape).isRequired,
  fahrzeuge: PropTypes.arrayOf(FahrzeugShape).isRequired,
  halter: PropTypes.arrayOf(HalterShape).isRequired,
};
