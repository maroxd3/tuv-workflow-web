import PropTypes from "prop-types";
import { MANGEL_KATEGORIEN } from "../../constants/mangel";

export function MangelPill({ kat }) {
  const m = MANGEL_KATEGORIEN[kat];
  if (!m) return null;
  return (
    <span
      className="inline-flex items-center rounded-sm border px-[7px] py-0.5 font-mono text-[10px] font-bold tracking-[0.05em] whitespace-nowrap"
      // Laufzeitwerte: Farben kommen pro Kategorie aus MANGEL_KATEGORIEN
      style={{ background: m.bg, color: m.color, borderColor: m.border }}
    >{m.kurz}</span>
  );
}

MangelPill.propTypes = {
  kat: PropTypes.oneOf(["OM", "GM", "EM", "GfM"]).isRequired,
};
