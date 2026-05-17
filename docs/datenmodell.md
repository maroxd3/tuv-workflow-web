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

## 2. ER-Diagramm

```mermaid
erDiagram
  HALTER ||--o{ FAHRZEUG : besitzt
  FAHRZEUG ||--o{ TERMIN : hat
  TERMIN ||--o{ MANGEL : enthaelt
  STATUS ||--o{ TERMIN : klassifiziert
  PRUEFART ||--o{ TERMIN : typisiert
  PRUEFER ||--o{ TERMIN : prueft
  MANGEL_KATEGORIE ||--o{ MANGEL : bewertet

  HALTER {
    char36 halter_id PK
    varchar name
    varchar telefon
    varchar email UK
    text anschrift
    datetime erfasst_am
  }

  FAHRZEUG {
    char36 fahrzeug_id PK
    varchar kennzeichen UK
    varchar fin UK
    varchar hersteller
    varchar modell
    int baujahr
    varchar farbe
    varchar typ
    int kilometerstand
    date hu_faellig
    char36 halter_id FK
    datetime erfasst_am
  }

  TERMIN {
    char36 termin_id PK
    char36 fahrzeug_id FK
    date datum
    time uhrzeit
    varchar prueft_code FK
    varchar pruefer_kuerzel FK
    varchar status_code FK
    text notiz
    datetime erfasst_am
  }

  MANGEL {
    char36 mangel_id PK
    char36 termin_id FK
    varchar code_stvzo
    text beschreibung
    varchar kategorie_code FK
    boolean behoben
    datetime erfasst_am
  }

  STATUS {
    varchar status_code PK
    varchar bezeichnung
    boolean ist_endzustand
  }

  PRUEFART {
    varchar prueft_code PK
    varchar bezeichnung
  }

  PRUEFER {
    varchar pruefer_kuerzel PK
    varchar name
    varchar qualifikation
  }

  MANGEL_KATEGORIE {
    varchar kategorie_code PK
    varchar bezeichnung
    boolean blockiert_bestanden
  }
```

Kardinalitaeten:

- Ein Halter kann mehrere Fahrzeuge besitzen; ein Fahrzeug gehoert genau zu
  einem Halter.
- Ein Fahrzeug kann mehrere Termine haben; ein Termin gehoert genau zu einem
  Fahrzeug.
- Ein Termin kann mehrere Maengel enthalten; ein Mangel gehoert genau zu einem
  Termin.
- Status, Pruefart und Mangelkategorie sind Stammdaten.
- Ein Termin kann optional einem Pruefer zugeordnet sein.

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
