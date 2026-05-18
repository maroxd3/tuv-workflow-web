import { MANGEL_KATEGORIEN } from "../constants/mangel";

// Ein blockierender Mangel verhindert nach HU-Richtlinie das Bestehen:
// EM (Erheblicher Mangel) oder GfM (Gefaehrlicher Mangel). Behobene Maengel
// zaehlen nicht.
export const hatBlockierendenMangel = (maengel) =>
  maengel?.some((m) => !m.behoben && MANGEL_KATEGORIEN[m.kat]?.blockiert) ?? false;

// Backwards-compat alias — vor dem HU-Richtlinie-Refactor war das die
// Standard-Funktion. Wird in den Views noch unter altem Namen benutzt.
export const hatHauptmangel = hatBlockierendenMangel;
