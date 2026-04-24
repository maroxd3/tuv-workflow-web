import PropTypes from "prop-types";
import { User } from "lucide-react";
import { C } from "../styles/theme";
import { NAV } from "../constants/nav";

export function Topbar({ view }) {
  const V = NAV.find(v => v.key === view);
  const Icon = V?.icon;

  return (
    <div style={{
      background: C.surface, borderBottom: `1px solid ${C.line}`,
      boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
      padding: "0 32px", height: 60,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      {/* Left: page title */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {Icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={16} color={C.blue} />
          </div>
        )}
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{V?.label}</div>
          <div style={{ fontSize: 11, color: C.t4, marginTop: 1 }}>{V?.desc}</div>
        </div>
      </div>

      {/* Right: date + user */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          fontSize: 12, color: C.t3, fontFamily: C.mono,
          background: C.surfaceUp, border: `1px solid ${C.line}`,
          borderRadius: 8, padding: "6px 12px",
        }}>
          {new Date().toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
        </div>

        <div style={{ width: 1, height: 20, background: C.line }} />

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #2563EB, #7C3AED)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
          }}>
            <User size={15} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, color: C.t1, fontWeight: 600 }}>Administrator</div>
            <div style={{ fontSize: 10, color: C.t4 }}>TÜV Nord GmbH</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Topbar.propTypes = {
  view: PropTypes.string.isRequired,
};
