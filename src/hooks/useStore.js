import { useCallback, useEffect, useState } from "react";
import { uid, isoDate, addDays } from "../utils/date";
import { STATUS } from "../constants/status";

function makeSeed() {
  const today = isoDate(), yd = addDays(today, -1), tm = addDays(today, 1), db = addDays(today, -2);
  const fz = [
    { id:uid(), kennzeichen:"B-TK 1234", fin:"WBA3A5C50CF256985", hersteller:"BMW", modell:"320d xDrive", baujahr:2018, farbe:"Sophistograu", typ:"PKW", kmStand:87420, besitzer:"Klaus Müller", telefon:"0176 1234567", email:"k.mueller@mail.de", createdAt:today, hu_faellig:addDays(today,180) },
    { id:uid(), kennzeichen:"HH-AB 5678", fin:"WVWZZZ1KZ5W315264", hersteller:"Volkswagen", modell:"Golf VIII GTI", baujahr:2021, farbe:"Schwarzsilber", typ:"PKW", kmStand:42100, besitzer:"Sabine Koch", telefon:"0178 9876543", email:"s.koch@web.de", createdAt:today, hu_faellig:addDays(today,540) },
    { id:uid(), kennzeichen:"M-XZ 9900", fin:"3FADP4BJ1EM198765", hersteller:"Ford", modell:"Transit L3H2 2.0 TDCi", baujahr:2016, farbe:"Arktikweiß", typ:"Transporter", kmStand:196300, besitzer:"Bau GmbH Lehmann", telefon:"089 55443322", email:"info@lehmann-bau.de", createdAt:yd, hu_faellig:addDays(today,30) },
    { id:uid(), kennzeichen:"S-LM 2233", fin:"ZFA31200001234567", hersteller:"Fiat", modell:"Ducato 35 Maxi", baujahr:2015, farbe:"Polarweiß", typ:"Transporter", kmStand:234000, besitzer:"Tarek Osman", telefon:"0171 4445566", email:"t.osman@gmail.com", createdAt:yd, hu_faellig:addDays(today,-14) },
    { id:uid(), kennzeichen:"K-RP 4411", fin:"WMWRC31060TJ32154", hersteller:"MINI", modell:"Cooper S Clubman", baujahr:2022, farbe:"Moonwalk Grey", typ:"PKW", kmStand:18900, besitzer:"Anna Richter", telefon:"0162 7778899", email:"a.richter@outlook.de", createdAt:today, hu_faellig:addDays(today,720) },
    { id:uid(), kennzeichen:"D-EF 7712", fin:"WDD2052281A123456", hersteller:"Mercedes-Benz", modell:"Sprinter 316 CDI", baujahr:2019, farbe:"Arktikweiß", typ:"Transporter", kmStand:141000, besitzer:"Kurierdienst Schnell GmbH", telefon:"0211 3344556", email:"fuhrpark@schnell-gmbh.de", createdAt:db, hu_faellig:addDays(today,60) },
    { id:uid(), kennzeichen:"F-ML 3390", fin:"WBAVD13500KX12345", hersteller:"BMW", modell:"iX3 M Sport", baujahr:2023, farbe:"Mineralweiß", typ:"BEV", kmStand:22400, besitzer:"Dr. Julia Vogel", telefon:"069 77889900", email:"j.vogel@kanzlei-vogel.de", createdAt:db, hu_faellig:addDays(today,900) },
    { id:uid(), kennzeichen:"KS-TF 1100", fin:"VF7RHN9HPEJ123456", hersteller:"Citroën", modell:"Berlingo M 1.5 BlueHDi", baujahr:2017, farbe:"Perla Nera", typ:"Transporter", kmStand:178000, besitzer:"Malerbetrieb Heinz Schreiber", telefon:"0561 123456", email:"schreiber-maler@t-online.de", createdAt:db, hu_faellig:addDays(today,-2) },
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
    { id:uid(), fahrzeugId:f6.id, datum:db, uhrzeit:"10:00", art:"HU_AU", pruefer:"MW", status:STATUS.BESTANDEN, notiz:"", mängel:[], createdAt:db },
    { id:uid(), fahrzeugId:f4.id, datum:db, uhrzeit:"13:30", art:"HU", pruefer:"LN", status:STATUS.NICHT_BESTANDEN, notiz:"", mängel:[{id:uid(),code:"6.1.1",text:"Abgasanlage: Undichtigkeit Abgasanlage",kat:"HM",behoben:false},{id:uid(),code:"2.6.1",text:"Feststellbremse: Feststellbremse hält nicht ausreichend",kat:"HM",behoben:false}], createdAt:db },
  ];

  return { fahrzeuge: fz, termine: tr };
}

export function useStore() {
  const VFZK = "tuvpro_fz_v3";
  const VTRK = "tuvpro_tr_v3";
  const [fz, setFz] = useState(() => { try { const s = localStorage.getItem(VFZK); return s ? JSON.parse(s) : null; } catch { return null; } });
  const [tr, setTr] = useState(() => { try { const s = localStorage.getItem(VTRK); return s ? JSON.parse(s) : null; } catch { return null; } });
  useEffect(() => { if (!fz || !tr) { const s = makeSeed(); setFz(s.fahrzeuge); setTr(s.termine); } }, []);
  useEffect(() => { if (fz) localStorage.setItem(VFZK, JSON.stringify(fz)); }, [fz]);
  useEffect(() => { if (tr) localStorage.setItem(VTRK, JSON.stringify(tr)); }, [tr]);

  const addFz     = useCallback(data => { const r = { ...data, id: uid(), createdAt: isoDate() }; setFz(p => [r, ...p]); return r; }, []);
  const updFz     = useCallback((id, p) => setFz(prev => prev.map(f => f.id === id ? { ...f, ...p } : f)), []);
  const delFz     = useCallback(id => { setFz(p => p.filter(f => f.id !== id)); setTr(p => p.filter(t => t.fahrzeugId !== id)); }, []);
  const addTr     = useCallback(data => { const r = { ...data, id: uid(), mängel: [], createdAt: isoDate() }; setTr(p => [r, ...p]); return r; }, []);
  const updTr     = useCallback((id, p) => setTr(prev => prev.map(t => t.id === id ? { ...t, ...p } : t)), []);
  const delTr     = useCallback(id => setTr(p => p.filter(t => t.id !== id)), []);
  const addMangel = useCallback((tid, m) => setTr(p => p.map(t => t.id === tid ? { ...t, mängel: [...(t.mängel || []), { ...m, id: uid() }] } : t)), []);
  const delMangel = useCallback((tid, mid) => setTr(p => p.map(t => t.id === tid ? { ...t, mängel: t.mängel.filter(m => m.id !== mid) } : t)), []);
  const resetAll  = useCallback(() => { const s = makeSeed(); setFz(s.fahrzeuge); setTr(s.termine); }, []);

  return {
    fahrzeuge: fz || [], termine: tr || [],
    addFz, updFz, delFz, addTr, updTr, delTr, addMangel, delMangel, resetAll,
  };
}
