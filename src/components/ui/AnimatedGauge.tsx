import { useEffect, useState } from 'react';

interface Props {
  value: number;       // 0–100
  max?: number;        // default 100
  size?: number;       // px, default 100
  strokeWidth?: number;
  label: string;
  sublabel?: string;
  color?: string;      // hex
  delay?: number;      // ms stagger
}

const LEVEL_COLORS: Record<string, string> = {
  low: '#EF4444',
  mid: '#F59E0B',
  high: '#22C55E',
};

function getAutoColor(pct: number): string {
  if (pct < 40) return LEVEL_COLORS.low;
  if (pct < 70) return LEVEL_COLORS.mid;
  return LEVEL_COLORS.high;
}

export default function AnimatedGauge({
  value,
  max = 100,
  size = 100,
  strokeWidth = 8,
  label,
  sublabel,
  color,
  delay = 0,
}: Props) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const pct = Math.min(value / max, 1) * 100;
  const resolvedColor = color || getAutoColor(pct);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // We use 270deg arc (3/4 circle), starting from bottom-left
  const arcLength = circumference * 0.75;
  const offset = arcLength - (arcLength * (animatedValue / 100));

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const target = pct;
      const duration = 1200;
      const startTime = performance.now();

      function animate(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (target - start) * eased;
        setAnimatedValue(current);
        if (progress < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timer);
  }, [pct, delay]);

  const displayValue = Math.round(animatedValue * max / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(135deg)' }}
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Animated arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={resolvedColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.3s ease' }}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '4px',
        }}>
          <span style={{
            fontSize: size * 0.28,
            fontWeight: 800,
            color: resolvedColor,
            lineHeight: 1,
            fontFamily: 'var(--font-sans)',
          }}>
            {displayValue}
          </span>
          <span style={{
            fontSize: size * 0.11,
            color: '#9ca3af',
            fontWeight: 500,
            marginTop: '1px',
          }}>
            / {max}
          </span>
        </div>
      </div>
      <p style={{
        fontSize: 'var(--fs-11)',
        fontWeight: 600,
        color: '#1b2a4a',
        textAlign: 'center',
        lineHeight: 1.2,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        {label}
      </p>
      {sublabel && (
        <span style={{
          fontSize: 'var(--fs-10)',
          fontWeight: 600,
          color: resolvedColor,
          padding: '2px 10px',
          borderRadius: '6px',
          background: `${resolvedColor}15`,
        }}>
          {sublabel}
        </span>
      )}
    </div>
  );
}
