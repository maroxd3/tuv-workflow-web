#!/usr/bin/env node
/**
 * Einmal-Refactor: ASCII-Umschreibungen (tuev, Pruefstelle, fuer, ...) auf
 * korrektes Deutsch mit Umlauten (TÜV, Prüfstelle, für, ...) sowie alte
 * Mangelkategorie-Listen (OM/LM/EM/HM/GM) auf HU-Richtlinie (OM/GM/EM/GfM).
 *
 * Sicherheits-Logik:
 *   - Technische Identifier (Docker-Container, DB-Name, URLs) bleiben ASCII.
 *   - Word-Boundary-Matching, wo sinnvoll.
 *   - Eine Deny-Liste von Dateien wird übersprungen.
 *
 * Aufruf:  node scripts/refactor-umlaute-und-kategorien.mjs [--dry]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative, sep } from "node:path";

const ROOT = process.cwd();
const DRY = process.argv.includes("--dry");

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "backups",
  "src-tauri", "public",
]);

const SKIP_FILES = new Set([
  "scripts/refactor-umlaute-und-kategorien.mjs", // dieses Script selbst
  "src/constants/kfzKreis.js",                  // Kreis-Codes HM/LM/GM = Stadtnamen
  "docs/architecture-map.html",                  // legacy SVG-Map
  "package-lock.json",
  "praesentation.pdf",
]);

// NUR Doku-Files refaktorieren. Source-Code (.ts/.tsx/.js/.jsx) NICHT
// anfassen, weil dort viele ASCII-Strings als Identifier/Property-Keys
// verwendet werden (z.B. `pruefer` als Object-Key in useStoreCompat.ts).
// UI-Strings in JSX bleiben damit unveraendert — die werden separat per
// Hand uebersetzt, wenn der Aufwand sich lohnt.
const FILE_EXTS = new Set([
  ".md", ".html",
]);

// === Umlaut-Ersetzungen (case-sensitive, in dieser Reihenfolge) ===
// Längere Patterns zuerst, damit z.B. "Pruefstelle" nicht durch "pruef"
// teilweise ersetzt wird.
const UMLAUT_RULES = [
  // tuev / TUEV / Tuev (vorsichtig: "tuv" ohne e bleibt — das sind Identifier)
  [/\bTUEV\b/g, "TÜV"],
  [/\bTuev\b/g, "Tüv"],
  [/\btuev\b/g, "tüv"],

  // Prüfstelle und Verwandte
  [/Pruefstellen/g, "Prüfstellen"],
  [/Pruefstelle/g, "Prüfstelle"],
  [/pruefstellen/g, "prüfstellen"],
  [/pruefstelle/g, "prüfstelle"],

  // Prüfung / Prüfberichte / Prüfer / Prüfart
  // (?!_) verhindert, dass DB-Spalten wie prueft_code, pruefer_kuerzel ersetzt werden.
  [/Pruefungen(?!_)/g, "Prüfungen"],
  [/Pruefung(?!_)/g, "Prüfung"],
  [/Pruefberichte(?!_)/g, "Prüfberichte"],
  [/Pruefbericht(?!_)/g, "Prüfbericht"],
  [/Pruefliste(?!_)/g, "Prüfliste"],
  [/Pruefarten(?!_)/g, "Prüfarten"],
  [/Pruefart(?!_)/g, "Prüfart"],
  [/Prueferin(?!_)/g, "Prüferin"],
  [/Pruefer(?!_)/g, "Prüfer"],
  [/Pruefen(?!_)/g, "Prüfen"],
  [/Prueft(?!_)/g, "Prüft"],
  [/pruefungen(?!_)/g, "prüfungen"],
  [/pruefung(?!_)/g, "prüfung"],
  [/pruefen(?!_)/g, "prüfen"],
  [/prueft(?!_)/g, "prüft"],
  [/pruefer(?!_)/g, "prüfer"],
  [/pruefart(?!_)/g, "prüfart"],

  // Mängel
  [/Maengelerfassung/g, "Mängelerfassung"],
  [/Maengel/g, "Mängel"],
  [/maengel/g, "mängel"],

  // für (nur als ganzes Wort, sonst trifft "Furor")
  [/\bfuer\b/g, "für"],
  [/\bFuer\b/g, "Für"],

  // möglich
  [/Moeglichkeit/g, "Möglichkeit"],
  [/moeglich/g, "möglich"],
  [/Moeglich/g, "Möglich"],

  // würde / würden
  [/wuerden/g, "würden"],
  [/wuerde/g, "würde"],
  [/Wuerden/g, "Würden"],
  [/Wuerde/g, "Würde"],

  // Änderung / ändern
  [/Aenderungen/g, "Änderungen"],
  [/Aenderung/g, "Änderung"],
  [/aenderungen/g, "änderungen"],
  [/aenderung/g, "änderung"],
  [/aendern/g, "ändern"],
  [/Aendern/g, "Ändern"],
  [/aendert/g, "ändert"],
  [/Aendert/g, "Ändert"],

  // Schlüssel
  [/Schluesselkandidaten/g, "Schlüsselkandidaten"],
  [/Schluesselkandidat/g, "Schlüsselkandidat"],
  [/Schluessel/g, "Schlüssel"],
  [/schluessel/g, "schlüssel"],

  // Integrität
  [/Integritaetsbedingung/g, "Integritätsbedingung"],
  [/Integritaetseinschraenkung/g, "Integritätseinschränkung"],
  [/Integritaet/g, "Integrität"],
  [/integritaet/g, "integrität"],

  // Abhängig / Abhängigkeit
  [/Abhaengigkeiten/g, "Abhängigkeiten"],
  [/Abhaengigkeit/g, "Abhängigkeit"],
  [/Abhaengig/g, "Abhängig"],
  [/abhaengigkeit/g, "abhängigkeit"],
  [/abhaengig/g, "abhängig"],

  // über- (Überprüfung, Überblick, übernehmen ...)
  [/Ueberblick/g, "Überblick"],
  [/Uebersicht/g, "Übersicht"],
  [/Ueberpruefung/g, "Überprüfung"],
  [/ueberpruefung/g, "überprüfung"],
  [/Ueberfuehren/g, "Überführen"],
  [/ueberfuehren/g, "überführen"],
  [/Ueberlegung/g, "Überlegung"],
  [/uebernehmen/g, "übernehmen"],
  [/Uebernehmen/g, "Übernehmen"],
  [/uebertragen/g, "übertragen"],
  [/Uebertragen/g, "Übertragen"],
  [/ueberein/g, "überein"],
  // Generisches "ueber" als Wort oder Präfix vor weiteren Buchstaben.
  // \b vorne, hinten frei — fängt "ueber den", "ueber HTTP" und Compounds.
  [/\bueber/g, "über"],
  [/\bUeber/g, "Über"],

  // ß-Wörter (Substring-Matching, nur ungefährliche)
  [/ausschliesslich/g, "ausschließlich"],
  [/Ausschliesslich/g, "Ausschließlich"],
  [/Schliessen/g, "Schließen"],
  [/schliessen/g, "schließen"],
  [/Schliesst/g, "Schließt"],
  [/schliesst/g, "schließt"],
  [/Schloss/g, "Schloss"], // keine Aenderung
  [/fliessend/g, "fließend"],
  [/Heisst/g, "Heißt"],
  [/heisst/g, "heißt"],
  [/grossen/g, "großen"],
  [/Grossen/g, "Großen"],
  [/Grosse/g, "Große"],
  [/grosse/g, "große"],
  [/Gross\b/g, "Groß"],
  [/gross\b/g, "groß"],
  [/gemaess/g, "gemäß"],
  [/Gemaess/g, "Gemäß"],
  [/Ausgabe/g, "Ausgabe"], // kein Umlaut, Filler
  [/Schluesselsatz/g, "Schlüsselsatz"],

  // nächst / nächste
  [/Naechste/g, "Nächste"],
  [/naechste/g, "nächste"],
  [/naechst/g, "nächst"],

  // begründ
  [/Begruendung/g, "Begründung"],
  [/begruendung/g, "begründung"],
  [/begruenden/g, "begründen"],
  [/begruendet/g, "begründet"],

  // zulässig
  [/Zulaessig/g, "Zulässig"],
  [/zulaessig/g, "zulässig"],

  // Ausprägung
  [/Auspraegungen/g, "Ausprägungen"],
  [/Auspraegung/g, "Ausprägung"],
  [/auspraegung/g, "ausprägung"],

  // Erfüllung
  [/Erfuellung/g, "Erfüllung"],
  [/erfuellung/g, "erfüllung"],
  [/erfuellt/g, "erfüllt"],
  [/Erfuellt/g, "Erfüllt"],

  // weitere häufige Wörter
  // hu_faellig ist eine DB-Spalte — daher (?!_)... wobei hier eher _faellig
  // das Problem ist, nicht faellig_. Aber ein faellig direkt im Identifier
  // kommt nicht vor. Vor dem faellig steht _ — den koennen wir nicht via
  // Lookahead schuetzen, sondern via Lookbehind (?<!_).
  [/(?<!_)Faelligkeit/g, "Fälligkeit"],
  [/(?<!_)faelligkeit/g, "fälligkeit"],
  [/(?<!_)Faellig/g, "Fällig"],
  [/(?<!_)faellig/g, "fällig"],
  [/Geschaeft/g, "Geschäft"],
  [/geschaeft/g, "geschäft"],
  [/Gefaehrlich/g, "Gefährlich"],
  [/gefaehrlich/g, "gefährlich"],
  [/Erheblich/g, "Erheblich"],   // hat kein Umlaut, dient nur Konsistenz
  [/noetig/g, "nötig"],
  [/Noetig/g, "Nötig"],
  [/Loesung/g, "Lösung"],
  [/loesung/g, "lösung"],
  [/Loeschen/g, "Löschen"],
  [/loeschen/g, "löschen"],
  [/Hoehe/g, "Höhe"],
  [/hoehe/g, "höhe"],
  [/Groesse/g, "Größe"],
  [/groesse/g, "größe"],
  [/Schoen/g, "Schön"],
  [/schoen/g, "schön"],
  [/zurueck/g, "zurück"],
  [/Zurueck/g, "Zurück"],
  [/Pruefliste/g, "Prüfliste"],
  [/eigenstaendig/g, "eigenständig"],
  [/Eigenstaendig/g, "Eigenständig"],
  [/Datenstaende/g, "Datenstände"],
  [/Aktenschrank/g, "Aktenschrank"], // kein Umlaut, nur Doku-Konsistenz
  [/Empfang/g, "Empfang"],            // kein Umlaut, nur Doku-Konsistenz

  // Spezial für unsere Doku-Strings
  [/Verkehrssicherheit/g, "Verkehrssicherheit"], // kein Umlaut
  [/Praesentation/g, "Präsentation"],
  [/Aufloesung/g, "Auflösung"],
  [/Sicherheitsgurt/g, "Sicherheitsgurt"], // kein Umlaut

  // ß
  [/strasse/g, "straße"],
  [/Strasse/g, "Straße"],
];

// === Kategorie-Codes ===
// Vorsichtig: HM/LM/GM können auch andere Dinge bedeuten (Kreis-Codes, etc.).
// Daher nur in spezifischen Phrasen ersetzen.
const KATEGORIE_RULES = [
  // Auflistungen wie "OM/LM/EM/HM/GM" oder "OM, LM, EM, HM, GM"
  [/\bOM\/LM\/EM\/HM\/GM\b/g, "OM/GM/EM/GfM"],
  [/\bOM, LM, EM, HM, GM\b/g, "OM, GM, EM, GfM"],
  [/\bOM \| LM \| EM \| HM \| GM\b/g, "OM | GM | EM | GfM"],

  // Bezeichnung-Erklärungen
  [/HM = Hauptmangel/g, "EM = Erheblicher Mangel"],
  [/LM = Leichter Mangel/g, "GM = Geringer Mangel"],
  [/GM = Gefährlicher Mangel/g, "GfM = Gefährlicher Mangel"],
  [/GM = Gefaehrlicher Mangel/g, "GfM = Gefährlicher Mangel"],
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(ROOT, full).replaceAll(sep, "/");
    if (SKIP_DIRS.has(name)) continue;
    if (SKIP_FILES.has(rel)) continue;
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else if (FILE_EXTS.has(extname(name))) out.push(full);
  }
  return out;
}

let totalFiles = 0;
let totalReplacements = 0;
const perFile = [];

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).replaceAll(sep, "/");
  const before = readFileSync(file, "utf8");
  let after = before;
  let fileReplacements = 0;

  for (const [pat, repl] of [...UMLAUT_RULES, ...KATEGORIE_RULES]) {
    const matches = after.match(pat);
    if (matches) {
      fileReplacements += matches.length;
      after = after.replace(pat, repl);
    }
  }

  if (fileReplacements > 0) {
    totalFiles++;
    totalReplacements += fileReplacements;
    perFile.push({ file: rel, count: fileReplacements });
    if (!DRY) writeFileSync(file, after, "utf8");
  }
}

console.log(`\n${DRY ? "[DRY RUN] " : ""}Refactor abgeschlossen:`);
console.log(`  Dateien geändert: ${totalFiles}`);
console.log(`  Ersetzungen total: ${totalReplacements}\n`);
perFile.sort((a, b) => b.count - a.count);
for (const { file, count } of perFile) {
  console.log(`  ${String(count).padStart(4)} × ${file}`);
}
