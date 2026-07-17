import { Check } from 'lucide-react';

interface Step {
  id: string;
  label: string;
}

interface Props {
  steps: Step[];
  currentStep: number;
  onStepClick: (index: number) => void;
}

export default function StepIndicator({ steps, currentStep, onStepClick }: Props) {
  return (
    <div className="flex items-center overflow-x-auto" style={{ padding: '8px 4px', gap: '0px' }}>
      {steps.map((step, i) => {
        const isDone = i < currentStep;
        const isActive = i === currentStep;

        return (
          <div key={step.id} className="flex items-center shrink-0">
            <button
              onClick={() => onStepClick(i)}
              className={`flex items-center font-medium transition-all cursor-pointer
                ${isActive ? 'bg-accent/10 text-accent' : ''}
                ${isDone ? 'text-success' : ''}
                ${!isActive && !isDone ? 'text-muted hover:text-ink' : ''}
              `}
              style={{ gap: '8px', padding: 'var(--sp-btn-b)', borderRadius: '8px', fontSize: 'var(--fs-12)' }}
            >
              <span className={`rounded-full flex items-center justify-center font-semibold shrink-0
                ${isActive ? 'bg-accent text-white' : ''}
                ${isDone ? 'bg-success text-white' : ''}
                ${!isActive && !isDone ? 'bg-border text-muted' : ''}
              `} style={{ width: '28px', height: '28px', fontSize: 'var(--fs-12)' }}>
                {isDone ? <Check style={{ width: 'var(--fs-14)', height: 'var(--fs-14)' }} /> : i + 1}
              </span>
              <span className="hidden lg:inline">{step.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`${isDone ? 'bg-success' : 'bg-border'}`} style={{ width: '28px', height: '1px', margin: '0 2px' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
