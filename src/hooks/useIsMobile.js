import { useState, useEffect } from "react";

/**
 * Liefert true, wenn die Viewport-Breite unter dem Breakpoint liegt.
 * Aktualisiert sich bei Resize, sodass Layout-Entscheidungen reaktiv bleiben.
 * Default-Breakpoint 768 px = Tablet-Hochkant / Phone.
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}
