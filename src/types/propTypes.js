import PropTypes from "prop-types";

export const MangelShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  kat: PropTypes.oneOf(["OM", "GM", "EM", "HM", "GF"]).isRequired,
  behoben: PropTypes.bool,
});

export const FahrzeugShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  kennzeichen: PropTypes.string.isRequired,
  fin: PropTypes.string,
  hersteller: PropTypes.string,
  modell: PropTypes.string,
  baujahr: PropTypes.number,
  farbe: PropTypes.string,
  typ: PropTypes.string,
  kmStand: PropTypes.number,
  besitzer: PropTypes.string,
  telefon: PropTypes.string,
  email: PropTypes.string,
  createdAt: PropTypes.string,
  hu_faellig: PropTypes.string,
});

export const TerminShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  fahrzeugId: PropTypes.string.isRequired,
  datum: PropTypes.string.isRequired,
  uhrzeit: PropTypes.string,
  art: PropTypes.string,
  pruefer: PropTypes.string,
  status: PropTypes.string.isRequired,
  notiz: PropTypes.string,
  mängel: PropTypes.arrayOf(MangelShape),
  createdAt: PropTypes.string,
});

export const ToastShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  msg: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["success", "error", "info", "warn"]),
});
