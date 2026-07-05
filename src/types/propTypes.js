import PropTypes from "prop-types";

/**
 * PropTypes-Shapes in DB-Form (siehe src/db/types.ts).
 *
 * datum/uhrzeit/erfasstAm koennen je nach API-Quelle als String ODER
 * Date-Objekt ankommen — Views normalisieren mit toIsoDateStr/toTimeStr
 * aus src/utils/date.js.
 */

const dateOrString = PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]);

export const HalterShape = PropTypes.shape({
  halterId: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  telefon: PropTypes.string,
  email: PropTypes.string,
  anschrift: PropTypes.string,
  erfasstAm: dateOrString,
});

export const MangelShape = PropTypes.shape({
  mangelId: PropTypes.string.isRequired,
  terminId: PropTypes.string,
  codeStvzo: PropTypes.string, // null = Freitext-Mangel ("FR")
  beschreibung: PropTypes.string.isRequired,
  kategorieCode: PropTypes.oneOf(["OM", "GM", "EM", "GfM"]).isRequired,
  behoben: PropTypes.bool,
  erfasstAm: dateOrString,
});

export const FahrzeugShape = PropTypes.shape({
  fahrzeugId: PropTypes.string.isRequired,
  kennzeichen: PropTypes.string.isRequired,
  fin: PropTypes.string,
  hersteller: PropTypes.string,
  modell: PropTypes.string,
  baujahr: PropTypes.number,
  farbe: PropTypes.string,
  typ: PropTypes.string,
  kilometerstand: PropTypes.number,
  huFaellig: dateOrString,
  halterId: PropTypes.string.isRequired,
  erfasstAm: dateOrString,
});

export const TerminShape = PropTypes.shape({
  terminId: PropTypes.string.isRequired,
  fahrzeugId: PropTypes.string.isRequired,
  datum: dateOrString.isRequired,
  uhrzeit: dateOrString,
  prueftCode: PropTypes.string,
  prueferKuerzel: PropTypes.string,
  statusCode: PropTypes.string.isRequired,
  notiz: PropTypes.string,
  maengel: PropTypes.arrayOf(MangelShape),
  erfasstAm: dateOrString,
});
