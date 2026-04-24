import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { C } from "../../styles/theme";

export function Kpi({ label, value, sub, accent, icon: Icon }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="kpi-card"
      style={{
        background: C.surface, border: `1px solid ${C.line}`,
        borderRadius: 16, padding: "20px 22px",
        position: "relative", overflow: "hidden",
        boxShadow: "0 2px 8px rgba(15,23,42,0.07)",
      }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}44)`, borderRadius: "16px 16px 0 0" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginTop: 4 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.t4, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: C.t1, fontFamily: C.mono, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 6, fontWeight: 500 }}>{sub}</div>}
        </div>
        {Icon && (
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${accent}14`, border: `1px solid ${accent}28`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={20} color={accent} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

Kpi.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sub: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  accent: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
};
