export interface Halter {
  halterId: string;
  name: string;
  telefon: string | null;
  email: string | null;
  anschrift: string | null;
  erfasstAm: string | Date;
}

export interface NeuerHalter {
  halterId?: string;
  name: string;
  telefon?: string | null;
  email?: string | null;
  anschrift?: string | null;
}

export interface Fahrzeug {
  fahrzeugId: string;
  kennzeichen: string;
  fin: string | null;
  hersteller: string;
  modell: string;
  baujahr: number | null;
  farbe: string | null;
  typ: string;
  kilometerstand: number | null;
  huFaellig: string | null;
  halterId: string;
  erfasstAm: string | Date;
}

export interface NeuesFahrzeug {
  fahrzeugId?: string;
  kennzeichen: string;
  fin?: string | null;
  hersteller: string;
  modell: string;
  baujahr?: number | null;
  farbe?: string | null;
  typ: string;
  kilometerstand?: number | null;
  huFaellig?: string | null;
  halterId: string;
}

export interface Termin {
  terminId: string;
  fahrzeugId: string;
  datum: string | Date;
  uhrzeit: string | null;
  prueftCode: string;
  prueferKuerzel: string | null;
  statusCode: string;
  notiz: string | null;
  erfasstAm: string | Date;
}

export interface NeuerTermin {
  terminId?: string;
  fahrzeugId: string;
  datum: string;
  uhrzeit?: string | null;
  prueftCode: string;
  prueferKuerzel?: string | null;
  statusCode?: string;
  notiz?: string | null;
}

export interface Mangel {
  mangelId: string;
  terminId: string;
  codeStvzo: string | null;
  beschreibung: string;
  kategorieCode: string;
  behoben: boolean;
  erfasstAm: string | Date;
}

export interface NeuerMangel {
  mangelId?: string;
  terminId: string;
  codeStvzo?: string | null;
  beschreibung: string;
  kategorieCode: string;
  behoben?: boolean;
}
