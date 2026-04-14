import React from "react";
import { C } from "../../styles/theme";
import { STATUS, STATUS_CFG } from "../../constants/status";

export function StatusPill({ status, size = "sm" }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG[STATUS.GEPLANT];
  const lg = size === "lg";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.glow, color: cfg.color, border: `1px solid ${cfg.border}`,
      borderRadius: 999, padding: lg ? "5px 14px" : "3px 9px",
      fontSize: lg ? 12 : 10, fontWeight: 700, letterSpacing: "0.04em",
      whiteSpace: "nowrap", fontFamily: C.mono,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%", background: cfg.dot, flexShrink: 0,
        boxShadow: status === STATUS.IN_PRUEFUNG ? `0 0 6px ${cfg.dot}` : undefined,
      }} />
      {status}
    </span>
  );
}
