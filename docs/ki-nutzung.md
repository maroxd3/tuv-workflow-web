# KI-Nutzung im Projekt TÜV Prüfstelle Pro

> **Zweck:** Dieses Dokument macht transparent, **wo, wofür und in welcher
> Form** Künstliche-Intelligenz-Werkzeuge im Verlauf dieses Projekts
> eingesetzt wurden. Es ergänzt die formale **KI-Nutzungserklärung**
> (`docs/ki-nutzungserklaerung.pdf`), geht aber inhaltlich tiefer und
> dokumentiert konkrete Prompts, Validierungs-Strategien und die klare
> Trennung zwischen KI-Beitrag und Eigenleistung.

* **Stand:** 13.05.2026
* **Verantwortlich:** Marwan Saleh (Domänen-Experte, Lead), Oussama Hlayhel
* **Anlass:** Frau Fuchs hat im Feedback-Gespräch am 13.05.2026
  ausdrücklich gefordert, die Prompt-Nutzung zu dokumentieren.

---

## 1. Verwendete KI-Werkzeuge

| Werkzeug | Anbieter | Hauptzweck | Lizenz / Plan |
|---|---|---|---|
| Claude (Sonnet 4.5, Opus 4.6/4.7) | Anthropic | Code-Generierung, Refactoring, Dokumentation, Diskussion | Claude Pro |
| ChatGPT (GPT-4, GPT-4o) | OpenAI | Konzept-Diskussion, Alternativen-Recherche | ChatGPT Plus |
| GitHub Copilot | GitHub/OpenAI | Inline-Autovervollständigung in der IDE | Pro |

Alle drei Werkzeuge erzeugen Output auf Basis trainierter Sprach-Modelle —
keines davon hat **Zugriff** auf eine TÜV-spezifische Wissensdatenbank.
Domänen-spezifisches Wissen (§ 29 StVZO, VdTÜV-Empfehlungen, praktische
Werkstatt-Abläufe) stammt vollständig vom Studierenden-Team.

---

## 2. Einsatzbereiche im Projekt

Dieser Abschnitt listet **alle relevanten Bereiche** in denen KI eingesetzt
wurde, jeweils mit (a) typischem Prompt-Muster, (b) Validierungs-Schritt,
und (c) wie der finale Code entstand.

### 2.1 Komponenten-Generierung (React)

**Beispiel-Prompt:**
> „Schreibe eine React-Komponente `TerminModal`, die ein Formular für
> Datum, Uhrzeit, Prüfart, Prüfer und Status enthält. Validierung über
> `validateTermin()`. Werte werden über Props `initialValues` befüllt
> und über `onSave(form)` zurückgegeben. Verwende Tailwind für Styling
> und unsere bestehenden Konstanten aus `src/constants/`."

**Validierungs-Schritt:**
1. Generierter Code in Branch eingefügt.
2. Manuell durchgelesen: Imports korrekt? Konstanten echt vorhanden?
3. Browser-Smoke-Test: Modal öffnen, Werte eingeben, speichern.
4. Vitest-Test geschrieben (siehe 2.4).

**Eigenleistung:** Spezifikation der Felder, Pflicht-Felder, der
Validierungs-Regeln und der Konstanten-Module — alle diese Entscheidungen
kommen aus der Domänen-Analyse (welche Werte erwartet eine TÜV-Prüfstelle?)
und nicht vom Modell.

### 2.2 Datenbank-Schema (Drizzle)

**Beispiel-Prompt:**
> „Konvertiere folgendes ER-Modell (HALTER 1—N FAHRZEUG, FAHRZEUG 1—N
> TERMIN, TERMIN 1—N MANGEL) in ein Drizzle-Schema für PostgreSQL. FK
> mit ON DELETE CASCADE für TERMIN→FAHRZEUG, ON DELETE RESTRICT für
> FAHRZEUG→HALTER (Halter darf nicht gelöscht werden solange Fahrzeuge
> existieren). Kennzeichen UNIQUE, FIN UNIQUE-aber-NULL-erlaubt."

**Validierungs-Schritt:**
1. Generiertes Schema gegen `docs/datenmodell.md` § 2.2 (Relationenschema)
   abgeglichen — passen alle Spalten, Typen, Constraints?
2. `drizzle-kit generate` ausgeführt → SQL-Migrations-File erzeugt
3. SQL gelesen, geprüft: stimmen CHECK-Constraints? Sind partielle Indizes korrekt?
4. PGlite-Test (`db.test.ts`) mit 12 Cases geschrieben — alle grün.

**Eigenleistung:** Das ER-Modell (welche Entitäten, welche Beziehungen,
welche Kardinalitäten) ist Domänen-Analyse durch das Team. Die Wahl
der Constraint-Semantik (CASCADE vs RESTRICT) ist eine Designer-
Entscheidung mit Begründung in `docs/datenmodell.md` § 2.3.

### 2.3 Geschäfts-Regel WF-01 (Hauptmangel-Blocker)

**Beispiel-Prompt:**
> „Implementiere eine TypeScript-Funktion `updTerminStatus(terminId,
> neuerStatus)` die verhindert dass ein Termin auf 'Bestanden' gesetzt
> wird, wenn er mindestens einen Mangel der Kategorie HM oder GM hat.
> Nutze Drizzle für die JOIN-Query auf mangel ⋈ mangel_kategorie. Wirf
> einen Error mit aussagekräftiger Message bei Verletzung."

**Validierungs-Schritt:**
1. Code-Review: Ist der JOIN korrekt? Wird der Count richtig gelesen?
2. Vitest-Test geschrieben: Termin mit HM → `updTerminStatus(_, "Bestanden")`
   wirft? Termin ohne HM → setzt korrekt?
3. App-Layer-Test im Browser: HM hinzufügen, Status auf Bestanden zu
   ändern versuchen, UI-Fehlermeldung sehen.

**Eigenleistung:** Die Regel selbst (WF-01) stammt aus § 29 StVZO
Anlage VIII — Marwan hat die Regel formuliert und ihre Rechtsgrundlage
recherchiert. KI hat nur die technische Umsetzung in TypeScript-Code
geliefert.

### 2.4 Test-Generierung (Vitest)

**Beispiel-Prompt:**
> „Schreibe Vitest-Tests für die Funktion `validateKennzeichen(s)` in
> `src/utils/validators.js`. Decke ab:
> - Gültige Formate: 'H-AB 1234', 'H-AB 12', 'STD-XY 9999'
> - Ungültige: leere Strings, fehlende Bindestriche, zu viele Ziffern
> - Edge-Cases: Sonderzeichen, Whitespace, Großbuchstaben-Pflicht
> Nutze beschreibende `describe`/`it` Texte auf Deutsch."

**Validierungs-Schritt:**
1. Tests ausgeführt — laufen sie?
2. Coverage geprüft — fallen Branches durch? Mutation Testing.
3. Code-Review: sind die Test-Cases sinnvoll? Vermisste Äquivalenz-Klassen?

**Eigenleistung:** Die Festlegung welche Äquivalenz-Klassen und Grenzwerte
es überhaupt gibt (Längen-Vorgaben aus FZV §8) ist Domänen-Wissen. KI
würfelt sonst zufällige Test-Strings, die nichts mit der Realität zu tun
haben.

### 2.5 Dokumentation (Markdown)

**Beispiel-Prompt:**
> „Erstelle ein Architecture Decision Record (ADR) im MADR-4.0-Format
> für die Entscheidung 'PGlite statt Firestore'. Status accepted, Datum
> 2026-05-13. Behandle die fünf Optionen PGlite, sql.js, better-sqlite3,
> PostgreSQL in Docker, Firestore. Gehe auf Frau Fuchs' Kritik 'lokale
> relationale Datenbank' explizit ein."

**Validierungs-Schritt:**
1. Generiertes Markdown gelesen — entspricht es den tatsächlichen
   Entscheidungen?
2. Quellen verifiziert — sind die Links auf PGlite-Doku gültig?
3. Fakten geprüft — ist „WASM 3.2 MB" korrekt? (laut PGlite-Release-Notes)
4. Konsistenz mit anderen ADRs.

**Eigenleistung:** Die Entscheidung selbst, die Begründungs-Argumente,
die Bewertung der Alternativen. KI strukturiert nur den Text — die
Substanz kommt aus dem Team-Konsens.

### 2.6 Refactoring (z. B. Firestore → PGlite Migration)

**Beispiel-Prompt:**
> „Hier ist die alte useStore.js (Firestore-basiert). Erstelle einen
> Kompatibilitäts-Adapter `useStoreCompat.ts` der dieselbe API exponiert
> (`fahrzeuge`, `termine`, `addCar(...)`, `addTr(...)`), aber intern
> PGlite/Drizzle über das neue `useDb`-Hook nutzt. Mapping:
> - Halter wird beim Anlegen eines Fahrzeugs implizit erzeugt oder gefunden
> - termin.art (legacy) ↔ termin.prueftCode (neu)
> - termin.mängel[] (legacy embedded) ↔ separate mangel-Tabelle (neu)"

**Validierungs-Schritt:**
1. Adapter-Code gelesen — sind alle Felder gemappt?
2. Existierende Vitest-Tests gegen Adapter laufen lassen — keine Tests
   wurden geändert, nur der Adapter unten drunter. Wenn die Tests grün
   bleiben, ist das Mapping funktional korrekt.
3. End-to-End im Browser: Fahrzeug + Termin + Mangel anlegen, alle Views
   prüfen.
4. Edge-Cases: Datum nahe Mitternacht, NULL-Werte für FIN, gelöschte
   Halter.

**Eigenleistung:** Die Entscheidung „Compat-Layer statt direktem
View-Refactor" um Risiko zu reduzieren ist eine bewusste Migrations-
Strategie (siehe ADR-001 und `docs/projekt_walkthrough.md` § 7).

### 2.7 Fehlersuche und Debugging

**Beispiel-Prompt:**
> „Termine erscheinen nicht im Tagesplan-View nach dem Anlegen. Hier
> der Code von TagesplanView.jsx, useStoreCompat.ts und der seed-Daten.
> Was könnte schief gehen?"

**Validierungs-Schritt:**
1. Vorgeschlagene Hypothesen einzeln im Browser/Console nachgeprüft.
2. Erst nach reproduzierter Fehler-Bestätigung Code geändert.
3. Test geschrieben der den Fehler abdeckt (Regression-Test).

**Eigenleistung:** Eigentliche Diagnose erforderte das Lesen von Console,
das schrittweise Eingrenzen, das Hard-Refreshen des Service-Workers —
und das Finden des Root-Causes (`toISOString()` schiftete Datum nahe
Mitternacht in UTC). KI lieferte Hypothesen, das Team wählte und prüfte
sie.

---

## 3. Was NICHT durch KI entstanden ist (Eigenleistung)

| Bereich | Wer hat es geleistet | Wieso nicht KI |
|---|---|---|
| Domänen-Analyse (welche Entitäten, welche Regeln) | Marwan (Kfz-Gutachter-Ausbildung, väterlicher TÜV-Betrieb), Oussama | KI kennt §29 StVZO Anlage VIII nicht im Detail. Modelle würden generische „Mangel mit Beschreibung"-Modelle vorschlagen, nicht die spezifische HM/GM/LM/AM-Hierarchie |
| Anforderungs-Erhebung (was die App können muss) | Team | Erfordert Gespräche mit Werkstatt-Praxis, nicht Modell-Inferenz |
| Sprint-Planung (Story-Auswahl, Priorisierung) | Team | Stakeholder-Sicht ist team-spezifisch |
| Akzeptanz-Kriterien pro Story | Team | Definiert die Erwartung — keine generische Antwort möglich |
| Code-Reviews (Was ist gut/schlecht?) | Team mit KI-Unterstützung | KI hilft beim Lesen, Bewertung bleibt Team-Aufgabe |
| Architektur-Entscheidungen (was die ADRs dokumentieren) | Team | KI liefert Optionen, Wahl trifft das Team |
| Datenbank-Modellierung (welches ER-Modell die Realität abbildet) | Marwan | siehe Domänen-Analyse |
| WF-01 und andere Geschäftsregeln (rechtliche Grundlage) | Marwan | aus StVZO recherchiert |
| Frau-Fuchs-Feedback-Antworten (politisch sensibel) | Team | persönliche Kommunikation |
| Eigene Lern-Reflexion (was haben wir gelernt?) | Team | per Definition nicht delegierbar |

---

## 4. Validierungs-Strategie (Drei-Linien-Modell)

Damit KI-generierter Code nicht ungeprüft in die Codebase wandert, wendet
das Team folgende drei Linien an:

### Linie 1 — Lesen und Verstehen
Jeder KI-Output wird vor dem Übernehmen vom verantwortlichen
Teammitglied **vollständig gelesen** und mental durchgespielt. Wenn ein
Pattern unklar ist (z. B. eine Drizzle-Query-Syntax), wird in der
offiziellen Dokumentation nachgeschlagen — nicht „blind übernommen".

### Linie 2 — Automatisierte Prüfung
Jeder Commit muss durchlaufen:
- `npm run lint` → 0 Errors
- `npm run typecheck` → 0 Errors (für TS-Files)
- `npm run test` → alle 133 Tests grün
- Build → erfolgreich

Diese Pipeline läuft auch in CI (`.github/workflows/ci.yml`) und blockt
PRs bei Fehlern.

### Linie 3 — Manuelle Funktionsprüfung
Nach Code-Merge folgt ein **Browser-Smoke-Test** durch das Team:
1. Welche User-Story betrifft die Änderung?
2. Wird der Happy-Path manuell durchlaufen?
3. Werden zwei Edge-Cases manuell getestet?
4. Service-Worker geleert und mit Hard-Refresh erneut geprüft?

Erst nach Bestehen dieser drei Linien gilt eine Story als „Done" gemäß
`docs/definition_of_done.md`.

---

## 5. Wer ist der Domänen-Experte?

Das ist der zentrale Punkt der Frau-Fuchs-Kritik „KI kennt sich mit
TÜV-Datenbanken nicht aus" und unsere Antwort:

> **Marwan Saleh** befindet sich in der Ausbildung zum zertifizierten
> Kfz-Gutachter (TÜV/DEKRA-anerkannt). Sein Vater betreibt seit über
> 20 Jahren einen Kfz-Sachverständigen-Betrieb in Hannover. Die
> Domänen-Analyse — welche Entitäten, welche Beziehungen, welche
> Geschäftsregeln, welche Workflows — basiert auf realer
> Werkstatt-Praxis, nicht auf generischer KI-Inferenz.

> **Konkret:** Das ER-Modell wurde von Marwan auf Papier entworfen,
> mit Oussama in einer Whiteboard-Session iteriert, gegen § 29 StVZO
> Anlage VIII validiert, und **erst dann** an KI gegeben für die
> technische Umsetzung in Drizzle-Schema.

Damit ist die Sorge — KI halluziniert ein TÜV-Modell ohne Domänen-
Wissen — in diesem Projekt nachweislich entkräftet: das Modell stammt
vom Domänen-Experten, KI ist nur Implementierungs-Werkzeug.

---

## 6. Reflexion: Was haben wir aus dem KI-Einsatz gelernt?

* **KI ist ein Multiplikator, kein Ersatz.** Sie spart Tipp-Zeit und
  Boilerplate-Last, ersetzt aber nicht das Verständnis. Wer den Output
  nicht lesen und kritisieren kann, sollte ihn nicht übernehmen.

* **Validierung ist Pflicht, nicht Kür.** Jeder KI-Vorschlag wurde
  gegen Tests, Browser-Verhalten und Doku-Konsistenz geprüft. Mehrere
  Halluzinationen wurden so abgefangen (z. B. falsche FK-Direction in
  einer früheren Schema-Version, erfundene Drizzle-API).

* **Domänen-Wissen bleibt bei uns.** KI hat keine Zugriffe auf §29
  StVZO, VdTÜV-Empfehlungen, oder die Realität einer TÜV-Prüfstelle.
  Diese Schicht zu liefern war und ist unsere Aufgabe.

* **Schwächen, die wir bei uns selbst beobachtet haben:** Bei einigen
  frühen Iterationen wurde KI-Output zu schnell übernommen ohne tiefe
  Validierung. Beispiel: der ursprüngliche Firestore-Ansatz war ein
  KI-Vorschlag, den wir nicht ausreichend gegen unsere
  3NF-Anforderungen geprüft hatten. **Lessons Learned:** Architektur-
  Entscheidungen brauchen ein eigenes ADR vor der Implementierung —
  daher gibt es jetzt `docs/decisions/`.

---

## 7. Quellen und Versionen

* Anthropic Claude — claude.ai, Modelle Sonnet 4.5 und Opus 4.6/4.7
  (Mai 2026)
* OpenAI ChatGPT — chat.openai.com, Modelle GPT-4 und GPT-4o (April-Mai
  2026)
* GitHub Copilot — VS Code Extension v1.x (kontinuierlich)
* MADR-Format für ADRs — https://adr.github.io/madr
* Scrum Guide 2020 — https://scrumguides.org (Quelle für unsere DoD)
* § 29 StVZO Anlage VIII — Bundesanzeiger (rechtliche Grundlage für
  HU-Mangel-Klassifikation)
* VdTÜV-Empfehlung 916 — Klassifizierung erkennbarer Mängel

---

## 8. Pflicht-Erklärung

Die formale **KI-Nutzungserklärung** (`docs/ki-nutzungserklaerung.pdf`,
handschriftlich unterschrieben) bestätigt zusammenfassend:

1. KI wurde als Hilfsmittel eingesetzt — vergleichbar mit Suchmaschine,
   IDE-Autocomplete oder Lehrbuch.
2. **Jede** KI-generierte Code- oder Text-Passage wurde manuell geprüft,
   verstanden und ggf. angepasst.
3. Wir übernehmen die volle Verantwortung für den gesamten Inhalt des
   Projekts — KI ist keine Entschuldigung für etwaige Fehler.
4. Wir können jedes Detail unseres Projekts auch ohne KI-Unterstützung
   erklären, begründen und diskutieren.

— Marwan Saleh, Oussama Hlayhel · 13.05.2026
