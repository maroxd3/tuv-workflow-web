/* ────────────────────────────────────────────────────────────────
   ACHTUNG: Die Quelle der Wahrheit für diese Palette ist der
   @theme-Block in src/index.css (Tailwind-4-Design-Tokens).
   Dieses JS-Objekt existiert nur noch für Stellen, die Farben zur
   Laufzeit als JS-Werte brauchen (Recharts-Props, dynamisch
   berechnete Styles, STATUS_CFG/MANGEL_KATEGORIEN-Configs).
   Änderungen IMMER an beiden Stellen synchron vornehmen.
   ──────────────────────────────────────────────────────────────── */
export const C = {
  /* ── Backgrounds ── */
  bg:           "#F4F6FA",
  bgGrid:       "#ECEEF4",
  surface:      "#FFFFFF",
  surfaceUp:    "#F8F9FC",
  surfaceHigh:  "#EEF0F8",
  glass:        "rgba(0,0,0,0.04)",
  glassMed:     "rgba(0,0,0,0.06)",
  glassBright:  "rgba(0,0,0,0.10)",

  /* ── Borders ── */
  line:         "rgba(0,0,0,0.08)",
  lineMed:      "rgba(0,0,0,0.12)",
  lineHigh:     "rgba(0,0,0,0.20)",

  /* ── Text ── */
  t1:           "#0F0F1A",
  t2:           "#4B4B6B",
  t3:           "#8888AA",
  t4:           "#AAAAC4",

  /* ── Sidebar ── */
  sb:           "#1A1740",
  sbUp:         "#211E52",
  sbHigh:       "#2A2660",
  sbLine:       "rgba(255,255,255,0.09)",
  sbT1:         "#F0EEFF",
  sbT2:         "#9490CC",
  sbT3:         "#5450A0",

  /* ── Primary accent: indigo ── */
  blue:         "#4F46E5",
  blueL:        "#6366F1",
  blueGlow:     "rgba(79,70,229,0.18)",

  /* ── Other accents ── */
  cyan:         "#0891B2",
  cyanL:        "#06B6D4",
  green:        "#059669",
  greenL:       "#10B981",
  red:          "#DC2626",
  redL:         "#EF4444",
  amber:        "#D97706",
  amberL:       "#F59E0B",
  orange:       "#EA580C",
  orangeL:      "#F97316",
  purple:       "#7C3AED",
  purpleL:      "#A855F7",
  pink:         "#DB2777",
  pinkL:        "#EC4899",

  /* ── Fonts ── */
  mono:  "'JetBrains Mono', 'Fira Code', monospace",
  sans:  "'Inter', 'Helvetica Neue', sans-serif",
  disp:  "'Inter', sans-serif",
};
