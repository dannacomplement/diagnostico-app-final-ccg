import { useState, useEffect, useCallback, useRef } from 'react';
import type { CriterionConfig, CriterionAnswer, ScoreLevel } from '../../lib/types';
import { CRITERION_CARD_OPTIONS, type CardOption } from '../../config/questions';
import RadarChart from '../ui/RadarChart';

interface Props {
  title: string;
  description: string;
  criteria: CriterionConfig[];
  answers: CriterionAnswer[];
  onAnswerChange: (id: string, partial: Partial<CriterionAnswer>) => void;
  averageScore: number;
  level: ScoreLevel;
  onBack?: () => void;
}

const LEVEL_COLORS: Record<ScoreLevel, string> = {
  Bajo: '#EF4444',
  Medio: '#F59E0B',
  Alto: '#22C55E',
  Avanzado: '#22C55E',
};

function cardStyle(option: CardOption, selected: boolean, hovered: boolean) {
  if (selected) {
    if (option.score === 0) return { border: '#e74c3c', bg: 'rgba(231,76,60,0.08)', shadow: '0 4px 20px rgba(231,76,60,0.15)', scale: 1.02 };
    if (option.score === 5) return { border: '#f39c12', bg: 'rgba(243,156,18,0.08)', shadow: '0 4px 20px rgba(243,156,18,0.15)', scale: 1.02 };
    return { border: '#27ae60', bg: 'rgba(39,174,96,0.08)', shadow: '0 4px 20px rgba(39,174,96,0.15)', scale: 1.02 };
  }
  if (hovered) {
    return { border: '#94a3b8', bg: '#f8fafc', shadow: '0 2px 8px rgba(0,0,0,0.06)', scale: 1.01 };
  }
  return { border: 'rgba(0,0,0,0.08)', bg: '#ffffff', shadow: 'none', scale: 1 };
}

export default function TypeformCriteria({
  title,
  criteria,
  answers,
  onAnswerChange,
  averageScore,
  level,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [justSelected, setJustSelected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const criterion = criteria[currentIndex];
  const answer = answers.find(a => a.criterionId === criterion?.id);
  const options = criterion ? (CRITERION_CARD_OPTIONS[criterion.id] ?? []) : [];
  const answeredCount = answers.filter(a => criteria.some(c => c.id === a.criterionId) && (a.rating >= 0 || a.rating === -2)).length;

  const goTo = useCallback((index: number, dir: 'next' | 'prev') => {
    if (isTransitioning) return;
    setDirection(dir);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
      setHoveredOption(null);
    }, 250);
  }, [isTransitioning]);

  const handleSelect = useCallback((option: CardOption) => {
    onAnswerChange(criterion.id, { rating: option.score, siNo: option.score > 0 });
    setJustSelected(true);
    // Auto-advance after selection with a short delay
    setTimeout(() => {
      setJustSelected(false);
      if (currentIndex < criteria.length - 1) {
        goTo(currentIndex + 1, 'next');
      } else {
        setShowSummary(true);
      }
    }, 600);
  }, [criterion, currentIndex, criteria.length, goTo, onAnswerChange]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (showSummary) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) goTo(currentIndex - 1, 'prev');
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < criteria.length - 1) goTo(currentIndex + 1, 'next');
      }
      // Number keys for quick selection
      const num = parseInt(e.key);
      if (num >= 1 && num <= options.length) {
        e.preventDefault();
        handleSelect(options[num - 1]);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, criteria.length, options, showSummary, goTo, handleSelect]);

  // Mini radar data
  const radarAxes = criteria.map((c, i) => {
    const a = answers.find(ans => ans.criterionId === c.id);
    return {
      label: `${i + 1}`,
      value: a && a.rating >= 0 ? a.rating * 10 : a?.rating === -2 ? -1 : 0,
    };
  });

  if (showSummary) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 28px' }}>
        <div style={{ marginBottom: '24px' }}>
          <RadarChart axes={radarAxes} size={200} animated delay={0} showLabels />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1b2a4a', marginBottom: '8px', fontFamily: 'var(--font-serif)' }}>
          {title} — Resumen
        </h3>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 24px',
          borderRadius: '12px',
          background: `${LEVEL_COLORS[level]}10`,
          border: `2px solid ${LEVEL_COLORS[level]}30`,
          marginBottom: '16px',
        }}>
          <span style={{ fontSize: '28px', fontWeight: 800, color: LEVEL_COLORS[level] }}>
            {averageScore.toFixed(0)}
          </span>
          <span style={{ fontSize: '14px', color: '#9ca3af' }}>/100</span>
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            color: LEVEL_COLORS[level],
            padding: '3px 10px',
            borderRadius: '6px',
            background: `${LEVEL_COLORS[level]}15`,
          }}>
            {level === 'Avanzado' ? 'Alto' : level}
          </span>
        </div>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>
          {answeredCount} de {criteria.length} preguntas respondidas
        </p>
        <button
          onClick={() => setShowSummary(false)}
          style={{
            padding: '10px 24px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#0047AB',
            background: 'rgba(0,71,171,0.08)',
            border: '1px solid rgba(0,71,171,0.2)',
            borderRadius: '10px',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Revisar respuestas
        </button>
      </div>
    );
  }

  if (!criterion) return null;

  const progressPct = ((currentIndex + 1) / criteria.length) * 100;

  return (
    <div ref={containerRef} className="card" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
      {/* Progress bar */}
      <div style={{ height: '4px', background: '#e5e7eb' }}>
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, #d4922e, #f59e0b)',
          width: `${progressPct}%`,
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      <div style={{ padding: '36px 32px 28px' }}>
        {/* Counter & mini radar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#d4922e',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {title}
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: '#1b2a4a', lineHeight: 1 }}>
                {currentIndex + 1}
              </span>
              <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: 500 }}>
                / {criteria.length}
              </span>
            </div>
          </div>
          {/* Mini live radar */}
          <div style={{ opacity: 0.8 }}>
            <RadarChart axes={radarAxes} size={80} animated={false} showLabels={false} />
          </div>
        </div>

        {/* Question */}
        <div style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning
            ? `translateX(${direction === 'next' ? '-30px' : '30px'})`
            : 'translateX(0)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <p style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#1b2a4a',
            lineHeight: 1.5,
            marginBottom: '28px',
          }}>
            {criterion.text}
          </p>

          {/* Not applicable toggle */}
          {criterion.notApplicableLabel && (() => {
            const isNA = answer?.rating === -2;
            return (
              <button
                type="button"
                onClick={() => {
                  if (isNA) {
                    onAnswerChange(criterion.id, { rating: -1, siNo: false });
                  } else {
                    onAnswerChange(criterion.id, { rating: -2, siNo: false });
                    setTimeout(() => {
                      if (currentIndex < criteria.length - 1) {
                        goTo(currentIndex + 1, 'next');
                      } else {
                        setShowSummary(true);
                      }
                    }, 600);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '14px 18px',
                  marginBottom: '16px',
                  borderRadius: '12px',
                  border: `2px solid ${isNA ? '#6366f1' : 'rgba(0,0,0,0.08)'}`,
                  background: isNA ? 'rgba(99,102,241,0.06)' : '#fafafa',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.25s ease',
                }}
              >
                <span style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  background: isNA ? '#6366f1' : '#e5e7eb',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}>
                  {isNA ? '✓' : ''}
                </span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isNA ? '#6366f1' : '#6b7280',
                }}>
                  {criterion.notApplicableLabel}
                </span>
              </button>
            );
          })()}

          {/* Options */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            opacity: criterion.notApplicableLabel && answer?.rating === -2 ? 0.3 : 1,
            pointerEvents: criterion.notApplicableLabel && answer?.rating === -2 ? 'none' : 'auto',
            transition: 'opacity 0.3s ease',
          }}>
            {options.map((option, idx) => {
              const selected = answer?.rating === option.score;
              const hovered = hoveredOption === idx;
              const cs = cardStyle(option, selected, hovered);
              const checkColor = option.score === 0 ? '#e74c3c' : option.score === 5 ? '#f39c12' : '#27ae60';

              return (
                <button
                  key={option.score}
                  type="button"
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHoveredOption(idx)}
                  onMouseLeave={() => setHoveredOption(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '18px 20px',
                    borderRadius: '14px',
                    border: `2px solid ${cs.border}`,
                    backgroundColor: cs.bg,
                    boxShadow: cs.shadow,
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: `scale(${cs.scale})`,
                    textAlign: 'left',
                    outline: 'none',
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {/* Keyboard hint */}
                  <span style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: selected ? checkColor : '#f1f5f9',
                    color: selected ? 'white' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}>
                    {selected ? '✓' : idx + 1}
                  </span>

                  <span style={{ fontSize: '22px', flexShrink: 0 }}>{option.icon}</span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: selected ? checkColor : '#1b2a4a',
                      marginBottom: '2px',
                      transition: 'color 0.2s ease',
                    }}>
                      {option.title}
                    </p>
                    <p style={{
                      fontSize: '12px',
                      color: selected ? checkColor : '#6b7280',
                      lineHeight: 1.4,
                      transition: 'color 0.2s ease',
                      opacity: selected ? 0.8 : 1,
                    }}>
                      {option.description}
                    </p>
                  </div>

                  {/* Selection animation pulse */}
                  {selected && justSelected && (
                    <div style={{
                      position: 'absolute',
                      inset: '-2px',
                      borderRadius: '14px',
                      border: `2px solid ${checkColor}`,
                      animation: 'selectPulse 0.6s ease-out forwards',
                      pointerEvents: 'none',
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '28px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb',
        }}>
          <button
            onClick={() => currentIndex > 0 && goTo(currentIndex - 1, 'prev')}
            disabled={currentIndex === 0}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 500,
              color: currentIndex === 0 ? '#d1d5db' : '#6b7280',
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Anterior
          </button>

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '200px' }}>
            {criteria.map((c, i) => {
              const a = answers.find(ans => ans.criterionId === c.id);
              const answered = a && (a.rating >= 0 || a.rating === -2);
              return (
                <button
                  key={c.id}
                  onClick={() => goTo(i, i > currentIndex ? 'next' : 'prev')}
                  style={{
                    width: i === currentIndex ? '20px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: i === currentIndex ? '#d4922e'
                      : answered ? '#22C55E'
                      : '#e5e7eb',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    padding: 0,
                  }}
                />
              );
            })}
          </div>

          <button
            onClick={() => {
              if (currentIndex < criteria.length - 1) {
                goTo(currentIndex + 1, 'next');
              } else {
                setShowSummary(true);
              }
            }}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#0047AB',
              background: 'rgba(0,71,171,0.08)',
              border: '1px solid rgba(0,71,171,0.15)',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {currentIndex === criteria.length - 1 ? 'Ver resumen' : 'Siguiente →'}
          </button>
        </div>

        {/* Keyboard hints */}
        <p style={{
          textAlign: 'center',
          fontSize: '10px',
          color: '#c4c9d1',
          marginTop: '12px',
        }}>
          Tecla 1-{options.length} para seleccionar · ← → para navegar
        </p>
      </div>
    </div>
  );
}
