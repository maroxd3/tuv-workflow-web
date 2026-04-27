import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, ChevronUp, Eye, FileText, Printer,
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

  function buildBerichtHtml(t) {
    const fz = fzMap[t.fahrzeugId];
    const art = PRUEFUNG_ARTEN.find(a => a.id === t.art);
    const pr = PRUEFER.find(p => p.id === t.pruefer);
    const isPassed = t.status === STATUS.BESTANDEN;
    const isFailed = t.status === STATUS.NICHT_BESTANDEN;
    const resultColor = isPassed ? "#059669" : isFailed ? "#b91c1c" : "#b45309";
    const resultBg = isPassed ? "#d1fae5" : isFailed ? "#fee2e2" : "#fef3c7";
    const erstellt = new Date().toLocaleDateString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const refNr = t.id.toUpperCase().slice(0, 14);
    const escape = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
    const km = fz?.kmStand ? fz.kmStand.toLocaleString("de-DE") + " km" : "—";

    const maengelRows = t.mängel?.length > 0
      ? t.mängel.map(m => {
          const kat = MANGEL_KATEGORIEN[m.kat] || { kurz: m.kat, label: "Unbekannt" };
          const isHm = m.kat === "HM" || m.kat === "GM";
          return `<tr>
            <td class="kat ${isHm ? "kat-hm" : ""}"><strong>${escape(kat.kurz)}</strong></td>
            <td class="mono">${escape(m.code)}</td>
            <td>${escape(m.text)}${m.behoben ? " <span class=\"behoben\">[behoben]</span>" : ""}</td>
          </tr>`;
        }).join("")
      : `<tr><td colspan="3" class="muted">Keine Mängel festgestellt.</td></tr>`;

    return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Prüfbericht ${escape(fz?.kennzeichen || "")} – ${escape(fmtDate(t.datum))}</title>
<style>
  @page { size: A4; margin: 18mm 16mm 22mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif; color: #111827; background: #ffffff; font-size: 10.5pt; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .mono { font-family: "Consolas", "JetBrains Mono", "Courier New", monospace; }
  .muted { color: #6b7280; }

  .top-bar { height: 4px; background: linear-gradient(90deg, #06b6d4, #10b981, #06b6d4); margin-bottom: 14px; }

  .head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; margin-bottom: 18px; }
  .head .brand { font-size: 9pt; font-weight: 800; letter-spacing: 0.18em; color: #0891b2; text-transform: uppercase; }
  .head .brand-sub { font-size: 8pt; color: #6b7280; margin-top: 2px; letter-spacing: 0.04em; }
  .head .ref-block { text-align: right; }
  .head .ref-block .label { font-size: 7pt; color: #6b7280; letter-spacing: 0.12em; text-transform: uppercase; }
  .head .ref-block .ref { font-family: "Consolas", monospace; font-size: 11pt; font-weight: 700; color: #0f172a; }

  h1.title { font-size: 22pt; font-weight: 800; letter-spacing: -0.01em; color: #0f172a; margin-bottom: 2px; }
  .subtitle { font-size: 10pt; color: #6b7280; margin-bottom: 14px; }

  .result-box { background: ${resultBg}; border: 1.5px solid ${resultColor}; border-radius: 6px; padding: 12px 16px; margin: 14px 0 22px; display: flex; align-items: center; justify-content: space-between; page-break-inside: avoid; }
  .result-box .lbl { font-size: 8pt; color: ${resultColor}; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
  .result-box .val { font-size: 18pt; font-weight: 800; color: ${resultColor}; letter-spacing: -0.01em; line-height: 1.1; }
  .result-box .meta { font-size: 8.5pt; color: #4b5563; line-height: 1.45; text-align: right; }

  section { margin-bottom: 16px; page-break-inside: avoid; }
  section h2 { font-size: 8pt; font-weight: 800; color: #6b7280; letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }

  .data-grid { display: grid; grid-template-columns: 130px 1fr 130px 1fr; gap: 6px 14px; font-size: 10pt; }
  .data-grid .lbl { color: #6b7280; font-size: 8.5pt; }
  .data-grid .val { color: #111827; }
  .data-grid .val.strong { font-weight: 700; }

  table.maengel { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  table.maengel th { text-align: left; font-size: 7.5pt; color: #6b7280; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 8px; border-bottom: 1px solid #d1d5db; }
  table.maengel td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  table.maengel td.kat { text-align: center; width: 36px; }
  table.maengel td.kat strong { display: inline-block; font-size: 8.5pt; padding: 2px 6px; border-radius: 3px; background: #f3f4f6; color: #4b5563; }
  table.maengel td.kat-hm strong { background: #fee2e2; color: #b91c1c; }
  table.maengel .behoben { font-size: 8pt; color: #059669; font-weight: 600; }

  .legend { font-size: 8pt; color: #6b7280; margin-top: 6px; line-height: 1.55; }
  .legend strong { color: #4b5563; }

  .notiz-box { background: #f9fafb; border-left: 3px solid #06b6d4; padding: 10px 14px; font-size: 10pt; color: #374151; line-height: 1.55; border-radius: 0 4px 4px 0; }

  .signature { margin-top: 28px; display: flex; justify-content: space-between; gap: 40px; page-break-inside: avoid; }
  .sig-block { flex: 1; }
  .sig-line { border-top: 1px solid #111827; padding-top: 4px; font-size: 8.5pt; color: #4b5563; }

  .footer { position: fixed; bottom: 8mm; left: 16mm; right: 16mm; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 7.5pt; color: #6b7280; display: flex; justify-content: space-between; }
  .footer .legal { max-width: 70%; line-height: 1.5; }

  @media screen { body { padding: 24px; max-width: 800px; margin: 0 auto; box-shadow: 0 0 30px rgba(0,0,0,0.08); } }
</style>
</head>
<body>
  <div class="top-bar"></div>
  <div class="head">
    <div>
      <div class="brand">● TÜV Prüfstelle Pro</div>
      <div class="brand-sub">Technische Überwachungsorganisation · Prüfstelle</div>
    </div>
    <div class="ref-block">
      <div class="label">Berichts-Nr.</div>
      <div class="ref">${escape(refNr)}</div>
    </div>
  </div>

  <h1 class="title">Prüfbericht</h1>
  <div class="subtitle">${escape(art?.label || t.art)} &nbsp;·&nbsp; Rechtsgrundlage ${escape(art?.code || "§ 29 StVZO")}</div>

  <div class="result-box">
    <div>
      <div class="lbl">Prüfergebnis</div>
      <div class="val">${escape(t.status.toUpperCase())}</div>
    </div>
    <div class="meta">
      <strong>${escape(fmtDate(t.datum))}</strong> &nbsp;${escape(t.uhrzeit)} Uhr<br>
      Prüfer: ${escape(pr?.name || t.pruefer)}${pr?.zert ? ` (${escape(pr.zert)})` : ""}<br>
      Geplante Dauer: ${escape(art?.dauer || "—")} Min.
    </div>
  </div>

  <section>
    <h2>Fahrzeugdaten</h2>
    <div class="data-grid">
      <div class="lbl">Kennzeichen</div><div class="val strong mono">${escape(fz?.kennzeichen || "—")}</div>
      <div class="lbl">Fahrzeugklasse</div><div class="val">${escape(fz?.typ || "—")}</div>
      <div class="lbl">Hersteller</div><div class="val">${escape(fz?.hersteller || "—")}</div>
      <div class="lbl">Modell</div><div class="val">${escape(fz?.modell || "—")}</div>
      <div class="lbl">Baujahr</div><div class="val">${escape(fz?.baujahr || "—")}</div>
      <div class="lbl">Farbe</div><div class="val">${escape(fz?.farbe || "—")}</div>
      <div class="lbl">FIN</div><div class="val mono">${escape(fz?.fin || "—")}</div>
      <div class="lbl">Kilometerstand</div><div class="val">${escape(km)}</div>
      <div class="lbl">HU fällig</div><div class="val">${escape(fz?.hu_faellig ? fmtDate(fz.hu_faellig) : "—")}</div>
      <div class="lbl"></div><div class="val"></div>
    </div>
  </section>

  <section>
    <h2>Fahrzeughalter</h2>
    <div class="data-grid">
      <div class="lbl">Name / Firma</div><div class="val strong">${escape(fz?.besitzer || "—")}</div>
      <div class="lbl">Telefon</div><div class="val mono">${escape(fz?.telefon || "—")}</div>
      <div class="lbl">E-Mail</div><div class="val">${escape(fz?.email || "—")}</div>
      <div class="lbl"></div><div class="val"></div>
    </div>
  </section>

  <section>
    <h2>Festgestellte Mängel (${t.mängel?.length || 0})</h2>
    <table class="maengel">
      <thead><tr><th>Kat.</th><th>Code</th><th>Beschreibung</th></tr></thead>
      <tbody>${maengelRows}</tbody>
    </table>
    <div class="legend">
      <strong>Kategorien:</strong> OM = Ohne Mangel · LM = Leichter Mangel · EM = Erheblicher Mangel · <strong style="color:#b91c1c">HM = Hauptmangel</strong> (verkehrsunsicher) · <strong style="color:#b91c1c">GM = Gefährlicher Mangel</strong>
    </div>
  </section>

  ${t.notiz ? `<section><h2>Prüfnotizen</h2><div class="notiz-box">${escape(t.notiz)}</div></section>` : ""}

  <div class="signature">
    <div class="sig-block">
      <div style="height:36px"></div>
      <div class="sig-line">Unterschrift Prüfingenieur</div>
    </div>
    <div class="sig-block">
      <div style="height:36px"></div>
      <div class="sig-line">Stempel der Prüfstelle</div>
    </div>
  </div>

  <div class="footer">
    <div class="legal">
      Maschinell erstellter Bericht. Einsprüche innerhalb 14 Tagen schriftlich an die Prüfstelle. § 29 StVZO i. V. m. Anlage VIII.
    </div>
    <div>Erstellt: ${escape(erstellt)} Uhr</div>
  </div>

  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 250));</script>
</body>
</html>`;
  }

  function exportPdf(t) {
    const html = buildBerichtHtml(t);
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) {
      alert("Bitte Pop-ups für diese Seite erlauben, damit die PDF-Vorschau geöffnet werden kann.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
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
              {buildBericht(preview)}
            </pre>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
              <BtnG onClick={() => setPreview(null)}>Schließen</BtnG>
              <BtnP onClick={() => exportPdf(preview)} icon={Printer}>PDF erzeugen</BtnP>
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
