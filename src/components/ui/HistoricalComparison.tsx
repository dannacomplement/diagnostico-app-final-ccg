import { useMemo, useState } from 'react';
import type { SavedDiagnostic } from '../../lib/types';

interface Props {
  diagnostics: SavedDiagnostic[]; // sorted newest-first
}

interface DataPoint {
  date: string;
  shortDate: string;
  prof: number;
  inst: number;
  gerencias: number;
}

/* ── Pure SVG Line Chart ────────────────────────────────── */

function LineChart({ data, width, height }: { data: DataPoint[]; width: number; height: number }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: DataPoint } | null>(null);

  const padding = { top: 24, right: 20, bottom: 40, left: 36 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = 100; // Scores are 0-100
  const minVal = 0;

  const xScale = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
  const yScale = (val: number) => padding.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;

  function polyline(key: keyof DataPoint, color: string) {
    if (data.length < 2) return null;
    const points = data.map((d, i) => `${xScale(i)},${yScale(d[key] as number)}`).join(' ');
    return (
      <g>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ transition: 'all 0.4s ease' }}
        />
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xScale(i)}
            cy={yScale(d[key] as number)}
            r="4"
            fill="white"
            stroke={color}
            strokeWidth="2"
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={() => setTooltip({ x: xScale(i), y: yScale(d[key] as number) - 10, point: d })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </g>
    );
  }

  // Grid lines
  const gridLines = [0, 25, 50, 75, 100];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {/* Grid */}
      {gridLines.map(val => (
        <g key={val}>
          <line
            x1={padding.left}
            y1={yScale(val)}
            x2={width - padding.right}
            y2={yScale(val)}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray={val === 0 ? undefined : '4 3'}
          />
          <text x={padding.left - 8} y={yScale(val) + 4} textAnchor="end" fontSize="9" fill="#9ca3af" fontFamily="system-ui">
            {val}
          </text>
        </g>
      ))}

      {/* X axis labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={xScale(i)}
          y={height - 8}
          textAnchor="middle"
          fontSize="9"
          fill="#6b7280"
          fontFamily="system-ui"
        >
          {d.shortDate}
        </text>
      ))}

      {/* Data lines */}
      {polyline('prof', '#d4922e')}
      {polyline('inst', '#6366f1')}
      {polyline('gerencias', '#22c55e')}

      {/* Tooltip */}
      {tooltip && (
        <g>
          <rect
            x={tooltip.x - 70}
            y={tooltip.y - 60}
            width="140"
            height="52"
            rx="8"
            fill="#1b2a4a"
            opacity="0.95"
          />
          <text x={tooltip.x} y={tooltip.y - 42} textAnchor="middle" fontSize="9" fill="white" fontWeight="600">
            {tooltip.point.date}
          </text>
          <text x={tooltip.x - 40} y={tooltip.y - 26} fontSize="8" fill="#d4922e" fontWeight="600">
            Prof: {tooltip.point.prof}
          </text>
          <text x={tooltip.x} y={tooltip.y - 26} fontSize="8" fill="#6366f1" fontWeight="600">
            Inst: {tooltip.point.inst}
          </text>
          <text x={tooltip.x + 40} y={tooltip.y - 26} fontSize="8" fill="#22c55e" fontWeight="600">
            Ger: {tooltip.point.gerencias}
          </text>
        </g>
      )}
    </svg>
  );
}

/* ── Delta Badge ─────────────────────────────────────── */

function DeltaBadge({ current, previous, label }: { current: number; previous: number; label: string }) {
  const delta = current - previous;
  const isUp = delta > 0;
  const isDown = delta < 0;
  const color = isUp ? '#22c55e' : isDown ? '#ef4444' : '#9ca3af';
  const bgColor = isUp ? 'rgba(34,197,94,0.08)' : isDown ? 'rgba(239,68,68,0.08)' : 'rgba(156,163,175,0.08)';
  const borderColor = isUp ? 'rgba(34,197,94,0.2)' : isDown ? 'rgba(239,68,68,0.2)' : 'rgba(156,163,175,0.2)';
  const arrow = isUp ? '↑' : isDown ? '↓' : '→';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 14px', borderRadius: '10px',
      background: bgColor, border: `1px solid ${borderColor}`,
      minWidth: '120px',
    }}>
      <span style={{ fontSize: '16px', fontWeight: 700, color }}>{arrow}</span>
      <div>
        <p style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1b2a4a' }}>
          {current}
          <span style={{ fontSize: '11px', fontWeight: 600, color, marginLeft: '4px' }}>
            {isUp ? '+' : ''}{delta}
          </span>
        </p>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────── */

export default function HistoricalComparison({ diagnostics }: Props) {
  const data: DataPoint[] = useMemo(() => {
    // Sort oldest-first for the chart
    const sorted = [...diagnostics].sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime());
    return sorted.map(d => {
      const totalG = d.gerencias.length || 1;
      const coveredG = d.gerencias.filter(g => g.cubierto).length;
      return {
        date: new Date(d.savedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }),
        shortDate: new Date(d.savedAt).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
        prof: Math.round(d.profesionalizacion.average),
        inst: Math.round(d.institucionalizacion.average),
        gerencias: Math.round((coveredG / totalG) * 100),
      };
    });
  }, [diagnostics]);

  if (data.length < 2) return null;

  const latest = data[data.length - 1];
  const previous = data[data.length - 2];

  return (
    <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '24px 28px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        <div className="flex items-center" style={{ gap: '10px' }}>
          <div className="inline-flex items-center justify-center rounded-full shrink-0" style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #d4922e15, #6366f115)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b2a4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-navy" style={{ fontSize: '14px', marginBottom: '1px' }}>Comparativa Historica</h3>
            <p className="text-muted" style={{ fontSize: '10px' }}>{data.length} diagnosticos — evolución en el tiempo</p>
          </div>
        </div>
        <span style={{ fontSize: '9px', padding: '3px 10px', borderRadius: '6px', border: '1px solid #d4922e30', background: '#d4922e08', color: '#d4922e', fontWeight: 700 }}>
          {data.length} registros
        </span>
      </div>

      {/* Delta badges — latest vs previous */}
      <div className="flex flex-wrap" style={{ gap: '10px', marginBottom: '20px' }}>
        <DeltaBadge current={latest.prof} previous={previous.prof} label="Profesionalización" />
        <DeltaBadge current={latest.inst} previous={previous.inst} label="Institucionalización" />
        <DeltaBadge current={latest.gerencias} previous={previous.gerencias} label="Gerencias %" />
      </div>

      {/* Chart */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <LineChart data={data} width={Math.max(380, data.length * 100)} height={200} />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center" style={{ gap: '20px', marginTop: '14px' }}>
        <div className="flex items-center" style={{ gap: '6px' }}>
          <div style={{ width: '12px', height: '3px', borderRadius: '2px', background: '#d4922e' }} />
          <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>Profesionalización</span>
        </div>
        <div className="flex items-center" style={{ gap: '6px' }}>
          <div style={{ width: '12px', height: '3px', borderRadius: '2px', background: '#6366f1' }} />
          <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>Institucionalización</span>
        </div>
        <div className="flex items-center" style={{ gap: '6px' }}>
          <div style={{ width: '12px', height: '3px', borderRadius: '2px', background: '#22c55e' }} />
          <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>Gerencias</span>
        </div>
      </div>
    </div>
  );
}
