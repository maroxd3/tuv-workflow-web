# Quellen- und Literaturverzeichnis

> Verwendete Lehrbücher, Fachpublikationen, Online-Quellen, Standards
> und gesetzliche Grundlagen für das Projekt TÜV Prüfstelle Pro.
> Stand: 13.05.2026.

Dieses Verzeichnis ergänzt die in einzelnen Dokumenten genannten
Quellen-Sektionen (`datenmodell.md` § 8, ADRs jeweils unten, Sprint-Doku)
und führt alle Referenzen zentral zusammen.

Zitier-Konvention: **[Autor-Jahr]** im Fließtext, z. B. `[Codd-1970]`.

---

## 1. Datenbank-Theorie und Modellierung

### Standardwerke (Lehrbücher)

* **[Kemper-2015]** Alfons Kemper, André Eickler. *Datenbanksysteme:
  Eine Einführung.* 10. aktualisierte und erweiterte Auflage, De
  Gruyter Oldenbourg, München 2015. ISBN 978-3-11-044375-2.
  Verwendet für: Normalformen-Theorie (Kap. 6), ER-Modellierung
  (Kap. 2), SQL-DDL-Grundlagen (Kap. 4). Standard-Lehrbuch in der
  deutschen Hochschul-Datenbank-Ausbildung.

* **[Saake-Heuer-2018]** Gunter Saake, Kai-Uwe Sattler, Andreas Heuer.
  *Datenbanken — Konzepte und Sprachen.* 6. überarbeitete Auflage,
  mitp Professional, Frechen 2018. ISBN 978-3-95845-777-7.
  Verwendet für: relationale Algebra, Integritätsbedingungen,
  Transaktions-Konzepte. Komplementäre deutsche Standardreferenz.

* **[Date-2003]** C. J. Date. *An Introduction to Database Systems.*
  8th ed., Pearson / Addison-Wesley, Boston 2003. ISBN
  978-0-321-19784-9.
  Verwendet für: Normalformen-Definitionen (Kap. 12), relationale
  Theorie auf Englisch als Komplement zu Kemper.

### Originale Fachpublikationen

* **[Codd-1970]** Edgar F. Codd. *A Relational Model of Data for Large
  Shared Data Banks.* Communications of the ACM 13 (6), Juni 1970,
  S. 377–387. DOI: 10.1145/362384.362685.
  Verwendet für: Grundlegung des relationalen Modells, Begründung
  warum wir 3NF anstreben (ADR-002, datenmodell.md § 2.1).

* **[Codd-1972]** Edgar F. Codd. *Further Normalization of the Data
  Base Relational Model.* In: Randall J. Rustin (Hrsg.), *Data Base
  Systems*, Prentice-Hall, Englewood Cliffs 1972, S. 33–64.
  Verwendet für: formale Definitionen 1NF/2NF/3NF.

* **[Chen-1976]** Peter Pin-Shan Chen. *The Entity-Relationship
  Model — Toward a Unified View of Data.* ACM Transactions on
  Database Systems 1 (1), März 1976, S. 9–36. DOI:
  10.1145/320434.320440.
  Verwendet für: ER-Diagramm-Notation, Entität/Beziehung/Attribut-
  Konzepte (datenmodell.md § 1).

### Standards

* **[ISO-9075-2016]** ISO/IEC 9075-1:2016. *Information technology —
  Database languages — SQL — Part 1: Framework.* International
  Organization for Standardization, Genf 2016.
  Verwendet für: Bestätigung dass `CREATE ASSERTION` und Subqueries
  in CHECK-Constraints im SQL-Standard definiert sind, aber von
  produktiven DBMS nicht implementiert werden (ADR-003).

* **[ANSI-SPARC-1975]** ANSI/X3/SPARC Study Group on Database
  Management Systems. *Interim Report.* FDT (Bulletin of ACM SIGMOD)
  7 (2), 1975.
  Verwendet für: Drei-Schichten-Architektur (konzeptuell, logisch,
  physisch), Strukturierung von `datenmodell.md`.

### PostgreSQL und Tooling

* **[PostgreSQL-Docs]** *PostgreSQL 16 Documentation.* The PostgreSQL
  Global Development Group, 2024. https://www.postgresql.org/docs/16/
  Verwendet für: DDL-Syntax, Constraint-Optionen, partielle Indizes,
  Stored Procedures (PL/pgSQL), Views.

* **[PGlite-Docs]** *PGlite Documentation.* ElectricSQL,
  laufend aktualisiert. https://pglite.dev/
  Verwendet für: WASM-Setup, IndexedDB-Persistenz, Browser-Integration
  (ADR-001).

* **[Drizzle-Docs]** *Drizzle ORM Documentation.* Drizzle Team,
  laufend aktualisiert. https://orm.drizzle.team/docs
  Verwendet für: Schema-Definition, Relations-API, Migrations-Workflow
  (ADR-004).

---

## 2. Software-Engineering und Architektur

### Patterns und Architektur

* **[Fowler-2003]** Martin Fowler. *Patterns of Enterprise Application
  Architecture.* Addison-Wesley, Boston 2003. ISBN 978-0-321-12742-6.
  Verwendet für: Repository-Pattern (Kap. 14), Data-Mapper-Pattern,
  Service-Layer (ADR-007).

* **[Evans-2003]** Eric Evans. *Domain-Driven Design: Tackling
  Complexity in the Heart of Software.* Addison-Wesley, Boston 2003.
  ISBN 978-0-321-12521-7.
  Verwendet für: Repository-Konzept (Kap. 6), Ubiquitous Language
  (für die deutschen Domänen-Begriffe Halter, Termin, Mangel statt
  englischer Übersetzungen).

* **[Martin-2017]** Robert C. Martin. *Clean Architecture: A
  Craftsman's Guide to Software Structure and Design.* Prentice Hall,
  Upper Saddle River 2017. ISBN 978-0-13-449416-6.
  Verwendet für: Trennung von Domänen-Logik (queries.ts) und
  UI-Schicht (Views).

* **[Nygard-2011]** Michael Nygard. *Documenting Architecture
  Decisions.* Blog-Post bei Cognitect, 15.11.2011.
  https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
  Verwendet für: ADR-Konzept und -Aufbau (`docs/decisions/`).

* **[MADR-2024]** *MADR — Markdown Architectural Decision Records.*
  Version 4.0.0, 2024. https://adr.github.io/madr/
  Verwendet für: konkrete Vorlage für ADRs (Status, Datum,
  Entscheider, Optionen, Konsequenzen).

### Testing

* **[Beck-2002]** Kent Beck. *Test-Driven Development By Example.*
  Addison-Wesley, Boston 2002. ISBN 978-0-321-14653-3.
  Verwendet für: Konzept Test-First, Red-Green-Refactor-Zyklus.

* **[Vitest-Docs]** *Vitest — A Vite-native Testing Framework.*
  Vitest Team, laufend aktualisiert. https://vitest.dev/
  Verwendet für: Test-Runner-Konfiguration, Coverage-Setup.

### Clean Code

* **[Martin-2008]** Robert C. Martin. *Clean Code: A Handbook of Agile
  Software Craftsmanship.* Prentice Hall, Upper Saddle River 2008.
  ISBN 978-0-13-235088-4.
  Verwendet für: Namens-Konventionen, Funktions-Größe, Kommentare.

---

## 3. Agiles Projektmanagement und Scrum

* **[Schwaber-Sutherland-2020]** Ken Schwaber, Jeff Sutherland.
  *The 2020 Scrum Guide.* Scrum.org, November 2020.
  https://scrumguides.org/scrum-guide.html
  Verwendet für: Definition von Done auf Increment-Ebene,
  Sprint-Backlog, Rollen.

* **[Cohn-2004]** Mike Cohn. *User Stories Applied: For Agile Software
  Development.* Addison-Wesley, Boston 2004. ISBN 978-0-321-20568-1.
  Verwendet für: Story-Struktur (Als …, möchte ich …, damit …),
  Akzeptanz-Kriterien (`docs/sprint_*.md`).

* **[Cohn-2005]** Mike Cohn. *Agile Estimating and Planning.* Prentice
  Hall, Upper Saddle River 2005. ISBN 978-0-13-147941-8.
  Verwendet für: Story-Points, Planning Poker als
  Schätz-Methode.

---

## 4. Web-Technologien und Frameworks

* **[React-Docs]** *React Documentation.* Meta Platforms, laufend
  aktualisiert. https://react.dev/
  Verwendet für: Hooks-API als Standard (React 16.8+, 2019),
  Component-Komposition, State-Management. Hooks werden seit
  React 18 ausdrücklich gegenüber Class-Components empfohlen.

* **[Vite-Docs]** *Vite — Next Generation Frontend Tooling.* Vite
  Team. https://vitejs.dev/
  Verwendet für: Build-Konfiguration, Hot-Module-Replacement,
  Bundle-Optimierung.

* **[TypeScript-Docs]** *TypeScript Documentation.* Microsoft, laufend
  aktualisiert. https://www.typescriptlang.org/docs/
  Verwendet für: strict-mode-Konfiguration, Type-Inferenz, JSX-Setup
  (`tsconfig.json`).

* **[Tailwind-Docs]** *Tailwind CSS Documentation.* Tailwind Labs.
  https://tailwindcss.com/docs
  Verwendet für: Utility-First-CSS, Responsive-Design-Klassen.

* **[MDN]** *MDN Web Docs.* Mozilla Foundation, laufend aktualisiert.
  https://developer.mozilla.org/
  Verwendet für: Web-Plattform-APIs (IndexedDB, Service Worker, Fetch,
  Date-Handling).

---

## 5. Rechtliche und domänen-spezifische Grundlagen

### Gesetze und Verordnungen

* **[StVZO-§29]** Bundesministerium für Verkehr und digitale
  Infrastruktur. *Straßenverkehrs-Zulassungs-Ordnung (StVZO),
  § 29 Untersuchung der Fahrzeuge mit Anlage VIII (Untersuchung der
  Fahrzeuge nach § 29 Absatz 1).* Bundesanzeiger, aktuelle Fassung.
  https://www.gesetze-im-internet.de/stvzo_2012/__29.html
  Verwendet für: Rechtsgrundlage der HU/AU, Mängel-Klassifikation
  HM/GM/LM/AM, Bestanden/Nicht-Bestanden-Logik (WF-01, ADR-003).

* **[FZV]** *Fahrzeug-Zulassungsverordnung (FZV).* Bundesanzeiger,
  aktuelle Fassung.
  https://www.gesetze-im-internet.de/fzv_2023/
  Verwendet für: Kennzeichen-Format (§ 8), Fahrzeug-Identifikation
  (FIN nach § 6).

* **[FZV-§8]** *FZV § 8 Kennzeichen.* Insbesondere Anlage 4 zu
  Kennzeichen-Format. Verwendet für: `validateKennzeichen()`-Regeln.

### TÜV-spezifische Richtlinien

* **[VdTÜV-916]** Verband der TÜV e. V. *VdTÜV-Merkblatt 916 —
  Klassifizierung der bei der Hauptuntersuchung erkennbaren Mängel
  am Kraftfahrzeug nach § 29 StVZO.* Aktuelle Fassung.
  Verwendet für: präzise Mangel-Klassifikation (HM, GM, LM, AM),
  Begriffs-Definition Hauptmangel.

* **[HU-Richtlinie]** Bundesministerium für Verkehr (BMVI).
  *Richtlinie für die Durchführung der Hauptuntersuchung (HU-RL).*
  Aktuelle Fassung. https://www.bmvi.de
  Verwendet für: Ablauf-Schritte einer Hauptuntersuchung,
  Mängel-Bewertungs-Kriterien.

* **[AU-Richtlinie]** Bundesministerium für Verkehr (BMVI).
  *Richtlinie für die Abgasuntersuchung (AU-RL).* Aktuelle Fassung.
  Verwendet für: Abgrenzung AU vs. HU+AU-Kombi-Termin (PRUEFART-
  Tabelle).

### Branchen-Wissen

* **[Saleh-Mustafa]** Mustafa Saleh (Kfz-Sachverständiger, Inhaber
  Saleh Gutachten Hannover). *Persönliche Gespräche und
  Werkstatt-Beobachtungen.* Hannover, Februar–Mai 2026.
  Verwendet für: praktische Validierung des Workflow-Modells, reale
  Mangel-Typen aus 20 Jahren Werkstatt-Praxis, Kommunikation mit
  Haltern.

* **[Saleh-Marwan]** Marwan Saleh. *Ausbildungs-Unterlagen
  Kfz-Sachverständiger.* TÜV/DEKRA-Schulungsmaterial, Hannover 2025-
  2026.
  Verwendet für: prüfungs-relevante Mangel-Klassifikation, formale
  Befundungs-Sprache.

---

## 6. Architektur-Konzepte (klassische Referenzen)

* **[GOF-1994]** Erich Gamma, Richard Helm, Ralph Johnson, John
  Vlissides. *Design Patterns: Elements of Reusable Object-Oriented
  Software.* Addison-Wesley, Boston 1994. ISBN 978-0-201-63361-0.
  Verwendet für: Adapter-Pattern (`useStoreCompat.ts`), Singleton
  (`db/client.ts`).

* **[Hohpe-Woolf-2003]** Gregor Hohpe, Bobby Woolf. *Enterprise
  Integration Patterns.* Addison-Wesley, Boston 2003. ISBN
  978-0-321-20068-6.
  Verwendet für: Konzept Anti-Corruption-Layer (entspricht
  unserem Compat-Layer).

---

## 7. KI-Werkzeuge (Methodik, nicht inhaltliche Quellen)

KI-Werkzeuge wurden als Hilfsmittel eingesetzt, **nicht** als inhaltliche
Quelle für Domänen-Wissen oder Architektur-Entscheidungen. Details
siehe `docs/ki-nutzung.md`. Hier nur die Versions-Information:

* **[Anthropic-Claude]** Anthropic Inc. *Claude.ai — Claude Sonnet
  4.5, Opus 4.6 und 4.7.* San Francisco, April–Mai 2026.
  https://www.anthropic.com/

* **[OpenAI-GPT]** OpenAI Inc. *ChatGPT — GPT-4 und GPT-4o.* San
  Francisco, April–Mai 2026. https://openai.com/

* **[GitHub-Copilot]** GitHub Inc., OpenAI. *GitHub Copilot for
  VS Code.* Microsoft, laufend aktualisiert.
  https://github.com/features/copilot

---

## 8. Wie wir zitiert haben

* **Im Fließtext:** [Autor-Jahr] hinter der Aussage, z. B. „die
  3. Normalform verlangt … [Codd-1972]".
* **In ADRs:** unten unter „Quellen" der konkrete Eintrag mit
  Sektions-Verweis wo möglich.
* **In `datenmodell.md`:** § 8 listet alle DB-Theorie-Quellen
  zusammengefasst.
* **Online-Quellen:** mit Stichtag-URL, falls möglich. Bei
  permanenten Dokumentations-Seiten (z. B. PGlite-Doku) ohne
  Stichtag, da laufend aktualisiert.

---

## 9. Was bewusst NICHT als Quelle verwendet wurde

Um Transparenz zu wahren:

* **Stack-Overflow-Antworten** — als Inspiration für Code-Snippets ja,
  aber keine Übernahme ohne eigenes Verständnis und Test. Nicht
  als Primär-Quelle für Theorie zitiert.
* **Reddit/Hackernews-Diskussionen** — anekdotisch hilfreich für
  Tool-Wahl, aber keine wissenschaftliche Grundlage.
* **Kommerzielle Marketing-Seiten** — explizit ausgeschlossen
  (z. B. Anbieter-Vergleichs-Charts).
* **Wikipedia** — als Einstiegs-Recherche genutzt, aber jede
  übernommene Aussage gegen eine Primär-Quelle abgeglichen
  (Kemper, Codd, MDN).

— Marwan Saleh, Oussama Hlayhel · 13.05.2026
