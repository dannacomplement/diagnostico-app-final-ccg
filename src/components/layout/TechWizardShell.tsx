import { useState } from 'react';
import StepIndicator from './StepIndicator';
import { useDiagnosticStore } from '../../store/diagnosticStore';
import { useTechSurveyStore } from '../../store/techSurveyStore';

import TechStep1Tools from '../../pages/tech-steps/TechStep1Tools';
import TechStep2Digital from '../../pages/tech-steps/TechStep2Digital';
import TechStep3Automation from '../../pages/tech-steps/TechStep3Automation';
import TechStep4Data from '../../pages/tech-steps/TechStep4Data';
import TechStep5AI from '../../pages/tech-steps/TechStep5AI';
import TechStep6Security from '../../pages/tech-steps/TechStep6Security';
import TechStep7Culture from '../../pages/tech-steps/TechStep7Culture';

const STEPS = [
  { id: 'tools', label: 'Herramientas', component: TechStep1Tools },
  { id: 'digital', label: 'Presencia Digital', component: TechStep2Digital },
  { id: 'automation', label: 'Automatización', component: TechStep3Automation },
  { id: 'data', label: 'Datos', component: TechStep4Data },
  { id: 'ai', label: 'IA', component: TechStep5AI },
  { id: 'security', label: 'Seguridad', component: TechStep6Security },
  { id: 'culture', label: 'Cultura', component: TechStep7Culture },
];

export default function TechWizardShell() {
  const currentStep = useTechSurveyStore(s => s.currentStep);
  const setStep = useTechSurveyStore(s => s.setStep);
  const saveTechSurvey = useTechSurveyStore(s => s.saveTechSurvey);
  const resetTechSurvey = useTechSurveyStore(s => s.resetTechSurvey);
  const setDraftActive = useTechSurveyStore(s => s.setDraftActive);
  const setView = useDiagnosticStore(s => s.setView);

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const isLast = currentStep >= STEPS.length - 1;
  const StepComponent = STEPS[currentStep]?.component;

  function handleNext() {
    if (isLast) {
      saveTechSurvey();
      setView('tech_result');
    } else {
      setStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      setStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleStepClick(index: number) {
    if (index <= currentStep) {
      setStep(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleSaveAndExit() {
    setDraftActive(true);
    setShowExitConfirm(false);
    setView('home');
  }

  function handleExit() {
    resetTechSurvey();
    setView('home');
  }

  return (
    <div style={{ width: '100%', maxWidth: '760px', margin: '0 auto', padding: '36px 24px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
        <span className="text-muted" style={{ fontSize: '11px' }}>
          Paso {currentStep + 1} de {STEPS.length} — Prueba de Tecnología
        </span>
        <button
          onClick={() => setShowExitConfirm(true)}
          className="flex items-center text-muted hover:text-error hover:bg-error/5 border border-transparent hover:border-error/20 transition-all cursor-pointer"
          style={{ gap: '6px', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 500 }}
        >
          <span>✕</span> Salir
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border/60" style={{ marginBottom: '32px', padding: '14px 20px' }}>
        <StepIndicator
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />
      </div>

      <div className="animate-fade-up" key={STEPS[currentStep]?.id}>
        {StepComponent && <StepComponent />}
      </div>

      <div className="flex items-center justify-between" style={{ marginTop: '48px', paddingBottom: '48px' }}>
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="border border-border text-muted hover:text-ink hover:border-mid transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          style={{ padding: '12px 28px', borderRadius: '12px', fontSize: '13px', fontWeight: 500 }}
        >
          ← Anterior
        </button>
        <button
          onClick={handleNext}
          className="bg-accent text-white font-semibold hover:bg-mid transition-all shadow-sm cursor-pointer"
          style={{ padding: '12px 28px', borderRadius: '12px', fontSize: '13px' }}
        >
          {isLast ? 'Finalizar encuesta' : 'Siguiente →'}
        </button>
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-border max-w-md w-full text-center animate-fade-up" style={{ padding: '40px 32px', margin: '0 16px' }}>
            <div className="inline-flex items-center justify-center rounded-full bg-accent/10" style={{ width: '48px', height: '48px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>💾</span>
            </div>
            <h3 className="font-serif text-navy" style={{ fontSize: '18px', marginBottom: '8px' }}>Salir de la encuesta</h3>
            <p className="text-muted" style={{ fontSize: '13px', marginBottom: '24px' }}>
              Puedes guardar tu progreso y continuar después, o salir sin guardar.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleSaveAndExit}
                className="w-full rounded-xl bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
                style={{ padding: '12px 16px', fontSize: '13px' }}
              >
                💾 Guardar y salir
              </button>
              <button
                onClick={handleExit}
                className="w-full rounded-xl border border-error/30 text-error font-medium hover:bg-error/5 transition-all cursor-pointer"
                style={{ padding: '10px 16px', fontSize: '12px' }}
              >
                Salir sin guardar
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full rounded-xl border border-border text-muted font-medium hover:text-ink transition-all cursor-pointer"
                style={{ padding: '10px 16px', fontSize: '12px' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
