# Product Backlog + Sprint Planning — TÜV Prüfstelle Pro

**Team:** Marwan Saleh (MS) · Oussama Hlayhel (OH)
**Sprint-Länge:** 2 Wochen
**Semester:** SoSe 2026

---

## Definition of Done (team-übergreifend)

Eine User Story gilt als **Done**, wenn **alle** folgenden Punkte erfüllt sind:

1. ✅ Alle Akzeptanzkriterien der Story erfüllt
2. ✅ Code in Feature-Branch, Pull Request erstellt
3. ✅ Mindestens 1 Reviewer hat approved
4. ✅ `npm run lint` — 0 Errors
5. ✅ `npm run test` — alle Tests grün
6. ✅ Neue Utility-Funktion / Business-Regel = neue Vitest-Tests (Äquivalenzklassen + Grenzwerte)
7. ✅ Keine hartkodierten Strings in Komponenten — an zentrale Konstanten-Module
8. ✅ PropTypes-Validation für neue Komponenten
9. ✅ Merge in `main` per Squash-Merge
10. ✅ Manueller Smoke-Test im Browser und im Tauri-Desktop-Build

---

## Product Backlog

Stories sind nach **MoSCoW** priorisiert (**M**ust / **S**hould / **C**ould /
**W**on't) und mit einer groben Schätzung in **Story Points** (Fibonacci) versehen.

### Epic 1 — Fahrzeugverwaltung

| ID | Story | Prio | SP | Status |
|---|---|---|---|---|
| US-01 | Als Prüfer möchte ich ein neues Fahrzeug mit Kennzeichen, Halterdaten und technischen Daten anlegen können, damit ich es für Prüftermine referenzieren kann | M | 5 | ✅ Done (Sprint 2) |
| US-02 | Als Prüfer möchte ich ein bestehendes Fahrzeug bearbeiten können, um Fehler oder geänderte Daten zu korrigieren | M | 2 | ✅ Done (Sprint 2) |
| US-03 | Als Prüfer möchte ich ein Fahrzeug löschen können (mit Bestätigungsdialog), um veraltete Einträge zu entfernen | M | 2 | ✅ Done (Sprint 2) |
| US-04 | Als Prüfer möchte ich Fahrzeuge nach Kennzeichen/FIN/Halter/Hersteller durchsuchen und nach Typ filtern können | M | 3 | ✅ Done (Sprint 2) |
| US-05 | Als Prüfstellenleiter möchte ich die HU-Fälligkeit farbcodiert sehen (überfällig/< 30 d/< 90 d), um rechtzeitig zu planen | S | 3 | ✅ Done (Sprint 2) |
| US-06 | Als Prüfer möchte ich beim Anlegen daran gehindert werden, unplausible Hersteller-Modell-Typ-Kombinationen einzugeben (z. B. "BMW Polo", "VW Golf als Motorrad") — Hersteller/Modell/Typ als abhängige Dropdowns, "Sonstiger"-Modus für Oldtimer/Importe | M | 8 | ✅ **Done (Sprint 5 — Fix-Sprint, 2026-04-27)** |
| US-07 | Als Prüfer möchte ich, dass das System ungültige Eingaben (negativer KM, Buchstaben in Telefon, kaputte Email) aktiv ablehnt | M | 5 | ✅ **Done (Sprint 5 — Fix-Sprint)** |
| US-08 | Als Prüfer möchte ich Kennzeichen mit gültigem KBA-Kreis-Code (~430 Codes) sowie Saison-Kennzeichen (`B-TK 1234 04-10`) anlegen können — Live-Großschreibung, Autocomplete der Kreis-Codes | M | 5 | ✅ **Done (Sprint 5 — Fix-Sprint, 2026-04-27)** |
| US-09 | Als Prüfer möchte ich beim Eintippen einer FIN einen Hinweis bekommen, wenn die ISO-3779-Prüfziffer (Position 9) nicht stimmt — als weicher Warnhinweis, weil pre-1981/Nicht-NA-Fahrzeuge keine Prüfziffer tragen | S | 3 | ✅ **Done (Sprint 5 — Fix-Sprint, 2026-04-27)** |
| US-10b | Als Prüfer möchte ich, dass die App auch bei langsamer Firestore-Antwort nicht in "Daten werden geladen…" hängenbleibt — 3-s-Fallback auf Cache/Seed | S | 2 | ✅ **Done (Sprint 5 — Fix-Sprint, 2026-04-27)** |

### Epic 2 — Terminverwaltung

| ID | Story | Prio | SP | Status |
|---|---|---|---|---|
| US-10 | Als Prüfer möchte ich Termine per Rechtsklick auf einen Zeitslot anlegen, um keinen Umweg übers Formular zu brauchen | M | 5 | ✅ Done (Sprint 3) |
| US-11 | Als Prüfer möchte ich den Tagesplan als Timeline oder Tabelle sehen können, je nach Präferenz | S | 3 | ✅ Done (Sprint 3) |
| US-12 | Als Prüfer möchte ich den Terminstatus per Button schnell "Starten/Fertig" schalten können, ohne das Formular zu öffnen | S | 2 | ✅ Done (Sprint 3) |
| US-13 | Als Prüfer möchte ich im Tagesplan per Rechtsklick-Kontextmenü direkt Mängel erfassen, bearbeiten oder löschen können | S | 3 | ✅ Done (Sprint 3) |
| US-14 | Als Prüfer möchte ich zwischen Tagen per Wochen-Navigator wechseln können, um bevorstehende Termine zu planen | C | 2 | ✅ Done (Sprint 3) |

### Epic 3 — Mängelerfassung

| ID | Story | Prio | SP | Status |
|---|---|---|---|---|
| US-20 | Als Prüfer möchte ich Mängel aus einem StVZO-Katalog auswählen, um die Erfassung zu beschleunigen und gesetzeskonforme Codes zu verwenden | M | 8 | ✅ Done (Sprint 4) |
| US-21 | Als Prüfer möchte ich Mängel als Freitext erfassen können, um Sonderfälle zu dokumentieren | S | 2 | ✅ Done (Sprint 4) |
| US-22 | Als Prüfer möchte ich die Mängel eines Termins jederzeit sehen und löschen können | M | 2 | ✅ Done (Sprint 4) |
| US-23 | Als Prüfer möchte ich, dass das System mich daran hindert, eine Prüfung mit Hauptmangel/gefährlichem Mangel auf "Bestanden" zu setzen, weil das nach § 29 StVZO nicht zulässig ist | M | 3 | ✅ **Done (Sprint 5 — Fix-Sprint)** |

### Epic 4 — Berichte

| ID | Story | Prio | SP | Status |
|---|---|---|---|---|
| US-30 | Als Prüfstellenleiter möchte ich eine Liste aller Berichte mit Filtern (Status, Hauptmängel, Datum) sehen | M | 3 | ✅ Done (Sprint 4) |
| US-31 | Als Prüfer möchte ich den Prüfbericht in einer Vorschau sehen, bevor ich ihn herunterlade | M | 3 | ✅ Done (Sprint 4) |
| US-32 | Als Prüfer möchte ich den Prüfbericht als Textdatei exportieren können | M | 3 | ✅ Done (Sprint 4) |
| US-33 | Als Prüfstellenleiter möchte ich Berichte als PDF statt `.txt` exportieren, um ein rechtsverbindliches Dokument zu haben | S | 8 | ⏳ Im Backlog (Sprint 7+) |

### Epic 5 — Statistik

| ID | Story | Prio | SP | Status |
|---|---|---|---|---|
| US-40 | Als Prüfstellenleiter möchte ich die Bestehensquote als Trend über die Zeit sehen | M | 5 | ✅ Done (Sprint 4) |
| US-41 | Als Prüfstellenleiter möchte ich die Leistung einzelner Prüfer vergleichen können | S | 3 | ✅ Done (Sprint 4) |
| US-42 | Als Prüfstellenleiter möchte ich Mängel-Häufigkeit nach Kategorie und Top-Codes sehen | S | 3 | ✅ Done (Sprint 4) |
| US-43 | Als Prüfstellenleiter möchte ich den Auswertungszeitraum auf 7/30/90/365 Tage einstellen können | C | 2 | ✅ Done (Sprint 4) |

### Epic 6 — Qualität / nicht-funktional

| ID | Story | Prio | SP | Status |
|---|---|---|---|---|
| US-50 | Als Team möchten wir ESLint ohne Errors lauffähig haben (inkl. strenger Config), um Codequalität objektiv messbar zu machen | M | 5 | ✅ **Done (Sprint 5 — Fix-Sprint)** |
| US-51 | Als Team möchten wir PropTypes-Validation für alle React-Komponenten, um Schnittstellen dokumentiert und prüfbar zu halten | M | 5 | ✅ **Done (Sprint 5 — Fix-Sprint)** |
| US-52 | Als Team möchten wir ein vollständiges Pflichtenheft, UML-Doku, Datenmodell- und Test-Konzept-Dokumente im Repo, um die Anforderungen der Abgabe zu erfüllen | M | 8 | ✅ **Done (Sprint 5 — Fix-Sprint)** |
| US-53 | Als Team möchten wir die NFA "Performance" mit messbaren Zahlen und Lastprofil begründen | M | 3 | ✅ **Done (Sprint 5 — Fix-Sprint)** |
| US-54 | Als Team möchten wir die NoSQL-vs-RDBMS-Entscheidung kritisch dokumentieren | M | 3 | ✅ **Done (Sprint 5 — Fix-Sprint)** |
| US-55 | Als Prüfer möchte ich den Prüfbericht als professionell aussehendes A4-PDF exportieren können (statt .txt), um ihn dem Halter aushändigen oder per Mail versenden zu können | M | 5 | ✅ **Done (Sprint 5 — Fix-Sprint)** |
| US-56 | Als Nutzer möchte ich die App auch auf dem Smartphone und Tablet bedienen können (responsives Layout, Touch-Targets, Sidebar als Overlay), um auch unterwegs Termine zu prüfen oder Berichte einzusehen | S | 8 | ✅ **Done (Sprint 5 — Fix-Sprint)** |

### Epic 7 — Ausblick / nicht im Scope der aktuellen Abgabe

| ID | Story | Prio | SP | Status |
|---|---|---|---|---|
| US-60 | Als Admin möchte ich mich einloggen und Nutzerrollen verwalten können (Prüfer, Leitung, Admin), um unauthorisierten Zugriff zu verhindern | C | 13 | 🔵 Backlog |
| US-61 | Als Admin möchte ich Firestore Security Rules einrichten, damit Nutzer nur ihre eigenen Daten sehen | C | 5 | 🔵 Backlog |
| US-62 | Als Prüfer möchte ich Fotos zu Mängeln anhängen, um die Dokumentation zu verbessern | C | 8 | 🔵 Backlog |
| US-63 | Als Prüfstellenleiter möchte ich Termine in mein Kalendersystem (iCal) exportieren | C | 3 | 🔵 Backlog |
| US-64 | Als Prüfer möchte ich das Kennzeichen ins System eingeben und die Fahrzeugdaten per KBA-Abfrage vorbefüllt bekommen | W | 13 | 🔵 Backlog (externe Schnittstelle, rechtlich aufwendig) |
| US-65 | Als Prüfstellenleiter möchte ich einen Audit-Trail aller Statusänderungen und Mängel-Änderungen haben (wer, was, wann), um DSGVO-konform zu arbeiten | W | 8 | 🔵 Backlog |
| US-66 | Als Team möchten wir das System auf PostgreSQL + tRPC/Supabase migrieren, um die Diskussion im `datenmodell.md` praktisch umzusetzen | W | 21 | 🔵 Backlog (große Umstellung, nur bei Produktivbedarf) |

---

## Sprint-Historie

### Sprint 1 (W1–2) — Anforderungsanalyse & Projekt-Setup

**Ziel:** Pflichtenheft v1, Technologiestack entscheiden, Repo + Tauri-Shell.

- Vite+React-Gerüst initialisiert
- Tauri 2 angebunden
- Tailwind 4 + Theme-Modul aufgesetzt
- Firebase-Projekt registriert, Firestore aktiviert

### Sprint 2 (W3–4) — Epic 1: Fahrzeugverwaltung

**Committed:** US-01, US-02, US-03, US-04, US-05
**Velocity:** 15 SP
**Abgeschlossen:** alle ✅
**Retro-Notizen:** Inline-Style-Ansatz schneller als erwartet; Framer-Motion-
Setup hat einen halben Tag gekostet.

### Sprint 3 (W5–6) — Epic 2: Terminverwaltung

**Committed:** US-10, US-11, US-12, US-13, US-14
**Velocity:** 15 SP
**Abgeschlossen:** alle ✅
**Retro-Notizen:** Context-Menu war eine Lernkurve; Ref-basierte
Click-Outside-Erkennung sauber gelöst.

### Sprint 4 (W7–9) — Epics 3–5: Mängel, Berichte, Statistik

**Committed:** US-20, US-21, US-22, US-30, US-31, US-32, US-40, US-41, US-42, US-43
**Velocity:** 37 SP (Sprint war länger, da Präsentation vorbereitet wurde)
**Abgeschlossen:** alle ✅
**Retro-Notizen:** Recharts-Custom-Tooltips haben Zeit gekostet; Statistik-View
ist die größte Komponente geworden (339 LOC) — ggf. extrahieren.

### Sprint 5 (W10–12) — FIX-SPRINT nach Feedback Fuchs (2026-04-24)

**Committed:** US-06, US-07, US-08, US-09, US-10b, US-23, US-50, US-51, US-52, US-53, US-54, US-55, US-56
**Velocity-Plan:** 63 SP (erweitert mehrfach im Verlauf des Sprints — finale Bilanz)
**Fokus:** Feedback der Dozentin restlos adressieren plus UX-Verschärfung über das Feedback hinaus, bevor finale Abgabe.

**Zwischenstand (Stand 2026-04-27):**

- ✅ US-06 (Hersteller/Modell-Plausibilität) — Soft-Warnung am 24.04. ausgeliefert; nach interner UX-Review 27.04. auf **harte Validierung + cascading dropdowns** umgebaut. `validators.validateHerstellerModellKonsistenz` + Sonstiger-Modus für Sonderfälle.
- ✅ US-07 (Harte Validierung) — `validators.validateFahrzeug` mit allen Einzelprüfungen
- ✅ US-08 (KBA-Kreis-Code + Saison) — neue `kfzKreis.js` mit ~430 Codes, Regex erweitert um `MM-MM`-Suffix, Live-Großschreibung in der UI, Autocomplete via `<datalist>`
- ✅ US-09 (FIN-Prüfziffer ISO-3779) — `checkFinPruefziffer` (weich), Validator-Algorithmus auf 17 Zeichen, Position 9
- ✅ US-10b (Loading-Fallback) — `useStore.js` hydratiert nach 3 s aus localStorage / Seed, falls `onSnapshot` nicht antwortet
- ✅ US-23 (Workflow-Bug) — 4 Durchsetzungsstellen für Regel WF-01
- ✅ US-50 (ESLint sauber) — neue Config, 3 unused imports entfernt
- ✅ US-51 (PropTypes überall) — 22 Komponenten, 4 shared shapes
- ✅ US-52 (Doku) — Pflichtenheft, Design, Datenmodell, Backlog (dieses Doc), Test-Konzept
- ✅ US-53 (NFA-Begründung) — siehe `pflichtenheft.md` §3.1
- ✅ US-54 (DB-Diskussion) — siehe `datenmodell.md` §6
- ✅ Operativ — separate Firebase-Hosting-Site `tuv-workflow.web.app` für die TÜV-App (vorher Konflikt mit gotakt-Landing auf `tuv-prufstelle-pro.web.app`)
- ✅ US-55 (Bericht als PDF) — `BerichteView.buildBerichtHtml` erzeugt A4-Layout mit Siegel-Logo, Berichts-Nummer im KBA-Format `TPP-NDS-2026-XXXXXXX`, römisch nummerierten Sektionen, Mängel-Tabelle, Unterschriftsfeldern, Rechtshinweis nach § 29 StVZO; Druck via `window.print()` ohne externe Library
- ✅ US-56 (Mobile-Support) — viewport-fit=cover, useIsMobile-Hook, Sidebar als Overlay mit Backdrop, Hamburger-Menu in Topbar, .grid-resp-2/4/5 + .full-mobile + .pad-mobile + .card-mobile + .btn-icon Klassen, Cascading-Dropdowns, Klick statt Rechtsklick auf Tagesplan-Slots, alle Modals 1-Spalten-Form, Touch-Targets ≥ 36 px

**Acceptance-Test vor Abgabe:**
- Alle Beispiele aus der Mail Fuchs (24.04.2026) manuell durchgehen
- ESLint-Lauf mit den Regeln der Dozentin muss 0 Errors melden
- Demo-Lauf: ein kompletter "Termin anlegen → Prüfung starten → Mängel
  erfassen → Bericht generieren" Pfad

### Sprint 6 (W13+) — Doku-Polish & Abgabe

**Geplant:**
- Letzten Feinschliff Doku (Grammatik, Screenshots)
- README mit Quickstart ergänzen
- Video-Demo erstellen (5 min)
- Abgabe

### Sprint 7+ (Ausblick) — siehe Epic 7

Nicht mehr im Semester-Scope. Für eine mögliche Fortführung (Bachelor-Arbeit /
Praktikum) notiert.

---

## Velocity-Übersicht

| Sprint | Geplant | Geliefert | Notizen |
|---|---|---|---|
| 1 | — | — | Setup-Sprint, keine Stories |
| 2 | 15 | 15 | |
| 3 | 15 | 15 | |
| 4 | 37 | 37 | Länger (3 Wochen) |
| 5 | 63 | 63 | Fix-Sprint + UX-Verschärfung über Feedback hinaus (Stand 2026-04-27 abgeschlossen — US-06/08/09/10b/55/56) |
| 6 | ~10 | — | Feinschliff |

---

## Risiken & Mitigation

| Risiko | Auswirkung | Mitigation |
|---|---|---|
| Firestore-Kosten bei Dauer-Subscription | Laufzeitkosten | Free-Tier reicht für Prototyp; Migration zu SQL dokumentiert (US-66) |
| Teammitglied krank zur finalen Abgabe | Verzögerung | Paarprogrammierung; alle Stories am Ende von beiden reviewt |
| ESLint-Config der Dozentin hat andere Regeln als unsere | Re-Work nötig | Wir haben `recommended`-Set von `eslint-plugin-react` aufgenommen, was die üblichen Regeln abdeckt |
| Tauri-Build bricht plattformspezifisch | Desktop-App unbrauchbar | Regelmäßige Builds auf beiden Rechnern (Win + macOS) |
