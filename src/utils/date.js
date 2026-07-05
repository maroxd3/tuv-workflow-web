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

// ── DB-Wert-Normalisierung ─────────────────────────────────────────────
// Die API/der mariadb-Treiber liefert date/time-Werte je nach Quelle als
// String ODER Date-Objekt. Die Views vergleichen stets gegen
// "yyyy-mm-dd"-Strings (datum) und "HH:MM"-Strings (uhrzeit) — diese
// Helfer normalisieren einen DB-Wert genau dafür.

// "2026-07-10T…" | Date → "2026-07-10" (LOKAL-Zeit, nicht UTC — sonst
// springt das Datum um Mitternacht eine Zeitzone in den Vortag und
// matchet z. B. TagesplanView's isoDate()-Filter nicht mehr).
export const toIsoDateStr = (d) => {
  if (typeof d === "string") return d.slice(0, 10);
  if (d instanceof Date) return isoDate(d);
  return "";
};

// "08:30:00" | Date → "08:30"; leere Werte → null
export const toTimeStr = (u) => {
  if (u === null || u === undefined || u === "") return null;
  if (typeof u === "string") return u.slice(0, 5);
  if (u instanceof Date) return `${pad(u.getHours())}:${pad(u.getMinutes())}`;
  return null;
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
