const pad = n => String(n).padStart(2, "0");

export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const isoDate = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const addDays = (ds, n) => {
  const d = new Date(ds);
  d.setDate(d.getDate() + n);
  return isoDate(d);
};

export const fmtDate = iso => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
};

export const fmtDateLong = iso => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(d);
};

export const dayName = ds => new Date(ds).toLocaleDateString("de-DE", { weekday: "long" });

export const dayShort = ds => new Date(ds).toLocaleDateString("de-DE", { weekday: "short" });
