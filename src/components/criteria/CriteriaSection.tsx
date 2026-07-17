import type { CriterionConfig, CriterionAnswer, ScoreLevel } from '../../lib/types';
import CriterionRow from './CriterionRow';

interface Props {
  title: string;
  description: string;
  criteria: CriterionConfig[];
  answers: CriterionAnswer[];
  onAnswerChange: (id: string, partial: Partial<CriterionAnswer>) => void;
  averageScore: number;
  level: ScoreLevel;
}

const LEVEL_COLORS: Record<ScoreLevel, string> = {
  Bajo: 'bg-error/15 text-error',
  Medio: 'bg-warn/15 text-warn',
  Alto: 'bg-success/15 text-success',
  Avanzado: 'bg-success/15 text-success', // backward compat for old data
};

export default function CriteriaSection({ title, description, criteria, answers, onAnswerChange, averageScore, level }: Props) {
  // Count how many questions have been answered (rating >= 0)
  const answeredCount = answers.filter(a =>
    criteria.some(c => c.id === a.criterionId) && a.rating >= 0
  ).length;
  const totalCount = criteria.length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ gap: '16px' }}>
          <div>
            <h2 className="font-serif text-navy" style={{ fontSize: 'var(--fs-17)' }}>{title}</h2>
            <p className="text-muted leading-relaxed" style={{ fontSize: 'var(--fs-13)', marginTop: '8px' }}>{description}</p>
          </div>
          <div className="flex items-center bg-pale shrink-0" style={{ gap: '10px', padding: '10px 18px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>Promedio:</span>
                <span className="font-bold text-ink" style={{ fontSize: 'var(--fs-18)' }}>{averageScore.toFixed(0)}<span className="text-muted font-normal" style={{ fontSize: 'var(--fs-12)' }}>/100</span></span>
                <span className={`font-semibold rounded-full ${LEVEL_COLORS[level]}`} style={{ fontSize: 'var(--fs-11)', padding: '3px 10px' }}>
                  {level === 'Avanzado' ? 'Alto' : level}
                </span>
              </div>
              <span className="text-muted" style={{ fontSize: 'var(--fs-10)' }}>
                {answeredCount}/{totalCount} respondidas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Criterion rows with good spacing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {criteria.map(criterion => {
          const answer = answers.find(a => a.criterionId === criterion.id);
          if (!answer) return null;
          return (
            <CriterionRow
              key={criterion.id}
              config={criterion}
              answer={answer}
              onChange={(partial) => onAnswerChange(criterion.id, partial)}
            />
          );
        })}
      </div>
    </div>
  );
}
