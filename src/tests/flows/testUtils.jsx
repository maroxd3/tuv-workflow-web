/**
 * Gemeinsame Fixtures + Render-Helfer fuer die View-Level-Flow-Tests
 * (src/tests/flows/*). Der apiClient selbst wird in jeder Testdatei per
 * vi.mock ersetzt (siehe apiClientMock.js) — hier liegen nur Daten in
 * DB-Form und das App-Rendering inkl. AuthProvider (wie in main.jsx).
 */
import { render } from "@testing-library/react";
import { AuthProvider } from "../../auth/AuthContext";
import App from "../../App.jsx";
import { isoDate } from "../../utils/date";

/** Heutiges Datum — Termine mit diesem Datum sind im Tagesplan sichtbar. */
export const HEUTE = isoDate();

export const BENUTZER = {
  chef:    { kuerzel: "AD", name: "Administrator", rolle: "chef" },
  pruefer: { kuerzel: "MW", name: "M. Weber",      rolle: "pruefer" },
  empfang: { kuerzel: "EK", name: "E. Klein",      rolle: "empfang" },
};

export const HALTER_1 = {
  halterId: "11111111-1111-4111-8111-111111111111",
  name: "Klaus Müller",
  telefon: "0176 1234567",
  email: "k.mueller@mail.de",
  anschrift: null,
  erfasstAm: "2026-05-01T08:00:00.000Z",
};

export const FZ_1 = {
  fahrzeugId: "22222222-2222-4222-8222-222222222222",
  kennzeichen: "H-AB 1234",
  fin: "WBA3A5C50CF256985",
  hersteller: "BMW",
  modell: "320d",
  baujahr: 2019,
  farbe: "Schwarz",
  typ: "PKW",
  kilometerstand: 87420,
  huFaellig: "2099-08-01", // weit in der Zukunft → keine HU-Warn-Badges
  halterId: HALTER_1.halterId,
  erfasstAm: "2026-05-01T08:05:00.000Z",
};

export const TERMIN_ID = "44444444-4444-4444-8444-444444444444";

/** Termin in DB-Form (inkl. maengel-Array wie listTermine({includeMaengel})). */
export function terminFixture(overrides = {}) {
  return {
    terminId: TERMIN_ID,
    fahrzeugId: FZ_1.fahrzeugId,
    datum: HEUTE,
    uhrzeit: "08:30:00",
    prueftCode: "HU",
    prueferKuerzel: "MW",
    statusCode: "Geplant",
    notiz: null,
    erfasstAm: "2026-07-01T08:00:00.000Z",
    maengel: [],
    ...overrides,
  };
}

/** Unbehobener Erheblicher Mangel (EM) — blockiert "Bestanden" (WF-01). */
export function mangelEmFixture(overrides = {}) {
  return {
    mangelId: "33333333-3333-4333-8333-333333333333",
    terminId: TERMIN_ID,
    codeStvzo: "2.1.2",
    beschreibung: "Betriebsbremse: Bremswirkung unzureichend",
    kategorieCode: "EM",
    behoben: false,
    erfasstAm: "2026-07-01T09:00:00.000Z",
    ...overrides,
  };
}

/**
 * Primt den gemockten apiClient mit Standard-Antworten:
 *  - benutzer gesetzt → GET /auth/me erfolgreich (eingeloggt)
 *  - benutzer null    → /auth/me rejected wie ein 401 → LoginView
 *  - Die list*-Mocks geben die uebergebenen Arrays LIVE (per Referenz)
 *    zurueck: sollte der 5-Sekunden-Poll waehrend eines langsamen Tests
 *    feuern, schreibt er keinen veralteten Stand zurueck — Tests, die
 *    Writes simulieren, mutieren einfach dasselbe Array.
 */
export function primeApi(apiMock, { benutzer = null, halter = [HALTER_1], fahrzeuge = [FZ_1], termine = [] } = {}) {
  if (benutzer) {
    apiMock.authMe.mockResolvedValue({ authRequired: true, benutzer });
  } else {
    apiMock.authMe.mockRejectedValue(new Error("Anmeldung erforderlich"));
  }
  apiMock.initDatabase.mockResolvedValue(undefined);
  // Wichtig: Kopien zurueckgeben ([...arr]) — NIE die Live-Referenz. Sonst
  // wird das Array zum React-State, und ein test-seitiges push() mutiert
  // den State mitten im Update (→ doppelte Eintraege, duplicate keys).
  apiMock.listHalter.mockImplementation(async () => [...halter]);
  apiMock.listFahrzeuge.mockImplementation(async () => [...fahrzeuge]);
  apiMock.listTermine.mockImplementation(async () => [...termine]);
  return { halter, fahrzeuge, termine };
}

/** Rendert die App exakt wie main.jsx: Auth-Gate + AppShell im AuthProvider. */
export function renderApp() {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
}
