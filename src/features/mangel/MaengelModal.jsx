import React, { useState, useMemo } from "react";
import { Search, Plus, Check, X, Info, AlertOctagon, CheckCircle2, ChevronUp, ChevronDown } from "lucide-react";
import { C } from "../../styles/theme";
import { STATUS, STATUS_CFG } from "../../constants/status";
import { PRUEFUNG_ARTEN } from "../../constants/pruefung";
import { MANGEL_KATEGORIEN, MANGEL_KATALOG } from "../../constants/mangel";
import { hatHauptmangel } from "../../utils/mangel";
import { Modal } from "../../components/modal/Modal";
import { MangelPill } from "../../components/ui/MangelPill";
import { SectionHead } from "../../components/ui/SectionHead";
import { Inp, Sel, Fld } from "../../components/ui/inputs";
import { BtnP } from "../../components/ui/buttons";

export function MaengelModal({ termin, fahrzeug, onAdd, onDel, onStatus, onClose }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("katalog");
  const [custom, setCustom] = useState({ code: "", text: "", kat: "EM" });
  const [gruppeOpen, setGruppeOpen] = useState({});

  const addedCodes = useMemo(() => new Set(termin.mängel?.map(m => m.code) || []), [termin.mängel]);
  const hasHM = hatHauptmangel(termin.mängel);
  const mCount = termin.mängel?.length || 0;

  const groups = useMemo(() => {
    const q = search.toLowerCase();
    const gs = []; let cur = null;
    MANGEL_KATALOG.forEach(e => {
      if (e.gruppe) { cur = { label: e.gruppe, items: [] }; gs.push(cur); }
      else if (cur && (!q || e.text.toLowerCase().includes(q) || e.code.includes(q))) cur.items.push(e);
    });
    return q ? gs.filter(g => g.items.length > 0) : gs;
  }, [search]);

  function addVorlage(v) {
    if (addedCodes.has(v.code)) return;
    onAdd(termin.id, { code: v.code, text: v.text, kat: v.kat, behoben: false });
  }

  function addCustom() {
    if (!custom.text.trim()) return;
    onAdd(termin.id, { code: custom.code || "FR", text: custom.text, kat: custom.kat, behoben: false });
    setCustom({ code: "", text: "", kat: "EM" });
  }

  const art = PRUEFUNG_ARTEN.find(a => a.id === termin.art);

  return (
    <Modal title="Mängelerfassung" sub={`${fahrzeug?.kennzeichen || ""} · ${fahrzeug?.hersteller || ""} ${fahrzeug?.modell || ""} · ${art?.label || ""}`} onClose={onClose} width={860}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* LEFT: Recorded */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <SectionHead label="Erfasste Mängel" />
            <span style={{ fontFamily: C.mono, fontSize: 11, background: C.glass, border: `1px solid ${C.line}`, borderRadius: 999, padding: "2px 9px", color: C.t3 }}>{mCount}</span>
          </div>

          {mCount === 0 ? (
            <div style={{ background: C.glass, border: `1px dashed ${C.line}`, borderRadius: 10, padding: "24px", textAlign: "center", color: C.t4, fontSize: 13 }}>
              Keine Mängel erfasst<br />
              <span style={{ fontSize: 11 }}>Fahrzeug bisher ohne Beanstandungen</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 280, overflowY: "auto" }}>
              {termin.mängel?.map(m => {
                const mc = MANGEL_KATEGORIEN[m.kat];
                return (
                  <div key={m.id}
                    style={{ display: "flex", alignItems: "flex-start", gap: 8, background: C.surfaceHigh, border: `1px solid ${mc?.border || C.line}`, borderRadius: 8, padding: "8px 10px" }}>
                    <MangelPill kat={m.kat} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontFamily: C.mono, color: C.t4 }}>{m.code}</div>
                      <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.4 }}>{m.text}</div>
                    </div>
                    <button onClick={() => onDel(termin.id, m.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.t4, flexShrink: 0, padding: 2 }}>
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {mCount > 0 && (
            <div style={{
              borderRadius: 8, padding: "10px 14px",
              background: hasHM ? "rgba(240,69,90,0.10)" : "rgba(15,194,138,0.10)",
              border: `1px solid ${hasHM ? "rgba(240,69,90,0.30)" : "rgba(15,194,138,0.28)"}`,
            }}>
              <div style={{ fontSize: 12, color: hasHM ? C.redL : C.greenL, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                {hasHM
                  ? <><AlertOctagon size={13} />Hauptmangel vorhanden — nicht bestanden</>
                  : <><CheckCircle2 size={13} />Kein Hauptmangel — Bestehen möglich</>}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.entries(MANGEL_KATEGORIEN).filter(([k]) => k !== "OM").map(([k, v]) => {
                  const cnt = termin.mängel?.filter(m => m.kat === k).length || 0;
                  if (!cnt) return null;
                  return <span key={k} style={{ fontFamily: C.mono, fontSize: 10, color: v.color }}>{cnt}×{v.kurz}</span>;
                })}
              </div>
            </div>
          )}

          {/* Set result */}
          <div style={{ background: C.glass, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.t4, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Prüfergebnis setzen</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {[STATUS.BESTANDEN, STATUS.NICHT_BESTANDEN, STATUS.IN_PRUEFUNG, STATUS.NACHPRUEFUNG, STATUS.ABGEBROCHEN, STATUS.NICHT_ERSCHIENEN].map(s => {
                const sc = STATUS_CFG[s]; const act = termin.status === s;
                return (
                  <button key={s} onClick={() => onStatus(termin.id, s)} style={{
                    background: act ? sc.glow : "transparent", border: `1px solid ${act ? sc.border : C.line}`,
                    borderRadius: 6, padding: "4px 11px", color: act ? sc.color : C.t3,
                    cursor: "pointer", fontSize: 10, fontWeight: act ? 700 : 400, fontFamily: C.mono, transition: "all 0.15s",
                  }}>{s}</button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Catalog */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", borderBottom: `1px solid ${C.line}`, marginBottom: 2 }}>
            {[["katalog", "StVZO-Katalog"], ["custom", "Freitext"]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                background: "none", border: "none", borderBottom: `2px solid ${tab === k ? C.blue : "transparent"}`,
                padding: "7px 16px", color: tab === k ? C.blueL : C.t3, cursor: "pointer",
                fontSize: 12, fontWeight: tab === k ? 700 : 400, transition: "all 0.15s",
              }}>{l}</button>
            ))}
          </div>

          {tab === "katalog" && (
            <>
              <div style={{ position: "relative" }}>
                <Search size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.t4 }} />
                <Inp value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen nach Code oder Beschreibung..." style={{ paddingLeft: 30, fontSize: 12 }} />
              </div>
              <div style={{ overflowY: "auto", maxHeight: 420, display: "flex", flexDirection: "column", gap: 2 }}>
                {groups.map(g => {
                  const open = search || gruppeOpen[g.label] !== false;
                  return (
                    <div key={g.label}>
                      <button onClick={() => !search && setGruppeOpen(p => ({ ...p, [g.label]: !open }))}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                          background: C.glass, border: `1px solid ${C.line}`, borderRadius: 6,
                          padding: "6px 10px", cursor: "pointer", color: C.t3, fontSize: 10, fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2, textAlign: "left",
                        }}>
                        {g.label}
                        {!search && (open ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                      </button>
                      {open && g.items.map(v => {
                        const isAdd = addedCodes.has(v.code);
                        return (
                          <button key={v.code} onClick={() => addVorlage(v)} disabled={isAdd}
                            style={{
                              display: "flex", alignItems: "flex-start", gap: 8, textAlign: "left",
                              background: isAdd ? C.glass : C.glassMed,
                              border: `1px solid ${C.line}`, borderRadius: 6,
                              padding: "7px 9px", cursor: isAdd ? "default" : "pointer",
                              opacity: isAdd ? 0.4 : 1, width: "100%", marginBottom: 2, transition: "all 0.1s",
                            }}>
                            <MangelPill kat={v.kat} />
                            <span style={{ fontSize: 10, fontFamily: C.mono, color: C.t4, minWidth: 34, marginTop: 1 }}>{v.code}</span>
                            <span style={{ fontSize: 12, color: C.t2, flex: 1, lineHeight: 1.4 }}>{v.text}</span>
                            {isAdd
                              ? <Check size={11} color={C.greenL} style={{ flexShrink: 0, marginTop: 2 }} />
                              : <Plus size={11} color={C.blueL} style={{ flexShrink: 0, marginTop: 2 }} />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {tab === "custom" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "rgba(245,158,11,0.08)", border: `1px solid rgba(245,166,32,0.28)`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.amberL, display: "flex", gap: 8, alignItems: "center" }}>
                <Info size={13} />Nur für Mängel ohne passenden Katalogeintrag
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 10 }}>
                <Fld label="Code (opt.)">
                  <Inp value={custom.code} onChange={e => setCustom(p => ({ ...p, code: e.target.value }))} placeholder="FR" />
                </Fld>
                <Fld label="Kategorie">
                  <Sel value={custom.kat} onChange={e => setCustom(p => ({ ...p, kat: e.target.value }))}>
                    {Object.entries(MANGEL_KATEGORIEN).filter(([k]) => k !== "OM").map(([k, v]) =>
                      <option key={k} value={k}>{v.kurz} — {v.label}</option>
                    )}
                  </Sel>
                </Fld>
              </div>
              <Fld label="Mangelbeschreibung *">
                <textarea value={custom.text} onChange={e => setCustom(p => ({ ...p, text: e.target.value }))}
                  placeholder="Freitext-Beschreibung des Mangels..." rows={3}
                  style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 12px", color: C.t1, fontSize: 13, outline: "none", width: "100%", fontFamily: C.sans, resize: "vertical" }} />
              </Fld>
              <BtnP onClick={addCustom} icon={Plus}>Mangel hinzufügen</BtnP>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
