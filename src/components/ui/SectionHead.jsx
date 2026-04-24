import PropTypes from "prop-types";
import { C } from "../../styles/theme";

export function SectionHead({ label, icon: Icon, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {Icon && (
          <div style={{ width: 24, height: 24, borderRadius: 6, background: `${C.blue}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={12} color={C.blue} />
          </div>
        )}
        <span style={{ fontSize: 12, fontWeight: 700, color: C.t2, letterSpacing: "0.01em" }}>{label}</span>
      </div>
      {right}
    </div>
  );
}

SectionHead.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  right: PropTypes.node,
};
