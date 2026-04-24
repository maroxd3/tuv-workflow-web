import { useEffect } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { C } from "../../styles/theme";

export function Modal({ title, sub, onClose, children, width = 640 }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400, background: "rgba(15,15,26,0.55)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }} transition={{ duration: 0.2, ease: "easeOut" }}
        style={{
          background: C.surface, border: `1px solid ${C.lineMed}`, borderRadius: 18,
          width: "100%", maxWidth: width, maxHeight: "93vh", overflow: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08)",
        }}>
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          padding: "22px 28px 20px", borderBottom: `1px solid ${C.line}`,
          position: "sticky", top: 0, background: C.surface, zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em" }}>{title}</div>
              {sub && <div style={{ fontSize: 11, color: C.t4, marginTop: 2 }}>{sub}</div>}
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{
            background: C.glass, border: `1px solid ${C.line}`, borderRadius: 8,
            padding: "7px", cursor: "pointer", color: C.t3, display: "flex",
          }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: "24px 28px" }}>{children}</div>
      </motion.div>
    </div>
  );
}

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  sub: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
  width: PropTypes.number,
};
