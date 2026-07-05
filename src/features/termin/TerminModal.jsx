import { useState } from "react";
import PropTypes from "prop-types";
import { AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { STATUS } from "../../constants/status";
import { FAHRZEUG_TYPEN, TIME_SLOTS } from "../../constants/fahrzeug";
import { PRUEFUNG_ARTEN, PRUEFER } from "../../constants/pruefung";
import { isoDate, fmtDate, toIsoDateStr, toTimeStr } from "../../utils/date";
import { Modal } from "../../components/modal/Modal";
import { ConfirmModal } from "../../components/modal/ConfirmModal";
import { Inp, Sel, Fld, FIELD_CLS } from "../../components/ui/inputs";
import { BtnG, BtnP } from "../../components/ui/buttons";
import { FahrzeugShape, HalterShape, TerminShape } from "../../types/propTypes";
import { hatHauptmangel } from "../../utils/mangel";
import { validateTerminDatum } from "../../utils/validators";
import { useRechte } from "../../auth/AuthContext";

/* Wiederkehrendes Muster: Info-Box unterhalb der Felder */
const INFO_BOX_CLS = "rounded-lg border border-line bg-surface-up";

export function TerminModal({ fahrzeuge, halter = [], termine = [], initial = {}, onSave, onClose }) {
  const bestanden_gesperrt = hatHauptmangel(initial.maengel);
  // Rolle empfang darf Termine anlegen/aendern, aber keinen Status setzen —
  // das Feld bleibt sichtbar (Kontext), ist aber gesperrt. saveTr in
  // TagesplanView ruft den Status-Guard nur bei tatsaechlicher Aenderung.
  const { darfStatusSetzen } = useRechte();
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
      <div className="flex flex-col gap-3.5">
        <Fld label="Fahrzeug *" error={err.fahrzeugId}>
          <Sel value={form.fahrzeugId} onChange={f("fahrzeugId")}>
            <option value="">— Fahrzeug wählen —</option>
            {fahrzeuge.map(fz => <option key={fz.fahrzeugId} value={fz.fahrzeugId}>{fz.kennzeichen} · {fz.hersteller} {fz.modell} ({halterName(fz)})</option>)}
          </Sel>
        </Fld>
        {selFz && (
          <div className="flex flex-wrap gap-5 rounded-lg border border-[rgba(37,99,235,0.18)] bg-surface-high px-3.5 py-2.5">
            <span className="font-mono text-[13px] font-bold text-blue-l">{selFz.kennzeichen}</span>
            <span className="text-[12px] text-t3">{FAHRZEUG_TYPEN.find(t => t.id === selFz.typ)?.icon} {selFz.typ}</span>
            <span className="text-[12px] text-t3">{selFz.baujahr || "—"}</span>
            <span className="text-[12px] text-t3">{selFz.kilometerstand?.toLocaleString("de-DE")} km</span>
            {selFz.huFaellig && (
              <span className={`text-[12px] ${new Date(selFz.huFaellig) < new Date() ? "text-red-l" : "text-t3"}`}>
                HU: {fmtDate(selFz.huFaellig)}
              </span>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3.5 max-[768px]:grid-cols-1">
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
            <Sel value={form.statusCode} onChange={f("statusCode")}
              disabled={!darfStatusSetzen}
              title={!darfStatusSetzen ? "Nur für Prüfer" : undefined}>
              {Object.values(STATUS).map(s => {
                const disabled = s === STATUS.BESTANDEN && bestanden_gesperrt;
                return <option key={s} disabled={disabled}>{s}{disabled ? " (gesperrt: Hauptmangel)" : ""}</option>;
              })}
            </Sel>
          </Fld>
          <Fld label="Geplante Dauer">
            <div className={`${INFO_BOX_CLS} px-3 py-[9px] font-mono text-[13px] text-t3`}>
              {selArt?.dauer || "—"} Minuten
            </div>
          </Fld>
        </div>
        {selArt && (
          <div className={`${INFO_BOX_CLS} flex flex-wrap gap-4 px-3.5 py-2.5 text-[11px] text-t3`}>
            <span>Rechtsgrundlage: <span className="font-mono text-t2">{selArt.code}</span></span>
            {selP && <span>Prüfer: <span className="text-t2">{selP.name} · {selP.zert}</span></span>}
          </div>
        )}
        <Fld label="Notizen / Hinweise">
          <textarea value={form.notiz} onChange={f("notiz")} rows={3}
            placeholder="Besondere Hinweise zur Prüfung, Vorausinformationen..."
            className={`${FIELD_CLS} bg-surface border-line resize-y font-sans`} />
        </Fld>
        <div className="flex justify-end gap-2.5 border-t border-line pt-2">
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
