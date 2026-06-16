import { useDiagnosticStore } from '../store/diagnosticStore';
import { useAuthStore } from '../store/authStore';
import { getCurrentUser } from '../lib/auth';
import type { MarginLevel } from '../lib/types';

const MARGIN_LEVEL_CONFIG: Record<MarginLevel, { label: string; className: string }> = {
  arriba_industria: { label: 'Arriba de industria', className: 'border-success/30 bg-success/5 text-success' },
  en_rango: { label: 'En rango', className: 'border-mid/30 bg-mid/5 text-mid' },
  debajo_industria: { label: 'Debajo de industria', className: 'border-warn/30 bg-warn/5 text-warn' },
  critico: { label: 'Crítico', className: 'border-error/30 bg-error/5 text-error' },
};

export default function ResultPage() {
  const datosGenerales = useDiagnosticStore(s => s.datosGenerales);
  const situacionActual = useDiagnosticStore(s => s.situacionActual);
  const getCompanySize = useDiagnosticStore(s => s.getCompanySize);
  const isFamilyBusiness = useDiagnosticStore(s => s.isFamilyBusiness);
  const getMarginEvaluation = useDiagnosticStore(s => s.getMarginEvaluation);
  const marginData = useDiagnosticStore(s => s.marginData);
  const setView = useDiagnosticStore(s => s.setView);
  const testMode = useDiagnosticStore(s => s.testMode);
  const emailStatus = useDiagnosticStore(s => s.emailStatus);
  const email = getCurrentUser()?.email || datosGenerales.email;

  const sizeResult = getCompanySize();
  const isFamily = isFamilyBusiness();
  const marginEval = getMarginEvaluation();

  return (
    <div style={{ width: '100%', maxWidth: '720px', margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Test mode banner */}
      {testMode && (
        <div className="w-full bg-warn/10 border border-warn/30 rounded-xl text-center" style={{ padding: '14px 20px', marginBottom: '20px' }}>
          <p className="text-warn font-semibold" style={{ fontSize: '13px' }}>🧪 Modo de prueba — estos datos no se guardaron</p>
        </div>
      )}

      {/* Email status */}
      {!testMode && email && emailStatus !== 'idle' && (
        <div className={`w-full rounded-xl border text-center ${
          emailStatus === 'sending' ? 'bg-accent/10 border-accent/30' :
          emailStatus === 'sent' ? 'bg-success/10 border-success/30' :
          'bg-error/10 border-error/30'
        }`} style={{ padding: '14px 20px', marginBottom: '20px' }}>
          <p className={`font-semibold ${
            emailStatus === 'sending' ? 'text-accent' :
            emailStatus === 'sent' ? 'text-success' :
            'text-error'
          }`} style={{ fontSize: '13px' }}>
            {emailStatus === 'sending' && `Enviando reporte a ${email}...`}
            {emailStatus === 'sent' && `Reporte enviado exitosamente a ${email}`}
            {emailStatus === 'error' && `No se pudo enviar el reporte a ${email}`}
          </p>
        </div>
      )}

      {/* Agradecimiento */}
      <div className="w-full bg-white rounded-2xl shadow-md border border-border/50 text-center animate-fade-up" style={{ padding: '48px 36px', marginBottom: '28px' }}>
        <div className="inline-flex items-center justify-center rounded-full bg-success/10" style={{ width: '56px', height: '56px', marginBottom: '20px' }}>
          <span style={{ fontSize: '24px' }}>✓</span>
        </div>
        <h1 className="font-serif text-navy" style={{ fontSize: '22px', marginBottom: '10px' }}>
          Muchas gracias por responder el diagnóstico
        </h1>
        <p className="text-muted leading-relaxed mx-auto" style={{ fontSize: '13px', maxWidth: '440px' }}>
          Sus respuestas han sido registradas exitosamente. A continuación se muestra un resumen de los datos de su empresa.
        </p>
      </div>

      {/* Resumen Ejecutivo — datos de la empresa */}
      <div className="w-full bg-white rounded-2xl shadow-md border border-border/50 animate-fade-up" style={{ padding: '40px 36px', marginBottom: '28px' }}>
        <h2 className="font-serif text-navy" style={{ fontSize: '18px', marginBottom: '28px' }}>Resumen Ejecutivo</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '14px', marginBottom: '14px' }}>
          <MetricBox label="Empresa" value={datosGenerales.nombreComercial || '—'} />
          <MetricBox
            label="Sector"
            value={
              datosGenerales.sector === 'manufactura' ? 'Manufactura' :
              datosGenerales.sector === 'comercio' ? 'Comercio' : 'Servicios'
            }
          />
          <MetricBox label="Tamaño" value={sizeResult?.size ?? '—'} highlight />
          <MetricBox
            label="Productividad per cápita"
            value={sizeResult ? `$${sizeResult.productivityIndex.toFixed(2)} MDP` : '—'}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: '14px' }}>
          <MetricBox label="Empleados" value={situacionActual.empleadosTotales?.toString() ?? '—'} />
          <MetricBox
            label="Ventas Anuales"
            value={situacionActual.ventasAnualesMDP ? `$${situacionActual.ventasAnualesMDP} MDP` : '—'}
          />
          <MetricBox label="Empresa Familiar" value={isFamily ? 'Sí' : 'No'} />
        </div>
      </div>

      {/* Márgenes Financieros */}
      {marginData.tieneDatosFinancieros && marginEval && (
        <div className="w-full bg-white rounded-2xl shadow-md border border-border/50 animate-fade-up" style={{ padding: '40px 36px', marginBottom: '28px' }}>
          <h2 className="font-serif text-navy" style={{ fontSize: '18px', marginBottom: '28px' }}>Márgenes Financieros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '14px' }}>
            {([
              { key: 'margenBruto' as const, label: 'Margen Bruto' },
              { key: 'margenOperativo' as const, label: 'Margen Operativo' },
              { key: 'margenNeto' as const, label: 'Margen Neto' },
            ]).map(m => {
              const ev = marginEval[m.key];
              if (ev.value === null) return null;
              const cfg = MARGIN_LEVEL_CONFIG[ev.level];
              return (
                <div key={m.key} className={`rounded-xl border text-center ${cfg.className}`} style={{ padding: '20px 14px' }}>
                  <p className="font-medium uppercase tracking-wide opacity-70" style={{ fontSize: '9px', marginBottom: '6px' }}>{m.label}</p>
                  <p className="font-bold" style={{ fontSize: '20px' }}>{ev.value}%</p>
                  <p className="font-semibold" style={{ fontSize: '11px', marginTop: '6px' }}>{cfg.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="w-full flex flex-wrap justify-center animate-fade-up-delay" style={{ marginTop: '12px', gap: '14px' }}>
        <button
          onClick={() => setView('wizard')}
          className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer"
          style={{ fontSize: '13px', padding: '12px 32px', borderRadius: '12px' }}
        >
          ← Editar respuestas
        </button>
        <ResultNavButton />
      </div>
    </div>
  );
}

function ResultNavButton() {
  const user = useAuthStore(s => s.user);
  const setView = useDiagnosticStore(s => s.setView);
  const testMode = useDiagnosticStore(s => s.testMode);
  const setTestMode = useDiagnosticStore(s => s.setTestMode);

  if (user?.role === 'master') {
    return (
      <button
        onClick={() => { setTestMode(false); setView('home'); }}
        className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
        style={{ fontSize: '13px', padding: '12px 32px', borderRadius: '12px' }}
      >
        {testMode ? '← Página Principal' : 'Página Principal'}
      </button>
    );
  }

  return (
    <button
      onClick={() => setView('dashboard')}
      className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
      style={{ fontSize: '13px', padding: '12px 32px', borderRadius: '12px' }}
    >
      Ver mis encuestas
    </button>
  );
}

function MetricBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border text-center ${highlight ? 'border-accent/30 bg-accent/5' : 'border-border/60 bg-pale'}`}
      style={{ padding: '16px 12px' }}
    >
      <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: '9px', marginBottom: '6px' }}>{label}</p>
      <p className={`font-bold ${highlight ? 'text-accent' : 'text-ink'}`} style={{ fontSize: '13px' }}>{value}</p>
    </div>
  );
}
