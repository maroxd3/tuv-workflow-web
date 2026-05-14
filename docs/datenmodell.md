# Datenmodell — TÜV Prüfstelle Pro

**Vollständiger Drei-Schichten-Entwurf** nach klassischer Datenbank-Methodik
(Codd 1970, Chen 1976, Date 2003):

1. **Konzeptuelles Modell** — Entity-Relationship-Diagramm, frei von
   Implementierungsdetails
2. **Logisches Modell** — Relationenschema in 3. Normalform (3NF), Schlüssel
   und referentielle Integrität, aber ohne Indizes oder Trigger
3. **Physisches Modell** — PostgreSQL-spezifische DDL, Indizes, Constraints,
   ggf. Trigger als Implementierungsoption

Diese Trennung folgt dem ANSI/SPARC-Drei-Ebenen-Modell von 1975 und stellt
sicher, dass Geschäftsanforderungen unabhängig von der konkreten
Datenbank-Technologie diskutierbar sind.

---

## 1. Konzeptuelles Modell — Entity-Relationship-Diagramm

Das Diagramm zeigt das fachliche Modell im Chen-Stil: Entitäten sind als
Rechtecke dargestellt, Beziehungen als Rauten und Attribute als Ovale. Die
Primärschlüssel sind wie in der klassischen Chen-Notation unterstrichen. Die
Fremdschlüssel werden erst im logischen Relationenschema ausgewiesen, weil sie
aus den Beziehungen des ER-Modells abgeleitet werden.

### 1.1 ER-Diagramm (Chen-Notation, kompakt als Mermaid)

```mermaid
flowchart TB
  %% Chen-nahe Notation:
  %% Rechteck = Entität, Raute = Beziehung, Oval = Attribut
  %% Unterstrichene Attribute sind Primärschlüssel.

  HALTER[HALTER]
  FAHRZEUG[FAHRZEUG]
  TERMIN[TERMIN]
  MANGEL[MANGEL]
  PRUEFER[PRUEFER]
  PRUEFART[PRUEFART]
  STATUS[STATUS]
  MANGEL_KATEGORIE[MANGEL_KATEGORIE]

  BESITZT{besitzt}
  WIRD_GEPRUEFT{wird geprüft in}
  WEIST_AUF{weist auf}
  FUEHRT_DURCH{führt durch}
  KLASSIFIZIERT{klassifiziert}
  BESCHREIBT{beschreibt Zustand}
  HAT_KATEGORIE{hat Kategorie}

  HALTER -- "1" --- BESITZT
  BESITZT -- "N" --- FAHRZEUG

  FAHRZEUG -- "1" --- WIRD_GEPRUEFT
  WIRD_GEPRUEFT -- "N" --- TERMIN

  TERMIN -- "1" --- WEIST_AUF
  WEIST_AUF -- "N" --- MANGEL

  PRUEFER -- "0..1" --- FUEHRT_DURCH
  FUEHRT_DURCH -- "N" --- TERMIN

  PRUEFART -- "1" --- KLASSIFIZIERT
  KLASSIFIZIERT -- "N" --- TERMIN

  STATUS -- "1" --- BESCHREIBT
  BESCHREIBT -- "N" --- TERMIN

  MANGEL_KATEGORIE -- "1" --- HAT_KATEGORIE
  HAT_KATEGORIE -- "N" --- MANGEL

  h_id(["h̲a̲l̲t̲e̲r̲_̲i̲d̲"])
  h_name(["name"])
  h_tel(["telefon"])
  h_email(["email"])
  h_anschrift(["anschrift"])
  HALTER --- h_id
  HALTER --- h_name
  HALTER --- h_tel
  HALTER --- h_email
  HALTER --- h_anschrift

  f_id(["f̲a̲h̲r̲z̲e̲u̲g̲_̲i̲d̲"])
  f_halter_fk(["halter_id"])
  f_kennzeichen(["kennzeichen"])
  f_fin(["fin"])
  f_hersteller(["hersteller"])
  f_modell(["modell"])
  f_baujahr(["baujahr"])
  f_farbe(["farbe"])
  f_typ(["typ"])
  f_km(["kilometerstand"])
  f_hu(["hu_faellig"])
  FAHRZEUG --- f_id
  FAHRZEUG --- f_halter_fk
  FAHRZEUG --- f_kennzeichen
  FAHRZEUG --- f_fin
  FAHRZEUG --- f_hersteller
  FAHRZEUG --- f_modell
  FAHRZEUG --- f_baujahr
  FAHRZEUG --- f_farbe
  FAHRZEUG --- f_typ
  FAHRZEUG --- f_km
  FAHRZEUG --- f_hu

  t_id(["t̲e̲r̲m̲i̲n̲_̲i̲d̲"])
  t_fahrzeug_fk(["fahrzeug_id"])
  t_pruefart_fk(["prueft_code"])
  t_pruefer_fk(["pruefer_kuerzel"])
  t_status_fk(["status_code"])
  t_datum(["datum"])
  t_uhrzeit(["uhrzeit"])
  t_notiz(["notiz"])
  TERMIN --- t_id
  TERMIN --- t_fahrzeug_fk
  TERMIN --- t_pruefart_fk
  TERMIN --- t_pruefer_fk
  TERMIN --- t_status_fk
  TERMIN --- t_datum
  TERMIN --- t_uhrzeit
  TERMIN --- t_notiz

  m_id(["m̲a̲n̲g̲e̲l̲_̲i̲d̲"])
  m_termin_fk(["termin_id"])
  m_kat_fk(["kategorie_code"])
  m_code(["code_stvzo"])
  m_beschreibung(["beschreibung"])
  m_behoben(["behoben"])
  MANGEL --- m_id
  MANGEL --- m_termin_fk
  MANGEL --- m_kat_fk
  MANGEL --- m_code
  MANGEL --- m_beschreibung
  MANGEL --- m_behoben

  p_id(["p̲r̲u̲e̲f̲e̲r̲_̲k̲u̲e̲r̲z̲e̲l̲"])
  p_name(["name"])
  p_qualifikation(["qualifikation"])
  PRUEFER --- p_id
  PRUEFER --- p_name
  PRUEFER --- p_qualifikation

  pa_id(["p̲r̲u̲e̲f̲t̲_̲c̲o̲d̲e̲"])
  pa_bez(["bezeichnung"])
  PRUEFART --- pa_id
  PRUEFART --- pa_bez

  s_id(["s̲t̲a̲t̲u̲s̲_̲c̲o̲d̲e̲"])
  s_bez(["bezeichnung"])
  s_end(["ist_endzustand"])
  STATUS --- s_id
  STATUS --- s_bez
  STATUS --- s_end

  mk_id(["k̲a̲t̲e̲g̲o̲r̲i̲e̲_̲c̲o̲d̲e̲"])
  mk_bez(["bezeichnung"])
  mk_block(["blockiert_bestanden"])
  MANGEL_KATEGORIE --- mk_id
  MANGEL_KATEGORIE --- mk_bez
  MANGEL_KATEGORIE --- mk_block

```

Legende: Rechteck = Entität, Raute = Beziehung, Oval = Attribut,
unterstrichenes Attribut = Primärschlüssel. Fremdschlüssel sind als normale
Attribute dargestellt und im logischen Modell darunter eindeutig ausgewiesen.
Die Kardinalitäten stehen direkt an den Verbindungslinien (`1`, `0..1` bzw.
`N`).

### 1.2 Entitäten und ihre Bedeutung

| Entität | Reale Bedeutung |
|---|---|
| **HALTER** | Eigentümer eines oder mehrerer Fahrzeuge — natürliche oder juristische Person |
| **FAHRZEUG** | Eindeutiges Kraftfahrzeug, identifiziert durch Kennzeichen und/oder FIN |
| **TERMIN** | Konkreter Prüfungs-Termin eines Fahrzeugs zu einem Zeitpunkt |
| **MANGEL** | Festgestellte Beanstandung bei einer Prüfung gemäß StVZO Anlage VIII |
| **PRUEFER** | Sachverständiger Prüfingenieur, der den Termin durchführt |
| **PRUEFART** | Klassifikation der Prüfung (HU, AU, HU+AU, Nachprüfung, ...) |
| **STATUS** | Zustand eines Termins im Workflow |
| **MANGEL_KATEGORIE** | Einstufung eines Mangels (OM, LM, EM, HM, GM) inklusive Wirkung auf das Prüfergebnis |

### 1.3 Beziehungen und Kardinalitäten

| Beziehung | Kardinalität | Erläuterung |
|---|---|---|
| HALTER **besitzt** FAHRZEUG | 1 : N | Ein Halter kann mehrere Fahrzeuge besitzen; jedes Fahrzeug gehört zu genau einem Halter (zum gegebenen Zeitpunkt) |
| FAHRZEUG **wird geprüft in** TERMIN | 1 : N | Ein Fahrzeug hat im Laufe der Zeit beliebig viele Termine; jeder Termin gilt genau einem Fahrzeug |
| TERMIN **weist auf** MANGEL | 1 : N | Ein Termin kann mehrere Mängel haben; jeder Mangel ist genau einem Termin zugeordnet |
| PRUEFER **führt durch** TERMIN | 0..1 : N | Ein Prüfer kann viele Termine durchführen; ein Termin kann noch ohne zugewiesenen Prüfer geplant sein |
| PRUEFART **klassifiziert** TERMIN | 1 : N | Jeder Termin ist genau einer Prüfart zugeordnet |
| STATUS **beschreibt Zustand** TERMIN | 1 : N | Jeder Termin hat zu einem Zeitpunkt genau einen Status |
| MANGEL_KATEGORIE **hat Kategorie** MANGEL | 1 : N | Jede Kategorie kann bei vielen Mängeln vorkommen; jeder Mangel hat genau eine Kategorie |

### 1.4 Geschäftsregeln auf konzeptueller Ebene

Diese Regeln stellen das Geschäftswissen dar, **unabhängig** davon, wie sie
später technisch erzwungen werden (Anwendungslogik, DB-Constraints, Trigger).

| ID | Regel | Quelle |
|---|---|---|
| GR-01 | Jedes Fahrzeug ist über sein Kennzeichen eindeutig identifizierbar | KBA / StVZO |
| GR-02 | Wenn eine Fahrgestellnummer (FIN) angegeben ist, ist sie weltweit eindeutig | ISO 3779 |
| GR-03 | Ein Termin mit Hauptmangel oder gefährlichem Mangel darf nicht den Status BESTANDEN haben | § 29 StVZO |
| GR-04 | Baujahr eines Fahrzeugs liegt zwischen 1885 (Patent-Motorwagen) und (aktuelles Jahr + 1) | Plausibilität |
| GR-05 | Kilometerstand ist nichtnegativ und unter einer Plausibilitätsgrenze (z. B. 3.000.000 km) | Plausibilität |
| GR-06 | Beim Löschen eines Fahrzeugs werden alle zugehörigen Termine und Mängel kaskadierend entfernt | Domänen-Konsistenz |

---

## 2. Logisches Modell — Relationenschema in 3NF

Das logische Modell überführt das konzeptuelle ER-Diagramm in eine Sammlung
**normalisierter Relationen**. Wir streben **dritte Normalform (3NF)** an, um
Anomalien bei Insert / Update / Delete zu vermeiden (Codd 1971).

### 2.1 Schritte der Normalisierung — kurz dokumentiert

Aus dem konzeptuellen Modell ergeben sich diese Entitäten als initiale
Relationen:

```
FAHRZEUG_KONZEPT = { kennzeichen, fin, hersteller, modell, baujahr,
                    farbe, typ, kilometerstand, hu_faellig,
                    halter_name, halter_telefon, halter_email,
                    halter_anschrift }
```

**1NF**: Alle Attribute sind atomar (keine Mehrfachwerte) — bereits erfüllt,
sobald wir uns gegen das eingebettete Mängel-Array entscheiden.

**2NF**: Keine partielle funktionale Abhängigkeit vom Schlüssel — erfüllt, da
unsere Schlüssel einspaltig sind.

**3NF**: Keine transitiven Abhängigkeiten. Das ist hier verletzt:

- `kennzeichen → halter_name` (Schlüsselattribut bestimmt Halter)
- `halter_name → halter_telefon, halter_email, halter_anschrift` (transitive Abh.)

→ Verletzung der 3NF. Auflösung durch **Ausgliederung des Halters** in
eine eigene Relation:

```
HALTER = { halter_id, name, telefon, email, anschrift }
FAHRZEUG = { kennzeichen, fin, hersteller, modell, baujahr, farbe,
            typ, kilometerstand, hu_faellig, halter_id }
```

Analog für das Mängel-Array in TERMIN: ein Termin kann mehrere Mängel haben →
das verletzt 1NF (mehrwertige Attribute) → Auflösung in eigene Relation
MANGEL mit Fremdschlüssel auf TERMIN.

### 2.2 Endgültiges Relationenschema (3NF)

Notation: `RELATION(unterstrichener_PK, Attribute, fremdschlüssel↗ZIEL)`

```
HALTER(halter_id, name, telefon, email, anschrift, erfasst_am)

FAHRZEUG(fahrzeug_id, kennzeichen, fin?, hersteller, modell, baujahr?, farbe?,
        typ, kilometerstand?, hu_faellig?, halter_id↗HALTER, erfasst_am)

PRUEFART(prueft_code, bezeichnung)

PRUEFER(pruefer_kuerzel, name, qualifikation?)

STATUS(status_code, bezeichnung, ist_endzustand)

TERMIN(termin_id, fahrzeug_id↗FAHRZEUG, datum, uhrzeit, prueft_code↗PRUEFART,
      pruefer_kuerzel↗PRUEFER, status_code↗STATUS, notiz?, erfasst_am)

MANGEL_KATEGORIE(kategorie_code, bezeichnung, blockiert_bestanden)

MANGEL(mangel_id, termin_id↗TERMIN, code_stvzo?, beschreibung,
      kategorie_code↗MANGEL_KATEGORIE, behoben, erfasst_am)
```

**Legende:**
- Unterstrichener Bezeichner = Primärschlüssel
- `?` = nullable
- `↗ZIEL` = Fremdschlüssel referenziert ZIEL
- `STATUS.ist_endzustand` = boolean, markiert ob ein Status terminal ist (BESTANDEN, NICHT_BESTANDEN, ABGEBROCHEN, NICHT_ERSCHIENEN)
- `MANGEL_KATEGORIE.blockiert_bestanden` = boolean, dokumentiert ob diese Kategorie WF-01 auslöst (true für HM, GM; false für OM, LM, EM)

### 2.3 Schlüssel und Eindeutigkeitsbedingungen

| Relation | Primärschlüssel | Unique-Constraints |
|---|---|---|
| HALTER | `halter_id` (UUID) | E-Mail (falls vorhanden) |
| FAHRZEUG | `fahrzeug_id` (UUID) | `kennzeichen` global; `fin` global wenn nicht NULL |
| PRUEFART | `prueft_code` (text) | — |
| PRUEFER | `pruefer_kuerzel` (text) | — |
| STATUS | `status_code` (text) | — |
| TERMIN | `termin_id` (UUID) | `(fahrzeug_id, datum, uhrzeit)` zusammengesetzt |
| MANGEL_KATEGORIE | `kategorie_code` (text) | — |
| MANGEL | `mangel_id` (UUID) | — |

### 2.4 Referentielle Integrität

| Fremdschlüssel | Referenziert | ON DELETE | ON UPDATE | Begründung |
|---|---|---|---|---|
| `FAHRZEUG.halter_id` | `HALTER.halter_id` | RESTRICT | CASCADE | Ein Halter mit Fahrzeugen darf nicht gelöscht werden |
| `TERMIN.fahrzeug_id` | `FAHRZEUG.fahrzeug_id` | CASCADE | CASCADE | Wird ein Fahrzeug gelöscht, gehen alle Termine mit (Domänen-Anforderung) |
| `TERMIN.prueft_code` | `PRUEFART.prueft_code` | RESTRICT | CASCADE | Prüfarten dürfen nicht gelöscht werden solange referenziert |
| `TERMIN.pruefer_kuerzel` | `PRUEFER.pruefer_kuerzel` | SET NULL | CASCADE | Bei Ausscheiden eines Prüfers bleiben Termine bestehen, Prüfer-Verweis wird NULL |
| `TERMIN.status_code` | `STATUS.status_code` | RESTRICT | CASCADE | Status-Codes sind Domänen-Konstante |
| `MANGEL.termin_id` | `TERMIN.termin_id` | CASCADE | CASCADE | Wird der Termin gelöscht, gehen die Mängel mit |
| `MANGEL.kategorie_code` | `MANGEL_KATEGORIE.kategorie_code` | RESTRICT | CASCADE | Kategorien sind Domänen-Konstante |

### 2.5 Geschäftsregeln im logischen Modell

Auf logischer Ebene können wir Geschäftsregeln entweder als **deklarative
Integritätsbedingungen** ausdrücken oder als **Pflichten der Anwendungslogik**
markieren. Das SQL-92-Konstrukt `CREATE ASSERTION` wäre der Königsweg für
relationsübergreifende Constraints, ist aber in keinem produktiven DBMS
implementiert (Date 2003).

| Regel | Logische Ausdrucksform | Erzwingung |
|---|---|---|
| GR-01 Kennzeichen-Eindeutigkeit | `UNIQUE(kennzeichen)` auf FAHRZEUG | deklarativ |
| GR-02 FIN-Eindeutigkeit | `UNIQUE(fin) WHERE fin IS NOT NULL` | deklarativ (Postgres: partial unique index) |
| GR-03 WF-01 — Bestanden ⊥ Hauptmangel | **Nicht durch CHECK ausdrückbar** (Subquery in CHECK ist nicht SQL-Standard) | Anwendungslogik (Schicht 1+2 unten) oder physischer Trigger (s. § 3.3) |
| GR-04 Baujahr-Plausibilität | `CHECK (baujahr BETWEEN 1885 AND extract(year FROM CURRENT_DATE) + 1)` | deklarativ |
| GR-05 Kilometerstand-Plausibilität | `CHECK (kilometerstand BETWEEN 0 AND 3000000)` | deklarativ |
| GR-06 Cascade beim Fahrzeug-Löschen | `ON DELETE CASCADE` an `TERMIN.fahrzeug_id` und `MANGEL.termin_id` | deklarativ |

### 2.6 Hinweis zur Lage von GR-03

WF-01 (kein BESTANDEN bei Hauptmangel) ist eine **relationsübergreifende**
Integritätsbedingung: sie bezieht sich auf die Existenz/Nicht-Existenz von
Tupeln in MANGEL, abhängig von einem Tupel in TERMIN. SQL bietet dafür im
Standard `CREATE ASSERTION` an — in der Praxis wird dies aber von keinem
gängigen DBMS implementiert (PostgreSQL, Oracle, SQL Server, MySQL: alle nicht).

**Konsequenz:** WF-01 ist im logischen Modell **nicht** als deklarative
Constraint ausdrückbar. Drei Implementierungsoptionen bleiben:

1. **Anwendungslogik** (App-Layer-Guard) — primärer Ort
2. **Stored Procedure als einziger Schreib-Pfad** — Status-Wechsel nur über `sp_update_termin_status(...)` möglich
3. **Trigger** als sekundäre Verteidigung im DB-Layer

Die Wahl zwischen diesen drei Optionen ist eine **physische
Implementierungs-Entscheidung** und gehört daher in das nächste Kapitel.

---

## 3. Physisches Modell — PostgreSQL-Implementierung

Dieses Kapitel beschreibt die konkrete Realisierung des logischen Modells in
**PostgreSQL 16**. Indizes, Triggers, Stored Procedures, partielle UNIQUE-Index
und andere implementierungsspezifische Konstrukte sind hier — und nur hier —
zulässig.

> **Hinweis zur Akademischen Korrektheit:** In einem reinen
> Entwurfsdokument (Konzeptionell + Logisch) gehören **keine Trigger** vor.
> Trigger sind ein physisches Werkzeug, das eine konkrete DB-Engine-Funktion
> nutzt. Wir trennen daher die Schichten klar — Trigger erscheinen ausschließlich
> in diesem Kapitel.

### 3.1 DDL — Tabellen-Definitionen

```sql
CREATE TABLE halter (
  halter_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  telefon       TEXT,
  email         TEXT,
  anschrift     TEXT,
  erfasst_am    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT halter_email_unique UNIQUE (email)
);

CREATE TABLE fahrzeug (
  fahrzeug_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kennzeichen     TEXT NOT NULL,
  fin             TEXT,
  hersteller      TEXT NOT NULL,
  modell          TEXT NOT NULL,
  baujahr         INTEGER CHECK (
                    baujahr BETWEEN 1885
                    AND EXTRACT(YEAR FROM CURRENT_DATE)::int + 1
                  ),
  farbe           TEXT,
  typ             TEXT NOT NULL,
  kilometerstand  INTEGER CHECK (
                    kilometerstand BETWEEN 0 AND 3000000
                  ),
  hu_faellig      DATE,
  halter_id       UUID NOT NULL
                  REFERENCES halter(halter_id)
                  ON DELETE RESTRICT
                  ON UPDATE CASCADE,
  erfasst_am      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fahrzeug_kennzeichen_unique UNIQUE (kennzeichen)
);

-- Partial UNIQUE-Index für FIN: nur prüfen wenn nicht NULL
CREATE UNIQUE INDEX fahrzeug_fin_unique
  ON fahrzeug(fin)
  WHERE fin IS NOT NULL;

CREATE TABLE prueft (
  prueft_code   TEXT PRIMARY KEY,
  bezeichnung   TEXT NOT NULL
);

CREATE TABLE pruefer (
  pruefer_kuerzel TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  qualifikation   TEXT
);

CREATE TABLE status (
  status_code     TEXT PRIMARY KEY,
  bezeichnung     TEXT NOT NULL,
  ist_endzustand  BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE termin (
  termin_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fahrzeug_id     UUID NOT NULL
                  REFERENCES fahrzeug(fahrzeug_id)
                  ON DELETE CASCADE
                  ON UPDATE CASCADE,
  datum           DATE NOT NULL,
  uhrzeit         TIME,
  prueft_code     TEXT NOT NULL
                  REFERENCES prueft(prueft_code)
                  ON DELETE RESTRICT,
  pruefer_kuerzel TEXT
                  REFERENCES pruefer(pruefer_kuerzel)
                  ON DELETE SET NULL,
  status_code     TEXT NOT NULL DEFAULT 'GEPLANT'
                  REFERENCES status(status_code)
                  ON DELETE RESTRICT,
  notiz           TEXT,
  erfasst_am      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT termin_eindeutig UNIQUE (fahrzeug_id, datum, uhrzeit)
);

CREATE TABLE mangel_kategorie (
  kategorie_code        TEXT PRIMARY KEY,
  bezeichnung           TEXT NOT NULL,
  blockiert_bestanden   BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE mangel (
  mangel_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  termin_id        UUID NOT NULL
                   REFERENCES termin(termin_id)
                   ON DELETE CASCADE,
  code_stvzo       TEXT,
  beschreibung     TEXT NOT NULL,
  kategorie_code   TEXT NOT NULL
                   REFERENCES mangel_kategorie(kategorie_code)
                   ON DELETE RESTRICT,
  behoben          BOOLEAN NOT NULL DEFAULT false,
  erfasst_am       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.2 Indizes

```sql
-- Häufigste Abfrage: Tagesplan (alle Termine für ein Datum)
CREATE INDEX termin_datum_idx ON termin(datum, uhrzeit);

-- Prüfhistorie eines Fahrzeugs (Berichte-View)
CREATE INDEX termin_fahrzeug_idx ON termin(fahrzeug_id, datum DESC);

-- HU-Fälligkeits-Report
CREATE INDEX fahrzeug_hu_idx ON fahrzeug(hu_faellig)
  WHERE hu_faellig IS NOT NULL;

-- Mängel-Aggregation für Statistik
CREATE INDEX mangel_kategorie_idx ON mangel(kategorie_code);

-- Halter-Suche nach Name (Volltextsuche wäre Erweiterung)
CREATE INDEX halter_name_idx ON halter(LOWER(name));
```

### 3.3 Diskussion: Wie WF-01 erzwingen?

Die Geschäftsregel **GR-03 / WF-01** (kein BESTANDEN bei Hauptmangel) ist auf
logischer Ebene nicht deklarativ als CHECK-Constraint ausdrückbar, weil eine
CHECK-Klausel keine Subqueries auf andere Relationen referenzieren darf
(SQL-Standard 8.6 + nahezu alle DBMS-Implementierungen).

Drei physische Optionen — wir entscheiden uns für **Defense in Depth**
(mehrere Ebenen):

#### Option A — Anwendungsschicht (primäre Verteidigungslinie)

In `src/hooks/useStore.js`, Funktion `updTr`:

```javascript
const updTr = useCallback((id, patch) => {
  if (
    patch.status === STATUS.BESTANDEN &&
    hatHauptmangel(termin.mängel)
  ) {
    return termin; // Schreibvorgang verweigert
  }
  // ...
});
```

**Vorteil:** Schnell, gut testbar, direkt in der Geschäftslogik.
**Nachteil:** Wer den App-Code umgeht (direkter DB-Zugriff), umgeht die Regel.

#### Option B — Stored Procedure als einziger Schreibpfad

```sql
CREATE OR REPLACE FUNCTION sp_termin_status_setzen(
  p_termin_id UUID,
  p_neuer_status TEXT
) RETURNS VOID AS $$
DECLARE
  v_hat_hauptmangel BOOLEAN;
BEGIN
  IF p_neuer_status = 'BESTANDEN' THEN
    SELECT EXISTS(
      SELECT 1 FROM mangel m
        JOIN mangel_kategorie k USING (kategorie_code)
      WHERE m.termin_id = p_termin_id
        AND k.blockiert_bestanden = true
    ) INTO v_hat_hauptmangel;

    IF v_hat_hauptmangel THEN
      RAISE EXCEPTION 'BESTANDEN nicht möglich bei Hauptmangel (§29 StVZO)';
    END IF;
  END IF;

  UPDATE termin SET status_code = p_neuer_status WHERE termin_id = p_termin_id;
END;
$$ LANGUAGE plpgsql;
```

Plus: `REVOKE UPDATE(status_code) ON termin FROM PUBLIC` — niemand kann direkt
am `status_code` herumdrehen, nur über die Procedure.

**Vorteil:** Saubere API auf DB-Ebene, Regel zentral im DB-Layer.
**Nachteil:** Schreibvorgang nicht mehr direkt per `UPDATE` möglich (alle
Schreiber müssen die SP kennen), schwieriger zu testen, PL/pgSQL-spezifisch.

#### Option C — Trigger (BEFORE UPDATE)

```sql
CREATE OR REPLACE FUNCTION trg_termin_status_check()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status_code = 'BESTANDEN' AND EXISTS (
    SELECT 1 FROM mangel m
      JOIN mangel_kategorie k USING (kategorie_code)
    WHERE m.termin_id = NEW.termin_id
      AND k.blockiert_bestanden = true
  ) THEN
    RAISE EXCEPTION 'BESTANDEN nicht möglich bei Hauptmangel (§29 StVZO)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER termin_status_guard
  BEFORE INSERT OR UPDATE OF status_code ON termin
  FOR EACH ROW EXECUTE FUNCTION trg_termin_status_check();
```

**Vorteil:** Greift bei jedem `INSERT` und `UPDATE`, egal von welchem Klienten.
**Nachteil (von Frau Fuchs zurecht angemerkt):** Trigger sind
**implementierungsabhängiges Verhalten**, im konzeptuellen / logischen Modell
nicht ausdrückbar, und können Debugging schwierig machen, weil
Schreibvorgänge unsichtbar zusätzliche Logik auslösen.

#### Unsere Wahl

Wir kombinieren **A + B** für Defense in Depth. **C (Trigger)** dokumentieren
wir hier als physische Option, **setzen ihn aber nicht ein**, weil:

1. Triggers sind Black-Box-Verhalten — neue Entwickler stolpern darüber
2. Stored Procedures + REVOKE deckt den DB-Layer ab
3. Anwendungslogik deckt den App-Layer ab
4. Drei Ebenen wären Overkill für eine einzelne Regel

→ **Wir akzeptieren die Trigger-Kritik der Dozentin in vollem Umfang.**

### 3.4 Initial-Daten (Seed der Domänen-Tabellen)

```sql
INSERT INTO status (status_code, bezeichnung, ist_endzustand) VALUES
  ('GEPLANT',          'Geplant',          false),
  ('IN_PRUEFUNG',      'In Prüfung',       false),
  ('BESTANDEN',        'Bestanden',        true),
  ('NICHT_BESTANDEN',  'Nicht bestanden',  true),
  ('NACHPRUEFUNG',     'Nachprüfung',      false),
  ('NICHT_ERSCHIENEN', 'Nicht erschienen', true),
  ('ABGEBROCHEN',      'Abgebrochen',      true);

INSERT INTO mangel_kategorie (kategorie_code, bezeichnung, blockiert_bestanden) VALUES
  ('OM', 'Ohne Mangel',         false),
  ('LM', 'Leichter Mangel',     false),
  ('EM', 'Erheblicher Mangel',  false),
  ('HM', 'Hauptmangel',         true),
  ('GM', 'Gefährlicher Mangel', true);
```

### 3.5 Sichten für häufige Abfragen

```sql
-- Tagesplan-View: alle Termine eines Datums, dekoriert mit Fahrzeug- und Status-Info
CREATE VIEW v_tagesplan AS
SELECT
  t.termin_id, t.datum, t.uhrzeit,
  f.kennzeichen, f.hersteller || ' ' || f.modell AS fahrzeug,
  h.name AS halter,
  pa.bezeichnung AS prueft,
  pr.name AS pruefer,
  s.bezeichnung AS status,
  EXISTS(
    SELECT 1 FROM mangel m
      JOIN mangel_kategorie k USING (kategorie_code)
    WHERE m.termin_id = t.termin_id
      AND k.blockiert_bestanden = true
  ) AS hat_hauptmangel
FROM termin t
  JOIN fahrzeug f ON f.fahrzeug_id = t.fahrzeug_id
  JOIN halter h ON h.halter_id = f.halter_id
  JOIN prueft pa ON pa.prueft_code = t.prueft_code
  LEFT JOIN pruefer pr ON pr.pruefer_kuerzel = t.pruefer_kuerzel
  JOIN status s ON s.status_code = t.status_code;

-- HU-Fälligkeits-Report
CREATE VIEW v_hu_faellig AS
SELECT
  f.kennzeichen, f.hersteller || ' ' || f.modell AS fahrzeug,
  h.name AS halter, h.telefon, h.email,
  f.hu_faellig,
  (f.hu_faellig - CURRENT_DATE) AS tage_bis_faellig,
  CASE
    WHEN f.hu_faellig < CURRENT_DATE THEN 'ueberfaellig'
    WHEN f.hu_faellig < CURRENT_DATE + 30 THEN 'kritisch'
    WHEN f.hu_faellig < CURRENT_DATE + 90 THEN 'bald'
    ELSE 'ok'
  END AS status
FROM fahrzeug f
JOIN halter h ON h.halter_id = f.halter_id
WHERE f.hu_faellig IS NOT NULL
ORDER BY f.hu_faellig;
```

---

## 4. Vergleich: Konzeptionell vs. Logisch vs. Physisch — was gehört wohin?

| Aspekt | Konzeptuell | Logisch | Physisch |
|---|---|---|---|
| Entitäten / Beziehungen | ✓ | — | — |
| Attribute (Domäne, fachlich) | ✓ | — | — |
| Geschäftsregeln (textuell) | ✓ | — | — |
| Relationen / Schlüssel | — | ✓ | — |
| Normalisierung 3NF | — | ✓ | — |
| Referentielle Integrität (FK, ON DELETE) | — | ✓ | — |
| CHECK-Constraints (deklarativ) | — | ✓ | — |
| Datentypen (DBMS-spezifisch wie UUID, TIMESTAMPTZ) | — | (✓) | ✓ |
| Indizes | — | — | ✓ |
| Trigger | — | — | ✓ |
| Stored Procedures | — | — | ✓ |
| Sichten (Views) | — | — | ✓ |
| Tablespaces / Partitionierung | — | — | ✓ |

---

## 5. Diskussion: Warum überhaupt PostgreSQL?

Die ursprüngliche Sprint-1-Wahl war Firebase Firestore (NoSQL-Document-Store).
Im Sprint-5-Feedback hat Frau Fuchs zurecht argumentiert, dass unsere Daten
stark strukturiert sind und sich für eine relationale Datenbank besser eignen.
Mit Sprint 7 (geplant nach 13.05.2026) migrieren wir auf PostgreSQL.

### 5.1 Pro PostgreSQL

| Aspekt | Vorteil |
|---|---|
| Strukturierte Daten | Schema-Erzwingung verhindert Datenmüll |
| Referentielle Integrität | FK-Constraints und ON DELETE-Verhalten deklarativ |
| Transaktionen | Echtes ACID — atomare Mehrfach-Updates ohne Aufwand |
| Reporting | SQL-Aggregationen, GROUP BY, Window Functions |
| Migrationen | Werkzeuge wie Flyway, Liquibase, Drizzle Migrations |
| Lokal lauffähig | Per Docker oder über PGlite (WASM) sogar im Browser |

### 5.2 Pro Firestore (warum es initial gewählt wurde)

| Aspekt | Vorteil |
|---|---|
| Echtzeit-Sync | `onSnapshot` API gratis |
| Serverlos | Kein eigenes Backend |
| Skalierung | Automatisch |

### 5.3 Bewertung im Projekt-Kontext

**Akademisch:** PostgreSQL ist die saubere Wahl für strukturierte Daten mit
relationalem Charakter. Firestore war eine Pragmatik-Entscheidung, die wir mit
Sprint 7 korrigieren.

**Technisch:** Mit **PGlite** (electric-sql.com/pglite) lässt sich
PostgreSQL als WebAssembly **lokal im Browser** ausführen — Persistenz über
IndexedDB, Größe ~3 MB. Damit erfüllen wir Frau Fuchs's Anforderung
„**lokale relationale Datenbank**" wörtlich und ohne Backend-Komponente.

---

## 6. Migrationsplan (Sprint 7)

| Phase | Inhalt | Aufwand |
|---|---|---|
| **7.1** | DDL-Skripte erstellen (`schema.sql`), Seed-Skript für Domänen-Tabellen | 0,5 d |
| **7.2** | PGlite + Drizzle ORM in das Projekt einbinden, `useDb`-Hook ersetzt `useStore` | 1 d |
| **7.3** | Export-Skript Firestore → PostgreSQL (einmalig) für Demo-Daten-Übernahme | 0,5 d |
| **7.4** | Echtzeit-Update via Polling oder Event-Bus (kein `onSnapshot` mehr) | 0,5 d |
| **7.5** | Tests aktualisieren: vorher Firestore-Mock, jetzt SQL-Asserts | 0,5 d |
| **Gesamt** | | **3 d** |

---

## 7. Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-04-15 | Erste Sprint-1-Skizze (eingebettetes Halter / Mangel) |
| 1.1 | 2026-04-24 | Attribute formalisiert, Integritätsbedingungen explizit, NoSQL-vs-RDBMS-Diskussion |
| 1.2 | 2026-04-27 | Domänen-Whitelists (KBA-Liste, Hersteller-Modell-Konsistenz) ergänzt |
| **2.0** | **2026-05-13** | **Komplett umstrukturiert nach Feedback Frau Fuchs (13.05.):** Drei-Schichten-Modell (konzeptuell / logisch / physisch); 3NF-Normalisierung mit eigenständiger HALTER- und MANGEL-Relation; SQL-Trigger ausschließlich im physischen Kapitel diskutiert und bewusst nicht eingesetzt; PostgreSQL-Migration in Sprint 7 als Antwort auf „lokale relationale Datenbank"-Anforderung |
