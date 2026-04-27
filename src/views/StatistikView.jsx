import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Activity, TrendingUp, XCircle, AlertTriangle, Award, Zap, BarChart2, Target,
} from "lucide-react";
import { C } from "../styles/theme";
import { STATUS } from "../constants/status";
import { PRUEFUNG_ARTEN, PRUEFER } from "../constants/pruefung";
import { MANGEL_KATEGORIEN, MANGEL_KATALOG } from "../constants/mangel";
import { isoDate } from "../utils/date";
import { Kpi } from "../components/ui/Kpi";
import { MangelPill } from "../components/ui/MangelPill";
import { FahrzeugShape, TerminShape } from "../types/propTypes";

/* ── Shared chart tooltip ── */
function ChartTooltip({ active = false, payload, label, unit = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.lineMed}`, borderRadius: 10,
      padding: "10px 14px", boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
      fontFamily: C.sans, minWidth: 130,
    }}>
      {label && <div style={{ fontSize: 11, color: C.t3, marginBottom: 8, fontFamily: C.mono }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: C.t3 }}>{p.name}:</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>{p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Card wrapper ── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16,
      padding: "20px 24px", boxShadow: "0 2px 8px rgba(15,23,42,0.06)", ...style,
    }}>
      {children}
    </div>
  );
}

function CardHead({ title, icon: Icon, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      {Icon && (
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.blue}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} color={C.blue} />
        </div>
      )}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: C.t4, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════ */

export function StatistikView({ termine, fahrzeuge }) {
  const [range, setRange] = useState(30);
  const [now] = useState(() => Date.now());
  const cutoff = useMemo(() => isoDate(new Date(now - range * 86400000)), [range, now]);

  /* ── Core stats ── */
  const s = useMemo(() => {
    const inRange = termine.filter(t => t.datum >= cutoff);
    const best = inRange.filter(t => t.status === STATUS.BESTANDEN).length;
    const fail = inRange.filter(t => t.status === STATUS.NICHT_BESTANDEN).length;
    const passR = (best + fail) > 0 ? Math.round(best / (best + fail) * 100) : 0;
    const allM = termine.flatMap(t => t.mängel || []);
    const mKat = Object.fromEntries(Object.keys(MANGEL_KATEGORIEN).map(k => [k, allM.filter(m => m.kat === k).length]));
    const byP = Object.fromEntries(PRUEFER.map(p => {
      const pt = inRange.filter(t => t.pruefer === p.id);
      const b = pt.filter(t => t.status === STATUS.BESTANDEN).length;
      const f = pt.filter(t => t.status === STATUS.NICHT_BESTANDEN).length;
      return [p.id, { total: pt.length, best: b, fail: f, rate: (b + f) > 0 ? Math.round(b / (b + f) * 100) : 0 }];
    }));
    const byArt = Object.fromEntries(PRUEFUNG_ARTEN.map(a => [a.id, inRange.filter(t => t.art === a.id).length]));
    const mCount = {};
    allM.forEach(m => { mCount[m.code] = (mCount[m.code] || 0) + 1; });
    const top10 = Object.entries(mCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([code, cnt]) => {
      const tmpl = MANGEL_KATALOG.find(e => e.code === code);
      return { code, cnt, text: tmpl?.text || code, kat: tmpl?.kat || "EM" };
    });
    const huFaellig = fahrzeuge.filter(f => f.hu_faellig && new Date(f.hu_faellig) <= new Date(now + 30 * 86400000) && new Date(f.hu_faellig) >= new Date(now)).length;
    const huUeberr = fahrzeuge.filter(f => f.hu_faellig && new Date(f.hu_faellig) < new Date(now)).length;
    return { total: inRange.length, best, fail, passR, allM: allM.length, mKat, byP, byArt, top10, huFaellig, huUeberr };
  }, [termine, fahrzeuge, cutoff, now]);

  /* ── Trend data (daily pass rate) ── */
  const trendData = useMemo(() => {
    const map = {};
    termine.filter(t => t.datum >= cutoff).forEach(t => {
      if (!map[t.datum]) map[t.datum] = { best: 0, fail: 0, total: 0 };
      if (t.status === STATUS.BESTANDEN) map[t.datum].best++;
      else if (t.status === STATUS.NICHT_BESTANDEN) map[t.datum].fail++;
      map[t.datum].total++;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([date, d]) => ({
      label: new Date(date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      "Bestandsquote": (d.best + d.fail) > 0 ? Math.round(d.best / (d.best + d.fail) * 100) : null,
      "Prüfungen": d.total,
    }));
  }, [termine, cutoff]);

  /* ── Prüfer bar data ── */
  const prüferData = useMemo(() =>
    PRUEFER.map(p => ({
      name: p.name.split(" ").slice(-1)[0],
      fullName: p.name,
      Bestanden: s.byP[p.id]?.best || 0,
      "Nicht bestanden": s.byP[p.id]?.fail || 0,
      Quote: s.byP[p.id]?.rate || 0,
    })).filter(d => d.Bestanden + d["Nicht bestanden"] > 0),
    [s]
  );

  /* ── Mängel pie data ── */
  const mangelPieData = useMemo(() =>
    Object.entries(MANGEL_KATEGORIEN)
      .map(([k, v]) => ({ name: v.kurz, label: v.label, value: s.mKat[k] || 0, color: v.color }))
      .filter(d => d.value > 0),
    [s]
  );

  /* ── Prüfarten bar data ── */
  const artData = useMemo(() =>
    PRUEFUNG_ARTEN.map(a => ({ name: a.code, label: a.label, Prüfungen: s.byArt[a.id] || 0 }))
      .filter(d => d.Prüfungen > 0)
      .sort((a, b) => b.Prüfungen - a.Prüfungen),
    [s]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Range selector */}
      <div style={{ display: "flex", gap: 6 }}>
        {[7, 30, 90, 365].map(d => (
          <button key={d} onClick={() => setRange(d)} className="btn-ghost" style={{
            background: range === d ? C.blue : C.surface,
            border: `1px solid ${range === d ? C.blue : C.line}`,
            borderRadius: 8, padding: "7px 16px",
            color: range === d ? "#fff" : C.t3,
            cursor: "pointer", fontSize: 12, fontWeight: range === d ? 700 : 500,
            boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
          }}>
            {d === 365 ? "1 Jahr" : `${d} Tage`}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid-resp-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <Kpi label="Prüfungen gesamt" value={s.total} sub={`in ${range} Tagen`} accent={C.blue} icon={Activity} />
        <Kpi label="Bestandsquote" value={`${s.passR}%`} sub={`${s.best} bestanden`} accent={C.green} icon={TrendingUp} />
        <Kpi label="Nicht bestanden" value={s.fail} sub={`${s.allM} Mängel erfasst`} accent={C.red} icon={XCircle} />
        <Kpi label="HU überfällig" value={s.huUeberr} sub={`${s.huFaellig} in 30d fällig`} accent={C.orange} icon={AlertTriangle} />
      </div>

      {/* Trend chart */}
      <Card>
        <CardHead title="Tagesverlauf — Bestandsquote & Prüfvolumen" icon={Activity} sub={`Letzte ${range} Tage`} />
        {trendData.length === 0 ? (
          <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: C.t4, fontSize: 13 }}>
            Keine Daten im gewählten Zeitraum.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.green} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.green} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.blue} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.t4, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: C.t4 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip unit="%" />} />
              <Area type="monotone" dataKey="Bestandsquote" stroke={C.green} strokeWidth={2} fill="url(#gradRate)" dot={false} unit="%" />
              <Area type="monotone" dataKey="Prüfungen" stroke={C.blue} strokeWidth={2} fill="url(#gradTotal)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Prüfer + Mängel row */}
      <div className="grid-resp-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Prüfer performance */}
        <Card>
          <CardHead title="Leistung nach Prüfer" icon={Award} />
          {prüferData.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: C.t4, fontSize: 13 }}>Keine Daten.</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(prüferData.length * 52, 160)}>
              <BarChart data={prüferData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: C.t4 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: C.t2, fontWeight: 500 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="Bestanden" stackId="a" fill={C.green} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Nicht bestanden" stackId="a" fill={C.red} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Mängel donut */}
        <Card>
          <CardHead title="Mängel nach Kategorie" icon={AlertTriangle} />
          {mangelPieData.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: C.t4, fontSize: 13 }}>Keine Mängel erfasst.</div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={mangelPieData} cx="50%" cy="50%" innerRadius={52} outerRadius={85}
                    dataKey="value" stroke="none" paddingAngle={2}>
                    {mangelPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: C.surface, border: `1px solid ${C.lineMed}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 8px 24px rgba(15,23,42,0.14)" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>{d.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: d.color, marginTop: 4 }}>{d.value}×</div>
                      </div>
                    );
                  }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {mangelPieData.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: C.t3, flex: 1 }}>{d.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.t1, fontFamily: C.mono }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Prüfarten */}
      <Card>
        <CardHead title="Prüfungen nach Art" icon={BarChart2} />
        {artData.length === 0 ? (
          <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: C.t4, fontSize: 13 }}>Keine Daten.</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={artData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.t4, fontFamily: C.mono }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: C.t4 }} axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const art = PRUEFUNG_ARTEN.find(a => a.code === label);
                return (
                  <div style={{ background: C.surface, border: `1px solid ${C.lineMed}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 8px 24px rgba(15,23,42,0.14)" }}>
                    <div style={{ fontSize: 11, color: C.t3, marginBottom: 4 }}>{art?.label || label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.blue }}>{payload[0].value} Prüfungen</div>
                  </div>
                );
              }} />
              <Bar dataKey="Prüfungen" radius={[6, 6, 0, 0]}>
                {artData.map((_, i) => (
                  <Cell key={i} fill={`hsl(${215 + i * 18}, 75%, ${55 + i * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Pass rate meter */}
      <Card>
        <CardHead title="Gesamte Bestandsquote" icon={Target} />
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: 20, background: C.surfaceUp, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.line}`, marginBottom: 8 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${s.passR}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ height: "100%", borderRadius: 10, background: s.passR >= 85 ? `linear-gradient(90deg,${C.green},${C.greenL})` : s.passR >= 70 ? `linear-gradient(90deg,${C.amber},${C.amberL})` : `linear-gradient(90deg,${C.red},${C.redL})` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.t4 }}>
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <div style={{ textAlign: "right", minWidth: 90 }}>
            <div style={{ fontSize: 40, fontWeight: 700, fontFamily: C.mono, lineHeight: 1, color: s.passR >= 85 ? C.green : s.passR >= 70 ? C.amber : C.red }}>{s.passR}%</div>
            <div style={{ fontSize: 11, color: C.t4, marginTop: 4 }}>Bestandsquote</div>
          </div>
        </div>
      </Card>

      {/* Top 10 Mängel */}
      <Card>
        <CardHead title="Top 10 häufigste Mängel" icon={Zap} />
        {s.top10.length === 0
          ? <div style={{ fontSize: 13, color: C.t4, padding: "16px 0" }}>Keine Mängel erfasst.</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {s.top10.map((m, i) => (
                <div key={m.code} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: C.surfaceUp, borderRadius: 9, padding: "9px 14px",
                  border: `1px solid ${C.line}`,
                }}>
                  <span style={{ fontSize: 11, fontFamily: C.mono, color: C.t4, minWidth: 22, textAlign: "center", fontWeight: 700 }}>#{i + 1}</span>
                  <MangelPill kat={m.kat} />
                  <span style={{ fontSize: 10, fontFamily: C.mono, color: C.t4, minWidth: 40 }}>{m.code}</span>
                  <span style={{ fontSize: 12, color: C.t2, flex: 1 }}>{m.text}</span>
                  <span style={{ fontSize: 13, fontFamily: C.mono, color: C.t1, fontWeight: 700 }}>{m.cnt}×</span>
                </div>
              ))}
            </div>
          )}
      </Card>
    </div>
  );
}

ChartTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  unit: PropTypes.string,
};

Card.propTypes = {
  children: PropTypes.node,
  style: PropTypes.object,
};

CardHead.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  sub: PropTypes.string,
};

StatistikView.propTypes = {
  termine: PropTypes.arrayOf(TerminShape).isRequired,
  fahrzeuge: PropTypes.arrayOf(FahrzeugShape).isRequired,
};
