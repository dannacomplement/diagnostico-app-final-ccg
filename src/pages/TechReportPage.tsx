import { useTechSurveyStore } from '../store/techSurveyStore';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { exportTechSurveyToPdf } from '../lib/exportTechPdf';
import { AREA_STATEMENTS, GENERAL_STATEMENTS, TECH_AREAS, GENERAL_AREA_LABEL, MATURITY_LEVELS, computeMaturityPercentage } from '../config/techQuestions';
import type { SavedTechSurvey, TechMaturityScore } from '../lib/types';

function getBarColor(score: number): string {
  if (score <= 25) return 'bg-error';
  if (score <= 50) return 'bg-warn';
  if (score <= 75) return 'bg-success';
  return 'bg-accent';
}

function levelLabel(score: TechMaturityScore | undefined): string {
  if (score === undefined) return '—';
  return MATURITY_LEVELS.find(l => l.score === score)?.label ?? '—';
}

export default function TechReportPage() {
  const companyName = useTechSurveyStore(s => s.companyName);
  const respondentArea = useTechSurveyStore(s => s.respondentArea);
  const rolCargo = useTechSurveyStore(s => s.rolCargo);
  const sistemasPrincipales = useTechSurveyStore(s => s.sistemasPrincipales);
  const areaAnswersMap = useTechSurveyStore(s => s.areaAnswers);
  const generalAnswersMap = useTechSurveyStore(s => s.generalAnswers);
  const setView = useDiagnosticStore(s => s.setView);
  const user = useAuthStore(s => s.user);
  const companyLogo = useSettingsStore(s => s.companyLogo);

  const areaConfig = TECH_AREAS.find(a => a.id === respondentArea);
  const areaStatements = respondentArea ? AREA_STATEMENTS[respondentArea] : [];
  const areaAnswers = areaStatements.filter(st => areaAnswersMap[st.id] !== undefined).map(st => ({ id: st.id, score: areaAnswersMap[st.id] }));
  const generalAnswers = GENERAL_STATEMENTS.filter(st => generalAnswersMap[st.id] !== undefined).map(st => ({ id: st.id, score: generalAnswersMap[st.id] }));
  const areaScore = computeMaturityPercentage(areaAnswers);
  const generalScore = computeMaturityPercentage(generalAnswers);

  function handleDownloadPdf() {
    const survey: SavedTechSurvey = {
      id: 'report-preview',
      savedAt: new Date().toISOString(),
      companyName,
      respondentArea: respondentArea ?? 'comercial',
      rolCargo,
      sistemasPrincipales,
      areaAnswers,
      generalAnswers,
      areaScore,
      generalScore,
    };
    exportTechSurveyToPdf(survey);
  }

  function handleBack() {
    if (user?.role === 'master') {
      setView('history');
    } else {
      setView('dashboard');
    }
  }

  const oportunidades = [...areaStatements, ...GENERAL_STATEMENTS]
    .filter(st => (areaAnswersMap[st.id] ?? generalAnswersMap[st.id]) !== undefined && (areaAnswersMap[st.id] ?? generalAnswersMap[st.id])! <= 2)
    .map(st => st.text);

  let sectionNum = 0;
  const nextNum = () => String(++sectionNum).padStart(2, '0');

  return (
    <div style={{ width: '100%', maxWidth: '930px', margin: '0 auto', padding: 'var(--sp-pagepad)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      <div className="text-center animate-fade-up" style={{ marginBottom: '36px' }}>
        <h1 className="font-serif text-navy" style={{ fontSize: 'var(--fs-22)', marginBottom: '6px' }}>Reporte — Prueba de Tecnología</h1>
        <p className="text-muted" style={{ fontSize: 'var(--fs-12)' }}>
          {companyName || 'Empresa'} — {areaConfig?.name} ({rolCargo || 'sin rol'})
        </p>
      </div>

      <Section title="Resumen" number={nextNum()}>
        <div className="grid grid-cols-2" style={{ gap: '16px', marginBottom: '20px' }}>
          <div className="rounded-xl border border-accent/30 bg-accent/5 text-center" style={{ padding: '20px 16px' }}>
            <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: 'var(--fs-9)', marginBottom: '8px' }}>{areaConfig?.name ?? 'Área'}</p>
            <p className="font-bold text-accent" style={{ fontSize: 'var(--fs-32)', lineHeight: 1 }}>{areaScore}%</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-pale text-center" style={{ padding: '20px 16px' }}>
            <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: 'var(--fs-9)', marginBottom: '8px' }}>{GENERAL_AREA_LABEL}</p>
            <p className="font-bold text-ink" style={{ fontSize: 'var(--fs-32)', lineHeight: 1 }}>{generalScore}%</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: '14px' }}>
          <MetricBox label="Empresa" value={companyName || '—'} />
          <MetricBox label="Rol / Cargo" value={rolCargo || '—'} />
          <MetricBox label="Sistemas usados" value={sistemasPrincipales || '—'} />
        </div>
      </Section>

      <Section title={`Afirmaciones — ${areaConfig?.name ?? 'Área'}`} number={nextNum()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {areaStatements.map(st => {
            const score = areaAnswersMap[st.id];
            const pct = score ? Math.round((score / 5) * 100) : 0;
            return (
              <div key={st.id} className="rounded-lg bg-pale" style={{ padding: 'var(--sp-btn-a)' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '6px', gap: '12px' }}>
                  <span className="text-ink" style={{ fontSize: 'var(--fs-12)' }}>{st.text}</span>
                  <span className="font-bold text-ink shrink-0" style={{ fontSize: 'var(--fs-12)' }}>{levelLabel(score)}</span>
                </div>
                <div className="w-full rounded-full bg-border/40" style={{ height: '6px' }}>
                  <div className={`rounded-full ${getBarColor(pct)}`} style={{ width: `${pct}%`, height: '6px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title={`Afirmaciones — ${GENERAL_AREA_LABEL}`} number={nextNum()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {GENERAL_STATEMENTS.map(st => {
            const score = generalAnswersMap[st.id];
            const pct = score ? Math.round((score / 5) * 100) : 0;
            return (
              <div key={st.id} className="rounded-lg bg-pale" style={{ padding: 'var(--sp-btn-a)' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '6px', gap: '12px' }}>
                  <span className="text-ink" style={{ fontSize: 'var(--fs-12)' }}>{st.text}</span>
                  <span className="font-bold text-ink shrink-0" style={{ fontSize: 'var(--fs-12)' }}>{levelLabel(score)}</span>
                </div>
                <div className="w-full rounded-full bg-border/40" style={{ height: '6px' }}>
                  <div className={`rounded-full ${getBarColor(pct)}`} style={{ width: `${pct}%`, height: '6px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {oportunidades.length > 0 && (
        <Section title="Áreas de oportunidad" number={nextNum()}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {oportunidades.map((text, i) => (
              <div key={i} className="flex items-start rounded-lg bg-error/5 border-l-4 border-l-error" style={{ padding: 'var(--sp-btn-c)', gap: '8px' }}>
                <span className="text-ink" style={{ fontSize: 'var(--fs-12)' }}>{text}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="w-full bg-navy rounded-2xl text-center" style={{ padding: 'var(--sp-footer)', marginTop: '4px' }}>
        <img
          src={companyLogo || '/logo-complement.png'}
          alt="Complement"
          className="mx-auto object-contain"
          style={{ height: 'var(--sz-logo-footer-sm)', marginBottom: '10px' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <h3 className="font-serif text-white" style={{ fontSize: 'var(--fs-13)', marginBottom: '4px' }}>COMPLEMENT Consulting Group</h3>
        <p className="text-white/60 mx-auto" style={{ fontSize: 'var(--fs-10)', marginBottom: '20px', maxWidth: '400px' }}>
          Reporte generado automáticamente. Contacte a nuestro equipo para profundizar.
        </p>
        <div className="flex justify-center flex-wrap" style={{ gap: '10px' }}>
          <button
            onClick={handleDownloadPdf}
            className="bg-white text-navy font-semibold hover:bg-white/90 transition-all cursor-pointer"
            style={{ fontSize: 'var(--fs-12)', padding: 'var(--sp-btn-pill-sm)', borderRadius: '10px' }}
          >
            PDF
          </button>
          <button
            onClick={handleBack}
            className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer"
            style={{ fontSize: 'var(--fs-12)', padding: 'var(--sp-btn-pill-sm)', borderRadius: '10px' }}
          >
            {user?.role === 'master' ? 'Expedientes' : 'Mis Encuestas'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, number, children }: { title: string; number: string; children: React.ReactNode }) {
  return (
    <div className="w-full bg-white rounded-2xl shadow-md border border-border/50 animate-fade-up" style={{ padding: '36px 32px', marginBottom: '24px' }}>
      <div className="flex items-center border-b border-border/30" style={{ gap: '12px', marginBottom: '28px', paddingBottom: '16px' }}>
        <span className="font-bold text-mid bg-mid/10 rounded-full flex items-center justify-center" style={{ fontSize: 'var(--fs-11)', width: '32px', height: '32px' }}>{number}</span>
        <h2 className="font-serif text-navy" style={{ fontSize: 'var(--fs-16)' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl text-center bg-pale border border-border/30" style={{ padding: '18px 12px' }}>
      <p className="text-muted font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-9)', marginBottom: '6px' }}>{label}</p>
      <p className="font-semibold text-ink" style={{ fontSize: 'var(--fs-13)' }}>{value}</p>
    </div>
  );
}
