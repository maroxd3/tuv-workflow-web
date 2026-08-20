import { useId, Children, cloneElement, isValidElement } from "react";
import PropTypes from "prop-types";
import { ChevronDown, AlertCircle } from "lucide-react";

/* Gemeinsame Feld-Optik für Inp/Sel/textarea-Verwender.
   Bewusst OHNE Hintergrund — den setzt jeder Verwender selbst
   (Inp/Sel: bg-surface, Freitext-Mangel-Textarea: bg-bg). */
export const FIELD_CLS = "w-full rounded-lg border px-3 py-[9px] text-[13px] text-t1 outline-none";

export function Inp({ value, onChange, placeholder, type = "text", error, className = "", mono = false, list, disabled = false, ...props }) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} type={type} list={list} disabled={disabled} {...props}
      className={[
        FIELD_CLS, "bg-surface",
        "transition-[border-color] duration-150",
        error ? "border-[rgba(220,38,38,0.5)]" : "border-line focus:border-blue",
        mono ? "font-mono" : "font-sans",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-text",
        className,
      ].join(" ")}
    />
  );
}

Inp.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  type: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
  mono: PropTypes.bool,
  list: PropTypes.string,
  disabled: PropTypes.bool,
};

export function Sel({ value, onChange, children, className = "", id, disabled = false, title }) {
  return (
    // title am Wrapper: der Browser zeigt den Tooltip auch ueber einem
    // disabled <select> (dort feuern keine Pointer-Events).
    <div className="relative" title={title}>
      <select id={id} value={value} onChange={onChange} disabled={disabled} title={title}
        className={[
          FIELD_CLS, "bg-surface border-line font-sans appearance-none pr-8",
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
          className,
        ].join(" ")}
      >{children}</select>
      <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-t3" />
    </div>
  );
}

Sel.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
  id: PropTypes.string,
  disabled: PropTypes.bool,
  title: PropTypes.string,
};

export function Fld({ label, error, hint, children, span = 1 }) {
  const autoId = useId();
  // A11y: <label> per htmlFor mit dem Eingabe-Element verknuepfen.
  // Das ERSTE Element-Kind (Inp/Sel/textarea) bekommt die generierte id —
  // weitere Kinder (z. B. <datalist> oder Zusatz-Inputs) bleiben unberuehrt.
  const childArray = Children.toArray(children);
  const firstIdx = childArray.findIndex(isValidElement);
  const firstChild = firstIdx >= 0 ? childArray[firstIdx] : null;
  const controlId = firstChild ? (firstChild.props.id || autoId) : null;
  const kids = childArray.map((child, i) =>
    i === firstIdx && !child.props.id ? cloneElement(child, { id: autoId }) : child,
  );
  return (
    <div className={`flex flex-col gap-[5px] ${span === 2 ? "col-span-full" : ""}`}>
      <label htmlFor={controlId || undefined} className="text-[10px] font-bold text-t3 tracking-[0.1em] uppercase">{label}</label>
      {kids}
      {/* hint: neutraler Erklaertext (z. B. warum ein Feld gesperrt ist).
          Wird von error verdraengt — ein Fehler ist die wichtigere Meldung. */}
      {!error && hint && <span className="text-[10px] text-t4">{hint}</span>}
      {error && <span className="flex items-center gap-[3px] text-[10px] text-red-l"><AlertCircle size={10} />{error}</span>}
    </div>
  );
}

Fld.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  hint: PropTypes.string,
  children: PropTypes.node,
  span: PropTypes.oneOf([1, 2]),
};
