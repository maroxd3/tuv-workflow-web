import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";
import { C } from "../styles/theme";
import { ToastShape } from "../types/propTypes";

export function Toast({ t, onRm }) {
  const cfg = {
    success: { c: C.greenL, bg: "rgba(15,194,138,0.12)", b: "rgba(15,194,138,0.28)", icon: <CheckCircle2 size={14} /> },
    error:   { c: C.redL,   bg: "rgba(240,69,90,0.12)",  b: "rgba(240,69,90,0.28)",  icon: <XCircle size={14} /> },
    info:    { c: C.blueL,  bg: "rgba(75,140,247,0.12)", b: "rgba(75,140,247,0.22)", icon: <Info size={14} /> },
    warn:    { c: C.amberL, bg: "rgba(245,166,32,0.12)", b: "rgba(245,166,32,0.28)", icon: <AlertTriangle size={14} /> },
  }[t.type] || {};

  return (
    <motion.div initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }} onClick={() => onRm(t.id)}
      style={{
        display: "flex", alignItems: "center", gap: 10, background: C.surface,
        border: `1px solid ${cfg.b}`, borderLeft: `3px solid ${cfg.c}`, borderRadius: 10,
        padding: "11px 16px", boxShadow: "0 8px 30px rgba(15,23,42,0.14), 0 0 0 1px rgba(0,0,0,0.04)", maxWidth: 360, cursor: "pointer",
      }}>
      <span style={{ color: cfg.c, flexShrink: 0 }}>{cfg.icon}</span>
      <span style={{ fontSize: 13, color: C.t1, flex: 1 }}>{t.msg}</span>
      <X size={11} color={C.t4} />
    </motion.div>
  );
}

export function ToastContainer({ toasts, onRm }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 500, display: "flex", flexDirection: "column", gap: 8 }}>
      <AnimatePresence>{toasts.map(t => <Toast key={t.id} t={t} onRm={onRm} />)}</AnimatePresence>
    </div>
  );
}

Toast.propTypes = {
  t: ToastShape.isRequired,
  onRm: PropTypes.func.isRequired,
};

ToastContainer.propTypes = {
  toasts: PropTypes.arrayOf(ToastShape).isRequired,
  onRm: PropTypes.func.isRequired,
};
