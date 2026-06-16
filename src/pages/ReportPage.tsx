import { useMemo } from 'react';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { ALL_CRITERIA } from '../config/questions';
import { DEFAULT_INDUSTRY_BENCHMARKS } from '../config/constants';
import { exportToPdf } from '../lib/exportPdf';
import { buildSoftwareLabel } from '../lib/formatters';
import { computeMaturityIndex, computeRiskProfile, generateDiagnosticNarrative, generateGrowthReadiness, generateSmartRecommendations } from '../lib/diagnosticAnalysis';
import type { ScoreLevel, MarginLevel, SavedDiagnostic, Sector } from '../lib/types';

const LEVEL_COLORS: Record<ScoreLevel, string> = {
  Bajo: 'bg-error/15 text-error border-error/20',
  Medio: 'bg-warn/15 text-warn border-warn/20',
  Alto: 'bg-success/15 text-success border-success/20',
  Avanzado: 'bg-success/15 text-success border-success/20',
};

const MATURITY_COLOR: Record<string, string> = {
  'Muy Bajo': 'text-error',
  'Bajo': 'text-warn',
  'Medio': 'text-mid',
  'Alto': 'text-success',
};

const MATURITY_BG: Record<string, string> = {
  'Muy Bajo': 'bg-error/15 border-error/20',
  'Bajo': 'bg-warn/15 border-warn/20',
  'Medio': 'bg-mid/15 border-mid/20',
  'Alto': 'bg-success/15 border-success/20',
};

const SEVERITY_STYLES: Record<string, string> = {
  critico: 'bg-error/10 border-l-error',
  alto: 'bg-warn/10 border-l-warn',
  moderado: 'bg-mid/10 border-l-mid',
};

const SEVERITY_BADGE: Record<string, string> = {
  critico: 'bg-error text-white',
  alto: 'bg-warn text-white',
  moderado: 'bg-mid text-white',
};

export default function ReportPage() {
  const datosGenerales = useDiagnosticStore(s => s.datosGenerales);
  const situacionActual = useDiagnosticStore(s => s.situacionActual);
  const descripcionNegocio = useDiagnosticStore(s => s.descripcionNegocio);
  const gerencias = useDiagnosticStore(s => s.gerencias);
  const retos = useDiagnosticStore(s => s.retos);
  const urgencia = useDiagnosticStore(s => s.urgencia);
  const analisisFamiliar = useDiagnosticStore(s => s.analisisFamiliar);
  const isFamilyBusiness = useDiagnosticStore(s => s.isFamilyBusiness);
  const getCompanySize = useDiagnosticStore(s => s.getCompanySize);
  const getProfScore = useDiagnosticStore(s => s.getProfScore);
  const getInstScore = useDiagnosticStore(s => s.getInstScore);
  const getOpportunityAreas = useDiagnosticStore(s => s.getOpportunityAreas);
  const getUrgencyLevel = useDiagnosticStore(s => s.getUrgencyLevel);
  const getMarginEvaluation = useDiagnosticStore(s => s.getMarginEvaluation);
  const marginData = useDiagnosticStore(s => s.marginData);
  const setView = useDiagnosticStore(s => s.setView);
  const user = useAuthStore(s => s.user);
  const companyLogo = useSettingsStore(s => s.companyLogo);

  const isFamily = isFamilyBusiness();
  const sizeResult = getCompanySize();
  const profScore = getProfScore();
  const instScore = getInstScore();
  const opportunityAreas = getOpportunityAreas();
  const urgencyLevel = getUrgencyLevel();
  const marginEval = getMarginEvaluation();

  // Build a SavedDiagnostic shape for analysis engine
  const diagnostic: SavedDiagnostic = useMemo(() => ({
    id: 'report-preview',
    savedAt: new Date().toISOString(),
    datosGenerales: { ...datosGenerales },
    situacionActual: { ...situacionActual },
    companySize: sizeResult ?? { size: 'Micro' as const, tmcScore: 0, productivityIndex: 0 },
    profesionalizacion: profScore,
    institucionalizacion: instScore,
    opportunityAreas,
    gerencias: [...gerencias],
    descripcionNegocio,
    retos: [...retos],
    urgenciaSelection: urgencia ?? 'deseable',
    urgenciaLevel: urgencyLevel ?? 'Baja',
    analisisFamiliar: isFamily ? { ...analisisFamiliar } : null,
    marginData: marginData.tieneDatosFinancieros ? { ...marginData } : undefined,
    marginEvaluation: marginEval ?? undefined,
  }), [datosGenerales, situacionActual, sizeResult, profScore, instScore, opportunityAreas, gerencias, descripcionNegocio, retos, urgencia, urgencyLevel, isFamily, analisisFamiliar, marginData, marginEval]);

  // Computed analysis
  const maturity = useMemo(() => computeMaturityIndex(diagnostic), [diagnostic]);
  const risks = useMemo(() => computeRiskProfile(diagnostic), [diagnostic]);
  const narrative = useMemo(() => generateDiagnosticNarrative(diagnostic, maturity), [diagnostic, maturity]);
  const growth = useMemo(() => generateGrowthReadiness(diagnostic), [diagnostic]);
  const smartRecs = useMemo(() => generateSmartRecommendations(diagnostic, maturity, risks), [diagnostic, maturity, risks]);

  function handleDownloadPdf() {
    exportToPdf(diagnostic);
  }

  const gerenciasCubiertas = gerencias.filter(g => g.cubierto).length;

  const ratingLabel = (r: number) => r <= 0 ? 'Bajo' : r <= 5 ? 'Medio' : 'Alto';
  const ratingColor = (r: number) => r <= 3 ? 'text-error' : r <= 6 ? 'text-warn' : 'text-success';
  const ratingBg = (r: number) => r <= 3 ? 'bg-error' : r <= 6 ? 'bg-warn' : 'bg-success';

  const sectorLabel = datosGenerales.sector === 'manufactura' ? 'Manufactura' : datosGenerales.sector === 'comercio' ? 'Comercio' : 'Servicios';
  const bench = DEFAULT_INDUSTRY_BENCHMARKS[datosGenerales.sector as Sector];
  const familiarLabel = datosGenerales.empresaFamiliar === 'no' ? 'No'
    : datosGenerales.empresaFamiliar === 'si_1era' ? 'Si, 1a gen.'
    : datosGenerales.empresaFamiliar === 'si_2da' ? 'Si, 2a gen.'
    : 'Si, 3a gen.';
  const softwareLabel = buildSoftwareLabel(datosGenerales);

  let sectionNum = 0;
  const nextNum = () => String(++sectionNum).padStart(2, '0');

  return (
    <div style={{ width: '100%', maxWidth: '760px', margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* ═══ Branded Header ═══ */}
      <div className="w-full bg-white rounded-2xl shadow-md border border-border/50 animate-fade-up" style={{ padding: '32px 32px 28px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        {/* Orange accent bar at top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#d4922e' }} />

        <div className="flex flex-col sm:flex-row items-center" style={{ gap: '20px' }}>
          {/* Complement Logo */}
          <img
            src="/logo-complement.svg"
            alt="Complement Consulting Group"
            className="object-contain shrink-0"
            style={{ height: '44px' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />

          <div className="flex-1 text-center sm:text-right">
            <h1 className="font-serif text-navy" style={{ fontSize: '20px', marginBottom: '4px' }}>Reporte Ejecutivo</h1>
            <p className="text-muted" style={{ fontSize: '12px', marginBottom: '2px' }}>Diagnostico Empresarial</p>
            <p className="font-semibold text-navy" style={{ fontSize: '13px' }}>
              {datosGenerales.nombreComercial || 'Empresa'}
            </p>
            <p className="text-muted" style={{ fontSize: '11px' }}>
              {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          SECTION: MATURITY INDEX (Hero)
         ═══════════════════════════════════════════════ */}
      <Section title="Indice de Madurez Empresarial" number={nextNum()}>
        <div className="flex flex-col sm:flex-row items-center" style={{ gap: '24px', marginBottom: '24px' }}>
          {/* Big score ring */}
          <div className="text-center shrink-0">
            <div
              className={`inline-flex items-center justify-center rounded-full border-4 ${MATURITY_BG[maturity.level] || 'bg-pale border-border'}`}
              style={{ width: '100px', height: '100px' }}
            >
              <div>
                <p className={`font-bold ${MATURITY_COLOR[maturity.level] || 'text-ink'}`} style={{ fontSize: '28px', lineHeight: 1 }}>{maturity.score}</p>
                <p className="text-muted" style={{ fontSize: '10px' }}>/100</p>
              </div>
            </div>
            <p className={`font-bold ${MATURITY_COLOR[maturity.level]} mt-2`} style={{ fontSize: '13px' }}>{maturity.level}</p>
          </div>

          {/* Contribution breakdown */}
          <div className="flex-1 w-full" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ContribBar label="Profesionalizacion" value={maturity.profContrib} max={35} color="bg-accent" />
            <ContribBar label="Institucionalizacion" value={maturity.instContrib} max={25} color="bg-mid" />
            <ContribBar label="Gerencias" value={maturity.gerContrib} max={20} color="bg-navy" />
            <ContribBar label="Margenes" value={maturity.marginContrib} max={20} color="bg-success" />
          </div>
        </div>

        {/* Narrative */}
        <div className="rounded-xl bg-pale border border-border/30" style={{ padding: '18px 22px' }}>
          <p className="text-ink leading-relaxed" style={{ fontSize: '13px' }}>{narrative}</p>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          SECTION: RESUMEN EJECUTIVO
         ═══════════════════════════════════════════════ */}
      <Section title="Resumen Ejecutivo" number={nextNum()}>
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '14px', marginBottom: '14px' }}>
          <MetricBox label="Empresa" value={datosGenerales.nombreComercial || '—'} />
          <MetricBox label="Sector" value={sectorLabel} />
          <MetricBox label="Tamano" value={sizeResult?.size ?? '—'} highlight />
          <MetricBox label="Productividad per capita" value={sizeResult ? `$${sizeResult.productivityIndex.toFixed(2)} MDP` : '—'} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '14px' }}>
          <MetricBox label="Empleados" value={situacionActual.empleadosTotales?.toString() ?? '—'} />
          <MetricBox label="Ventas Anuales" value={situacionActual.ventasAnualesMDP ? `$${situacionActual.ventasAnualesMDP} MDP` : '—'} />
          <MetricBox label="Empresa Familiar" value={isFamily ? 'Si' : 'No'} />
          <MetricBox label="Urgencia" value={urgencyLevel ?? '—'} />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          SECTION: RISK PROFILE
         ═══════════════════════════════════════════════ */}
      {risks.length > 0 && (
        <Section title="Perfil de Riesgo — Hallazgos Criticos" number={nextNum()}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {risks.map((risk, i) => (
              <div
                key={i}
                className={`rounded-xl border-l-4 ${SEVERITY_STYLES[risk.severity]}`}
                style={{ padding: '16px 20px' }}
              >
                <div className="flex items-center flex-wrap" style={{ gap: '8px', marginBottom: '6px' }}>
                  <span className="font-bold text-navy" style={{ fontSize: '13px' }}>{risk.risk}</span>
                  <span className={`font-bold rounded-full ${SEVERITY_BADGE[risk.severity]}`} style={{ fontSize: '9px', padding: '2px 10px' }}>
                    {risk.severity === 'critico' ? 'CRITICO' : risk.severity === 'alto' ? 'ALTO' : 'MODERADO'}
                  </span>
                </div>
                <p className="text-ink" style={{ fontSize: '12px' }}>{risk.impact}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════
          SECTION: GROWTH READINESS
         ═══════════════════════════════════════════════ */}
      <Section title="Preparacion para Crecimiento" number={nextNum()}>
        <div className="flex flex-col sm:flex-row items-center" style={{ gap: '20px' }}>
          {/* Score */}
          <div className="text-center shrink-0">
            <p className={`font-bold ${growth.ready ? 'text-success' : 'text-warn'}`} style={{ fontSize: '32px', lineHeight: 1 }}>{growth.score}%</p>
            <div className="rounded-full" style={{ width: '100px', height: '6px', background: '#e2e8f0', marginTop: '8px' }}>
              <div
                className={`rounded-full h-full ${growth.ready ? 'bg-success' : 'bg-warn'}`}
                style={{ width: `${growth.score}%` }}
              />
            </div>
            <span
              className={`inline-block font-bold text-white rounded-full mt-2 ${growth.ready ? 'bg-success' : 'bg-warn'}`}
              style={{ fontSize: '10px', padding: '4px 14px' }}
            >
              {growth.ready ? 'LISTA PARA CRECER' : 'CONSOLIDAR PRIMERO'}
            </span>
          </div>

          {/* Factors */}
          <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {growth.factors.map((factor, i) => {
              const isPositive = !factor.startsWith('Falta');
              return (
                <div key={i} className="flex items-center" style={{ gap: '8px' }}>
                  <span className={`font-bold ${isPositive ? 'text-success' : 'text-warn'}`} style={{ fontSize: '14px' }}>
                    {isPositive ? '+' : '−'}
                  </span>
                  <span className="text-ink" style={{ fontSize: '12px' }}>{factor}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          SECTION: MARGINS + BENCHMARK COMPARISON
         ═══════════════════════════════════════════════ */}
      {marginData.tieneDatosFinancieros && marginEval && (
        <Section title="Analisis de Margenes Financieros" number={nextNum()}>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '14px', marginBottom: '24px' }}>
            {([
              { key: 'margenBruto' as const, label: 'Margen Bruto' },
              { key: 'margenOperativo' as const, label: 'Margen Operativo' },
              { key: 'margenNeto' as const, label: 'Margen Neto' },
            ]).map(m => {
              const ev = marginEval[m.key];
              if (ev.value === null) return null;
              const levelLabels: Record<MarginLevel, string> = {
                arriba_industria: 'Arriba de industria',
                en_rango: 'En rango',
                debajo_industria: 'Debajo de industria',
                critico: 'Critico',
              };
              const levelColors: Record<MarginLevel, string> = {
                arriba_industria: 'bg-success/10 border-success/20',
                en_rango: 'bg-mid/10 border-mid/20',
                debajo_industria: 'bg-warn/10 border-warn/20',
                critico: 'bg-error/10 border-error/20',
              };
              const textColors: Record<MarginLevel, string> = {
                arriba_industria: 'text-success',
                en_rango: 'text-mid',
                debajo_industria: 'text-warn',
                critico: 'text-error',
              };
              return (
                <div key={m.key} className={`rounded-xl text-center border ${levelColors[ev.level]}`} style={{ padding: '20px 14px' }}>
                  <p className="font-medium uppercase tracking-wide text-muted" style={{ fontSize: '9px', marginBottom: '6px' }}>{m.label}</p>
                  <p className="font-bold text-ink" style={{ fontSize: '18px' }}>{ev.value}%</p>
                  <p className={`font-semibold ${textColors[ev.level]}`} style={{ fontSize: '11px', marginTop: '6px' }}>{levelLabels[ev.level]}</p>
                </div>
              );
            })}
          </div>

          {/* Benchmark comparison */}
          <div>
            <p className="font-semibold text-navy uppercase tracking-wide" style={{ fontSize: '10px', marginBottom: '12px' }}>
              Comparativo vs. Industria — {sectorLabel}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {([
                { key: 'margenBruto' as const, label: 'Margen Bruto', benchmark: bench.margenBruto },
                { key: 'margenOperativo' as const, label: 'M. Operativo', benchmark: bench.margenOperativo },
                { key: 'margenNeto' as const, label: 'M. Neto', benchmark: bench.margenNeto },
              ]).map(item => {
                const ev = marginEval[item.key];
                if (ev.value === null) return null;
                const diff = ev.value - item.benchmark;
                const diffStr = diff >= 0 ? `+${diff.toFixed(1)}pp` : `${diff.toFixed(1)}pp`;
                const diffColor = diff >= 0 ? 'text-success' : diff >= -5 ? 'text-warn' : 'text-error';
                const barColor = diff >= 0 ? 'bg-success' : diff >= -5 ? 'bg-warn' : 'bg-error';
                const maxDisplay = Math.max(item.benchmark * 1.5, ev.value * 1.2, 30);
                return (
                  <div key={item.key} className="rounded-lg bg-pale" style={{ padding: '12px 16px' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                      <span className="font-bold text-navy" style={{ fontSize: '12px' }}>{item.label}</span>
                      <div className="flex items-center" style={{ gap: '12px' }}>
                        <span className={`font-bold ${diffColor}`} style={{ fontSize: '13px' }}>{ev.value}%</span>
                        <span className="text-muted" style={{ fontSize: '11px' }}>vs.</span>
                        <span className="font-bold text-navy" style={{ fontSize: '13px' }}>{item.benchmark}%</span>
                        <span className={`font-bold ${diffColor}`} style={{ fontSize: '11px' }}>{diffStr}</span>
                      </div>
                    </div>
                    <div className="rounded-full" style={{ width: '100%', height: '5px', background: '#e2e8f0' }}>
                      <div className="rounded-full bg-border/40 h-full" style={{ width: `${Math.min(100, (item.benchmark / maxDisplay) * 100)}%`, position: 'relative' }}>
                        <div className={`rounded-full h-full ${barColor}`} style={{ width: `${Math.min(100, (ev.value / item.benchmark) * 100)}%`, position: 'absolute', top: 0, left: 0, height: '100%' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════
          SECTION: DESCRIPCION DEL NEGOCIO
         ═══════════════════════════════════════════════ */}
      {descripcionNegocio && (
        <Section title="Descripcion del Negocio" number={nextNum()}>
          <p className="text-ink leading-relaxed" style={{ fontSize: '13px' }}>{descripcionNegocio}</p>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════
          SECTION: PROFESIONALIZACION (detailed criteria table)
         ═══════════════════════════════════════════════ */}
      <Section title={`Profesionalizacion (${profScore.average.toFixed(0)}/100 — ${profScore.level})`} number={nextNum()}>
        <div className="flex items-center" style={{ gap: '14px', marginBottom: '20px' }}>
          <div className="text-center">
            <p className="font-bold text-ink" style={{ fontSize: '18px' }}>{profScore.average.toFixed(0)}<span className="text-muted font-normal" style={{ fontSize: '12px' }}>/100</span></p>
            <p className="text-muted" style={{ fontSize: '10px' }}>Promedio</p>
          </div>
          <span className={`font-semibold border rounded-full ${LEVEL_COLORS[profScore.level]}`} style={{ fontSize: '12px', padding: '4px 12px' }}>
            {profScore.level}
          </span>
        </div>

        {/* Detailed criteria table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {profScore.answers.map(a => {
            const config = ALL_CRITERIA.find(c => c.id === a.criterionId);
            if (!config) return null;
            return (
              <div key={a.criterionId} className="flex items-start rounded-lg bg-pale/50 border border-border/20" style={{ padding: '10px 14px', gap: '10px' }}>
                <span className="font-semibold text-navy shrink-0" style={{ fontSize: '11px', minWidth: '140px' }}>{config.shortLabel}</span>
                <div className="flex-1 flex items-center" style={{ gap: '8px' }}>
                  {/* Rating bar */}
                  <div className="rounded-full shrink-0" style={{ width: '60px', height: '5px', background: '#e2e8f0' }}>
                    <div className={`rounded-full h-full ${ratingBg(a.rating)}`} style={{ width: `${Math.max(0, Math.min(100, (a.rating / 10) * 100))}%` }} />
                  </div>
                  <span className={`font-bold shrink-0 ${ratingColor(a.rating)}`} style={{ fontSize: '11px', minWidth: '36px' }}>
                    {ratingLabel(a.rating)}
                  </span>
                </div>
                {a.comentario && (
                  <span className="text-muted" style={{ fontSize: '10px', maxWidth: '200px' }}>{a.comentario}</span>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          SECTION: INSTITUCIONALIZACION (detailed criteria table)
         ═══════════════════════════════════════════════ */}
      <Section title={`Institucionalizacion (${instScore.average.toFixed(0)}/100 — ${instScore.level})`} number={nextNum()}>
        <div className="flex items-center" style={{ gap: '14px', marginBottom: '20px' }}>
          <div className="text-center">
            <p className="font-bold text-ink" style={{ fontSize: '18px' }}>{instScore.average.toFixed(0)}<span className="text-muted font-normal" style={{ fontSize: '12px' }}>/100</span></p>
            <p className="text-muted" style={{ fontSize: '10px' }}>Promedio</p>
          </div>
          <span className={`font-semibold border rounded-full ${LEVEL_COLORS[instScore.level]}`} style={{ fontSize: '12px', padding: '4px 12px' }}>
            {instScore.level}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {instScore.answers.map(a => {
            const config = ALL_CRITERIA.find(c => c.id === a.criterionId);
            if (!config) return null;
            return (
              <div key={a.criterionId} className="flex items-start rounded-lg bg-pale/50 border border-border/20" style={{ padding: '10px 14px', gap: '10px' }}>
                <span className="font-semibold text-navy shrink-0" style={{ fontSize: '11px', minWidth: '140px' }}>{config.shortLabel}</span>
                <div className="flex-1 flex items-center" style={{ gap: '8px' }}>
                  <div className="rounded-full shrink-0" style={{ width: '60px', height: '5px', background: '#e2e8f0' }}>
                    <div className={`rounded-full h-full ${ratingBg(a.rating)}`} style={{ width: `${Math.max(0, Math.min(100, (a.rating / 10) * 100))}%` }} />
                  </div>
                  <span className={`font-bold shrink-0 ${ratingColor(a.rating)}`} style={{ fontSize: '11px', minWidth: '36px' }}>
                    {ratingLabel(a.rating)}
                  </span>
                </div>
                {a.comentario && (
                  <span className="text-muted" style={{ fontSize: '10px', maxWidth: '200px' }}>{a.comentario}</span>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          SECTION: GERENCIAS (detailed)
         ═══════════════════════════════════════════════ */}
      <Section title="Gerencias / Puestos Clave" number={nextNum()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {gerencias.map(g => (
            <div key={g.area} className="flex items-center rounded-lg bg-pale" style={{ gap: '10px', padding: '12px 16px' }}>
              <span className={`rounded-full shrink-0 ${g.cubierto ? (g.calificado === 'si' ? 'bg-success' : g.calificado === 'no' ? 'bg-error' : 'bg-warn') : 'bg-error'}`} style={{ width: '8px', height: '8px' }} />
              <span className="font-bold text-navy flex-1" style={{ fontSize: '12px' }}>{g.area}</span>
              {g.cubierto ? (
                <>
                  <span className={`font-semibold rounded-full
                    ${g.calificado === 'si' ? 'bg-success/15 text-success' :
                      g.calificado === 'no' ? 'bg-error/15 text-error' :
                      'bg-warn/15 text-warn'}
                  `} style={{ fontSize: '10px', padding: '2px 8px' }}>
                    {g.calificado === 'si' ? 'Calificado' : g.calificado === 'no' ? 'No calificado' : 'Por evaluar'}
                  </span>
                  <div className="flex items-center text-muted" style={{ gap: '8px', fontSize: '10px' }}>
                    {g.antiguedad && <span>{g.antiguedad} anos</span>}
                    {(g as any).rangoSueldo && <span>{(g as any).rangoSueldo}</span>}
                    {(g as any).esFamiliar === true && <span className="text-accent font-medium">Familiar</span>}
                  </div>
                </>
              ) : (
                <span className="text-error font-semibold" style={{ fontSize: '11px' }}>No cubierto</span>
              )}
            </div>
          ))}
        </div>
        <p className="font-semibold text-navy" style={{ fontSize: '12px' }}>
          {gerenciasCubiertas} de {gerencias.length} puestos cubiertos
        </p>
        {gerenciasCubiertas < gerencias.length && (
          <p className="text-error" style={{ fontSize: '12px', marginTop: '6px' }}>
            Hay {gerencias.length - gerenciasCubiertas} posicion(es) gerencial(es) sin cubrir.
          </p>
        )}
      </Section>

      {/* ═══════════════════════════════════════════════
          SECTION: AREAS DE OPORTUNIDAD
         ═══════════════════════════════════════════════ */}
      {opportunityAreas.length > 0 && (
        <Section title="Areas de Oportunidad Principales" number={nextNum()}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {opportunityAreas.map(area => (
              <div key={area.serviceArea.id} className="rounded-xl border border-border/50 bg-pale/50" style={{ padding: '20px 24px' }}>
                <div className="flex items-start" style={{ gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>{area.serviceArea.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap" style={{ gap: '6px', marginBottom: '4px' }}>
                      <h4 className="font-semibold text-ink" style={{ fontSize: '13px' }}>{area.serviceArea.name}</h4>
                      <span className={`font-semibold rounded-full
                        ${area.priority === 'alta' ? 'bg-error/15 text-error' :
                          area.priority === 'media' ? 'bg-warn/15 text-warn' :
                          'bg-mid/15 text-mid'}
                      `} style={{ fontSize: '10px', padding: '2px 8px' }}>
                        Prioridad {area.priority}
                      </span>
                    </div>
                    <p className="text-muted" style={{ fontSize: '11px', marginBottom: '4px' }}>{area.serviceArea.description}</p>
                    <p className="text-muted" style={{ fontSize: '10px' }}>
                      <span className="font-medium">Criterios:</span>{' '}
                      {area.triggeringCriteria.map(c => `${c.text} (${ratingLabel(c.rating)})`).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════
          SECTION: SMART RECOMMENDATIONS
         ═══════════════════════════════════════════════ */}
      <Section title="Recomendaciones Especificas" number={nextNum()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {smartRecs.map((rec, i) => (
            <div key={i} className="flex items-start rounded-xl bg-accent/5 border border-accent/10" style={{ padding: '14px 18px', gap: '12px' }}>
              <span className="bg-accent text-white font-bold rounded-lg shrink-0 flex items-center justify-center" style={{ width: '24px', height: '24px', fontSize: '12px' }}>
                {i + 1}
              </span>
              <p className="text-ink" style={{ fontSize: '12px', lineHeight: '1.6' }}>{rec}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          SECTION: SIGUIENTES PASOS
         ═══════════════════════════════════════════════ */}
      <Section title="Siguientes Pasos Sugeridos" number={nextNum()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            'Agendar una sesion de revision de resultados con un consultor de Complement.',
            'Priorizar las areas de oportunidad con mayor impacto para su empresa.',
            'Definir un plan de accion con plazos y responsables para cada area.',
            'Implementar mejoras de forma gradual, comenzando por los focos rojos identificados.',
          ].map((step, i) => (
            <div key={i} className="flex items-start rounded-lg bg-navy/5" style={{ padding: '12px 16px', gap: '10px' }}>
              <span className="text-accent font-bold" style={{ fontSize: '14px' }}>→</span>
              <p className="text-ink" style={{ fontSize: '12px' }}>{step}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          SECTION: RETOS Y URGENCIA
         ═══════════════════════════════════════════════ */}
      <Section title="Retos Principales y Urgencia" number={nextNum()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {retos.map((r, i) => r && (
            <div key={i} className="rounded-lg bg-pale" style={{ padding: '16px 20px' }}>
              <span className="font-semibold text-navy" style={{ fontSize: '11px' }}>Reto o problema #{i + 1}:</span>
              <p className="text-ink" style={{ fontSize: '12px', marginTop: '4px' }}>{r}</p>
            </div>
          ))}
          {!retos.some(r => r) && (
            <p className="text-muted" style={{ fontSize: '12px' }}>No se registraron retos.</p>
          )}
        </div>
        <div className="rounded-lg bg-navy/5 border border-navy/10" style={{ padding: '14px 18px' }}>
          <p className="font-semibold text-navy uppercase tracking-wide" style={{ fontSize: '10px', marginBottom: '4px' }}>Nivel de urgencia</p>
          <p className="text-ink font-medium" style={{ fontSize: '12px' }}>
            {urgencyLevel ?? '—'}
            {urgencia === 'muy_urgente' && ' — Requiere atencion inmediata.'}
            {urgencia === 'necesario' && ' — Necesario avanzar con planificacion adecuada.'}
            {urgencia === 'deseable' && ' — Puede planificarse a mediano plazo.'}
          </p>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          SECTION: ANALISIS FAMILIAR
         ═══════════════════════════════════════════════ */}
      {isFamily && analisisFamiliar && (
        <Section title="Analisis Familiar" number={nextNum()}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(analisisFamiliar).map(([key, value]) => value && (
              <div key={key} className="rounded-lg bg-pale" style={{ padding: '14px 18px' }}>
                <p className="font-semibold text-navy" style={{ fontSize: '11px', marginBottom: '4px' }}>
                  {key === 'gobiernoFamiliar' ? 'Gobierno Familiar' :
                   key === 'planSucesion' ? 'Plan de Sucesion' :
                   key === 'protocoloFamiliar' ? 'Protocolo Familiar' :
                   key === 'conflictosFamiliares' ? 'Conflictos Familiares' :
                   key === 'rolesOperacion' ? 'Roles en la Operacion' :
                   'Profesionalizacion de Familiares'}
                </p>
                <p className="text-ink" style={{ fontSize: '12px' }}>{value}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════
          SECTION: DATOS GENERALES (detail table)
         ═══════════════════════════════════════════════ */}
      <Section title="Datos Generales" number={nextNum()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <DetailRow label="Sector" value={sectorLabel} />
          <DetailRow label="Antiguedad Constituida" value={datosGenerales.antiguedadConstituida ? `${datosGenerales.antiguedadConstituida} anos` : '—'} alt />
          <DetailRow label="Antiguedad Operativa" value={datosGenerales.antiguedadOperativa ? `${datosGenerales.antiguedadOperativa} anos` : '—'} />
          <DetailRow label="Empresa Familiar" value={familiarLabel} alt />
          <DetailRow label="Respondente" value={datosGenerales.respondente || '—'} />
          <DetailRow label="Correo electronico" value={datosGenerales.email || '—'} alt />
          <DetailRow label="Puesto en la Empresa" value={datosGenerales.puestoEmpresa || '—'} />
          {isFamily && <DetailRow label="Puesto en la Familia" value={datosGenerales.puestoFamilia || '—'} alt />}
          <DetailRow label="Es socio?" value={datosGenerales.esSocio === 'si' ? `Si${datosGenerales.porcentajeAcciones ? ` — ${datosGenerales.porcentajeAcciones}%` : ''}` : datosGenerales.esSocio === 'no' ? 'No' : '—'} />
          <DetailRow label="Software de Gestion" value={softwareLabel} alt />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          SECTION: SITUACION ACTUAL (detail table)
         ═══════════════════════════════════════════════ */}
      <Section title="Situacion Actual" number={nextNum()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <DetailRow label="Ventas Anuales" value={situacionActual.ventasAnualesMDP !== null ? `$${situacionActual.ventasAnualesMDP} MDP` : '—'} />
          <DetailRow label="Empleados Totales" value={situacionActual.empleadosTotales?.toString() ?? '—'} alt />
          {situacionActual.empleadosFamiliares !== null && situacionActual.empleadosFamiliares !== undefined && (
            <DetailRow label="Empleados Familiares" value={situacionActual.empleadosFamiliares.toString()} />
          )}
          <DetailRow label="Numero de Socios" value={situacionActual.socios || '—'} alt />
          {situacionActual.sociosDetalle && situacionActual.sociosDetalle.length > 0 && (
            situacionActual.sociosDetalle.map((s, i) => (
              <DetailRow
                key={i}
                label={`  Socio ${i + 1}`}
                value={`${s.esFamiliar === true ? 'Familiar' : s.esFamiliar === false ? 'No familiar' : '—'}  |  ${s.porcentaje ? `${s.porcentaje}%` : '—'}`}
                alt={i % 2 === 0}
              />
            ))
          )}
          {situacionActual.familiaresEnPoder && (
            <DetailRow label="Familiares en el Poder" value={situacionActual.familiaresEnPoder} />
          )}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          SECTION: COMPANY CLASSIFICATION
         ═══════════════════════════════════════════════ */}
      {sizeResult && (
        <Section title="Clasificacion de Empresa" number={nextNum()}>
          <div className="flex flex-wrap" style={{ gap: '10px', marginBottom: '18px' }}>
            {['Micro', 'Pequena', 'Mediana', 'Grande'].map(size => (
              <div
                key={size}
                className={`rounded-xl text-center flex-1 border-2 font-bold transition-all ${
                  sizeResult.size === size
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-pale border-border/30 text-muted'
                }`}
                style={{ padding: '14px 12px', fontSize: '14px', minWidth: '80px' }}
              >
                {size}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2" style={{ gap: '14px' }}>
            <div className="rounded-xl text-center bg-accent/5 border border-accent/10" style={{ padding: '18px 14px' }}>
              <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: '9px', marginBottom: '6px' }}>Productividad Per Capita</p>
              <p className="font-bold text-navy" style={{ fontSize: '16px' }}>${sizeResult.productivityIndex.toFixed(2)} MDP</p>
            </div>
            <div className="rounded-xl text-center bg-pale border border-border/30" style={{ padding: '18px 14px' }}>
              <p className="text-muted font-medium uppercase tracking-wide" style={{ fontSize: '9px', marginBottom: '6px' }}>Antiguedad</p>
              <p className="font-bold text-navy" style={{ fontSize: '14px' }}>
                {datosGenerales.antiguedadConstituida ? `${datosGenerales.antiguedadConstituida} anos constituida` : datosGenerales.antiguedadOperativa ? `${datosGenerales.antiguedadOperativa} anos operativa` : '—'}
              </p>
              {datosGenerales.antiguedadConstituida && datosGenerales.antiguedadOperativa && (
                <p className="text-muted" style={{ fontSize: '10px', marginTop: '4px' }}>{datosGenerales.antiguedadOperativa} anos operativa</p>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════
          BRANDED FOOTER
         ═══════════════════════════════════════════════ */}
      <div className="w-full bg-navy rounded-2xl text-center" style={{ padding: '40px 32px', marginTop: '4px', position: 'relative', overflow: 'hidden' }}>
        {/* Orange accent bar at top of footer */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#d4922e' }} />

        {/* Complement icon (SVG inline for white variant on dark bg) */}
        <div className="mx-auto" style={{ marginBottom: '14px' }}>
          <img
            src={companyLogo || '/icon-complement.svg'}
            alt="Complement"
            className="mx-auto object-contain"
            style={{ height: '40px', filter: companyLogo ? 'none' : 'brightness(0) invert(1)' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        <h3 className="font-serif text-white tracking-wider" style={{ fontSize: '14px', marginBottom: '2px', letterSpacing: '3px' }}>COMPLEMENT</h3>
        <p className="text-white/50 tracking-widest uppercase" style={{ fontSize: '9px', marginBottom: '16px', letterSpacing: '4px' }}>Consulting Group</p>

        {/* Orange divider */}
        <div className="mx-auto" style={{ width: '60px', height: '2px', background: '#d4922e', marginBottom: '16px' }} />

        <p className="text-white/50 mx-auto" style={{ fontSize: '10px', marginBottom: '6px', maxWidth: '400px' }}>
          Documento confidencial — Uso exclusivo del destinatario
        </p>
        <p className="text-white/40 mx-auto" style={{ fontSize: '9px', marginBottom: '24px', maxWidth: '400px' }}>
          Reporte generado automaticamente. Contacte a nuestro equipo para profundizar en los resultados.
        </p>

        <div className="flex justify-center flex-wrap" style={{ gap: '10px' }}>
          <button
            onClick={handleDownloadPdf}
            className="font-semibold hover:opacity-90 transition-all cursor-pointer"
            style={{ fontSize: '12px', padding: '9px 22px', borderRadius: '10px', background: '#d4922e', color: 'white' }}
          >
            Descargar PDF
          </button>
          {user?.role === 'master' ? (
            <button
              onClick={() => setView('history')}
              className="bg-white text-navy font-semibold hover:bg-white/90 transition-all cursor-pointer"
              style={{ fontSize: '12px', padding: '9px 22px', borderRadius: '10px' }}
            >
              Expedientes
            </button>
          ) : (
            <>
              <button
                onClick={() => setView('result')}
                className="bg-white text-navy font-semibold hover:bg-white/90 transition-all cursor-pointer"
                style={{ fontSize: '12px', padding: '9px 22px', borderRadius: '10px' }}
              >
                Resultados
              </button>
              <button
                onClick={() => setView('dashboard')}
                className="bg-white/10 text-white/80 font-medium border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
                style={{ fontSize: '12px', padding: '9px 22px', borderRadius: '10px' }}
              >
                Mis Encuestas
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Shared sub-components
   ═══════════════════════════════════════════════ */

function Section({ title, number, children }: { title: string; number: string; children: React.ReactNode }) {
  return (
    <div className="w-full bg-white rounded-2xl shadow-md border border-border/50 animate-fade-up" style={{ padding: '36px 32px', marginBottom: '24px' }}>
      <div className="flex items-center" style={{ gap: '12px', marginBottom: '28px', paddingBottom: '16px', borderBottom: '2px solid #d4922e33' }}>
        <span className="font-bold text-white rounded-full flex items-center justify-center shrink-0" style={{ fontSize: '11px', width: '32px', height: '32px', background: '#d4922e' }}>{number}</span>
        <h2 className="font-serif text-navy" style={{ fontSize: '16px' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function MetricBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl text-center ${highlight ? 'bg-accent/10 border border-accent/20' : 'bg-pale border border-border/30'}`} style={{ padding: '18px 12px' }}>
      <p className="text-muted font-medium uppercase tracking-wider" style={{ fontSize: '9px', marginBottom: '6px' }}>{label}</p>
      <p className={`font-semibold ${highlight ? 'text-accent' : 'text-ink'}`} style={{ fontSize: '13px' }}>{value}</p>
    </div>
  );
}

function ContribBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: '3px' }}>
        <span className="text-muted font-medium" style={{ fontSize: '11px' }}>{label}</span>
        <span className="font-bold text-navy" style={{ fontSize: '11px' }}>{value}/{max}</span>
      </div>
      <div className="rounded-full" style={{ width: '100%', height: '6px', background: '#e2e8f0' }}>
        <div className={`rounded-full h-full ${color}`} style={{ width: `${pct}%`, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

function DetailRow({ label, value, alt }: { label: string; value: string; alt?: boolean }) {
  return (
    <div className={`flex items-center ${alt ? 'bg-pale' : 'bg-white'}`} style={{ padding: '10px 16px', gap: '12px' }}>
      <span className="font-bold text-navy shrink-0" style={{ fontSize: '12px', minWidth: '160px' }}>{label}</span>
      <span className="text-ink" style={{ fontSize: '12px' }}>{value}</span>
    </div>
  );
}
