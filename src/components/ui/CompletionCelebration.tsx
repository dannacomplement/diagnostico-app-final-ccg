import { useEffect, useState, useMemo } from 'react';

interface Props {
  score: number;
  companyName: string;
  onFinish: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
  duration: number;
  shape: 'circle' | 'square' | 'triangle';
}

const CONFETTI_COLORS = ['#d4922e', '#0047AB', '#22C55E', '#F59E0B', '#2563EB', '#EF4444', '#6366f1', '#f97316'];

export default function CompletionCelebration({ score, companyName, onFinish }: Props) {
  const [phase, setPhase] = useState<'confetti' | 'score' | 'done'>('confetti');
  const [displayScore, setDisplayScore] = useState(0);

  const particles = useMemo<Particle[]>(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 30,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      delay: Math.random() * 800,
      duration: 2000 + Math.random() * 2000,
      shape: (['circle', 'square', 'triangle'] as const)[Math.floor(Math.random() * 3)],
    })),
  []);

  useEffect(() => {
    // Phase 1: confetti burst (0.5s)
    const t1 = setTimeout(() => setPhase('score'), 600);
    // Phase 2: score counts up
    const t2 = setTimeout(() => {
      const duration = 1500;
      const start = performance.now();
      function animate(now: number) {
        const elapsed = now - start;
        const p = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplayScore(Math.round(score * eased));
        if (p < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
    }, 800);
    // Phase 3: auto-advance
    const t3 = setTimeout(() => setPhase('done'), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [score]);

  return (
    <div
      onClick={() => { if (phase === 'done') onFinish(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a1628 0%, #1b2a4a 50%, #0a1628 100%)',
        cursor: phase === 'done' ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      {/* Confetti particles */}
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.shape === 'circle' ? p.size : p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'triangle' ? '0' : '2px',
            clipPath: p.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confettiFall ${p.duration}ms ease-in ${p.delay}ms forwards`,
            opacity: 0.9,
          }}
        />
      ))}

      {/* Logo */}
      <div style={{
        opacity: phase !== 'confetti' ? 1 : 0,
        transform: phase !== 'confetti' ? 'scale(1)' : 'scale(0.5)',
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        <img
          src="/icon-complement.svg"
          alt="Complement"
          style={{ height: '48px', filter: 'brightness(0) invert(1) brightness(0.85)' }}
        />
        <p style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#d4922e',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-sans)',
        }}>
          C O M P L E M E N T
        </p>
      </div>

      {/* Celebration content */}
      <div style={{
        marginTop: '32px',
        textAlign: 'center',
        opacity: phase !== 'confetti' ? 1 : 0,
        transform: phase !== 'confetti' ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s',
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(212,146,46,0.2), rgba(212,146,46,0.05))',
          border: '3px solid rgba(212,146,46,0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <span style={{
            fontSize: '42px',
            fontWeight: 800,
            color: '#d4922e',
            lineHeight: 1,
            fontFamily: 'var(--font-sans)',
          }}>
            {displayScore}
          </span>
          <span style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 500,
          }}>
            / 100
          </span>
        </div>

        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: 'white',
          marginBottom: '8px',
          fontFamily: 'var(--font-serif)',
        }}>
          Radiografía Completada
        </h1>
        <p style={{
          fontSize: '15px',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '8px',
        }}>
          {companyName}
        </p>

        {phase === 'done' && (
          <div style={{
            marginTop: '40px',
            animation: 'fadeUp 0.5s ease-out both',
          }}>
            <button
              onClick={onFinish}
              style={{
                padding: '14px 40px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'white',
                background: '#d4922e',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 20px rgba(212,146,46,0.3)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Ver Resultados →
            </button>
            <p style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.3)',
              marginTop: '16px',
            }}>
              o haz click en cualquier lugar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
