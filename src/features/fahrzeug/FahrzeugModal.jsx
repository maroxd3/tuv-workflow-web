import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Check, User, AlertTriangle } from "lucide-react";
import { C } from "../../styles/theme";
import { FAHRZEUG_TYPEN } from "../../constants/fahrzeug";
import { HERSTELLER_REFERENZ, normalizeHersteller, getHerstellerDisplayList } from "../../constants/kfzReferenz";
import { Modal } from "../../components/modal/Modal";
import { Inp, Sel, Fld } from "../../components/ui/inputs";
import { BtnG, BtnP } from "../../components/ui/buttons";
import { FahrzeugShape } from "../../types/propTypes";
import { validateFahrzeug, checkFinPruefziffer } from "../../utils/validators";

const SONSTIGER = "__SONSTIGER__";

export function FahrzeugModal({ initial = {}, fahrzeuge = [], onSave, onClose }) {
  const [form, setForm] = useState({
    kennzeichen: "", fin: "", hersteller: "", modell: "",
    farbe: "", typ: "PKW", besitzer: "", telefon: "", email: "",
    hu_faellig: "",
    ...initial,
    baujahr: initial.baujahr ? String(initial.baujahr) : "",
    kmStand: initial.kmStand ? String(initial.kmStand) : "",
  });
  const [err, setErr] = useState({});
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const isEdit = !!initial.id;

  const finWarnung = useMemo(() => checkFinPruefziffer(form.fin), [form.fin]);

  /* Cascading-Dropdown-Logik:
     - Bekannter Hersteller (in kfzReferenz) → Modell- und Typ-Dropdown gefiltert
     - "Sonstiger" → Freitext für Hersteller + Modell, alle Typen wählbar
     `isOther` ist eigenes State, weil der Dropdown-Wert sonst nicht von "leer"
     unterscheidbar wäre, wenn der User SONSTIGER wählt und noch nichts tippt. */
  const initialOther = !!initial.hersteller && !HERSTELLER_REFERENZ[normalizeHersteller(initial.hersteller)];
  const [isOther, setIsOther] = useState(initialOther);
  const herstellerOptions = useMemo(() => getHerstellerDisplayList(), []);
  const herstellerRef = isOther ? null : HERSTELLER_REFERENZ[normalizeHersteller(form.hersteller)];
  const herstellerDropdownValue = isOther ? SONSTIGER : (herstellerRef ? herstellerRef.display : "");

  function onHerstellerChange(e) {
    const v = e.target.value;
    if (v === "") {
      setIsOther(false);
      setForm(p => ({ ...p, hersteller: "", modell: "" }));
      return;
    }
    if (v === SONSTIGER) {
      setIsOther(true);
      setForm(p => ({ ...p, hersteller: "", modell: "" }));
      return;
    }
    setIsOther(false);
    const newRef = HERSTELLER_REFERENZ[normalizeHersteller(v)];
    setForm(p => ({
      ...p,
      hersteller: v,
      modell: newRef.modelle.includes(p.modell) ? p.modell : "",
      typ: newRef.typen.includes(p.typ) ? p.typ : newRef.typen[0],
    }));
  }

  const typOptions = herstellerRef
    ? FAHRZEUG_TYPEN.filter(t => herstellerRef.typen.includes(t.id))
    : FAHRZEUG_TYPEN;

  function save() {
    const e = validateFahrzeug(form, fahrzeuge, isEdit ? initial.id : null);
    setErr(e);
    if (Object.keys(e).length > 0) return;
    onSave({
      ...form,
      kennzeichen: form.kennzeichen.trim().toUpperCase().replace(/\s+/g, " "),
      hersteller: form.hersteller.trim(),
      modell: form.modell.trim(),
      besitzer: form.besitzer.trim(),
      telefon: form.telefon.trim(),
      email: form.email.trim().toLowerCase(),
      fin: form.fin.trim().toUpperCase(),
      farbe: form.farbe.trim(),
      baujahr: form.baujahr ? +form.baujahr : null,
      kmStand: form.kmStand ? +form.kmStand : null,
    });
  }

  return (
    <Modal title={isEdit ? "Fahrzeug bearbeiten" : "Fahrzeug neu erfassen"} sub="Pflichtfelder sind mit * markiert" onClose={onClose} width={720}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Fld label="Kennzeichen *" error={err.kennzeichen}>
          <Inp value={form.kennzeichen} onChange={f("kennzeichen")} placeholder="B-TK 1234"
            error={err.kennzeichen} mono style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.06em" }} />
        </Fld>
        <Fld label="FIN (17 Zeichen)" error={err.fin}>
          <Inp value={form.fin} onChange={f("fin")} placeholder="WBA3A5C50CF256985" error={err.fin} mono style={{ fontSize: 12 }} />
        </Fld>
        <Fld label="Hersteller *" error={err.hersteller}>
          <Sel value={herstellerDropdownValue} onChange={onHerstellerChange}>
            <option value="">— bitte wählen —</option>
            {herstellerOptions.map(d => <option key={d} value={d}>{d}</option>)}
            <option value={SONSTIGER}>Sonstiger / Nicht aufgeführt …</option>
          </Sel>
          {isOther && (
            <Inp value={form.hersteller} onChange={f("hersteller")} placeholder="z. B. Tatra, Lada, Tuning-Werkstatt"
              error={err.hersteller} style={{ marginTop: 6 }} />
          )}
        </Fld>
        <Fld label="Modell / Variante *" error={err.modell}>
          {herstellerRef ? (
            <Sel value={form.modell} onChange={f("modell")}>
              <option value="">— bitte wählen —</option>
              {herstellerRef.modelle.map(m => <option key={m} value={m}>{m}</option>)}
            </Sel>
          ) : (
            <Inp value={form.modell} onChange={f("modell")}
              placeholder={isOther ? "z. B. 815, Niva, RX7-FD" : "Erst Hersteller wählen"}
              error={err.modell} disabled={!form.hersteller} />
          )}
        </Fld>
        <Fld label="Fahrzeugtyp" error={err.typ}>
          <Sel value={form.typ} onChange={f("typ")}>
            {typOptions.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
          </Sel>
        </Fld>
        <Fld label="Baujahr" error={err.baujahr}>
          <Inp value={form.baujahr} onChange={f("baujahr")} placeholder={String(new Date().getFullYear())} type="number" error={err.baujahr} />
        </Fld>
        <Fld label="Farbe">
          <Inp value={form.farbe} onChange={f("farbe")} placeholder="Sophistograu Metallic" />
        </Fld>
        <Fld label="Kilometerstand (km)" error={err.kmStand}>
          <Inp value={form.kmStand} onChange={f("kmStand")} placeholder="87420" type="number" error={err.kmStand} />
        </Fld>
        <Fld label="HU fällig (Datum)" error={err.hu_faellig}>
          <Inp value={form.hu_faellig} onChange={f("hu_faellig")} type="date" error={err.hu_faellig} />
        </Fld>
        {finWarnung && (
          <div style={{
            gridColumn: "1/-1",
            background: "rgba(245,158,11,0.10)",
            border: "1px solid rgba(245,166,32,0.32)",
            borderRadius: 8, padding: "10px 14px",
            display: "flex", alignItems: "flex-start", gap: 8,
            fontSize: 12, color: C.amberL, lineHeight: 1.5,
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{finWarnung.warning}</span>
          </div>
        )}
        <div style={{ gridColumn: "1/-1", marginTop: 4 }}>
          <div style={{ height: 1, background: C.line, marginBottom: 16 }} />
          <div style={{
            fontSize: 11, fontWeight: 700, color: C.t3, letterSpacing: "0.1em", textTransform: "uppercase",
            marginBottom: 14, display: "flex", alignItems: "center", gap: 6,
          }}><User size={11} />Fahrzeughalter</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Fld label="Name / Firma *" error={err.besitzer}>
              <Inp value={form.besitzer} onChange={f("besitzer")} placeholder="Klaus Müller" error={err.besitzer} />
            </Fld>
            <Fld label="Telefon" error={err.telefon}>
              <Inp value={form.telefon} onChange={f("telefon")} placeholder="0176 1234567" error={err.telefon} />
            </Fld>
            <Fld label="E-Mail" span={2} error={err.email}>
              <Inp value={form.email} onChange={f("email")} placeholder="name@mail.de" type="email" error={err.email} />
            </Fld>
          </div>
        </div>
        <div style={{
          gridColumn: "1/-1", display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8,
          paddingTop: 16, borderTop: `1px solid ${C.line}`,
        }}>
          <BtnG onClick={onClose}>Abbrechen</BtnG>
          <BtnP onClick={save} icon={Check}>{isEdit ? "Änderungen speichern" : "Fahrzeug erfassen"}</BtnP>
        </div>
      </div>
    </Modal>
  );
}

FahrzeugModal.propTypes = {
  initial: PropTypes.object,
  fahrzeuge: PropTypes.arrayOf(FahrzeugShape),
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
