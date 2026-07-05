import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Check, User, AlertTriangle } from "lucide-react";
import { FAHRZEUG_TYPEN } from "../../constants/fahrzeug";
import { HERSTELLER_REFERENZ, normalizeHersteller, getHerstellerDisplayList } from "../../constants/kfzReferenz";
import { KFZ_KREIS_CODES } from "../../constants/kfzKreis";
import { Modal } from "../../components/modal/Modal";
import { Inp, Sel, Fld } from "../../components/ui/inputs";
import { BtnG, BtnP } from "../../components/ui/buttons";
import { FahrzeugShape } from "../../types/propTypes";
import { validateFahrzeug, checkFinPruefziffer } from "../../utils/validators";

const SONSTIGER = "__SONSTIGER__";

export function FahrzeugModal({ initial = {}, fahrzeuge = [], onSave, onClose }) {
  // Feldnamen in DB-Form (kilometerstand, huFaellig; Halter-Felder flach
  // als halterName/telefon/email). Nullable DB-Werte → "" fuer die Inputs.
  const [form, setForm] = useState({
    kennzeichen: initial.kennzeichen ?? "",
    fin: initial.fin ?? "",
    hersteller: initial.hersteller ?? "",
    modell: initial.modell ?? "",
    farbe: initial.farbe ?? "",
    typ: initial.typ ?? "PKW",
    halterName: initial.halterName ?? "",
    telefon: initial.telefon ?? "",
    email: initial.email ?? "",
    huFaellig: initial.huFaellig ?? "",
    baujahr: initial.baujahr ? String(initial.baujahr) : "",
    kilometerstand: initial.kilometerstand ? String(initial.kilometerstand) : "",
  });
  const [err, setErr] = useState({});
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const isEdit = !!initial.fahrzeugId;

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
    const e = validateFahrzeug(form, fahrzeuge, isEdit ? initial.fahrzeugId : null);
    setErr(e);
    if (Object.keys(e).length > 0) return;
    onSave({
      ...form,
      kennzeichen: form.kennzeichen.trim().toUpperCase().replace(/\s+/g, " "),
      hersteller: form.hersteller.trim(),
      modell: form.modell.trim(),
      halterName: form.halterName.trim(),
      telefon: form.telefon.trim(),
      email: form.email.trim().toLowerCase(),
      fin: form.fin.trim().toUpperCase(),
      farbe: form.farbe.trim(),
      baujahr: form.baujahr ? +form.baujahr : null,
      kilometerstand: form.kilometerstand ? +form.kilometerstand : null,
    });
  }

  return (
    <Modal title={isEdit ? "Fahrzeug bearbeiten" : "Fahrzeug neu erfassen"} sub="Pflichtfelder sind mit * markiert" onClose={onClose} width={720}>
      <div className="grid grid-cols-2 gap-3.5 max-[768px]:grid-cols-1">
        <Fld label="Kennzeichen *" error={err.kennzeichen}>
          <Inp value={form.kennzeichen}
            onChange={e => setForm(p => ({ ...p, kennzeichen: e.target.value.toUpperCase() }))}
            placeholder="B-TK 1234 (Saison: B-TK 1234 04-10)"
            error={err.kennzeichen} mono list="kfz-kreise"
            className="font-bold text-[15px]! tracking-[0.06em]" />
          <datalist id="kfz-kreise">
            {KFZ_KREIS_CODES.map(({ code, region }) => (
              <option key={code} value={code}>{region}</option>
            ))}
          </datalist>
        </Fld>
        <Fld label="FIN (17 Zeichen)" error={err.fin}>
          <Inp value={form.fin} onChange={f("fin")} placeholder="WBA3A5C50CF256985" error={err.fin} mono className="text-[12px]!" />
        </Fld>
        <Fld label="Hersteller *" error={err.hersteller}>
          <Sel value={herstellerDropdownValue} onChange={onHerstellerChange}>
            <option value="">— bitte wählen —</option>
            {herstellerOptions.map(d => <option key={d} value={d}>{d}</option>)}
            <option value={SONSTIGER}>Sonstiger / Nicht aufgeführt …</option>
          </Sel>
          {isOther && (
            <Inp value={form.hersteller} onChange={f("hersteller")} placeholder="z. B. Tatra, Lada, Tuning-Werkstatt"
              error={err.hersteller} className="mt-1.5" />
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
        <Fld label="Kilometerstand (km)" error={err.kilometerstand}>
          <Inp value={form.kilometerstand} onChange={f("kilometerstand")} placeholder="87420" type="number" error={err.kilometerstand} />
        </Fld>
        <Fld label="HU fällig (Datum)" error={err.huFaellig}>
          <Inp value={form.huFaellig} onChange={f("huFaellig")} type="date" error={err.huFaellig} />
        </Fld>
        {finWarnung && (
          <div className="col-span-full flex items-start gap-2 rounded-lg border border-[rgba(245,166,32,0.32)] bg-[rgba(245,158,11,0.10)] px-3.5 py-2.5 text-[12px] leading-normal text-amber-l">
            <AlertTriangle size={14} className="mt-px shrink-0" />
            <span>{finWarnung.warning}</span>
          </div>
        )}
        <div className="col-span-full mt-1">
          <div className="mb-4 h-px bg-line" />
          <div className="mb-3.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-t3"><User size={11} />Fahrzeughalter</div>
          <div className="grid grid-cols-2 gap-3.5 max-[768px]:grid-cols-1">
            <Fld label="Name / Firma *" error={err.halterName}>
              <Inp value={form.halterName} onChange={f("halterName")} placeholder="Klaus Müller" error={err.halterName} />
            </Fld>
            <Fld label="Telefon" error={err.telefon}>
              <Inp value={form.telefon} onChange={f("telefon")} placeholder="0176 1234567" error={err.telefon} />
            </Fld>
            <Fld label="E-Mail" span={2} error={err.email}>
              <Inp value={form.email} onChange={f("email")} placeholder="name@mail.de" type="email" error={err.email} />
            </Fld>
          </div>
        </div>
        <div className="col-span-full mt-2 flex justify-end gap-2.5 border-t border-line pt-4">
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
