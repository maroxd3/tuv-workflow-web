import PropTypes from "prop-types";
import { User, Menu } from "lucide-react";
import { C } from "../styles/theme";
import { NAV } from "../constants/nav";

export function Topbar({ view, onToggleSidebar }) {
  const V = NAV.find(v => v.key === view);
  const Icon = V?.icon;

  return (
    <div className="pad-mobile" style={{
      background: C.surface, borderBottom: `1px solid ${C.line}`,
      boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
      padding: "0 32px", height: 60,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      {/* Left: hamburger + page title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {onToggleSidebar && (
          <button onClick={onToggleSidebar} className="btn-icon" aria-label="Menü"
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: C.glass, border: `1px solid ${C.line}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: C.t2, flexShrink: 0,
            }}>
            <Menu size={16} />
          </button>
        )}
        {Icon && (
          <div className="hide-mobile" style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon size={16} color={C.blue} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{V?.label}</div>
          <div className="hide-mobile" style={{ fontSize: 11, color: C.t4, marginTop: 1 }}>{V?.desc}</div>
        </div>
      </div>

      {/* Right: date + user — mit hide-mobile für Datum-Pille */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <div className="hide-mobile" style={{
          fontSize: 12, color: C.t3, fontFamily: C.mono,
          background: C.surfaceUp, border: `1px solid ${C.line}`,
          borderRadius: 8, padding: "6px 12px",
        }}>
          {new Date().toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
        </div>

        <div className="hide-mobile" style={{ width: 1, height: 20, background: C.line }} />

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #2563EB, #7C3AED)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
            flexShrink: 0,
          }}>
            <User size={15} color="#fff" />
          </div>
          <div className="hide-mobile">
            <div style={{ fontSize: 13, color: C.t1, fontWeight: 600 }}>Administrator</div>
            <div style={{ fontSize: 10, color: C.t4 }}>Prüfstelle Pro</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Topbar.propTypes = {
  view: PropTypes.string.isRequired,
  onToggleSidebar: PropTypes.func,
};
