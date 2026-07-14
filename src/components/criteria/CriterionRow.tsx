import { useState } from 'react';
import type { CriterionConfig, CriterionAnswer } from '../../lib/types';
import { CRITERION_CARD_OPTIONS, type CardOption } from '../../config/questions';

interface Props {
  config: CriterionConfig;
  answer: CriterionAnswer;
  onChange: (partial: Partial<CriterionAnswer>) => void;
}

function cardStyle(option: CardOption, selected: boolean): { border: string; bg: string; shadow: string } {
  if (!selected) {
    return { border: 'rgba(0,0,0,0.10)', bg: '#ffffff', shadow: 'none' };
  }
  if (option.score === 0) {
    return { border: '#e74c3c', bg: 'rgba(231,76,60,0.06)', shadow: '0 2px 8px rgba(231,76,60,0.12)' };
  }
  if (option.score === 5) {
    return { border: '#f39c12', bg: 'rgba(243,156,18,0.06)', shadow: '0 2px 8px rgba(243,156,18,0.12)' };
  }
  return { border: '#27ae60', bg: 'rgba(39,174,96,0.06)', shadow: '0 2px 8px rgba(39,174,96,0.12)' };
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r="9" fill="currentColor" opacity="0.15" />
      <path d="M5.5 9.5l2 2 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CriterionRow({ config, answer, onChange }: Props) {
  const [showComment, setShowComment] = useState(answer.comentario.length > 0);
  const [justSelected, setJustSelected] = useState<number | null>(null);
  const options = CRITERION_CARD_OPTIONS[config.id] ?? [];

  const handleSelect = (option: CardOption) => {
    onChange({ rating: option.score, siNo: option.score > 0 });
    /* B3: trigger bounce animation */
    setJustSelected(option.score);
    setTimeout(() => setJustSelected(null), 400);
  };

  return (
    <div className="border border-border/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow" style={{ padding: '24px' }}>
      <p className="text-ink font-medium leading-relaxed" style={{ fontSize: '13px', marginBottom: '20px' }}>
        {config.text}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: '10px' }}>Selecciona una opción</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {options.map((option) => {
            const selected = answer.rating === option.score;
            const cs = cardStyle(option, selected);
            const checkColor = option.score === 0 ? '#e74c3c' : option.score === 5 ? '#f39c12' : '#27ae60';
            const isBouncing = justSelected === option.score;

            return (
              <button
                key={option.score}
                type="button"
                onClick={() => handleSelect(option)}
                className={isBouncing ? 'card-selected-bounce' : ''}
                style={{
                  flex: '1 1 140px',
                  minWidth: '140px',
                  maxWidth: '100%',
                  padding: '14px 14px',
                  borderRadius: '12px',
                  border: `2px solid ${cs.border}`,
                  backgroundColor: cs.bg,
                  boxShadow: cs.shadow,
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  textAlign: 'left',
                  position: 'relative',
                  outline: 'none',
                  transform: selected && !isBouncing ? 'scale(1.01)' : 'scale(1)',
                  opacity: !selected && answer.rating >= 0 ? 0.6 : 1,
                }}
              >
                {/* B3: Animated check badge */}
                {selected && (
                  <span className="check-spring" style={{ position: 'absolute', top: '8px', right: '8px', color: checkColor }}>
                    <CheckIcon />
                  </span>
                )}
                {/* B3: Selection pulse ring */}
                {isBouncing && (
                  <div style={{
                    position: 'absolute',
                    inset: '-2px',
                    borderRadius: '12px',
                    border: `2px solid ${checkColor}`,
                    animation: 'selectPulse 0.6s ease-out forwards',
                    pointerEvents: 'none',
                  }} />
                )}
                <span style={{ fontSize: '24px', lineHeight: '1', display: 'block' }}>{option.icon}</span>
                <p style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: selected ? (option.score === 0 ? '#c0392b' : option.score === 5 ? '#d68910' : '#1e8449') : '#1a1a2e',
                  marginTop: '8px',
                  marginBottom: '2px',
                  lineHeight: '1.3',
                  transition: 'color 0.2s ease',
                }}>
                  {option.title}
                </p>
                <p style={{
                  fontSize: '11px',
                  color: selected ? (option.score === 0 ? '#e74c3c' : option.score === 5 ? '#f39c12' : '#27ae60') : '#6b7280',
                  lineHeight: '1.4',
                  margin: 0,
                  transition: 'color 0.2s ease',
                }}>
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border/30" style={{ marginTop: '16px', paddingTop: '14px' }}>
        {!showComment ? (
          <button
            type="button"
            onClick={() => setShowComment(true)}
            className="text-accent hover:text-mid transition-colors cursor-pointer"
            style={{ fontSize: '11px' }}
          >
            + Agregar comentario
          </button>
        ) : (
          <textarea
            value={answer.comentario}
            onChange={e => onChange({ comentario: e.target.value })}
            placeholder="Comentario opcional..."
            className="w-full border border-border bg-pale focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none resize-none transition-all"
            style={{ padding: '10px 14px', fontSize: '12px', borderRadius: '10px' }}
            rows={2}
          />
        )}
      </div>
    </div>
  );
}
