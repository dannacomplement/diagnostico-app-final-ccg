import { useEffect, useState } from 'react';

interface Axis {
  label: string;
  value: number; // 0–100
  color?: string;
}

interface Props {
  axes: Axis[];
  size?: number;
  animated?: boolean;
  delay?: number;
  showLabels?: boolean;
  fillColor?: string;
  strokeColor?: string;
}

export default function RadarChart({
  axes,
  size = 220,
  animated = true,
  delay = 0,
  showLabels = true,
  fillColor = 'rgba(212,146,46,0.15)',
  strokeColor = '#d4922e',
}: Props) {
  const [progress, setProgress] = useState(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) { setProgress(1); return; }
    const timer = setTimeout(() => {
      const duration = 1400;
      const startTime = performance.now();
      function animate(now: number) {
        const elapsed = now - startTime;
        const p = Math.min(elapsed / duration, 1);
        // Ease out cubic
        setProgress(1 - Math.pow(1 - p, 3));
        if (p < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timer);
  }, [animated, delay]);

  const n = axes.length;
  if (n < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.34;
  const labelR = size * 0.46;

  // Get point on the radar for a given axis index and value (0-100)
  function getPoint(index: number, value: number): [number, number] {
    const angle = (2 * Math.PI * index) / n - Math.PI / 2;
    const r = (value / 100) * maxR * progress;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  // Grid rings
  const rings = [25, 50, 75, 100];

  // Data polygon
  const dataPoints = axes.map((a, i) => getPoint(i, a.value));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {rings.map(ring => {
        const points = Array.from({ length: n }, (_, i) => {
          const angle = (2 * Math.PI * i) / n - Math.PI / 2;
          const r = (ring / 100) * maxR;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon
            key={ring}
            points={points}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={ring === 100 ? 1.2 : 0.5}
          />
        );
      })}

      {/* Axis lines */}
      {axes.map((_, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const x2 = cx + maxR * Math.cos(angle);
        const y2 = cy + maxR * Math.sin(angle);
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke="#e5e7eb"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Data polygon */}
      <path
        d={dataPath}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={`dot-${i}`}
          cx={p[0]}
          cy={p[1]}
          r={3.5}
          fill={axes[i].color || strokeColor}
          stroke="white"
          strokeWidth={1.5}
        />
      ))}

      {/* Labels */}
      {showLabels && axes.map((a, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        const textAnchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle'
          : Math.cos(angle) > 0 ? 'start' : 'end';
        return (
          <text
            key={`label-${i}`}
            x={lx}
            y={ly}
            textAnchor={textAnchor}
            dominantBaseline="central"
            style={{
              fontSize: 'var(--fs-9)',
              fontWeight: 600,
              fill: '#64748b',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {a.label}
          </text>
        );
      })}

      {/* Value labels near data points */}
      {dataPoints.map((p, i) => {
        const val = Math.round(axes[i].value * progress);
        if (val === 0) return null;
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const nudge = 12;
        return (
          <text
            key={`val-${i}`}
            x={p[0] + nudge * Math.cos(angle)}
            y={p[1] + nudge * Math.sin(angle)}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: 'var(--fs-8)',
              fontWeight: 700,
              fill: axes[i].color || strokeColor,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {val}
          </text>
        );
      })}
    </svg>
  );
}
