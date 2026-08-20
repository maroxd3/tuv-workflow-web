import { useState } from "react";
import PropTypes from "prop-types";
import { AnimatePresence } from "framer-motion";
import { Shield, Trash2, Sparkles, AlertOctagon, AlertTriangle } from "lucide-react";
import { STATUS } from "../constants/status";
import { NAV } from "../constants/nav";
import { isoDate, fmtDate, toIsoDateStr } from "../utils/date";
import { ConfirmModal } from "../components/modal/ConfirmModal";
import { useAuth, useRechte } from "../auth/AuthContext";
import { FahrzeugShape, TerminShape } from "../types/propTypes";

/* Wiederkehrendes Muster: Abschnitts-Überschrift in der Sidebar */
const SB_HEADING = "text-[9px] font-bold uppercase tracking-[0.16em] text-sb-t3";

export function Sidebar({ view, setView, fahrzeuge, termine, resetAllData, loadDemoData }) {
  const today = isoDate();
  const todayTr = termine.filter(t => toIsoDateStr(t.datum) === today);
  const offenTr = todayTr.filter(t => t.statusCode === STATUS.GEPLANT || t.statusCode === STATUS.IN_PRUEFUNG);
  const [now] = useState(() => Date.now());
  const [confirmReset, setConfirmReset] = useState(false); // ersetzt window.confirm
  const { darfAdmin } = useRechte(); // Reset + Demo-Daten: nur Rolle chef
  // ... und nur, wenn der Server die Admin-Aktionen ueberhaupt anbietet.
  // Sie verlangen zusaetzlich den X-Admin-Token-Header, den das Frontend
  // bewusst nicht kennt (Secret im Browser waere keins). Bei gesetztem
  // ADMIN_TOKEN — also in Produktion — endete ein Klick in einem 401 und
  // wuerde den Benutzer ausloggen. Reset und Demo-Seed sind ohnehin
  // Entwicklungs-/Demo-Werkzeuge, kein Teil des Pruefstellen-Betriebs.
  const { adminAktionenVerfuegbar } = useAuth();
  const zeigeDemoWerkzeuge = darfAdmin && adminAktionenVerfuegbar;
  const huWarn = fahrzeuge.filter(f => f.huFaellig && new Date(f.huFaellig) < new Date(now + 30 * 86400000) && new Date(f.huFaellig) >= new Date(now)).length;
  const huUeberr = fahrzeuge.filter(f => f.huFaellig && new Date(f.huFaellig) < new Date(now)).length;

  return (
    <div className="fixed left-0 top-0 bottom-0 z-[60] flex w-60 shrink-0 flex-col bg-[linear-gradient(180deg,var(--color-sb)_0%,#110E30_100%)] shadow-[4px_0_24px_rgba(0,0,0,0.40)]">

      {/* Logo */}
      <div className="border-b border-sb-line px-5 pt-6 pb-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4F46E5,#7C3AED)] shadow-[0_4px_20px_rgba(99,102,241,0.55)]">
            <Shield size={18} color="#fff" />
          </div>
          <div>
            <div className="text-[14px] font-bold tracking-[-0.01em] text-sb-t1">TÜV Prüfstelle</div>
            <div className="mt-px text-[10px] tracking-[0.06em] text-sb-t3">VERWALTUNGSSYSTEM</div>
          </div>
        </div>

        {/* Status pill */}
        <div className="flex items-center gap-2 rounded-lg border border-[rgba(16,185,129,0.22)] bg-[rgba(16,185,129,0.12)] px-3 py-[7px]">
          <div className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
          <span className="flex-1 text-[11px] font-medium text-[#34D399]">System aktiv</span>
          <span className="font-mono text-[10px] text-sb-t3">
            {new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className={`${SB_HEADING} px-2 pt-1 pb-2.5`}>
          Navigation
        </div>
        {NAV.map(v => {
          const Icon = v.icon;
          const act = view === v.key;
          const badge = v.key === "tagesplan" ? offenTr.length : null;
          return (
            <button key={v.key} onClick={() => setView(v.key)}
              className={[
                "mb-0.5 flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left text-[13px]",
                "transition-all duration-150 hover:bg-[rgba(255,255,255,0.08)] max-[768px]:p-3",
                act
                  ? "border-[rgba(99,102,241,0.35)] bg-[rgba(99,102,241,0.20)] font-semibold text-[#A5B4FC]"
                  : "border-transparent bg-transparent font-normal text-sb-t2",
              ].join(" ")}>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] transition-all duration-150 ${act ? "bg-[rgba(99,102,241,0.30)]" : "bg-[rgba(255,255,255,0.07)]"}`}>
                <Icon size={14} color={act ? "#A5B4FC" : "#6058A0"} />
              </div>
              <span className="flex-1">{v.label}</span>
              {badge > 0 && (
                <span className="rounded-full bg-[#6366F1] px-[7px] py-0.5 font-mono text-[10px] font-bold leading-[1.4] text-white">{badge}</span>
              )}
            </button>
          );
        })}

        {/* Warnings */}
        {(huWarn > 0 || huUeberr > 0) && (
          <div className="mt-4">
            <div className={`${SB_HEADING} px-2 pt-1 pb-2`}>
              Warnungen
            </div>
            {huUeberr > 0 && (
              <div className="mb-1 flex items-center gap-2 rounded-lg border border-[rgba(220,38,38,0.22)] bg-[rgba(220,38,38,0.12)] px-3 py-[9px]">
                <AlertOctagon size={13} color="#FCA5A5" />
                <span className="text-[12px] font-medium text-[#FCA5A5]">{huUeberr} HU überfällig</span>
              </div>
            )}
            {huWarn > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-[rgba(217,119,6,0.22)] bg-[rgba(217,119,6,0.12)] px-3 py-[9px]">
                <AlertTriangle size={13} color="#FCD34D" />
                <span className="text-[12px] font-medium text-[#FCD34D]">{huWarn} HU in 30d fällig</span>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer stats */}
      <div className="border-t border-sb-line px-4 pt-3.5 pb-[18px]">
        <div className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.14em] text-sb-t3">
          Heute · {fmtDate(today)}
        </div>
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          {[
            ["Termine", todayTr.length, "#3B82F6"],
            ["Erledigt", todayTr.filter(t => t.statusCode === STATUS.BESTANDEN || t.statusCode === STATUS.NICHT_BESTANDEN).length, "#10B981"],
            ["Ausstehend", offenTr.length, "#F59E0B"],
            ["Fahrzeuge", fahrzeuge.length, "var(--color-sb-t2)"],
          ].map(([l, v, c]) => (
            <div key={l} className="rounded-lg border border-sb-line bg-[rgba(255,255,255,0.04)] px-2.5 py-2">
              {/* Laufzeitwert: Zahl-Farbe pro Stat aus dem Daten-Array */}
              <div className="font-mono text-[18px] font-bold leading-none" style={{ color: c }}>{v}</div>
              <div className="mt-[3px] text-[9px] tracking-[0.04em] text-sb-t3">{l}</div>
            </div>
          ))}
        </div>
        {/* Demo-Werkzeuge (Reset/Demo-Daten): Rolle chef UND ein Server
            ohne ADMIN_TOKEN. Serverseitig erzwingt /api/admin/* beides
            ohnehin — hier geht es darum, keine Schaltflaeche anzubieten,
            die zwangslaeufig scheitert. */}
        {zeigeDemoWerkzeuge && (
          <div className="mb-1.5 text-center text-[9px] uppercase tracking-[0.12em] text-sb-t3">
            Demo-Werkzeuge · nur Entwicklung
          </div>
        )}
        {zeigeDemoWerkzeuge && (
          fahrzeuge.length === 0 && termine.length === 0 ? (
            <button
              onClick={() => {
                if (loadDemoData) loadDemoData();
              }}
              className="flex w-full cursor-pointer items-center justify-center gap-[5px] rounded-lg border border-[rgba(99,102,241,0.30)] bg-[rgba(99,102,241,0.12)] py-2.5 font-sans text-[11px] font-semibold text-[#A5B4FC] transition-all duration-150"
            >
              <Sparkles size={11} /> Beispieldaten laden
            </button>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="flex w-full cursor-pointer items-center justify-center gap-[5px] rounded-lg border border-[rgba(220,38,38,0.20)] bg-[rgba(220,38,38,0.08)] py-2.5 font-sans text-[11px] font-medium text-[#FCA5A5] transition-all duration-150"
            >
              <Trash2 size={10} /> Alle Daten löschen
            </button>
          )
        )}
      </div>

      {/* Reset-Rueckfrage (ersetzt window.confirm) */}
      <AnimatePresence>
        {confirmReset && (
          <ConfirmModal
            title="Alle Daten löschen?"
            msg="Wirklich alle Fahrzeuge und Termine löschen? Die App startet danach leer (Live-Modus)."
            onConfirm={() => {
              setConfirmReset(false);
              resetAllData();
            }}
            onCancel={() => setConfirmReset(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

Sidebar.propTypes = {
  view: PropTypes.string.isRequired,
  setView: PropTypes.func.isRequired,
  fahrzeuge: PropTypes.arrayOf(FahrzeugShape).isRequired,
  termine: PropTypes.arrayOf(TerminShape).isRequired,
  resetAllData: PropTypes.func.isRequired,
  loadDemoData: PropTypes.func,
};
