# 009 - Monolithischer Server statt geschichteter Architektur

Status: accepted
Datum: 2026-05-19

## Kontext

Das Express-Backend liegt aktuell in einer einzigen Datei `server/index.js`
(~400 LOC) und uebernimmt fuer alle 14 REST-Endpunkte sowohl die Annahme der
HTTP-Anfrage als auch die Geschaeftsregeln und die SQL-Ausfuehrung gegen
MariaDB. Eine zweite Datei `server/db.js` kapselt den Connection-Pool, das
Schema-Setup, die Migration der Mangelkategorien (siehe ADR-003) und den
WF-01-Trigger.

Eine klassische Drei-Schichten-Aufteilung (Controller / Service / Repository
/ DB), wie sie in Spring, Django REST, NestJS oder Laravel ueblich ist,
waere die textbuch-konforme Alternative:

```text
server/
  routes/           # HTTP-Annahme
  controllers/      # Request → Service, Response-Mapping
  services/         # Geschaeftsregeln, WF-01, Demotion-Logik
  repositories/     # SQL und JOINs, gibt Domain-Objekte zurueck
  db/               # Pool, Schema, Migrationen, Trigger
```

Diese ADR begruendet, **warum wir diese Aufteilung bewusst nicht
eingefuehrt haben** und unter welchen Bedingungen wir sie spaeter
einfuehren wuerden.

## Entscheidung

Wir behalten **`server/index.js` als monolithischen Express-Server** mit
14 Endpunkten in einer Datei, gegliedert nach Domaene-Bereichen (Halter,
Fahrzeug, Termin, Mangel, Admin). `server/db.js` bleibt als separates
Modul fuer Connection-Pool, Schema-Setup, Kategorie-Migration und Trigger.

Wir fuehren **keine Routes-, Controller-, Service- und
Repository-Verzeichnisse** ein.

## Begruendung

### 1. Projekt-Groesse rechtfertigt den Abstraktions-Overhead nicht

- 14 REST-Endpunkte, alle in derselben Domaene (TUEV-Pruefstelle).
- 400 LOC im gesamten Backend, lesbar in einem Editor-Scroll.
- Pro Endpunkt: 1 Route + 1 SQL + ggf. 1 Guard-Check → passt auf eine
  Bildschirmseite.

Eine Aufspaltung in Routes/Controller/Service/Repository wuerde aus
diesen 14 Endpunkten ueber 40 Dateien machen — fuer ein Projekt, das
keinen technischen Schmerz aus der Single-File-Variante hat. Das ist
das klassische "Architecture Astronaut"-Anti-Muster.

### 2. Geschaeftsregeln sind bereits sauber lokalisiert

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
wuerde die gleiche Logik nur in ein anderes Verzeichnis schieben.

### 3. Tests testen Verhalten, nicht Struktur

`server/tests/wf01.test.js` ruft die HTTP-API gegen den laufenden
Docker-Stack auf und prueft die End-to-End-Wirkung der Regel. Diese
Tests sind unabhaengig davon, ob das Backend eine oder zwoelf Dateien
hat. Eine Umstrukturierung wuerde **keinen einzigen Test brechen**,
aber auch keinen einzigen neuen Test enabeln, der heute nicht moeglich
waere.

### 4. Single-File-Backends sind in dieser Groessen-Liga normal

In der Node-Community ist ein Single-File-Express-Server bis ca. 1000
LOC eine valide und verbreitete Form. Express selbst empfiehlt in der
offiziellen Doku gar keinen festen Verzeichnis-Layout — anders als
Spring oder NestJS, die Layering bewusst erzwingen. Der monolithische
Stil ist nicht "schlechter Stil", sondern "weniger Strukturzwang".

### 5. Optimieren auf Lesbarkeit fuer Pruefer und Reviewer

Frau Fuchs, Oussama, eine zukuenftige Klausur-Korrekturperson oder ein
spaeterer Wartungs-Entwickler bekommen in einer einzigen Datei alle
14 Endpunkte mit ihren SQL-Statements im Klartext nebeneinander zu
sehen. Das ist fuer die akademische Verteidigung wertvoller als eine
"professionell aussehende" Verzeichnis-Hierarchie, die denselben Code
nur an mehr Stellen verteilt.

## Konsequenzen

### Was bleibt sichtbar dokumentiert

- ADR-001: warum MariaDB als zentrale Persistenz
- ADR-002: 3NF-Normalisierung mit FD-Nachweis
- ADR-003: WF-01 in drei Schichten (UI / API / DB-Trigger)
- ADR-009: **diese ADR — bewusste Wahl gegen Layering**

Die ADR-Liste zeigt explizit, dass wir das Layering-Modell kennen und
geprueft haben. Sie ist die ehrliche Form von "wir haben das durchdacht".

### Wann wir auf Layered umstellen wuerden

Wir wuerden auf eine geschichtete Architektur migrieren, sobald:

- Mehr als ca. **30 REST-Endpunkte** existieren, oder
- `server/index.js` **800 LOC** ueberschreitet, oder
- Ein **zweites fachliches Modul** dazukommt (z. B. Werkstatt-Buchhaltung,
  Kundenportal), das dieselbe API teilen soll, oder
- Mehr als **zwei Entwickler parallel** an verschiedenen Endpunkten
  arbeiten und Merge-Konflikte auf `server/index.js` haeufig werden.

Sobald einer dieser Schwellwerte erreicht ist, wuerde die Migration
typischerweise so ablaufen:

1. SQL-Statements aus `server/index.js` in `server/repositories/*.js`
   extrahieren (z. B. `terminRepository.findById`).
2. Geschaeftsregeln (z. B. WF-01-Check, Auto-Demotion) in
   `server/services/*.js` extrahieren.
3. Endpunkt-Handler werden zu duennen Controllern, die nur Request
   parsen und auf Services delegieren.
4. Tests in `server/tests/wf01.test.js` bleiben unveraendert — sie
   testen Verhalten, nicht Struktur.

### Was wir **nicht** opfern

- Die DB-seitige Sicherheit (Trigger, Constraints) ist von der
  Anwendungs-Struktur unabhaengig und bleibt unangetastet.
- Die Tests-Strategie (Behavioral Integration Tests gegen Docker-Stack)
  bleibt sinnvoll, egal ob das Backend in 2 oder 20 Dateien lebt.
- Die Doku-Konvention (ADRs pro Architektur-Entscheidung) trifft jede
  Schicht gleichermassen.

## Anmerkung

Diese ADR ist explizit eine **Wahl gegen "professionelle" Strukturierung
um ihrer selbst willen** und fuer **angemessene Komplexitaet**. Layered
Architecture ist nicht "besser als" Single-File, sie ist eine andere
Antwort auf andere Probleme. Unsere Probleme heute rechtfertigen die
Antwort nicht.
