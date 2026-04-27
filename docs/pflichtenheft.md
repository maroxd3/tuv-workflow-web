# Pflichtenheft — TÜV Prüfstelle Pro

**Kurs:** IIM-211-01 · Software-Projekt · Sommersemester 2026
**Dozentin:** Frau Sabine Fuchs
**Team:** Marwan Saleh (1724556) · Oussama Hlayhel (1731533)
**Version:** 1.1 · Stand: 2026-04-24
**Status:** In Überarbeitung (nach Feedback-Runde 1)

---

## 1. Zielsetzung

TÜV Prüfstelle Pro ist ein prototypisches Verwaltungssystem für TÜV-Prüfstellen.
Es ersetzt die in vielen Prüfstellen übliche manuelle Verwaltung auf Excel- und
Papierbasis durch ein digitales, echtzeitsynchronisiertes System zur Abwicklung
des kompletten Prüfprozesses: Terminplanung, Fahrzeugdaten, Mängelerfassung nach
StVZO-Katalog, automatische Berichtsgenerierung und Statistikauswertung.

### 1.1 Stakeholder

| Rolle | Beschreibung | Wichtigste Anliegen |
|---|---|---|
| Prüfingenieur/Sachverständiger | Führt Prüfungen durch, erfasst Mängel | Schnelle Mängelerfassung, Vorschlagsliste (§ 29 StVZO-Katalog) |
| Prüfstellenleiter | Plant Termine, überwacht Auslastung | Tagesplan-Übersicht, KPIs, Statistiken |
| Administrativer Dienst | Fahrzeug-Stammdatenpflege, Kundenkommunikation | Fahrzeug-CRUD, Halterdaten |
| Kunde (Fahrzeughalter) | Erhält Prüfbericht | Verständlicher, gesetzeskonformer Bericht |
| Dozentin (Stakeholder im Projektkontext) | Bewertet die Abgabe | Vollständigkeit, Qualität, Dokumentation |

### 1.2 Abgrenzung (was das System **nicht** tut)

- **Keine Multi-User-Authentifizierung** — Single-Tenant-Prototyp (s. Abschnitt 4)
- **Keine echten TÜV- oder KBA-Schnittstellen** — Modell dient nur der Demonstration
- **Keine Abrechnungs-/Buchhaltungsfunktion**
- **Keine Kalendereinladungen** an Kunden (iCal-Export nur als Ausblick)
- **Keine Foto-Dokumentation** von Mängeln (als Ausblick, s. Abschnitt 8)
- **Keine Hardware-Integration** (Bremsenprüfstand, OBD-Diagnosegerät etc.)

## 2. Funktionale Anforderungen

Jede Anforderung ist mit einer eindeutigen ID versehen; Akzeptanzkriterien sind
als Checkliste formuliert und im Backlog (s. `backlog.md`) auf User Stories
gemappt.

### 2.1 Fahrzeugverwaltung (F-FZ)

| ID | Anforderung | Akzeptanzkriterien |
|---|---|---|
| F-FZ-01 | Fahrzeug anlegen | Kennzeichen (mit optionalem Saison-Suffix), Hersteller, Modell, Halter sind Pflichtfelder; Hersteller / Modell / Typ werden als abhängige Dropdowns angeboten ("Sonstiger"-Fallback für Sonderfälle wie Oldtimer / Importe); System speichert bei erfolgreicher Validierung (s. nf. Anf. 3.2) |
| F-FZ-02 | Fahrzeug bearbeiten | Alle Felder außer ID änderbar; Änderungshistorie nicht erforderlich (Prototyp) |
| F-FZ-03 | Fahrzeug löschen | Bestätigungsdialog; zugehörige Termine werden ebenfalls gelöscht (Cascade) |
| F-FZ-04 | Fahrzeug suchen/filtern | Volltextsuche über Kennzeichen, FIN, Halter, Hersteller, Modell; Typfilter; Sortierung nach Kennzeichen/Halter/Marke |
| F-FZ-05 | HU-Fälligkeit anzeigen | Überfällig (rot), < 30 d (orange), < 90 d (amber), sonst grün |

### 2.2 Terminverwaltung (F-TR)

| ID | Anforderung | Akzeptanzkriterien |
|---|---|---|
| F-TR-01 | Termin anlegen | Fahrzeug, Datum sind Pflicht; Uhrzeit in 30-min-Slots; 12 Prüfarten; Status-Default "Geplant" |
| F-TR-02 | Termin bearbeiten / löschen | Status-Wechsel gemäß Workflow (s. 2.5) |
| F-TR-03 | Tagesplan-Timeline | Zeitraster 07:00–17:30; Termine per Rechtsklick-Kontextmenü anlegbar |
| F-TR-04 | Tagesplan-Tabelle | Alternative Ansicht mit allen Terminen des gewählten Tages |
| F-TR-05 | Wochenauswahl | Mini-Navigator mit Terminanzahl pro Tag |
| F-TR-06 | Statuswechsel per Button | "Starten" (Geplant → In Prüfung), "Fertig" (In Prüfung → Bestanden/Nicht bestanden je nach Mängellage) |

### 2.3 Mängelerfassung (F-MG)

| ID | Anforderung | Akzeptanzkriterien |
|---|---|---|
| F-MG-01 | Mangel aus Katalog erfassen | Zugriff auf ~100 Einträge nach StVZO § 29 Anlage VIII, gruppiert nach Baugruppe (Lenkanlage, Bremsanlage …) |
| F-MG-02 | Mangel als Freitext erfassen | Für Sonderfälle ohne Katalogeintrag; Kategorie pflicht |
| F-MG-03 | 5 Mangelkategorien | OM, LM (Geringer), EM (Erheblicher), HM (Hauptmangel), GM-Key (Gefährlich) |
| F-MG-04 | Mangel löschen | Direkt im MaengelModal |

### 2.4 Prüfergebnis / Workflow (F-WF)

| ID | Anforderung | Akzeptanzkriterien |
|---|---|---|
| F-WF-01 | 7 Prüfstatus | Geplant, In Prüfung, Bestanden, Nicht bestanden, Nachprüfung, Nicht erschienen, Abgebrochen |
| F-WF-02 | **"Bestanden" bei Hauptmangel verboten** | § 29 StVZO: Sobald ein Mangel der Kategorie HM oder GM vorhanden ist, darf der Status **nicht** "Bestanden" lauten. Mehrstufige Absicherung: UI blockiert Button, Store lehnt Patch ab, Auto-Demotion wenn HM zu bestandener Prüfung hinzugefügt wird |
| F-WF-03 | Auto-Fortschritt "Starten/Fertig" | Bei Klick auf Auto-Advance wird die Prüfung startend in "In Prüfung" und bei "Fertig" anhand der Mängellage in "Bestanden" oder "Nicht bestanden" überführt |

### 2.5 Berichte (F-BR)

| ID | Anforderung | Akzeptanzkriterien |
|---|---|---|
| F-BR-01 | Berichts-Liste | Alle abgeschlossenen Prüfungen, filterbar nach Status/Hauptmangel/Mit Mängeln |
| F-BR-02 | Berichtsvorschau | Textausgabe im amtlichen Layout mit Referenz-Nummer, Prüfinfos, Fahrzeugdaten, Halter, Mängel, Notiz, Rechtlicher Hinweis |
| F-BR-03 | Berichtsexport | Download als `.txt` mit sprechendem Dateinamen (`Pruefbericht_{Kennzeichen}_{Datum}.txt`) |

### 2.6 Statistik (F-ST)

| ID | Anforderung | Akzeptanzkriterien |
|---|---|---|
| F-ST-01 | Zeitraumfilter | 7 / 30 / 90 / 365 Tage |
| F-ST-02 | KPI-Kacheln | Bestehensquote, Gesamtzahl Prüfungen, Mängel gesamt, Hauptmängel-Anteil |
| F-ST-03 | Area-Chart | Bestehensquote-Trend über Zeit |
| F-ST-04 | Bar-Chart | Leistung pro Prüfer (Anzahl + Bestehensquote) |
| F-ST-05 | Pie-Chart | Mängel nach Kategorie |
| F-ST-06 | Top-10-Mängel | Häufigste Mängelcodes |

## 3. Nicht-funktionale Anforderungen

### 3.1 Performance (NF-PF)

| ID | Anforderung | Begründung | Messmethode |
|---|---|---|---|
| NF-PF-01 | Navigation zwischen Views: **< 150 ms** (p95) | Nielsen-Heuristik "System sollte innerhalb 100–200 ms reagieren, damit sich die Aktion direkt anfühlt". Für SPA-Navigation mit Framer-Motion-Transition (180 ms) reicht dieser Rahmen; ein niedrigerer Wert ist optisch nicht mehr wahrnehmbar | React Profiler; `performance.now()` in e2e-Test |
| NF-PF-02 | Suche / Filter im Tagesplan (aktuelles Arbeitspensum ≤ 50 Termine/Tag): **< 100 ms** (p95) | Bei clientseitigem `.filter()` ist dieser Wert selbst bei 10× der typischen Last (500 Termine) auf Standard-Hardware locker erreichbar. Grundlage: Jakob Nielsen — "0,1 s: Gefühl direkter Manipulation" | Vitest-Benchmark |
| NF-PF-03 | Termin/Fahrzeug speichern (Firestore write): **< 400 ms** (p95) ohne Latenz-Ausreißer | Firestore SLA ≥ 99,95 % für Write < 100 ms EU-Region zzgl. Netzwerk-Latenz | Chrome Network Tab; Firebase Performance Monitoring |
| NF-PF-04 | Statistik-Aufbau: **< 500 ms** (p95) für 1 000 Termine | Recharts rendert bei < 2 k Datenpunkten unauffällig; p95-Budget großzügig gesetzt für ältere Geräte | React Profiler + Synthetik-Daten |

**Lastprofil** (Begründung für die konkreten Zahlen):

- Typische mittlere Prüfstelle: ~20–30 Prüfungen/Tag, 3–5 Prüfer
- Spitzenlast: 50 Prüfungen/Tag (Jahreszeitspitzen HU/AU)
- Aktive Nutzer gleichzeitig: 3–5 (je ein Prüfer, plus Leitung und Empfang)
- Datenbestand nach 1 Jahr: ~8 000 Termine, ~3 000 Fahrzeuge

Diese Lasten liegen deutlich unter dem Performance-Grenzbereich von Firestore
und client-seitigem JavaScript — die Anforderungen sind also mit Reserve
definiert.

#### Begründung der konkreten Zahlen — warum 100 ms (nicht 50 ms, nicht 200 ms)?

Die Frage stammt aus dem Feedback der Dozentin (24.04.2026) und verdient eine
explizite Antwort. Bezogen auf NF-PF-02 (Filter-Antwortzeit im Tagesplan):

| Schwelle | Was Nielsen / Forschung dazu sagt | Bezug zu unserem Use-Case |
|---|---|---|
| **< 50 ms** | Unter ~50 ms ist der Mensch nachweislich nicht mehr in der Lage, einen Unterschied zur "Null-Latenz" wahrzunehmen (Card et al. 1991, Doherty 1979). | Würde Engineering-Aufwand erzwingen (Web-Worker, Virtualisierung, Memoization auf Render-Ebene), der ohne UX-Gewinn bleibt. **Über-Spezifikation.** |
| **≈ 100 ms** | Nielsen 1993 — "0,1 s ist die Grenze, ab der sich eine Aktion *direkt* anfühlt; der Nutzer spürt keine Verzögerung mehr und hat den Eindruck, das System reagiere unmittelbar auf ihn." | Genau dieses Gefühl wollen wir beim Tippen in der Suche und beim Anklicken eines Tag-Filters. **Sweet Spot.** |
| **≈ 200 ms** | Noch akzeptabel, aber Nielsen markiert 0,1–1,0 s als Bereich, in dem der Nutzer "merkt, dass das System gerade reagiert" — das Gefühl direkter Manipulation geht verloren. | Bei 50 Terminen/Tag wäre 200 ms nicht spürbar zu rechtfertigen — die Hardware-Reserve ist da. **Zu lasch für interaktive Filter.** |
| **> 1 000 ms** | Aufmerksamkeit driftet ab, Nutzer denkt an etwas anderes. | Nur akzeptabel für seltene Operationen (Bericht-Generierung, Statistik-Aufbau, s. NF-PF-04). |

**Test-Methode konkret** (zu allen NF-PF-Anforderungen):

1. **Synthetische Lastdaten** — `makeSeed`-Variante mit 500 Terminen + 200 Fahrzeugen (10× typische Last)
2. **Vitest-Benchmark** (`bench()`-API) misst die reine Filter-Funktion (`termine.filter(...)`) über 100 Durchläufe
3. **React Profiler** misst zusätzlich die Render-Zeit nach `setFilter()`-Aufruf via `performance.now()` zwischen `onChange` und `requestAnimationFrame`-Callback
4. **Pass-Kriterium**: p95 unter dem Schwellwert auf einem Mid-Tier-Gerät (Referenz: i5-8250U / 8 GB RAM, Chrome stable)

Damit ist die Anforderung sowohl **begründet** (warum 100 ms ergonomisch sinnvoll ist) als auch **prüfbar** (welche Methode, welches Gerät, welche Metrik).

### 3.2 Datenintegrität (NF-DI)

| ID | Anforderung | Begründung |
|---|---|---|
| NF-DI-01 | Kennzeichen-Unique | Jedes deutsche Kennzeichen darf nur einmal als aktives Fahrzeug angelegt sein (KBA-Realität) |
| NF-DI-02 | Eingabe-Validierung am Formular | Alle Eingaben werden vor dem Speichern gegen Regex/Range-Checks geprüft (s. `utils/validators.js`); Kreis-Code wird zusätzlich gegen die KBA-Liste in `constants/kfzKreis.js` (~430 Codes) geprüft; Saison-Kennzeichen mit `MM-MM`-Suffix werden formatkonform akzeptiert |
| NF-DI-03 | Workflow-Integrität im Store | Auch programmatische Statuswechsel werden im useStore gegen die Business-Regel "kein BESTANDEN bei HM/GM" geprüft (Defense-in-Depth) |
| NF-DI-04 | Cascade bei Fahrzeug-Löschung | Löschen eines Fahrzeugs entfernt auch alle zugehörigen Termine, um verwaiste Einträge zu vermeiden |
| NF-DI-05 | Hersteller-Modell-Typ-Konsistenz | Abhängige Dropdowns im Formular verhindern strukturell unmögliche Kombinationen (z. B. "BMW Polo"); im "Sonstiger"-Modus greift `validateHerstellerModellKonsistenz` als Sicherheitsnetz |
| NF-DI-06 | FIN-Plausibilität (weich) | Falls die FIN-Prüfziffer nach ISO 3779 / FMVSS 115 nicht stimmt, wird ein Hinweis angezeigt — bewusst nicht blockend (Pre-1981 / Nicht-Nordamerika-Fahrzeuge tragen keine Prüfziffer) |

### 3.3 Usability (NF-US)

| ID | Anforderung |
|---|---|
| NF-US-01 | Keine Schulung notwendig: Hauptfunktionen per Self-Service auffindbar in < 1 min |
| NF-US-02 | Deutsche UI durchgehend, StVZO-Fachterminologie korrekt verwendet |
| NF-US-03 | Tastatur-Shortcuts: Esc schließt Modal; Rechtsklick öffnet Kontextmenü im Tagesplan |
| NF-US-04 | Responsive Layout ab 1280 × 720 (Desktop-Fokus, kein Mobile-Support erforderlich) |
| NF-US-05 | Klare Fehlermeldungen an jedem Eingabefeld (rote Unterstreichung + Text) |
| NF-US-06 | Warnhinweise vs. Fehler getrennt (weiche Plausibilitätscheck ≠ harte Validierung) |

### 3.4 Portabilität (NF-PT)

| ID | Anforderung |
|---|---|
| NF-PT-01 | Lauffähig in Chrome, Edge, Firefox jeweils in der aktuellen Version |
| NF-PT-02 | Tauri-Build läuft unter Windows 10+/11, macOS 11+ und Ubuntu 22.04+ |

### 3.5 Wartbarkeit (NF-WB)

| ID | Anforderung |
|---|---|
| NF-WB-01 | Linting: 0 ESLint-Errors (Config in `eslint.config.js`), inklusive `eslint-plugin-react` mit `recommended` + jsx-runtime, PropTypes-Validation als error |
| NF-WB-02 | Testabdeckung: ≥ 70 % für `src/utils/` und Kern-Komponenten |
| NF-WB-03 | Komponentengröße ≤ 400 Zeilen, Funktionsgröße ≤ 50 Zeilen (Soft-Limits) |

### 3.6 Datenschutz & Sicherheit (NF-DS)

Die Anwendung verarbeitet **personenbezogene Daten** (Name, Telefon, E-Mail,
Kennzeichen, FIN) im Sinne DSGVO Art. 4. Ein Prototyp-Projekt erfordert dennoch
konzeptionelle Klarheit:

| ID | Anforderung | Umsetzung Prototyp | Für Produktivbetrieb erforderlich |
|---|---|---|---|
| NF-DS-01 | Datenübertragung TLS 1.2+ | Firestore erzwingt TLS | ✅ bereits erfüllt |
| NF-DS-02 | Zugriffssteuerung | Offen (Prototyp, keine Auth) | Firebase Authentication + Firestore Security Rules mit Rollen-Modell (Prüfer / Leitung / Admin) |
| NF-DS-03 | Auftragsverarbeitungs-Vertrag DSGVO Art. 28 | Für Demo nicht relevant | AV-Vertrag mit Google Cloud (Firebase), EU-Region erzwingen |
| NF-DS-04 | Speicherdauer / Löschfristen | Keine | HU-Daten nach KFZ-Verordnung min. 2 Jahre aufbewahren, dann löschen |
| NF-DS-05 | Audit-Log | Keins | Wer hat wann welchen Status gesetzt? Zwingend für echte Prüfberichte |
| NF-DS-06 | Backup | Firebase-default | Regelmäßige Export-Backups nach GDPR Art. 32 |

Für die Abgabe im Prototyp-Scope werden NF-DS-02 bis NF-DS-06 als *Ausblick*
dokumentiert (s. Abschnitt 8) und sind nicht Teil des umzusetzenden Umfangs.

## 4. Systemarchitektur (Kurzfassung)

Details: siehe `docs/design.md`.

- **Frontend**: React 19 + Vite 8, TailwindCSS 4, Framer Motion
- **Desktop**: Tauri 2 mit Rust-Backend (bewusst gegen Electron gewählt: ~10×
  kleinere Binary, nativer Fenster-Prozess)
- **Datenhaltung**: Firebase Firestore mit Echtzeit-Sync via `onSnapshot`;
  LocalStorage als Offline-Fallback-Cache
- **Datenvisualisierung**: Recharts (Area/Bar/Pie), Lucide Icons
- **Tests**: Vitest + React Testing Library, jsdom, `@testing-library/jest-dom`

## 5. Datenmodell (Kurzfassung)

Details: siehe `docs/datenmodell.md`.

Drei Entitäten: `Fahrzeug` (1:N `Termin`), `Termin` (1:N `Mangel`). In der
Firestore-Umsetzung sind `Fahrzeug` und `Termin` Top-Level-Collections; `Mangel`
ist als eingebettetes Array innerhalb des Termin-Dokuments modelliert (und nicht
als eigene Collection). Begründung: Mängel sind immer im Kontext einer Prüfung,
haben keine eigene Existenz, werden stets zusammen gelesen/geschrieben → Nesting
ist Firestore-idiomatisch und spart Reads.

## 6. Qualitätsmaßnahmen

- **Statische Analyse**: ESLint 9 mit strict React-Config (prop-types, jsx-runtime, react-hooks)
- **Unit-Tests**: Vitest für alle Utility-Module und neuen Validatoren
- **Component-Tests**: React Testing Library für UI-Bausteine
- **Code Review**: Pull Request vor Merge, beide Teammitglieder reviewen
- **Testfall-Herleitung**: Äquivalenzklassen + Grenzwertanalyse (s. `testkonzept.md`)

## 7. Prozessmodell

Agiles Vorgehen nach Scrum-Light (kein eigener Scrum Master, keine formalen
Retros — 2-Personen-Team):

- **Sprint-Länge**: 2 Wochen (6 Sprints im Semester)
- **Artefakte**: Product Backlog, Sprint Backlog, Definition of Done (s. `backlog.md`)
- **Meetings**: Wöchentliches Sync (45 min), am Sprint-Ende Review mit Frau Fuchs
- **Werkzeuge**: GitHub Issues für Backlog, Pull Requests für Code-Review, GitHub Projects als Kanban-Board

## 8. Ausblick / Nicht im Scope dieser Abgabe

Die folgenden Erweiterungen wären für einen Produktivbetrieb zwingend, sprengen
aber den Rahmen einer studentischen Abgabe:

1. **Firebase Authentication** + Firestore Security Rules mit Rollen (Prüfer, Leitung, Admin) (s. NF-DS-02)
2. **PDF-Export** für rechtsverbindliche Prüfberichte (statt nur `.txt`)
3. **Foto-Dokumentation** von Mängeln über Firebase Storage; Referenzierung als URL-Feld am Mangel
4. **iCal-Export** der Terminliste für Kundenkalender
5. **KBA-Schnittstelle** zur automatischen Stammdaten-Vorbefüllung per Kennzeichen-Abfrage
6. **Audit-Trail** für alle Statusänderungen und Mängeländerungen (DSGVO-Konformität)
7. **Offline-First-Architektur** statt LocalStorage-Snapshot (Service Worker + IndexedDB)
8. **Migrationspfad RDBMS** (PostgreSQL), falls Reporting-Anforderungen wachsen — siehe Diskussion in `datenmodell.md` Abschnitt "NoSQL vs. RDBMS"

## 9. Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-04-15 | Erste Fassung zur Präsentation (nur in Präsi, nicht im Repo) |
| 1.1 | 2026-04-24 | Feedback Frau Fuchs eingearbeitet: Performance-Zahlen begründet, Lastprofil, Datenschutz/Sicherheit, Scope-Abgrenzung, Ausblick |
| 1.2 | 2026-04-27 | F-FZ-01 um Cascading-Dropdowns + Saison-Kennzeichen erweitert; NF-DI-02 um KBA-Kreis-Code-Liste; NF-DI-05 (Hersteller-Modell-Typ-Konsistenz, hart) und NF-DI-06 (FIN-Prüfziffer, weich) hinzugefügt |
| 1.3 | 2026-04-27 | §3.1 explizite Begründung 100 ms vs. 50/200 ms (Nielsen-Tabelle) + konkrete Test-Methode mit Referenzgerät — beantwortet die Rückfrage aus Fuchs-Mail vom 24.04. zu NF-PF-02 |
