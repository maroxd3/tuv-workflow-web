# Work Log — TÜV Prüfstelle Pro

Chronologische Session-Historie, **neueste oben**. Vor jeder neuen Session den
obersten Eintrag lesen, um den Stand zu kennen. Template für neue Eintraege
steht in `CLAUDE.md` Abschnitt 8.

---

## 2026-05-18 (abends) — WF-01 DB-Trigger + Adminer + HU-Richtlinie-Refactor

### **Was wurde gemacht**

**1. Docker-Stack getestet (Step 2 aus dem Morgen-Eintrag):**
- `docker compose up -d` laeuft, beide Container healthy.
- Demo-Daten geseedet (8/8/13/12), Binlog aktiv (`mysql-bin.000001` etc.).
- Alle drei WF-01-Szenarien gruen.

**2. WF-01 als DB-Trigger (3. Defense-Layer) — Branch `feat/wf01-trigger`:**
- `server/db.js`: `migrateTriggers()` mit
  `trg_termin_wf01_update BEFORE UPDATE ON termin`. Wirft `SIGNAL SQLSTATE
  '45000'` bei blockierendem Mangel.
- `server/index.js`: Error-Handler mappt SQLSTATE 45000 auf HTTP 422 mit
  `{ok:false, reason}`. Vorher kam ein 500.
- `docker/mariadb/my.cnf`: `log_bin_trust_function_creators = 1` ergaenzt,
  damit `tuv_app`-Nutzer Trigger anlegen darf bei aktivem Binlog.
- ADR-003 auf 3-Layer-Modell aktualisiert.

**3. Adminer als 3. Container im Stack:**
- `docker-compose.yml`: Service `adminer` (`adminer:5.4.0`) auf Port 8080,
  Design "nette", `ADMINER_DEFAULT_SERVER=db`.
- Erreichbar unter `http://localhost:8080`, Login `tuv_app` / `tuv_app_pw`
  auf DB `tuv_workflow`.

**4. HU-Richtlinie-Refactor (Marwan hat als Kfz-Gutachter den
Modellierungs-Fehler entdeckt):**
- **Alt:** 5 Kategorien OM/GM/EM/GfM, dabei GM = "Gefährlich", HM blockt,
  EM blockt NICHT — falsch nach §29 StVZO.
- **Neu:** 4 Kategorien OM/GM/EM/GfM nach HU-Richtlinie. EM und GfM
  blockieren. GM heißt jetzt "Geringer Mangel" (vorher LM).
- `migrateCategories()` in `server/db.js` migriert bestehende Daten via
  `ON UPDATE CASCADE` der FK `mangel.kategorie_code`: GM(alt) → GfM, LM → GM,
  HM → EM (per UPDATE auf `mangel`, dann DELETE der HM-Zeile aus
  `mangel_kategorie`). EM auf `blockiert_bestanden=TRUE` gesetzt.
- Idempotent — laeuft auf migrierter DB ohne Effekt.

**5. `behoben=TRUE`-Check überall:**
- Trigger ignoriert behobene Mängel (`AND m.behoben = FALSE`).
- API-Guard in `/status` und Auto-Demotion in `POST /api/mängel` analog.
- Frontend `hatBlockierendenMangel` und `validateStatusWechsel` analog.

**6. Frontend-Refactor:**
- `src/constants/mangel.js`: `MANGEL_KATEGORIEN` umgebaut auf 4 Codes mit
  `blockiert:true/false` Flag. Katalog (180 Eintraege) auf neue Codes
  migriert (`HM`→`EM`, `LM`→`GM`, `GM`→`GfM`).
- `src/utils/mangel.js`: `hatBlockierendenMangel` neu (mit behoben-Check),
  `hatHauptmangel` als Alias.
- `src/utils/validators.js`: `validateStatusWechsel` auf EM/GfM + behoben.
- Views (`TagesplanView`, `BerichteView`), Components (`MangelPill`,
  `HauptmangelBadge`), Types (`propTypes`) auf neue Codes.
- Tests (`mangel.test.js`, `validators.test.js`) angepasst, 5 neue Cases.

**7. Erklaer-Seite für Marwan:**
- `docs/wf01-defense-layers.html` — Werkstatt-Analogie (Tablet/Empfang/
  Aktenschrank) mit 3 Waechtern und 3 Schummel-Szenarien.

### **Stand jetzt**

- **Branch:** `feat/wf01-trigger` (lokal, **nicht gepusht**)
- **Last Commits:** noch ungepusht — alle Änderungen liegen im Working Tree.
- **Tests:** 129/129 gruen (vorher 124 — 5 neue Cases dazu).
- **Typecheck:** sauber.
- **Docker-Stack:** alle 3 Container Up (`tuv-mariadb` healthy, `tuv-api`,
  `tuv-adminer`).
- **DB-Inhalt:** 4 Kategorien (OM/GM/EM/GfM), 12 Demo-Mängel verteilt
  (10×EM, 1×GfM, 1×GM).
- **3 Defense-Layer verifiziert:**
  - SQL-Bypass: `ERROR 1644 (45000): WF-01: BESTANDEN nicht möglich bei
    erheblichem oder gefährlichem Mangel`
  - Generic PATCH: HTTP 422 mit gleichem Reason
  - Status-Endpoint: API-Layer-Antwort (200 + `ok:false`)
- **Regression:** Termin mit `EM behoben=TRUE` bleibt auf "Bestanden".

### **Nächste Schritte (Reihenfolge)**

1. **Commit + Push** der `feat/wf01-trigger`-Änderungen (Marwan-Entscheidung
   ob ein oder mehrere Commits).
2. **API-Tests schreiben** (ADR-003 fordert das explizit) — supertest gegen
   die Docker-MariaDB, alle 3 Layer.
3. **Mail an Frau Fuchs** mit Update (in `docs/antwort_mail_fuchs.md`).
4. **Doku-Sweep:** README, design.md, pflichtenheft, testkonzept, datenmodell,
   ki-nutzung.md auf neue Kategorie-Codes prüfen.
5. **`backups/`-Skripte** (`server/backup.js`, `scripts/sync-offsite.sh`).

### **Offene Fragen / Blockers**

- **Doku-Drift:** README/design/pflichtenheft erwaehnen noch HM/LM. Sind aber
  nicht kritisch für den nächsten Fuchs-Termin — DB+Code sind sauber.
- **`praesentation.html`** noch nicht aktualisiert (alte 5-Kategorien-Tabelle
  in der DB-Schema-Folie). Entscheidung: Banner einfuegen, archivieren,
  oder Folie neu? Steht weiter offen.

### **Zum Wiedereinsteigen**

```powershell
cd C:\Users\Marwan\tuv-workflow-web
git status                       # zeigt geänderte Files in feat/wf01-trigger
git diff --stat                  # überblick
docker compose ps                # alle 3 Container Up?
Invoke-RestMethod http://localhost:8787/api/health
Start-Process http://localhost:8080   # Adminer

# Falls Stack down ist:
docker compose up -d
```

### **Memory-Kontext für kuenftige Sessions**

- Marwan ist Kfz-Gutachter — seine Domain-Expertise ist Gold wert, hat heute
  den HM/EM/GM-Modellierungs-Fehler aufgedeckt. Bei zukünftigen
  Modellierungs-Fragen ihn aktiv fragen ("ist das nach §29 StVZO so
  korrekt?").
- Adminer (`localhost:8080`) ist Marwans Fenster in die DB. Wenn er etwas
  fragt wie "wie sieht das aus in der DB", zuerst auf Adminer verweisen.
- "Werkstatt-Analogie" funktioniert für DB-Erklaerungen: Tablet/Empfang/
  Aktenschrank/Waechter. Wird auf Wunsch wieder benutzen.

---

## 2026-05-18 — Docker-Compose-Foundation + On-Premise-Doku

> **Update am Ende der Session:** Branch `feat/docker-compose` ist nach
> GitHub gepusht (3 Commits). Marwan startet jetzt den PC neu, damit Docker
> Desktop nach der Installation lauffaehig ist. Nächster Schritt nach
> Neustart: `docker compose up -d` testen (Anleitung unten unter "Zum
> Wiedereinsteigen"). Wenn das laeuft, weiter mit Step 2 (WF-01-Trigger).

### **Was wurde gemacht**

- **`docker-compose.yml`** neu angelegt: 2 Services (`db` = MariaDB 11.4 mit
  Healthcheck, `api` = Node 20 Alpine mit Express). API wartet, bis DB
  healthy. Volumes: `mariadb_data` (persistent), `api_node_modules`,
  `./backups` als Bind-Mount für kuenftige Dump-Skripte.
- **`docker/mariadb/my.cnf`** neu: Binary Logging aktiviert
  (`log_bin`, `binlog_format=ROW`, `expire_logs_days=14`), `server_id=1`,
  `innodb_buffer_pool_size=256M`. **Damit ist Point-in-Time-Recovery
  technisch möglich** — Voraussetzung für das dokumentierte Tier-1-Backup.
- **`docs/backup.md`** neu: 3-Tier-Strategie (hot binlog → warm verschlüsselter
  Dump → cold offsite zu Hetzner Storage Box auf Kunden-Konto), Bedrohungs-
  modell mit 4 Szenarien, Notfall-Restore-Prozedur, Liste der noch offenen
  Skripte (`server/backup.js`, `scripts/sync-offsite.sh`, `scripts/restore.sh`).
- **`.env.example`** erweitert um `MARIADB_ROOT_PASSWORD`, mit Kommentaren
  für Docker-vs-manuell-Setup.
- **`.gitignore`**: `/backups/` ausgeschlossen (enthaelt Kundendaten).
- **Doku-Sweep** (Commit f6511f2):
  - `README.md`: Test-Badge 133→124, "TS strict"→"graduell", neues Architektur-
    Diagramm mit Empfang/Prüfer/Chef über LAN, Docker als empfohlener Weg,
    neue Deployment-Sektion für On-Premise.
  - `docs/design.md`: Section 7 komplett überarbeitet, Mermaid-Topologie,
    drei Betriebsarten.
  - `docs/mariadb-setup.md`: Docker-Variante voran, manueller Setup als
    Variante B, Firebase-Hinweis entfernt.
  - `docs/pflichtenheft.md`: Backup-Status praezisiert, Polling-Sync als
    offen, v3.1.
  - `docs/backlog.md`: US-11 "in Arbeit", US-15/16/17 ergaenzt, Sprint 9
    aufgenommen.
  - `docs/testkonzept.md`: Docker-Smoke-Test, WF-01-API-Test als nächster
    Schritt.
  - `tsconfig.json`: Dead-Reference `drizzle.config.ts` entfernt,
    `server/**/*` aufgenommen.

### **Stand jetzt**

- **Branch:** `feat/docker-compose` (lokal, **nicht gepusht**)
- **Letzte Commits:**
  - `f6511f2` Document on-premise model and Docker workflow
  - `b24b209` Add docker-compose foundation with binlog-enabled MariaDB
- **Tests:** `npm run typecheck` gruen. `npm test` und Docker-Stack noch nicht
  ausgeführt (Docker nicht installiert).
- **Working tree:** sauber.
- **Was funktioniert garantiert:** Doku-Änderungen sind reine Markdown-Edits.
  Typecheck laeuft. Kein Code-Verhalten geändert.
- **Was noch ungetestet ist:** Der komplette Docker-Stack. Marwan muss Docker
  Desktop installieren und `docker compose up -d` ausführen, bevor wir
  pushen können.

### **Nächste Schritte (Reihenfolge)**

1. **Docker Desktop installieren** auf Marwans Rechner
   (https://www.docker.com/products/docker-desktop/, PC neu starten danach).
2. **Stack testen** mit den Schritten unten unter "Zum Wiedereinsteigen".
   Wenn `/api/health` `{ok:true}` liefert: Step 3.
3. **Branch pushen:** `git push -u origin feat/docker-compose` — danach
   PR aufmachen oder direkt mergen.
4. **Step 2 (Hauptarbeit):** WF-01 als **MariaDB-Trigger oder Stored
   Procedure** einbauen. Migration in `server/db.js` ergaenzen, sodass beim
   Start automatisch ein Trigger angelegt wird, der verhindert, dass
   `termin.status_code = 'Bestanden'` gesetzt werden kann, solange es einen
   blockierenden Mangel gibt. **Das ist der Fuchs-Pleaser**, der die Note
   zwischen 2,3 und 1,7 verschiebt.
5. **Step 3:** API-Tests für `PATCH /api/termine/:id/status` (mit HM/GM +
   ohne) gegen eine Docker-MariaDB. ADR-003 fordert das explizit.
6. **Step 4:** `server/backup.js` (Cron-Skript für Tier-2-Dumps,
   AES-256-verschlüsselt).
7. **Step 5:** `scripts/sync-offsite.sh` (Tier-3-SFTP-Sync zu Hetzner
   Storage Box).
8. **Polling-Sync** im `useDb.ts` (~5 Zeilen, für Multi-User-Live-Updates
   im LAN).

### **Offene Fragen / Blockers**

- **Docker noch nicht installiert.** Blockt Step 2 (Trigger braucht
  laufende MariaDB zum Testen), Step 3, 4, 5.
- **`praesentation.html` im Repo-Root** ist die alte Sprint-5-Präsentation,
  die noch für Firestore argumentiert (900 Zeilen). Entscheidung steht aus:
  Banner einfuegen, archivieren oder so lassen?
- **WF-01-Trigger-Variante** noch nicht entschieden: Trigger BEFORE UPDATE
  oder Stored Procedure mit RAISE EXCEPTION? Beides geht in MariaDB, beide
  argumentativ sauber. Klaeren beim Coden.

### **Zum Wiedereinsteigen**

```powershell
# Wo bin ich?
cd C:\Users\Marwan\tuv-workflow-web
git status
git log --oneline -5
# Erwartet: HEAD = f6511f2 auf feat/docker-compose

# Docker-Stack testen
copy .env.example .env       # falls .env noch nicht da
docker compose up -d
docker compose ps            # beide "Up", db "(healthy)"
Invoke-RestMethod http://localhost:8787/api/health
# Erwartet: ok : True

# Demo-Daten + Prüfung
Invoke-RestMethod -Method Post http://localhost:8787/api/admin/demo
Invoke-RestMethod http://localhost:8787/api/fahrzeuge | Measure-Object
# Erwartet: Count : 8

# Binlog laeuft?
docker exec tuv-mariadb ls -la /var/lib/mysql/ | findstr mysql-bin
# Erwartet: mysql-bin.000001 + mysql-bin.index
```

Wenn alles laeuft: `git push -u origin feat/docker-compose`, dann Step 2.

### **Memory-Kontext für kuenftige Sessions**

- Marwan ist Kfz-Gutachter + Hochschule-Student. iPhone-Nutzer, PowerShell auf
  Windows 11.
- Frau Fuchs **lehrt MariaDB** im Modul Datenbanksysteme — deswegen wurde von
  PGlite weg auf MariaDB migriert. Das war strategisch richtig.
- Marwans Vision: jede TÜV-Werkstatt bekommt eigenes On-Premise-Setup mit
  eigener MariaDB. Verkauf als Installations-Paket inkl. Backup-Konfiguration.
- Oussama Hlayhel hat 15.-17.05.2026 die MariaDB-Migration via Codex gemacht,
  mit 10 "Restore..."-Commits am Ende (Codex hat erst Sachen gelöscht und
  musste sie zurückholen). Daher Vorsicht: bei kuenftigen großen Refactors
  vorher Sicherheitsbackup oder feature-branch.

---

<!-- Aeltere Eintraege folgen darunter, neueste IMMER oben. -->
