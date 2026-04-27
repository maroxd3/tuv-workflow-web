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
    const hatHm = (t.mängel || []).some(m => m.kat === "HM" || m.kat === "GM");
    const isPassed = t.status === STATUS.BESTANDEN;
    const isFailed = t.status === STATUS.NICHT_BESTANDEN;
    const isNachp = t.status === STATUS.NACHPRUEFUNG;
    const verkehr = isPassed ? "GEGEBEN" : (isFailed || hatHm) ? "NICHT GEGEBEN" : isNachp ? "MIT EINSCHRÄNKUNGEN" : "ZU PRÜFEN";
    const resultColor = isPassed ? "#15803d" : (isFailed || hatHm) ? "#991b1b" : "#a16207";
    const resultLight = isPassed ? "#dcfce7" : (isFailed || hatHm) ? "#fee2e2" : "#fef3c7";
    const erstellt = new Date().toLocaleDateString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const erstelltDatum = new Date().toLocaleDateString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
    const refNr = `TPP-NDS-${new Date().getFullYear()}-${t.id.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)}`;
    const escape = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
    const km = fz?.kmStand ? fz.kmStand.toLocaleString("de-DE") + " km" : "—";
    const naechsteHu = fz?.hu_faellig ? fmtDate(fz.hu_faellig) : "—";

    const maengelRows = t.mängel?.length > 0
      ? t.mängel.map((m, i) => {
          const kat = MANGEL_KATEGORIEN[m.kat] || { kurz: m.kat, label: "Unbekannt" };
          const isHm = m.kat === "HM" || m.kat === "GM";
          return `<tr>
            <td class="num">${i + 1}.</td>
            <td class="kat ${isHm ? "kat-hm" : ""}"><strong>${escape(kat.kurz)}</strong></td>
            <td class="mono">${escape(m.code)}</td>
            <td>${escape(m.text)}${m.behoben ? " <span class=\"behoben\">[behoben]</span>" : ""}</td>
          </tr>`;
        }).join("")
      : `<tr><td colspan="4" class="muted center">– Keine Mängel festgestellt –</td></tr>`;

    return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Prüfbericht ${escape(fz?.kennzeichen || "")} – ${escape(fmtDate(t.datum))}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Inter:wght@400;500;600;700;800&display=swap');

  @page { size: A4; margin: 16mm 14mm 24mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Source Serif 4', 'Times New Roman', serif;
    color: #1e293b;
    background: #ffffff;
    font-size: 10.5pt;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    background-image:
      repeating-linear-gradient(45deg, transparent 0 14px, rgba(30,58,95,0.012) 14px 15px);
  }
  .sans { font-family: 'Inter', -apple-system, sans-serif; }
  .mono { font-family: 'Consolas', 'JetBrains Mono', 'Courier New', monospace; }
  .muted { color: #64748b; }
  .center { text-align: center; }

  /* ── Top decorative bar ── */
  .top-bar {
    height: 6px;
    background: linear-gradient(90deg, #1e3a8a 0%, #1e3a8a 70%, #b45309 70%, #b45309 100%);
    margin: -16mm -14mm 12px;
  }

  /* ── Header block ── */
  .head {
    display: grid;
    grid-template-columns: 56px 1fr auto;
    gap: 16px;
    align-items: flex-start;
    padding-bottom: 12px;
    margin-bottom: 4px;
    border-bottom: 2px solid #1e3a8a;
  }
  .seal {
    width: 56px; height: 56px;
    border: 2px solid #1e3a8a;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    color: #1e3a8a;
    background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
    position: relative;
  }
  .seal::before {
    content: '';
    position: absolute;
    inset: 4px;
    border: 1px solid #1e3a8a;
    border-radius: 50%;
    opacity: 0.4;
  }
  .seal .seal-top { font-size: 7.5pt; font-weight: 800; letter-spacing: 0.05em; line-height: 1; }
  .seal .seal-mid { font-size: 14pt; font-weight: 800; letter-spacing: -0.02em; line-height: 1; margin-top: 2px; }
  .seal .seal-bot { font-size: 5.5pt; font-weight: 600; letter-spacing: 0.1em; line-height: 1; margin-top: 2px; opacity: 0.7; }

  .pruefstelle .name {
    font-family: 'Inter', sans-serif;
    font-size: 12.5pt;
    font-weight: 800;
    color: #1e3a8a;
    letter-spacing: -0.01em;
    line-height: 1.1;
  }
  .pruefstelle .role {
    font-family: 'Inter', sans-serif;
    font-size: 7.5pt;
    color: #64748b;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-top: 1px;
  }
  .pruefstelle .addr {
    font-size: 8.5pt;
    color: #475569;
    line-height: 1.5;
    margin-top: 6px;
  }

  .ref-block {
    text-align: right;
    border-left: 2px solid #1e3a8a;
    padding-left: 14px;
    min-width: 170px;
  }
  .ref-block .label {
    font-family: 'Inter', sans-serif;
    font-size: 6.5pt;
    color: #64748b;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-bottom: 1px;
  }
  .ref-block .value { font-family: 'Consolas', monospace; font-size: 10pt; font-weight: 700; color: #1e3a8a; line-height: 1.3; }
  .ref-block .value.small { font-size: 9pt; font-weight: 600; color: #334155; }
  .ref-block .row { margin-bottom: 5px; }

  /* ── Document title ── */
  .doc-title {
    text-align: center;
    margin: 18px 0 14px;
    padding: 12px 0;
    border-top: 1px solid #cbd5e1;
    border-bottom: 1px solid #cbd5e1;
  }
  .doc-title .typ {
    font-family: 'Inter', sans-serif;
    font-size: 7.5pt;
    color: #64748b;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .doc-title h1 {
    font-family: 'Source Serif 4', serif;
    font-size: 24pt;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #1e3a8a;
    line-height: 1;
    margin-bottom: 4px;
  }
  .doc-title .subt {
    font-family: 'Inter', sans-serif;
    font-size: 9pt;
    color: #475569;
    font-weight: 500;
    letter-spacing: 0.04em;
  }

  /* ── Result block ── */
  .result {
    margin: 14px 0 18px;
    border: 2px solid ${resultColor};
    background: ${resultLight};
    border-radius: 4px;
    padding: 12px 16px;
    page-break-inside: avoid;
    position: relative;
  }
  .result::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 4px; height: 100%;
    background: ${resultColor};
  }
  .result .row { display: flex; justify-content: space-between; align-items: center; gap: 14px; }
  .result .lbl {
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    color: ${resultColor};
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .result .verkehr {
    font-family: 'Inter', sans-serif;
    font-size: 16pt;
    font-weight: 800;
    color: ${resultColor};
    letter-spacing: -0.01em;
    line-height: 1.05;
  }
  .result .status {
    font-family: 'Inter', sans-serif;
    font-size: 9pt;
    color: ${resultColor};
    font-weight: 600;
    margin-top: 3px;
    letter-spacing: 0.04em;
  }
  .result .meta { font-family: 'Inter', sans-serif; font-size: 8.5pt; color: #1e293b; line-height: 1.65; text-align: right; }
  .result .meta strong { color: #0f172a; font-weight: 600; }
  .result .meta .label { color: #64748b; font-size: 7.5pt; letter-spacing: 0.04em; }

  /* ── Sections ── */
  section { margin-bottom: 14px; page-break-inside: avoid; }
  section h2 {
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    font-weight: 800;
    color: #ffffff;
    background: #1e3a8a;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 3px 3px 0 0;
  }
  section .body {
    border: 1px solid #cbd5e1;
    border-top: none;
    background: #fafbfc;
    padding: 10px 14px;
    border-radius: 0 0 3px 3px;
  }

  /* ── Form-style data grid ── */
  .form-grid { display: grid; grid-template-columns: 130px 1fr 130px 1fr; gap: 4px 16px; font-size: 10pt; }
  .form-grid .lbl {
    font-family: 'Inter', sans-serif;
    color: #475569;
    font-size: 8.5pt;
    font-weight: 500;
    border-bottom: 1px dotted #cbd5e1;
    padding-bottom: 2px;
    align-self: end;
  }
  .form-grid .val {
    color: #0f172a;
    border-bottom: 1px solid #94a3b8;
    padding: 0 2px 2px;
    min-height: 14pt;
  }
  .form-grid .val.strong { font-weight: 700; }

  /* ── Mängel table ── */
  table.maengel { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  table.maengel th {
    font-family: 'Inter', sans-serif;
    text-align: left;
    font-size: 7.5pt;
    color: #475569;
    background: #f1f5f9;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
  }
  table.maengel td {
    padding: 5px 8px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }
  table.maengel td.num { text-align: center; width: 28px; color: #64748b; font-family: 'Consolas', monospace; font-size: 9pt; }
  table.maengel td.kat { text-align: center; width: 38px; }
  table.maengel td.kat strong {
    font-family: 'Inter', sans-serif;
    display: inline-block;
    font-size: 8.5pt;
    padding: 2px 6px;
    border-radius: 2px;
    background: #e2e8f0;
    color: #475569;
    font-weight: 700;
  }
  table.maengel td.kat-hm strong { background: #fecaca; color: #991b1b; border: 1px solid #ef4444; }
  table.maengel .behoben { font-family: 'Inter', sans-serif; font-size: 7.5pt; color: #15803d; font-weight: 600; }
  table.maengel td.center { text-align: center; }

  .legend {
    font-family: 'Inter', sans-serif;
    font-size: 7.5pt;
    color: #64748b;
    margin-top: 6px;
    line-height: 1.55;
    padding: 0 4px;
  }
  .legend strong { color: #334155; font-weight: 600; }
  .legend .hm { color: #991b1b; font-weight: 700; }

  .notiz-box {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-left: 3px solid #b45309;
    padding: 10px 14px;
    font-size: 10pt;
    color: #1e293b;
    line-height: 1.55;
    border-radius: 0 3px 3px 0;
    min-height: 36pt;
  }

  /* ── Signature block ── */
  .sig {
    margin-top: 24px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    page-break-inside: avoid;
  }
  .sig-cell {
    border-top: 1.5px solid #1e293b;
    padding-top: 6px;
    min-height: 64pt;
    position: relative;
  }
  .sig-cell .place {
    font-family: 'Inter', sans-serif;
    font-size: 9pt;
    color: #1e293b;
    font-weight: 500;
    margin-bottom: 4px;
  }
  .sig-cell .label {
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    color: #64748b;
    letter-spacing: 0.04em;
    margin-top: 32pt;
    border-top: 1px solid #1e293b;
    padding-top: 3px;
  }
  .stamp-area {
    position: absolute;
    right: 4px;
    top: 6px;
    width: 80px; height: 50px;
    border: 1px dashed #94a3b8;
    border-radius: 4px;
    color: #cbd5e1;
    font-family: 'Inter', sans-serif;
    font-size: 7.5pt;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    line-height: 1.2;
  }

  /* ── Footer (fixed, on every page) ── */
  .footer {
    position: fixed;
    bottom: 6mm;
    left: 14mm;
    right: 14mm;
    padding-top: 6px;
    border-top: 1px solid #cbd5e1;
    font-family: 'Inter', sans-serif;
    font-size: 7pt;
    color: #64748b;
    line-height: 1.5;
  }
  .footer .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .footer .legal { max-width: 75%; }
  .footer .legal strong { color: #334155; font-weight: 600; }
  .footer .ref-foot { text-align: right; font-family: 'Consolas', monospace; font-size: 7.5pt; color: #1e3a8a; font-weight: 600; }
  .footer .ref-foot .small { color: #94a3b8; font-size: 6.5pt; font-weight: 500; }

  @media screen { body { padding: 24px; max-width: 820px; margin: 0 auto; box-shadow: 0 4px 30px rgba(15,23,42,0.12); } }
</style>
</head>
<body>
  <div class="top-bar"></div>

  <div class="head">
    <div class="seal">
      <div class="seal-top">PRÜF</div>
      <div class="seal-mid">TPP</div>
      <div class="seal-bot">STELLE</div>
    </div>
    <div class="pruefstelle">
      <div class="name">Prüfstelle Pro Hannover</div>
      <div class="role">Sachverständigenbüro für Kraftfahrzeuge</div>
      <div class="addr">
        An der Prüfstrecke 12 · 30459 Hannover<br>
        Telefon: 0511 / 1234-5678 · prufstelle-hannover@tpp.de
      </div>
    </div>
    <div class="ref-block">
      <div class="row"><div class="label">Berichts-Nummer</div><div class="value">${escape(refNr)}</div></div>
      <div class="row"><div class="label">Prüfstellen-Nr.</div><div class="value small mono">DE-NDS-PR-0042</div></div>
      <div class="row"><div class="label">Ausstellungsdatum</div><div class="value small">${escape(erstelltDatum)}</div></div>
    </div>
  </div>

  <div class="doc-title">
    <div class="typ">Amtliche Prüfung nach § 29 Straßenverkehrs-Zulassungs-Ordnung</div>
    <h1>P r ü f b e r i c h t</h1>
    <div class="subt">${escape(art?.label || t.art)} &nbsp;·&nbsp; ${escape(art?.code || "§ 29 StVZO")} i. V. m. Anlage VIII Nr. 1.2</div>
  </div>

  <div class="result">
    <div class="row">
      <div>
        <div class="lbl">Verkehrssicherheit</div>
        <div class="verkehr">${escape(verkehr)}</div>
        <div class="status">Status: ${escape(t.status)}</div>
      </div>
      <div class="meta">
        <div class="label">Prüfdatum</div><strong>${escape(fmtDate(t.datum))}</strong> &nbsp; ${escape(t.uhrzeit)} Uhr<br>
        <div class="label" style="margin-top:4px">Prüfingenieur</div><strong>${escape(pr?.name || t.pruefer)}</strong>${pr?.zert ? ` (Zert. ${escape(pr.zert)})` : ""}<br>
        <div class="label" style="margin-top:4px">Nächste HU fällig</div><strong>${escape(naechsteHu)}</strong>
      </div>
    </div>
  </div>

  <section>
    <h2>I. Fahrzeugdaten</h2>
    <div class="body">
      <div class="form-grid">
        <div class="lbl">Amtl. Kennzeichen</div><div class="val strong mono">${escape(fz?.kennzeichen || "—")}</div>
        <div class="lbl">Fahrzeugklasse</div><div class="val">${escape(fz?.typ || "—")}</div>
        <div class="lbl">Hersteller</div><div class="val">${escape(fz?.hersteller || "—")}</div>
        <div class="lbl">Typ / Modell</div><div class="val">${escape(fz?.modell || "—")}</div>
        <div class="lbl">Baujahr</div><div class="val">${escape(fz?.baujahr || "—")}</div>
        <div class="lbl">Farbe</div><div class="val">${escape(fz?.farbe || "—")}</div>
        <div class="lbl">FIN (17-stellig)</div><div class="val mono">${escape(fz?.fin || "—")}</div>
        <div class="lbl">Kilometerstand</div><div class="val">${escape(km)}</div>
      </div>
    </div>
  </section>

  <section>
    <h2>II. Fahrzeughalter / Auftraggeber</h2>
    <div class="body">
      <div class="form-grid">
        <div class="lbl">Name / Firma</div><div class="val strong">${escape(fz?.besitzer || "—")}</div>
        <div class="lbl">Telefon</div><div class="val mono">${escape(fz?.telefon || "—")}</div>
        <div class="lbl">E-Mail</div><div class="val">${escape(fz?.email || "—")}</div>
        <div class="lbl"></div><div class="val"></div>
      </div>
    </div>
  </section>

  <section>
    <h2>III. Festgestellte Mängel — ${t.mängel?.length || 0} Eintrag${(t.mängel?.length || 0) === 1 ? "" : "e"} (StVZO Anlage VIII)</h2>
    <div class="body" style="padding: 8px 10px">
      <table class="maengel">
        <thead>
          <tr>
            <th style="width:28px">Nr.</th>
            <th style="width:38px">Kat.</th>
            <th style="width:80px">Code</th>
            <th>Beschreibung</th>
          </tr>
        </thead>
        <tbody>${maengelRows}</tbody>
      </table>
      <div class="legend">
        <strong>Mangel-Kategorien gemäß Anlage VIII StVZO:</strong>
        OM = Ohne Mangel · LM = Leichter Mangel · EM = Erheblicher Mangel ·
        <span class="hm">HM = Hauptmangel</span> (verkehrsunsicher) ·
        <span class="hm">GM = Gefährlicher Mangel</span> (sofortige Stilllegung)
      </div>
    </div>
  </section>

  <section>
    <h2>IV. Bemerkungen / Prüfnotizen</h2>
    <div class="body" style="padding: 0; border: none">
      <div class="notiz-box">${t.notiz ? escape(t.notiz) : "<span class=\"muted\">– Keine besonderen Bemerkungen –</span>"}</div>
    </div>
  </section>

  <div class="sig">
    <div class="sig-cell">
      <div class="place">Hannover, ${escape(erstelltDatum)}</div>
      <div class="label">Ort, Datum</div>
    </div>
    <div class="sig-cell">
      <div class="stamp-area">Stempel<br>der Prüfstelle</div>
      <div class="label">Unterschrift Prüfingenieur</div>
    </div>
  </div>

  <div class="footer">
    <div class="row">
      <div class="legal">
        <strong>Rechtshinweis:</strong> Dieser Bericht wurde gemäß § 29 StVZO i. V. m. Anlage VIII (BGBl. I S. 1090) erstellt und gilt nur für das in Abschnitt I bezeichnete Fahrzeug am Tag der Prüfung. Einsprüche sind binnen 14 Tagen nach Erhalt schriftlich an die Prüfstelle zu richten. Der Bericht ersetzt nicht die Prüfplakette an Fahrzeug und Kennzeichen.
      </div>
      <div class="ref-foot">
        ${escape(refNr)}<br>
        <span class="small">Erstellt: ${escape(erstellt)} Uhr · Seite 1 von 1</span>
      </div>
    </div>
  </div>

  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 350));</script>
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
