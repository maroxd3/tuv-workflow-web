# Erklärung zur Nutzung KI-basierter Werkzeuge

**Projekt:** TÜV Prüfstelle Pro · Software-Projekt IIM-211-01
**Stand:** 30. April 2026

Im Sinne der zunehmend an deutschen Hochschulen geforderten Transparenz
beim Einsatz generativer KI im Studium legen wir hiermit offen, wo und
wie KI-Werkzeuge bei der Erstellung dieser Projektarbeit zum Einsatz
gekommen sind.

---

## 1. Eingesetzte Werkzeuge

| Werkzeug | Anbieter | Hauptverwendung |
|---|---|---|
| **Claude (Sonnet/Opus)** | Anthropic | Code-Generierung, Refactoring, Doku-Drafts, Review |
| **GitHub Copilot** | GitHub/OpenAI | gelegentliches Inline-Autocomplete in der IDE |
| **ChatGPT** | OpenAI | punktuelle Recherche zu APIs und Best Practices |

---

## 2. Wo wurden KI-Werkzeuge eingesetzt?

### Code

- **Boilerplate und Schema-arbeit:** initiale Vite/React-Setup-Konfiguration,
  ESLint-flat-config, PropTypes-Definitionen, Mermaid-Diagramm-Syntax —
  hier wurde KI als Schreibhilfe verwendet, der Inhalt aber von uns
  inhaltlich geprüft und angepasst.
- **Validatoren-Pipeline:** Grundgerüst der Format-Regex (z. B. deutsches
  Kennzeichen, FIN nach ISO 3779) wurde mit KI-Unterstützung erarbeitet,
  die Regex-Logik anschließend gegen unsere Test-Cases verifiziert.
- **Mobile-Responsive-Anpassungen:** CSS-Klassen-System (`.grid-resp-*`,
  `.full-mobile`, etc.) wurde gemeinsam mit Claude entworfen und auf
  realem iPhone Safari verifiziert.
- **PDF-Bericht-Layout:** der HTML-Generator für die A4-Berichte ist in
  enger Zusammenarbeit mit Claude entstanden; die rechtlichen Abgrenzungen
  (kein TÜV/DEKRA-Branding, korrekte StVZO-Terminologie) haben wir selbst
  recherchiert und vorgegeben.

### Dokumentation

- **Pflichtenheft, Datenmodell, Design, Testkonzept:** Entwürfe wurden
  mit KI-Unterstützung formuliert, die fachlichen Aussagen, Performance-
  Kennzahlen, Lastprofile und Entwurfsentscheidungen stammen jedoch von
  uns. Jede Aussage in den Dokumenten haben wir geprüft und verantworten
  wir inhaltlich.
- **Commit-Messages:** für komplexe Commits wurden KI-Drafts genutzt und
  vor dem Commit redigiert. Trivial-Commits wurden manuell verfasst.
- **Diese Erklärung:** ist Teil der genannten KI-Unterstützung,
  inhaltlich aber von uns geprüft und freigegeben.

### Tests

- Die Test-Cases (Äquivalenzklassen, Grenzwerte, Entscheidungstabellen)
  wurden methodisch von uns entworfen, Implementierung der einzelnen
  Vitest-Test-Funktionen oft mit KI-Unterstützung. Jeder Test wurde
  vor der Aufnahme in den Test-Bestand auf Sinnhaftigkeit geprüft.
- KI-Ausgaben wurden nicht ungeprüft übernommen: Wenn ein Testfall fachlich
  nicht zur TÜV-Domäne passte oder nur die Implementierung statt der
  Geschäftsregel bestätigte, wurde er verworfen oder manuell umformuliert.

---

## 3. Wo wurden KI-Werkzeuge **nicht** eingesetzt?

- **Architektur-Grundsatzentscheidungen:** React + Vite + PGlite/Drizzle,
  Tauri statt Electron, Echtzeit-Sync statt Polling, Cascading-Dropdowns
  statt freie Text-Eingabe — diese Entscheidungen haben wir selbst
  getroffen und in `docs/design.md` § 1.2 begründet.
- **Datenmodell-Entwurf:** ER-Modell, 4 Integritätsebenen,
  NoSQL-vs-RDBMS-Diskussion mit SQL-Gegenentwurf — fachliche Entscheidungen
  sind von uns, KI hat bei der Formulierung geholfen.
- **Bewertung von Frau Fuchs' Feedback:** welche Punkte in welcher Tiefe
  zu adressieren sind, war eine inhaltliche Eigenleistung.
- **Geschäftsregel-Definitionen:** § 29 StVZO, Anlage VIII,
  Hauptmangel-Sperre, Status-Übergänge, FIN-Prüfziffer-Soft-Validation
  — Recherche und Festlegung sind unsere.

---

## 4. Verantwortung

Die Verwendung von KI-Werkzeugen entbindet uns nicht von der
inhaltlichen und fachlichen Verantwortung für die abgegebenen
Artefakte. Wir haben

- jede generierte Code-Zeile vor dem Commit gelesen und auf Korrektheit
  geprüft,
- jede generierte Doku-Aussage gegen die tatsächliche Implementierung
  abgeglichen,
- jede zitierte Quelle (Nielsen, ISO 3779, StVZO, Anlage VIII) eigenständig
  verifiziert.

Etwaige fachliche oder formale Fehler in dieser Projektarbeit sind
unsere und nicht die der eingesetzten Werkzeuge.

---

**Hannover, den ____________**

___________________________________
Marwan Saleh

___________________________________
Oussama Hlayhel
