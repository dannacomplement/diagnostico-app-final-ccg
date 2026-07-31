import { Check } from 'lucide-react';
import { MATURITY_LEVELS } from '../../config/techQuestions';
import type { TechMaturityScore } from '../../lib/types';

interface Props {
  statement: { id: string; text: string; isGeneral: boolean };
  currentScore: TechMaturityScore | undefined;
  onAnswer: (score: TechMaturityScore) => void;
}

export default function TechQuestionStep({ statement, currentScore, onAnswer }: Props) {
  return (
    <div className="card">
      <p className="font-semibold text-accent uppercase tracking-wide" style={{ fontSize: 'var(--fs-10)', marginBottom: '10px' }}>
        {statement.isGeneral ? 'Sistemas y Seguridad' : 'Tu área'}
      </p>
      <h2 className="font-serif text-navy leading-relaxed" style={{ fontSize: 'var(--fs-16)', marginBottom: '28px' }}>
        {statement.text}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {MATURITY_LEVELS.map(level => {
          const selected = currentScore === level.score;
          return (
            <button
              key={level.score}
              onClick={() => onAnswer(level.score)}
              className={`flex items-start text-left transition-all cursor-pointer rounded-xl border-2 ${
                selected ? 'border-accent bg-accent/5' : 'border-border/40 bg-white hover:border-accent/30'
              }`}
              style={{ gap: '12px', padding: '12px 16px' }}
            >
              <div
                className={`flex items-center justify-center rounded-full flex-shrink-0 ${selected ? 'bg-accent' : 'border-2 border-border'}`}
                style={{ width: '26px', height: '26px', marginTop: '1px' }}
              >
                {selected && <Check className="text-white" style={{ width: 'var(--fs-14)', height: 'var(--fs-14)' }} />}
              </div>
              <div>
                <p className={`font-semibold ${selected ? 'text-accent' : 'text-ink'}`} style={{ fontSize: 'var(--fs-13)', marginBottom: '3px' }}>
                  Nivel {level.score} · {level.label}
                </p>
                <p className={selected ? 'text-accent' : 'text-muted'} style={{ fontSize: 'var(--fs-12)', lineHeight: 1.5 }}>
                  {level.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
