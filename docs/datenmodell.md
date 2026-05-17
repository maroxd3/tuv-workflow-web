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

## 2. Relationen

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

## 3. Normalisierung

Das Modell ist in 3NF:

- Halterdaten stehen nicht redundant im Fahrzeug.
- Fahrzeuge stehen nicht redundant im Termin.
- Maengel sind eigene Zeilen und keine eingebetteten Arrays.
- Status, Pruefarten, Pruefer und Mangelkategorien sind Stammdatentabellen.
- Nicht-Schluesselattribute haengen jeweils vom ganzen Primaerschluessel ab.

Damit werden Update-Anomalien vermieden und MariaDB kann referenzielle
Integritaet erzwingen.

## 4. Integritaetsregeln

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

## 5. API-Mapping

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

## 6. Aktueller Stand

- MariaDB ist die einzige produktive Datenbank.
- Express ist die einzige Laufzeit-Schnittstelle zur Datenbank.
- Das Frontend nutzt HTTP ueber `src/db/apiClient.ts`.
