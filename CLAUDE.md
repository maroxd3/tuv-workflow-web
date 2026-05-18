# Hinweise für Claude in diesem Repo

Diese Datei wird bei jedem Session-Start automatisch in den Claude-Kontext
geladen. Sie enthaelt das Wichtigste, damit man nach einer Pause sofort
weitermachen kann.

## 1. WICHTIG: Vor jeder Änderung WORK_LOG.md lesen

Der **oberste Eintrag** in `WORK_LOG.md` beschreibt den letzten Stand, offene
Punkte und die nächsten Schritte. Immer zuerst dort reinschauen, sonst riskiert
man, schon Erledigtes nochmal zu machen oder einen halben Branch zu verpassen.

```powershell
Get-Content WORK_LOG.md -TotalCount 80
```

Nach jeder Arbeitssession (oder wenn Marwan sagt "save", "checkpoint",
"morgen weiter", "hoere auf für heute"): einen **neuen Eintrag oben in
`WORK_LOG.md` einfuegen** mit dem unten beschriebenen Template.

## 2. Projekt-Kurzfassung

- **Was:** Verwaltungssystem für TÜV-Prüfstellen (Termine, Fahrzeuge,
  Mängel, Statistik, Berichte)
- **Stack:** React 19 + Vite + TypeScript graduell, Express 5 API, MariaDB 11
- **Produktmodell:** On-Premise pro Prüfstelle (kein Cloud-Multi-Tenant).
  Jeder Kunde betreibt seinen eigenen Server-PC im LAN.
- **Hochschul-Kontext:** Software-Projekt IIM-211-01, Dozentin Frau Fuchs
  (Datenbank-Spezialistin), Team Marwan + Oussama Hlayhel
- **Live-Frontend:** `tuv-workflow.web.app` zeigt nur das statische Frontend;
  die `/api`-Calls gehen ins Leere, weil On-Premise. Demo laeuft lokal.

## 3. Repo-Landkarte

```text
server/             Express-API + MariaDB-Pool (server/index.js, server/db.js)
src/                Frontend
  db/apiClient.ts   HTTP-Client für /api
  hooks/useDb.ts    State-Hook über apiClient
  hooks/useStoreCompat.ts  Adapter zwischen API-Form und Legacy-View-Form
  views/            Tagesplan, Fahrzeuge, Statistik, Berichte
  features/         Modale (Fahrzeug, Termin, Mangel)
  tests/            Vitest-Tests (nur Frontend; Server-Tests fehlen noch)
docker-compose.yml  Stack mit MariaDB (binlog an) + API
docker/mariadb/     MariaDB-Konfiguration (my.cnf mit binlog)
docs/               Projekt- und Abgabe-Dokumentation (siehe README)
docs/decisions/     ADRs (Architecture Decision Records)
```

## 4. Wichtige Konventionen

- **Commit-Stil:** Kurzer Imperativ-Englisch-Titel (max 70 Zeichen), wie Oussama
  schreibt: "Add X", "Fix Y", "Restore Z". Body optional.
- **Branches:** `feat/<thema>`, `fix/<thema>`. master ist geschuetzt-ish.
- **Pre-Commit:** `npm run typecheck` muss durchlaufen.
- **Tests:** Vor jedem Push: `npm test` + `npm run typecheck` + `npm run build`.
- **`.env`** wird nie committed. `.env.example` ist die Vorlage.
- **`/backups/`** wird nie committed (enthaelt Kundendaten).

## 5. Sensible Punkte / typische Fettnaepfe

- **Frau Fuchs ist Datenbank-Spezialistin.** Sie bewertet primaer durch
  DB-Brille (3NF, FKs, Constraints, Trigger/Procedures). UI/Tests/CI sind ihr
  zweitrangig. Default-Note ~3,0; für 1,x muss sie überrascht werden.
- **WF-01-Regel ("kein Bestanden bei HM/GM")** ist im UI und in der API
  durchgesetzt, aber **NICHT** in MariaDB selbst. Nächster Schritt ist ein
  Trigger oder eine Stored Procedure als 3. Defense-Layer.
- **Server-Layer hat 0% Test-Coverage.** Frontend hat 95%+. API-Tests für
  `PATCH /api/termine/:id/status` sind in ADR-003 explizit gefordert, aber
  noch nicht da.
- **Tests:** 124 grun (Stand 17.05.2026). Nicht 133 (alte Zahl aus PGlite-Zeit).

## 6. Was niemals einfach so machen

- master nicht direkt anfassen — Feature-Branch und Commit.
- Keine destruktiven git-Operationen (`reset --hard`, `force push`, `clean -f`)
  ohne explizites OK von Marwan.
- Keine neuen Abhängigkeiten installieren ohne abzuklaeren — Repo soll schlank
  bleiben (Bachelor-Niveau-Overshoot vermeiden, kein Storybook, Playwright,
  Code-Splitting etc).
- Keine PGlite-/Drizzle-Reste mehr einbauen. Das ist die alte Architektur,
  wurde am 15.-17.05.2026 entfernt.

## 7. Quick-Commands für den Wiedereinstieg

```powershell
# Repo-Stand prüfen
cd C:\Users\Marwan\tuv-workflow-web
git status
git log --oneline -10
git branch --show-current

# Letzten WORK_LOG-Eintrag lesen
Get-Content WORK_LOG.md -TotalCount 80

# Docker-Stack starten (siehe WORK_LOG für Test-Schritte)
docker compose up -d
docker compose logs -f api
Invoke-RestMethod http://localhost:8787/api/health

# Tests + Typecheck
npm test
npm run typecheck
```

## 8. Template für neue WORK_LOG-Eintraege

Format ist bewusst kompakt. Pflichtfelder sind fett. Neueste Eintraege immer
**oben**.

```markdown
## YYYY-MM-DD — [Kurztitel der Session]

### **Was wurde gemacht**
- Stichpunkt 1
- Stichpunkt 2

### **Stand jetzt**
- Branch: `<branch-name>` (lokal / gepusht)
- Letzte Commits: `<sha> <titel>`
- Tests: gruen / rot / nicht gelaufen
- Was funktioniert / was hakt

### **Nächste Schritte (Reihenfolge)**
1. ...
2. ...

### **Offene Fragen / Blockers**
- ...

### **Zum Wiedereinsteigen**
- Wo: Datei + Zeile, oder Befehl
- Was zuerst: "git status", "docker compose up", o.ae.
```
