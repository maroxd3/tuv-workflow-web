# Datenmodell

Stand: 2026-05-17  
Zielsystem: MariaDB-Datenbank `tuv_workflow`.

## 1. Ueberblick

Die Anwendung verwaltet TUEV-Pruefprozesse relational. Das Modell trennt
Stammdaten, Bewegungsdaten und Maengel:

```text
HALTER 1 -- n FAHRZEUG 1 -- n TERMIN 1 -- n MANGEL

TERMIN n -- 1 STATUS
TERMIN n -- 1 PRUEFART
TERMIN n -- 0..1 PRUEFER
MANGEL n -- 1 MANGEL_KATEGORIE
```

Die physische Umsetzung liegt in `server/db.js`. Beim Start der Express-API
werden Datenbank, Tabellen und Stammdaten angelegt, falls sie fehlen.

## 2. Konzeptuelles Modell - Entity-Relationship-Diagramm

Das Diagramm zeigt das fachliche Modell im Chen-Stil: Entitaeten sind als
Rechtecke dargestellt, Beziehungen als Rauten und Attribute als Ovale. Die
Primaerschluessel sind wie in der klassischen Chen-Notation unterstrichen. Die
Fremdschluessel werden erst im logischen Relationenschema ausgewiesen, weil sie
aus den Beziehungen des ER-Modells abgeleitet werden.

### 2.1 ER-Diagramm (Chen-Notation, kompakt als Mermaid)

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

Legende: Rechteck = Entitaet, Raute = Beziehung, Oval = Attribut,
unterstrichenes Attribut = Primaerschluessel. Fremdschluessel sind als normale
Attribute dargestellt und im logischen Modell darunter eindeutig ausgewiesen.
Die Kardinalitaeten stehen direkt an den Verbindungslinien (`1`, `0..1` bzw.
`N`).

### 2.2 Entitaeten und ihre Bedeutung

| Entitaet | Reale Bedeutung |
|---|---|
| **HALTER** | Eigentuemer eines oder mehrerer Fahrzeuge - natuerliche oder juristische Person |
| **FAHRZEUG** | Eindeutiges Kraftfahrzeug, identifiziert durch Kennzeichen und/oder FIN |
| **TERMIN** | Konkreter Pruefungs-Termin eines Fahrzeugs zu einem Zeitpunkt |
| **MANGEL** | Festgestellte Beanstandung bei einer Pruefung gemaess StVZO Anlage VIII |
| **PRUEFER** | Sachverstaendiger Pruefingenieur, der den Termin durchfuehrt |
| **PRUEFART** | Klassifikation der Pruefung (HU, AU, HU+AU, Nachpruefung, ...) |
| **STATUS** | Zustand eines Termins im Workflow |
| **MANGEL_KATEGORIE** | Einstufung eines Mangels (OM, LM, EM, HM, GM) inklusive Wirkung auf das Pruefergebnis |

### 2.3 Beziehungen und Kardinalitaeten

| Beziehung | Kardinalitaet | Erlaeuterung |
|---|---|---|
| HALTER **besitzt** FAHRZEUG | 1 : N | Ein Halter kann mehrere Fahrzeuge besitzen; jedes Fahrzeug gehoert zu genau einem Halter |
| FAHRZEUG **wird geprueft in** TERMIN | 1 : N | Ein Fahrzeug hat im Laufe der Zeit beliebig viele Termine; jeder Termin gilt genau einem Fahrzeug |
| TERMIN **weist auf** MANGEL | 1 : N | Ein Termin kann mehrere Maengel haben; jeder Mangel ist genau einem Termin zugeordnet |
| PRUEFER **fuehrt durch** TERMIN | 0..1 : N | Ein Pruefer kann viele Termine durchfuehren; ein Termin kann noch ohne zugewiesenen Pruefer geplant sein |
| PRUEFART **klassifiziert** TERMIN | 1 : N | Jeder Termin ist genau einer Pruefart zugeordnet |
| STATUS **beschreibt Zustand** TERMIN | 1 : N | Jeder Termin hat zu einem Zeitpunkt genau einen Status |
| MANGEL_KATEGORIE **hat Kategorie** MANGEL | 1 : N | Jede Kategorie kann bei vielen Maengeln vorkommen; jeder Mangel hat genau eine Kategorie |

## 3. Relationen

### halter

| Spalte | Typ | Regel |
|---|---|---|
| `halter_id` | CHAR(36) | Primary Key |
| `name` | VARCHAR(160) | Pflichtfeld |
| `telefon` | VARCHAR(80) | optional |
| `email` | VARCHAR(160) | optional, eindeutig |
| `anschrift` | TEXT | optional |
| `erfasst_am` | DATETIME | Default `CURRENT_TIMESTAMP` |

### fahrzeug

| Spalte | Typ | Regel |
|---|---|---|
| `fahrzeug_id` | CHAR(36) | Primary Key |
| `kennzeichen` | VARCHAR(32) | Pflichtfeld, eindeutig |
| `fin` | VARCHAR(32) | optional, eindeutig |
| `hersteller` | VARCHAR(120) | Pflichtfeld |
| `modell` | VARCHAR(120) | Pflichtfeld |
| `baujahr` | INT | optional, CHECK 1885..2100 |
| `farbe` | VARCHAR(80) | optional |
| `typ` | VARCHAR(80) | Pflichtfeld |
| `kilometerstand` | INT | optional, CHECK 0..3000000 |
| `hu_faellig` | DATE | optional |
| `halter_id` | CHAR(36) | FK auf `halter` |
| `erfasst_am` | DATETIME | Default `CURRENT_TIMESTAMP` |

### termin

| Spalte | Typ | Regel |
|---|---|---|
| `termin_id` | CHAR(36) | Primary Key |
| `fahrzeug_id` | CHAR(36) | FK auf `fahrzeug`, CASCADE bei Fahrzeugloeschung |
| `datum` | DATE | Pflichtfeld |
| `uhrzeit` | TIME | optional |
| `prueft_code` | VARCHAR(40) | FK auf `pruefart` |
| `pruefer_kuerzel` | VARCHAR(20) | optionaler FK auf `pruefer`, SET NULL bei Loeschung |
| `status_code` | VARCHAR(40) | FK auf `status`, Default `Geplant` |
| `notiz` | TEXT | optional |
| `erfasst_am` | DATETIME | Default `CURRENT_TIMESTAMP` |

Eindeutigkeit: `(fahrzeug_id, datum, uhrzeit)`.

### mangel

| Spalte | Typ | Regel |
|---|---|---|
| `mangel_id` | CHAR(36) | Primary Key |
| `termin_id` | CHAR(36) | FK auf `termin`, CASCADE bei Terminloeschung |
| `code_stvzo` | VARCHAR(40) | optional |
| `beschreibung` | TEXT | Pflichtfeld |
| `kategorie_code` | VARCHAR(20) | FK auf `mangel_kategorie` |
| `behoben` | BOOLEAN | Default `FALSE` |
| `erfasst_am` | DATETIME | Default `CURRENT_TIMESTAMP` |

### status

| Spalte | Typ | Regel |
|---|---|---|
| `status_code` | VARCHAR(40) | Primary Key |
| `bezeichnung` | VARCHAR(80) | Pflichtfeld |
| `ist_endzustand` | BOOLEAN | Default `FALSE` |

Stammdaten: `Geplant`, `In Pruefung`, `Bestanden`, `Nicht bestanden`,
`Nachpruefung`, `Nicht erschienen`, `Abgebrochen`.

### pruefart

| Spalte | Typ | Regel |
|---|---|---|
| `prueft_code` | VARCHAR(40) | Primary Key |
| `bezeichnung` | VARCHAR(120) | Pflichtfeld |

### pruefer

| Spalte | Typ | Regel |
|---|---|---|
| `pruefer_kuerzel` | VARCHAR(20) | Primary Key |
| `name` | VARCHAR(120) | Pflichtfeld |
| `qualifikation` | VARCHAR(120) | optional |

### mangel_kategorie

| Spalte | Typ | Regel |
|---|---|---|
| `kategorie_code` | VARCHAR(20) | Primary Key |
| `bezeichnung` | VARCHAR(120) | Pflichtfeld |
| `blockiert_bestanden` | BOOLEAN | steuert WF-01 |

Stammdaten: OM, LM, EM, HM, GM. HM und GM blockieren `Bestanden`.

## 4. Normalisierung

Das Modell ist in 3NF:

- Halterdaten stehen nicht redundant im Fahrzeug.
- Fahrzeuge stehen nicht redundant im Termin.
- Maengel sind eigene Zeilen und keine eingebetteten Arrays.
- Status, Pruefarten, Pruefer und Mangelkategorien sind Stammdatentabellen.
- Nicht-Schluesselattribute haengen jeweils vom ganzen Primaerschluessel ab.

Damit werden Update-Anomalien vermieden und MariaDB kann referenzielle
Integritaet erzwingen.

## 5. Integritaetsregeln

| Regel | Umsetzung |
|---|---|
| Fahrzeug braucht Halter | FK `fahrzeug_halter_fk` mit RESTRICT |
| Termin braucht Fahrzeug | FK `termin_fahrzeug_fk` mit CASCADE |
| Mangel braucht Termin | FK `mangel_termin_fk` mit CASCADE |
| Terminstatus muss bekannt sein | FK auf `status` |
| Pruefart muss bekannt sein | FK auf `pruefart` |
| Mangelkategorie muss bekannt sein | FK auf `mangel_kategorie` |
| Kennzeichen eindeutig | UNIQUE KEY |
| FIN eindeutig, wenn gesetzt | UNIQUE KEY |
| Plausibles Baujahr | CHECK |
| Plausibler Kilometerstand | CHECK |

## 6. API-Mapping

Die Datenbank nutzt `snake_case`, das Frontend `camelCase`.
`server/index.js` mappt zwischen beiden Formen:

| DB | Frontend |
|---|---|
| `halter_id` | `halterId` |
| `fahrzeug_id` | `fahrzeugId` |
| `hu_faellig` | `huFaellig` |
| `prueft_code` | `prueftCode` |
| `pruefer_kuerzel` | `prueferKuerzel` |
| `status_code` | `statusCode` |
| `kategorie_code` | `kategorieCode` |
| `erfasst_am` | `erfasstAm` |

## 7. Aktueller Stand

- MariaDB ist die einzige produktive Datenbank.
- Express ist die einzige Laufzeit-Schnittstelle zur Datenbank.
- Das Frontend nutzt HTTP ueber `src/db/apiClient.ts`.
