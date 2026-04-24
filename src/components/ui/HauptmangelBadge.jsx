import { C } from "../../styles/theme";

export function HauptmangelBadge() {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
      background: "rgba(220,38,38,0.10)", color: C.red,
      border: "1px solid rgba(220,38,38,0.25)",
      borderRadius: 4, padding: "2px 7px",
      fontFamily: C.mono, whiteSpace: "nowrap",
    }}>
      HAUPTMANGEL
    </span>
  );
}
