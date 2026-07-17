import { useOrgSurveyStore } from '../store/orgSurveyStore';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { exportOrgSurveyToPdf } from '../lib/exportOrgPdf';
import type { SavedOrgSurvey } from '../lib/types';

const COMPETITIVENESS_LABELS: Record<string, { label: string; className: string }> = {
  arriba: { label: 'Arriba del mercado', className: 'bg-success/10 border-success/20 text-success' },
  en_rango: { label: 'En rango del mercado', className: 'bg-mid/10 border-mid/20 text-mid' },
  debajo: { label: 'Debajo del mercado', className: 'bg-warn/10 border-warn/20 text-warn' },
  no_se: { label: 'No evaluado', className: 'bg-pale border-border/30 text-muted' },
};

export default function OrgReportPage() {
  const companyName = useOrgSurveyStore(s => s.companyName);
  const orgStructure = useOrgSurveyStore(s => s.orgStructure);
  const areaDetails = useOrgSurveyStore(s => s.areaDetails);
  const talentProcesses = useOrgSurveyStore(s => s.talentProcesses);
  const getTotalColaboradores = useOrgSurveyStore(s => s.getTotalColaboradores);
  const getTotalNomina = useOrgSurveyStore(s => s.getTotalNomina);
  const setView = useDiagnosticStore(s => s.setView);
  const user = useAuthStore(s => s.user);
  const companyLogo = useSettingsStore(s => s.companyLogo);

  const totalColab = getTotalColaboradores();
  const totalNomina = getTotalNomina();
  const areasConLider = areaDetails.filter(a => a.tieneLider).length;
  const areasTotal = areaDetails.length;

  // Compute health indicators
  const liderPercentage = areasTotal > 0 ? Math.round((areasConLider / areasTotal) * 100) : 0;
  const hasOrganigrama = orgStructure.tieneOrganigrama;
  const orgUpdated = orgStructure.organigramaActualizado;
  const descPuesto = orgStructure.descripcionesPuesto;
  const hasTabulador = orgStructure.tieneTabulador;

  // Structure health score (simple 0-100)
  let structureScore = 0;
  if (hasOrganigrama) structureScore += 20;
  if (orgUpdated) structureScore += 10;
  if (descPuesto === 'todas') structureScore += 25;
  else if (descPuesto === 'algunas') structureScore += 10;
  if (hasTabulador) structureScore += 15;
  structureScore += Math.round(liderPercentage * 0.3); // up to 30 points for leader coverage

  const structureLevel = structureScore >= 75 ? 'Avanzado' : structureScore >= 50 ? 'Bueno' : structureScore >= 25 ? 'En desarrollo' : 'Inicial';
  function handleDownloadPdf() {
    const survey: SavedOrgSurvey = {
      id: 'report-preview',
      savedAt: new Date().toISOString(),
      companyName,
      orgStructure: { ...orgStructure },
      areaDetails: areaDetails.map(a => ({ ...a })),
      talentProcesses: { ...talentProcesses },
    };
    exportOrgSurveyToPdf(survey);
  }

  function handleBack() {
    if (user?.role === 'master') {
      setView('history');
    } else {
      setView('dashboard');
    }
  }

  let sectionNum = 0;
  const nextNum = () => String(++sectionNum).padStart(2, '0');

  return (
    <div style={{ width: '100%', maxWidth: '930px', margin: '0 auto', padding: 'var(--sp-pagepad)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Header */}
      <div className="text-center animate-fade-up" style={{ marginBottom: '36px' }}>
        <h1 className="font-serif text-navy" style={{ fontSize: 'var(--fs-22)', marginBottom: '6px' }}>Reporte de Estructura Organizacional</h1>
        <p className="text-muted" style={{ fontSize: 'var(--fs-12)' }}>
          {companyName || 'Empresa'} — {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Resumen Ejecutivo */}
      <Section title="Resumen Ejecutivo" number={nextNum()}>
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '14px', marginBottom: '14px' }}>
          <MetricBox label="Empresa" value={companyName || '—'} />
          <MetricBox label="Total Colaboradores" value={totalColab.toString()} highlight />
          <MetricBox label="Nómina Mensual" value={`$${totalNomina.toLocaleString('es-MX')}`} />
          <MetricBox label="Áreas" value={areasTotal.toString()} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: '14px' }}>
          <MetricBox label="Áreas con Líder" value={`${areasConLider} de ${areasTotal}`} />
          <MetricBox label="Madurez Organizacional" value={structureLevel} highlight />
          <MetricBox label="Score Estructura" value={`${structureScore}/100`} />
        </div>
      </Section>

      {/* Estructura Organizacional */}
      <Section title="Estructura y Gobierno" number={nextNum()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <StructureRow label="Organigrama formal" value={hasOrganigrama ? 'Sí' : 'No'} positive={hasOrganigrama} />
          {hasOrganigrama && (
            <StructureRow label="Organigrama actualizado" value={orgUpdated ? 'Sí' : 'No'} positive={orgUpdated ?? false} />
          )}
          <StructureRow
            label="Descripciones de puesto"
            value={descPuesto === 'todas' ? 'Todas' : descPuesto === 'algunas' ? 'Algunas' : 'Ninguna'}
            positive={descPuesto === 'todas'}
            warning={descPuesto === 'algunas'}
          />
          <StructureRow label="Tabulador de sueldos" value={hasTabulador ? 'Sí' : 'No'} positive={hasTabulador} />
          <StructureRow
            label="Nómina mensual total"
            value={orgStructure.nominaMensualTotal ? `$${orgStructure.nominaMensualTotal.toLocaleString('es-MX')}` : 'No capturada'}
            positive={!!orgStructure.nominaMensualTotal}
          />
        </div>
      </Section>

      {/* Detalle por Area */}
      <Section title="Detalle por Área" number={nextNum()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Header row */}
          <div className="flex items-center text-muted font-medium uppercase tracking-wide" style={{ gap: '10px', padding: 'var(--sp-btn-d)', fontSize: 'var(--fs-9)' }}>
            <span style={{ flex: 2 }}>Área</span>
            <span style={{ width: '80px', textAlign: 'center' }}>Colaboradores</span>
            <span style={{ width: '100px', textAlign: 'center' }}>Sueldo Prom.</span>
            <span style={{ width: '70px', textAlign: 'center' }}>Líder</span>
            <span style={{ width: '80px', textAlign: 'center' }}>Subtotal</span>
          </div>

          {areaDetails.map((area, i) => {
            const subtotal = (area.colaboradores ?? 0) * (area.sueldoPromedio ?? 0);
            return (
              <div key={i} className="flex items-center rounded-lg bg-pale" style={{ gap: '10px', padding: '12px 14px' }}>
                <span className="font-medium text-ink" style={{ flex: 2, fontSize: 'var(--fs-12)' }}>
                  {area.isCustom && <span className="text-accent" style={{ fontSize: 'var(--fs-10)', marginRight: '4px' }}>*</span>}
                  {area.nombre || 'Sin nombre'}
                </span>
                <span className="text-ink font-semibold text-center" style={{ width: '80px', fontSize: 'var(--fs-12)' }}>
                  {area.colaboradores ?? '—'}
                </span>
                <span className="text-ink text-center" style={{ width: '100px', fontSize: 'var(--fs-12)' }}>
                  {area.sueldoPromedio ? `$${area.sueldoPromedio.toLocaleString('es-MX')}` : '—'}
                </span>
                <span className="text-center" style={{ width: '70px' }}>
                  <span className={`rounded-full font-semibold ${area.tieneLider ? 'bg-success/15 text-success' : 'bg-error/15 text-error'}`} style={{ fontSize: 'var(--fs-10)', padding: '2px 8px' }}>
                    {area.tieneLider ? 'Sí' : 'No'}
                  </span>
                </span>
                <span className="text-ink font-medium text-center" style={{ width: '80px', fontSize: 'var(--fs-11)' }}>
                  ${subtotal.toLocaleString('es-MX')}
                </span>
              </div>
            );
          })}

          {/* Totals row */}
          <div className="flex items-center rounded-lg bg-navy/5 border border-navy/10 font-semibold" style={{ gap: '10px', padding: '14px 14px' }}>
            <span className="text-navy" style={{ flex: 2, fontSize: 'var(--fs-12)' }}>TOTAL</span>
            <span className="text-navy text-center" style={{ width: '80px', fontSize: 'var(--fs-13)' }}>{totalColab}</span>
            <span style={{ width: '100px' }} />
            <span className="text-center" style={{ width: '70px' }}>
              <span className="text-navy" style={{ fontSize: 'var(--fs-11)' }}>{areasConLider}/{areasTotal}</span>
            </span>
            <span className="text-navy text-center" style={{ width: '80px', fontSize: 'var(--fs-12)' }}>
              ${totalNomina.toLocaleString('es-MX')}
            </span>
          </div>
        </div>
      </Section>

      {/* Talento y Capital Humano */}
      <Section title="Talento y Capital Humano" number={nextNum()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <StructureRow
            label="Proceso de reclutamiento"
            value={talentProcesses.procesoReclutamiento ? 'Sí, formalizado' : 'No'}
            positive={talentProcesses.procesoReclutamiento}
          />
          <StructureRow
            label="Evaluaciones de desempeño"
            value={talentProcesses.evaluacionesDesempeno === 'si' ? 'Sí' : talentProcesses.evaluacionesDesempeno === 'parcialmente' ? 'Parcialmente' : 'No'}
            positive={talentProcesses.evaluacionesDesempeno === 'si'}
            warning={talentProcesses.evaluacionesDesempeno === 'parcialmente'}
          />
          <StructureRow
            label="Programa de capacitación"
            value={talentProcesses.programaCapacitacion ? 'Sí' : 'No'}
            positive={talentProcesses.programaCapacitacion}
          />
          <StructureRow
            label="Rotación anual"
            value={talentProcesses.rotacionAnual !== null ? `${talentProcesses.rotacionAnual}%` : 'No capturada'}
            positive={talentProcesses.rotacionAnual !== null && talentProcesses.rotacionAnual < 15}
            warning={talentProcesses.rotacionAnual !== null && talentProcesses.rotacionAnual >= 15 && talentProcesses.rotacionAnual < 30}
          />
        </div>

        {/* Competitiveness badge */}
        {(() => {
          const comp = COMPETITIVENESS_LABELS[talentProcesses.competitividadSueldos] ?? COMPETITIVENESS_LABELS.no_se;
          return (
            <div className={`rounded-xl text-center border ${comp.className}`} style={{ padding: '16px 14px', marginBottom: '20px' }}>
              <p className="font-medium uppercase tracking-wide opacity-70" style={{ fontSize: 'var(--fs-9)', marginBottom: '4px' }}>Competitividad salarial</p>
              <p className="font-bold" style={{ fontSize: 'var(--fs-14)' }}>{comp.label}</p>
            </div>
          );
        })()}

        {/* Reto de capital humano */}
        {talentProcesses.retoCapitalHumano && (
          <div className="rounded-lg bg-navy/5 border border-navy/10" style={{ padding: '16px 20px' }}>
            <p className="font-semibold text-navy uppercase tracking-wide" style={{ fontSize: 'var(--fs-10)', marginBottom: '6px' }}>Principal reto de capital humano</p>
            <p className="text-ink leading-relaxed" style={{ fontSize: 'var(--fs-12)' }}>{talentProcesses.retoCapitalHumano}</p>
          </div>
        )}
      </Section>

      {/* Recomendaciones */}
      <Section title="Recomendaciones" number={nextNum()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!hasOrganigrama && (
            <Recommendation priority="alta" text="Implementar un organigrama formal que defina la estructura jerárquica y funcional de la empresa." />
          )}
          {hasOrganigrama && !orgUpdated && (
            <Recommendation priority="media" text="El organigrama existe pero no está actualizado. Se recomienda revisar y actualizar periódicamente." />
          )}
          {descPuesto === 'ninguna' && (
            <Recommendation priority="alta" text="No existen descripciones de puesto. Documentar roles y responsabilidades es fundamental para la estructura organizacional." />
          )}
          {descPuesto === 'algunas' && (
            <Recommendation priority="media" text="Completar las descripciones de puesto faltantes para estandarizar roles y expectativas." />
          )}
          {!hasTabulador && (
            <Recommendation priority="media" text="Implementar un tabulador de sueldos para garantizar equidad interna y competitividad externa." />
          )}
          {liderPercentage < 100 && (
            <Recommendation
              priority={liderPercentage < 50 ? 'alta' : 'media'}
              text={`Solo ${areasConLider} de ${areasTotal} áreas tienen un líder designado (${liderPercentage}%). Se recomienda cubrir las posiciones de liderazgo faltantes.`}
            />
          )}
          {!talentProcesses.procesoReclutamiento && (
            <Recommendation priority="media" text="Formalizar un proceso de reclutamiento y selección para asegurar la atracción de talento adecuado." />
          )}
          {talentProcesses.evaluacionesDesempeno === 'no' && (
            <Recommendation priority="alta" text="Implementar evaluaciones de desempeño para medir la contribución de los colaboradores y definir planes de desarrollo." />
          )}
          {!talentProcesses.programaCapacitacion && (
            <Recommendation priority="media" text="Desarrollar un programa de capacitación para fortalecer las competencias del equipo." />
          )}
          {talentProcesses.rotacionAnual !== null && talentProcesses.rotacionAnual >= 30 && (
            <Recommendation priority="alta" text={`La rotación anual del ${talentProcesses.rotacionAnual}% es elevada. Analizar causas raíz y desarrollar estrategias de retención.`} />
          )}
          {talentProcesses.rotacionAnual !== null && talentProcesses.rotacionAnual >= 15 && talentProcesses.rotacionAnual < 30 && (
            <Recommendation priority="media" text={`La rotación anual del ${talentProcesses.rotacionAnual}% está en un nivel moderado-alto. Considerar programas de retención y clima laboral.`} />
          )}
          {structureScore >= 75 && (
            <Recommendation priority="baja" text="La estructura organizacional muestra un nivel avanzado. Continuar con mejora continua y optimización de procesos." />
          )}
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
          Reporte generado automaticamente. Contacte a nuestro equipo para profundizar.
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

/* ── StructureRow ─────────────────────────────────────── */

function StructureRow({ label, value, positive, warning }: { label: string; value: string; positive: boolean; warning?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-pale" style={{ padding: 'var(--sp-btn-a)' }}>
      <span className="text-ink font-medium" style={{ fontSize: 'var(--fs-12)' }}>{label}</span>
      <span className={`font-semibold rounded-full ${
        positive ? 'bg-success/15 text-success' :
        warning ? 'bg-warn/15 text-warn' :
        'bg-error/15 text-error'
      }`} style={{ fontSize: 'var(--fs-11)', padding: '3px 12px' }}>
        {value}
      </span>
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
