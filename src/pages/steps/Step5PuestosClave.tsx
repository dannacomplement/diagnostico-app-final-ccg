import { useState, useRef, useEffect } from 'react';
import { useDiagnosticStore } from '../../store/diagnosticStore';
import type { CalificadoStatus } from '../../lib/types';
import { formatCurrency } from '../../lib/formatters';


const CALIFICADO_OPTIONS: { value: CalificadoStatus; label: string; color: string }[] = [
  { value: 'si', label: 'Si', color: 'bg-success text-white' },
  { value: 'no', label: 'No', color: 'bg-error/80 text-white' },
  { value: 'por_evaluar', label: 'No lo se', color: 'bg-warn text-white' },
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

const AREA_ICONS: Record<string, string> = {
  'Dirección General': '🏢',
  'Administración y Finanzas': '💼',
  'Comercial y Ventas': '📊',
  'Operaciones': '⚙️',
  'Capital Humano': '👥',
};

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
          <span style={{ fontSize: '18px' }}>{AREA_ICONS[g.area] || '📋'}</span>
          <h3 className="font-bold text-navy" style={{ fontSize: '15px' }}>{g.area}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-ink hover:bg-pale transition-all cursor-pointer rounded-lg"
          style={{ padding: '4px 8px', fontSize: '18px', lineHeight: 1 }}
        >
          ✕
        </button>
      </div>

      {/* Cubierto? */}
      <div className="flex items-center" style={{ gap: '10px', marginBottom: '16px' }}>
        <span className="text-muted font-medium shrink-0" style={{ fontSize: '11px', width: '110px' }}>Puesto cubierto?</span>
        <div className="flex" style={{ gap: '4px' }}>
          <button
            type="button"
            onClick={() => setGerencia(i, { cubierto: true })}
            className={`font-semibold transition-all cursor-pointer
              ${g.cubierto ? 'bg-success text-white' : 'bg-pale text-muted hover:bg-light border border-border'}
            `}
            style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '12px' }}
          >
            Si
          </button>
          <button
            type="button"
            onClick={() => setGerencia(i, { cubierto: false, rangoSueldo: '', esFamiliar: undefined })}
            className={`font-semibold transition-all cursor-pointer
              ${!g.cubierto ? 'bg-error/80 text-white' : 'bg-pale text-muted hover:bg-light border border-border'}
            `}
            style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '12px' }}
          >
            No
          </button>
        </div>
      </div>

      {/* Detail fields — only if covered */}
      {g.cubierto && (
        <div className="border-t border-border/40" style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Antiguedad */}
          <div className="flex items-center" style={{ gap: '8px' }}>
            <span className="text-muted font-medium shrink-0" style={{ fontSize: '11px', width: '110px' }}>Antiguedad:</span>
            <input
              type="number"
              value={g.antiguedad}
              onChange={e => setGerencia(i, { antiguedad: e.target.value })}
              placeholder="Ej: 5"
              min="0"
              className="input-field-sm"
              style={{ maxWidth: '80px' }}
            />
            <span className="text-muted font-medium" style={{ fontSize: '11px' }}>anos</span>
          </div>

          {/* Rango de sueldo */}
          <div className="flex items-center" style={{ gap: '8px' }}>
            <span className="text-muted font-medium shrink-0" style={{ fontSize: '11px', width: '110px' }}>Sueldo mensual:</span>
            <select
              value={g.rangoSueldo || ''}
              onChange={e => setGerencia(i, { rangoSueldo: e.target.value })}
              className="input-field-sm"
              style={{ maxWidth: '160px', fontSize: '11px' }}
            >
              <option value="">Seleccionar...</option>
              {SUELDO_RANGES.map(r => (
                <option key={r} value={r}>${r}</option>
              ))}
            </select>
          </div>

          {/* Es familiar? */}
          <div className="flex items-center" style={{ gap: '8px' }}>
            <span className="text-muted font-medium shrink-0" style={{ fontSize: '11px', width: '110px' }}>Es familiar?</span>
            <div className="flex" style={{ gap: '4px' }}>
              <button
                type="button"
                onClick={() => setGerencia(i, { esFamiliar: true })}
                className={`font-semibold transition-all cursor-pointer
                  ${g.esFamiliar === true ? 'bg-accent text-white' : 'bg-pale text-muted hover:bg-light border border-border'}
                `}
                style={{ padding: '4px 14px', borderRadius: '8px', fontSize: '11px' }}
              >
                Si
              </button>
              <button
                type="button"
                onClick={() => setGerencia(i, { esFamiliar: false })}
                className={`font-semibold transition-all cursor-pointer
                  ${g.esFamiliar === false ? 'bg-navy/70 text-white' : 'bg-pale text-muted hover:bg-light border border-border'}
                `}
                style={{ padding: '4px 14px', borderRadius: '8px', fontSize: '11px' }}
              >
                No
              </button>
            </div>
          </div>

          {/* Calificado? */}
          <div className="flex items-center" style={{ gap: '10px' }}>
            <span className="text-muted font-medium shrink-0" style={{ fontSize: '11px', width: '110px' }}>Calificado?</span>
            <div className="flex" style={{ gap: '4px' }}>
              {CALIFICADO_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGerencia(i, { calificado: opt.value })}
                  className={`font-semibold transition-all cursor-pointer
                    ${g.calificado === opt.value ? opt.color : 'bg-pale text-muted hover:bg-light border border-border'}
                  `}
                  style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '11px' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
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

  const [sueldoFocused, setSueldoFocused] = useState(false);
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

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: '17px', marginBottom: '8px' }}>Gerencias</h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: '13px', marginBottom: '8px' }}>
        Toque cada puesto en la piramide para completar su informacion.
      </p>
      <p className="text-muted" style={{ fontSize: '11px', marginBottom: '32px', fontStyle: 'italic' }}>
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
                : dg.cubierto
                  ? 'border-success/50 bg-success/10 hover:border-success'
                  : 'border-error/30 bg-error/5 hover:border-error/60'
            }`}
            style={{ padding: '10px 24px', minWidth: '190px' }}
          >
            <span style={{ fontSize: '16px' }}>🏢</span>
            <p className="font-bold text-navy" style={{ fontSize: '11px', marginTop: '3px' }}>
              {dg.area}
            </p>
            <p
              className={`font-semibold ${dg.cubierto ? 'text-success' : 'text-error'}`}
              style={{ fontSize: '9px', marginTop: '1px' }}
            >
              {dg.cubierto ? 'Cubierto' : 'No cubierto'}
            </p>
            {nodeSubtext(dg) && (
              <p className="text-muted" style={{ fontSize: '8px', marginTop: '2px' }}>
                {nodeSubtext(dg)}
              </p>
            )}
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
                    : g.cubierto
                      ? 'border-success/40 bg-success/5 hover:border-success'
                      : 'border-error/20 bg-error/5 hover:border-error/40'
                }`}
                style={{ padding: '8px 6px' }}
              >
                <span style={{ fontSize: '13px' }}>{AREA_ICONS[g.area] || '📋'}</span>
                <p className="font-semibold text-navy" style={{ fontSize: '9px', marginTop: '3px', lineHeight: '1.3' }}>
                  {g.area}
                </p>
                <p
                  className={`font-semibold ${g.cubierto ? 'text-success' : 'text-error'}`}
                  style={{ fontSize: '8px', marginTop: '1px' }}
                >
                  {g.cubierto ? 'Cubierto' : 'No cubierto'}
                </p>
                {nodeSubtext(g) && (
                  <p className="text-muted" style={{ fontSize: '7px', marginTop: '2px' }}>
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
        <div className="flex items-center" style={{ gap: '8px' }}>
          <label className="font-medium text-ink shrink-0" style={{ fontSize: '12px' }}>
            Sueldo mas alto mensual:
          </label>
          {sueldoFocused ? (
            <>
              <span className="text-muted font-semibold shrink-0" style={{ fontSize: '13px' }}>$</span>
              <input
                type="number"
                value={situacion.sueldoMasAlto ?? ''}
                onChange={e => updateSituacion({ sueldoMasAlto: e.target.value })}
                onBlur={() => setSueldoFocused(false)}
                placeholder="Ej: 85000"
                min="0"
                className="input-field"
                style={{ maxWidth: '160px' }}
                autoFocus
              />
            </>
          ) : (
            <div
              onClick={() => setSueldoFocused(true)}
              className="input-field cursor-pointer"
              style={{ maxWidth: '200px', minHeight: '38px', display: 'flex', alignItems: 'center' }}
            >
              <span className={situacion.sueldoMasAlto ? 'text-ink font-semibold' : 'text-muted'} style={{ fontSize: '13px' }}>
                {situacion.sueldoMasAlto ? formatCurrency(situacion.sueldoMasAlto) : '$0'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
