import React, { useState } from "react";
import { Check } from "lucide-react";
import { C } from "../../styles/theme";
import { STATUS } from "../../constants/status";
import { FAHRZEUG_TYPEN, TIME_SLOTS } from "../../constants/fahrzeug";
import { PRUEFUNG_ARTEN, PRUEFER } from "../../constants/pruefung";
import { isoDate, fmtDate } from "../../utils/date";
import { Modal } from "../../components/modal/Modal";
import { Inp, Sel, Fld } from "../../components/ui/inputs";
import { BtnG, BtnP } from "../../components/ui/buttons";

export function TerminModal({ fahrzeuge, initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({
    fahrzeugId: fahrzeuge[0]?.id || "", datum: isoDate(), uhrzeit: "08:00",
    art: "HU", pruefer: PRUEFER[0].id, status: STATUS.GEPLANT, notiz: "", ...initial,
  });
  const [err, setErr] = useState({});
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const isEdit = !!initial.id;
  const selFz = fahrzeuge.find(fz => fz.id === form.fahrzeugId);
  const selArt = PRUEFUNG_ARTEN.find(a => a.id === form.art);
  const selP = PRUEFER.find(p => p.id === form.pruefer);

  function validate() {
    const e = {};
    if (!form.fahrzeugId) e.fahrzeugId = "Bitte Fahrzeug wählen";
    if (!form.datum) e.datum = "Pflichtfeld";
    setErr(e);
    return Object.keys(e).length === 0;
  }

  function save() { if (!validate()) return; onSave(form); }

  return (
    <Modal title={isEdit ? "Termin bearbeiten" : "Prüftermin anlegen"} sub="Terminplanung und Ressourcenzuweisung" onClose={onClose} width={600}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Fld label="Fahrzeug *" error={err.fahrzeugId}>
          <Sel value={form.fahrzeugId} onChange={f("fahrzeugId")}>
            <option value="">— Fahrzeug wählen —</option>
            {fahrzeuge.map(fz => <option key={fz.id} value={fz.id}>{fz.kennzeichen} · {fz.hersteller} {fz.modell} ({fz.besitzer})</option>)}
          </Sel>
        </Fld>
        {selFz && (
          <div style={{
            background: C.surfaceHigh, border: `1px solid rgba(37,99,235,0.18)`,
            borderRadius: 8, padding: "10px 14px", display: "flex", gap: 20, flexWrap: "wrap",
          }}>
            <span style={{ fontFamily: C.mono, fontWeight: 700, color: C.blueL, fontSize: 13 }}>{selFz.kennzeichen}</span>
            <span style={{ color: C.t3, fontSize: 12 }}>{FAHRZEUG_TYPEN.find(t => t.id === selFz.typ)?.icon} {selFz.typ}</span>
            <span style={{ color: C.t3, fontSize: 12 }}>{selFz.baujahr || "—"}</span>
            <span style={{ color: C.t3, fontSize: 12 }}>{selFz.kmStand?.toLocaleString("de-DE")} km</span>
            {selFz.hu_faellig && <span style={{ color: new Date(selFz.hu_faellig) < new Date() ? C.redL : C.t3, fontSize: 12 }}>HU: {fmtDate(selFz.hu_faellig)}</span>}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Fld label="Datum *" error={err.datum}>
            <Inp value={form.datum} onChange={f("datum")} type="date" error={err.datum} />
          </Fld>
          <Fld label="Uhrzeit">
            <Sel value={form.uhrzeit} onChange={f("uhrzeit")}>
              {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
            </Sel>
          </Fld>
          <Fld label="Art der Prüfung">
            <Sel value={form.art} onChange={f("art")}>
              {PRUEFUNG_ARTEN.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
            </Sel>
          </Fld>
          <Fld label="Prüfer / Sachverständiger">
            <Sel value={form.pruefer} onChange={f("pruefer")}>
              {PRUEFER.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Sel>
          </Fld>
          <Fld label="Status">
            <Sel value={form.status} onChange={f("status")}>
              {Object.values(STATUS).map(s => <option key={s}>{s}</option>)}
            </Sel>
          </Fld>
          <Fld label="Geplante Dauer">
            <div style={{ background: C.surfaceUp, border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 12px", color: C.t3, fontSize: 13, fontFamily: C.mono }}>
              {selArt?.dauer || "—"} Minuten
            </div>
          </Fld>
        </div>
        {selArt && (
          <div style={{ background: C.surfaceUp, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 14px", fontSize: 11, color: C.t3, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span>Rechtsgrundlage: <span style={{ color: C.t2, fontFamily: C.mono }}>{selArt.code}</span></span>
            {selP && <span>Prüfer: <span style={{ color: C.t2 }}>{selP.name} · {selP.zert}</span></span>}
          </div>
        )}
        <Fld label="Notizen / Hinweise">
          <textarea value={form.notiz} onChange={f("notiz")} rows={3}
            placeholder="Besondere Hinweise zur Prüfung, Vorausinformationen..."
            style={{
              background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8,
              padding: "9px 12px", color: C.t1, fontSize: 13, outline: "none", width: "100%",
              fontFamily: C.sans, resize: "vertical",
            }} />
        </Fld>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${C.line}` }}>
          <BtnG onClick={onClose}>Abbrechen</BtnG>
          <BtnP onClick={save} icon={Check}>{isEdit ? "Aktualisieren" : "Termin anlegen"}</BtnP>
        </div>
      </div>
    </Modal>
  );
}
