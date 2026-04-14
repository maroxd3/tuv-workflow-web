export const PRUEFUNG_ARTEN = [
  { id:"HU",     label:"Hauptuntersuchung (HU)",         code:"§29 StVZO",  dauer:45 },
  { id:"AU",     label:"Abgasuntersuchung (AU)",          code:"§47a StVZO", dauer:15 },
  { id:"HU_AU",  label:"HU + AU (kombiniert)",            code:"§29/47a",    dauer:55 },
  { id:"NP",     label:"Nachprüfung",                     code:"§29 Abs.4",  dauer:25 },
  { id:"§21",    label:"Einzelgenehmigung §21 StVZO",     code:"§21 StVZO",  dauer:90 },
  { id:"§19",    label:"Teilegutachten §19 StVZO",        code:"§19 StVZO",  dauer:60 },
  { id:"SP",     label:"Sicherheitsprüfung (SP)",         code:"§29 Anl.17", dauer:30 },
  { id:"Saison", label:"Saisonzulassung",                 code:"§23 StVZO",  dauer:20 },
  { id:"GAS",    label:"Gasanlagenprüfung (CNG/LPG)",     code:"§41a StVZO", dauer:30 },
  { id:"Abnahme",label:"Fahrzeugabnahme / Umrüstung",     code:"§19 Abs.3",  dauer:45 },
  { id:"OBD",    label:"OBD-Prüfung (On-Board-Diagnose)", code:"§47a",       dauer:15 },
  { id:"Licht",  label:"Lichttest / Scheinwerfereinst.",  code:"§50 StVZO",  dauer:20 },
];

export const PRUEFER = [
  { id:"MW", name:"M. Weber",   titel:"Kfz-Sachverständiger", zert:"TÜV Nord #2241", bild:"MW" },
  { id:"AF", name:"A. Fischer", titel:"Kfz-Prüfingenieur",    zert:"TÜV Nord #1887", bild:"AF" },
  { id:"SK", name:"S. Kaya",    titel:"Kfz-Sachverständige",  zert:"TÜV Nord #3012", bild:"SK" },
  { id:"LN", name:"L. Neumann", titel:"Kfz-Prüfingenieur",    zert:"TÜV Nord #2756", bild:"LN" },
  { id:"TB", name:"T. Berger",  titel:"Kfz-Sachverständiger", zert:"TÜV Nord #1523", bild:"TB" },
];
