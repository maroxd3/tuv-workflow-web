# 006 - Firebase Hosting (verworfen, ersetzt durch On-Premise-Auslieferung)

Status: superseded by [ADR-010](010-hardening-roadmap.md)
Datum: 2026-05-13
Aktualisiert: 2026-05-22 — Firebase-Pfad entfernt, Auslieferung vollständig
on-premise über `docker compose`

## Kontext

In den ersten Sprints wurde das statische Frontend testweise über Firebase
Hosting ausgeliefert, während die Datenhaltung bereits in MariaDB hinter einer
Express-API lag. Damit existierten zwei Auslieferungspfade nebeneinander:
Firebase für das Frontend und ein lokaler Server für API und DB.

## Frühere Entscheidung

Firebase Hosting wurde als optionale, nicht-datenführende Ausspielmöglichkeit
für die statischen Vite-Build-Artefakte eingeplant. Die Datenhaltung war von
Anfang an außerhalb von Firebase (siehe [ADR-001](001-mariadb-zentrale-persistenz.md)).

## Warum verworfen

- Das Produkt ist eine On-Premise-Lösung pro Prüfstelle: Kundendaten sollen
  die Werkstatt nicht verlassen, das Auslieferungsmodell muss dazu passen.
- Zwei Auslieferungspfade (Cloud-Hosting fürs Frontend + lokaler Server für
  API/DB) waren inkonsistent und in Kunden-Setups schwer zu erklären.
- `server/index.js` liefert das gebaute Frontend inzwischen selbst aus
  (SPA-Fallback, siehe [ADR-010](010-hardening-roadmap.md) Punkt 2). Damit ist
  Firebase Hosting funktional nicht mehr nötig.

## Aktueller Zustand

- `firebase.json`, `.firebaserc` und der Firebase-Deploy-Workflow wurden aus
  dem Repository entfernt.
- Auslieferung erfolgt ausschließlich über `docker compose up -d` auf einem
  Server-PC in der Prüfstelle.
- Diese ADR bleibt im Repo erhalten, um den Übergang nachvollziehbar zu
  dokumentieren.
