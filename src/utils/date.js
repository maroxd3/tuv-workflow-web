const pad = n => String(n).padStart(2, "0");

export const isoDate = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// "yyyy-mm-dd" LOKAL parsen. Achtung: new Date("yyyy-mm-dd") interpretiert
// den String als UTC-Mitternacht — in Zeitzonen westlich von UTC landet man
// damit lokal am Vortag und alle getDay()/getDate()-Rechnungen verrutschen.
export const parseIsoLocal = (ds) => {
  if (ds instanceof Date) return new Date(ds);
  const [y, m, d] = String(ds).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (ds, n) => {
  const d = parseIsoLocal(ds);
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
