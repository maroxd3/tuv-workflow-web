# 003 - WF-01 in UI und API absichern

Status: accepted  
Datum: 2026-05-13  
Aktualisiert: 2026-05-17 fuer Express/MariaDB

## Kontext

Ein Termin mit blockierendem Mangel der Kategorie HM oder GM darf nicht den
Status `Bestanden` erhalten.

## Entscheidung

Die Regel wird in zwei Schichten umgesetzt:

1. UI-Guard: Die Benutzeroberflaeche verhindert oder warnt bei ungueltigen
   Statuswechseln.
2. API-Guard: `PATCH /api/termine/:id/status` prueft in MariaDB, ob
   blockierende Maengel existieren.

Wenn ein blockierender Mangel zu einem bereits bestandenen Termin angelegt wird,
setzt die API den Termin auf `Nicht bestanden` zurueck.

## Begruendung

- Die UI gibt sofortiges Feedback.
- Die API schuetzt auch gegen fehlerhafte oder direkte HTTP-Aufrufe.
- Die Regel bleibt sichtbar und testbar in `server/index.js`.
- Kein Trigger ist noetig.

## Konsequenzen

- Neue Status-Endpunkte muessen dieselbe Regel beachten.
- API-Tests sollten den blockierten Statuswechsel explizit pruefen.
