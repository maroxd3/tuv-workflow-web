# Backup- und Restore-Konzept

Stand: 2026-05-17
Architektur: On-Premise pro Prüfstelle, MariaDB lokal.

## 1. Bedrohungsmodell

Welche Vorfaelle muss eine Backup-Strategie abfangen?

| Szenario | Haeufigkeit | Schutz durch |
|---|---|---|
| Server-PC-Festplatte stirbt | alle 3–5 Jahre realistisch | Backup auf zweites Geraet |
| Mitarbeiter loescht Termin versehentlich | jederzeit möglich | Point-in-Time-Recovery (Stunden zurück) |
| Ransomware verschlüsselt den Server | selten, aber existenzbedrohend | Offsite-Backup auf getrenntem Konto |
| Werkstatt brennt ab, Server wird gestohlen | sehr selten | Offsite-Cloud-Backup ausserhalb des Gebaeudes |

Ein einfaches `mysqldump`-Cronjob auf der gleichen Festplatte schuetzt nur vor
dem ersten Szenario. Eine vollstaendige Strategie deckt alle vier ab.

## 2. 3-Tier-Strategie (3-2-1-Regel)

Die Industrie-Faustregel lautet: **3 Kopien, 2 verschiedene Medien, 1 ausser
Haus**.

```text
┌──────────────────────────────────────────────────────────────┐
│ TIER 1 — Hot: Binary Logs (kontinuierlich)                   │
│ MariaDB schreibt jede Schreiboperation in das Binary-Log.    │
│ Damit ist Point-in-Time-Recovery bis auf die Sekunde der     │
│ letzten 14 Tage möglich.                                    │
│ Speicherort: lokal, gleiche Festplatte (mysql-bin.*).        │
└──────────────────────────────────────────────────────────────┘
                          │
                          │ alle 6 Stunden
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ TIER 2 — Warm: verschlüsselter mysqldump                    │
│ Voller Datenbank-Dump, AES-256-verschlüsselt, auf einer     │
│ zweiten Festplatte oder einem NAS in der Werkstatt.          │
│ Rotation: 7 taegliche + 4 woechentliche + 12 monatliche.     │
└──────────────────────────────────────────────────────────────┘
                          │
                          │ taeglich, nachts
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ TIER 3 — Cold: Offsite (Cloud, verschlüsselt)               │
│ Verschlüsselter Dump auf einer Hetzner Storage Box (DE,     │
│ GDPR-konform). Konto gehoert dem Werkstatt-Inhaber, nicht    │
│ dem Software-Anbieter.                                       │
│ Aufbewahrung: 90 Tage rollierend.                            │
└──────────────────────────────────────────────────────────────┘
```

## 3. Warum diese Strategie sinnvoll ist

1. **Point-in-Time-Recovery via Binary Logs** — wird ein Termin versehentlich
   geloescht, kann auf den Stand 1 Minute vor dem Löschen zurückgerollt
   werden. Verlust: nur die seitdem geschriebenen Daten.
2. **Verschlüsselung BEVOR das Backup das Geraet verlaesst** — der
   Verschlüsselungsschlüssel liegt nicht auf dem Server. Selbst eine
   Ransomware, die den Server vollstaendig kompromittiert, kann die
   verschlüsselten Backups nicht manipulieren.
3. **Kunden-eigene Cloud (Hetzner)** — der Werkstatt-Inhaber besitzt das
   Cloud-Konto. Rechtlich sauber (keine Auftragsverarbeitung beim Software-
   Anbieter), datenschutztechnisch stark.
4. **Automatischer Restore-Test** — sonntaglich wird ein Backup probeweise auf
   eine Test-Datenbank zurückgespielt. Schlaegt der Restore fehl, geht eine
   E-Mail an den Werkstatt-Inhaber. So wird ein kaputtes Backup erkannt,
   bevor es im Ernstfall gebraucht wird.
5. **Versionierung mit Rotation** — ein Fehler faellt manchmal erst Wochen
   spaeter auf. Mehrere Generationen sind nötig, nicht nur "Backup von
   gestern".

## 4. Was im Repository umgesetzt ist

- `docker-compose.yml` startet MariaDB mit aktiviertem Binary-Logging
  (`log_bin`, `binlog_format=ROW`, `expire_logs_days=14`).
- `docker/mariadb/my.cnf` enthaelt die Binlog-Konfiguration.
- `/backups` ist als Volume in den Container gemounted (siehe
  `docker-compose.yml`).
- `.gitignore` schließt `/backups` aus.

## 5. Was am Kunden-Standort einmal eingerichtet wird

1. **Hetzner Storage Box bestellen** (https://www.hetzner.com/storage/storage-box)
   - Kleinste Variante reicht: BX11 mit 1 TB für rund 4 EUR/Monat
   - Konto-Inhaber: der Werkstatt-Inhaber persoenlich
2. **SFTP-Zugangsdaten** in `.env` auf dem Server-PC eintragen
3. **Verschlüsselungs-Schlüssel generieren** (256-Bit AES)
   - Schlüssel **ausgedruckt im Werkstatt-Tresor** aufbewahren
   - Schlüssel ist nicht wiederherstellbar — Verlust = Backup unbrauchbar
4. **Mitarbeiter-E-Mail** für Backup-Fehler-Alarmierung eintragen
5. **Erste Restore-Probe** gemeinsam durchfuehren

## 6. Notfall-Restore (Kurzfassung)

Bei Datenverlust:

```powershell
# 1. Container stoppen
docker compose down

# 2. Letztes Backup wiederherstellen
docker compose up -d db
docker exec -i tuv-mariadb mysql -u root -p"$MARIADB_ROOT_PASSWORD" `
  tuv_workflow < .\backups\latest\dump.sql

# 3. Point-in-Time bis zum Zeitpunkt X
docker exec -i tuv-mariadb mysqlbinlog `
  --stop-datetime="2026-05-17 14:31:00" `
  /var/lib/mysql/mysql-bin.000042 | docker exec -i tuv-mariadb mysql ...

# 4. API wieder starten
docker compose up -d
```

Detaillierte Restore-Prozedur folgt in `scripts/restore.sh`.

## 7. Offene Punkte

- [ ] `server/backup.js` — Cron-Skript für Tier 2 (verschlüsselter Dump alle 6h)
- [ ] `scripts/sync-offsite.sh` — Tier 3 SFTP-Sync zu Hetzner Storage Box
- [ ] `scripts/restore.sh` — 1-Befehl-Restore mit Timestamp-Parameter
- [ ] Wochentlicher automatisierter Restore-Test mit Mail-Alarmierung
- [ ] Kunden-Setup-Skript für Hetzner-Box-Konfiguration
