import PropTypes from "prop-types";
import { motion } from "framer-motion";

export function Kpi({ label, value, sub, accent, icon: Icon }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-line bg-surface px-[22px] py-5 shadow-[0_2px_8px_rgba(15,23,42,0.07)] transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_12px_36px_rgba(0,0,0,0.12)]">
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
        // Laufzeitwert: Akzentfarbe kommt als Prop (Gradient pro KPI)
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}44)` }} />
      <div className="mt-1 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-t4">{label}</div>
          <div className="font-mono text-[32px] font-bold leading-none tracking-[-0.02em] text-t1">{value}</div>
          {sub && <div className="mt-1.5 text-[11px] font-medium text-t3">{sub}</div>}
        </div>
        {Icon && (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
            // Laufzeitwerte: Akzentfarbe mit Alpha-Suffix pro KPI
            style={{ background: `${accent}14`, borderColor: `${accent}28` }}>
            <Icon size={20} color={accent} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

Kpi.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sub: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  accent: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
};
