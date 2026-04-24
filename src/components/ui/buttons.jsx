import PropTypes from "prop-types";
import { C } from "../../styles/theme";

export function BtnP({ onClick, children, icon: Icon, disabled = false, danger = false, sm = false }) {
  return (
    <button onClick={onClick} disabled={disabled} className="btn-primary" style={{
      display: "flex", alignItems: "center", gap: 6,
      background: danger ? "rgba(220,38,38,0.09)" : "linear-gradient(135deg, #2563EB, #3B82F6)",
      border: `1px solid ${danger ? "rgba(220,38,38,0.25)" : "transparent"}`,
      borderRadius: 9, padding: sm ? "7px 14px" : "9px 20px",
      color: danger ? C.redL : "#fff",
      cursor: disabled ? "not-allowed" : "pointer",
      fontSize: sm ? 12 : 13, fontWeight: 600,
      opacity: disabled ? 0.5 : 1,
      fontFamily: C.sans,
      boxShadow: danger ? "none" : "0 2px 8px rgba(37,99,235,0.28)",
    }}>
      {Icon && <Icon size={sm ? 12 : 14} />}{children}
    </button>
  );
}

BtnP.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node,
  icon: PropTypes.elementType,
  disabled: PropTypes.bool,
  danger: PropTypes.bool,
  sm: PropTypes.bool,
};

export function BtnG({ onClick, children, icon: Icon, danger = false, sm = false }) {
  return (
    <button onClick={onClick} className="btn-ghost" style={{
      display: "flex", alignItems: "center", gap: 6,
      background: danger ? "rgba(239,68,68,0.09)" : C.glass,
      border: `1px solid ${danger ? "rgba(239,68,68,0.25)" : C.line}`,
      borderRadius: 9, padding: sm ? "7px 14px" : "9px 20px",
      color: danger ? C.redL : C.t2,
      cursor: "pointer", fontSize: sm ? 12 : 13, fontWeight: 500,
      fontFamily: C.sans,
    }}>
      {Icon && <Icon size={sm ? 12 : 14} />}{children}
    </button>
  );
}

BtnG.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node,
  icon: PropTypes.elementType,
  danger: PropTypes.bool,
  sm: PropTypes.bool,
};

export function IconBtn({ onClick, icon, color, danger = false, sm = false, title }) {
  return (
    <button onClick={onClick} title={title} className="btn-icon" style={{
      background: danger ? "rgba(239,68,68,0.09)" : C.glass,
      border: `1px solid ${danger ? "rgba(239,68,68,0.22)" : C.line}`,
      borderRadius: 7, padding: sm ? "4px 6px" : "6px 8px",
      color, cursor: "pointer", display: "flex",
    }}>
      {icon}
    </button>
  );
}

IconBtn.propTypes = {
  onClick: PropTypes.func,
  icon: PropTypes.node,
  color: PropTypes.string,
  danger: PropTypes.bool,
  sm: PropTypes.bool,
  title: PropTypes.string,
};
