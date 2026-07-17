import { useMemo } from 'react';
import type { SavedDiagnostic } from '../../lib/types';

interface Props {
  diagnostics: SavedDiagnostic[];
}

interface DataPoint {
  date: string;
  shortDate: string;
  prof: number;
  inst: number;
  gerencias: number;
  margenBruto: number | null;
  margenOperativo: number | null;
  margenNeto: number | null;
  size: string;
  urgencia: string;
}

function calcGerenciaScore(d: SavedDiagnostic): number {
  let score = 0;
  for (const g of d.gerencias) {
    if (g.cubierto) score += 15;
    if (g.cubierto && g.calificado === 'si') score += 5;
  }
  return score;
}

/* ── Analysis text generation ────────────────────────── */

function generateAnalysis(latest: DataPoint, previous: DataPoint): string[] {
  const insights: string[] = [];

  const profDelta = latest.prof - previous.prof;
  const instDelta = latest.inst - previous.inst;
  const gerDelta = latest.gerencias - previous.gerencias;

  if (profDelta > 5) insights.push(`Profesionalización mejoró significativamente (+${profDelta} pts), indicando avance en formalización de procesos.`);
  else if (profDelta > 0) insights.push(`Profesionalización muestra mejora leve (+${profDelta} pts).`);
  else if (profDelta < -5) insights.push(`Profesionalización retrocedió (${profDelta} pts) — se recomienda revisar los procesos que perdieron formalidad.`);
  else if (profDelta < 0) insights.push(`Profesionalización tuvo un ligero descenso (${profDelta} pts).`);
  else insights.push('Profesionalización se mantuvo estable.');

  if (instDelta > 5) insights.push(`Institucionalización avanzó fuertemente (+${instDelta} pts), reflejando mayor estructura de gobierno.`);
  else if (instDelta > 0) insights.push(`Institucionalización mejoró ligeramente (+${instDelta} pts).`);
  else if (instDelta < -5) insights.push(`Institucionalización retrocedió (${instDelta} pts) — verificar si hubo cambios en la estructura de gobierno.`);
  else if (instDelta < 0) insights.push(`Institucionalización tuvo un descenso leve (${instDelta} pts).`);
  else insights.push('Institucionalización se mantuvo sin cambios.');

  if (gerDelta > 10) insights.push(`Gerencias mejoraron notablemente (+${gerDelta} pts), con más puestos cubiertos y/o calificados.`);
  else if (gerDelta > 0) insights.push(`Gerencias mejoraron (+${gerDelta} pts).`);
  else if (gerDelta < -10) insights.push(`El puntaje de gerencias bajó (${gerDelta} pts) — posible pérdida de personal clave.`);
  else if (gerDelta < 0) insights.push(`Gerencias tuvieron un ligero retroceso (${gerDelta} pts).`);

  if (latest.margenBruto !== null && previous.margenBruto !== null) {
    const d = latest.margenBruto - previous.margenBruto;
    if (Math.abs(d) >= 2) {
      insights.push(`Margen bruto ${d > 0 ? 'mejoró' : 'disminuyó'} ${d > 0 ? '+' : ''}${d.toFixed(1)}% — ${d > 0 ? 'señal positiva en eficiencia de costos' : 'revisar estructura de costos'}.`);
    }
  }

  const overall = profDelta + instDelta + gerDelta;
  if (overall > 15) insights.push('En general, la empresa muestra una tendencia positiva clara.');
  else if (overall < -15) insights.push('La tendencia general indica áreas de oportunidad que requieren atención.');

  return insights;
}

/* ── SVG Line Chart ──────────────────────────────────── */

function LineChart({ data, width, height }: { data: DataPoint[]; width: number; height: number }) {
  const padding = { top: 24, right: 20, bottom: 40, left: 36 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const xScale = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
  const yScale = (val: number) => padding.top + chartH - (val / 100) * chartH;

  function polyline(key: 'prof' | 'inst' | 'gerencias', color: string) {
    if (data.length < 2) return null;
    const points = data.map((d, i) => `${xScale(i)},${yScale(d[key])}`).join(' ');
    return (
      <g>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <circle key={i} cx={xScale(i)} cy={yScale(d[key])} r="4" fill="white" stroke={color} strokeWidth="2" />
        ))}
      </g>
    );
  }

  const gridLines = [0, 25, 50, 75, 100];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {gridLines.map(val => (
        <g key={val}>
          <line x1={padding.left} y1={yScale(val)} x2={width - padding.right} y2={yScale(val)} stroke="#e5e7eb" strokeWidth="1" strokeDasharray={val === 0 ? undefined : '4 3'} />
          <text x={padding.left - 8} y={yScale(val) + 4} textAnchor="end" fontSize="9" fill="#9ca3af" fontFamily="system-ui">{val}</text>
        </g>
      ))}
      {data.map((d, i) => (
        <text key={i} x={xScale(i)} y={height - 8} textAnchor="middle" fontSize="9" fill="#6b7280" fontFamily="system-ui">{d.shortDate}</text>
      ))}
      {polyline('prof', '#d4922e')}
      {polyline('inst', '#6366f1')}
      {polyline('gerencias', '#22c55e')}
    </svg>
  );
}

/* ── Delta Badge ─────────────────────────────────────── */

function DeltaBadge({ current, previous, label, suffix }: { current: number; previous: number; label: string; suffix?: string }) {
  const delta = current - previous;
  const isUp = delta > 0;
  const isDown = delta < 0;
  const color = isUp ? '#22c55e' : isDown ? '#ef4444' : '#9ca3af';
  const bgColor = isUp ? 'rgba(34,197,94,0.08)' : isDown ? 'rgba(239,68,68,0.08)' : 'rgba(156,163,175,0.08)';
  const borderColor = isUp ? 'rgba(34,197,94,0.2)' : isDown ? 'rgba(239,68,68,0.2)' : 'rgba(156,163,175,0.2)';
  const arrow = isUp ? '↑' : isDown ? '↓' : '→';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', background: bgColor, border: `1px solid ${borderColor}`, minWidth: '110px' }}>
      <span style={{ fontSize: 'var(--fs-16)', fontWeight: 700, color }}>{arrow}</span>
      <div>
        <p style={{ fontSize: 'var(--fs-8)', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
        <p style={{ fontSize: 'var(--fs-14)', fontWeight: 700, color: '#1b2a4a' }}>
          {current}{suffix || ''}
          <span style={{ fontSize: 'var(--fs-11)', fontWeight: 600, color, marginLeft: '4px' }}>
            {isUp ? '+' : ''}{delta}{suffix || ''}
          </span>
        </p>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────── */

export default function HistoricalComparison({ diagnostics }: Props) {
  const data: DataPoint[] = useMemo(() => {
    const sorted = [...diagnostics].sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime());
    return sorted.map(d => ({
      date: new Date(d.savedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }),
      shortDate: new Date(d.savedAt).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
      prof: Math.round(d.profesionalizacion.average),
      inst: Math.round(d.institucionalizacion.average),
      gerencias: calcGerenciaScore(d),
      margenBruto: d.marginData?.margenBruto ?? null,
      margenOperativo: d.marginData?.margenOperativo ?? null,
      margenNeto: d.marginData?.margenNeto ?? null,
      size: d.companySize?.size ?? '—',
      urgencia: d.urgenciaLevel ?? '—',
    }));
  }, [diagnostics]);

  if (data.length < 2) return null;

  const latest = data[data.length - 1];
  const previous = data[data.length - 2];
  const analysis = generateAnalysis(latest, previous);

  return (
    <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        <div className="flex items-center" style={{ gap: '10px' }}>
          <div className="inline-flex items-center justify-center rounded-full shrink-0" style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #d4922e15, #6366f115)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b2a4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-navy" style={{ fontSize: 'var(--fs-14)', marginBottom: '1px' }}>Comparativa Historica</h3>
            <p className="text-muted" style={{ fontSize: 'var(--fs-10)' }}>{data.length} radiografías — evolución en el tiempo</p>
          </div>
        </div>
      </div>

      {/* Delta badges */}
      <div className="flex flex-wrap" style={{ gap: '10px', marginBottom: '20px' }}>
        <DeltaBadge current={latest.prof} previous={previous.prof} label="Profesionalización" />
        <DeltaBadge current={latest.inst} previous={previous.inst} label="Institucionalización" />
        <DeltaBadge current={latest.gerencias} previous={previous.gerencias} label="Gerencias" />
      </div>

      {/* Chart */}
      <div style={{ width: '100%', overflowX: 'auto', marginBottom: '20px' }}>
        <LineChart data={data} width={Math.max(380, data.length * 100)} height={200} />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center flex-wrap" style={{ gap: '16px', marginBottom: '24px' }}>
        {[
          { color: '#d4922e', label: 'Profesionalización' },
          { color: '#6366f1', label: 'Institucionalización' },
          { color: '#22c55e', label: 'Gerencias (puntaje)' },
        ].map(l => (
          <div key={l.label} className="flex items-center" style={{ gap: '6px' }}>
            <div style={{ width: '12px', height: '3px', borderRadius: '2px', background: l.color }} />
            <span style={{ fontSize: 'var(--fs-10)', color: '#6b7280', fontWeight: 500 }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-11)' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '8px 10px', color: '#6b7280', fontWeight: 600, fontSize: 'var(--fs-10)' }}>Fecha</th>
              <th style={{ textAlign: 'center', padding: '8px 6px', color: '#d4922e', fontWeight: 600, fontSize: 'var(--fs-10)' }}>Prof.</th>
              <th style={{ textAlign: 'center', padding: '8px 6px', color: '#6366f1', fontWeight: 600, fontSize: 'var(--fs-10)' }}>Inst.</th>
              <th style={{ textAlign: 'center', padding: '8px 6px', color: '#22c55e', fontWeight: 600, fontSize: 'var(--fs-10)' }}>Ger.</th>
              <th style={{ textAlign: 'center', padding: '8px 6px', color: '#6b7280', fontWeight: 600, fontSize: 'var(--fs-10)' }}>M.Bruto</th>
              <th style={{ textAlign: 'center', padding: '8px 6px', color: '#6b7280', fontWeight: 600, fontSize: 'var(--fs-10)' }}>M.Oper.</th>
              <th style={{ textAlign: 'center', padding: '8px 6px', color: '#6b7280', fontWeight: 600, fontSize: 'var(--fs-10)' }}>M.Neto</th>
              <th style={{ textAlign: 'center', padding: '8px 6px', color: '#6b7280', fontWeight: 600, fontSize: 'var(--fs-10)' }}>Tamaño</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => {
              const isLatest = i === data.length - 1;
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: isLatest ? '#f0f7ff' : undefined }}>
                  <td style={{ padding: '7px 10px', fontWeight: isLatest ? 700 : 400, color: '#1b2a4a' }}>
                    {d.date} {isLatest && <span style={{ fontSize: 'var(--fs-8)', color: '#0047AB', fontWeight: 700, marginLeft: '4px' }}>ACTUAL</span>}
                  </td>
                  <td style={{ textAlign: 'center', padding: '7px 6px', fontWeight: 600, color: '#d4922e' }}>{d.prof}</td>
                  <td style={{ textAlign: 'center', padding: '7px 6px', fontWeight: 600, color: '#6366f1' }}>{d.inst}</td>
                  <td style={{ textAlign: 'center', padding: '7px 6px', fontWeight: 600, color: '#22c55e' }}>{d.gerencias}</td>
                  <td style={{ textAlign: 'center', padding: '7px 6px', color: '#6b7280' }}>{d.margenBruto !== null ? `${d.margenBruto}%` : '—'}</td>
                  <td style={{ textAlign: 'center', padding: '7px 6px', color: '#6b7280' }}>{d.margenOperativo !== null ? `${d.margenOperativo}%` : '—'}</td>
                  <td style={{ textAlign: 'center', padding: '7px 6px', color: '#6b7280' }}>{d.margenNeto !== null ? `${d.margenNeto}%` : '—'}</td>
                  <td style={{ textAlign: 'center', padding: '7px 6px', color: '#6b7280' }}>{d.size}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Gerencias scoring legend */}
      <div className="rounded-lg bg-pale border border-border/30" style={{ padding: '10px 14px', marginBottom: '20px' }}>
        <p style={{ fontSize: 'var(--fs-9)', color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>PUNTAJE GERENCIAS (máx. 100)</p>
        <p style={{ fontSize: 'var(--fs-10)', color: '#4b5563' }}>
          15 pts por gerencia cubierta + 5 pts si está calificada (5 gerencias × 20 pts = 100)
        </p>
      </div>

      {/* Analysis */}
      <div className="rounded-xl border border-accent/20 bg-accent/5" style={{ padding: '16px 20px' }}>
        <p style={{ fontSize: 'var(--fs-10)', fontWeight: 700, color: '#002060', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
          Análisis Comparativo
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {analysis.map((text, i) => (
            <p key={i} style={{ fontSize: 'var(--fs-11)', color: '#374151', lineHeight: 1.5 }}>
              • {text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
