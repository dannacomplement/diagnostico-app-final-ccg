import { Circle, Gem } from 'lucide-react';
import { useTechSurveyStore } from '../store/techSurveyStore';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { exportTechSurveyToPdf } from '../lib/exportTechPdf';
import { computeTechMaturityScore, TECH_AREAS } from '../config/techQuestions';
import type { SavedTechSurvey, TechMaturityLevel } from '../lib/types';

const LEVEL_CONFIG: Record<TechMaturityLevel, { label: string; icon: typeof Circle; iconClassName: string; className: string; barClass: string }> = {
  basico: { label: 'Básico', icon: Circle, iconClassName: 'fill-error text-error', className: 'bg-error/10 border-error/20 text-error', barClass: 'bg-error' },
  intermedio: { label: 'Intermedio', icon: Circle, iconClassName: 'fill-warn text-warn', className: 'bg-warn/10 border-warn/20 text-warn', barClass: 'bg-warn' },
  avanzado: { label: 'Avanzado', icon: Circle, iconClassName: 'fill-success text-success', className: 'bg-success/10 border-success/20 text-success', barClass: 'bg-success' },
  lider_digital: { label: 'Líder Digital', icon: Gem, iconClassName: 'text-accent', className: 'bg-accent/10 border-accent/20 text-accent', barClass: 'bg-accent' },
};

function getBarColor(score: number): string {
  if (score <= 25) return 'bg-error';
  if (score <= 50) return 'bg-warn';
  if (score <= 75) return 'bg-success';
  return 'bg-accent';
}

export default function TechReportPage() {
  const companyName = useTechSurveyStore(s => s.companyName);
  const tools = useTechSurveyStore(s => s.tools);
  const digitalPresence = useTechSurveyStore(s => s.digitalPresence);
  const automation = useTechSurveyStore(s => s.automation);
  const dataAnalytics = useTechSurveyStore(s => s.dataAnalytics);
  const aiAdoption = useTechSurveyStore(s => s.aiAdoption);
  const security = useTechSurveyStore(s => s.security);
  const culture = useTechSurveyStore(s => s.culture);
  const setView = useDiagnosticStore(s => s.setView);
  const user = useAuthStore(s => s.user);
  const companyLogo = useSettingsStore(s => s.companyLogo);

  const { score, level, areaScores } = computeTechMaturityScore({
    tools, digitalPresence, automation, dataAnalytics, aiAdoption, security, culture,
  });

  const levelCfg = LEVEL_CONFIG[level];

  function handleDownloadPdf() {
    const survey: SavedTechSurvey = {
      id: 'report-preview',
      savedAt: new Date().toISOString(),
      companyName,
      tools: { ...tools },
      digitalPresence: { ...digitalPresence },
      automation: { ...automation },
      dataAnalytics: { ...dataAnalytics },
      aiAdoption: { ...aiAdoption },
      security: { ...security },
      culture: { ...culture },
      maturityScore: score,
      maturityLevel: level,
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

  // Key findings
  const findings: string[] = [];
  if (tools.tieneERP) findings.push('Cuenta con sistema ERP' + (tools.erpNombre ? ` (${tools.erpNombre})` : ''));
  else findings.push('No cuenta con sistema ERP');
  if (tools.tieneCRM) findings.push('Cuenta con CRM' + (tools.crmNombre ? ` (${tools.crmNombre})` : ''));
  if (digitalPresence.tieneWebsite) findings.push('Tiene presencia web' + (digitalPresence.tieneEcommerce ? ' con e-commerce' : ''));
  else findings.push('No tiene sitio web');
  if (aiAdoption.usaIAEnEmpresa) findings.push('Ya utiliza IA en la operación');
  else if (aiAdoption.conoceIA) findings.push('Conoce la IA pero aún no la implementa');
  else findings.push('No ha explorado la IA');
  if (security.usaNube) findings.push('Opera en la nube' + (security.proveedorNube ? ` (${security.proveedorNube})` : ''));
  if (dataAnalytics.tieneKPIs) findings.push('Mide KPIs de desempeño');
  if (culture.equipoTI) findings.push(`Tiene equipo de TI${culture.equipoTISize ? ` (${culture.equipoTISize} personas)` : ''}`);

  // Recommendations based on weak areas
  const recommendations: { priority: 'alta' | 'media' | 'baja'; text: string }[] = [];
  if (areaScores.tools <= 30) recommendations.push({ priority: 'alta', text: 'Implementar un sistema ERP/CRM para profesionalizar la gestión empresarial.' });
  if (areaScores.digital_presence <= 30) recommendations.push({ priority: 'alta', text: 'Desarrollar presencia digital con sitio web actualizado y estrategia de redes sociales.' });
  if (areaScores.automation <= 30) recommendations.push({ priority: 'alta', text: 'Automatizar procesos clave como facturación electrónica y gestión documental.' });
  else if (areaScores.automation <= 60) recommendations.push({ priority: 'media', text: 'Ampliar la automatización a más áreas de la operación.' });
  if (areaScores.data_analytics <= 30) recommendations.push({ priority: 'alta', text: 'Establecer KPIs y dashboards para toma de decisiones basada en datos.' });
  else if (areaScores.data_analytics <= 60) recommendations.push({ priority: 'media', text: 'Implementar herramientas de Business Intelligence para análisis avanzado.' });
  if (areaScores.ai <= 30) recommendations.push({ priority: 'media', text: 'Explorar casos de uso de IA como chatbots, generación de contenido y análisis predictivo.' });
  if (areaScores.security <= 40) recommendations.push({ priority: 'alta', text: 'Fortalecer la ciberseguridad: antivirus, respaldos automáticos y políticas formales.' });
  else if (areaScores.security <= 70) recommendations.push({ priority: 'media', text: 'Completar la estrategia de seguridad con capacitación al personal y migración a la nube.' });
  if (areaScores.culture <= 30) recommendations.push({ priority: 'alta', text: 'Invertir en cultura digital: capacitación tecnológica, equipo de TI y presupuesto asignado.' });
  else if (areaScores.culture <= 60) recommendations.push({ priority: 'media', text: 'Reducir resistencia al cambio con programas de capacitación continua.' });
  if (score >= 75) recommendations.push({ priority: 'baja', text: 'El nivel tecnológico es avanzado. Continuar con innovación y adopción de tecnologías emergentes.' });

  let sectionNum = 0;
  const nextNum = () => String(++sectionNum).padStart(2, '0');

  return (
    <div style={{ width: '100%', maxWidth: '930px', margin: '0 auto', padding: 'var(--sp-pagepad)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Header */}
      <div className="text-center animate-fade-up" style={{ marginBottom: '36px' }}>
        <h1 className="font-serif text-navy" style={{ fontSize: 'var(--fs-22)', marginBottom: '6px' }}>Reporte — Prueba de Tecnología</h1>
        <p className="text-muted" style={{ fontSize: 'var(--fs-12)' }}>
          {companyName || 'Empresa'} — {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Resumen Ejecutivo */}
      <Section title="Resumen Ejecutivo" number={nextNum()}>
        <div className="flex items-center justify-center" style={{ gap: '24px', marginBottom: '24px' }}>
          <div className="text-center">
            <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: 'var(--fs-9)', marginBottom: '6px' }}>Madurez Tecnológica</p>
            <p className="font-bold text-navy" style={{ fontSize: 'var(--fs-42)', lineHeight: 1 }}>{score}</p>
            <p className="text-muted" style={{ fontSize: 'var(--fs-10)' }}>de 100</p>
          </div>
          <div className={`rounded-xl border text-center ${levelCfg.className}`} style={{ padding: '16px 24px' }}>
            <levelCfg.icon className={`mx-auto ${levelCfg.iconClassName}`} style={{ width: '24px', height: '24px' }} />
            <p className="font-bold" style={{ fontSize: 'var(--fs-14)', marginTop: '4px' }}>{levelCfg.label}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '14px' }}>
          <MetricBox label="Empresa" value={companyName || '—'} />
          <MetricBox label="Score General" value={`${score}/100`} highlight />
          <MetricBox label="Nivel" value={levelCfg.label} />
          <MetricBox label="Áreas Evaluadas" value="7" />
        </div>
      </Section>

      {/* Score por Area */}
      <Section title="Desglose por Área" number={nextNum()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {TECH_AREAS.map(area => {
            const areaScore = areaScores[area.id] ?? 0;
            const barColor = getBarColor(areaScore);
            return (
              <div key={area.id} className="rounded-lg bg-pale" style={{ padding: 'var(--sp-btn-a)' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                  <span className="text-ink font-medium" style={{ fontSize: 'var(--fs-12)' }}>
                    <area.icon style={{ display: 'inline', width: 'var(--fs-14)', height: 'var(--fs-14)', marginRight: '6px', verticalAlign: '-2px' }} />
                    {area.name}
                    <span className="text-muted" style={{ fontSize: 'var(--fs-10)', marginLeft: '6px' }}>({area.weight}%)</span>
                  </span>
                  <span className="font-bold text-ink" style={{ fontSize: 'var(--fs-13)' }}>{areaScore}/100</span>
                </div>
                <div className="w-full rounded-full bg-border/40" style={{ height: '8px' }}>
                  <div
                    className={`rounded-full ${barColor} transition-all`}
                    style={{ width: `${areaScore}%`, height: '8px' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Hallazgos Clave */}
      <Section title="Hallazgos Clave" number={nextNum()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {findings.map((finding, i) => (
            <div key={i} className="flex items-start rounded-lg bg-pale" style={{ padding: 'var(--sp-btn-c)', gap: '8px' }}>
              <span className="text-mid font-bold shrink-0" style={{ fontSize: 'var(--fs-11)' }}>•</span>
              <span className="text-ink" style={{ fontSize: 'var(--fs-12)' }}>{finding}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Recomendaciones */}
      <Section title="Recomendaciones" number={nextNum()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recommendations.map((rec, i) => (
            <Recommendation key={i} priority={rec.priority} text={rec.text} />
          ))}
        </div>
      </Section>

      {/* Footer */}
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

/* ── Section ──────────────────────────────────────────── */

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

/* ── MetricBox ────────────────────────────────────────── */

function MetricBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl text-center ${highlight ? 'bg-mid/10 border border-mid/20' : 'bg-pale border border-border/30'}`} style={{ padding: '18px 12px' }}>
      <p className="text-muted font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-9)', marginBottom: '6px' }}>{label}</p>
      <p className={`font-semibold ${highlight ? 'text-mid' : 'text-ink'}`} style={{ fontSize: 'var(--fs-13)' }}>{value}</p>
    </div>
  );
}

/* ── Recommendation ───────────────────────────────────── */

function Recommendation({ priority, text }: { priority: 'alta' | 'media' | 'baja'; text: string }) {
  return (
    <div className={`rounded-xl border-l-4
      ${priority === 'alta' ? 'border-l-error bg-error/5' :
        priority === 'media' ? 'border-l-warn bg-warn/5' :
        'border-l-mid bg-mid/5'}
    `} style={{ padding: 'var(--sp-btn-a)' }}>
      <div className="flex items-start" style={{ gap: '8px' }}>
        <span className={`font-semibold rounded-full shrink-0
          ${priority === 'alta' ? 'bg-error/15 text-error' :
            priority === 'media' ? 'bg-warn/15 text-warn' :
            'bg-mid/15 text-mid'}
        `} style={{ fontSize: 'var(--fs-10)', padding: '2px 8px' }}>
          {priority === 'alta' ? 'Alta' : priority === 'media' ? 'Media' : 'Baja'}
        </span>
        <p className="text-ink" style={{ fontSize: 'var(--fs-11)' }}>{text}</p>
      </div>
    </div>
  );
}
