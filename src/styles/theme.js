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

export const GLOBAL_CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  ::-webkit-scrollbar{width:5px;height:5px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#C5C8E0;border-radius:3px;}
  ::-webkit-scrollbar-thumb:hover{background:#A0A4CC;}
  input,select,textarea,button{font-family:inherit;}
  input[type=date]::-webkit-calendar-picker-indicator{filter:none;opacity:0.5;cursor:pointer;}
  button:focus-visible{outline:2px solid #4F46E5;outline-offset:2px;}
  option{background:#FFFFFF;color:#0F0F1A;}

  /* ── Hover effects ── */
  .btn-primary{transition:all 0.18s ease;}
  .btn-primary:not(:disabled):hover{filter:brightness(1.10);transform:translateY(-1px);box-shadow:0 6px 24px rgba(79,70,229,0.35)!important;}
  .btn-primary:not(:disabled):active{transform:translateY(0);}

  .btn-ghost{transition:all 0.15s ease;}
  .btn-ghost:hover{background:rgba(0,0,0,0.06)!important;border-color:rgba(0,0,0,0.14)!important;}

  .btn-icon{transition:all 0.15s ease;}
  .btn-icon:hover{transform:scale(1.08);background:rgba(0,0,0,0.07)!important;}

  .kpi-card{transition:all 0.2s ease;}
  .kpi-card:hover{transform:translateY(-3px);box-shadow:0 12px 36px rgba(0,0,0,0.12)!important;}

  .fz-card{transition:all 0.18s ease;}
  .fz-card:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,0.10)!important;}

  .nav-btn{transition:all 0.15s ease;}
  .nav-btn:hover{background:rgba(255,255,255,0.08)!important;}

  .termin-row{transition:background 0.12s ease;}
  .termin-row:hover{background:rgba(79,70,229,0.06)!important;}

  .recharts-tooltip-wrapper{pointer-events:none;}

  /* ── Mobile (< 768px) responsive overrides ── */
  @media (max-width: 768px) {
    .grid-resp-2 { grid-template-columns: 1fr !important; }
    .grid-resp-4 { grid-template-columns: 1fr 1fr !important; }
    .grid-resp-5 { grid-template-columns: 1fr 1fr !important; }
    .stack-mobile { grid-template-columns: 1fr !important; }
    .hide-mobile { display: none !important; }
    .full-mobile { width: 100% !important; max-width: 100% !important; }
    .pad-mobile { padding: 12px 14px !important; }
    .row-wrap-mobile { flex-wrap: wrap !important; }
  }
`;
