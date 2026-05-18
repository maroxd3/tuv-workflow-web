# Work Log — TUEV Pruefstelle Pro

Chronologische Session-Historie, **neueste oben**. Vor jeder neuen Session den
obersten Eintrag lesen, um den Stand zu kennen. Template fuer neue Eintraege
steht in `CLAUDE.md` Abschnitt 8.

---

## 2026-05-18 — Docker-Compose-Foundation + On-Premise-Doku

### **Was wurde gemacht**

- **`docker-compose.yml`** neu angelegt: 2 Services (`db` = MariaDB 11.4 mit
  Healthcheck, `api` = Node 20 Alpine mit Express). API wartet, bis DB
  healthy. Volumes: `mariadb_data` (persistent), `api_node_modules`,
  `./backups` als Bind-Mount fuer kuenftige Dump-Skripte.
- **`docker/mariadb/my.cnf`** neu: Binary Logging aktiviert
  (`log_bin`, `binlog_format=ROW`, `expire_logs_days=14`), `server_id=1`,
  `innodb_buffer_pool_size=256M`. **Damit ist Point-in-Time-Recovery
  technisch moeglich** — Voraussetzung fuer das dokumentierte Tier-1-Backup.
- **`docs/backup.md`** neu: 3-Tier-Strategie (hot binlog → warm verschluesselter
  Dump → cold offsite zu Hetzner Storage Box auf Kunden-Konto), Bedrohungs-
  modell mit 4 Szenarien, Notfall-Restore-Prozedur, Liste der noch offenen
  Skripte (`server/backup.js`, `scripts/sync-offsite.sh`, `scripts/restore.sh`).
- **`.env.example`** erweitert um `MARIADB_ROOT_PASSWORD`, mit Kommentaren
  fuer Docker-vs-manuell-Setup.
- **`.gitignore`**: `/backups/` ausgeschlossen (enthaelt Kundendaten).
- **Doku-Sweep** (Commit f6511f2):
  - `README.md`: Test-Badge 133→124, "TS strict"→"graduell", neues Architektur-
    Diagramm mit Empfang/Pruefer/Chef ueber LAN, Docker als empfohlener Weg,
    neue Deployment-Sektion fuer On-Premise.
  - `docs/design.md`: Section 7 komplett ueberarbeitet, Mermaid-Topologie,
    drei Betriebsarten.
  - `docs/mariadb-setup.md`: Docker-Variante voran, manueller Setup als
    Variante B, Firebase-Hinweis entfernt.
  - `docs/pflichtenheft.md`: Backup-Status praezisiert, Polling-Sync als
    offen, v3.1.
  - `docs/backlog.md`: US-11 "in Arbeit", US-15/16/17 ergaenzt, Sprint 9
    aufgenommen.
  - `docs/testkonzept.md`: Docker-Smoke-Test, WF-01-API-Test als naechster
    Schritt.
  - `tsconfig.json`: Dead-Reference `drizzle.config.ts` entfernt,
    `server/**/*` aufgenommen.

### **Stand jetzt**

- **Branch:** `feat/docker-compose` (lokal, **nicht gepusht**)
- **Letzte Commits:**
  - `f6511f2` Document on-premise model and Docker workflow
  - `b24b209` Add docker-compose foundation with binlog-enabled MariaDB
- **Tests:** `npm run typecheck` gruen. `npm test` und Docker-Stack noch nicht
  ausgefuehrt (Docker nicht installiert).
- **Working tree:** sauber.
- **Was funktioniert garantiert:** Doku-Aenderungen sind reine Markdown-Edits.
  Typecheck laeuft. Kein Code-Verhalten geaendert.
- **Was noch ungetestet ist:** Der komplette Docker-Stack. Marwan muss Docker
  Desktop installieren und `docker compose up -d` ausfuehren, bevor wir
  pushen koennen.

### **Naechste Schritte (Reihenfolge)**

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
5. **Step 3:** API-Tests fuer `PATCH /api/termine/:id/status` (mit HM/GM +
   ohne) gegen eine Docker-MariaDB. ADR-003 fordert das explizit.
6. **Step 4:** `server/backup.js` (Cron-Skript fuer Tier-2-Dumps,
   AES-256-verschluesselt).
7. **Step 5:** `scripts/sync-offsite.sh` (Tier-3-SFTP-Sync zu Hetzner
   Storage Box).
8. **Polling-Sync** im `useDb.ts` (~5 Zeilen, fuer Multi-User-Live-Updates
   im LAN).

### **Offene Fragen / Blockers**

- **Docker noch nicht installiert.** Blockt Step 2 (Trigger braucht
  laufende MariaDB zum Testen), Step 3, 4, 5.
- **`praesentation.html` im Repo-Root** ist die alte Sprint-5-Praesentation,
  die noch fuer Firestore argumentiert (900 Zeilen). Entscheidung steht aus:
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

# Demo-Daten + Pruefung
Invoke-RestMethod -Method Post http://localhost:8787/api/admin/demo
Invoke-RestMethod http://localhost:8787/api/fahrzeuge | Measure-Object
# Erwartet: Count : 8

# Binlog laeuft?
docker exec tuv-mariadb ls -la /var/lib/mysql/ | findstr mysql-bin
# Erwartet: mysql-bin.000001 + mysql-bin.index
```

Wenn alles laeuft: `git push -u origin feat/docker-compose`, dann Step 2.

### **Memory-Kontext fuer kuenftige Sessions**

- Marwan ist Kfz-Gutachter + Hochschule-Student. iPhone-Nutzer, PowerShell auf
  Windows 11.
- Frau Fuchs **lehrt MariaDB** im Modul Datenbanksysteme — deswegen wurde von
  PGlite weg auf MariaDB migriert. Das war strategisch richtig.
- Marwans Vision: jede TUEV-Werkstatt bekommt eigenes On-Premise-Setup mit
  eigener MariaDB. Verkauf als Installations-Paket inkl. Backup-Konfiguration.
- Oussama Hlayhel hat 15.-17.05.2026 die MariaDB-Migration via Codex gemacht,
  mit 10 "Restore..."-Commits am Ende (Codex hat erst Sachen geloescht und
  musste sie zurueckholen). Daher Vorsicht: bei kuenftigen grossen Refactors
  vorher Sicherheitsbackup oder feature-branch.

---

<!-- Aeltere Eintraege folgen darunter, neueste IMMER oben. -->
