import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { useOrgSurveyStore } from '../store/orgSurveyStore';
import { useTechSurveyStore } from '../store/techSurveyStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { getAllClientAccounts, getExpedienteDataForClients } from '../lib/storage';
import type { AppUser, SavedDiagnostic, SavedOrgSurvey } from '../lib/types';

const DIAG_TOTAL_STEPS = 7;
const ORG_TOTAL_STEPS = 3;
const TECH_TOTAL_STEPS = 7;

export default function HomePage() {
  const setView = useDiagnosticStore(s => s.setView);
  const resetDiagnostic = useDiagnosticStore(s => s.resetDiagnostic);
  const setDiagTestMode = useDiagnosticStore(s => s.setTestMode);
  const resetOrgSurvey = useOrgSurveyStore(s => s.resetOrgSurvey);
  const setOrgTestMode = useOrgSurveyStore(s => s.setTestMode);
  const resetTechSurvey = useTechSurveyStore(s => s.resetTechSurvey);
  const setTechTestMode = useTechSurveyStore(s => s.setTestMode);
  const user = useAuthStore(s => s.user);
  const companyLogo = useSettingsStore(s => s.companyLogo);

  // Draft detection
  const diagDraftActive = useDiagnosticStore(s => s.draftActive);
  const diagDraftStep = useDiagnosticStore(s => s.currentStep);
  const orgDraftActive = useOrgSurveyStore(s => s.draftActive);
  const orgDraftStep = useOrgSurveyStore(s => s.currentStep);
  const techDraftActive = useTechSurveyStore(s => s.draftActive);
  const techDraftStep = useTechSurveyStore(s => s.currentStep);

  const [accounts, setAccounts] = useState<AppUser[]>([]);
  const [expedienteData, setExpedienteData] = useState<
    Map<string, { diagnostics: SavedDiagnostic[]; orgSurveys: SavedOrgSurvey[] }>
  >(new Map());
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [accs, expData] = await Promise.all([
      getAllClientAccounts(),
      getExpedienteDataForClients(),
    ]);
    setAccounts(accs);
    setExpedienteData(expData);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Clients always go to their dashboard
  if (user?.role === 'client') {
    return <Navigate to="/dashboard" replace />;
  }

  function handleTestDiagnostic() {
    resetDiagnostic();
    setDiagTestMode(true);
    setView('wizard');
  }

  function handleTestOrgSurvey() {
    resetOrgSurvey();
    setOrgTestMode(true);
    setView('org_wizard');
  }

  function handleTestTechSurvey() {
    resetTechSurvey();
    setTechTestMode(true);
    setView('tech_wizard');
  }

  /* ── Draft resume/discard ── */
  function handleResumeDiagDraft() { setView('wizard'); }
  function handleDiscardDiagDraft() { resetDiagnostic(); }
  function handleResumeOrgDraft() { setView('org_wizard'); }
  function handleDiscardOrgDraft() { resetOrgSurvey(); }
  function handleResumeTechDraft() { setView('tech_wizard'); }
  function handleDiscardTechDraft() { resetTechSurvey(); }

  // Stats
  const totalClients = accounts.length;
  const clientsWithData = accounts.filter(a => expedienteData.has(a.id)).length;
  const totalDiags = Array.from(expedienteData.values()).reduce((sum, d) => sum + d.diagnostics.length, 0);
  const totalOrg = Array.from(expedienteData.values()).reduce((sum, d) => sum + d.orgSurveys.length, 0);

  return (
    <div className="w-full flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="w-full mx-auto" style={{ maxWidth: '800px', padding: '40px 24px' }}>

        {/* Welcome header */}
        <div className="text-center" style={{ marginBottom: '36px' }}>
          <div className="flex items-center justify-center" style={{ marginBottom: '12px' }}>
            <img
              src={companyLogo || '/logo-complement.svg'}
              alt="Complement Consulting Group"
              className="object-contain"
              style={{ height: '52px' }}
            />
          </div>
          <h1 className="font-serif text-navy" style={{ fontSize: '24px', marginBottom: '6px' }}>
            Bienvenido, {user?.displayName || 'Administrador'}
          </h1>
          <p className="text-muted" style={{ fontSize: '13px' }}>
            Panel de control — Complement Consulting Group
          </p>
        </div>

        {/* Stats cards */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 animate-fade-up" style={{ gap: '14px', marginBottom: '28px' }}>
            <StatCard label="Clientes" value={totalClients.toString()} icon="👥" />
            <StatCard label="Con expediente" value={clientsWithData.toString()} icon="📁" />
            <StatCard label="Diagnosticos" value={totalDiags.toString()} icon="📋" />
            <StatCard label="Estructura Org." value={totalOrg.toString()} icon="🏗️" />
          </div>
        )}

        {/* Main action cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
          <button
            onClick={() => setView('history')}
            className="w-full bg-gradient-to-r from-navy to-accent rounded-2xl shadow-lg hover:shadow-xl text-left transition-all cursor-pointer group"
            style={{ padding: '28px 32px' }}
          >
            <div className="flex items-center" style={{ gap: '16px' }}>
              <div className="inline-flex items-center justify-center rounded-full bg-white/15 shrink-0" style={{ width: '48px', height: '48px' }}>
                <span style={{ fontSize: '22px' }}>📊</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-bold group-hover:tracking-wide transition-all" style={{ fontSize: '17px', marginBottom: '4px' }}>
                  Administracion y Expedientes
                </p>
                <p className="text-white/60" style={{ fontSize: '12px' }}>
                  Gestione clientes, vea expedientes y configure el sistema
                </p>
              </div>
              <span className="text-white/40 font-bold" style={{ fontSize: '20px' }}>→</span>
            </div>
          </button>

          <button
            onClick={() => setView('settings')}
            className="w-full bg-white rounded-2xl border border-border/40 shadow-sm hover:shadow-md text-left transition-all cursor-pointer group"
            style={{ padding: '20px 32px' }}
          >
            <div className="flex items-center" style={{ gap: '16px' }}>
              <div className="inline-flex items-center justify-center rounded-full bg-navy/10 shrink-0" style={{ width: '42px', height: '42px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="text-navy" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-navy font-bold group-hover:tracking-wide transition-all" style={{ fontSize: '15px', marginBottom: '2px' }}>
                  Configuracion
                </p>
                <p className="text-muted" style={{ fontSize: '11px' }}>
                  Personalice el logo y la apariencia del sistema
                </p>
              </div>
              <span className="text-muted font-bold" style={{ fontSize: '18px' }}>→</span>
            </div>
          </button>
        </div>

        {/* Draft banners */}
        {(diagDraftActive || orgDraftActive || techDraftActive) && (
          <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 className="text-muted uppercase tracking-wide font-semibold" style={{ fontSize: '11px', marginBottom: '2px', letterSpacing: '0.05em' }}>
              Encuestas en progreso
            </h2>
            {diagDraftActive && (
              <HomeDraftBanner icon="📋" label="Diagnostico Empresarial" step={diagDraftStep + 1} totalSteps={DIAG_TOTAL_STEPS} onResume={handleResumeDiagDraft} onDiscard={handleDiscardDiagDraft} />
            )}
            {orgDraftActive && (
              <HomeDraftBanner icon="🏗️" label="Estructura Organizacional" step={orgDraftStep + 1} totalSteps={ORG_TOTAL_STEPS} onResume={handleResumeOrgDraft} onDiscard={handleDiscardOrgDraft} />
            )}
            {techDraftActive && (
              <HomeDraftBanner icon="💻" label="Prueba de Tecnologia" step={techDraftStep + 1} totalSteps={TECH_TOTAL_STEPS} onResume={handleResumeTechDraft} onDiscard={handleDiscardTechDraft} />
            )}
          </div>
        )}

        {/* Test surveys section */}
        <div style={{ marginBottom: '36px' }}>
          <h2 className="font-serif text-navy text-center" style={{ fontSize: '17px', marginBottom: '6px' }}>
            Probar encuestas como cliente
          </h2>
          <p className="text-muted text-center" style={{ fontSize: '12px', marginBottom: '16px' }}>
            Conteste la encuesta como lo veria un cliente. Al finalizar se genera un reporte de prueba y se puede probar el envio de correo.
          </p>
          <div className="flex justify-center" style={{ gap: '14px' }}>
            <button
              onClick={handleTestDiagnostic}
              className="flex-1 bg-white rounded-2xl border border-border/40 shadow-sm hover:shadow-md text-center transition-all cursor-pointer"
              style={{ padding: '24px 20px', maxWidth: '280px' }}
            >
              <div className="inline-flex items-center justify-center rounded-full bg-accent/10" style={{ width: '40px', height: '40px', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px' }}>📋</span>
              </div>
              <h3 className="font-bold text-navy" style={{ fontSize: '14px', marginBottom: '4px' }}>
                Diagnostico Empresarial
              </h3>
              <p className="text-muted" style={{ fontSize: '11px', marginBottom: '12px' }}>
                Prueba completa como cliente
              </p>
              <span className="text-accent font-semibold" style={{ fontSize: '12px' }}>
                Iniciar prueba →
              </span>
            </button>

            <button
              onClick={handleTestOrgSurvey}
              className="flex-1 bg-white rounded-2xl border border-border/40 shadow-sm hover:shadow-md text-center transition-all cursor-pointer"
              style={{ padding: '24px 20px', maxWidth: '280px' }}
            >
              <div className="inline-flex items-center justify-center rounded-full bg-mid/10" style={{ width: '40px', height: '40px', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px' }}>🏗️</span>
              </div>
              <h3 className="font-bold text-navy" style={{ fontSize: '14px', marginBottom: '4px' }}>
                Estructura Organizacional
              </h3>
              <p className="text-muted" style={{ fontSize: '11px', marginBottom: '12px' }}>
                Prueba completa como cliente
              </p>
              <span className="text-mid font-semibold" style={{ fontSize: '12px' }}>
                Iniciar prueba →
              </span>
            </button>

            <button
              onClick={handleTestTechSurvey}
              className="flex-1 bg-white rounded-2xl border border-border/40 shadow-sm hover:shadow-md text-center transition-all cursor-pointer"
              style={{ padding: '24px 20px', maxWidth: '280px' }}
            >
              <div className="inline-flex items-center justify-center rounded-full bg-accent/10" style={{ width: '40px', height: '40px', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px' }}>💻</span>
              </div>
              <h3 className="font-bold text-navy" style={{ fontSize: '14px', marginBottom: '4px' }}>
                Prueba de Tecnologia
              </h3>
              <p className="text-muted" style={{ fontSize: '11px', marginBottom: '12px' }}>
                Prueba completa como cliente
              </p>
              <span className="text-accent font-semibold" style={{ fontSize: '12px' }}>
                Iniciar prueba →
              </span>
            </button>
          </div>
        </div>

        {/* Quick info */}
        <div className="w-full grid grid-cols-3 text-center animate-fade-up-delay" style={{ gap: '20px' }}>
          <InfoCard number="01" title="Capture" text="Ingrese datos y responda la evaluacion." />
          <InfoCard number="02" title="Analice" text="Clasificacion e identificacion de areas de oportunidad." />
          <InfoCard number="03" title="Actue" text="Lleve a cabo su diagnostico presencial." />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl border border-border/40 shadow-sm text-center" style={{ padding: '18px 12px' }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <p className="font-bold text-ink" style={{ fontSize: '20px', marginTop: '6px' }}>{value}</p>
      <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: '9px', marginTop: '2px' }}>{label}</p>
    </div>
  );
}

function InfoCard({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="bg-white rounded-xl border border-border/40 shadow-sm hover:shadow-md transition-shadow" style={{ padding: '22px 18px' }}>
      <span className="font-bold text-accent tracking-wider" style={{ fontSize: '10px' }}>{number}</span>
      <h3 className="font-semibold text-navy" style={{ fontSize: '13px', marginTop: '8px', marginBottom: '6px' }}>{title}</h3>
      <p className="text-muted leading-relaxed" style={{ fontSize: '11px' }}>{text}</p>
    </div>
  );
}

function HomeDraftBanner({
  icon,
  label,
  step,
  totalSteps,
  onResume,
  onDiscard,
}: {
  icon: string;
  label: string;
  step: number;
  totalSteps: number;
  onResume: () => void;
  onDiscard: () => void;
}) {
  const pct = Math.round((step / totalSteps) * 100);
  return (
    <div
      className="rounded-2xl border-2 border-accent/30 bg-accent/5 shadow-sm animate-fade-up"
      style={{ padding: '16px 24px' }}
    >
      <div className="flex items-center" style={{ gap: '14px' }}>
        <div className="inline-flex items-center justify-center rounded-full bg-accent/15 shrink-0" style={{ width: '36px', height: '36px' }}>
          <span style={{ fontSize: '16px' }}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center" style={{ gap: '8px', marginBottom: '3px' }}>
            <p className="font-bold text-navy truncate" style={{ fontSize: '12px' }}>{label}</p>
            <span className="bg-warn/15 text-warn font-bold border border-warn/30 shrink-0" style={{ fontSize: '8px', padding: '2px 6px', borderRadius: '5px' }}>
              En progreso
            </span>
          </div>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <div className="flex-1 rounded-full bg-border/40" style={{ height: '3px', maxWidth: '100px' }}>
              <div className="rounded-full bg-accent" style={{ height: '3px', width: `${pct}%`, transition: 'width 0.3s' }} />
            </div>
            <span className="text-muted font-medium shrink-0" style={{ fontSize: '9px' }}>
              Paso {step}/{totalSteps}
            </span>
          </div>
        </div>
        <div className="flex items-center shrink-0" style={{ gap: '6px' }}>
          <button
            onClick={onDiscard}
            className="text-muted hover:text-error font-medium transition-all cursor-pointer"
            style={{ fontSize: '10px', padding: '4px 8px', background: 'none' }}
          >
            Descartar
          </button>
          <button
            onClick={onResume}
            className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer shadow-sm"
            style={{ fontSize: '11px', padding: '7px 16px', borderRadius: '8px' }}
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  );
}
