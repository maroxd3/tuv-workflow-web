import React from "react";
import { C } from "../../styles/theme";
import { MANGEL_KATEGORIEN } from "../../constants/mangel";

export function MangelPill({ kat }) {
  const m = MANGEL_KATEGORIEN[kat];
  if (!m) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 700,
      fontFamily: C.mono, letterSpacing: "0.05em", whiteSpace: "nowrap",
    }}>{m.kurz}</span>
  );
}
