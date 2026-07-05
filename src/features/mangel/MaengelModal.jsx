import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Search, Plus, Check, X, Info, AlertOctagon, CheckCircle2, ChevronUp, ChevronDown } from "lucide-react";
import { C } from "../../styles/theme";
import { STATUS, STATUS_CFG } from "../../constants/status";
import { PRUEFUNG_ARTEN } from "../../constants/pruefung";
import { MANGEL_KATEGORIEN, MANGEL_KATALOG } from "../../constants/mangel";
import { hatHauptmangel } from "../../utils/mangel";
import { Modal } from "../../components/modal/Modal";
import { MangelPill } from "../../components/ui/MangelPill";
import { SectionHead } from "../../components/ui/SectionHead";
import { Inp, Sel, Fld, FIELD_CLS } from "../../components/ui/inputs";
import { BtnP } from "../../components/ui/buttons";
import { useRechte } from "../../auth/AuthContext";
import { FahrzeugShape, TerminShape } from "../../types/propTypes";

export function MaengelModal({ termin, fahrzeug, onAdd, onDel, onStatus, onClose }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("katalog");
  const [custom, setCustom] = useState({ code: "", text: "", kat: "EM" });
  const [gruppeOpen, setGruppeOpen] = useState({});
  // Rollen-Gating: Maengel erfassen/entfernen + Status setzen sind
  // Pruefer-/Chef-Sache; Empfang sieht die Erfassung nur lesend.
  const { darfMaengel, darfStatusSetzen } = useRechte();

  // Bereits erfasste Katalog-Codes (fuer den "schon hinzugefuegt"-Haken).
  // codeStvzo === null ausschliessen: das sind Freitext-Maengel ("FR") —
  // sie duerfen weder untereinander noch gegen Katalog-Eintraege dedupen.
  const addedCodes = useMemo(
    () => new Set((termin.maengel ?? []).map(m => m.codeStvzo).filter(c => c !== null)),
    [termin.maengel],
  );
  const hasHM = hatHauptmangel(termin.maengel);
  const mCount = termin.maengel?.length || 0;

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
    onAdd({
      terminId: termin.terminId,
      codeStvzo: v.code,
      beschreibung: v.text,
      kategorieCode: v.kat,
      behoben: false,
    });
  }

  function addCustom() {
    if (!custom.text.trim()) return;
    // Freitext-Mangel: kein StVZO-Code → codeStvzo null ("FR" ist nur
    // die Anzeige-Konvention, kein echter Katalog-Code).
    const code = custom.code.trim();
    onAdd({
      terminId: termin.terminId,
      codeStvzo: code && code !== "FR" ? code : null,
      beschreibung: custom.text,
      kategorieCode: custom.kat,
      behoben: false,
    });
    setCustom({ code: "", text: "", kat: "EM" });
  }

  const art = PRUEFUNG_ARTEN.find(a => a.id === termin.prueftCode);

  return (
    <Modal title="Mängelerfassung" sub={`${fahrzeug?.kennzeichen || ""} · ${fahrzeug?.hersteller || ""} ${fahrzeug?.modell || ""} · ${art?.label || ""}`} onClose={onClose} width={860}>
      <div className="grid grid-cols-2 gap-5 max-[768px]:grid-cols-1">
        {/* LEFT: Recorded */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionHead label="Erfasste Mängel" />
            <span className="rounded-full border border-line bg-glass px-[9px] py-0.5 font-mono text-[11px] text-t3">{mCount}</span>
          </div>

          {mCount === 0 ? (
            <div className="rounded-[10px] border border-dashed border-line bg-glass p-6 text-center text-[13px] text-t4">
              Keine Mängel erfasst<br />
              <span className="text-[11px]">Fahrzeug bisher ohne Beanstandungen</span>
            </div>
          ) : (
            <div className="flex max-h-[280px] flex-col gap-1 overflow-y-auto">
              {termin.maengel?.map(m => {
                const mc = MANGEL_KATEGORIEN[m.kategorieCode];
                return (
                  <div key={m.mangelId}
                    className="flex items-start gap-2 rounded-lg border bg-surface-high px-2.5 py-2"
                    // Laufzeitwert: Rahmenfarbe pro Mangel-Kategorie
                    style={{ borderColor: mc?.border || C.line }}>
                    <MangelPill kat={m.kategorieCode} />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[10px] text-t4">{m.codeStvzo ?? "FR"}</div>
                      <div className="text-[12px] leading-[1.4] text-t2">{m.beschreibung}</div>
                    </div>
                    {darfMaengel && (
                      <button onClick={() => onDel(m.mangelId)}
                        aria-label="Mangel entfernen" title="Mangel entfernen"
                        className="shrink-0 cursor-pointer border-none bg-transparent p-0.5 text-t4">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {mCount > 0 && (
            <div className={`rounded-lg border px-3.5 py-2.5 ${hasHM ? "border-[rgba(240,69,90,0.30)] bg-[rgba(240,69,90,0.10)]" : "border-[rgba(15,194,138,0.28)] bg-[rgba(15,194,138,0.10)]"}`}>
              <div className={`mb-1 flex items-center gap-1.5 text-[12px] font-bold ${hasHM ? "text-red-l" : "text-green-l"}`}>
                {hasHM
                  ? <><AlertOctagon size={13} />Hauptmangel vorhanden — nicht bestanden</>
                  : <><CheckCircle2 size={13} />Kein Hauptmangel — Bestehen möglich</>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(MANGEL_KATEGORIEN).filter(([k]) => k !== "OM").map(([k, v]) => {
                  const cnt = termin.maengel?.filter(m => m.kategorieCode === k).length || 0;
                  if (!cnt) return null;
                  // Laufzeitwert: Zähler-Farbe pro Kategorie aus MANGEL_KATEGORIEN
                  return <span key={k} className="font-mono text-[10px]" style={{ color: v.color }}>{cnt}×{v.kurz}</span>;
                })}
              </div>
            </div>
          )}

          {/* Set result — Status setzen nur fuer Pruefer/Chef */}
          {darfStatusSetzen && (
          <div className="rounded-[10px] border border-line bg-glass px-3.5 py-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-t4">Prüfergebnis setzen</div>
            <div className="flex flex-wrap gap-[5px]">
              {[STATUS.BESTANDEN, STATUS.NICHT_BESTANDEN, STATUS.IN_PRUEFUNG, STATUS.NACHPRUEFUNG, STATUS.ABGEBROCHEN, STATUS.NICHT_ERSCHIENEN].map(s => {
                const sc = STATUS_CFG[s]; const act = termin.statusCode === s;
                const blocked = s === STATUS.BESTANDEN && hasHM;
                return (
                  <button key={s} onClick={() => { if (!blocked) onStatus(termin.terminId, s); }}
                    disabled={blocked}
                    title={blocked ? "Bestanden nicht möglich — Hauptmangel vorhanden (§ 29 StVZO)" : undefined}
                    className={[
                      "rounded-md border px-3 py-[7px] font-mono text-[11px] transition-all duration-150",
                      act ? "font-bold" : "font-normal",
                      blocked ? "cursor-not-allowed opacity-35 line-through text-t4" : "cursor-pointer",
                      !act && !blocked ? "border-line bg-transparent text-t3" : "",
                      !act && blocked ? "border-line bg-transparent" : "",
                    ].join(" ")}
                    // Laufzeitwerte: Farben des aktiven Status aus STATUS_CFG
                    style={act ? { background: sc.glow, borderColor: sc.border, color: sc.color } : undefined}
                  >{s}</button>
                );
              })}
            </div>
          </div>
          )}
        </div>

        {/* RIGHT: Catalog — Maengel hinzufuegen nur fuer Pruefer/Chef,
            Empfang sieht stattdessen einen Hinweis. */}
        {!darfMaengel ? (
          <div className="flex items-start gap-2 self-start rounded-lg border border-[rgba(245,166,32,0.28)] bg-[rgba(245,158,11,0.08)] px-3.5 py-3 text-[12px] leading-[1.5] text-amber-l">
            <Info size={13} className="mt-0.5 shrink-0" />
            Mängel können nur von Prüfern erfasst oder entfernt werden.
          </div>
        ) : (
        <div className="flex flex-col gap-2.5">
          <div className="mb-0.5 flex border-b border-line">
            {[["katalog", "StVZO-Katalog"], ["custom", "Freitext"]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)}
                className={[
                  "cursor-pointer bg-transparent px-4 py-[7px] text-[12px] transition-all duration-150 border-b-2",
                  tab === k ? "border-b-blue font-bold text-blue-l" : "border-b-transparent font-normal text-t3",
                ].join(" ")}>{l}</button>
            ))}
          </div>

          {tab === "katalog" && (
            <>
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t4" />
                <Inp value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen nach Code oder Beschreibung..." className="pl-[30px] text-[12px]!" />
              </div>
              <div className="flex max-h-[420px] flex-col gap-0.5 overflow-y-auto">
                {groups.map(g => {
                  const open = search || gruppeOpen[g.label] !== false;
                  return (
                    <div key={g.label}>
                      <button onClick={() => !search && setGruppeOpen(p => ({ ...p, [g.label]: !open }))}
                        className="mb-0.5 flex w-full cursor-pointer items-center justify-between rounded-md border border-line bg-glass px-2.5 py-1.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-t3">
                        {g.label}
                        {!search && (open ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                      </button>
                      {open && g.items.map(v => {
                        const isAdd = addedCodes.has(v.code);
                        return (
                          <button key={v.code} onClick={() => addVorlage(v)} disabled={isAdd}
                            className={[
                              "mb-0.5 flex w-full items-start gap-2 rounded-md border border-line px-[9px] py-[7px] text-left transition-all duration-100",
                              isAdd ? "cursor-default bg-glass opacity-40" : "cursor-pointer bg-glass-med opacity-100",
                            ].join(" ")}>
                            <MangelPill kat={v.kat} />
                            <span className="mt-px min-w-[34px] font-mono text-[10px] text-t4">{v.code}</span>
                            <span className="flex-1 text-[12px] leading-[1.4] text-t2">{v.text}</span>
                            {isAdd
                              ? <Check size={11} color={C.greenL} className="mt-0.5 shrink-0" />
                              : <Plus size={11} color={C.blueL} className="mt-0.5 shrink-0" />}
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
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-[rgba(245,166,32,0.28)] bg-[rgba(245,158,11,0.08)] px-3.5 py-2.5 text-[12px] text-amber-l">
                <Info size={13} />Nur für Mängel ohne passenden Katalogeintrag
              </div>
              <div className="grid grid-cols-[90px_1fr] gap-2.5">
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
                  className={`${FIELD_CLS} bg-bg border-line resize-y font-sans`} />
              </Fld>
              <BtnP onClick={addCustom} icon={Plus}>Mangel hinzufügen</BtnP>
            </div>
          )}
        </div>
        )}
      </div>
    </Modal>
  );
}

MaengelModal.propTypes = {
  termin: TerminShape.isRequired,
  fahrzeug: FahrzeugShape,
  onAdd: PropTypes.func.isRequired,
  onDel: PropTypes.func.isRequired,
  onStatus: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
