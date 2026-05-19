# 009 - Monolithischer Server statt geschichteter Architektur

Status: accepted
Datum: 2026-05-19

## Kontext

Das Express-Backend liegt aktuell in einer einzigen Datei `server/index.js`
(~400 LOC) und übernimmt für alle 14 REST-Endpunkte sowohl die Annahme der
HTTP-Anfrage als auch die Geschäftsregeln und die SQL-Ausführung gegen
MariaDB. Eine zweite Datei `server/db.js` kapselt den Connection-Pool, das
Schema-Setup, die Migration der Mangelkategorien (siehe ADR-003) und den
WF-01-Trigger.

Eine klassische Drei-Schichten-Aufteilung (Controller / Service / Repository
/ DB), wie sie in Spring, Django REST, NestJS oder Laravel üblich ist,
wäre die textbuch-konforme Alternative:

```text
server/
  routes/           # HTTP-Annahme
  controllers/      # Request → Service, Response-Mapping
  services/         # Geschäftsregeln, WF-01, Demotion-Logik
  repositories/     # SQL und JOINs, gibt Domain-Objekte zurück
  db/               # Pool, Schema, Migrationen, Trigger
```

Diese ADR begründet, **warum wir diese Aufteilung bewusst nicht
eingeführt haben** und unter welchen Bedingungen wir sie später
einführen würden.

## Entscheidung

Wir behalten **`server/index.js` als monolithischen Express-Server** mit
14 Endpunkten in einer Datei, gegliedert nach Domäne-Bereichen (Halter,
Fahrzeug, Termin, Mangel, Admin). `server/db.js` bleibt als separates
Modul für Connection-Pool, Schema-Setup, Kategorie-Migration und Trigger.

Wir führen **keine Routes-, Controller-, Service- und
Repository-Verzeichnisse** ein.

## Begründung

### 1. Projekt-Größe rechtfertigt den Abstraktions-Overhead nicht

- 14 REST-Endpunkte, alle in derselben Domäne (TÜV-Prüfstelle).
- 400 LOC im gesamten Backend, lesbar in einem Editor-Scroll.
- Pro Endpunkt: 1 Route + 1 SQL + ggf. 1 Guard-Check → passt auf eine
  Bildschirmseite.

Eine Aufspaltung in Routes/Controller/Service/Repository würde aus
diesen 14 Endpunkten über 40 Dateien machen — für ein Projekt, das
keinen technischen Schmerz aus der Single-File-Variante hat. Das ist
das klassische "Architecture Astronaut"-Anti-Muster.

### 2. Geschäftsregeln sind bereits sauber lokalisiert

Die wichtigste Regel (WF-01: kein Bestanden bei EM/GfM) lebt heute an
drei klar identifizierbaren Stellen, die jeweils einer Schicht
entsprechen — auch ohne Verzeichnis-Aufspaltung:

| Schicht       | Wo im Code                                           |
| ------------- | ---------------------------------------------------- |
| UI-Guard      | `src/utils/mangel.js`, `src/utils/validators.js`     |
| API-Guard     | `PATCH /api/termine/:id/status` in `server/index.js` |
| DB-Trigger    | `trg_termin_wf01_update` in `server/db.js`           |

Die Service-Schicht-Logik ist im Endpunkt-Code lokal und durch
`asyncRoute()`-Wrapper isoliert. Eine eigene `TerminService`-Klasse
würde die gleiche Logik nur in ein anderes Verzeichnis schieben.

### 3. Tests testen Verhalten, nicht Struktur

`server/tests/wf01.test.js` ruft die HTTP-API gegen den laufenden
Docker-Stack auf und prüft die End-to-End-Wirkung der Regel. Diese
Tests sind unabhängig davon, ob das Backend eine oder zwölf Dateien
hat. Eine Umstrukturierung würde **keinen einzigen Test brechen**,
aber auch keinen einzigen neuen Test ermöglichen, der heute nicht möglich
wäre.

### 4. Single-File-Backends sind in dieser Größen-Liga normal

In der Node-Community ist ein Single-File-Express-Server bis ca. 1000
LOC eine valide und verbreitete Form. Express selbst empfiehlt in der
offiziellen Doku gar keinen festen Verzeichnis-Layout — anders als
Spring oder NestJS, die Layering bewusst erzwingen. Der monolithische
Stil ist nicht "schlechter Stil", sondern "weniger Strukturzwang".

### 5. Optimieren auf Lesbarkeit für Prüfer und Reviewer

Frau Fuchs, Oussama, eine zukünftige Klausur-Korrekturperson oder ein
späterer Wartungs-Entwickler bekommen in einer einzigen Datei alle
14 Endpunkte mit ihren SQL-Statements im Klartext nebeneinander zu
sehen. Das ist für die akademische Verteidigung wertvoller als eine
"professionell aussehende" Verzeichnis-Hierarchie, die denselben Code
nur an mehr Stellen verteilt.

## Konsequenzen

### Was bleibt sichtbar dokumentiert

- ADR-001: warum MariaDB als zentrale Persistenz
- ADR-002: 3NF-Normalisierung mit FD-Nachweis
- ADR-003: WF-01 in drei Schichten (UI / API / DB-Trigger)
- ADR-009: **diese ADR — bewusste Wahl gegen Layering**

Die ADR-Liste zeigt explizit, dass wir das Layering-Modell kennen und
geprüft haben. Sie ist die ehrliche Form von "wir haben das durchdacht".

### Wann wir auf Layered umstellen würden

Wir würden auf eine geschichtete Architektur migrieren, sobald:

- Mehr als ca. **30 REST-Endpunkte** existieren, oder
- `server/index.js` **800 LOC** überschreitet, oder
- Ein **zweites fachliches Modul** dazukommt (z. B. Werkstatt-Buchhaltung,
  Kundenportal), das dieselbe API teilen soll, oder
- Mehr als **zwei Entwickler parallel** an verschiedenen Endpunkten
  arbeiten und Merge-Konflikte auf `server/index.js` häufig werden.

Sobald einer dieser Schwellwerte erreicht ist, würde die Migration
typischerweise so ablaufen:

1. SQL-Statements aus `server/index.js` in `server/repositories/*.js`
   extrahieren (z. B. `terminRepository.findById`).
2. Geschäftsregeln (z. B. WF-01-Check, Auto-Demotion) in
   `server/services/*.js` extrahieren.
3. Endpunkt-Handler werden zu dünnen Controllern, die nur Request
   parsen und auf Services delegieren.
4. Tests in `server/tests/wf01.test.js` bleiben unverändert — sie
   testen Verhalten, nicht Struktur.

### Was wir **nicht** opfern

- Die DB-seitige Sicherheit (Trigger, Constraints) ist von der
  Anwendungs-Struktur unabhängig und bleibt unangetastet.
- Die Tests-Strategie (Behavioral Integration Tests gegen Docker-Stack)
  bleibt sinnvoll, egal ob das Backend in 2 oder 20 Dateien lebt.
- Die Doku-Konvention (ADRs pro Architektur-Entscheidung) trifft jede
  Schicht gleichermaßen.

## Anmerkung

Diese ADR ist explizit eine **Wahl gegen "professionelle" Strukturierung
um ihrer selbst willen** und für **angemessene Komplexität**. Layered
Architecture ist nicht "besser als" Single-File, sie ist eine andere
Antwort auf andere Probleme. Unsere Probleme heute rechtfertigen die
Antwort nicht.
