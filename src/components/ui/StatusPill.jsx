import PropTypes from "prop-types";
import { STATUS, STATUS_CFG } from "../../constants/status";

export function StatusPill({ status, size = "sm" }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG[STATUS.GEPLANT];
  const lg = size === "lg";
  return (
    <span
      className={[
        "inline-flex items-center gap-[5px] rounded-full border font-mono font-bold tracking-[0.04em] whitespace-nowrap",
        lg ? "px-3.5 py-[5px] text-[12px]" : "px-[9px] py-[3px] text-[10px]",
      ].join(" ")}
      // Laufzeitwerte: Farben kommen pro Status aus STATUS_CFG
      style={{ background: cfg.glow, color: cfg.color, borderColor: cfg.border }}
    >
      <span
        className="h-[5px] w-[5px] shrink-0 rounded-full"
        // Laufzeitwerte: Dot-Farbe + Glow pro Status aus STATUS_CFG
        style={{
          background: cfg.dot,
          boxShadow: status === STATUS.IN_PRUEFUNG ? `0 0 6px ${cfg.dot}` : undefined,
        }} />
      {status}
    </span>
  );
}

StatusPill.propTypes = {
  status: PropTypes.string.isRequired,
  size: PropTypes.oneOf(["sm", "lg"]),
};
