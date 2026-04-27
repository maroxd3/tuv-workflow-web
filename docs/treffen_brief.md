# Treffen mit Frau Fuchs — Spickzettel

**Datum:** [eintragen, sobald Termin steht]
**Wer:** Marwan + Oussama + Frau Fuchs
**Ziel:** Zeigen, dass wir ihr Feedback verstanden und systematisch umgesetzt haben — und Klarheit für die Abgabe holen.

> Lies das einmal komplett vor dem Termin durch. Du musst nichts auswendig — die Doku in `docs/` und die Live-App machen die Arbeit. Du musst nur entspannt erzählen können.

---

## 1. Wie ihr eröffnet (1 Minute)

> *„Frau Fuchs, vielen Dank für Ihr ausführliches Feedback vom 24. April. Wir haben es als Sprint-5-Fokus genommen und alle Punkte adressiert. Wir würden gerne kurz durchgehen, was wir geändert haben — und uns danach Ihre Fragen anhören."*

Dann: kurz die Live-App auf `tuv-workflow.web.app` öffnen und erklären, dass alles, was ihr beschreibt, dort live testbar ist.

---

## 2. Wie die Web-App aufgebaut ist (in 60 Sekunden)

Wenn sie fragt *„erzählen Sie mir kurz, wie Sie das gebaut haben"* — sag das:

> *„Drei Schichten. Vorne ist React 19 mit Vite, das ist eine moderne Single-Page-App. In der Mitte sind unsere Custom Hooks — der `useStore` ist das Herzstück, der hält den ganzen App-State und synchronisiert mit Firestore. Hinten ist Firebase Firestore als Datenbank mit Echtzeit-Sync, plus LocalStorage als Offline-Cache. Das Ganze läuft auch als Desktop-App über Tauri 2 — ist 6 MB statt 150 MB wie bei Electron."*

Wenn sie nach Begründungen fragt: alle Tech-Wahlen sind in `docs/design.md` mit Alternative + Begründung dokumentiert.

---

## 3. Wie wir gearbeitet haben — Sprint-Methodik

Falls sie nach dem Vorgehen fragt:

> *„Wir arbeiten in 2-Wochen-Sprints, fünf Sprints durch — Setup, Fahrzeug-CRUD, Tagesplan, Mängel/Berichte/Statistik, und der jetzige Sprint 5 war der Fix-Sprint nach Ihrem Feedback. Insgesamt 117 Story Points. Definition of Done hat 10 Punkte: Lint sauber, Tests grün, PropTypes, Reviewer-Approve, manueller Smoke-Test im Browser und im Tauri-Build."*

Verweis auf `docs/backlog.md` — da steht alles: User Stories, MoSCoW-Priorität, Story Points, Sprint-Historie.

---

## 4. Was wir auf ihr Feedback konkret geändert haben

Das ist der zentrale Teil. Geht ihre Liste der Reihe nach durch — kurz und ohne Defensive:

### a) Doku auf GitHub
> *„Wir haben fünf Markdown-Dokumente in `docs/` angelegt — Pflichtenheft (236 Zeilen), Backlog (197), Datenmodell (325), Design (318), Testkonzept (193). Alle im Repo, alle versioniert mit Änderungshistorie."*

### b) Sprint-Doku, User Stories, DoD, Akzeptanzkriterien
> *„Im Backlog stehen ~25 User Stories als ‚Als X möchte ich … damit Y' formuliert. Akzeptanzkriterien sind im Pflichtenheft je Anforderung als Checkliste. Definition of Done als gemeinsame Liste, die für jede Story gilt."*

### c) Komponenten- & Klassendiagramm + Begründungen
> *„Beide Diagramme sind in `design.md` als Mermaid drin. Plus eine Tabelle mit jeder Tech-Wahl und der Alternative, die wir verworfen haben — also nicht nur ‚wir haben Recharts', sondern ‚Recharts statt Chart.js oder D3, weil React-nativ und deklarativ'. Genauso für Tauri statt Electron, Firestore statt Postgres und so weiter."*

### d) NoSQL vs. relationale DB
**Wichtig — das ist eine ihrer Hauptkritiken. Sei ehrlich:**
> *„Sie hatten recht — unsere Daten sind hochstrukturiert und ein RDBMS wäre die saubere Wahl. Wir haben in `datenmodell.md § 6` eine ehrliche Pro-und-Kontra-Tabelle plus einen SQL-Gegenentwurf mit allen Tabellen und Triggern für die Workflow-Regel. Unsere Bewertung steht da auch drin: ‚akzeptabel, nicht optimal' — wir bleiben für den Prototyp bei Firestore wegen Echtzeit-Sync und serverlosem Backend, aber wir dokumentieren explizit, dass eine Migration zu PostgreSQL für den Produktivbetrieb sauberer wäre."*

**Trick:** Wenn du *zugibst*, dass sie recht hat, kommt sie nicht in Verteidigungsmodus. Sie hat dann gewonnen, was sie wollte (Anerkennung, dass wir nachgedacht haben), und das Gespräch geht weiter.

### e) 100 ms — warum, wie testen?
> *„Wir haben drei Schwellen verglichen: unter 50 ms ist der Mensch nicht mehr von Null-Latenz unterscheidbar, da würden wir Engineering-Aufwand reinstecken ohne UX-Gewinn. 100 ms ist Nielsens Grenze für direkte Manipulation — Aktion fühlt sich sofort an. 200 ms wäre noch akzeptabel, aber das Direkt-Gefühl geht verloren. Unsere Last ist eh klein — 30 Termine pro Tag — also sind wir sicher unter 100 ms. Test-Methode: Vitest-Benchmark mit 500 Termine als 10-fache Last, p95 auf einem definierten Referenzgerät."*

### f) Lastprofil
> *„20–30 Prüfungen pro Tag typisch, 50 in der HU/AU-Spitze, 3–5 Nutzer parallel, ~8 000 Termine pro Jahr. Steht im Pflichtenheft § 3.1."*

### g) Datenschutz / Cloud-DB
> *„Eigener Abschnitt im Pflichtenheft. Aktuell: EU-Region `europe-west1`, Auftragsverarbeitungsvertrag mit Google. Lücken im Prototyp: Auth fehlt, Audit-Log fehlt, Backup-Strategie fehlt — alle drei mit Roadmap im Doc, wie sie produktiv gefüllt werden. Alternative wäre selbst-gehostetes PostgreSQL bei strenger Anforderung."*

### h) Bug-Liste (negKM, Tel-Buchstaben, Email, Bestanden+HM, Doppel-Kennzeichen, BMW Polo, VW Motorrad)
**Das ist der stärkste Punkt — zeig die App live:**
> *„Sechs von sechs sind hart blockiert. Wir haben es nicht nur als Validator gebaut, sondern strukturell ins UX gezogen — Hersteller, Modell und Typ sind abhängige Dropdowns. ‚BMW Polo' kann man gar nicht mehr eintippen, weil der Modell-Dropdown nur BMW-Modelle zeigt. Plus Sonstiger-Modus für Oldtimer und Importe. Beim Kennzeichen prüfen wir gegen die KBA-Liste mit ~430 Codes, plus Saison-Kennzeichen wie B-TK 1234 04-10 sind unterstützt."*

**Live-Demo:** Geh in die App, versuche „BMW + Polo" einzugeben — du siehst, dass Polo nicht im Dropdown ist. Versuche „QWE-AB 1234" — wird abgelehnt mit „kein gültiger Kreis-Code". Das wirkt deutlich stärker als jede Folie.

### i) ESLint
> *„187 Errors mit Ihrer Config — wir haben unsere Config jetzt mit `recommended` plus jsx-runtime plus prop-types als error gesetzt, und sind bei 0 Errors. PropTypes-Validation für alle 22 Komponenten. Bell, STATUS, Legend — alle drei unused imports raus."*

---

## 5. Was sie wahrscheinlich fragt

### „Warum haben Sie Hersteller-Modell-Mismatch nicht früher hart gemacht?"
> *„Wir hatten es zuerst als Soft-Warning, weil wir Sonderfälle wie Oldtimer und Importe nicht blockieren wollten. Nach Ihrem Feedback haben wir es umgebaut: hart blockieren bei bekanntem Hersteller, aber expliziter ‚Sonstiger'-Modus für die Sonderfälle. Das war eigentlich die bessere Lösung — Ihr Feedback hat uns dahin gebracht."*

### „Echtzeit-Sync — warum nicht einfach alle 30 Sekunden Polling?"
> *„Bei 3–5 gleichzeitigen Nutzern am Tagesplan müssen Statuswechsel sofort sichtbar sein, sonst entstehen Doppelvergaben — Prüfer A startet einen Termin, der Empfang sieht 30 s später noch ‚Geplant' und vergibt den Slot doppelt. Polling alle 5 s würde auch reichen, aber Firestore liefert das gratis ohne Eigenbau einer Polling-Schicht."*

### „Wo sind die Zwischenstände dokumentiert?"
> *„In Git-Commits und im Backlog-Doc. Sprint-Historie steht in `backlog.md`, jeder Commit hat eine ausführliche Message — Sie können auf GitHub die Branch-Historie sehen."*

### „Kann das System mit echten KBA-Daten arbeiten?"
> *„Aktuell haben wir eine kuratierte Liste von ~430 Kreis-Codes und ~25 Herstellern mit ihren Modellen. Für den Produktiv-Betrieb wäre die KBA-Schlüsselnummer-Datenbank über DAT oder Schwacke der Standard — das ist eine Lizenz-Frage, nicht eine Technik-Frage. Im Prototyp-Scope reicht unsere Liste."*

### „Wie ist die Bedienung im Tauri-Desktop-Build?"
> *„Identisch zur Web-App, weil Tauri einfach den Browser-Renderer der Plattform nutzt. Vorteil ist die kleine Binary (~6 MB) und die Möglichkeit, später lokale Hardware anzubinden — OBD-Diagnose, Bremsenprüfstand. Die App läuft offline und synct, wenn wieder Netz da ist."*

### „Was würden Sie heute anders machen?"
**Ehrlich antworten:**
> *„Wahrscheinlich von Anfang an mit Postgres + einem leichten Backend, weil unsere Daten so strukturiert sind, dass die Vorteile von Firestore weniger ins Gewicht fallen. Außerdem hätten wir die Validatoren von Anfang an ins UX-Design gezogen, statt nachträglich Validatoren als Pflaster zu bauen — die Cascading-Dropdowns sind die saubere Lösung, da hätten wir früher draufkommen können."*

---

## 6. Was du proaktiv selbst ansprichst (zeigt Selbstreflexion)

Das ist wichtig — wenn DU die Schwachpunkte nennst, bevor sie es tut, hast du den Wind aus den Segeln.

### a) Bundle-Size-Warnung
> *„Eine Sache, die wir selber sehen: unser JS-Bundle ist 1,1 MB minified, 332 KB gzipped. Das ist über dem Vite-Default-Limit. Ursache sind Recharts plus Framer-Motion plus Firebase-SDK. Sauberer Fix wäre Code-Splitting per Route — Statistik-View und Charts in einen separaten Chunk lazy-loaden. Haben wir aufs Backlog für Sprint 6."*

### b) Soft-Validation FIN-Prüfziffer
> *„Eine Stelle, wo wir bewusst weich validieren: die FIN-Prüfziffer nach ISO 3779. Position 9 sollte aus den anderen 16 Stellen berechnet werden. Wir prüfen das, blockieren aber nicht, weil pre-1981er und Nicht-Nordamerika-Fahrzeuge keine korrekte Prüfziffer tragen — Hard-Block würde Importe und Oldtimer fälschlich abweisen."*

### c) Halter im Fahrzeug eingebettet, nicht eigene Entität
> *„In unserem Datenmodell ist der Halter als Attribut des Fahrzeugs modelliert, nicht als eigene Entität. Im Produktivbetrieb wäre die 3NF-Variante mit eigener Halter-Tabelle besser — ein Halter kann ja mehrere Fahrzeuge besitzen. Steht so in `datenmodell.md § 2` als Designentscheidung dokumentiert, mit Hinweis auf die Migrations-Variante."*

---

## 7. Eure Fragen am Ende

Plant zwei bis drei Fragen für sie, damit es ein Gespräch wird, kein Verhör:

1. **„Welche Punkte unserer Doku sehen Sie noch als verbesserungswürdig vor der finalen Abgabe?"**
   → Direkt umsetzbar, zeigt dass ihr lernen wollt.

2. **„Gibt es konkrete Test-Szenarien, die Sie noch sehen würden?"**
   → Sie wird vermutlich noch was finden — besser, ihr hört's jetzt als nach der Abgabe.

3. **„Wie sehen Sie den Umfang? Ist das genug für eine Abgabe in dieser Form, oder fehlt aus Ihrer Sicht noch etwas Wesentliches?"**
   → Klärt, ob ihr noch 50 Stunden reinstecken müsst oder fertig seid.

---

## 8. Wenn das Gespräch hakt

**Wenn sie kritisch wird, NICHT verteidigen — annehmen und reflektieren:**
- *„Da haben Sie wahrscheinlich recht — wie würden Sie das angehen?"*
- *„Das ist ein guter Punkt, den hatten wir nicht so klar gesehen. Wir würden das mitnehmen."*

**Wenn sie etwas falsch verstanden hat — sanft korrigieren:**
- *„Ich glaube, das könnten wir gerade nicht ganz klar gemacht haben. Was wir gemeint haben, ist …"*

**Wenn sie nach etwas fragt, das du nicht weißt:**
- *„Das ist ehrlich gesagt etwas, wo ich gerade nicht sicher bin — wir schauen das nach und melden uns nochmal per Mail."*

**NICHT improvisieren bei Fakten** — sie merkt sofort, wenn du was erfindest.

---

## 9. Materialien dabei haben

- [ ] Laptop mit `tuv-workflow.web.app` im Browser geöffnet
- [ ] PDF der Präsentation als Backup (falls Internet schlecht)
- [ ] Repo-URL als Bookmark: `github.com/maroxd3/tuv-workflow-web`
- [ ] Diesen Spickzettel auf Handy/Laptop
- [ ] Notizblock für Action Items aus dem Gespräch

---

## 10. Nach dem Termin

1. **Sofort danach** mit Oussama Action Items zusammenschreiben
2. **Innerhalb 24h** Dankesmail mit Zusammenfassung der besprochenen Punkte
3. **Action Items** ins Backlog als neue Stories oder Sprint-6-Aufgaben
4. **Bei offenen Fragen** zeitnah per Mail klären, nicht hinausschieben
