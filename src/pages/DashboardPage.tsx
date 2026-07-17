import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ClipboardList, Building2, Monitor, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { useOrgSurveyStore } from '../store/orgSurveyStore';
import { useTechSurveyStore } from '../store/techSurveyStore';
import { useSettingsStore } from '../store/settingsStore';
import { getDiagnosticsByUser, getOrgSurveysByUser, getTechSurveysByUser, getPrefillForUser } from '../lib/storage';
import type { PrefillData } from '../lib/storage';
import { exportToExcel } from '../lib/export';
import { exportToPdf } from '../lib/exportPdf';
import { exportOrgSurveyToPdf } from '../lib/exportOrgPdf';
import { exportTechSurveyToPdf } from '../lib/exportTechPdf';
import { exportExpediente } from '../lib/exportExpediente';
import type { SavedDiagnostic, SavedOrgSurvey, SavedTechSurvey } from '../lib/types';
import AnimatedGauge from '../components/ui/AnimatedGauge';
import RadarChart from '../components/ui/RadarChart';
import HistoricalComparison from '../components/ui/HistoricalComparison';

/* Org report nav helper */
function useOrgReportNav() {
  const loadOrgSurveyForReport = useOrgSurveyStore(s => s.loadOrgSurveyForReport);
  const setView = useDiagnosticStore(s => s.setView);
  return (survey: SavedOrgSurvey) => {
    loadOrgSurveyForReport(survey);
    setView('org_report');
  };
}

/* Tech report nav helper */
function useTechReportNav() {
  const loadTechSurveyForReport = useTechSurveyStore(s => s.loadTechSurveyForReport);
  const setView = useDiagnosticStore(s => s.setView);
  return (survey: SavedTechSurvey) => {
    loadTechSurveyForReport(survey);
    setView('tech_report');
  };
}

const MATURITY_COLORS: Record<string, string> = {
  basico: 'text-error',
  intermedio: 'text-warn',
  avanzado: 'text-success',
  lider_digital: 'text-accent',
};
const MATURITY_LABELS: Record<string, string> = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
  lider_digital: 'Líder Digital',
};

const DIAG_TOTAL_STEPS = 7;
const ORG_TOTAL_STEPS = 3;
const TECH_TOTAL_STEPS = 7;

/* ── Urgency to score mapping for radar chart ── */
function urgencyToScore(level: string): number {
  const map: Record<string, number> = {
    'Crítica': 95, 'Alta': 75, 'Media': 50, 'Baja': 25,
  };
  return map[level] ?? 50;
}

/* ── Margin to score helper ── */
function marginToScore(me?: { margenBruto: { level: string }; margenOperativo: { level: string }; margenNeto: { level: string } }, hasFin?: boolean): number {
  if (!me) return hasFin ? 30 : 50;
  const levelMap: Record<string, number> = { arriba_industria: 90, en_rango: 65, debajo_industria: 35, critico: 15 };
  const scores = [me.margenBruto.level, me.margenOperativo.level, me.margenNeto.level].map(l => levelMap[l] ?? 50);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const setView = useDiagnosticStore(s => s.setView);
  const resetDiagnostic = useDiagnosticStore(s => s.resetDiagnostic);
  const loadDiagnosticForReport = useDiagnosticStore(s => s.loadDiagnosticForReport);
  const loadPrefill = useDiagnosticStore(s => s.loadPrefill);
  const resetOrgSurvey = useOrgSurveyStore(s => s.resetOrgSurvey);
  const resetTechSurvey = useTechSurveyStore(s => s.resetTechSurvey);
  const companyLogo = useSettingsStore(s => s.companyLogo);
  const companyLogoIcon = useSettingsStore(s => s.companyLogoIcon);

  const diagDraftActive = useDiagnosticStore(s => s.draftActive);
  const diagDraftStep = useDiagnosticStore(s => s.currentStep);
  const orgDraftActive = useOrgSurveyStore(s => s.draftActive);
  const orgDraftStep = useOrgSurveyStore(s => s.currentStep);
  const techDraftActive = useTechSurveyStore(s => s.draftActive);
  const techDraftStep = useTechSurveyStore(s => s.currentStep);

  const [diagnostics, setDiagnostics] = useState<SavedDiagnostic[]>([]);
  const [orgSurveys, setOrgSurveys] = useState<SavedOrgSurvey[]>([]);
  const [techSurveys, setTechSurveys] = useState<SavedTechSurvey[]>([]);
  const [diagPrefill, setDiagPrefill] = useState<PrefillData | null>(null);
  const [loading, setLoading] = useState(true);

  const permissions = user?.surveyPermissions ?? ['diagnostico_empresarial'];
  const hasDiagPerm = permissions.includes('diagnostico_empresarial');
  const hasOrgPerm = permissions.includes('estructura_organizacional');
  const hasTechPerm = permissions.includes('prueba_tecnologia');

  useEffect(() => {
    if (user) {
      Promise.all([
        hasDiagPerm ? getDiagnosticsByUser(user.id) : Promise.resolve([]),
        hasOrgPerm ? getOrgSurveysByUser(user.id) : Promise.resolve([]),
        hasTechPerm ? getTechSurveysByUser(user.id) : Promise.resolve([]),
        hasDiagPerm ? getPrefillForUser(user.id, 'diagnostico_empresarial') : Promise.resolve(null),
      ]).then(([diag, org, tech, prefill]) => {
        setDiagnostics(diag);
        setOrgSurveys(org);
        setTechSurveys(tech);
        setDiagPrefill(prefill);
        setLoading(false);
      });
    }
  }, [user, hasDiagPerm, hasOrgPerm, hasTechPerm]);

  function handleResumeDiagDraft() { setView('wizard'); }
  function handleDiscardDiagDraft() { resetDiagnostic(); }
  function handleResumeOrgDraft() { setView('org_wizard'); }
  function handleDiscardOrgDraft() { resetOrgSurvey(); }
  function handleResumeTechDraft() { setView('tech_wizard'); }
  function handleDiscardTechDraft() { resetTechSurvey(); }

  function handleNewDiagnostic() {
    if (diagPrefill) {
      loadPrefill(diagPrefill);
      return;
    }
    resetDiagnostic();
    setView('wizard');
  }

  function handleNewOrgSurvey() { resetOrgSurvey(); setView('org_wizard'); }
  function handleNewTechSurvey() { resetTechSurvey(); setView('tech_wizard'); }

  function handleViewReport(d: SavedDiagnostic) { loadDiagnosticForReport(d); }

  function handleExpediente(mode: 'download' | 'view') {
    const latestDiag = diagnostics.length > 0 ? diagnostics[0] : undefined;
    const latestOrg = orgSurveys.length > 0 ? orgSurveys[0] : undefined;
    const companyName = latestDiag?.datosGenerales.nombreComercial || latestOrg?.companyName || user?.displayName || 'Cliente';
    exportExpediente(companyName, latestDiag, latestOrg, mode);
  }

  if (!user) return null;

  const latestDiag = diagnostics.length > 0 ? diagnostics[0] : null;
  const latestOrg = orgSurveys.length > 0 ? orgSurveys[0] : null;
  const latestTech = techSurveys.length > 0 ? techSurveys[0] : null;
  const canDownloadExpediente = diagnostics.length > 0 && orgSurveys.length > 0;

  /* A3 — Radar chart data from diagnostic */
  const radarAxes = latestDiag ? [
    { label: 'Prof.', value: latestDiag.profesionalizacion.average },
    { label: 'Inst.', value: latestDiag.institucionalizacion.average },
    { label: 'Finanzas', value: marginToScore(latestDiag.marginEvaluation, latestDiag.marginData?.tieneDatosFinancieros) },
    { label: 'Gerencias', value: Math.round((latestDiag.gerencias.filter(g => g.cubierto).length / Math.max(latestDiag.gerencias.length, 1)) * 100) },
    { label: 'Urgencia', value: urgencyToScore(latestDiag.urgenciaLevel) },
  ] : null;

  return (
    <div style={{ width: '100%', maxWidth: '930px', margin: '0 auto', padding: '0 clamp(16px, 3vw, 24px) 60px' }}>

      {/* ═══ A1 — BRANDED HEADER ═══ */}
      <div className="stagger-1" style={{ marginBottom: '32px' }}>
        {/* Orange accent line */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, #d4922e, #f59e0b, #d4922e)', borderRadius: '0 0 4px 4px', marginBottom: '24px' }} />

        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: '16px' }}>
            {user.logoUrl ? (
              <img src={user.logoUrl} alt="Logo" className="rounded-xl object-cover shrink-0" style={{ width: '52px', height: '52px', border: '2px solid var(--color-border)' }} />
            ) : (
              <img src={companyLogoIcon || '/icon-complement.svg'} alt="Complement" className="shrink-0" style={{ height: '40px' }} />
            )}
            <div>
              <h1 className="font-serif text-navy" style={{ fontSize: 'var(--fs-22)', marginBottom: '2px' }}>
                Página Principal
              </h1>
              <p className="text-muted" style={{ fontSize: 'var(--fs-13)' }}>
                Bienvenido, <span className="font-semibold text-ink">{user.displayName}</span>
              </p>
            </div>
          </div>
          <img src={companyLogo || '/logo-complement.svg'} alt="Complement" className="hidden sm:block" style={{ height: '28px', opacity: 0.5 }} />
        </div>
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: '40px 0' }}>
          <p className="text-muted" style={{ fontSize: 'var(--fs-14)' }}>Cargando...</p>
        </div>
      ) : (
        <>
          {/* ═══ DRAFTS ═══ */}
          {(diagDraftActive || orgDraftActive || techDraftActive) && (
            <div className="stagger-1" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {diagDraftActive && hasDiagPerm && (
                <DraftBanner icon={ClipboardList} label="Radiografía Empresarial" step={diagDraftStep + 1} totalSteps={DIAG_TOTAL_STEPS} onResume={handleResumeDiagDraft} onDiscard={handleDiscardDiagDraft} />
              )}
              {orgDraftActive && hasOrgPerm && (
                <DraftBanner icon={Building2} label="Estructura Organizacional" step={orgDraftStep + 1} totalSteps={ORG_TOTAL_STEPS} onResume={handleResumeOrgDraft} onDiscard={handleDiscardOrgDraft} />
              )}
              {techDraftActive && hasTechPerm && (
                <DraftBanner icon={Monitor} label="Prueba de Tecnologia" step={techDraftStep + 1} totalSteps={TECH_TOTAL_STEPS} onResume={handleResumeTechDraft} onDiscard={handleDiscardTechDraft} />
              )}
            </div>
          )}

          {/* ═══ HERO — Diagnostico Empresarial ═══ */}
          {hasDiagPerm && (
            <div className="stagger-2" style={{ marginBottom: '32px' }}>
              <div
                className="rounded-2xl shadow-lg border-2 overflow-hidden card-hover-lift"
                style={{ borderColor: '#d4922e33', background: 'linear-gradient(135deg, #fffbf5 0%, #fff8ef 30%, #f8fafc 100%)' }}
              >
                {/* Branded top bar */}
                <div style={{ background: 'linear-gradient(90deg, #1b2a4a, #0a2a52)', padding: 'clamp(10px, 2vw, 14px) clamp(16px, 3vw, 32px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: '#d4922e' }} />
                  <div className="flex items-center" style={{ gap: '10px' }}>
                    <span style={{ fontSize: 'var(--fs-9)', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.1em', background: '#d4922e', color: 'white', fontWeight: 700, textTransform: 'uppercase' }}>
                      Core
                    </span>
                    <h2 className="font-serif text-white" style={{ fontSize: 'var(--fs-16)' }}>Radiografía Empresarial</h2>
                  </div>
                  {latestDiag ? (
                    <span style={{ fontSize: 'var(--fs-10)', padding: '3px 12px', borderRadius: '6px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 700, border: '1px solid rgba(34,197,94,0.3)' }}>Completado</span>
                  ) : diagPrefill ? (
                    <span style={{ fontSize: 'var(--fs-10)', padding: '3px 12px', borderRadius: '6px', background: 'rgba(212,146,46,0.15)', color: '#d4922e', fontWeight: 700, border: '1px solid rgba(212,146,46,0.3)' }}>Pre-llenado listo</span>
                  ) : (
                    <span style={{ fontSize: 'var(--fs-10)', padding: '3px 12px', borderRadius: '6px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 700, border: '1px solid rgba(245,158,11,0.3)' }}>Pendiente</span>
                  )}
                </div>

                <div style={{ padding: 'clamp(18px, 3vw, 28px) clamp(16px, 3vw, 32px)' }}>
                  <p className="text-muted leading-relaxed" style={{ fontSize: 'var(--fs-12)', marginBottom: '20px', maxWidth: '520px' }}>
                    Evaluación integral de profesionalización, institucionalización, gerencias, situación financiera y áreas de oportunidad de la empresa.
                  </p>

                  {latestDiag && (
                    <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginBottom: '16px' }}>
                      <span className="font-semibold text-ink">{latestDiag.datosGenerales.nombreComercial || 'Sin nombre'}</span> — {new Date(latestDiag.savedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}

                  {/* ═══ A2 — ANIMATED GAUGES + A3 — RADAR CHART ═══ */}
                  {latestDiag && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                      {/* Gauges */}
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <AnimatedGauge
                          value={latestDiag.profesionalizacion.average}
                          label="Profesionalización"
                          sublabel={latestDiag.profesionalizacion.level}
                          size={90}
                          delay={200}
                        />
                        <AnimatedGauge
                          value={latestDiag.institucionalizacion.average}
                          label="Institucionalización"
                          sublabel={latestDiag.institucionalizacion.level}
                          size={90}
                          delay={400}
                        />
                      </div>

                      {/* Mini KPI pills */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'white', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect width="16" height="16" rx="3" fill="#1b2a4a" opacity="0.1"/><text x="8" y="12" textAnchor="middle" fontSize="10" fill="#1b2a4a" fontWeight="700">{latestDiag.companySize.size.charAt(0)}</text></svg>
                          <div>
                            <p style={{ fontSize: 'var(--fs-8)', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tamaño</p>
                            <p style={{ fontSize: 'var(--fs-13)', fontWeight: 700, color: '#1b2a4a' }}>{latestDiag.companySize.size}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'white', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill={latestDiag.urgenciaLevel === 'Crítica' ? '#fee2e2' : latestDiag.urgenciaLevel === 'Alta' ? '#fef3c7' : '#d1fae5'} /><circle cx="8" cy="8" r="3" fill={latestDiag.urgenciaLevel === 'Crítica' ? '#ef4444' : latestDiag.urgenciaLevel === 'Alta' ? '#f59e0b' : '#22c55e'} /></svg>
                          <div>
                            <p style={{ fontSize: 'var(--fs-8)', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Urgencia</p>
                            <p style={{ fontSize: 'var(--fs-13)', fontWeight: 700, color: '#1b2a4a' }}>{latestDiag.urgenciaLevel}</p>
                          </div>
                        </div>
                      </div>

                      {/* A3 — Radar */}
                      {radarAxes && (
                        <div className="hidden sm:block" style={{ marginLeft: 'auto' }}>
                          <RadarChart axes={radarAxes} size={160} animated delay={600} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center" style={{ gap: '10px' }}>
                    {latestDiag ? (
                      <>
                        <button onClick={() => handleViewReport(latestDiag)} style={{ fontSize: 'var(--fs-13)', padding: '10px 24px', borderRadius: '10px', background: '#d4922e', color: 'white', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(212,146,46,0.25)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#c07f20'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#d4922e'; }}>
                          Ver Reporte
                        </button>
                        <button onClick={() => exportToPdf(latestDiag)} className="border border-navy text-navy font-semibold hover:bg-navy/5 transition-all cursor-pointer" style={{ fontSize: 'var(--fs-12)', padding: '9px 20px', borderRadius: '8px' }}>
                          PDF
                        </button>
                        <button onClick={() => exportToExcel(latestDiag)} className="border border-border text-muted font-medium hover:border-mid/50 hover:text-ink transition-all cursor-pointer" style={{ fontSize: 'var(--fs-12)', padding: '9px 20px', borderRadius: '8px' }}>
                          Excel
                        </button>
                        <span className="border-l border-border/40" style={{ height: '20px' }} />
                        <button onClick={handleNewDiagnostic} className="text-navy font-medium hover:underline cursor-pointer" style={{ fontSize: 'var(--fs-12)', background: 'none', padding: '0' }}>
                          Contestar de nuevo
                        </button>
                      </>
                    ) : (
                      <div>
                        <button onClick={handleNewDiagnostic} style={{ fontSize: 'var(--fs-14)', padding: '12px 36px', borderRadius: '12px', background: '#d4922e', color: 'white', fontWeight: 600, cursor: 'pointer', border: 'none', boxShadow: '0 4px 16px rgba(212,146,46,0.25)', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(212,146,46,0.35)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(212,146,46,0.25)'; }}>
                          {diagPrefill ? 'Contestar Radiografía (Pre-llenado)' : 'Comenzar Radiografía'}
                        </button>
                        {diagPrefill && (
                          <p style={{ fontSize: 'var(--fs-11)', marginTop: '8px', color: '#d4922e', fontWeight: 500 }}>
                            Tu consultor ha pre-llenado algunos datos para ti
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ ENCUESTAS COMPLEMENTARIAS (A6 stagger) ═══ */}
          {(hasOrgPerm || hasTechPerm) && (
            <div className="stagger-3" style={{ marginBottom: '24px' }}>
              <h2 className="text-muted uppercase tracking-wide font-semibold" style={{ fontSize: 'var(--fs-11)', marginBottom: '12px', letterSpacing: '0.05em' }}>
                Encuestas Complementarias
              </h2>

              <div className="mobile-col" style={{ display: 'grid', gridTemplateColumns: hasOrgPerm && hasTechPerm ? 'repeat(2, 1fr)' : '1fr', gap: '14px' }}>

                {hasOrgPerm && (
                  <div className="bg-white rounded-2xl border border-border/40 shadow-sm card-hover-lift" style={{ padding: '22px 24px' }}>
                    <div className="flex items-center" style={{ gap: '10px', marginBottom: '12px' }}>
                      <div className="inline-flex items-center justify-center rounded-full shrink-0" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #6366f115, #6366f108)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-navy truncate" style={{ fontSize: 'var(--fs-13)', marginBottom: '1px' }}>Estructura Organizacional</h3>
                        {latestOrg ? (
                          <p className="text-muted truncate" style={{ fontSize: 'var(--fs-10)' }}>{new Date(latestOrg.savedAt).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        ) : (
                          <p className="text-muted" style={{ fontSize: 'var(--fs-10)' }}>Pendiente</p>
                        )}
                      </div>
                      {latestOrg ? (
                        <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)', color: '#22c55e' }}><Check style={{ width: 'var(--fs-11)', height: 'var(--fs-11)' }} /></span>
                      ) : (
                        <span style={{ fontSize: 'var(--fs-9)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)', color: '#f59e0b', fontWeight: 700 }}>...</span>
                      )}
                    </div>

                    {latestOrg && (() => {
                      const totalColab = latestOrg.areaDetails.reduce((sum, a) => sum + (a.colaboradores ?? 0), 0);
                      return (
                        <div className="flex flex-wrap" style={{ gap: '12px', marginBottom: '12px' }}>
                          <div><p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: 'var(--fs-8)', marginBottom: '1px' }}>Colaboradores</p><p className="text-ink font-bold" style={{ fontSize: 'var(--fs-12)' }}>{totalColab}</p></div>
                          <div><p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: 'var(--fs-8)', marginBottom: '1px' }}>Areas</p><p className="text-ink font-bold" style={{ fontSize: 'var(--fs-12)' }}>{latestOrg.areaDetails.length}</p></div>
                          <div><p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: 'var(--fs-8)', marginBottom: '1px' }}>Organigrama</p><p className="text-ink font-semibold" style={{ fontSize: 'var(--fs-12)' }}>{latestOrg.orgStructure.tieneOrganigrama ? 'Sí' : 'No'}</p></div>
                        </div>
                      );
                    })()}

                    <div className="flex flex-wrap items-center" style={{ gap: '8px' }}>
                      {latestOrg ? (
                        <>
                          <OrgReportButton survey={latestOrg} />
                          <button onClick={() => exportOrgSurveyToPdf(latestOrg)} className="border border-mid text-mid font-semibold hover:bg-mid/5 transition-all cursor-pointer" style={{ fontSize: 'var(--fs-11)', padding: 'var(--sp-btn-d)', borderRadius: '8px' }}>PDF</button>
                          <button onClick={handleNewOrgSurvey} className="text-mid font-medium hover:underline cursor-pointer" style={{ fontSize: 'var(--fs-11)', background: 'none', padding: '0' }}>Repetir</button>
                        </>
                      ) : (
                        <button onClick={handleNewOrgSurvey} className="bg-mid text-white font-semibold hover:bg-accent transition-all cursor-pointer" style={{ fontSize: 'var(--fs-12)', padding: '8px 22px', borderRadius: '8px' }}>Contestar</button>
                      )}
                    </div>
                  </div>
                )}

                {hasTechPerm && (
                  <div className="bg-white rounded-2xl border border-border/40 shadow-sm card-hover-lift" style={{ padding: '22px 24px' }}>
                    <div className="flex items-center" style={{ gap: '10px', marginBottom: '12px' }}>
                      <div className="inline-flex items-center justify-center rounded-full shrink-0" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #0047AB15, #0047AB08)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0047AB" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-navy truncate" style={{ fontSize: 'var(--fs-13)', marginBottom: '1px' }}>Prueba de Tecnologia</h3>
                        {latestTech ? (
                          <p className="text-muted truncate" style={{ fontSize: 'var(--fs-10)' }}>{new Date(latestTech.savedAt).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        ) : (
                          <p className="text-muted" style={{ fontSize: 'var(--fs-10)' }}>Pendiente</p>
                        )}
                      </div>
                      {latestTech ? (
                        <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)', color: '#22c55e' }}><Check style={{ width: 'var(--fs-11)', height: 'var(--fs-11)' }} /></span>
                      ) : (
                        <span style={{ fontSize: 'var(--fs-9)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)', color: '#f59e0b', fontWeight: 700 }}>...</span>
                      )}
                    </div>

                    {latestTech && (
                      <div className="flex flex-wrap" style={{ gap: '12px', marginBottom: '12px' }}>
                        <div><p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: 'var(--fs-8)', marginBottom: '1px' }}>Score</p><p className={`font-bold ${MATURITY_COLORS[latestTech.maturityLevel] || 'text-ink'}`} style={{ fontSize: 'var(--fs-12)' }}>{latestTech.maturityScore}/100</p></div>
                        <div><p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: 'var(--fs-8)', marginBottom: '1px' }}>Nivel</p><p className={`font-bold ${MATURITY_COLORS[latestTech.maturityLevel] || 'text-ink'}`} style={{ fontSize: 'var(--fs-12)' }}>{MATURITY_LABELS[latestTech.maturityLevel] || latestTech.maturityLevel}</p></div>
                        <div><p className="text-muted uppercase tracking-wide font-medium" style={{ fontSize: 'var(--fs-8)', marginBottom: '1px' }}>ERP</p><p className="text-ink font-semibold" style={{ fontSize: 'var(--fs-12)' }}>{latestTech.tools.tieneERP ? 'Sí' : 'No'}</p></div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center" style={{ gap: '8px' }}>
                      {latestTech ? (
                        <>
                          <TechReportButton survey={latestTech} />
                          <button onClick={() => exportTechSurveyToPdf(latestTech)} className="border border-accent text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer" style={{ fontSize: 'var(--fs-11)', padding: 'var(--sp-btn-d)', borderRadius: '8px' }}>PDF</button>
                          <button onClick={handleNewTechSurvey} className="text-accent font-medium hover:underline cursor-pointer" style={{ fontSize: 'var(--fs-11)', background: 'none', padding: '0' }}>Repetir</button>
                        </>
                      ) : (
                        <button onClick={handleNewTechSurvey} className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer" style={{ fontSize: 'var(--fs-12)', padding: '8px 22px', borderRadius: '8px' }}>Contestar</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ EXPEDIENTE PDF (A6 stagger) ═══ */}
          {canDownloadExpediente && (
            <div className="stagger-4 bg-white rounded-2xl border shadow-sm card-hover-lift" style={{ padding: '22px 28px', borderColor: '#d4922e33' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
                <div className="flex items-center" style={{ gap: '12px' }}>
                  <div className="inline-flex items-center justify-center rounded-full shrink-0" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #d4922e15, #d4922e08)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4922e" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-navy" style={{ fontSize: 'var(--fs-13)', marginBottom: '1px' }}>Expediente del Cliente</h3>
                    <p className="text-muted" style={{ fontSize: 'var(--fs-10)' }}>PDF combinado con todas sus encuestas</p>
                  </div>
                </div>
                <span style={{ fontSize: 'var(--fs-9)', padding: '3px 10px', borderRadius: '6px', border: '1px solid #d4922e30', background: '#d4922e08', color: '#d4922e', fontWeight: 700 }}>Disponible</span>
              </div>
              <div className="flex flex-wrap" style={{ gap: '8px' }}>
                <button onClick={() => handleExpediente('view')} style={{ fontSize: 'var(--fs-11)', padding: '7px 16px', borderRadius: '8px', background: '#d4922e', color: 'white', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#c07f20'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#d4922e'; }}>
                  Ver Expediente
                </button>
                <button onClick={() => handleExpediente('download')} style={{ fontSize: 'var(--fs-11)', padding: '7px 16px', borderRadius: '8px', background: 'transparent', color: '#d4922e', fontWeight: 600, cursor: 'pointer', border: '1px solid #d4922e40', transition: 'all 0.2s' }}>
                  Descargar PDF
                </button>
              </div>
            </div>
          )}

          {/* ═══ MIS ENCUESTAS ANTERIORES ═══ */}
          {(diagnostics.length + orgSurveys.length + techSurveys.length) > 1 && (
            <SurveyHistorySection
              diagnostics={diagnostics}
              orgSurveys={orgSurveys}
              techSurveys={techSurveys}
              hasDiagPerm={hasDiagPerm}
              hasOrgPerm={hasOrgPerm}
              hasTechPerm={hasTechPerm}
              onViewDiagReport={handleViewReport}
              onExportDiagPdf={exportToPdf}
              onExportDiagExcel={exportToExcel}
            />
          )}

          {/* ═══ A13 — HISTORICAL COMPARISON ═══ */}
          {diagnostics.length >= 2 && (
            <div className="stagger-5" style={{ marginTop: '24px' }}>
              <HistoricalComparison diagnostics={diagnostics} />
            </div>
          )}

          {/* ═══ A1 — BRANDED FOOTER ═══ */}
          <div className="stagger-5" style={{ marginTop: '40px', textAlign: 'center' }}>
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #d4922e40, transparent)', marginBottom: '16px' }} />
            <img src={companyLogoIcon || '/icon-complement.svg'} alt="Complement" style={{ height: '20px', opacity: 0.3, marginBottom: '6px' }} />
            <p style={{ fontSize: 'var(--fs-10)', color: '#9ca3af', letterSpacing: '0.05em' }}>
              Complement Consulting Group
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function OrgReportButton({ survey }: { survey: SavedOrgSurvey }) {
  const nav = useOrgReportNav();
  return (
    <button onClick={() => nav(survey)} className="bg-mid text-white font-semibold hover:bg-accent transition-all cursor-pointer" style={{ fontSize: 'var(--fs-12)', padding: '8px 20px', borderRadius: '8px' }}>
      Ver Reporte
    </button>
  );
}

function TechReportButton({ survey }: { survey: SavedTechSurvey }) {
  const nav = useTechReportNav();
  return (
    <button onClick={() => nav(survey)} className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer" style={{ fontSize: 'var(--fs-12)', padding: '8px 20px', borderRadius: '8px' }}>
      Ver Reporte
    </button>
  );
}

/* ═══ SURVEY HISTORY SECTION ═══ */

type TabKey = 'diag' | 'org' | 'tech';

function SurveyHistorySection({
  diagnostics,
  orgSurveys,
  techSurveys,
  hasDiagPerm,
  hasOrgPerm,
  hasTechPerm,
  onViewDiagReport,
  onExportDiagPdf,
  onExportDiagExcel,
}: {
  diagnostics: SavedDiagnostic[];
  orgSurveys: SavedOrgSurvey[];
  techSurveys: SavedTechSurvey[];
  hasDiagPerm: boolean;
  hasOrgPerm: boolean;
  hasTechPerm: boolean;
  onViewDiagReport: (d: SavedDiagnostic) => void;
  onExportDiagPdf: (d: SavedDiagnostic) => void;
  onExportDiagExcel: (d: SavedDiagnostic) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('diag');

  // Build available tabs
  const tabs: { key: TabKey; label: string; count: number; icon: LucideIcon; color: string }[] = [];
  if (hasDiagPerm && diagnostics.length > 0) tabs.push({ key: 'diag', label: 'Radiografía', count: diagnostics.length, icon: ClipboardList, color: '#d4922e' });
  if (hasOrgPerm && orgSurveys.length > 0) tabs.push({ key: 'org', label: 'Estructura', count: orgSurveys.length, icon: Building2, color: '#6366f1' });
  if (hasTechPerm && techSurveys.length > 0) tabs.push({ key: 'tech', label: 'Tecnologia', count: techSurveys.length, icon: Monitor, color: '#0047AB' });

  if (tabs.length === 0) return null;

  // Make sure activeTab is valid
  const validTab = tabs.find(t => t.key === activeTab) ? activeTab : tabs[0].key;

  return (
    <div className="stagger-5" style={{ marginTop: '24px' }}>
      <div className="bg-white rounded-2xl border border-border/40 shadow-sm overflow-hidden">
        {/* Header */}
        <div style={{ padding: '18px 24px 0', borderBottom: '1px solid #e5e7eb' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
            <div className="flex items-center" style={{ gap: '10px' }}>
              <div className="inline-flex items-center justify-center rounded-full shrink-0" style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #1b2a4a15, #1b2a4a08)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b2a4a" strokeWidth="2" strokeLinecap="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
              </div>
              <div>
                <h2 className="font-bold text-navy" style={{ fontSize: 'var(--fs-14)' }}>Mis Encuestas Anteriores</h2>
                <p className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>Consulta y descarga tus encuestas completadas</p>
              </div>
            </div>
            <span className="text-muted font-semibold" style={{ fontSize: 'var(--fs-11)', background: '#f3f4f6', padding: '4px 10px', borderRadius: '6px' }}>
              {diagnostics.length + orgSurveys.length + techSurveys.length} total
            </span>
          </div>

          {/* Tabs */}
          {tabs.length > 1 && (
            <div className="flex" style={{ gap: '0' }}>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    fontSize: 'var(--fs-12)',
                    padding: '8px 16px',
                    fontWeight: validTab === tab.key ? 700 : 500,
                    color: validTab === tab.key ? tab.color : '#9ca3af',
                    borderBottom: validTab === tab.key ? `2px solid ${tab.color}` : '2px solid transparent',
                    background: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <tab.icon style={{ display: 'inline', width: 'var(--fs-13)', height: 'var(--fs-13)', marginRight: '4px', verticalAlign: '-2px' }} />
                  {tab.label}
                  <span style={{ marginLeft: '6px', fontSize: 'var(--fs-10)', background: validTab === tab.key ? `${tab.color}15` : '#f3f4f6', color: validTab === tab.key ? tab.color : '#9ca3af', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '16px 24px 20px', maxHeight: '400px', overflowY: 'auto' }}>
          {validTab === 'diag' && diagnostics.map((d, i) => (
            <DiagRow key={d.id} diag={d} isLatest={i === 0} onViewReport={onViewDiagReport} onExportPdf={onExportDiagPdf} onExportExcel={onExportDiagExcel} />
          ))}
          {validTab === 'org' && orgSurveys.map((s, i) => (
            <OrgRow key={s.id} survey={s} isLatest={i === 0} />
          ))}
          {validTab === 'tech' && techSurveys.map((s, i) => (
            <TechRow key={s.id} survey={s} isLatest={i === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DiagRow({ diag, isLatest, onViewReport, onExportPdf, onExportExcel }: {
  diag: SavedDiagnostic;
  isLatest: boolean;
  onViewReport: (d: SavedDiagnostic) => void;
  onExportPdf: (d: SavedDiagnostic) => void;
  onExportExcel: (d: SavedDiagnostic) => void;
}) {
  const date = new Date(diag.savedAt);
  const profAvg = diag.profesionalizacion.average;
  const instAvg = diag.institucionalizacion.average;

  return (
    <div
      style={{
        padding: '14px 0',
        borderBottom: '1px solid #f3f4f6',
      }}
    >
      <div className="flex items-start" style={{ gap: '14px' }}>
        {/* Timeline dot */}
        <div className="shrink-0 flex flex-col items-center" style={{ width: '36px', paddingTop: '4px' }}>
          <div style={{
            width: 'var(--fs-10)', height: 'var(--fs-10)', borderRadius: '50%',
            background: isLatest ? '#d4922e' : '#d1d5db',
            border: isLatest ? '2px solid #d4922e40' : '2px solid #e5e7eb',
          }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center" style={{ gap: '8px', marginBottom: '3px' }}>
            <p className="font-bold text-navy truncate" style={{ fontSize: 'var(--fs-13)' }}>
              {diag.datosGenerales.nombreComercial || 'Sin nombre'}
            </p>
            {isLatest && (
              <span style={{ fontSize: 'var(--fs-8)', padding: '2px 7px', borderRadius: '4px', background: '#d4922e15', color: '#d4922e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Más reciente
              </span>
            )}
          </div>
          <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginBottom: '4px' }}>
            {date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex flex-wrap items-center" style={{ gap: '10px' }}>
            <span style={{ fontSize: 'var(--fs-10)', color: '#6b7280' }}>
              Prof. <span className="font-bold text-navy">{profAvg}%</span>
            </span>
            <span style={{ fontSize: 'var(--fs-10)', color: '#6b7280' }}>
              Inst. <span className="font-bold text-navy">{instAvg}%</span>
            </span>
            <span style={{ fontSize: 'var(--fs-10)', color: '#6b7280' }}>
              Urgencia <span className={`font-bold ${diag.urgenciaLevel === 'Crítica' ? 'text-error' : diag.urgenciaLevel === 'Alta' ? 'text-warn' : 'text-success'}`}>{diag.urgenciaLevel}</span>
            </span>
            <span className="hidden sm:inline" style={{ fontSize: 'var(--fs-10)', color: '#6b7280' }}>
              Tamaño <span className="font-bold text-navy">{diag.companySize.size}</span>
            </span>
          </div>

          {/* Actions — inline on desktop, below on mobile */}
          <div className="flex items-center flex-wrap" style={{ gap: '6px', marginTop: '8px' }}>
            <button
              onClick={() => onViewReport(diag)}
              style={{ fontSize: 'var(--fs-11)', padding: 'var(--sp-btn-d)', borderRadius: '8px', background: '#d4922e', color: 'white', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#c07f20'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#d4922e'; }}
            >
              Ver
            </button>
            <button
              onClick={() => onExportPdf(diag)}
              className="border border-navy/20 text-navy font-semibold hover:bg-navy/5 transition-all cursor-pointer"
              style={{ fontSize: 'var(--fs-10)', padding: '5px 10px', borderRadius: '6px' }}
            >
              PDF
            </button>
            <button
              onClick={() => onExportExcel(diag)}
              className="border border-border text-muted font-medium hover:border-mid/50 hover:text-ink transition-all cursor-pointer"
              style={{ fontSize: 'var(--fs-10)', padding: '5px 10px', borderRadius: '6px' }}
            >
              Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrgRow({ survey, isLatest }: { survey: SavedOrgSurvey; isLatest: boolean }) {
  const nav = useOrgReportNav();
  const date = new Date(survey.savedAt);
  const totalColab = survey.areaDetails.reduce((sum, a) => sum + (a.colaboradores ?? 0), 0);

  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div className="flex items-start" style={{ gap: '14px' }}>
        <div className="shrink-0 flex flex-col items-center" style={{ width: '36px', paddingTop: '4px' }}>
          <div style={{
            width: 'var(--fs-10)', height: 'var(--fs-10)', borderRadius: '50%',
            background: isLatest ? '#6366f1' : '#d1d5db',
            border: isLatest ? '2px solid #6366f140' : '2px solid #e5e7eb',
          }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center" style={{ gap: '8px', marginBottom: '3px' }}>
            <p className="font-bold text-navy truncate" style={{ fontSize: 'var(--fs-13)' }}>{survey.companyName || 'Sin nombre'}</p>
            {isLatest && (
              <span style={{ fontSize: 'var(--fs-8)', padding: '2px 7px', borderRadius: '4px', background: '#6366f115', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Más reciente
              </span>
            )}
          </div>
          <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginBottom: '4px' }}>
            {date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex flex-wrap items-center" style={{ gap: '10px' }}>
            <span style={{ fontSize: 'var(--fs-10)', color: '#6b7280' }}>
              Colaboradores <span className="font-bold text-navy">{totalColab}</span>
            </span>
            <span style={{ fontSize: 'var(--fs-10)', color: '#6b7280' }}>
              Areas <span className="font-bold text-navy">{survey.areaDetails.length}</span>
            </span>
            <span className="hidden sm:inline" style={{ fontSize: 'var(--fs-10)', color: '#6b7280' }}>
              Organigrama <span className="font-bold text-navy">{survey.orgStructure.tieneOrganigrama ? 'Sí' : 'No'}</span>
            </span>
          </div>
          <div className="flex items-center flex-wrap" style={{ gap: '6px', marginTop: '8px' }}>
            <button
              onClick={() => nav(survey)}
              style={{ fontSize: 'var(--fs-11)', padding: 'var(--sp-btn-d)', borderRadius: '8px', background: '#6366f1', color: 'white', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#4f46e5'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#6366f1'; }}
            >
              Ver
            </button>
            <button
              onClick={() => exportOrgSurveyToPdf(survey)}
              className="border border-mid/30 text-mid font-semibold hover:bg-mid/5 transition-all cursor-pointer"
              style={{ fontSize: 'var(--fs-10)', padding: '5px 10px', borderRadius: '6px' }}
            >
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TechRow({ survey, isLatest }: { survey: SavedTechSurvey; isLatest: boolean }) {
  const nav = useTechReportNav();
  const date = new Date(survey.savedAt);

  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div className="flex items-start" style={{ gap: '14px' }}>
        <div className="shrink-0 flex flex-col items-center" style={{ width: '36px', paddingTop: '4px' }}>
          <div style={{
            width: 'var(--fs-10)', height: 'var(--fs-10)', borderRadius: '50%',
            background: isLatest ? '#0047AB' : '#d1d5db',
            border: isLatest ? '2px solid #0047AB40' : '2px solid #e5e7eb',
          }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center" style={{ gap: '8px', marginBottom: '3px' }}>
            <p className="font-bold text-navy truncate" style={{ fontSize: 'var(--fs-13)' }}>{survey.companyName || 'Sin nombre'}</p>
            {isLatest && (
              <span style={{ fontSize: 'var(--fs-8)', padding: '2px 7px', borderRadius: '4px', background: '#0047AB15', color: '#0047AB', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Más reciente
              </span>
            )}
          </div>
          <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginBottom: '4px' }}>
            {date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex flex-wrap items-center" style={{ gap: '10px' }}>
            <span style={{ fontSize: 'var(--fs-10)', color: '#6b7280' }}>
              Score <span className={`font-bold ${MATURITY_COLORS[survey.maturityLevel] || 'text-ink'}`}>{survey.maturityScore}/100</span>
            </span>
            <span style={{ fontSize: 'var(--fs-10)', color: '#6b7280' }}>
              Nivel <span className={`font-bold ${MATURITY_COLORS[survey.maturityLevel] || 'text-ink'}`}>{MATURITY_LABELS[survey.maturityLevel] || survey.maturityLevel}</span>
            </span>
            <span className="hidden sm:inline" style={{ fontSize: 'var(--fs-10)', color: '#6b7280' }}>
              ERP <span className="font-bold text-navy">{survey.tools.tieneERP ? 'Sí' : 'No'}</span>
            </span>
          </div>
          <div className="flex items-center flex-wrap" style={{ gap: '6px', marginTop: '8px' }}>
            <button
              onClick={() => nav(survey)}
              style={{ fontSize: 'var(--fs-11)', padding: 'var(--sp-btn-d)', borderRadius: '8px', background: '#0047AB', color: 'white', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#003680'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0047AB'; }}
            >
              Ver
            </button>
            <button
              onClick={() => exportTechSurveyToPdf(survey)}
              className="border border-accent/30 text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer"
              style={{ fontSize: 'var(--fs-10)', padding: '5px 10px', borderRadius: '6px' }}
            >
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DraftBanner({ icon: Icon, label, step, totalSteps, onResume, onDiscard }: { icon: LucideIcon; label: string; step: number; totalSteps: number; onResume: () => void; onDiscard: () => void; }) {
  const pct = Math.round((step / totalSteps) * 100);
  return (
    <div className="rounded-2xl border-2 border-accent/30 bg-accent/5 shadow-sm animate-fade-up" style={{ padding: 'clamp(14px, 2vw, 18px) clamp(16px, 3vw, 24px)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center" style={{ gap: '10px' }}>
        <div className="flex items-center flex-1 min-w-0" style={{ gap: '14px' }}>
          <div className="inline-flex items-center justify-center rounded-full bg-accent/15 shrink-0" style={{ width: '40px', height: '40px' }}>
            <Icon className="text-accent" style={{ width: 'var(--fs-18)', height: 'var(--fs-18)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center" style={{ gap: '8px', marginBottom: '4px' }}>
              <p className="font-bold text-navy truncate" style={{ fontSize: 'var(--fs-13)' }}>{label}</p>
              <span className="bg-warn/15 text-warn font-bold border border-warn/30 shrink-0" style={{ fontSize: 'var(--fs-9)', padding: '2px 8px', borderRadius: '6px' }}>En progreso</span>
            </div>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <div className="flex-1 rounded-full bg-border/40" style={{ height: '4px', maxWidth: '120px' }}>
                <div className="rounded-full progress-shimmer" style={{ height: '4px', width: `${pct}%`, transition: 'width 0.3s' }} />
              </div>
              <span className="text-muted font-medium shrink-0" style={{ fontSize: 'var(--fs-10)' }}>Paso {step} de {totalSteps}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center shrink-0 self-end sm:self-auto" style={{ gap: '8px' }}>
          <button onClick={onDiscard} className="text-muted hover:text-error font-medium transition-all cursor-pointer" style={{ fontSize: 'var(--fs-11)', padding: '6px 10px', background: 'none' }}>Descartar</button>
          <button onClick={onResume} className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer shadow-sm" style={{ fontSize: 'var(--fs-12)', padding: '8px 20px', borderRadius: '10px' }}>Continuar →</button>
        </div>
      </div>
    </div>
  );
}
