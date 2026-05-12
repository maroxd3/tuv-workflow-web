import { useCallback, useEffect, useState, useRef } from "react";
import { collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { uid, isoDate, addDays } from "../utils/date";
import { STATUS } from "../constants/status";
import { hatHauptmangel } from "../utils/mangel";

const MODE_KEY = "tuvpro_mode_v1";
const LOAD_FALLBACK_MS = 3000;

const COLLECTIONS = {
  demo: {
    fz: "fahrzeuge",
    tr: "termine",
    fzCache: "tuvpro_fz_v3",
    trCache: "tuvpro_tr_v3",
  },
  normal: {
    fz: "fahrzeuge_real",
    tr: "termine_real",
    fzCache: "tuvpro_fz_v3_real",
    trCache: "tuvpro_tr_v3_real",
  },
};

function readMode() {
  try {
    return localStorage.getItem(MODE_KEY) === "normal" ? "normal" : "demo";
  } catch {
    return "demo";
  }
}

function readLocalCache(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* quota exceeded — silently drop */
  }
}

function makeSeed() {
  const today = isoDate(), yd = addDays(today, -1), tm = addDays(today, 1), db2 = addDays(today, -2);
  const fz = [
    { id:uid(), kennzeichen:"B-TK 1234", fin:"WBA3A5C50CF256985", hersteller:"BMW", modell:"320d xDrive", baujahr:2018, farbe:"Sophistograu", typ:"PKW", kmStand:87420, besitzer:"Klaus Müller", telefon:"0176 1234567", email:"k.mueller@mail.de", createdAt:today, hu_faellig:addDays(today,180) },
    { id:uid(), kennzeichen:"HH-AB 5678", fin:"WVWZZZ1KZ5W315264", hersteller:"Volkswagen", modell:"Golf VIII GTI", baujahr:2021, farbe:"Schwarzsilber", typ:"PKW", kmStand:42100, besitzer:"Sabine Koch", telefon:"0178 9876543", email:"s.koch@web.de", createdAt:today, hu_faellig:addDays(today,540) },
    { id:uid(), kennzeichen:"M-XZ 9900", fin:"3FADP4BJ1EM198765", hersteller:"Ford", modell:"Transit L3H2 2.0 TDCi", baujahr:2016, farbe:"Arktikweiß", typ:"Transporter", kmStand:196300, besitzer:"Bau GmbH Lehmann", telefon:"089 55443322", email:"info@lehmann-bau.de", createdAt:yd, hu_faellig:addDays(today,30) },
    { id:uid(), kennzeichen:"S-LM 2233", fin:"ZFA31200001234567", hersteller:"Fiat", modell:"Ducato 35 Maxi", baujahr:2015, farbe:"Polarweiß", typ:"Transporter", kmStand:234000, besitzer:"Tarek Osman", telefon:"0171 4445566", email:"t.osman@gmail.com", createdAt:yd, hu_faellig:addDays(today,-14) },
    { id:uid(), kennzeichen:"K-RP 4411", fin:"WMWRC31060TJ32154", hersteller:"MINI", modell:"Cooper S Clubman", baujahr:2022, farbe:"Moonwalk Grey", typ:"PKW", kmStand:18900, besitzer:"Anna Richter", telefon:"0162 7778899", email:"a.richter@outlook.de", createdAt:today, hu_faellig:addDays(today,720) },
    { id:uid(), kennzeichen:"D-EF 7712", fin:"WDD2052281A123456", hersteller:"Mercedes-Benz", modell:"Sprinter 316 CDI", baujahr:2019, farbe:"Arktikweiß", typ:"Transporter", kmStand:141000, besitzer:"Kurierdienst Schnell GmbH", telefon:"0211 3344556", email:"fuhrpark@schnell-gmbh.de", createdAt:db2, hu_faellig:addDays(today,60) },
    { id:uid(), kennzeichen:"F-ML 3390", fin:"WBAVD13500KX12345", hersteller:"BMW", modell:"iX3 M Sport", baujahr:2023, farbe:"Mineralweiß", typ:"BEV", kmStand:22400, besitzer:"Dr. Julia Vogel", telefon:"069 77889900", email:"j.vogel@kanzlei-vogel.de", createdAt:db2, hu_faellig:addDays(today,900) },
    { id:uid(), kennzeichen:"KS-TF 1100", fin:"VF7RHN9HPEJ123456", hersteller:"Citroën", modell:"Berlingo M 1.5 BlueHDi", baujahr:2017, farbe:"Perla Nera", typ:"Transporter", kmStand:178000, besitzer:"Malerbetrieb Heinz Schreiber", telefon:"0561 123456", email:"schreiber-maler@t-online.de", createdAt:db2, hu_faellig:addDays(today,-2) },
  ];

  const [f1,f2,f3,f4,f5,f6,f7,f8] = fz;
  const tr = [
    { id:uid(), fahrzeugId:f1.id, datum:today, uhrzeit:"08:00", art:"HU_AU", pruefer:"MW", status:STATUS.BESTANDEN, notiz:"Fahrzeug in sehr gutem Zustand. Geringer Mangel an Bremsflüssigkeit notiert.", mängel:[{id:uid(),code:"2.5.1",text:"Bremsflüssigkeit: Wasseranteil zu hoch (> 3,5%)",kat:"LM",behoben:false}], createdAt:today },
    { id:uid(), fahrzeugId:f2.id, datum:today, uhrzeit:"09:00", art:"HU", pruefer:"AF", status:STATUS.IN_PRUEFUNG, notiz:"", mängel:[], createdAt:today },
    { id:uid(), fahrzeugId:f3.id, datum:today, uhrzeit:"10:30", art:"HU_AU", pruefer:"SK", status:STATUS.NICHT_BESTANDEN, notiz:"Fahrzeug nicht verkehrssicher. Hauptmängel an Bremsen und Reifen. Sofortige Nachprüfung erforderlich.", mängel:[{id:uid(),code:"2.1.1",text:"Betriebsbremse: Ungleichmäßige Bremswirkung",kat:"HM",behoben:false},{id:uid(),code:"4.1.1",text:"Profiltiefe: Profiltiefe unter 1,6 mm",kat:"HM",behoben:false},{id:uid(),code:"3.3.1",text:"Bremslicht: Bremslicht links defekt",kat:"HM",behoben:false},{id:uid(),code:"2.3.1",text:"Bremsscheibe: Bremsscheibe stark verschlissen",kat:"HM",behoben:false},{id:uid(),code:"5.6.2",text:"Kennzeichen: Hinteres Kennzeichen unleserlich",kat:"HM",behoben:false}], createdAt:today },
    { id:uid(), fahrzeugId:f4.id, datum:today, uhrzeit:"13:00", art:"NP", pruefer:"MW", status:STATUS.GEPLANT, notiz:"Nachprüfung nach HU vom 15.06.", mängel:[], createdAt:today },
    { id:uid(), fahrzeugId:f5.id, datum:today, uhrzeit:"14:30", art:"HU", pruefer:"LN", status:STATUS.GEPLANT, notiz:"", mängel:[], createdAt:today },
    { id:uid(), fahrzeugId:f6.id, datum:today, uhrzeit:"15:00", art:"SP", pruefer:"TB", status:STATUS.GEPLANT, notiz:"Regelmäßige SP für Gewerbebetrieb", mängel:[], createdAt:today },
    { id:uid(), fahrzeugId:f7.id, datum:today, uhrzeit:"16:00", art:"HU_AU", pruefer:"AF", status:STATUS.GEPLANT, notiz:"Erstprüfung BEV – OBD-Diagnose einplanen.", mängel:[], createdAt:today },
    { id:uid(), fahrzeugId:f2.id, datum:yd, uhrzeit:"09:30", art:"AU", pruefer:"TB", status:STATUS.BESTANDEN, notiz:"", mängel:[], createdAt:yd },
    { id:uid(), fahrzeugId:f1.id, datum:tm, uhrzeit:"08:30", art:"HU", pruefer:"MW", status:STATUS.GEPLANT, notiz:"", mängel:[], createdAt:today },
    { id:uid(), fahrzeugId:f8.id, datum:today, uhrzeit:"11:00", art:"HU_AU", pruefer:"SK", status:STATUS.NACHPRUEFUNG, notiz:"Erhebliche Mängel. Nachprüfung in 4 Wochen empfohlen.", mängel:[{id:uid(),code:"8.1.1",text:"Stoßdämpfer: Stoßdämpfer vorne defekt",kat:"EM",behoben:false},{id:uid(),code:"4.1.2",text:"Profiltiefe: 1,6–3 mm (Empfehlung: wechseln)",kat:"EM",behoben:false},{id:uid(),code:"3.5.3",text:"Blinker: Fahrtrichtungsanzeiger hinten links defekt",kat:"EM",behoben:false}], createdAt:today },
    { id:uid(), fahrzeugId:f3.id, datum:yd, uhrzeit:"14:00", art:"Abnahme", pruefer:"AF", status:STATUS.BESTANDEN, notiz:"", mängel:[{id:uid(),code:"5.2.1",text:"Karosserie: Scharfe Kanten durch Unfallschaden",kat:"EM",behoben:true}], createdAt:yd },
    { id:uid(), fahrzeugId:f6.id, datum:db2, uhrzeit:"10:00", art:"HU_AU", pruefer:"MW", status:STATUS.BESTANDEN, notiz:"", mängel:[], createdAt:db2 },
    { id:uid(), fahrzeugId:f4.id, datum:db2, uhrzeit:"13:30", art:"HU", pruefer:"LN", status:STATUS.NICHT_BESTANDEN, notiz:"", mängel:[{id:uid(),code:"6.1.1",text:"Abgasanlage: Undichtigkeit Abgasanlage",kat:"HM",behoben:false},{id:uid(),code:"2.6.1",text:"Feststellbremse: Feststellbremse hält nicht ausreichend",kat:"HM",behoben:false}], createdAt:db2 },
  ];

  return { fahrzeuge: fz, termine: tr };
}

/* ── Firestore helpers (collection name passed explicitly so the same helper
   serves demo + normal modes) ── */
function writeFzDoc(col, f) { setDoc(doc(db, col, f.id), f).catch(() => {}); }
function writeTrDoc(col, t) { setDoc(doc(db, col, t.id), t).catch(() => {}); }
function removeFzDoc(col, id) { deleteDoc(doc(db, col, id)).catch(() => {}); }
function removeTrDoc(col, id) { deleteDoc(doc(db, col, id)).catch(() => {}); }

export function useStore() {
  const [mode, setMode] = useState(readMode);

  /* Initialise state from the *current mode's* cache so reloads and mode
     toggles paint instantly without a blank flash. */
  const [fz, setFz] = useState(() => readLocalCache(COLLECTIONS[readMode()].fzCache));
  const [tr, setTr] = useState(() => readLocalCache(COLLECTIONS[readMode()].trCache));
  const [ready, setReady] = useState(false);

  /* Track which modes we've already auto-seeded so toggling away and back
     doesn't repeatedly recreate seed rows with fresh UUIDs. */
  const seeded = useRef({});

  /* ── Subscribe to Firestore for the active mode; re-runs on mode change.
     `ready` only flips false→true once on first load; subsequent mode toggles
     don't reset it because toggleMode pre-fills state from the target cache
     synchronously, so the UI never needs a second loading screen. ── */
  useEffect(() => {
    const cfg = COLLECTIONS[mode];
    let fzLoaded = false, trLoaded = false;
    let active = true;

    const markReady = () => {
      if (active && fzLoaded && trLoaded) setReady(true);
    };

    /* If Firestore never replies (offline / unconfigured), unblock the UI. We
       keep whatever was loaded from the localStorage cache at hook init. */
    const fallbackTimer = window.setTimeout(() => {
      if (!active || (fzLoaded && trLoaded)) return;
      fzLoaded = true;
      trLoaded = true;
      markReady();
    }, LOAD_FALLBACK_MS);

    const unsubFz = onSnapshot(collection(db, cfg.fz), snap => {
      if (!active) return;
      setFz(snap.docs.map(d => d.data()));
      fzLoaded = true;
      markReady();
    }, () => {
      if (!active) return;
      /* Error path: keep cache-prefilled state untouched. */
      fzLoaded = true;
      markReady();
    });

    const unsubTr = onSnapshot(collection(db, cfg.tr), snap => {
      if (!active) return;
      setTr(snap.docs.map(d => d.data()));
      trLoaded = true;
      markReady();
    }, () => {
      if (!active) return;
      trLoaded = true;
      markReady();
    });

    return () => {
      active = false;
      window.clearTimeout(fallbackTimer);
      unsubFz();
      unsubTr();
    };
  }, [mode]);

  /* ── Seed the *demo* collections once if both Firestore and cache are empty.
     Normal mode never auto-seeds — it stays empty until the user adds data.
     setFz/setTr are deferred to a microtask so the seed effect itself stays
     a pure side-effect (writes to Firestore) and React's "no setState in
     effect" guidance is honoured. ── */
  useEffect(() => {
    if (!ready) return;
    if (mode !== "demo") return;
    if (seeded.current[mode]) return;
    if (fz.length !== 0 || tr.length !== 0) {
      seeded.current[mode] = true;
      return;
    }
    seeded.current[mode] = true;
    const cfg = COLLECTIONS[mode];
    const seed = makeSeed();
    seed.fahrzeuge.forEach(f => writeFzDoc(cfg.fz, f));
    seed.termine.forEach(t => writeTrDoc(cfg.tr, t));
    queueMicrotask(() => {
      setFz(seed.fahrzeuge);
      setTr(seed.termine);
    });
  }, [ready, mode, fz.length, tr.length]);

  /* ── Mirror state to localStorage cache. Always writes (no length guard) so
     deletions and "leere Liste" states survive a refresh. ── */
  useEffect(() => {
    writeLocalCache(COLLECTIONS[mode].fzCache, fz);
  }, [fz, mode]);
  useEffect(() => {
    writeLocalCache(COLLECTIONS[mode].trCache, tr);
  }, [tr, mode]);

  /* ── CRUD operations (update local state + Firestore for current mode) ── */
  const addFz = useCallback(data => {
    const r = { ...data, id: uid(), createdAt: isoDate() };
    setFz(p => [r, ...p]);
    writeFzDoc(COLLECTIONS[mode].fz, r);
    return r;
  }, [mode]);

  const updFz = useCallback((id, patch) => {
    const col = COLLECTIONS[mode].fz;
    setFz(prev => prev.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, ...patch };
      writeFzDoc(col, updated);
      return updated;
    }));
  }, [mode]);

  const delFz = useCallback(id => {
    const { fz: fzCol, tr: trCol } = COLLECTIONS[mode];
    setFz(p => p.filter(f => f.id !== id));
    setTr(p => {
      const keep = [], remove = [];
      p.forEach(t => (t.fahrzeugId === id ? remove : keep).push(t));
      remove.forEach(t => removeTrDoc(trCol, t.id));
      return keep;
    });
    removeFzDoc(fzCol, id);
  }, [mode]);

  const addTr = useCallback(data => {
    const r = { ...data, id: uid(), mängel: [], createdAt: isoDate() };
    setTr(p => [r, ...p]);
    writeTrDoc(COLLECTIONS[mode].tr, r);
    return r;
  }, [mode]);

  const updTr = useCallback((id, patch) => {
    const col = COLLECTIONS[mode].tr;
    setTr(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...patch };
      /* "Bestanden" bei Hauptmangel nicht zulassen (§ 29 StVZO) — defense in depth. */
      if (patch.status === STATUS.BESTANDEN && hatHauptmangel(updated.mängel)) {
        return t;
      }
      writeTrDoc(col, updated);
      return updated;
    }));
  }, [mode]);

  const delTr = useCallback(id => {
    const col = COLLECTIONS[mode].tr;
    setTr(p => p.filter(t => t.id !== id));
    removeTrDoc(col, id);
  }, [mode]);

  const addMangel = useCallback((tid, m) => {
    const col = COLLECTIONS[mode].tr;
    setTr(p => p.map(t => {
      if (t.id !== tid) return t;
      const newMaengel = [...(t.mängel || []), { ...m, id: uid() }];
      const updated = { ...t, mängel: newMaengel };
      /* Auto-demote: Hauptmangel auf BESTANDEN ist unhaltbar → zurückstufen. */
      if (t.status === STATUS.BESTANDEN && hatHauptmangel(newMaengel)) {
        updated.status = STATUS.NICHT_BESTANDEN;
      }
      writeTrDoc(col, updated);
      return updated;
    }));
  }, [mode]);

  const delMangel = useCallback((tid, mid) => {
    const col = COLLECTIONS[mode].tr;
    setTr(p => p.map(t => {
      if (t.id !== tid) return t;
      const updated = { ...t, mängel: t.mängel.filter(m => m.id !== mid) };
      writeTrDoc(col, updated);
      return updated;
    }));
  }, [mode]);

  /* Mode-aware reset:
       demo   → wipe + reload fresh seed (keeps demo as a sandbox)
       normal → wipe to empty (user-owned data) */
  const resetAll = useCallback(() => {
    const cfg = COLLECTIONS[mode];
    fz.forEach(f => removeFzDoc(cfg.fz, f.id));
    tr.forEach(t => removeTrDoc(cfg.tr, t.id));
    if (mode === "demo") {
      const seed = makeSeed();
      seed.fahrzeuge.forEach(f => writeFzDoc(cfg.fz, f));
      seed.termine.forEach(t => writeTrDoc(cfg.tr, t));
      setFz(seed.fahrzeuge);
      setTr(seed.termine);
    } else {
      setFz([]);
      setTr([]);
    }
  }, [mode, fz, tr]);

  /* Toggle between demo and normal. State is swapped to the *target* mode's
     cache inside the same React batch so we never flash the wrong dataset
     into the other mode's cache. */
  const toggleMode = useCallback(() => {
    setMode(prev => {
      const next = prev === "demo" ? "normal" : "demo";
      try { localStorage.setItem(MODE_KEY, next); } catch { /* ignore */ }
      setFz(readLocalCache(COLLECTIONS[next].fzCache));
      setTr(readLocalCache(COLLECTIONS[next].trCache));
      return next;
    });
  }, []);

  return {
    mode, toggleMode,
    fahrzeuge: fz, termine: tr, ready,
    addFz, updFz, delFz, addTr, updTr, delTr, addMangel, delMangel, resetAll,
  };
}
