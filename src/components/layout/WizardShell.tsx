import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, X, Check, Save } from 'lucide-react';
import StepIndicator from './StepIndicator';
import { useDiagnosticStore } from '../../store/diagnosticStore';
import { useAuthStore } from '../../store/authStore';
import { sendReportEmail } from '../../lib/sendReportEmail';
import { getCurrentUser, ensureFreshSession } from '../../lib/auth';
import { INSTITUCIONALIZACION_CRITERIA } from '../../config/questions';
import CompletionCelebration from '../ui/CompletionCelebration';

import Step1DatosGenerales from '../../pages/steps/Step1DatosGenerales';
import StepExplicaNegocio from '../../pages/steps/StepExplicaNegocio';
import Step2SituacionActual from '../../pages/steps/Step2SituacionActual';
import Step3Profesionalizacion from '../../pages/steps/Step3Profesionalizacion';
import Step4Institucionalizacion from '../../pages/steps/Step4Institucionalizacion';
import Step5Gerencias from '../../pages/steps/Step5PuestosClave';
import Step6RetosUrgencia from '../../pages/steps/Step6RetosUrgencia';
const BASE_STEPS = [
  { id: 'datos', label: 'Datos Generales', component: Step1DatosGenerales, avgMinutes: 3 },
  { id: 'negocio', label: 'Tu Negocio', component: StepExplicaNegocio, avgMinutes: 2 },
  { id: 'situacion', label: 'Situación Actual', component: Step2SituacionActual, avgMinutes: 3 },
  { id: 'prof', label: 'Profesionalización', component: Step3Profesionalizacion, avgMinutes: 5 },
  { id: 'inst', label: 'Institucionalización', component: Step4Institucionalizacion, avgMinutes: 5 },
  { id: 'gerencias', label: 'Gerencias', component: Step5Gerencias, avgMinutes: 4 },
  { id: 'retos', label: 'Retos y Urgencia', component: Step6RetosUrgencia, avgMinutes: 3 },
];

function validateStep(stepId: string, state: ReturnType<typeof useDiagnosticStore.getState>): string[] {
  const missing: string[] = [];
  switch (stepId) {
    case 'datos': {
      const dg = state.datosGenerales;
      const isFamily = state.isFamilyBusiness();
      if (!dg.nombreComercial.trim()) missing.push('Nombre comercial');
      if (!dg.ubicacion) missing.push('Ubicación');
      if (!dg.antiguedadConstituida) missing.push('Antigüedad constituida');
      if (!dg.antiguedadOperativa) missing.push('Antigüedad operativa');
      if (!dg.empresaFamiliar) missing.push('Empresa familiar');
      if (!dg.respondente.trim()) missing.push('Nombre del respondente');
      if (!dg.email.trim()) missing.push('Correo electrónico');
      if (!dg.puestoEmpresa.trim()) missing.push('Puesto en la empresa');
      if (isFamily && !dg.puestoFamilia.trim()) missing.push('Puesto en la familia');
      if (!dg.esSocio) missing.push('¿Es socio?');
      if (!dg.sector) missing.push('Sector');
      if (!dg.softwareSelections || dg.softwareSelections.selected.length === 0) missing.push('Software de gestión');
      break;
    }
    case 'situacion': {
      const isFamily = state.isFamilyBusiness();
      if (state.situacionActual.ventasAnualesMDP === null) missing.push('Ventas anuales');
      if (state.situacionActual.empleadosTotales === null) missing.push('Empleados totales');
      if (!state.situacionActual.socios) missing.push('Número de socios');
      if (isFamily) {
        if (state.situacionActual.empleadosFamiliares === null) missing.push('Empleados familiares');
      }
      break;
    }
    case 'prof': {
      const unanswered = state.profAnswers.filter(a => a.rating < 0);
      if (unanswered.length > 0) missing.push(`${unanswered.length} pregunta${unanswered.length > 1 ? 's' : ''} de profesionalizacion`);
      break;
    }
    case 'inst': {
      const isFamily = state.isFamilyBusiness();
      const unansweredInst = state.instAnswers.filter((a: any) => {
        const criterion = INSTITUCIONALIZACION_CRITERIA.find(c => c.id === a.criterionId);
        return criterion && (!criterion.requiresFamilyBusiness || isFamily) && a.rating < 0;
      });
      if (unansweredInst.length > 0) missing.push(`${unansweredInst.length} pregunta${unansweredInst.length > 1 ? 's' : ''} de institucionalizacion`);
      break;
    }
    case 'gerencias': {
      const covered = state.gerencias.filter(g => g.cubierto).length;
      if (covered === 0) missing.push('Al menos una gerencia debe estar cubierta');
      break;
    }
    case 'retos': {
      if (!state.urgencia) missing.push('Nivel de urgencia');
      break;
    }
  }
  return missing;
}

export default function WizardShell() {
  const currentStep = useDiagnosticStore(s => s.currentStep);
  const setStep = useDiagnosticStore(s => s.setStep);
  const setView = useDiagnosticStore(s => s.setView);
  const saveDiagnostic = useDiagnosticStore(s => s.saveDiagnostic);
  const resetDiagnostic = useDiagnosticStore(s => s.resetDiagnostic);
  const setDraftActive = useDiagnosticStore(s => s.setDraftActive);
  const setEmailStatus = useDiagnosticStore(s => s.setEmailStatus);
  const testMode = useDiagnosticStore(s => s.testMode);
  const prefillMode = useDiagnosticStore(s => s.prefillMode);
  const savePrefillData = useDiagnosticStore(s => s.savePrefillData);

  const user = useAuthStore(s => s.user);
  const isMaster = user?.role === 'master';

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [savingPrefill, setSavingPrefill] = useState(false);
  const [showPrefillSuccess, setShowPrefillSuccess] = useState(false);

  /* ── B5: Celebration state ── */
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{ score: number; companyName: string } | null>(null);

  /* ── Keep Supabase session alive while filling the survey ── */
  useEffect(() => {
    const interval = setInterval(() => { ensureFreshSession(); }, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /* ── B6: Auto-save ── */
  const [saveToast, setSaveToast] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setDraftActive(true);
      setSaveToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setSaveToast(false), 2200);
    }, 15000); // Auto-save every 15s of inactivity
  }, [setDraftActive]);

  // Reset auto-save timer on any step change or interaction
  useEffect(() => {
    triggerAutoSave();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [currentStep, triggerAutoSave]);

  // Also listen for any store changes to re-trigger auto-save
  useEffect(() => {
    const unsub = useDiagnosticStore.subscribe(() => {
      triggerAutoSave();
    });
    return unsub;
  }, [triggerAutoSave]);

  /* ── Warn on browser close / navigate away ── */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show a generic message; setting returnValue triggers the prompt
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const steps = useMemo(() => [...BASE_STEPS], []);

  const isLast = currentStep >= steps.length - 1;
  const StepComponent = steps[currentStep]?.component;

  /* ── B1: Completion percentage ── */

  /* ── B1: Continuous progress (based on fields filled, not just step) ── */
  const continuousProgress = useMemo(() => {
    const stepWeight = 100 / steps.length;
    return Math.min(99, Math.round((currentStep / steps.length) * 100 + stepWeight * 0.5));
  }, [currentStep, steps.length]);

  function handleNext() {
    if (!isMaster && !testMode && !prefillMode) {
      const state = useDiagnosticStore.getState();
      const stepId = steps[currentStep]?.id;
      const errors = validateStep(stepId, state);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
    }
    setValidationErrors([]);

    if (isLast) {
      if (prefillMode) {
        setSavingPrefill(true);
        savePrefillData()
          .then((ok) => {
            setSavingPrefill(false);
            if (!ok) console.error('Failed to save prefill');
            setShowPrefillSuccess(true);
          })
          .catch(() => {
            setSavingPrefill(false);
            resetDiagnostic();
            setView('history');
          });
        return;
      }

      // ── B5: Show celebration before result ──
      const diagnostic = saveDiagnostic();
      const avgScore = Math.round((diagnostic.profesionalizacion.average + diagnostic.institucionalizacion.average) / 2);
      const companyName = diagnostic.datosGenerales.nombreComercial || 'Tu Empresa';

      setCelebrationData({ score: avgScore, companyName });
      setShowCelebration(true);

      // Send email in background
      const userEmail = getCurrentUser()?.email;
      const surveyEmail = diagnostic.datosGenerales.email;
      const emails = new Set<string>();
      if (userEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) emails.add(userEmail.toLowerCase());
      if (surveyEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(surveyEmail)) emails.add(surveyEmail.toLowerCase());

      if (!testMode && emails.size > 0) {
        const primaryEmail = userEmail || surveyEmail;
        if (primaryEmail && !diagnostic.datosGenerales.email) {
          diagnostic.datosGenerales.email = primaryEmail;
        }
        setEmailStatus('sending');

        const emailPromises = Array.from(emails).map(email => {
          const diagCopy = { ...diagnostic, datosGenerales: { ...diagnostic.datosGenerales, email } };
          return sendReportEmail(diagCopy);
        });

        Promise.all(emailPromises)
          .then(() => setEmailStatus('sent'))
          .catch(() => setEmailStatus('error'));
      }
    } else {
      setStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      setValidationErrors([]);
      setStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleStepClick(index: number) {
    if (index <= currentStep) {
      setValidationErrors([]);
      setStep(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleSaveAndExit() {
    setDraftActive(true);
    setShowExitConfirm(false);
    const wasPrefill = useDiagnosticStore.getState().prefillMode;
    if (wasPrefill) {
      setView('history');
    } else {
      setView('home');
    }
  }

  function handleExit() {
    const wasPrefill = useDiagnosticStore.getState().prefillMode;
    resetDiagnostic();
    if (wasPrefill) setView('history');
  }

  /* ── B5: Celebration finished ── */
  function handleCelebrationFinish() {
    setShowCelebration(false);
    setCelebrationData(null);
    setView('result');
  }

  /* ── Prefill success screen ── */
  if (showPrefillSuccess) {
    return (
      <div style={{ width: '100%', maxWidth: '620px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div className="animate-fade-up bg-white rounded-2xl border border-border/40 shadow-lg" style={{ padding: '48px 36px' }}>
          {/* Success icon */}
          <div className="inline-flex items-center justify-center rounded-full" style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #22c55e20, #22c55e10)', marginBottom: '24px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#22c55e" opacity="0.15" />
              <path d="M7 13l3 3 7-7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h2 className="font-serif text-navy" style={{ fontSize: 'var(--fs-22)', marginBottom: '8px' }}>
            Pre-llenado completo
          </h2>
          <p className="text-muted" style={{ fontSize: 'var(--fs-13)', lineHeight: '1.6', marginBottom: '32px', maxWidth: '360px', margin: '0 auto 32px' }}>
            Los datos han sido guardados exitosamente. El cliente verá esta información pre-llenada cuando conteste su radiografía empresarial.
          </p>

          {/* Info card */}
          <div className="rounded-xl border border-accent/20 bg-accent/5" style={{ padding: '14px 20px', marginBottom: '28px' }}>
            <div className="flex items-center justify-center" style={{ gap: '8px' }}>
              <Sparkles className="text-accent" style={{ width: 'var(--fs-14)', height: 'var(--fs-14)' }} />
              <p className="text-accent font-semibold" style={{ fontSize: 'var(--fs-12)' }}>
                El cliente podra modificar cualquier dato antes de enviar
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center" style={{ gap: '12px' }}>
            <button
              onClick={() => {
                setShowPrefillSuccess(false);
                resetDiagnostic();
                setView('history');
              }}
              style={{
                fontSize: 'var(--fs-14)',
                padding: '12px 36px',
                borderRadius: '12px',
                background: '#d4922e',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 4px 16px rgba(212,146,46,0.25)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#c07f20'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#d4922e'; }}
            >
              Volver a expedientes
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── B5: Celebration overlay ── */
  if (showCelebration && celebrationData) {
    return (
      <CompletionCelebration
        score={celebrationData.score}
        companyName={celebrationData.companyName}
        onFinish={handleCelebrationFinish}
      />
    );
  }

  return (
    <div className="wizard-client-scale" style={{ width: '100%', maxWidth: '760px', margin: '0 auto', padding: 'clamp(20px, 4vw, 44px) clamp(14px, 3vw, 28px)', position: 'relative' }}>
      {/* ── B6: Auto-save toast ── */}
      {saveToast && (
        <div className="save-toast" style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          borderRadius: '10px',
          background: '#1b2a4a',
          boxShadow: '0 4px 20px rgba(27,42,74,0.25)',
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" fill="#22c55e" opacity="0.2" />
            <path d="M5 8.5l2 2 4-4" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 'var(--fs-12)', fontWeight: 600, color: 'white' }}>Progreso guardado</span>
        </div>
      )}

      <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
        <div className="flex items-center" style={{ gap: '12px' }}>
          <span className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>
            Paso {currentStep + 1} de {steps.length}
          </span>
          {/* ── B1: Completion % ── */}
          <span style={{
            fontSize: 'var(--fs-10)',
            fontWeight: 500,
            color: '#d4922e',
            padding: '2px 10px',
            borderRadius: '6px',
            background: '#d4922e10',
            border: '1px solid #d4922e20',
          }}>
            {continuousProgress}% completado
          </span>
        </div>
        <button
          onClick={() => setShowExitConfirm(true)}
          className="flex items-center text-muted hover:text-error hover:bg-error/5 border border-transparent hover:border-error/20 transition-all cursor-pointer"
          style={{ gap: '6px', padding: '6px 10px', borderRadius: '8px', fontSize: 'var(--fs-11)', fontWeight: 500 }}
        >
          <X style={{ width: 'var(--fs-13)', height: 'var(--fs-13)' }} /> Salir
        </button>
      </div>

      {/* ── B1: Continuous progress bar ── */}
      <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
        <div className="progress-shimmer" style={{
          height: '4px',
          width: `${continuousProgress}%`,
          borderRadius: '4px',
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>

      {prefillMode && (
        <div className="w-full bg-accent/10 border border-accent/30 rounded-xl text-center" style={{ padding: '10px 20px', marginBottom: '12px' }}>
          <p className="text-accent font-semibold" style={{ fontSize: 'var(--fs-12)' }}>
            Modo pre-llenado — Los datos que ingrese aqui apareceran cuando el cliente conteste la encuesta
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-border/60" style={{ marginBottom: '32px', padding: '14px 20px' }}>
        <StepIndicator steps={steps} currentStep={currentStep} onStepClick={handleStepClick} />
      </div>

      <div className="animate-fade-up" key={steps[currentStep]?.id}>
        {StepComponent && <StepComponent />}
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-error/10 border border-error/30 rounded-xl" style={{ padding: '16px 20px', marginTop: '20px' }}>
          <p className="text-error font-semibold" style={{ fontSize: 'var(--fs-13)', marginBottom: '8px' }}>
            Complete las siguientes preguntas antes de continuar:
          </p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            {validationErrors.map((err, i) => (
              <li key={i} className="text-error" style={{ fontSize: 'var(--fs-12)', marginBottom: '4px' }}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between" style={{ marginTop: '48px', paddingBottom: '48px' }}>
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="border border-border text-muted hover:text-ink hover:border-mid transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          style={{ padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 28px)', borderRadius: '12px', fontSize: 'var(--fs-13)', fontWeight: 500 }}
        >
          ← Anterior
        </button>
        <button
          onClick={handleNext}
          disabled={savingPrefill}
          className={`font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50 ${prefillMode && isLast ? 'bg-success text-white hover:bg-success/80' : ''}`}
          style={{
            padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 28px)',
            borderRadius: '12px',
            fontSize: 'var(--fs-13)',
            ...(prefillMode && isLast
              ? {}
              : {
                  background: isLast ? '#d4922e' : '#0047AB',
                  color: 'white',
                }),
          }}
          onMouseEnter={e => {
            if (!prefillMode || !isLast) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }
          }}
          onMouseLeave={e => {
            if (!prefillMode || !isLast) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }
          }}
        >
          {savingPrefill
            ? 'Guardando...'
            : isLast
              ? prefillMode
                ? 'Guardar pre-llenado'
                : <span className="inline-flex items-center" style={{ gap: '6px' }}>Finalizar radiografía <Check style={{ width: 'var(--fs-14)', height: 'var(--fs-14)' }} /></span>
              : 'Siguiente →'}
        </button>
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-border max-w-md w-full text-center animate-fade-up" style={{ padding: '40px 32px', margin: '0 16px' }}>
            <div className="inline-flex items-center justify-center rounded-full bg-accent/10" style={{ width: '48px', height: '48px', marginBottom: '16px' }}>
              <Save className="text-accent" style={{ width: 'var(--fs-20)', height: 'var(--fs-20)' }} />
            </div>
            <h3 className="font-serif text-navy" style={{ fontSize: 'var(--fs-18)', marginBottom: '8px' }}>Salir de la radiografía</h3>
            <p className="text-muted" style={{ fontSize: 'var(--fs-13)', marginBottom: '24px' }}>
              Puedes guardar tu progreso y continuar despues, o salir sin guardar.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleSaveAndExit} className="w-full rounded-xl bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer inline-flex items-center justify-center" style={{ padding: 'var(--sp-btn-c)', fontSize: 'var(--fs-13)', gap: '6px' }}>
                <Save style={{ width: 'var(--fs-14)', height: 'var(--fs-14)' }} /> Guardar y salir
              </button>
              <button onClick={handleExit} className="w-full rounded-xl border border-error/30 text-error font-medium hover:bg-error/5 transition-all cursor-pointer" style={{ padding: 'var(--sp-btn-b)', fontSize: 'var(--fs-12)' }}>
                Salir sin guardar
              </button>
              <button onClick={() => setShowExitConfirm(false)} className="w-full rounded-xl border border-border text-muted font-medium hover:text-ink transition-all cursor-pointer" style={{ padding: 'var(--sp-btn-b)', fontSize: 'var(--fs-12)' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
