import { Check, FlaskConical } from 'lucide-react';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { useTechSurveyStore } from '../store/techSurveyStore';
import { useAuthStore } from '../store/authStore';
import { AREA_STATEMENTS, GENERAL_STATEMENTS, TECH_AREAS, GENERAL_AREA_LABEL, computeMaturityPercentage } from '../config/techQuestions';

export default function TechResultPage() {
  const setView = useDiagnosticStore(s => s.setView);
  const companyName = useTechSurveyStore(s => s.companyName);
  const respondentArea = useTechSurveyStore(s => s.respondentArea);
  const rolCargo = useTechSurveyStore(s => s.rolCargo);
  const areaAnswersMap = useTechSurveyStore(s => s.areaAnswers);
  const generalAnswersMap = useTechSurveyStore(s => s.generalAnswers);
  const testMode = useTechSurveyStore(s => s.testMode);
  const setTechTestMode = useTechSurveyStore(s => s.setTestMode);
  const user = useAuthStore(s => s.user);

  const areaConfig = TECH_AREAS.find(a => a.id === respondentArea);
  const areaStatements = respondentArea ? AREA_STATEMENTS[respondentArea] : [];
  const areaAnswers = areaStatements.filter(st => areaAnswersMap[st.id] !== undefined).map(st => ({ id: st.id, score: areaAnswersMap[st.id] }));
  const generalAnswers = GENERAL_STATEMENTS.filter(st => generalAnswersMap[st.id] !== undefined).map(st => ({ id: st.id, score: generalAnswersMap[st.id] }));

  const areaScore = computeMaturityPercentage(areaAnswers);
  const generalScore = computeMaturityPercentage(generalAnswers);

  function handleMasterNav() {
    setTechTestMode(false);
    setView('home');
  }

  return (
    <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', padding: 'var(--sp-pagepad)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {testMode && (
        <div className="w-full bg-warn/10 border border-warn/30 rounded-xl text-center" style={{ padding: '14px 20px', marginBottom: '20px' }}>
          <p className="text-warn font-semibold flex items-center justify-center" style={{ fontSize: 'var(--fs-13)', gap: '6px' }}>
            <FlaskConical style={{ width: 'var(--fs-15)', height: 'var(--fs-15)' }} /> Modo de prueba — estos datos no se guardaron
          </p>
        </div>
      )}

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
            : 'Gracias por completar el diagnóstico de madurez digital de tu área.'
          }
        </p>
      </div>

      <div className="w-full bg-white rounded-2xl shadow-md border border-border/50 animate-fade-up" style={{ padding: '40px 36px', marginBottom: '28px' }}>
        <h2 className="font-serif text-navy" style={{ fontSize: 'var(--fs-18)', marginBottom: '4px' }}>{companyName || 'Empresa'}</h2>
        <p className="text-muted" style={{ fontSize: 'var(--fs-12)', marginBottom: '28px' }}>{areaConfig?.name} · {rolCargo || 'Sin rol especificado'}</p>

        <div className="grid grid-cols-2" style={{ gap: '16px' }}>
          <div className="rounded-xl border border-accent/30 bg-accent/5 text-center" style={{ padding: '20px 16px' }}>
            <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: 'var(--fs-9)', marginBottom: '8px' }}>{areaConfig?.name ?? 'Tu área'}</p>
            <p className="font-bold text-accent" style={{ fontSize: 'var(--fs-32)', lineHeight: 1 }}>{areaScore}%</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-pale text-center" style={{ padding: '20px 16px' }}>
            <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: 'var(--fs-9)', marginBottom: '8px' }}>{GENERAL_AREA_LABEL}</p>
            <p className="font-bold text-ink" style={{ fontSize: 'var(--fs-32)', lineHeight: 1 }}>{generalScore}%</p>
          </div>
        </div>
      </div>

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
