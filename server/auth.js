// Benutzer-Authentifizierung: Passwort-Hashing, Token-Signierung und
// Rollen-Matrix. Bewusst NUR pure Funktionen auf node:crypto-Basis — kein
// bcrypt/jsonwebtoken-Dependency (On-Premise-Deployment soll ohne native
// Build-Toolchain auskommen) und keine DB-Zugriffe, damit das Modul ohne
// laufende MariaDB unit-testbar bleibt (server/tests/auth.test.js).
import {
  scryptSync,
  randomBytes,
  createHmac,
  createHash,
  timingSafeEqual,
} from "node:crypto";

// ── Passwort-Hashing (scrypt) ─────────────────────────────────────────
// Format: scrypt$<N>$<r>$<p>$<saltHex>$<hashHex>
// Die Parameter stehen im Hash selbst, damit sie spaeter erhoeht werden
// koennen, ohne bestehende Hashes zu invalidieren (verify liest sie aus
// dem gespeicherten String, nicht aus einer globalen Konstante).
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SALT_BYTES = 16;
const KEY_BYTES = 64;

export function hashPassword(pw) {
  const salt = randomBytes(SALT_BYTES);
  const hash = scryptSync(pw, salt, KEY_BYTES, {
    N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

// Vergleicht ein Klartext-Passwort gegen einen gespeicherten Hash.
// timingSafeEqual statt `===`: ein naiver Vergleich bricht beim ersten
// abweichenden Byte ab und leakt ueber die Antwortzeit Information.
// Liefert bei jedem Parse-Problem false statt zu werfen — ein kaputter
// DB-Wert darf den Login-Endpoint nicht mit einem 500 abschiessen.
export function verifyPassword(pw, stored) {
  if (typeof pw !== "string" || typeof stored !== "string") return false;
  const teile = stored.split("$");
  if (teile.length !== 6 || teile[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltHex, hashHex] = teile;
  const N = Number(nStr), r = Number(rStr), p = Number(pStr);
  // Plausibilitaets-Grenzen: verhindert, dass ein manipulierter DB-Wert
  // scrypt mit absurden Parametern (Speicher-Bombe) aufruft.
  if (!Number.isInteger(N) || N < 2 || N > 2 ** 20) return false;
  if (!Number.isInteger(r) || r < 1 || r > 32) return false;
  if (!Number.isInteger(p) || p < 1 || p > 16) return false;
  if (!/^[0-9a-f]+$/i.test(saltHex) || !/^[0-9a-f]+$/i.test(hashHex)) return false;
  if (hashHex.length % 2 !== 0) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const erwartet = Buffer.from(hashHex, "hex");
    const berechnet = scryptSync(pw, salt, erwartet.length, {
      N, r, p, maxmem: 256 * N * r,
    });
    return timingSafeEqual(berechnet, erwartet);
  } catch {
    return false;
  }
}

// ── Token (HMAC-SHA256, JWT-artig aber ohne Dependency) ───────────────
// Aufbau: base64url(JSON-Payload) + "." + base64url(HMAC-SHA256(payload)).
// Kein Header-Segment wie bei JWT — der Algorithmus ist fest (kein
// alg=none-Downgrade moeglich). Payload: { kuerzel, name, rolle, exp }
// mit exp als Millisekunden-Timestamp (Date.now() + TOKEN_GUELTIGKEIT_MS).
export const TOKEN_GUELTIGKEIT_MS = 12 * 60 * 60 * 1000; // 12 Stunden

export function signToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

// Prueft Signatur und Ablauf; liefert die Payload oder null. Die Signatur
// wird timing-sicher verglichen — beide Seiten werden vorher gehasht,
// damit timingSafeEqual gleich lange Buffer bekommt (gleiches Muster wie
// tokenMatches in server/index.js).
export function verifyToken(token, secret) {
  if (typeof token !== "string") return null;
  const teile = token.split(".");
  if (teile.length !== 2) return null;
  const [body, sig] = teile;
  const erwartet = createHmac("sha256", secret).update(body).digest();
  const geliefert = Buffer.from(sig, "base64url");
  const a = createHash("sha256").update(erwartet).digest();
  const b = createHash("sha256").update(geliefert).digest();
  if (!timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload?.exp !== "number" || payload.exp <= Date.now()) return null;
  return payload;
}

// ── Rollen-Matrix ─────────────────────────────────────────────────────
// Drei Rollen entsprechend der drei Arbeitsplaetze in der Pruefstelle
// (siehe Architektur-Diagramm im README):
//   empfang — Terminvergabe: Stammdaten und Termine pflegen, aber keine
//             Pruefungs-Entscheidungen (Status) und nichts loeschen.
//   pruefer — fachliche Ebene: zusaetzlich Status setzen und Maengel
//             erfassen/entfernen (Maengel-Rechte == statusSetzen-Level).
//   chef    — alles, inkl. Loeschen und /api/admin/*.
// Lesen duerfen alle drei Rollen.
export const ROLLEN_RECHTE = {
  empfang: { schreiben: true, statusSetzen: false, loeschen: false },
  pruefer: { schreiben: true, statusSetzen: true,  loeschen: false },
  chef:    { schreiben: true, statusSetzen: true,  loeschen: true  },
};

// Helfer liefern fuer unbekannte Rollen immer false (fail-closed).
export function darfSchreiben(rolle) {
  return ROLLEN_RECHTE[rolle]?.schreiben === true;
}
export function darfStatusSetzen(rolle) {
  return ROLLEN_RECHTE[rolle]?.statusSetzen === true;
}
export function darfLoeschen(rolle) {
  return ROLLEN_RECHTE[rolle]?.loeschen === true;
}
