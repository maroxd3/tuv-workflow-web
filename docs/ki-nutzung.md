# KI-Nutzung

Stand: 2026-05-17

## 1. Zweck

KI wurde als Assistenz fuer Strukturierung, Formulierung, Code-Review,
Testideen und Dokumentationsabgleich genutzt. Fachliche Entscheidungen,
Abnahme und Verantwortung bleiben beim Projektteam.

## 2. Beispiele fuer Nutzung

- Formulierung von Anforderungen und Akzeptanzkriterien.
- Pruefung, ob Dokumentation zur aktuellen MariaDB-Architektur passt.
- Vorschlaege fuer API-Endpunkte und Testfaelle.
- Review von Datenmodell und Normalisierung.
- Zusammenfassung von Restrisiken.

## 3. Validierung

KI-Ausgaben wurden nicht ungeprueft uebernommen. Das Team pruefte:

- ob Aussagen mit dem Code uebereinstimmen,
- ob MariaDB/Express als aktuelle Architektur beschrieben ist,
- ob Build und Typecheck laufen,
- ob fachliche Regeln wie WF-01 korrekt bleiben.

## 4. Aktuelle Architektur als Pruefgrundlage

Massgeblich ist:

```text
React/Vite -> apiClient.ts -> Express API -> MariaDB
```

Dokumentation, die Browserdatenbanken oder direkte Frontend-Persistenz als
aktuellen Stand beschreibt, wurde entfernt oder ersetzt.

## 5. Grenzen

KI ersetzt keine Tests, keine fachliche Abnahme und keine rechtliche Bewertung.
Produktive Themen wie Datenschutz, Authentifizierung und Backups muessen durch
das Team separat abgesichert werden.
