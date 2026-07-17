import type { ReactNode } from 'react';
import { Check, X, FlaskConical, Circle, Gem } from 'lucide-react';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { useTechSurveyStore } from '../store/techSurveyStore';
import { useAuthStore } from '../store/authStore';
import { computeTechMaturityScore } from '../config/techQuestions';
import type { TechMaturityLevel } from '../lib/types';

const LEVEL_CONFIG: Record<TechMaturityLevel, { label: string; icon: typeof Circle; iconClassName: string; className: string }> = {
  basico: { label: 'Básico', icon: Circle, iconClassName: 'fill-error text-error', className: 'bg-error/10 border-error/20 text-error' },
  intermedio: { label: 'Intermedio', icon: Circle, iconClassName: 'fill-warn text-warn', className: 'bg-warn/10 border-warn/20 text-warn' },
  avanzado: { label: 'Avanzado', icon: Circle, iconClassName: 'fill-success text-success', className: 'bg-success/10 border-success/20 text-success' },
  lider_digital: { label: 'Líder Digital', icon: Gem, iconClassName: 'text-accent', className: 'bg-accent/10 border-accent/20 text-accent' },
};

export default function TechResultPage() {
  const setView = useDiagnosticStore(s => s.setView);
  const companyName = useTechSurveyStore(s => s.companyName);
  const tools = useTechSurveyStore(s => s.tools);
  const digitalPresence = useTechSurveyStore(s => s.digitalPresence);
  const automation = useTechSurveyStore(s => s.automation);
  const dataAnalytics = useTechSurveyStore(s => s.dataAnalytics);
  const aiAdoption = useTechSurveyStore(s => s.aiAdoption);
  const security = useTechSurveyStore(s => s.security);
  const testMode = useTechSurveyStore(s => s.testMode);
  const setTechTestMode = useTechSurveyStore(s => s.setTestMode);
  const user = useAuthStore(s => s.user);

  // Compute score from current state
  const { score, level } = computeTechMaturityScore({
    tools, digitalPresence, automation, dataAnalytics, aiAdoption, security,
    culture: useTechSurveyStore.getState().culture,
  });

  const levelCfg = LEVEL_CONFIG[level];

  function handleMasterNav() {
    setTechTestMode(false);
    setView('home');
  }

  return (
    <div style={{ width: '100%', maxWidth: '880px', margin: '0 auto', padding: 'var(--sp-pagepad)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Test mode banner */}
      {testMode && (
        <div className="w-full bg-warn/10 border border-warn/30 rounded-xl text-center" style={{ padding: '14px 20px', marginBottom: '20px' }}>
          <p className="text-warn font-semibold flex items-center justify-center" style={{ fontSize: 'var(--fs-13)', gap: '6px' }}>
            <FlaskConical style={{ width: 'var(--fs-15)', height: 'var(--fs-15)' }} /> Modo de prueba — estos datos no se guardaron
          </p>
        </div>
      )}

      {/* Confirmation card */}
      <div className="w-full bg-white rounded-2xl shadow-md border border-border/50 text-center animate-fade-up" style={{ padding: '48px 36px', marginBottom: '28px' }}>
        <div className="inline-flex items-center justify-center rounded-full bg-success/10" style={{ width: '56px', height: '56px', marginBottom: '20px' }}>
          <Check className="text-success" style={{ width: '24px', height: '24px' }} />
        </div>
        <h1 className="font-serif text-navy" style={{ fontSize: 'var(--fs-22)', marginBottom: '10px' }}>
          Encuesta completada
        </h1>
        <p className="text-muted leading-relaxed mx-auto" style={{ fontSize: 'var(--fs-13)', maxWidth: '440px' }}>
          {testMode
            ? 'Esta fue una prueba de la Prueba de Tecnología. Los datos no se guardaron.'
            : 'La Prueba de Tecnología ha sido registrada exitosamente. A continuación se muestra un resumen de los resultados.'
          }
        </p>
      </div>

      {/* Summary card */}
      <div className="w-full bg-white rounded-2xl shadow-md border border-border/50 animate-fade-up" style={{ padding: '40px 36px', marginBottom: '28px' }}>
        <h2 className="font-serif text-navy" style={{ fontSize: 'var(--fs-18)', marginBottom: '28px' }}>Resumen</h2>

        {/* Score + Level */}
        <div className="flex items-center justify-center" style={{ gap: '24px', marginBottom: '28px' }}>
          <div className="text-center">
            <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: 'var(--fs-9)', marginBottom: '6px' }}>Score</p>
            <p className="font-bold text-navy" style={{ fontSize: 'var(--fs-42)', lineHeight: 1 }}>{score}</p>
            <p className="text-muted" style={{ fontSize: 'var(--fs-10)' }}>de 100</p>
          </div>
          <div className={`rounded-xl border text-center ${levelCfg.className}`} style={{ padding: '16px 24px' }}>
            <levelCfg.icon className={`mx-auto ${levelCfg.iconClassName}`} style={{ width: '24px', height: '24px' }} />
            <p className="font-bold" style={{ fontSize: 'var(--fs-14)', marginTop: '4px' }}>{levelCfg.label}</p>
          </div>
        </div>

        {/* Company name */}
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '14px' }}>
          <MetricBox label="Empresa" value={companyName || '—'} />
          <MetricBox label="Tiene ERP" value={boolIcon(tools.tieneERP)} highlight={tools.tieneERP} />
          <MetricBox label="Usa IA" value={boolIcon(aiAdoption.usaIAEnEmpresa)} highlight={aiAdoption.usaIAEnEmpresa} />
          <MetricBox label="Nube" value={boolIcon(security.usaNube)} highlight={security.usaNube} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '14px', marginTop: '14px' }}>
          <MetricBox label="KPIs" value={boolIcon(dataAnalytics.tieneKPIs)} highlight={dataAnalytics.tieneKPIs} />
          <MetricBox label="Website" value={boolIcon(digitalPresence.tieneWebsite)} highlight={digitalPresence.tieneWebsite} />
          <MetricBox label="Automatización" value={boolIcon(automation.procesosAutomatizados !== 'ninguno')} highlight={automation.procesosAutomatizados !== 'ninguno'} />
          <MetricBox label="Equipo TI" value={boolIcon(useTechSurveyStore.getState().culture.equipoTI)} highlight={useTechSurveyStore.getState().culture.equipoTI} />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="w-full flex flex-wrap justify-center animate-fade-up-delay" style={{ marginTop: '12px', gap: '14px' }}>
        <button
          onClick={() => setView('tech_wizard')}
          className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer"
          style={{ fontSize: 'var(--fs-13)', padding: '12px 32px', borderRadius: '12px' }}
        >
          ← Editar respuestas
        </button>
        {user?.role === 'master' ? (
          <button
            onClick={handleMasterNav}
            className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
            style={{ fontSize: 'var(--fs-13)', padding: '12px 32px', borderRadius: '12px' }}
          >
            {testMode ? '← Página Principal' : 'Página Principal'}
          </button>
        ) : (
          <button
            onClick={() => setView('dashboard')}
            className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
            style={{ fontSize: 'var(--fs-13)', padding: '12px 32px', borderRadius: '12px' }}
          >
            Ver mis encuestas
          </button>
        )}
      </div>
    </div>
  );
}

function boolIcon(value: boolean): ReactNode {
  return value
    ? <Check className="text-success" style={{ width: 'var(--fs-14)', height: 'var(--fs-14)', display: 'inline' }} />
    : <X className="text-error" style={{ width: 'var(--fs-14)', height: 'var(--fs-14)', display: 'inline' }} />;
}

function MetricBox({ label, value, highlight }: { label: string; value: ReactNode; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border text-center ${highlight ? 'border-accent/30 bg-accent/5' : 'border-border/60 bg-pale'}`}
      style={{ padding: '16px 12px' }}
    >
      <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: 'var(--fs-9)', marginBottom: '6px' }}>{label}</p>
      <p className={`font-bold ${highlight ? 'text-accent' : 'text-ink'}`} style={{ fontSize: 'var(--fs-13)' }}>{value}</p>
    </div>
  );
}
