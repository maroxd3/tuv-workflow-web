import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export function Modal({ title, sub, onClose, children, width = 640 }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // A11y: Fokus beim Oeffnen in den Dialog verschieben, damit Tastatur-/
  // Screenreader-Nutzer nicht im Hintergrund haengen bleiben.
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-[rgba(15,15,26,0.55)] p-2 backdrop-blur-[8px]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }} transition={{ duration: 0.2, ease: "easeOut" }}
        ref={panelRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        className="w-full max-h-[94vh] overflow-auto rounded-[14px] border border-line-med bg-surface outline-none shadow-[0_24px_80px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.08)]"
        style={{ maxWidth: width }} // Laufzeitwert: Breite kommt als Prop
      >
        <div className="sticky top-0 z-[1] flex items-start justify-between gap-3 border-b border-line bg-surface px-6 pt-5 pb-[18px] max-[768px]:px-3.5 max-[768px]:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="min-w-0">
              <div className="text-[16px] font-bold text-t1 tracking-[-0.02em]">{title}</div>
              {sub && <div className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-t4">{sub}</div>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Schließen"
            className="flex shrink-0 cursor-pointer rounded-lg border border-line bg-glass p-[7px] text-t3 transition-all duration-150 hover:scale-[1.08] hover:bg-[rgba(0,0,0,0.07)] max-[768px]:p-[9px]">
            <X size={14} />
          </button>
        </div>
        <div className="px-6 py-[22px] max-[768px]:px-3.5 max-[768px]:py-3">{children}</div>
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
