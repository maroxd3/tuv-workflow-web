# 006 — Firebase Hosting für statische Dateien (nicht für DB)

* **Status:** accepted
* **Datum:** 2026-05-13
* **Entscheider:** Marwan Saleh

## Kontext und Problem

Mit dem Wegfall von Firestore (ADR-001) gibt es **keine** Backend-DB mehr.
Die App ist eine reine Static-Site (Vite-Build → `dist/`), die im Browser
PGlite + IndexedDB nutzt. Frage: wo hosten?

## Entscheidungstreiber

* Kostenlos oder sehr günstig (Projekt-Budget: 0 €)
* Custom-Domain (`tuv-workflow.web.app` oder ähnlich) gewünscht
* HTTPS automatisch
* GitHub-Actions-Integration für CI/CD
* Migrations-Aufwand minimal

## Betrachtete Optionen

1. **Firebase Hosting** (Status quo, nur Hosting-Teil weiterverwenden)
2. **GitHub Pages**
3. **Vercel**
4. **Cloudflare Pages**
5. **Netlify**

## Entscheidungsergebnis

**Gewählt: Option 1 — Firebase Hosting.**

### Begründung

* Wir haben bereits ein Firebase-Projekt (`tuv-prufstelle-pro`) — Hosting
  ist nur ein Sub-Service davon. **Hosting nutzt NIE die DB.**
* `firebase.json` und Deploy-Workflow existieren schon → 0 Migrations-Aufwand.
* Free-Tier (10 GB Storage, 360 MB/Tag Transfer) ist für Studienprojekt
  reichlich.
* Custom-Domain + HTTPS bereits eingerichtet.
* GitHub-Actions-Integration via `FirebaseExtended/action-hosting-deploy@v0`.

### Wichtige Klarstellung

> Firebase **Hosting** ≠ Firebase **Firestore**.
>
> *Hosting* ist nur ein statisches CDN, das HTML/JS/CSS-Dateien ausliefert
> — genau wie ein Apache-Server oder Cloudflare-Pages. Es greift in keiner
> Weise auf Firestore zu. Wir haben Firestore (NoSQL-DB) verlassen, **nicht**
> Hosting (Static-File-Delivery).

### Positive Konsequenzen

* Keine Migration nötig
* Deploy-Workflow läuft bereits
* Custom-Domain steht

### Negative Konsequenzen

* Vendor-Lock-in bei Google (minimal — `firebase.json` ist trivial nachzubauen
  für jeden anderen Provider).

## Bewertete Optionen im Detail

### Option 1 — Firebase Hosting (gewählt)
* **Gut:** Status quo, läuft, Custom-Domain & HTTPS, GH-Actions-Adapter
* **Schlecht:** Vendor-Lock-in light

### Option 2 — GitHub Pages
* **Gut:** Native zu GitHub, keine zusätzlichen Accounts
* **Schlecht:** Custom-Domain umständlicher; weniger Routing-Flexibilität
  bei SPA-Fallback

### Option 3 — Vercel
* **Gut:** Excellent DX, Edge-Network, Preview-Deployments out-of-the-box
* **Schlecht:** Stärker auf Next.js fokussiert; Migrations-Aufwand für nur Static-Site nicht gerechtfertigt

### Option 4 — Cloudflare Pages
* **Gut:** Größtes CDN, sehr schnell, sehr großzügiges Free-Tier
* **Schlecht:** Migrations-Aufwand ohne klaren Nutzen über Firebase Hosting hinaus

### Option 5 — Netlify
* **Gut:** Sehr ähnlich zu Vercel
* **Schlecht:** Ebenfalls Migrations-Aufwand ohne klaren Mehrwert

## Verwandte Entscheidungen

* **ADR-001** — Wegfall Firestore klärt: Hosting bleibt, DB verlässt uns

## Quellen

* Firebase Hosting Dokumentation — https://firebase.google.com/docs/hosting
* `.github/workflows/deploy.yml`
* `firebase.json` (Hosting-Konfiguration)
