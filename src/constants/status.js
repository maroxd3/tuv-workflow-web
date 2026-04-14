import { C } from "../styles/theme";

export const STATUS = {
  GEPLANT:         "Geplant",
  IN_PRUEFUNG:     "In Prüfung",
  BESTANDEN:       "Bestanden",
  NICHT_BESTANDEN: "Nicht bestanden",
  NACHPRUEFUNG:    "Nachprüfung",
  NICHT_ERSCHIENEN:"Nicht erschienen",
  ABGEBROCHEN:     "Abgebrochen",
};

export const STATUS_CFG = {
  [STATUS.GEPLANT]:         { color: C.t2,      glow: "rgba(122,154,190,0.12)",  border: "rgba(122,154,190,0.28)",  dot: C.t3       },
  [STATUS.IN_PRUEFUNG]:     { color: C.cyan,    glow: "rgba(6,200,216,0.13)",    border: "rgba(6,200,216,0.38)",    dot: C.cyan     },
  [STATUS.BESTANDEN]:       { color: C.green,   glow: "rgba(15,194,138,0.13)",   border: "rgba(15,194,138,0.38)",   dot: C.green    },
  [STATUS.NICHT_BESTANDEN]: { color: C.red,     glow: "rgba(240,69,90,0.13)",    border: "rgba(240,69,90,0.38)",    dot: C.red      },
  [STATUS.NACHPRUEFUNG]:    { color: C.amber,   glow: "rgba(245,166,32,0.13)",   border: "rgba(245,166,32,0.38)",   dot: C.amber    },
  [STATUS.NICHT_ERSCHIENEN]:{ color: C.orange,  glow: "rgba(248,112,56,0.13)",   border: "rgba(248,112,56,0.38)",   dot: C.orange   },
  [STATUS.ABGEBROCHEN]:     { color: C.purple,  glow: "rgba(150,99,245,0.13)",   border: "rgba(150,99,245,0.38)",   dot: C.purple   },
};
