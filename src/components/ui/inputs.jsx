import { useState } from "react";
import PropTypes from "prop-types";
import { ChevronDown, AlertCircle } from "lucide-react";
import { C } from "../../styles/theme";

export function Inp({ value, onChange, placeholder, type = "text", error, style = {}, mono = false }) {
  const [f, setF] = useState(false);
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} type={type}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{
        background: C.surface, border: `1px solid ${error ? "rgba(220,38,38,0.5)" : f ? C.blue : C.line}`,
        borderRadius: 8, padding: "9px 12px", color: C.t1, fontSize: 13, outline: "none",
        width: "100%", fontFamily: mono ? C.mono : C.sans, transition: "border-color 0.15s", ...style,
      }}
    />
  );
}

Inp.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  type: PropTypes.string,
  error: PropTypes.string,
  style: PropTypes.object,
  mono: PropTypes.bool,
};

export function Sel({ value, onChange, children, style = {} }) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={onChange} style={{
        background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8,
        padding: "9px 32px 9px 12px", color: C.t1, fontSize: 13, outline: "none",
        width: "100%", fontFamily: C.sans, cursor: "pointer", appearance: "none", ...style,
      }}>{children}</select>
      <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: C.t3, pointerEvents: "none" }} />
    </div>
  );
}

Sel.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  children: PropTypes.node,
  style: PropTypes.object,
};

export function Fld({ label, error, children, span = 1 }) {
  return (
    <div style={{ gridColumn: span === 2 ? "1/-1" : "auto", display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: C.t3, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 10, color: C.redL, display: "flex", alignItems: "center", gap: 3 }}><AlertCircle size={10} />{error}</span>}
    </div>
  );
}

Fld.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  children: PropTypes.node,
  span: PropTypes.oneOf([1, 2]),
};
