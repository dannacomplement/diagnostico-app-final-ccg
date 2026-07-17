import { useState, useRef, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Building, Briefcase, BarChart3, Settings, Users, ClipboardList, X } from 'lucide-react';
import { useDiagnosticStore } from '../../store/diagnosticStore';
import type { CalificadoStatus, DGEvaluation } from '../../lib/types';


const CALIFICADO_OPTIONS: { value: CalificadoStatus; label: string; color: string }[] = [
  { value: 'si', label: 'Sí', color: 'bg-success text-white' },
  { value: 'no', label: 'No', color: 'bg-error/80 text-white' },
  { value: 'por_evaluar', label: 'No lo sé', color: 'bg-warn text-white' },
];

const SUELDO_RANGES = [
  '10-15 mil',
  '15-20 mil',
  '20-30 mil',
  '30-40 mil',
  '40-55 mil',
  '55-75 mil',
  '75-90 mil',
  '100-120 mil',
  '120-150 mil',
  '150-200 mil',
  '200+ mil',
];

const DG_NIVEL_ESTUDIOS = [
  { label: 'Sin estudios profesionales', value: 0 },
  { label: 'Carrera técnica / trunca', value: 3 },
  { label: 'Licenciatura', value: 6 },
  { label: 'Posgrado / Maestría', value: 8 },
  { label: 'Formación ejecutiva continua', value: 10 },
];

const DG_EXPERIENCIA = [
  { label: 'Sin experiencia directiva', value: 0 },
  { label: '1-2 años general', value: 2 },
  { label: '1-2 años en el sector', value: 4 },
  { label: '3-5 años general', value: 5 },
  { label: '3-5 años en el sector', value: 7 },
  { label: 'Más de 5 años general', value: 8 },
  { label: 'Más de 5 años en el sector', value: 10 },
];

const DG_SEGUIMIENTO = [
  { label: 'No da seguimiento a resultados', value: 0 },
  { label: 'Revisa solo cuando hay problemas', value: 2 },
  { label: 'Revisa de forma ocasional', value: 4 },
  { label: 'Revisa periódicamente', value: 6 },
  { label: 'Revisa con indicadores y responsables', value: 8 },
  { label: 'Seguimiento formal con KPIs, responsables, fechas y acuerdos', value: 10 },
];

function calcDGScore(ev: DGEvaluation): number | null {
  if (ev.nivelEstudios == null || ev.experienciaLaboral == null || ev.seguimientoResultados == null) return null;
  return ev.nivelEstudios * 0.4 + ev.experienciaLaboral * 0.4 + ev.seguimientoResultados * 0.2;
}

function dgScoreColor(score: number): string {
  if (score >= 8) return 'text-success';
  if (score >= 5) return 'text-warn';
  return 'text-error';
}

function dgScoreLabel(score: number): string {
  if (score >= 8) return 'Excelente';
  if (score >= 6) return 'Bueno';
  if (score >= 4) return 'Regular';
  return 'Bajo';
}

const AREA_ICONS: Record<string, LucideIcon> = {
  'Dirección General': Building,
  'Administración y Finanzas': Briefcase,
  'Comercial y Ventas': BarChart3,
  'Operaciones': Settings,
  'Capital Humano': Users,
};

function DGEvaluationPanel({ evaluation, onChange }: {
  evaluation: DGEvaluation;
  onChange: (ev: DGEvaluation) => void;
}) {
  const score = calcDGScore(evaluation);

  function renderSelect(
    label: string,
    options: { label: string; value: number }[],
    current: number | null,
    onSelect: (v: number) => void,
  ) {
    return (
      <div className="flex items-center" style={{ gap: '8px', marginBottom: '10px' }}>
        <span className="text-muted font-medium shrink-0" style={{ fontSize: 'var(--fs-11)', width: '200px' }}>{label}</span>
        <select
          value={current ?? ''}
          onChange={e => onSelect(Number(e.target.value))}
          className="input-field-sm"
          style={{ flex: 1, fontSize: 'var(--fs-11)' }}
        >
          <option value="">Seleccionar...</option>
          {options.map(opt => (
            <option key={opt.value + opt.label} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="border-t border-accent/20" style={{ marginTop: '16px', paddingTop: '16px' }}>
      <div className="flex items-center" style={{ gap: '8px', marginBottom: '14px' }}>
        <ClipboardList className="text-navy" style={{ width: 'var(--fs-14)', height: 'var(--fs-14)' }} />
        <h4 className="font-bold text-navy" style={{ fontSize: 'var(--fs-12)' }}>Evaluación del Director General</h4>
      </div>

      {renderSelect(
        '1. Nivel de estudios',
        DG_NIVEL_ESTUDIOS,
        evaluation.nivelEstudios,
        v => onChange({ ...evaluation, nivelEstudios: v }),
      )}
      {renderSelect(
        '2. Experiencia laboral general y en el sector',
        DG_EXPERIENCIA,
        evaluation.experienciaLaboral,
        v => onChange({ ...evaluation, experienciaLaboral: v }),
      )}
      {renderSelect(
        '3. Seguimiento de resultados',
        DG_SEGUIMIENTO,
        evaluation.seguimientoResultados,
        v => onChange({ ...evaluation, seguimientoResultados: v }),
      )}

      {score != null && (
        <div className="rounded-xl bg-pale border border-border/50 flex items-center justify-between" style={{ padding: 'var(--sp-btn-c)', marginTop: '4px' }}>
          <span className="font-medium text-ink" style={{ fontSize: 'var(--fs-12)' }}>Calificación Director General</span>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <span className={`font-bold ${dgScoreColor(score)}`} style={{ fontSize: 'var(--fs-18)' }}>
              {score.toFixed(1)}
            </span>
            <span className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>/ 10</span>
            <span className={`font-semibold ${dgScoreColor(score)} rounded-md`} style={{ fontSize: 'var(--fs-9)', padding: '2px 6px', background: 'var(--color-light)' }}>
              {dgScoreLabel(score)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Detail panel for a single gerencia — shown inline when its pyramid node is tapped */
function GerenciaPanel({ g, i, setGerencia, onClose }: {
  g: ReturnType<typeof useDiagnosticStore.getState>['gerencias'][0];
  i: number;
  setGerencia: (index: number, data: any) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  return (
    <div
      ref={panelRef}
      className="rounded-2xl border-2 border-accent/40 bg-white shadow-lg animate-fade-up"
      style={{ padding: '24px', marginTop: '16px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '18px' }}>
        <div className="flex items-center" style={{ gap: '10px' }}>
          {(() => {
            const AreaIcon = AREA_ICONS[g.area] || ClipboardList;
            return <AreaIcon className="text-navy" style={{ width: 'var(--fs-18)', height: 'var(--fs-18)' }} />;
          })()}
          <h3 className="font-bold text-navy" style={{ fontSize: 'var(--fs-15)' }}>{g.area}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-ink hover:bg-pale transition-all cursor-pointer rounded-lg"
          style={{ padding: '4px 8px', lineHeight: 1 }}
        >
          <X style={{ width: 'var(--fs-16)', height: 'var(--fs-16)' }} />
        </button>
      </div>

      {/* Cubierto? */}
      <div className="flex items-center" style={{ gap: '10px', marginBottom: '16px' }}>
        <span className="text-muted font-medium shrink-0" style={{ fontSize: 'var(--fs-11)', width: '110px' }}>Puesto cubierto?</span>
        <div className="flex" style={{ gap: '4px' }}>
          <button
            type="button"
            onClick={() => setGerencia(i, { cubierto: true, soyYo: false })}
            className={`font-semibold transition-all cursor-pointer
              ${g.cubierto === true && !g.soyYo ? 'bg-success text-white' : 'bg-pale text-muted hover:bg-light border border-border'}
            `}
            style={{ padding: '5px 14px', borderRadius: '8px', fontSize: 'var(--fs-12)' }}
          >
            Si
          </button>
          <button
            type="button"
            onClick={() => setGerencia(i, { cubierto: true, soyYo: true })}
            className={`font-semibold transition-all cursor-pointer
              ${g.soyYo ? 'bg-accent text-white' : 'bg-pale text-muted hover:bg-light border border-border'}
            `}
            style={{ padding: '5px 14px', borderRadius: '8px', fontSize: 'var(--fs-12)' }}
          >
            Soy Yo
          </button>
          <button
            type="button"
            onClick={() => setGerencia(i, { cubierto: false, soyYo: false, rangoSueldo: '', esFamiliar: undefined })}
            className={`font-semibold transition-all cursor-pointer
              ${g.cubierto === false ? 'bg-error/80 text-white' : 'bg-pale text-muted hover:bg-light border border-border'}
            `}
            style={{ padding: '5px 14px', borderRadius: '8px', fontSize: 'var(--fs-12)' }}
          >
            No
          </button>
        </div>
      </div>

      {/* Detail fields — only if covered */}
      {g.cubierto && (
        <div className="border-t border-border/40" style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Nombre */}
          <div className="flex items-center" style={{ gap: '8px' }}>
            <span className="text-muted font-medium shrink-0" style={{ fontSize: 'var(--fs-11)', width: '110px' }}>Nombre:</span>
            <input
              type="text"
              value={g.nombre ?? ''}
              onChange={e => setGerencia(i, { nombre: e.target.value })}
              placeholder="Nombre de la persona"
              className="input-field-sm"
              style={{ maxWidth: '200px' }}
            />
          </div>

          {/* Antigüedad */}
          <div className="flex items-center" style={{ gap: '8px' }}>
            <span className="text-muted font-medium shrink-0" style={{ fontSize: 'var(--fs-11)', width: '110px' }}>Antigüedad:</span>
            <input
              type="number"
              value={g.antiguedad}
              onChange={e => setGerencia(i, { antiguedad: e.target.value })}
              placeholder=""
              min="0"
              className="input-field-sm"
              style={{ maxWidth: '80px' }}
            />
            <span className="text-muted font-medium" style={{ fontSize: 'var(--fs-11)' }}>años</span>
          </div>

          {/* Rango de sueldo */}
          <div className="flex items-center" style={{ gap: '8px' }}>
            <span className="text-muted font-medium shrink-0" style={{ fontSize: 'var(--fs-11)', width: '110px' }}>Sueldo mensual:</span>
            <select
              value={g.rangoSueldo || ''}
              onChange={e => setGerencia(i, { rangoSueldo: e.target.value })}
              className="input-field-sm"
              style={{ maxWidth: '160px', fontSize: 'var(--fs-11)' }}
            >
              <option value="">Seleccionar...</option>
              {SUELDO_RANGES.map(r => (
                <option key={r} value={r}>${r}</option>
              ))}
            </select>
          </div>

          {/* Es familiar? */}
          <div className="flex items-center" style={{ gap: '8px' }}>
            <span className="text-muted font-medium shrink-0" style={{ fontSize: 'var(--fs-11)', width: '110px' }}>Es familiar?</span>
            <div className="flex" style={{ gap: '4px' }}>
              <button
                type="button"
                onClick={() => setGerencia(i, { esFamiliar: true })}
                className={`font-semibold transition-all cursor-pointer
                  ${g.esFamiliar === true ? 'bg-accent text-white' : 'bg-pale text-muted hover:bg-light border border-border'}
                `}
                style={{ padding: '4px 14px', borderRadius: '8px', fontSize: 'var(--fs-11)' }}
              >
                Si
              </button>
              <button
                type="button"
                onClick={() => setGerencia(i, { esFamiliar: false })}
                className={`font-semibold transition-all cursor-pointer
                  ${g.esFamiliar === false ? 'bg-navy/70 text-white' : 'bg-pale text-muted hover:bg-light border border-border'}
                `}
                style={{ padding: '4px 14px', borderRadius: '8px', fontSize: 'var(--fs-11)' }}
              >
                No
              </button>
            </div>
          </div>

          {/* Calificado? */}
          <div className="flex items-center" style={{ gap: '10px' }}>
            <span className="text-muted font-medium shrink-0" style={{ fontSize: 'var(--fs-11)', width: '110px' }}>Calificado?</span>
            <div className="flex" style={{ gap: '4px' }}>
              {CALIFICADO_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGerencia(i, { calificado: opt.value })}
                  className={`font-semibold transition-all cursor-pointer
                    ${g.calificado === opt.value ? opt.color : 'bg-pale text-muted hover:bg-light border border-border'}
                  `}
                  style={{ padding: '4px 12px', borderRadius: '8px', fontSize: 'var(--fs-11)' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* DG Evaluation — only for Director General (index 0) */}
          {i === 0 && (
            <DGEvaluationPanel
              evaluation={g.dgEvaluation ?? { nivelEstudios: null, experienciaLaboral: null, seguimientoResultados: null }}
              onChange={ev => setGerencia(i, { dgEvaluation: ev })}
            />
          )}
        </div>
      )}
    </div>
  );
}


export default function Step5Gerencias() {
  const gerencias = useDiagnosticStore(s => s.gerencias);
  const setGerencia = useDiagnosticStore(s => s.setGerencia);
  const situacion = useDiagnosticStore(s => s.situacionActual);
  const updateSituacion = useDiagnosticStore(s => s.updateSituacionActual);

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Director general is index 0, the rest are the 4 gerencias
  const dg = gerencias[0];
  const subGerencias = gerencias.slice(1);

  function togglePanel(index: number) {
    setOpenIndex(prev => prev === index ? null : index);
  }

  /** Summary line for a gerencia node */
  function nodeSubtext(g: typeof dg) {
    if (!g.cubierto) return null;
    const parts: string[] = [];
    if (g.rangoSueldo) parts.push(`$${g.rangoSueldo}`);
    if (g.esFamiliar === true) parts.push('Familiar');
    if (g.antiguedad) parts.push(`${g.antiguedad}a`);
    return parts.length > 0 ? parts.join(' · ') : null;
  }

  const respondentName = useDiagnosticStore(s => s.datosGenerales.respondente);

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: 'var(--fs-17)', marginBottom: '8px' }}>Gerencias</h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: 'var(--fs-13)', marginBottom: '8px' }}>
        Toque cada puesto en la pirámide para completar su información.
      </p>
      <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginBottom: '32px', fontStyle: 'italic' }}>
        Rangos salariales en miles de pesos mensuales.
      </p>

      {/* ═══ INTERACTIVE PYRAMID ═══ */}
      <div style={{ marginBottom: '8px' }}>

        {/* Level 1: Director General (top) */}
        <div className="flex justify-center" style={{ marginBottom: '6px' }}>
          <button
            type="button"
            onClick={() => togglePanel(0)}
            className={`rounded-xl border-2 text-center transition-all cursor-pointer hover:shadow-md ${
              openIndex === 0
                ? 'border-accent bg-accent/5 shadow-md ring-2 ring-accent/20'
                : dg.cubierto === true
                  ? dg.soyYo ? 'border-accent/50 bg-accent/10 hover:border-accent' : 'border-success/50 bg-success/10 hover:border-success'
                  : dg.cubierto === false
                    ? 'border-error/30 bg-error/5 hover:border-error/60'
                    : 'border-border bg-pale hover:border-mid/50'
            }`}
            style={{ padding: '10px 24px', minWidth: '190px' }}
          >
            <Building className="mx-auto text-navy" style={{ width: 'var(--fs-16)', height: 'var(--fs-16)' }} />
            <p className="font-bold text-navy" style={{ fontSize: 'var(--fs-11)', marginTop: '3px' }}>
              {dg.area}
            </p>
            <p
              className={`font-semibold ${dg.cubierto === true ? dg.soyYo ? 'text-accent' : 'text-success' : dg.cubierto === false ? 'text-error' : 'text-muted'}`}
              style={{ fontSize: 'var(--fs-9)', marginTop: '1px' }}
            >
              {dg.cubierto === true ? dg.soyYo ? 'Soy Yo' : 'Cubierto' : dg.cubierto === false ? 'No cubierto' : 'Sin definir'}
            </p>
            {(dg.nombre || (dg.soyYo && respondentName)) && (
              <p className="text-accent/70 font-medium truncate" style={{ fontSize: 'var(--fs-8)', marginTop: '2px', maxWidth: '160px' }}>
                {dg.nombre || respondentName}
              </p>
            )}
            {nodeSubtext(dg) && (
              <p className="text-muted" style={{ fontSize: 'var(--fs-8)', marginTop: '2px' }}>
                {nodeSubtext(dg)}
              </p>
            )}
            {dg.dgEvaluation && (() => {
              const s = calcDGScore(dg.dgEvaluation);
              return s != null ? (
                <p className={`font-bold ${dgScoreColor(s)}`} style={{ fontSize: 'var(--fs-9)', marginTop: '3px' }}>
                  Calif. DG: {s.toFixed(1)}/10
                </p>
              ) : null;
            })()}
          </button>
        </div>

        {/* Panel for DG (inline, below its node) */}
        {openIndex === 0 && (
          <GerenciaPanel
            g={dg}
            i={0}
            setGerencia={setGerencia}
            onClose={() => setOpenIndex(null)}
          />
        )}

        {/* Connector line */}
        <div className="flex justify-center" style={{ margin: '6px 0' }}>
          <div style={{ width: '2px', height: '14px', background: 'var(--color-border)' }} />
        </div>

        {/* Horizontal connector bar */}
        <div className="flex justify-center" style={{ marginBottom: '6px', padding: '0 32px' }}>
          <div style={{
            height: '2px',
            background: 'var(--color-border)',
            width: '100%',
            maxWidth: '520px',
          }} />
        </div>

        {/* Vertical connectors from bar to each sub-gerencia */}
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '0', padding: '0 8px' }}>
          {subGerencias.map((_, idx) => (
            <div key={idx} className="flex justify-center" style={{ height: '10px' }}>
              <div style={{ width: '2px', height: '10px', background: 'var(--color-border)' }} />
            </div>
          ))}
        </div>

        {/* Level 2: 4 Gerencias (bottom row) */}
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '6px', padding: '0 8px' }}>
          {subGerencias.map((g, idx) => {
            const realIndex = idx + 1; // offset because DG is index 0
            return (
              <button
                key={g.area}
                type="button"
                onClick={() => togglePanel(realIndex)}
                className={`rounded-xl border text-center transition-all cursor-pointer hover:shadow-md ${
                  openIndex === realIndex
                    ? 'border-accent bg-accent/5 shadow-md ring-2 ring-accent/20'
                    : g.cubierto === true
                      ? g.soyYo ? 'border-accent/40 bg-accent/5 hover:border-accent' : 'border-success/40 bg-success/5 hover:border-success'
                      : g.cubierto === false
                        ? 'border-error/20 bg-error/5 hover:border-error/40'
                        : 'border-border bg-pale hover:border-mid/40'
                }`}
                style={{ padding: '8px 6px' }}
              >
                {(() => {
                  const AreaIcon = AREA_ICONS[g.area] || ClipboardList;
                  return <AreaIcon className="mx-auto text-navy" style={{ width: 'var(--fs-13)', height: 'var(--fs-13)' }} />;
                })()}
                <p className="font-semibold text-navy" style={{ fontSize: 'var(--fs-9)', marginTop: '3px', lineHeight: '1.3' }}>
                  {g.area}
                </p>
                <p
                  className={`font-semibold ${g.cubierto === true ? g.soyYo ? 'text-accent' : 'text-success' : g.cubierto === false ? 'text-error' : 'text-muted'}`}
                  style={{ fontSize: 'var(--fs-8)', marginTop: '1px' }}
                >
                  {g.cubierto === true ? g.soyYo ? 'Soy Yo' : 'Cubierto' : g.cubierto === false ? 'No cubierto' : 'Sin definir'}
                </p>
                {(g.nombre || (g.soyYo && respondentName)) && (
                  <p className="text-accent/70 font-medium truncate" style={{ fontSize: 'var(--fs-7)', marginTop: '2px', maxWidth: '100px' }}>
                    {g.nombre || respondentName}
                  </p>
                )}
                {nodeSubtext(g) && (
                  <p className="text-muted" style={{ fontSize: 'var(--fs-7)', marginTop: '2px' }}>
                    {nodeSubtext(g)}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Panel for sub-gerencia (inline, below the grid) */}
        {openIndex !== null && openIndex > 0 && (
          <GerenciaPanel
            g={gerencias[openIndex]}
            i={openIndex}
            setGerencia={setGerencia}
            onClose={() => setOpenIndex(null)}
          />
        )}
      </div>

      {/* Sueldo mas alto */}
      <div className="border-t border-border/50" style={{ marginTop: '28px', paddingTop: '24px' }}>
        <div className="flex items-center flex-wrap" style={{ gap: '10px' }}>
          <label className="font-medium text-ink shrink-0" style={{ fontSize: 'var(--fs-12)' }}>
            ¿Cuál gerencia tiene el sueldo más alto?
          </label>
          <select
            value={(() => {
              const coveredWithSueldo = gerencias.filter(g => g.cubierto && g.rangoSueldo);
              const match = coveredWithSueldo.find(g => g.area === situacion.sueldoMasAlto);
              return match ? match.area : situacion.sueldoMasAlto || '';
            })()}
            onChange={e => {
              const selected = gerencias.find(g => g.area === e.target.value);
              updateSituacion({ sueldoMasAlto: e.target.value });
              if (selected?.rangoSueldo) {
                // auto-show the range
              }
            }}
            className="input-field"
            style={{ maxWidth: '240px', fontSize: 'var(--fs-12)' }}
          >
            <option value="">Seleccionar...</option>
            {gerencias.filter(g => g.cubierto && g.rangoSueldo).map(g => (
              <option key={g.area} value={g.area}>
                {g.area} — ${g.rangoSueldo}
              </option>
            ))}
          </select>
        </div>
        {situacion.sueldoMasAlto && (() => {
          const match = gerencias.find(g => g.area === situacion.sueldoMasAlto);
          if (match?.rangoSueldo) {
            return (
              <p className="text-accent font-semibold" style={{ fontSize: 'var(--fs-12)', marginTop: '8px' }}>
                Sueldo: ${match.rangoSueldo}
              </p>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
}
