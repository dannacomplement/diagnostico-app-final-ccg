import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Users, Folder, ClipboardList, BarChart3, Building2, Monitor } from 'lucide-react';
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
  const resetTechSurvey = useTechSurveyStore(s => s.resetTechSurvey);
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


  return (
    <div className="w-full flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="w-full mx-auto" style={{ maxWidth: '980px', padding: 'var(--sp-pagepad)' }}>

        {/* Welcome header */}
        <div className="stagger-1 text-center" style={{ marginBottom: '36px' }}>
          <div className="flex items-center justify-center" style={{ marginBottom: '12px' }}>
            <img
              src={companyLogo || '/logo-complement.svg'}
              alt="Complement Consulting Group"
              className="object-contain"
              style={{ height: '52px' }}
            />
          </div>
          <h1 className="font-serif text-navy" style={{ fontSize: 'var(--fs-24)', marginBottom: '6px' }}>
            Bienvenido, {user?.displayName || 'Administrador'}
          </h1>
          <p className="text-muted" style={{ fontSize: 'var(--fs-13)' }}>
            Panel de control — Complement Consulting Group
          </p>
        </div>

        {/* Stats cards */}
        {!loading && (
          <div className="stagger-2 grid grid-cols-3" style={{ gap: '14px', marginBottom: '28px' }}>
            <StatCard label="Clientes" value={totalClients.toString()} icon={Users} />
            <StatCard label="Con expediente" value={clientsWithData.toString()} icon={Folder} />
            <StatCard label="Radiografías" value={totalDiags.toString()} icon={ClipboardList} />
          </div>
        )}

        {/* Main action cards */}
        <div className="stagger-3" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
          <button
            onClick={() => setView('history')}
            className="w-full bg-gradient-to-r from-navy to-accent rounded-2xl shadow-lg hover:shadow-xl text-left transition-all cursor-pointer group"
            style={{ padding: '28px 32px' }}
          >
            <div className="flex items-center" style={{ gap: '16px' }}>
              <div className="inline-flex items-center justify-center rounded-full bg-white/15 shrink-0" style={{ width: '48px', height: '48px' }}>
                <BarChart3 className="text-white" style={{ width: '22px', height: '22px' }} />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold group-hover:tracking-wide transition-all" style={{ fontSize: 'var(--fs-17)', marginBottom: '4px' }}>
                  Administración y Expedientes
                </p>
                <p className="text-white/60" style={{ fontSize: 'var(--fs-12)' }}>
                  Gestione clientes, vea expedientes y configure el sistema
                </p>
              </div>
              <span className="text-white/40 font-bold" style={{ fontSize: 'var(--fs-20)' }}>→</span>
            </div>
          </button>

        </div>

        {/* Draft banners */}
        {(diagDraftActive || orgDraftActive || techDraftActive) && (
          <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 className="text-muted uppercase tracking-wide font-semibold" style={{ fontSize: 'var(--fs-11)', marginBottom: '2px', letterSpacing: '0.05em' }}>
              Encuestas en progreso
            </h2>
            {diagDraftActive && (
              <HomeDraftBanner icon={ClipboardList} label="Radiografía Empresarial" step={diagDraftStep + 1} totalSteps={DIAG_TOTAL_STEPS} onResume={handleResumeDiagDraft} onDiscard={handleDiscardDiagDraft} />
            )}
            {orgDraftActive && (
              <HomeDraftBanner icon={Building2} label="Estructura Organizacional" step={orgDraftStep + 1} totalSteps={ORG_TOTAL_STEPS} onResume={handleResumeOrgDraft} onDiscard={handleDiscardOrgDraft} />
            )}
            {techDraftActive && (
              <HomeDraftBanner icon={Monitor} label="Prueba de Tecnología" step={techDraftStep + 1} totalSteps={TECH_TOTAL_STEPS} onResume={handleResumeTechDraft} onDiscard={handleDiscardTechDraft} />
            )}
          </div>
        )}

        {/* Test surveys section */}
        <div style={{ marginBottom: '36px' }}>
          <h2 className="font-serif text-navy text-center" style={{ fontSize: 'var(--fs-17)', marginBottom: '6px' }}>
            Probar encuestas como cliente
          </h2>
          <p className="text-muted text-center" style={{ fontSize: 'var(--fs-12)', marginBottom: '16px' }}>
            Conteste la encuesta como lo vería un cliente. Al finalizar se genera un reporte de prueba y se puede probar el envío de correo.
          </p>
          <div className="flex flex-col sm:flex-row items-center sm:items-stretch justify-center" style={{ gap: '14px' }}>
            <button
              onClick={handleTestDiagnostic}
              className="flex-1 w-full sm:w-auto bg-white rounded-2xl border border-border/40 shadow-sm hover:shadow-md text-center transition-all cursor-pointer"
              style={{ padding: '24px 20px', maxWidth: '280px' }}
            >
              <div className="inline-flex items-center justify-center rounded-full bg-accent/10" style={{ width: '40px', height: '40px', marginBottom: '10px' }}>
                <ClipboardList className="text-accent" style={{ width: 'var(--fs-18)', height: 'var(--fs-18)' }} />
              </div>
              <h3 className="font-bold text-navy" style={{ fontSize: 'var(--fs-14)', marginBottom: '4px' }}>
                Radiografía Empresarial
              </h3>
              <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginBottom: '12px' }}>
                Prueba completa como cliente
              </p>
              <span className="text-accent font-semibold" style={{ fontSize: 'var(--fs-12)' }}>
                Iniciar prueba →
              </span>
            </button>

            <div
              className="flex-1 w-full sm:w-auto bg-white rounded-2xl border border-border/40 shadow-sm text-center opacity-50"
              style={{ padding: '24px 20px', maxWidth: '280px', position: 'relative' }}
            >
              <div className="inline-flex items-center justify-center rounded-full bg-mid/10" style={{ width: '40px', height: '40px', marginBottom: '10px' }}>
                <Building2 className="text-mid" style={{ width: 'var(--fs-18)', height: 'var(--fs-18)' }} />
              </div>
              <h3 className="font-bold text-navy" style={{ fontSize: 'var(--fs-14)', marginBottom: '4px' }}>
                Estructura Organizacional
              </h3>
              <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginBottom: '12px' }}>
                Próximamente
              </p>
              <span className="text-muted font-medium" style={{ fontSize: 'var(--fs-11)', padding: '4px 12px', borderRadius: '6px', background: '#f3f4f6' }}>
                No disponible aún
              </span>
            </div>

            <div
              className="flex-1 w-full sm:w-auto bg-white rounded-2xl border border-border/40 shadow-sm text-center opacity-50"
              style={{ padding: '24px 20px', maxWidth: '280px', position: 'relative' }}
            >
              <div className="inline-flex items-center justify-center rounded-full bg-accent/10" style={{ width: '40px', height: '40px', marginBottom: '10px' }}>
                <Monitor className="text-accent" style={{ width: 'var(--fs-18)', height: 'var(--fs-18)' }} />
              </div>
              <h3 className="font-bold text-navy" style={{ fontSize: 'var(--fs-14)', marginBottom: '4px' }}>
                Prueba de Tecnología
              </h3>
              <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginBottom: '12px' }}>
                Próximamente
              </p>
              <span className="text-muted font-medium" style={{ fontSize: 'var(--fs-11)', padding: '4px 12px', borderRadius: '6px', background: '#f3f4f6' }}>
                No disponible aún
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="bg-white rounded-xl border border-border/40 shadow-sm text-center" style={{ padding: '18px 12px' }}>
      <Icon className="mx-auto text-accent" style={{ width: 'var(--fs-18)', height: 'var(--fs-18)' }} />
      <p className="font-bold text-ink" style={{ fontSize: 'var(--fs-20)', marginTop: '6px' }}>{value}</p>
      <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: 'var(--fs-9)', marginTop: '2px' }}>{label}</p>
    </div>
  );
}


function HomeDraftBanner({
  icon: Icon,
  label,
  step,
  totalSteps,
  onResume,
  onDiscard,
}: {
  icon: LucideIcon;
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
      <div className="flex flex-col sm:flex-row sm:items-center" style={{ gap: '10px' }}>
        <div className="flex items-center flex-1 min-w-0" style={{ gap: '14px' }}>
          <div className="inline-flex items-center justify-center rounded-full bg-accent/15 shrink-0" style={{ width: '36px', height: '36px' }}>
            <Icon className="text-accent" style={{ width: 'var(--fs-16)', height: 'var(--fs-16)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center" style={{ gap: '8px', marginBottom: '3px' }}>
              <p className="font-bold text-navy truncate" style={{ fontSize: 'var(--fs-12)' }}>{label}</p>
              <span className="bg-warn/15 text-warn font-bold border border-warn/30 shrink-0" style={{ fontSize: 'var(--fs-8)', padding: '2px 6px', borderRadius: '5px' }}>
                En progreso
              </span>
            </div>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <div className="flex-1 rounded-full bg-border/40" style={{ height: '3px', maxWidth: '100px' }}>
                <div className="rounded-full bg-accent" style={{ height: '3px', width: `${pct}%`, transition: 'width 0.3s' }} />
              </div>
              <span className="text-muted font-medium shrink-0" style={{ fontSize: 'var(--fs-9)' }}>
                Paso {step}/{totalSteps}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center shrink-0 self-end sm:self-auto" style={{ gap: '6px' }}>
          <button
            onClick={onDiscard}
            className="text-muted hover:text-error font-medium transition-all cursor-pointer"
            style={{ fontSize: 'var(--fs-10)', padding: '4px 8px', background: 'none' }}
          >
            Descartar
          </button>
          <button
            onClick={onResume}
            className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer shadow-sm"
            style={{ fontSize: 'var(--fs-11)', padding: '7px 16px', borderRadius: '8px' }}
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  );
}
