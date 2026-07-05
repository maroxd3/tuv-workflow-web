import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, ChevronUp, Eye, FileText, Printer,
} from "lucide-react";
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

/* Wiederkehrendes Muster: Filter-/Sortier-Chips in der Toolbar */
const CHIP_CLS = "cursor-pointer rounded-lg border px-3.5 py-[7px] text-[12px] shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-all duration-150 hover:bg-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.14)]";

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
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] max-w-[360px] flex-[1_1_240px]">
          <Search size={13} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-t4" />
          <Inp value={q} onChange={e => setQ(e.target.value)} placeholder="Suche..." className="pl-[34px]" />
        </div>
        <div className="flex flex-wrap gap-[5px]">
          {[["all", "Alle"], ["bestanden", "Bestanden"], ["failed", "Nicht bestanden"], ["nachp", "Nachprüfung"], ["maengel", "Mit Mängeln"], ["hm", "Hauptmängel"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`${CHIP_CLS} ${filter === k ? "border-blue bg-blue font-semibold text-white" : "border-line bg-surface font-normal text-t3"}`}>{l}</button>
          ))}
        </div>
        <button onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
          className={`${CHIP_CLS} flex items-center gap-[5px] border-line bg-surface font-medium text-t2`}>
          {sortDir === "desc" ? <ChevronDown size={13} /> : <ChevronUp size={13} />} Datum
        </button>
        <span className="ml-auto font-mono text-[11px] text-t4">{filtered.length} Einträge</span>
      </div>

      {/* List */}
      <div className="flex flex-col gap-[5px]">
        {filtered.map(t => {
          const fz = fzMap[t.fahrzeugId];
          const h = fz ? halterMap[fz.halterId] : null;
          const hasHm = hatHauptmangel(t.maengel);
          const art = PRUEFUNG_ARTEN.find(a => a.id === t.prueftCode);
          const pr = PRUEFER.find(p => p.id === t.prueferKuerzel);
          return (
            <div key={t.terminId}
              className="flex flex-wrap items-center gap-3.5 rounded-xl border border-line bg-surface px-[18px] py-3.5 shadow-[0_2px_6px_rgba(15,23,42,0.05)] transition-all duration-[0.18s] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.10)]">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[14px] font-bold tracking-[0.05em] text-t1">{fz?.kennzeichen || "—"}</span>
                  <span className="text-[12px] text-t3">{fz?.hersteller} {fz?.modell}</span>
                  <StatusPill status={t.statusCode} />
                  {hasHm && <HauptmangelBadge />}
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="font-mono text-[11px] text-t4">{fmtDate(t.datum)} · {toTimeStr(t.uhrzeit)}</span>
                  <span className="text-[11px] text-t4">{art?.label || t.prueftCode}</span>
                  <span className="text-[11px] text-t4">{pr?.name || t.prueferKuerzel}</span>
                  <span className="text-[11px] text-t4">{h?.name}</span>
                </div>
                {t.maengel?.length > 0 && <div className="mt-[5px] flex flex-wrap gap-[3px]">{t.maengel.map(m => <MangelPill key={m.mangelId} kat={m.kategorieCode} />)}</div>}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button onClick={() => setPreview(t)}
                  className="flex cursor-pointer items-center gap-[5px] rounded-[7px] border border-line bg-glass px-[11px] py-1.5 text-[11px] text-t3">
                  <Eye size={11} />Vorschau
                </button>
                <button onClick={() => exportPdf(t)}
                  className="flex cursor-pointer items-center gap-[5px] rounded-[7px] border border-[rgba(75,140,247,0.22)] bg-[rgba(75,140,247,0.08)] px-[11px] py-1.5 text-[11px] font-semibold text-blue-l">
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
            <pre className="max-h-[500px] overflow-y-auto overflow-x-auto whitespace-pre-wrap rounded-lg border border-line bg-bg p-4 font-mono text-[11px] leading-[1.6] text-t2">
              {buildBerichtText(preview, fzMap[preview.fahrzeugId], halterMap[fzMap[preview.fahrzeugId]?.halterId])}
            </pre>
            <div className="mt-4 flex justify-end gap-2.5 border-t border-line pt-3">
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
