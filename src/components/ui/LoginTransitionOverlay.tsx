import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

type Phase = 'expand' | 'hold' | 'dissolve';

const LOGO_SIZE = 140;
const RING_SIZE = 180;
const STROKE_WIDTH = 3;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function LoginTransitionOverlay() {
  const active = useAuthStore(s => s.loginTransitioning);
  const endTransition = useAuthStore(s => s.endLoginTransition);
  const companyLogoIcon = useSettingsStore(s => s.companyLogoIcon);

  const [phase, setPhase] = useState<Phase>('expand');
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (active) {
      setPhase('expand');
      setProgress(0);
      setMounted(true);
    }
  }, [active]);

  useEffect(() => {
    if (!mounted) return;

    const t1 = setTimeout(() => setPhase('hold'), 800);
    const t2 = setTimeout(() => setPhase('dissolve'), 3200);
    const t3 = setTimeout(() => {
      setMounted(false);
      endTransition();
    }, 4600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [mounted, endTransition]);

  // Animate progress from 0→1 during 'hold' phase (800ms → 3200ms = 2400ms duration)
  useEffect(() => {
    if (phase !== 'hold') return;
    const start = performance.now();
    const duration = 2200;
    let raf: number;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out curve for satisfying fill
      setProgress(1 - Math.pow(1 - t, 2.5));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  if (!mounted) return null;

  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, pointerEvents: 'none' }}>
      {/* Expanding circle background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #001845 0%, #002060 50%, #0a3a7a 100%)',
          '--cx': '50%',
          '--cy': '60%',
          animation: phase === 'expand' || phase === 'hold'
            ? 'circleExpand 3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            : undefined,
          ...(phase === 'dissolve' ? {
            animation: 'overlayDissolve 1.4s ease-in forwards',
          } : {}),
        } as React.CSSProperties}
      >
        {/* Centered logo with circular progress */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: phase === 'expand' ? 0 : 1,
            animation: phase === 'hold'
              ? 'overlayLogoIn 1s cubic-bezier(0.22, 1, 0.36, 1) forwards'
              : undefined,
          }}
        >
          <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE }}>
            {/* Circular progress ring */}
            <svg
              width={RING_SIZE}
              height={RING_SIZE}
              style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
            >
              {/* Track */}
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={STROKE_WIDTH}
              />
              {/* Progress arc */}
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 60ms linear' }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d4922e" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
            </svg>
            {/* Logo centered inside ring */}
            <img
              src={companyLogoIcon || '/icon-complement.svg'}
              alt=""
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: LOGO_SIZE,
                height: LOGO_SIZE,
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.3))',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
