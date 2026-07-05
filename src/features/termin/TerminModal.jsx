import { useState } from "react";
import PropTypes from "prop-types";
import { AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { C } from "../../styles/theme";
import { STATUS } from "../../constants/status";
import { FAHRZEUG_TYPEN, TIME_SLOTS } from "../../constants/fahrzeug";
import { PRUEFUNG_ARTEN, PRUEFER } from "../../constants/pruefung";
import { isoDate, fmtDate, toIsoDateStr, toTimeStr } from "../../utils/date";
import { Modal } from "../../components/modal/Modal";
import { ConfirmModal } from "../../components/modal/ConfirmModal";
import { Inp, Sel, Fld } from "../../components/ui/inputs";
import { BtnG, BtnP } from "../../components/ui/buttons";
import { FahrzeugShape, HalterShape, TerminShape } from "../../types/propTypes";
import { hatHauptmangel } from "../../utils/mangel";
import { validateTerminDatum } from "../../utils/validators";

export function TerminModal({ fahrzeuge, halter = [], termine = [], initial = {}, onSave, onClose }) {
  const bestanden_gesperrt = hatHauptmangel(initial.maengel);
  // initial kann ein DB-Termin sein: datum/uhrzeit ggf. als Date bzw.
  // "HH:MM:SS" → fuer die Inputs auf "yyyy-mm-dd"/"HH:MM" normalisieren.
  const [form, setForm] = useState(() => ({
    fahrzeugId: initial.fahrzeugId ?? (fahrzeuge[0]?.fahrzeugId || ""),
    datum: initial.datum ? toIsoDateStr(initial.datum) : isoDate(),
    uhrzeit: toTimeStr(initial.uhrzeit) ?? "08:00",
    prueftCode: initial.prueftCode ?? "HU",
    prueferKuerzel: initial.prueferKuerzel ?? PRUEFER[0].id,
    statusCode: initial.statusCode ?? STATUS.GEPLANT,
    notiz: initial.notiz ?? "",
  }));
  const [err, setErr] = useState({});
  const [dupWarn, setDupWarn] = useState(null); // Duplikat-Rueckfrage (ersetzt window.confirm)
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const isEdit = !!initial.terminId;
  const selFz = fahrzeuge.find(fz => fz.fahrzeugId === form.fahrzeugId);
  const selArt = PRUEFUNG_ARTEN.find(a => a.id === form.prueftCode);
  const selP = PRUEFER.find(p => p.id === form.prueferKuerzel);
  const halterName = fz => halter.find(h => h.halterId === fz.halterId)?.name || "";

  function validate() {
    const e = {};
    if (!form.fahrzeugId) e.fahrzeugId = "Bitte Fahrzeug wählen";
    const eDatum = validateTerminDatum(form.datum);
    if (eDatum) e.datum = eDatum;
    if (form.statusCode === STATUS.BESTANDEN && bestanden_gesperrt) {
      e.statusCode = "Bestanden nicht möglich — Hauptmangel vorhanden (§ 29 StVZO)";
    }
    setErr(e);
    return Object.keys(e).length === 0;
  }

  function save() {
    if (!validate()) return;
    // UX-Warnung: gleiches Auto + gleicher Tag + gleiche Pruefart bereits gebucht?
    // DB erlaubt das (verschiedene Uhrzeiten = verschiedene Slots), aber in der
    // Werkstatt-Realitaet ist es meistens ein Tippfehler des Empfangs.
    const duplicate = termine.find((t) =>
      t.fahrzeugId === form.fahrzeugId &&
      toIsoDateStr(t.datum) === form.datum &&
      t.prueftCode === form.prueftCode &&
      t.terminId !== initial.terminId,
    );
    if (duplicate) {
      setDupWarn(
        `${selFz?.kennzeichen || "Dieses Fahrzeug"} hat am ${fmtDate(form.datum)} ` +
        `bereits eine Prüfung der Art "${selArt?.label || form.prueftCode}" um ${toTimeStr(duplicate.uhrzeit)}. ` +
        `Trotzdem zusätzlich anlegen?`,
      );
      return;
    }
    onSave(form);
  }

  return (
    <Modal title={isEdit ? "Termin bearbeiten" : "Prüftermin anlegen"} sub="Terminplanung und Ressourcenzuweisung" onClose={onClose} width={600}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Fld label="Fahrzeug *" error={err.fahrzeugId}>
          <Sel value={form.fahrzeugId} onChange={f("fahrzeugId")}>
            <option value="">— Fahrzeug wählen —</option>
            {fahrzeuge.map(fz => <option key={fz.fahrzeugId} value={fz.fahrzeugId}>{fz.kennzeichen} · {fz.hersteller} {fz.modell} ({halterName(fz)})</option>)}
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
            <span style={{ color: C.t3, fontSize: 12 }}>{selFz.kilometerstand?.toLocaleString("de-DE")} km</span>
            {selFz.huFaellig && <span style={{ color: new Date(selFz.huFaellig) < new Date() ? C.redL : C.t3, fontSize: 12 }}>HU: {fmtDate(selFz.huFaellig)}</span>}
          </div>
        )}
        <div className="grid-resp-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Fld label="Datum *" error={err.datum}>
            <Inp value={form.datum} onChange={f("datum")} type="date" min={isoDate()} error={err.datum} />
          </Fld>
          <Fld label="Uhrzeit">
            <Sel value={form.uhrzeit} onChange={f("uhrzeit")}>
              {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
            </Sel>
          </Fld>
          <Fld label="Art der Prüfung">
            <Sel value={form.prueftCode} onChange={f("prueftCode")}>
              {PRUEFUNG_ARTEN.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
            </Sel>
          </Fld>
          <Fld label="Prüfer / Sachverständiger">
            <Sel value={form.prueferKuerzel} onChange={f("prueferKuerzel")}>
              {PRUEFER.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Sel>
          </Fld>
          <Fld label="Status" error={bestanden_gesperrt && form.statusCode === STATUS.BESTANDEN ? "Bestanden nicht möglich — Hauptmangel vorhanden" : undefined}>
            <Sel value={form.statusCode} onChange={f("statusCode")}>
              {Object.values(STATUS).map(s => {
                const disabled = s === STATUS.BESTANDEN && bestanden_gesperrt;
                return <option key={s} disabled={disabled}>{s}{disabled ? " (gesperrt: Hauptmangel)" : ""}</option>;
              })}
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

      {/* Duplikat-Rueckfrage (ersetzt window.confirm) */}
      <AnimatePresence>
        {dupWarn && (
          <ConfirmModal
            title="Doppelter Termin?"
            msg={dupWarn}
            danger={false}
            onConfirm={() => { setDupWarn(null); onSave(form); }}
            onCancel={() => setDupWarn(null)}
          />
        )}
      </AnimatePresence>
    </Modal>
  );
}

TerminModal.propTypes = {
  fahrzeuge: PropTypes.arrayOf(FahrzeugShape).isRequired,
  halter: PropTypes.arrayOf(HalterShape),
  termine: PropTypes.arrayOf(TerminShape),
  initial: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
