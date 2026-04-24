# Entwurf Antwort-Mail an Frau Fuchs

**Zum Kopieren in Outlook/Mail. Die eingeklammerten Stellen ausfüllen.**

---

**Betreff:** Re: TÜV Prüfstelle Pro — Nachbesserungen und Terminvorschlag

Sehr geehrte Frau Fuchs,

vielen Dank für Ihr ausführliches und detailliertes Feedback — insbesondere die
konkreten Beispiele aus Ihren manuellen Tests haben uns sehr geholfen, die
Schwachstellen präzise zu adressieren. Wir haben noch vor unserem Treffen
begonnen, die Punkte systematisch umzusetzen, um Ihnen beim Termin einen
bearbeitbaren Stand zeigen zu können.

## Stand der Umarbeitung

**Dokumentation im Repository** (neu unter `docs/` im Projekt):

- `docs/pflichtenheft.md` — vollständige Fassung mit funktionalen und
  nicht-funktionalen Anforderungen, begründetem Lastprofil, messbaren
  Performance-Zielen, Datenschutz-/Sicherheitskonzept und Abgrenzung
- `docs/design.md` — Komponenten- und Klassendiagramm (Mermaid), Sequenz-
  diagramme zu Datenfluss und Mängelerfassung, Begründungen der
  Architektur-Entscheidungen
- `docs/datenmodell.md` — vollständige Attribut-Listen, Integritätsbedingungen
  (Entity-, Referenz-, Workflow-Integrität), Diskussion "NoSQL vs. RDBMS"
  mit SQL-Gegenentwurf inkl. Trigger für die Workflow-Regel
- `docs/backlog.md` — Product Backlog mit User Stories, Akzeptanzkriterien,
  Definition of Done, Sprint-Historie und aktuellem Fix-Sprint
- `docs/testkonzept.md` — Teststrategie, Herleitung der Testfälle über
  Äquivalenzklassen, Grenzwertanalyse und Entscheidungstabelle, explizite
  Regression-Tests zu jedem Ihrer Fundstücke

**Code-Fixes**:

1. **Eingabe-Validierung** — neues Modul `src/utils/validators.js`:
   - negativer Kilometerstand wird abgelehnt
   - Telefonnummer mit Buchstaben wird abgelehnt
   - ungültiges E-Mail-Format wird abgelehnt
   - doppelte Kennzeichen werden beim Anlegen abgefangen
   - Plausibilitäts-Hinweis bei Hersteller-Modell-Typ-Mismatch (z. B.
     "BMW Polo", "VW Golf als Motorrad") — als weiche Warnung, damit
     Oldtimer und Sonderfälle nicht blockiert werden
2. **Prüfergebnis-Workflow** — Regel "Bestanden nicht bei Hauptmangel / gefährlichem
   Mangel" (§ 29 StVZO) wird jetzt an **vier** Stellen konsequent durchgesetzt:
   - Button in der Mängelerfassung disabled
   - Dropdown im Terminformular gefiltert
   - Auto-Fortschritt schaltet bei vorhandenem Hauptmangel auf "Nicht bestanden"
   - Store-Guard lehnt auch programmatische Statuswechsel ab
3. **ESLint** — strengere Konfiguration:
   - `eslint-plugin-react` mit `recommended` + `jsx-runtime`
   - `react/prop-types` auf `error`
   - unused-vars-Exception für Großbuchstaben entfernt
   - Die drei von Ihnen gemeldeten unused imports (`Bell`, `STATUS`, `Legend`)
     sowie die `React`-Imports sind bereinigt
4. **PropTypes-Validierung** — wurden in allen Komponenten ergänzt (inkl.
   wiederverwendbaren Shapes in `src/types/propTypes.js`)
5. **Tests** — rund 50 neue Unit-Tests in `src/tests/utils/validators.test.js`;
   jeder Ihrer Fund-Fehler hat einen dedizierten Regression-Test

## Worauf wir im Termin gerne gezielt eingehen würden

- Ob die Begründung für Firestore im `datenmodell.md` § 6 für Sie nachvollziehbar
  ist, oder ob wir die Migration auf PostgreSQL noch im Semester starten sollten
- Ob die gewählten Performance-Zielwerte (100 ms Interaktion, 400 ms Firestore-Write)
  Ihren Vorstellungen entsprechen
- Ob Sie weitere Regressions-Fälle haben, die wir in die Validierung aufnehmen
  sollten

## Terminvorschlag

Wir haben am **[TAG 1], **[TAG 2]** und **[TAG 3]** zwischen **[UHRZEIT]** und
**[UHRZEIT]** Zeit — welcher Slot passt Ihnen am besten? Gerne auch in Ihrem
Büro oder per Zoom, ganz wie es Ihnen lieber ist.

Mit freundlichen Grüßen

Marwan Saleh & Oussama Hlayhel
Repository: github.com/maroxd3/tuv-workflow-web

---

## Tipps zum Ausfüllen der Platzhalter

- **TAG/UHRZEIT**: Schreib hier konkret rein, welche Tage und Zeitfenster bei dir *und* Oussama funktionieren. Drei Optionen lassen ihr beiden die Wahl, ohne dass es sich wie Ping-Pong anfühlt.
- Vor dem Absenden: Kurz mit Oussama abstimmen, welche Punkte er ergänzen würde — die Mail spricht im Namen von beiden.
- Gern die Dokumente-Links als tatsächliche GitHub-URLs einbauen, sobald die Änderungen gepusht sind:
  - `https://github.com/maroxd3/tuv-workflow-web/blob/main/docs/pflichtenheft.md`
  - `.../docs/design.md`
  - `.../docs/datenmodell.md`
  - `.../docs/backlog.md`
  - `.../docs/testkonzept.md`
