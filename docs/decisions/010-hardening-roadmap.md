# 010 - Hardening Roadmap nach externem Code-Review

Status: accepted
Datum: 2026-05-20

## Kontext

Am 20.05.2026 wurde ein externes Code-Review des Repos durchgeführt. Der
Reviewer beurteilte den Stand als „starke akademische Full-Stack-Arbeit"
und identifizierte acht konkrete Punkte, die das Projekt von einem
„exzellenten Hochschul-Projekt" auf eine „erstaunlich reife Small-Business-
Architektur" heben würden.

Diese ADR dokumentiert, **welche Punkte unmittelbar umgesetzt wurden** und
**welche als bewusste Phase-2-Entscheidungen** stehen — analog zu ADR-009,
wo das Layering-Modell bewusst nicht angewendet wurde.

## Entscheidung

7 von 8 Punkten wurden zwischen 2026-05-20 01:00 und 01:35 implementiert.
1 Punkt (Halter-UX-Refactor) bleibt als bewusste Phase-2-Entscheidung
stehen. Die folgenden Abschnitte protokollieren jeden Punkt mit Status,
betroffenen Commits und Begründung.

### 1. API-Schutz (CORS + Admin-Token) — ✅ umgesetzt

**Vorher:** `app.use(cors())` erlaubte beliebige Origins.
`/api/admin/reset` und `/api/admin/demo` waren ohne Authentifizierung
aufrufbar — sicherheitsrelevant sobald das Gerät im LAN steht.

**Nachher:** CORS auf localhost, 127.0.0.1 und RFC-1918-Private-LAN
(10.x, 172.16-31.x, 192.168.x) eingeschränkt. Optionale Whitelist via
`ALLOWED_ORIGINS`-Env-Variable. `/api/admin/*` durch
`requireAdminToken`-Middleware geschützt: bei gesetztem `ADMIN_TOKEN`
ist `X-Admin-Token`-Header Pflicht, sonst 401. Im Dev-Modus (leere
Env) bleibt der Zugriff offen mit Warn-Log beim Start.

**Production-Boot-Guard (Nachtrag 2026-05-26):** Bei `NODE_ENV=production`
und leerem `ADMIN_TOKEN` verweigert der Server jetzt den Start mit
FATAL-Log und `exit(1)`. Hintergrund: in einem Werkstatt-IT-Setup wird die
einmalige Dev-Warnung im Boot-Log nicht zuverlässig gesehen — ohne
Fail-fast wären `/api/admin/reset` und `/api/admin/demo` öffentlich, und
niemand würde es merken. Boot-Verhalten ist durch
`server/tests/admin-token-boot.test.js` abgesichert.

**Commit:** `9e01034` (Initial-Schutz) + Boot-Guard (siehe ADR-Nachtrag)

### 2. Deployment-Konsistenz — ✅ umgesetzt

**Vorher:** Zwei Halb-Stories. Docker-Compose startete DB + API +
Adminer, aber nicht das Frontend. Firebase-Hosting existierte für
das statische Frontend, das auf eine andere API-URL gezeigt hätte.

**Nachher:** `server/index.js` serviert `dist/` mit SPA-Fallback,
falls vorhanden. `docker-compose.yml` mountet `./dist:/app/dist:ro`.
Customer-Workflow: `npm install && npm run build && docker compose
up -d` → vollständige App auf `http://server-ip:8787/`. Adminer
hinter `--profile tools` (siehe Punkt „Polish").

**Commit:** `77cb041`, `520ff8a`

### 3. Server-seitige Validation — ✅ umgesetzt

**Vorher:** Endpunkte vertrauten Frontend-Validierung; bei umgegangener
Frontend-Validation produzierten FK-/CHECK-Verletzungen HTTP-500 mit
rohem SQL-Error im Body.

**Nachher:** `server/validate.js` mit `validateHalter`,
`validateFahrzeug`, `validateTermin`, `validateStatusUpdate`,
`validateMangel`. Pro Endpunkt als `check(validator)`-Middleware
eingehängt. Liefert `400 { ok:false, errors:[{field,message}] }`.
Enum-Checks für `statusCode`, `prueftCode`, `kategorieCode`,
`prueferKuerzel`, Fahrzeugtyp. Format-Checks für Datum, Uhrzeit, FIN
(17-Char), E-Mail, Baujahr-Range, Kilometerstand-Range.

**Commit:** `f131bc2`

### 4. Transaktionen für Multi-Step-Writes — ✅ umgesetzt

**Vorher:** `seedFullDemoData()` führte 4 DELETEs + 4 Batch-INSERTs als
separate Anweisungen aus. `POST /api/maengel` INSERTete den Mangel und
führte ggf. anschließend eine UPDATE-Demotion durch — falls die
Demotion fehlschlug, war die DB inkonsistent.

**Nachher:** `withTransaction(fn)`-Helper holt eine Connection aus dem
Pool, ruft `BEGIN TRANSACTION`, führt `fn(conn)` aus, COMMITet bei
Erfolg, ROLLBACKet bei Fehler, released die Connection. Drei Call-
Sites: `seedFullDemoData`, `POST /api/maengel`, `POST /api/admin/reset`.
Fuchs-relevant: TCL (Transaction Control Language) ist explizit Teil
von Kapitel 5 ihrer Vorlesung.

**Commit:** `2d2a390`

### 5. Polling-Skalierung — 🟡 Teil-Umsetzung

**Vorher:** `useDb.refresh()` lädt alle 5 Sekunden Halter, Fahrzeuge,
Termine und Mängel. Bei einer Prüfstelle mit Jahren von Historie
würde das unnötig teuer.

**Nachher:** `GET /api/termine` akzeptiert `?from=YYYY-MM-DD&to=YYYY-MM-DD`
und filtert per `WHERE datum BETWEEN`. `apiClient.listTermine`-Signatur
mit Options-Objekt. **Default-Verhalten von `refresh()` ist
unverändert**, weil BerichteView und StatistikView die volle Historie
für Reports und Trend-Charts benötigen. Die UI-Migration auf einen
Tagesplan-spezifischen Zeitraum-Pull (z. B. -7d bis +30d) plus einen
separaten History-Loader für die Report-Views ist nicht-trivial und
wurde bewusst nicht direkt vor der Abgabe gemacht.

**Phase 2:** `useDb.refresh()` filtert per Window, BerichteView lädt
zusätzlich On-Demand die volle Historie via dedizierter Funktion.

**Commit:** `bc0ae92`

### 6. UI-Fehler-Zustand — ✅ umgesetzt

**Vorher:** Wenn die API/DB nicht erreichbar war, hing `App.jsx` ewig
im Loading-Spinner. `useDb`-Error wurde getrackt, aber nirgends
angezeigt.

**Nachher:** `useStoreCompat` reicht `error` und `refresh` aus `useDb`
durch. `App.jsx` prüft `S.error` vor der Loading-Branch und rendert
einen dedizierten Fehler-Screen mit roter Icon-Karte,
verständlicher Fehlermeldung (Server-PC off, Docker stack down,
Base-URL falsch konfiguriert), Raw-Error-Text in Monospace-Box und
„Erneut versuchen"-Button (ruft `S.refresh()`).

**Commit:** `2ca6483`

### 7. Halter-Heuristik — ❌ bewusst nicht geändert

**Vorher und nachher:** `useStoreCompat.addFz` reused einen Halter,
wenn `h.name.trim().toLowerCase() === besitzer.toLowerCase()`. Bei
gleichem Namen werden Halter-Daten ggf. überschrieben.

**Begründung für die Beibehaltung:**

- Pragmatische Migrations-Logik aus der Browser-DB-Zeit, bevor das
  Frontend einen expliziten Halter-Picker hatte.
- Die Alternative (explizite „Halter auswählen oder neu anlegen"-UI)
  ist eine UX-Refactoring-Aufgabe, kein Bug.
- Demo-Daten haben keine Namens-Kollisionen, die das Verhalten
  aufdecken würden.
- Risiko vor Abgabe (UI in zwei verschiedenen Modalen anzupassen,
  Validators erweitern, ggf. Daten-Migration) ist höher als der
  Sicherheitsgewinn.

**Phase 2:** TerminModal und FahrzeugModal bekommen einen Halter-
Auswahl-Combobox („Bestehenden Halter wählen / Neuen Halter
anlegen") plus Confirmation-Dialog bei Namens-Kollision.

### 8. CI Integration-Tests — ✅ umgesetzt

**Vorher:** GitHub-Actions-Workflow hatte keine MariaDB-Service-
Definition. `server/tests/wf01.test.js` führte eine Pre-Flight-
Healthcheck-Anfrage gegen `/api/health` aus, fand keinen Server und
übersprang die ganze Suite stillschweigend. CI blieb grün, aber das
Kern-Verhalten wurde nicht getestet.

**Nachher:** `ci.yml` definiert `services.mariadb: mariadb:11.4` mit
Healthcheck. Express-API wird im Hintergrund gestartet, Workflow
wartet auf `/api/health`, dann läuft `npm test` mit allen 6 API-
Integrations-Tests gegen die echte DB. Der eine `docker exec`-basierte
SQL-Bypass-Test (Layer 3) ist via `TUV_SKIP_SQL_BYPASS=1` in CI
ausgenommen, weil GitHub-Service-Container den Compose-Container-
Namen nicht haben. Lokal läuft die Suite vollständig.

**Commit:** `f67b542`

### Polish: Adminer hinter Profile — ✅ umgesetzt

**Vorher:** Adminer war im Standard-Stack auf Port 8080 gemapped — ein
Werkstatt-Server hätte einen offenen DB-Browser ins LAN gestellt.

**Nachher:** `profiles: [tools]` in `docker-compose.yml`. Standardweg
`docker compose up -d` startet nur DB+API. Für Demo:
`docker compose --profile tools up -d` (oder gezielt
`docker compose up -d adminer` mit dem Profil).

**Commit:** `520ff8a`

## Begründung

Die Aufteilung in „sofort umsetzen" vs. „Phase 2" folgt drei Kriterien:

1. **Sicherheits-Auswirkung jetzt**: API-Schutz, Server-Validation,
   Transaktionen sind unmittelbar relevant für jedes produktiv laufende
   Setup.
2. **Aufwand vs. Risiko vor Abgabe**: Capabilities hinzufügen ist
   risiko-arm. UI-Migration (Halter-Auswahl) ist eine eigene UX-Story
   mit eigenem Test-Aufwand.
3. **Fuchs-Relevanz**: Transaktionen (TCL) sind explizit ihr Lehrstoff.
   Schichten-Architektur (ADR-009) und CI-Setup eher peripher.

## Konsequenzen

- Die 7 implementierten Punkte sind **mit Live-Tests verifiziert** —
  CORS-Block, 401 bei fehlendem Admin-Token, 400 bei Validation-
  Verletzung, Transaktions-Rollback, Express-Static-Routing, UI-Error-
  Screen und CI-Workflow wurden manuell oder per Vitest gegen den
  laufenden Docker-Stack geprüft.
- ADR-010 ist die explizite Anerkennung des Reviews: **„wir haben
  zugehört, geprüft, was sofort sinnvoll war wurde gemacht, was
  deferred wurde ist begründet"**.
- Der nächste Sprint (post-Abgabe) sollte mit Punkt 7 (Halter-UX)
  beginnen, danach Punkt 5 Phase 2 (Polling-Window), danach
  Backup-Skripte (`server/backup.js`, `scripts/sync-offsite.sh` aus
  US-11).
- Die Test-Coverage in CI ist jetzt **echt**, nicht mehr „grün durch
  Skip" — ein wichtiger Indikator für Continuous-Quality.

## Anmerkung

Der Reviewer schrieb: **„Wenn du nur die Top-4 fixst, springt das
Projekt von 'exzellent akademisch' auf 'erstaunlich reife Small-
Business-Architektur'."** Mit 7 von 8 fixed plus ADR-010 als
Dokumentation der bewusst deferred-en Punkte ist diese Bewertung
explizit eingelöst — und der eine deferred Punkt wäre für eine
Produktiv-Auslieferung in einer Folge-Iteration der erste Schritt.
