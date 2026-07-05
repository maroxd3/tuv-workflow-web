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
import { MANGEL_KATEGORIEN, MANGEL_KATALOG_BY_CODE } from "../constants/mangel";
import { isoDate, toIsoDateStr } from "../utils/date";
import { Kpi } from "../components/ui/Kpi";
import { MangelPill } from "../components/ui/MangelPill";
import { FahrzeugShape, TerminShape } from "../types/propTypes";

/* Wiederkehrende Muster */
const TOOLTIP_CLS = "rounded-[10px] border border-line-med bg-surface px-3.5 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.14)]";
const CHART_EMPTY_CLS = "flex items-center justify-center text-[13px] text-t4";

/* ── Shared chart tooltip ── */
function ChartTooltip({ active = false, payload, label, unit = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`${TOOLTIP_CLS} min-w-[130px] font-sans`}>
      {label && <div className="mb-2 font-mono text-[11px] text-t3">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className={`flex items-center gap-2 ${i < payload.length - 1 ? "mb-1" : "mb-0"}`}>
          {/* Laufzeitwert: Serienfarbe kommt aus dem Chart-Payload */}
          <div className="h-2 w-2 shrink-0 rounded-xs" style={{ background: p.color }} />
          <span className="text-[12px] text-t3">{p.name}:</span>
          <span className="text-[12px] font-bold text-t1">{p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Card wrapper ── */
function Card({ children }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-6 py-5 shadow-[0_2px_8px_rgba(15,23,42,0.06)] max-[768px]:px-4 max-[768px]:py-3.5">
      {children}
    </div>
  );
}

function CardHead({ title, icon: Icon, sub }) {
  return (
    <div className="mb-5 flex items-center gap-2.5">
      {Icon && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#4F46E514]">
          <Icon size={14} color={C.blue} />
        </div>
      )}
      <div>
        <div className="text-[13px] font-bold text-t1">{title}</div>
        {sub && <div className="mt-px text-[11px] text-t4">{sub}</div>}
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
    const inRange = termine.filter(t => toIsoDateStr(t.datum) >= cutoff);
    const best = inRange.filter(t => t.statusCode === STATUS.BESTANDEN).length;
    const fail = inRange.filter(t => t.statusCode === STATUS.NICHT_BESTANDEN).length;
    const passR = (best + fail) > 0 ? Math.round(best / (best + fail) * 100) : 0;
    const allM = termine.flatMap(t => t.maengel || []);
    const mKat = Object.fromEntries(Object.keys(MANGEL_KATEGORIEN).map(k => [k, allM.filter(m => m.kategorieCode === k).length]));
    const byP = Object.fromEntries(PRUEFER.map(p => {
      const pt = inRange.filter(t => t.prueferKuerzel === p.id);
      const b = pt.filter(t => t.statusCode === STATUS.BESTANDEN).length;
      const f = pt.filter(t => t.statusCode === STATUS.NICHT_BESTANDEN).length;
      return [p.id, { total: pt.length, best: b, fail: f, rate: (b + f) > 0 ? Math.round(b / (b + f) * 100) : 0 }];
    }));
    const byArt = Object.fromEntries(PRUEFUNG_ARTEN.map(a => [a.id, inRange.filter(t => t.prueftCode === a.id).length]));
    const mCount = {};
    // codeStvzo null = Freitext-Mangel → Anzeige-Code "FR"
    allM.forEach(m => { const code = m.codeStvzo ?? "FR"; mCount[code] = (mCount[code] || 0) + 1; });
    const top10 = Object.entries(mCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([code, cnt]) => {
      const tmpl = MANGEL_KATALOG_BY_CODE[code];
      return { code, cnt, text: tmpl?.text || code, kat: tmpl?.kat || "EM" };
    });
    const huFaellig = fahrzeuge.filter(f => f.huFaellig && new Date(f.huFaellig) <= new Date(now + 30 * 86400000) && new Date(f.huFaellig) >= new Date(now)).length;
    const huUeberr = fahrzeuge.filter(f => f.huFaellig && new Date(f.huFaellig) < new Date(now)).length;
    return { total: inRange.length, best, fail, passR, allM: allM.length, mKat, byP, byArt, top10, huFaellig, huUeberr };
  }, [termine, fahrzeuge, cutoff, now]);

  /* ── Trend data (daily pass rate) ── */
  const trendData = useMemo(() => {
    const map = {};
    termine.forEach(t => {
      const tag = toIsoDateStr(t.datum);
      if (tag < cutoff) return;
      if (!map[tag]) map[tag] = { best: 0, fail: 0, total: 0 };
      if (t.statusCode === STATUS.BESTANDEN) map[tag].best++;
      else if (t.statusCode === STATUS.NICHT_BESTANDEN) map[tag].fail++;
      map[tag].total++;
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
    <div className="flex flex-col gap-5">

      {/* Range selector */}
      <div className="flex flex-wrap gap-1.5">
        {[7, 30, 90, 365].map(d => (
          <button key={d} onClick={() => setRange(d)}
            className={[
              "cursor-pointer rounded-lg border px-4 py-[7px] text-[12px] shadow-[0_1px_3px_rgba(15,23,42,0.05)]",
              "transition-all duration-150 hover:bg-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.14)]",
              range === d ? "border-blue bg-blue font-bold text-white" : "border-line bg-surface font-medium text-t3",
            ].join(" ")}>
            {d === 365 ? "1 Jahr" : `${d} Tage`}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 max-[768px]:grid-cols-2">
        <Kpi label="Prüfungen gesamt" value={s.total} sub={`in ${range} Tagen`} accent={C.blue} icon={Activity} />
        <Kpi label="Bestandsquote" value={`${s.passR}%`} sub={`${s.best} bestanden`} accent={C.green} icon={TrendingUp} />
        <Kpi label="Nicht bestanden" value={s.fail} sub={`${s.allM} Mängel erfasst`} accent={C.red} icon={XCircle} />
        <Kpi label="HU überfällig" value={s.huUeberr} sub={`${s.huFaellig} in 30d fällig`} accent={C.orange} icon={AlertTriangle} />
      </div>

      {/* Trend chart */}
      <Card>
        <CardHead title="Tagesverlauf — Bestandsquote & Prüfvolumen" icon={Activity} sub={`Letzte ${range} Tage`} />
        {trendData.length === 0 ? (
          <div className={`${CHART_EMPTY_CLS} h-[200px]`}>
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
      <div className="grid grid-cols-2 gap-4 max-[768px]:grid-cols-1">

        {/* Prüfer performance */}
        <Card>
          <CardHead title="Leistung nach Prüfer" icon={Award} />
          {prüferData.length === 0 ? (
            <div className={`${CHART_EMPTY_CLS} h-[200px]`}>Keine Daten.</div>
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
            <div className={`${CHART_EMPTY_CLS} h-[200px]`}>Keine Mängel erfasst.</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={mangelPieData} cx="50%" cy="50%" innerRadius={52} outerRadius={85}
                    dataKey="value" stroke="none" paddingAngle={2}>
                    {mangelPieData.map(d => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className={TOOLTIP_CLS}>
                        <div className="text-[12px] font-bold text-t1">{d.label}</div>
                        {/* Laufzeitwert: Kategoriefarbe aus dem Chart-Payload */}
                        <div className="mt-1 text-[13px] font-bold" style={{ color: d.color }}>{d.value}×</div>
                      </div>
                    );
                  }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-1 flex-col gap-2">
                {mangelPieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    {/* Laufzeitwert: Kategoriefarbe aus MANGEL_KATEGORIEN */}
                    <div className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: d.color }} />
                    <span className="flex-1 text-[11px] text-t3">{d.label}</span>
                    <span className="font-mono text-[12px] font-bold text-t1">{d.value}</span>
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
          <div className={`${CHART_EMPTY_CLS} h-40`}>Keine Daten.</div>
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
                  <div className={TOOLTIP_CLS}>
                    <div className="mb-1 text-[11px] text-t3">{art?.label || label}</div>
                    <div className="text-[14px] font-bold text-blue">{payload[0].value} Prüfungen</div>
                  </div>
                );
              }} />
              <Bar dataKey="Prüfungen" radius={[6, 6, 0, 0]}>
                {artData.map((d, i) => (
                  <Cell key={d.name} fill={`hsl(${215 + i * 18}, 75%, ${55 + i * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Pass rate meter */}
      <Card>
        <CardHead title="Gesamte Bestandsquote" icon={Target} />
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex-1">
            <div className="mb-2 h-5 overflow-hidden rounded-[10px] border border-line bg-surface-up">
              <motion.div initial={{ width: 0 }} animate={{ width: `${s.passR}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full rounded-[10px] bg-[linear-gradient(90deg,var(--color-green),var(--color-green-l))]" />
            </div>
            <div className="flex justify-between text-[10px] text-t4">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <div className="min-w-[90px] text-right">
            <div className="font-mono text-[40px] font-bold leading-none text-green">{s.passR}%</div>
            <div className="mt-1 text-[11px] text-t4">Bestandsquote</div>
          </div>
        </div>
      </Card>

      {/* Top 10 Mängel */}
      <Card>
        <CardHead title="Top 10 häufigste Mängel" icon={Zap} />
        {s.top10.length === 0
          ? <div className="py-4 text-[13px] text-t4">Keine Mängel erfasst.</div>
          : (
            <div className="flex flex-col gap-1">
              {s.top10.map((m, i) => (
                <div key={m.code} className="flex flex-wrap items-center gap-2.5 rounded-[9px] border border-line bg-surface-up px-3.5 py-[9px]">
                  <span className="min-w-[22px] text-center font-mono text-[11px] font-bold text-t4">#{i + 1}</span>
                  <MangelPill kat={m.kat} />
                  <span className="font-mono text-[10px] text-t4">{m.code}</span>
                  <span className="min-w-0 flex-[1_1_200px] text-[12px] text-t2">{m.text}</span>
                  <span className="ml-auto font-mono text-[13px] font-bold text-t1">{m.cnt}×</span>
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
