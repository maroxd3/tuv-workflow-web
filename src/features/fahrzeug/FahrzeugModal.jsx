import React, { useState } from "react";
import { Check, User } from "lucide-react";
import { C } from "../../styles/theme";
import { FAHRZEUG_TYPEN } from "../../constants/fahrzeug";
import { Modal } from "../../components/modal/Modal";
import { Inp, Sel, Fld } from "../../components/ui/inputs";
import { BtnG, BtnP } from "../../components/ui/buttons";

export function FahrzeugModal({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({
    kennzeichen: "", fin: "", hersteller: "", modell: "", baujahr: "",
    farbe: "", typ: "PKW", kmStand: "", besitzer: "", telefon: "", email: "",
    hu_faellig: "",
    ...initial,
    baujahr: initial.baujahr ? String(initial.baujahr) : "",
    kmStand: initial.kmStand ? String(initial.kmStand) : "",
  });
  const [err, setErr] = useState({});
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const isEdit = !!initial.id;

  function validate() {
    const e = {};
    if (!form.kennzeichen.trim()) e.kennzeichen = "Pflichtfeld";
    else if (!/^[A-ZÄÖÜ]{1,3}[-\s][A-Z]{1,2}\s?\d{1,4}[HE]?$/i.test(form.kennzeichen.trim())) e.kennzeichen = "Ungültiges Format";
    if (!form.hersteller.trim()) e.hersteller = "Pflichtfeld";
    if (!form.modell.trim()) e.modell = "Pflichtfeld";
    if (!form.besitzer.trim()) e.besitzer = "Pflichtfeld";
    if (form.baujahr && (isNaN(form.baujahr) || +form.baujahr < 1885 || +form.baujahr > new Date().getFullYear() + 1)) e.baujahr = "Ungültiges Jahr";
    if (form.fin && form.fin.length !== 17) e.fin = "FIN muss 17 Zeichen haben";
    setErr(e);
    return Object.keys(e).length === 0;
  }

  function save() {
    if (!validate()) return;
    onSave({ ...form, baujahr: form.baujahr ? +form.baujahr : null, kmStand: form.kmStand ? +form.kmStand : null });
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
          <Inp value={form.hersteller} onChange={f("hersteller")} placeholder="BMW" error={err.hersteller} />
        </Fld>
        <Fld label="Modell / Variante *" error={err.modell}>
          <Inp value={form.modell} onChange={f("modell")} placeholder="320d xDrive" error={err.modell} />
        </Fld>
        <Fld label="Fahrzeugtyp">
          <Sel value={form.typ} onChange={f("typ")}>
            {FAHRZEUG_TYPEN.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
          </Sel>
        </Fld>
        <Fld label="Baujahr" error={err.baujahr}>
          <Inp value={form.baujahr} onChange={f("baujahr")} placeholder={String(new Date().getFullYear())} type="number" error={err.baujahr} />
        </Fld>
        <Fld label="Farbe">
          <Inp value={form.farbe} onChange={f("farbe")} placeholder="Sophistograu Metallic" />
        </Fld>
        <Fld label="Kilometerstand (km)">
          <Inp value={form.kmStand} onChange={f("kmStand")} placeholder="87420" type="number" />
        </Fld>
        <Fld label="HU fällig (Datum)">
          <Inp value={form.hu_faellig} onChange={f("hu_faellig")} type="date" />
        </Fld>
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
            <Fld label="Telefon">
              <Inp value={form.telefon} onChange={f("telefon")} placeholder="0176 1234567" />
            </Fld>
            <Fld label="E-Mail" span={2}>
              <Inp value={form.email} onChange={f("email")} placeholder="name@mail.de" type="email" />
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
