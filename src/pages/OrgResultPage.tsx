import { Check, FlaskConical } from 'lucide-react';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { useOrgSurveyStore } from '../store/orgSurveyStore';
import { useAuthStore } from '../store/authStore';

export default function OrgResultPage() {
  const setView = useDiagnosticStore(s => s.setView);
  const companyName = useOrgSurveyStore(s => s.companyName);
  const orgStructure = useOrgSurveyStore(s => s.orgStructure);
  const getTotalColaboradores = useOrgSurveyStore(s => s.getTotalColaboradores);
  const getTotalNomina = useOrgSurveyStore(s => s.getTotalNomina);
  const areaDetails = useOrgSurveyStore(s => s.areaDetails);
  const testMode = useOrgSurveyStore(s => s.testMode);
  const setOrgTestMode = useOrgSurveyStore(s => s.setTestMode);
  const user = useAuthStore(s => s.user);

  const totalColab = getTotalColaboradores();
  const totalNomina = getTotalNomina();
  const areasConLider = areaDetails.filter(a => a.tieneLider).length;

  function handleMasterNav() {
    setOrgTestMode(false);
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

      {/* Agradecimiento */}
      <div className="w-full bg-white rounded-2xl shadow-md border border-border/50 text-center animate-fade-up" style={{ padding: '48px 36px', marginBottom: '28px' }}>
        <div className="inline-flex items-center justify-center rounded-full bg-success/10" style={{ width: '56px', height: '56px', marginBottom: '20px' }}>
          <Check className="text-success" style={{ width: '24px', height: '24px' }} />
        </div>
        <h1 className="font-serif text-navy" style={{ fontSize: 'var(--fs-22)', marginBottom: '10px' }}>
          Encuesta completada
        </h1>
        <p className="text-muted leading-relaxed mx-auto" style={{ fontSize: 'var(--fs-13)', maxWidth: '440px' }}>
          {testMode
            ? 'Esta fue una prueba de la encuesta de Estructura Organizacional. Los datos no se guardaron.'
            : 'La encuesta de Estructura Organizacional ha sido registrada exitosamente. A continuación se muestra un resumen de los datos capturados.'
          }
        </p>
      </div>

      {/* Resumen */}
      <div className="w-full bg-white rounded-2xl shadow-md border border-border/50 animate-fade-up" style={{ padding: '40px 36px', marginBottom: '28px' }}>
        <h2 className="font-serif text-navy" style={{ fontSize: 'var(--fs-18)', marginBottom: '28px' }}>Resumen</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: '14px', marginBottom: '14px' }}>
          <MetricBox label="Empresa" value={companyName || '—'} />
          <MetricBox
            label="Organigrama"
            value={orgStructure.tieneOrganigrama ? 'Sí' : 'No'}
            highlight={orgStructure.tieneOrganigrama}
          />
          <MetricBox
            label="Descripciones de puesto"
            value={orgStructure.descripcionesPuesto === 'todas' ? 'Todas' : orgStructure.descripcionesPuesto === 'algunas' ? 'Algunas' : 'Ninguna'}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '14px' }}>
          <MetricBox label="Total Colaboradores" value={totalColab.toString()} highlight />
          <MetricBox label="Nómina Mensual" value={`$${totalNomina.toLocaleString('es-MX')}`} />
          <MetricBox label="Áreas con Líder" value={`${areasConLider} de ${areaDetails.length}`} />
          <MetricBox
            label="Tabulador"
            value={orgStructure.tieneTabulador ? 'Sí' : 'No'}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="w-full flex flex-wrap justify-center animate-fade-up-delay" style={{ marginTop: '12px', gap: '14px' }}>
        <button
          onClick={() => setView('org_wizard')}
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

function MetricBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
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
