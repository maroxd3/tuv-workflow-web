# 005 - TypeScript graduell einführen

Status: accepted  
Datum: 2026-05-13  
Aktualisiert: 2026-05-17

## Kontext

Das Projekt startete mit React/JSX. Eine vollstaendige Big-Bang-Migration auf
TypeScript wäre riskant und würde viele fachlich stabile Views beruehren.

## Entscheidung

TypeScript wird graduell genutzt. Neue oder datennahe Module können `.ts` sein,
waehrend bestehende `.jsx`-Views erhalten bleiben, solange kein fachlicher Grund
für eine Migration besteht.

## Begründung

- Geringes Refactor-Risiko.
- Datentypen im Frontend können trotzdem zentral beschrieben werden.
- Bestehende Tests und UI-Dateien bleiben stabil.
- `allowJs` ermöglicht gemischten Betrieb.

## Konsequenzen

- Die Codebasis bleibt gemischt aus JS/JSX und TS.
- Neue API-Client- und Hook-Typen sollten in TypeScript gepflegt werden.
