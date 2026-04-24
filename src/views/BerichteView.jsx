import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, ChevronUp, Eye, Download,
} from "lucide-react";
import { C } from "../styles/theme";
import { STATUS } from "../constants/status";
import { PRUEFUNG_ARTEN, PRUEFER } from "../constants/pruefung";
import { MANGEL_KATEGORIEN } from "../constants/mangel";
import { fmtDate } from "../utils/date";
import { hatHauptmangel } from "../utils/mangel";
import { StatusPill } from "../components/ui/StatusPill";
import { MangelPill } from "../components/ui/MangelPill";
import { HauptmangelBadge } from "../components/ui/HauptmangelBadge";
import { EmptyState } from "../components/ui/EmptyState";
import { Inp } from "../components/ui/inputs";
import { BtnG, BtnP } from "../components/ui/buttons";
import { Modal } from "../components/modal/Modal";
import { FahrzeugShape, TerminShape } from "../types/propTypes";

export function BerichteView({ termine, fahrzeuge }) {
  const fzMap = useMemo(() => Object.fromEntries(fahrzeuge.map(f => [f.id, f])), [fahrzeuge]);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [sortDir, setSortDir] = useState("desc");
  const [preview, setPreview] = useState(null);

  const filtered = useMemo(() =>
    termine.filter(t => {
      if (filter === "bestanden" && t.status !== STATUS.BESTANDEN) return false;
      if (filter === "failed" && t.status !== STATUS.NICHT_BESTANDEN) return false;
      if (filter === "nachp" && t.status !== STATUS.NACHPRUEFUNG) return false;
      if (filter === "maengel" && (!t.mängel || t.mängel.length === 0)) return false;
      if (filter === "hm" && !hatHauptmangel(t.mängel)) return false;
      if (q) { const ql = q.toLowerCase(); const fz = fzMap[t.fahrzeugId]; return (fz?.kennzeichen || "").toLowerCase().includes(ql) || (fz?.besitzer || "").toLowerCase().includes(ql) || (t.art || "").toLowerCase().includes(ql); }
      return true;
    }).sort((a, b) => sortDir === "desc" ? b.datum.localeCompare(a.datum) : a.datum.localeCompare(b.datum)),
    [termine, filter, q, sortDir, fzMap]
  );

  function buildBericht(t) {
    const fz = fzMap[t.fahrzeugId];
    const art = PRUEFUNG_ARTEN.find(a => a.id === t.art);
    const pr = PRUEFER.find(p => p.id === t.pruefer);
    const mangelText = t.mängel?.length > 0
      ? t.mängel.map(m => `  [${MANGEL_KATEGORIEN[m.kat]?.kurz || m.kat}] ${m.code.padEnd(8)} ${m.text}`).join("\n")
      : "  Keine Mängel festgestellt.";
    return `
╔══════════════════════════════════════════════════════════════════════╗
║             TÜV PRÜFBERICHT — AMTLICHES DOKUMENT                    ║
║         Technische Überwachungsorganisation — Prüfstelle             ║
╚══════════════════════════════════════════════════════════════════════╝

PRÜFINFORMATIONEN
  Referenz-Nummer:   ${t.id.toUpperCase()}
  Prüfdatum:         ${fmtDate(t.datum)}  ${t.uhrzeit} Uhr
  Prüfart:           ${art?.label || t.art}
  Rechtsgrundlage:   ${art?.code || "StVZO"}
  Prüfer:            ${pr?.name || t.pruefer} (${pr?.zert || "—"})
  Ergebnis:          *** ${t.status.toUpperCase()} ***
  Geplante Dauer:    ${art?.dauer || "—"} Minuten

══════════════════════════════════════════════════════════════════════════

FAHRZEUGDATEN
  Amtl. Kennzeichen: ${fz?.kennzeichen || "—"}
  Hersteller / Typ:  ${fz?.hersteller || "—"} ${fz?.modell || ""}
  Fahrzeugklasse:    ${fz?.typ || "—"}
  Baujahr:           ${fz?.baujahr || "—"}
  Farbe:             ${fz?.farbe || "—"}
  FIN (17-stellig):  ${fz?.fin || "—"}
  Kilometerstand:    ${fz?.kmStand ? fz.kmStand.toLocaleString("de-DE") + " km" : "—"}
  HU fällig:         ${fz?.hu_faellig ? fmtDate(fz.hu_faellig) : "—"}

══════════════════════════════════════════════════════════════════════════

FAHRZEUGHALTER
  Name / Firma:      ${fz?.besitzer || "—"}
  Telefon:           ${fz?.telefon || "—"}
  E-Mail:            ${fz?.email || "—"}

══════════════════════════════════════════════════════════════════════════

MÄNGELKATEGORIEN
  OM = Ohne Mangel | GM = Geringer Mangel | EM = Erheblicher Mangel
  HM = Hauptmangel (nicht bestanden) | GF = Gefährlicher Mangel

FESTGESTELLTE MÄNGEL (${t.mängel?.length || 0})
${mangelText}

══════════════════════════════════════════════════════════════════════════

PRÜFNOTIZEN
  ${t.notiz || "Keine Notizen."}

══════════════════════════════════════════════════════════════════════════

RECHTLICHER HINWEIS
  Dieser Bericht wurde maschinell durch das TÜV-Prüfstellenverwaltungs-
  system erstellt und ist ohne Unterschrift gültig. Einsprüche innerhalb
  von 14 Tagen schriftlich an die Prüfstelle zu richten.

  Erstellt am: ${new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} Uhr
══════════════════════════════════════════════════════════════════════════
`.trim();
  }

  function download(t) {
    const fz = fzMap[t.fahrzeugId];
    const txt = buildBericht(t);
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Pruefbericht_${(fz?.kennzeichen || "").replace(/[\s-]/g, "_")}_${t.datum}.txt`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.t4 }} />
          <Inp value={q} onChange={e => setQ(e.target.value)} placeholder="Kennzeichen, Besitzer, Prüfart..." style={{ paddingLeft: 34 }} />
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
          const hasHm = hatHauptmangel(t.mängel);
          const art = PRUEFUNG_ARTEN.find(a => a.id === t.art);
          const pr = PRUEFER.find(p => p.id === t.pruefer);
          return (
            <div key={t.id} className="fz-card" style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 6px rgba(15,23,42,0.05)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.t1, fontFamily: C.mono, letterSpacing: "0.05em" }}>{fz?.kennzeichen || "—"}</span>
                  <span style={{ fontSize: 12, color: C.t3 }}>{fz?.hersteller} {fz?.modell}</span>
                  <StatusPill status={t.status} />
                  {hasHm && <HauptmangelBadge />}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: C.t4, fontFamily: C.mono }}>{fmtDate(t.datum)} · {t.uhrzeit}</span>
                  <span style={{ fontSize: 11, color: C.t4 }}>{art?.label || t.art}</span>
                  <span style={{ fontSize: 11, color: C.t4 }}>{pr?.name || t.pruefer}</span>
                  <span style={{ fontSize: 11, color: C.t4 }}>{fz?.besitzer}</span>
                </div>
                {t.mängel?.length > 0 && <div style={{ marginTop: 5, display: "flex", gap: 3, flexWrap: "wrap" }}>{t.mängel.map(m => <MangelPill key={m.id} kat={m.kat} />)}</div>}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => setPreview(t)}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: C.glass, border: `1px solid ${C.line}`, borderRadius: 7, padding: "6px 11px", color: C.t3, cursor: "pointer", fontSize: 11 }}>
                  <Eye size={11} />Vorschau
                </button>
                <button onClick={() => download(t)}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(75,140,247,0.08)", border: `1px solid rgba(75,140,247,0.22)`, borderRadius: 7, padding: "6px 11px", color: C.blueL, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                  <Download size={11} />Download
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
              {buildBericht(preview)}
            </pre>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
              <BtnG onClick={() => setPreview(null)}>Schließen</BtnG>
              <BtnP onClick={() => download(preview)} icon={Download}>Herunterladen</BtnP>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

BerichteView.propTypes = {
  termine: PropTypes.arrayOf(TerminShape).isRequired,
  fahrzeuge: PropTypes.arrayOf(FahrzeugShape).isRequired,
};
