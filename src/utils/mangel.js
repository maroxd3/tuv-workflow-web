import { MANGEL_KATEGORIEN } from "../constants/mangel";

// Ein blockierender Mangel verhindert nach HU-Richtlinie das Bestehen:
// EM (Erheblicher Mangel) oder GfM (Gefaehrlicher Mangel). Behobene Maengel
// zaehlen nicht. Einziger Ort fuer diese Regel — Kategorien-Daten liegen
// in MANGEL_KATEGORIEN[kategorieCode].blockiert, hier NICHT hart auf
// "EM"/"GfM" pruefen. Erwartet Maengel in DB-Form (kategorieCode).
export const istBlockierenderMangel = (m) =>
  !!m && !m.behoben && !!MANGEL_KATEGORIEN[m.kategorieCode]?.blockiert;

export const hatBlockierendenMangel = (maengel) =>
  maengel?.some(istBlockierenderMangel) ?? false;

// Backwards-compat alias — vor dem HU-Richtlinie-Refactor war das die
// Standard-Funktion. Wird in den Views noch unter altem Namen benutzt.
export const hatHauptmangel = hatBlockierendenMangel;
