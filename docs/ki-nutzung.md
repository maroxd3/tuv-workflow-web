# KI-Nutzung im Projekt TÜV Prüfstelle Pro

> **Zweck:** Dieses Dokument macht transparent, **wo, wofür und in welcher
> Form** Künstliche-Intelligenz-Werkzeuge im Verlauf dieses Projekts
> eingesetzt wurden. Es ergänzt die formale **KI-Nutzungserklärung**
> (`docs/ki_nutzungserklaerung.md`), geht aber inhaltlich tiefer und
> dokumentiert konkrete Prompts, Validierungs-Strategien und die klare
> Trennung zwischen KI-Beitrag und Eigenleistung.

* **Stand:** 17.05.2026
* **Verantwortlich:** Marwan Saleh (Domänen-Experte, Lead), Oussama Hlayhel
* **Aktuelle technische Basis:** React/Vite-Frontend, Express-API und MariaDB
* **Anlass:** Frau Fuchs hat im Feedback-Gespräch ausdrücklich gefordert, die
  Prompt-Nutzung zu dokumentieren.

---

## 1. Verwendete KI-Werkzeuge

| Werkzeug | Anbieter | Hauptzweck | Lizenz / Plan |
|---|---|---|---|
| Claude (Sonnet 4.5, Opus 4.6/4.7) | Anthropic | Code-Generierung, Refactoring, Dokumentation, Diskussion | Claude Pro |
| ChatGPT (GPT-4, GPT-4o) | OpenAI | Konzept-Diskussion, Alternativen-Recherche | ChatGPT Plus |
| GitHub Copilot | GitHub/OpenAI | Inline-Autovervollständigung in der IDE | Pro |

Alle drei Werkzeuge erzeugen Output auf Basis trainierter Sprachmodelle. Keines
davon hat Zugriff auf eine TÜV-spezifische Wissensdatenbank. Domänen-spezifisches
Wissen (§ 29 StVZO, VdTÜV-Empfehlungen, praktische Werkstatt-Abläufe) stammt vom
Studierenden-Team.

---

## 2. Einsatzbereiche im Projekt

Dieser Abschnitt listet relevante Bereiche, in denen KI eingesetzt wurde,
jeweils mit (a) typischem Prompt-Muster, (b) Validierungs-Schritt und (c) wie der
finale Code oder Text entstand.

### 2.1 Komponenten-Generierung (React)

**Beispiel-Prompt:**
> „Schreibe eine React-Komponente `TerminModal`, die ein Formular für Datum,
> Uhrzeit, Prüfart, Prüfer und Status enthält. Validierung über
> `validateTermin()`. Werte werden über Props `initialValues` befüllt und über
> `onSave(form)` zurückgegeben. Verwende Tailwind für Styling und unsere
> bestehenden Konstanten aus `src/constants/`."

**Validierungs-Schritt:**

1. Generierter Code in Branch eingefügt.
2. Manuell durchgelesen: Imports korrekt? Konstanten echt vorhanden?
3. Browser-Smoke-Test: Modal öffnen, Werte eingeben, speichern.
4. Vitest-Test geschrieben.

**Eigenleistung:** Spezifikation der Felder, Pflichtfelder, Validierungsregeln
und Konstantenmodule. Diese Entscheidungen stammen aus der Domänenanalyse.

### 2.2 Datenbank-Schema (MariaDB)

**Beispiel-Prompt:**
> „Konvertiere folgendes ER-Modell (HALTER 1-N FAHRZEUG, FAHRZEUG 1-N TERMIN,
> TERMIN 1-N MANGEL) in ein MariaDB-Schema. Nutze InnoDB, utf8mb4, FK mit
> ON DELETE CASCADE für TERMIN->FAHRZEUG und MANGEL->TERMIN, ON DELETE RESTRICT
> für FAHRZEUG->HALTER. Kennzeichen UNIQUE, FIN UNIQUE aber NULL erlaubt.
> Erzeuge außerdem Stammdatentabellen für STATUS, PRUEFART, PRUEFER und
> MANGEL_KATEGORIE."

**Validierungs-Schritt:**

1. Generiertes Schema gegen `docs/datenmodell.md` § 2.2 Relationenschema
   abgeglichen.
2. MariaDB-DDL gegen `server/db.js` geprüft: Spalten, Datentypen, Constraints,
   Indizes und Cascades.
3. API lokal gestartet und geprüft, ob Tabellen und Stammdaten automatisch
   angelegt werden.
4. `/api/health` und `/api/fahrzeuge` gegen MariaDB getestet.

**Eigenleistung:** Das ER-Modell, die Kardinalitäten und die Entscheidung
CASCADE vs. RESTRICT stammen aus der Domänenanalyse. KI half bei Formulierung
und technischer Ausarbeitung, nicht bei der fachlichen Entscheidung.

### 2.3 Geschäftsregel WF-01 (Hauptmangel-Blocker)

**Beispiel-Prompt:**
> „Implementiere in einer Express-API eine Statusänderung
> `PATCH /api/termine/:id/status`. Wenn der neue Status `Bestanden` ist, muss
> MariaDB prüfen, ob für diesen Termin mindestens ein Mangel mit einer Kategorie
> existiert, bei der `mangel_kategorie.blockiert_bestanden = TRUE` gilt.
> Verwende parametrisierte Queries und gib bei Verletzung `{ ok: false, reason }`
> zurück."

**Validierungs-Schritt:**

1. Code-Review: Ist der JOIN `mangel` zu `mangel_kategorie` korrekt?
2. API manuell getestet: Termin mit HM/GM darf nicht auf `Bestanden`.
3. App-Test im Browser: HM hinzufügen, Statusänderung versuchen,
   Fehlermeldung prüfen.
4. Regression prüfen: Termin ohne HM/GM darf weiter auf `Bestanden`.

**Eigenleistung:** Die Regel selbst stammt aus § 29 StVZO Anlage VIII. Marwan
hat die Regel formuliert und ihre fachliche Grundlage recherchiert. KI hat nur
bei der technischen Umsetzung geholfen.

### 2.4 Test-Generierung (Vitest)

**Beispiel-Prompt:**
> „Schreibe Vitest-Tests für die Funktion `validateKennzeichen(s)` in
> `src/utils/validators.js`. Decke ab:
> - Gültige Formate: 'H-AB 1234', 'H-AB 12', 'STD-XY 9999'
> - Ungültige: leere Strings, fehlende Bindestriche, zu viele Ziffern
> - Edge-Cases: Sonderzeichen, Whitespace, Großbuchstaben-Pflicht
> Nutze beschreibende `describe`/`it` Texte auf Deutsch."

**Validierungs-Schritt:**

1. Tests ausgeführt.
2. Coverage geprüft.
3. Testfälle fachlich bewertet: Sind Äquivalenzklassen und Grenzwerte sinnvoll?

**Eigenleistung:** Die Festlegung der Äquivalenzklassen und Grenzwerte ist
Domänenarbeit. KI kann Testcode formulieren, aber nicht zuverlässig entscheiden,
welche Kfz-Fälle fachlich wichtig sind.

### 2.5 Dokumentation (Markdown)

**Beispiel-Prompt:**
> „Erstelle ein Architecture Decision Record für die Entscheidung
> `MariaDB als zentrale Persistenz`. Status accepted, Datum 2026-05-17.
> Vergleiche zentrale MariaDB über Express-API mit rein lokaler
> Browser-Persistenz und direktem Cloud-Backend. Begründe, warum mehrere Clients
> denselben Datenbestand brauchen und warum Datenbank-Zugangsdaten nicht ins
> Frontend gehören."

**Validierungs-Schritt:**

1. Generiertes Markdown gelesen: Entspricht es der tatsächlichen Entscheidung?
2. Abgleich mit Code: `server/db.js`, `server/index.js`, `src/db/apiClient.ts`.
3. Konsistenz mit `docs/datenmodell.md`, `docs/design.md` und README geprüft.
4. Alte Aussagen zur früheren Persistenz entfernt oder auf MariaDB umgeschrieben.

**Eigenleistung:** Entscheidung, Bewertung der Alternativen und finale
Argumentation stammen vom Team. KI strukturiert und formuliert, ersetzt aber
keine Architekturentscheidung.

### 2.6 Refactoring (Frontend-Datenzugriff -> Express/MariaDB)

**Beispiel-Prompt:**
> „Hier ist der aktuelle React-Hook `useDb.ts`. Stelle die Datenzugriffe so um,
> dass sie nicht direkt auf eine lokale Datenbank gehen, sondern über
> `src/db/apiClient.ts` die Express-Endpunkte `/api/halter`, `/api/fahrzeuge`,
> `/api/termine` und `/api/maengel` verwenden. Behalte die bestehende Hook-API
> für die Views bei und mappe camelCase im Frontend auf die API-Formate."

**Validierungs-Schritt:**

1. Adapter-Code gelesen: Sind alle Felder gemappt?
2. Browser-End-to-End: Fahrzeug, Termin und Mangel anlegen.
3. API-Smoke-Test gegen MariaDB: `/api/health`, `/api/fahrzeuge`.
4. Edge-Cases: NULL-Werte für FIN, gelöschte Fahrzeuge, blockierende Mängel.

**Eigenleistung:** Die Entscheidung, die Views stabil zu halten und nur den
Datenzugriff auszutauschen, ist eine bewusste Migrationsstrategie. Das Mapping
zwischen Legacy-View-Shape und MariaDB-API wurde vom Team geprüft.

### 2.7 Fehlersuche und Debugging

**Beispiel-Prompt:**
> „Termine erscheinen nach dem Speichern nicht im Tagesplan. Hier sind
> TagesplanView.jsx, useDb.ts, apiClient.ts und die Express-Route
> `/api/termine`. Welche Stellen können Ursache sein?"

**Validierungs-Schritt:**

1. Vorgeschlagene Hypothesen einzeln im Browser, in der Konsole und über
   API-Requests geprüft.
2. Erst nach reproduzierter Fehler-Bestätigung Code geändert.
3. Regressionstest oder manueller Smoke-Test ergänzt.

**Eigenleistung:** Die eigentliche Diagnose erfolgte durch Lesen von Console,
Network-Tab, API-Antworten und Datenbankzustand. KI lieferte Hypothesen, das
Team wählte und prüfte sie.

---

## 3. Was NICHT durch KI entstanden ist (Eigenleistung)

| Bereich | Wer hat es geleistet | Wieso nicht KI |
|---|---|---|
| Domänenanalyse | Marwan, Oussama | KI kennt §29 StVZO Anlage VIII und reale Werkstattabläufe nicht zuverlässig |
| ER-Modell | Team, fachlich durch Marwan geprägt | Entitäten, Kardinalitäten und Regeln stammen aus der Domäne |
| Anforderungserhebung | Team | Erfordert Stakeholder- und Praxisverständnis |
| Sprint-Planung | Team | Priorisierung ist projektspezifisch |
| Akzeptanzkriterien | Team | Definiert die Erwartung an die App |
| Architekturentscheidungen | Team mit KI-Unterstützung | KI liefert Optionen, die Wahl trifft das Team |
| WF-01 und weitere Geschäftsregeln | Marwan | Fachliche Grundlage aus StVZO und Prüfpraxis |
| Frau-Fuchs-Feedback-Antworten | Team | Persönliche Kommunikation und Abgabekontext |
| Lernreflexion | Team | Per Definition nicht delegierbar |

---

## 4. Validierungs-Strategie (Drei-Linien-Modell)

Damit KI-generierter Code oder Text nicht ungeprüft übernommen wird, wendet das
Team drei Linien an.

### Linie 1 - Lesen und Verstehen

Jeder KI-Output wird vor dem Übernehmen vollständig gelesen und mental
durchgespielt. Wenn ein Pattern unklar ist, wird die offizielle Dokumentation
oder der vorhandene Projektcode geprüft.

### Linie 2 - Automatisierte Prüfung

Jeder technische Commit muss abhängig vom Umfang durchlaufen:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

Für die MariaDB-Umstellung wurden zusätzlich API-Smoke-Tests gegen die lokale
Datenbank ausgeführt.

### Linie 3 - Manuelle Funktionsprüfung

Nach Code-Merge folgt ein Browser-Smoke-Test:

1. Welche User-Story betrifft die Änderung?
2. Wird der Happy-Path manuell durchlaufen?
3. Werden Edge-Cases manuell getestet?
4. Sind API-Antworten und UI-Zustand konsistent?

---

## 5. Wer ist der Domänen-Experte?

Das ist der zentrale Punkt der Kritik „KI kennt sich mit TÜV-Datenbanken nicht
aus" und unsere Antwort:

> **Marwan Saleh** befindet sich in der Ausbildung zum zertifizierten
> Kfz-Gutachter (TÜV/DEKRA-anerkannt). Sein Vater betreibt seit über 20 Jahren
> einen Kfz-Sachverständigen-Betrieb in Hannover. Die Domänenanalyse - welche
> Entitäten, welche Beziehungen, welche Geschäftsregeln, welche Workflows -
> basiert auf realer Werkstatt-Praxis, nicht auf generischer KI-Inferenz.

> **Konkret:** Das ER-Modell wurde fachlich vom Team entworfen, gegen § 29 StVZO
> Anlage VIII validiert und erst danach für technische Ausarbeitung,
> Dokumentation und MariaDB-Umsetzung mit KI-Unterstützung weiterbearbeitet.

Damit ist die Sorge, KI könne ein TÜV-Modell ohne Domänenwissen halluzinieren,
adressiert: Das Modell stammt vom Domänen-Experten, KI ist nur
Implementierungs- und Formulierungswerkzeug.

---

## 6. Reflexion: Was haben wir aus dem KI-Einsatz gelernt?

* **KI ist ein Multiplikator, kein Ersatz.** Sie spart Tippzeit und
  Boilerplate, ersetzt aber nicht das Verständnis.

* **Validierung ist Pflicht.** Jeder KI-Vorschlag wurde gegen Tests,
  Browser-Verhalten, API-Verhalten, MariaDB-Zustand und Doku-Konsistenz geprüft.

* **Domänenwissen bleibt bei uns.** KI hat keinen verlässlichen Zugriff auf
  §29 StVZO, VdTÜV-Empfehlungen oder die Realität einer TÜV-Prüfstelle.

* **Architekturentscheidungen brauchen bewusste Prüfung.** Persistenz- und
  Datenmodellentscheidungen werden über ADRs und `docs/datenmodell.md`
  begründet, nicht nur aus einem Prompt übernommen.

---

## 7. Quellen und Versionen

* Anthropic Claude - claude.ai, Modelle Sonnet 4.5 und Opus 4.6/4.7
* OpenAI ChatGPT - chat.openai.com, Modelle GPT-4 und GPT-4o
* GitHub Copilot - VS Code Extension
* MariaDB Documentation - https://mariadb.com/kb/en/documentation/
* Express Documentation - https://expressjs.com/
* MADR-Format für ADRs - https://adr.github.io/madr
* Scrum Guide 2020 - https://scrumguides.org
* § 29 StVZO Anlage VIII
* VdTÜV-Empfehlung 916

---

## 8. Pflicht-Erklärung

Die formale **KI-Nutzungserklärung** bestätigt zusammenfassend:

1. KI wurde als Hilfsmittel eingesetzt - vergleichbar mit Suchmaschine,
   IDE-Autocomplete oder Lehrbuch.
2. Jede KI-generierte Code- oder Text-Passage wurde manuell geprüft, verstanden
   und angepasst.
3. Wir übernehmen die volle Verantwortung für den gesamten Inhalt des Projekts.
4. Wir können jedes Detail unseres Projekts auch ohne KI-Unterstützung erklären,
   begründen und diskutieren.

Marwan Saleh, Oussama Hlayhel · 17.05.2026
