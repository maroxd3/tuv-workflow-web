import PropTypes from "prop-types";

/* Wiederverwendete Klassen-Bausteine für die drei Button-Varianten */
const BTN_BASE = "flex items-center gap-1.5 rounded-[9px] font-sans";
const BTN_SIZE = sm => (sm ? "px-3.5 py-[7px] text-[12px]" : "px-5 py-[9px] text-[13px]");

export function BtnP({ onClick, children, icon: Icon, disabled = false, danger = false, sm = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        BTN_BASE, BTN_SIZE(sm), "font-semibold border",
        "transition-all duration-[0.18s] ease-in-out",
        "enabled:hover:brightness-110 enabled:hover:-translate-y-px enabled:hover:shadow-[0_6px_24px_rgba(79,70,229,0.35)] enabled:active:translate-y-0",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        danger
          ? "bg-[rgba(220,38,38,0.09)] border-[rgba(220,38,38,0.25)] text-red-l shadow-none"
          : "bg-[linear-gradient(135deg,#2563EB,#3B82F6)] border-transparent text-white shadow-[0_2px_8px_rgba(37,99,235,0.28)]",
      ].join(" ")}
    >
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
    <button
      onClick={onClick}
      className={[
        BTN_BASE, BTN_SIZE(sm), "font-medium border cursor-pointer",
        "transition-all duration-150 ease-in-out hover:bg-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.14)]",
        danger
          ? "bg-[rgba(239,68,68,0.09)] border-[rgba(239,68,68,0.25)] text-red-l"
          : "bg-glass border-line text-t2",
      ].join(" ")}
    >
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
    // A11y: Icon-only-Button — title dient gleichzeitig als aria-label
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={[
        "flex cursor-pointer rounded-[7px] border",
        "transition-all duration-150 ease-in-out hover:scale-[1.08] hover:bg-[rgba(0,0,0,0.07)]",
        sm ? "px-1.5 py-1" : "px-2 py-1.5",
        "max-[768px]:p-[9px]", // Touch-Target auf Mobil vergrößern
        danger ? "bg-[rgba(239,68,68,0.09)] border-[rgba(239,68,68,0.22)]" : "bg-glass border-line",
      ].join(" ")}
      style={{ color }} // Laufzeitwert: Icon-Farbe kommt als Prop
    >
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
