import React from "react";
import { C } from "../../styles/theme";

export function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "56px 24px", gap: 12,
    }}>
      {Icon && (
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: C.surfaceUp, border: `1px solid ${C.line}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 4,
        }}>
          <Icon size={22} color={C.t4} />
        </div>
      )}
      <div style={{ fontSize: 14, fontWeight: 600, color: C.t3 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: C.t4, textAlign: "center", maxWidth: 280, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}
