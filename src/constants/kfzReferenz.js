/**
 * KFZ-Referenzliste für Plausibilitäts-Warnungen.
 *
 * Zweck: Weiche Validierung (Warnung, nicht Blocker) — schlägt Alarm bei
 * offensichtlich falschen Kombinationen wie "BMW Polo" oder "VW Golf Motorrad".
 * Für Prototyp-Scope ausreichend; keine vollständige KBA-Datenbank.
 *
 * Strategie: Pro Hersteller die Fahrzeugtypen, die er baut, und die
 * gebräuchlichsten Modelle. Modell-Matching ist substring-based und
 * case-insensitive, damit "3er", "Golf VIII GTI", "Sprinter 316 CDI" usw.
 * gefunden werden.
 */

export const HERSTELLER_REFERENZ = {
  "bmw": {
    display: "BMW",
    typen: ["PKW", "BEV", "HEV", "Motorrad"],
    modelle: [
      "1er", "2er", "3er", "4er", "5er", "6er", "7er", "8er",
      "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4",
      "i3", "i4", "i7", "iX", "iX1", "iX3",
      "M2", "M3", "M4", "M5", "M8",
      "R 1250", "S 1000", "F 850", "G 310", "K 1600",
      /* BMW verwendet Ziffern-Modellcodes wie "320d", "520i", "M340i" ... */
      "114", "116", "118", "120", "125", "128", "135", "140",
      "216", "218", "220", "225", "228", "235", "240",
      "316", "318", "320", "323", "325", "328", "330", "335", "340", "M340",
      "418", "420", "425", "428", "430", "435", "440",
      "518", "520", "523", "525", "528", "530", "535", "540", "545", "550", "M550",
      "620", "628", "630", "635", "640", "645", "650",
      "725", "728", "730", "735", "740", "745", "750", "760",
      "840", "850",
    ],
  },
  "mercedes-benz": {
    display: "Mercedes-Benz",
    typen: ["PKW", "BEV", "HEV", "Transporter", "LKW", "Sprinter", "Bus"],
    modelle: ["A-Klasse", "B-Klasse", "C-Klasse", "E-Klasse", "S-Klasse", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "G-Klasse", "EQA", "EQB", "EQC", "EQE", "EQS", "EQV", "Sprinter", "Vito", "V-Klasse", "Actros", "Atego", "Axor"],
  },
  "mercedes": {
    display: "Mercedes-Benz",
    typen: ["PKW", "BEV", "HEV", "Transporter", "LKW", "Bus"],
    modelle: ["A-Klasse", "B-Klasse", "C-Klasse", "E-Klasse", "S-Klasse", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "G-Klasse", "EQA", "EQB", "EQC", "EQE", "EQS", "EQV", "Sprinter", "Vito", "V-Klasse", "Actros", "Atego", "Axor"],
  },
  "volkswagen": {
    display: "Volkswagen",
    typen: ["PKW", "BEV", "HEV", "Transporter"],
    modelle: ["Polo", "Golf", "Passat", "Tiguan", "Touareg", "Touran", "T-Roc", "T-Cross", "Arteon", "ID.3", "ID.4", "ID.5", "ID.7", "ID.Buzz", "up!", "Caddy", "T6", "T7", "Crafter", "Amarok"],
  },
  "vw": {
    display: "Volkswagen",
    typen: ["PKW", "BEV", "HEV", "Transporter"],
    modelle: ["Polo", "Golf", "Passat", "Tiguan", "Touareg", "Touran", "T-Roc", "T-Cross", "Arteon", "ID.3", "ID.4", "ID.5", "ID.7", "ID.Buzz", "up!", "Caddy", "T6", "T7", "Crafter", "Amarok"],
  },
  "audi": {
    display: "Audi",
    typen: ["PKW", "BEV", "HEV"],
    modelle: ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "e-tron", "TT", "R8", "RS3", "RS4", "RS5", "RS6", "RS7", "S3", "S4", "S5", "S6", "S7", "S8"],
  },
  "porsche": {
    display: "Porsche",
    typen: ["PKW", "BEV", "HEV"],
    modelle: ["911", "718", "Taycan", "Panamera", "Macan", "Cayenne", "Cayman", "Boxster"],
  },
  "opel": {
    display: "Opel",
    typen: ["PKW", "BEV", "HEV", "Transporter"],
    modelle: ["Astra", "Corsa", "Insignia", "Mokka", "Crossland", "Grandland", "Combo", "Vivaro", "Movano", "Zafira"],
  },
  "ford": {
    display: "Ford",
    typen: ["PKW", "BEV", "HEV", "Transporter", "LKW"],
    modelle: ["Fiesta", "Focus", "Mondeo", "Kuga", "Puma", "EcoSport", "Mustang", "Mustang Mach-E", "Explorer", "Transit", "Tourneo", "Ranger"],
  },
  "fiat": {
    display: "Fiat",
    typen: ["PKW", "BEV", "Transporter"],
    modelle: ["500", "500e", "500X", "500L", "Panda", "Tipo", "Ducato", "Doblo", "Fiorino", "Talento"],
  },
  "citroën": {
    display: "Citroën",
    typen: ["PKW", "BEV", "Transporter"],
    modelle: ["C1", "C2", "C3", "C4", "C5", "C6", "Berlingo", "Jumper", "Jumpy", "Spacetourer", "ë-C4", "ë-Berlingo"],
  },
  "citroen": {
    display: "Citroën",
    typen: ["PKW", "BEV", "Transporter"],
    modelle: ["C1", "C2", "C3", "C4", "C5", "C6", "Berlingo", "Jumper", "Jumpy", "Spacetourer", "ë-C4", "ë-Berlingo"],
  },
  "peugeot": {
    display: "Peugeot",
    typen: ["PKW", "BEV", "HEV", "Transporter"],
    modelle: ["108", "208", "308", "408", "508", "2008", "3008", "5008", "Partner", "Expert", "Boxer", "Traveller", "Rifter"],
  },
  "renault": {
    display: "Renault",
    typen: ["PKW", "BEV", "Transporter"],
    modelle: ["Clio", "Captur", "Megane", "Scenic", "Kadjar", "Koleos", "Arkana", "Austral", "Zoe", "Twingo", "Kangoo", "Trafic", "Master"],
  },
  "toyota": {
    display: "Toyota",
    typen: ["PKW", "HEV", "BEV"],
    modelle: ["Aygo", "Yaris", "Corolla", "C-HR", "RAV4", "Camry", "Prius", "Supra", "Land Cruiser", "Hilux", "Proace", "Mirai", "bZ4X"],
  },
  "honda": {
    display: "Honda",
    typen: ["PKW", "HEV", "BEV", "Motorrad"],
    modelle: ["Civic", "Jazz", "CR-V", "HR-V", "ZR-V", "e:Ny1", "CB", "CBR", "CRF", "NC", "Africa Twin", "Gold Wing"],
  },
  "hyundai": {
    display: "Hyundai",
    typen: ["PKW", "BEV", "HEV"],
    modelle: ["i10", "i20", "i30", "Kona", "Tucson", "Santa Fe", "Bayon", "IONIQ 5", "IONIQ 6", "Staria"],
  },
  "kia": {
    display: "Kia",
    typen: ["PKW", "BEV", "HEV"],
    modelle: ["Picanto", "Rio", "Ceed", "XCeed", "Stonic", "Sportage", "Sorento", "Niro", "EV6", "EV9", "e-Soul"],
  },
  "škoda": {
    display: "Škoda",
    typen: ["PKW", "BEV", "HEV"],
    modelle: ["Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Enyaq"],
  },
  "skoda": {
    display: "Škoda",
    typen: ["PKW", "BEV", "HEV"],
    modelle: ["Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Enyaq"],
  },
  "seat": {
    display: "SEAT",
    typen: ["PKW", "HEV"],
    modelle: ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco", "Mii"],
  },
  "mini": {
    display: "MINI",
    typen: ["PKW", "BEV"],
    modelle: ["Cooper", "Cooper S", "Countryman", "Clubman", "Cabrio", "Cooper SE"],
  },
  "dacia": {
    display: "Dacia",
    typen: ["PKW", "BEV"],
    modelle: ["Sandero", "Logan", "Duster", "Jogger", "Spring", "Bigster"],
  },
  "iveco": {
    display: "Iveco",
    typen: ["Transporter", "LKW", "Bus"],
    modelle: ["Daily", "Eurocargo", "Stralis", "S-Way", "T-Way"],
  },
  "man": {
    display: "MAN",
    typen: ["LKW", "Bus", "Transporter"],
    modelle: ["TGE", "TGL", "TGM", "TGS", "TGX", "Lion's", "Bus"],
  },
  "scania": {
    display: "Scania",
    typen: ["LKW", "Bus"],
    modelle: ["R-Serie", "S-Serie", "P-Serie", "G-Serie", "Touring"],
  },
  "volvo": {
    display: "Volvo",
    typen: ["PKW", "BEV", "HEV", "LKW", "Bus"],
    modelle: ["XC40", "XC60", "XC90", "V40", "V60", "V90", "S60", "S90", "EX30", "EX90", "FH", "FM", "FMX", "FL"],
  },
  "tesla": {
    display: "Tesla",
    typen: ["BEV", "PKW"],
    modelle: ["Model 3", "Model S", "Model X", "Model Y", "Roadster", "Cybertruck"],
  },
  "yamaha": {
    display: "Yamaha",
    typen: ["Motorrad"],
    modelle: ["MT", "YZF", "Ténéré", "Tracer", "Bolt", "XSR"],
  },
  "ducati": {
    display: "Ducati",
    typen: ["Motorrad"],
    modelle: ["Panigale", "Streetfighter", "Monster", "Multistrada", "Scrambler", "DesertX"],
  },
  "ktm": {
    display: "KTM",
    typen: ["Motorrad"],
    modelle: ["Duke", "RC", "Adventure", "EXC", "SX", "SMC"],
  },
  "kawasaki": {
    display: "Kawasaki",
    typen: ["Motorrad"],
    modelle: ["Ninja", "Z", "Versys", "Vulcan", "KX"],
  },
  "suzuki": {
    display: "Suzuki",
    typen: ["Motorrad", "PKW"],
    modelle: ["GSX", "V-Strom", "Hayabusa", "Swift", "Vitara", "Jimny", "S-Cross", "Ignis"],
  },
  "harley-davidson": {
    display: "Harley-Davidson",
    typen: ["Motorrad"],
    modelle: ["Sportster", "Softail", "Touring", "Road King", "Fat Boy", "Iron"],
  },
  "piaggio": {
    display: "Piaggio",
    typen: ["Motorrad", "Mofa"],
    modelle: ["Vespa", "Liberty", "MP3", "Beverly", "Medley", "Zip", "Ape"],
  },
  "vespa": {
    display: "Vespa",
    typen: ["Motorrad", "Mofa"],
    modelle: ["Primavera", "Sprint", "GTS", "GTV", "PX"],
  },
};

/**
 * Liefert die normalisierte Form (lowercase, getrimmt) eines Herstellernamens.
 */
export function normalizeHersteller(h) {
  return (h || "").trim().toLowerCase();
}
