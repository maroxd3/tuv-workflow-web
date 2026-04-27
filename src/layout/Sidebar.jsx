import { useState } from "react";
import PropTypes from "prop-types";
import { Shield, RefreshCw, AlertOctagon, AlertTriangle } from "lucide-react";
import { C } from "../styles/theme";
import { STATUS } from "../constants/status";
import { NAV } from "../constants/nav";
import { isoDate, fmtDate } from "../utils/date";
import { FahrzeugShape, TerminShape } from "../types/propTypes";

export function Sidebar({ view, setView, fahrzeuge, termine, resetAll }) {
  const today = isoDate();
  const todayTr = termine.filter(t => t.datum === today);
  const offenTr = todayTr.filter(t => t.status === STATUS.GEPLANT || t.status === STATUS.IN_PRUEFUNG);
  const [now] = useState(() => Date.now());
  const huWarn = fahrzeuge.filter(f => f.hu_faellig && new Date(f.hu_faellig) < new Date(now + 30 * 86400000) && new Date(f.hu_faellig) >= new Date(now)).length;
  const huUeberr = fahrzeuge.filter(f => f.hu_faellig && new Date(f.hu_faellig) < new Date(now)).length;

  return (
    <div style={{
      width: 240, flexShrink: 0,
      background: `linear-gradient(180deg, ${C.sb} 0%, #110E30 100%)`,
      display: "flex", flexDirection: "column",
      position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 60,
      boxShadow: "4px 0 24px rgba(0,0,0,0.40)",
    }}>

      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${C.sbLine}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, flexShrink: 0, borderRadius: 12,
            background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(99,102,241,0.55)",
          }}>
            <Shield size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.sbT1, letterSpacing: "-0.01em" }}>TÜV Prüfstelle</div>
            <div style={{ fontSize: 10, color: C.sbT3, letterSpacing: "0.06em", marginTop: 1 }}>VERWALTUNGSSYSTEM</div>
          </div>
        </div>

        {/* Status pill */}
        <div style={{
          background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.22)",
          borderRadius: 8, padding: "7px 12px", display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#34D399", flex: 1, fontWeight: 500 }}>System aktiv</span>
          <span style={{ fontSize: 10, color: C.sbT3, fontFamily: C.mono }}>
            {new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 12px", flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.sbT3, letterSpacing: "0.16em", textTransform: "uppercase", padding: "4px 8px 10px" }}>
          Navigation
        </div>
        {NAV.map(v => {
          const Icon = v.icon;
          const act = view === v.key;
          const badge = v.key === "tagesplan" ? offenTr.length : null;
          return (
            <button key={v.key} onClick={() => setView(v.key)} className="nav-btn" style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "10px 12px", borderRadius: 10, marginBottom: 2,
              background: act ? "rgba(99,102,241,0.20)" : "transparent",
              border: `1px solid ${act ? "rgba(99,102,241,0.35)" : "transparent"}`,
              color: act ? "#A5B4FC" : C.sbT2,
              cursor: "pointer", fontSize: 13, fontWeight: act ? 600 : 400,
              textAlign: "left", transition: "all 0.15s",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: act ? "rgba(99,102,241,0.30)" : "rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}>
                <Icon size={14} color={act ? "#A5B4FC" : "#6058A0"} />
              </div>
              <span style={{ flex: 1 }}>{v.label}</span>
              {badge > 0 && (
                <span style={{
                  fontSize: 10, fontFamily: C.mono, fontWeight: 700,
                  background: "#6366F1", color: "#fff",
                  borderRadius: 999, padding: "2px 7px", lineHeight: 1.4,
                }}>{badge}</span>
              )}
            </button>
          );
        })}

        {/* Warnings */}
        {(huWarn > 0 || huUeberr > 0) && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.sbT3, letterSpacing: "0.16em", textTransform: "uppercase", padding: "4px 8px 8px" }}>
              Warnungen
            </div>
            {huUeberr > 0 && (
              <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.22)", borderRadius: 8, padding: "9px 12px", marginBottom: 4, display: "flex", gap: 8, alignItems: "center" }}>
                <AlertOctagon size={13} color="#FCA5A5" />
                <span style={{ fontSize: 12, color: "#FCA5A5", fontWeight: 500 }}>{huUeberr} HU überfällig</span>
              </div>
            )}
            {huWarn > 0 && (
              <div style={{ background: "rgba(217,119,6,0.12)", border: "1px solid rgba(217,119,6,0.22)", borderRadius: 8, padding: "9px 12px", display: "flex", gap: 8, alignItems: "center" }}>
                <AlertTriangle size={13} color="#FCD34D" />
                <span style={{ fontSize: 12, color: "#FCD34D", fontWeight: 500 }}>{huWarn} HU in 30d fällig</span>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer stats */}
      <div style={{ padding: "14px 16px 18px", borderTop: `1px solid ${C.sbLine}` }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.sbT3, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
          Heute · {fmtDate(today)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
          {[
            ["Termine", todayTr.length, "#3B82F6"],
            ["Erledigt", todayTr.filter(t => t.status === STATUS.BESTANDEN || t.status === STATUS.NICHT_BESTANDEN).length, "#10B981"],
            ["Ausstehend", offenTr.length, "#F59E0B"],
            ["Fahrzeuge", fahrzeuge.length, C.sbT2],
          ].map(([l, v, c]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", border: `1px solid ${C.sbLine}` }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: c, fontFamily: C.mono, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 9, color: C.sbT3, marginTop: 3, letterSpacing: "0.04em" }}>{l}</div>
            </div>
          ))}
        </div>
        <button onClick={resetAll} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          background: "rgba(255,255,255,0.04)", border: `1px solid ${C.sbLine}`,
          borderRadius: 8, padding: "10px 0", color: C.sbT3, cursor: "pointer",
          fontSize: 11, fontFamily: C.sans, transition: "all 0.15s",
        }}>
          <RefreshCw size={10} /> Demo zurücksetzen
        </button>
      </div>
    </div>
  );
}

Sidebar.propTypes = {
  view: PropTypes.string.isRequired,
  setView: PropTypes.func.isRequired,
  fahrzeuge: PropTypes.arrayOf(FahrzeugShape).isRequired,
  termine: PropTypes.arrayOf(TerminShape).isRequired,
  resetAll: PropTypes.func.isRequired,
};
