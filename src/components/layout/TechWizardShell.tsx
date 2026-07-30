import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useDiagnosticStore } from '../../store/diagnosticStore';
import { useTechSurveyStore } from '../../store/techSurveyStore';
import { AREA_STATEMENTS, GENERAL_STATEMENTS } from '../../config/techQuestions';
import TechIntroStep from '../../pages/tech-steps/TechIntroStep';
import TechQuestionStep from '../../pages/tech-steps/TechQuestionStep';

export default function TechWizardShell() {
  const currentStep = useTechSurveyStore(s => s.currentStep);
  const setStep = useTechSurveyStore(s => s.setStep);
  const respondentArea = useTechSurveyStore(s => s.respondentArea);
  const areaAnswers = useTechSurveyStore(s => s.areaAnswers);
  const generalAnswers = useTechSurveyStore(s => s.generalAnswers);
  const setAnswer = useTechSurveyStore(s => s.setAnswer);
  const saveTechSurvey = useTechSurveyStore(s => s.saveTechSurvey);
  const resetTechSurvey = useTechSurveyStore(s => s.resetTechSurvey);
  const setDraftActive = useTechSurveyStore(s => s.setDraftActive);
  const setView = useDiagnosticStore(s => s.setView);

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const areaStatements = respondentArea ? AREA_STATEMENTS[respondentArea] : [];
  // Questions after the intro step: area-specific statements first, then the general ones.
  const questions = [
    ...areaStatements.map(st => ({ ...st, isGeneral: false })),
    ...GENERAL_STATEMENTS.map(st => ({ ...st, isGeneral: true })),
  ];
  const totalSteps = questions.length + 1;
  const isIntro = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const currentQuestion = questions[currentStep - 1];
  const currentAnswer = currentQuestion
    ? (currentQuestion.isGeneral ? generalAnswers[currentQuestion.id] : areaAnswers[currentQuestion.id])
    : undefined;

  const canAdvance = isIntro ? !!respondentArea : currentAnswer !== undefined;

  function handleNext() {
    if (!canAdvance) return;
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
    <div className="wizard-client-scale" style={{ width: '100%', maxWidth: '640px', margin: '0 auto', padding: '36px 24px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
        <span className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>
          {isIntro ? 'Datos del evaluado' : `Paso ${currentStep} de ${totalSteps - 1}`} — Prueba de Tecnología
        </span>
        <button
          onClick={() => setShowExitConfirm(true)}
          className="flex items-center text-muted hover:text-error hover:bg-error/5 border border-transparent hover:border-error/20 transition-all cursor-pointer"
          style={{ gap: '6px', padding: '6px 10px', borderRadius: '8px', fontSize: 'var(--fs-11)', fontWeight: 500 }}
        >
          <X style={{ width: 'var(--fs-13)', height: 'var(--fs-13)' }} /> Salir
        </button>
      </div>

      <div className="animate-fade-up" key={currentStep}>
        {isIntro ? (
          <TechIntroStep />
        ) : currentQuestion ? (
          <TechQuestionStep
            statement={currentQuestion}
            currentScore={currentAnswer}
            onAnswer={score => setAnswer(currentQuestion.id, score, currentQuestion.isGeneral)}
          />
        ) : null}
      </div>

      <div className="flex items-center justify-between" style={{ marginTop: '48px', paddingBottom: '48px' }}>
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="border border-border text-muted hover:text-ink hover:border-mid transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          style={{ padding: '12px 28px', borderRadius: '12px', fontSize: 'var(--fs-13)', fontWeight: 500 }}
        >
          ← Anterior
        </button>
        <button
          onClick={handleNext}
          disabled={!canAdvance}
          className="bg-accent text-white font-semibold hover:bg-mid transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ padding: '12px 28px', borderRadius: '12px', fontSize: 'var(--fs-13)' }}
        >
          {isLast ? 'Finalizar encuesta' : 'Siguiente →'}
        </button>
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-border max-w-md w-full text-center animate-fade-up" style={{ padding: '40px 32px', margin: '0 16px' }}>
            <div className="inline-flex items-center justify-center rounded-full bg-accent/10" style={{ width: '48px', height: '48px', marginBottom: '16px' }}>
              <Save className="text-accent" style={{ width: 'var(--fs-20)', height: 'var(--fs-20)' }} />
            </div>
            <h3 className="font-serif text-navy" style={{ fontSize: 'var(--fs-18)', marginBottom: '8px' }}>Salir de la encuesta</h3>
            <p className="text-muted" style={{ fontSize: 'var(--fs-13)', marginBottom: '24px' }}>
              Puedes guardar tu progreso y continuar después, o salir sin guardar.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleSaveAndExit}
                className="w-full rounded-xl bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer inline-flex items-center justify-center"
                style={{ padding: 'var(--sp-btn-c)', fontSize: 'var(--fs-13)', gap: '6px' }}
              >
                <Save style={{ width: 'var(--fs-14)', height: 'var(--fs-14)' }} /> Guardar y salir
              </button>
              <button
                onClick={handleExit}
                className="w-full rounded-xl border border-error/30 text-error font-medium hover:bg-error/5 transition-all cursor-pointer"
                style={{ padding: 'var(--sp-btn-b)', fontSize: 'var(--fs-12)' }}
              >
                Salir sin guardar
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full rounded-xl border border-border text-muted font-medium hover:text-ink transition-all cursor-pointer"
                style={{ padding: 'var(--sp-btn-b)', fontSize: 'var(--fs-12)' }}
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
