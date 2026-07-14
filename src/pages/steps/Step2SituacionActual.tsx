import { useState, useEffect } from 'react';
import { useDiagnosticStore } from '../../store/diagnosticStore';
import type { SocioDetail } from '../../lib/types';

const SIZE_COLORS = {
  Micro: 'bg-blue/10 text-blue border-blue/20',
  Pequena: 'bg-mid/10 text-mid border-mid/20',
  Mediana: 'bg-accent/10 text-accent border-accent/20',
  Grande: 'bg-success/10 text-success border-success/20',
};

function formatMDP(val: number | null): string {
  if (val === null || val === 0) return '';
  return `$${val.toLocaleString('es-MX', { maximumFractionDigits: 1 })} MDP`;
}

export default function Step2SituacionActual() {
  const situacion = useDiagnosticStore(s => s.situacionActual);
  const update = useDiagnosticStore(s => s.updateSituacionActual);
  const isFamilyBusiness = useDiagnosticStore(s => s.isFamilyBusiness);
  const getCompanySize = useDiagnosticStore(s => s.getCompanySize);
  const marginData = useDiagnosticStore(s => s.marginData);
  const updateMarginData = useDiagnosticStore(s => s.updateMarginData);

  const isFamily = isFamilyBusiness();
  const sizeResult = getCompanySize();

  const [ventasFocused, setVentasFocused] = useState(false);

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: '17px', marginBottom: '8px' }}>Situación Actual</h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: '13px', marginBottom: '40px' }}>Información financiera y operativa para clasificar su empresa.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '20px' }}>
          <InlineField label="Ventas anuales" required suffix="MDP">
            {ventasFocused ? (
              <input
                type="number"
                value={situacion.ventasAnualesMDP ?? ''}
                onChange={e => update({ ventasAnualesMDP: e.target.value ? Number(e.target.value) : null })}
                onBlur={() => setVentasFocused(false)}
                placeholder=""
                step="0.1"
                min="0"
                className="input-field"
                style={{ maxWidth: '140px' }}
                autoFocus
              />
            ) : (
              <div
                onClick={() => setVentasFocused(true)}
                className="input-field cursor-pointer"
                style={{ maxWidth: '160px', minHeight: '38px', display: 'flex', alignItems: 'center' }}
              >
                <span className={situacion.ventasAnualesMDP ? 'text-ink font-semibold' : 'text-muted'} style={{ fontSize: '13px' }}>
                  {situacion.ventasAnualesMDP ? formatMDP(situacion.ventasAnualesMDP) : '$0 MDP'}
                </span>
              </div>
            )}
          </InlineField>
          <InlineField label="Empleados totales" required>
            <input
              type="number"
              value={situacion.empleadosTotales ?? ''}
              onChange={e => update({ empleadosTotales: e.target.value ? Number(e.target.value) : null })}
              placeholder=""
              min="1"
              className="input-field"
              style={{ maxWidth: '140px' }}
            />
          </InlineField>
        </div>

        {isFamily && (
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '20px' }}>
            <InlineField label="Empleados familiares" required>
              <input
                type="number"
                value={situacion.empleadosFamiliares ?? ''}
                onChange={e => update({ empleadosFamiliares: e.target.value ? Number(e.target.value) : null })}
                placeholder=""
                min="0"
                className="input-field"
                style={{ maxWidth: '140px' }}
              />
            </InlineField>
            <InlineField label="Familiares en el poder">
              <input
                type="number"
                value={situacion.familiaresEnPoder}
                onChange={e => update({ familiaresEnPoder: e.target.value })}
                placeholder=""
                min="0"
                className="input-field"
                style={{ maxWidth: '100px' }}
              />
            </InlineField>
          </div>
        )}

        <SociosSection />

        <div className="border-t border-border/50" style={{ paddingTop: '32px' }}>
          <h3 className="font-semibold text-navy uppercase tracking-wide" style={{ fontSize: '11px', marginBottom: '20px' }}>Fiscalización</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <FiscalSlider
              label="Ingreso Fiscalizado"
              value={situacion.pctIngresoFiscalizado}
              onChange={v => update({ pctIngresoFiscalizado: v })}
            />
            <FiscalSlider
              label="Egreso Fiscalizado"
              value={situacion.pctEgresoFiscalizado}
              onChange={v => update({ pctEgresoFiscalizado: v })}
            />
          </div>
        </div>

        {sizeResult && (
          <div className="border-t border-border/50" style={{ paddingTop: '32px' }}>
            <h3 className="font-semibold text-navy uppercase tracking-wide" style={{ fontSize: '11px', marginBottom: '24px' }}>Resultado del análisis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '20px' }}>
              <div className={`rounded-xl border-2 text-center ${(SIZE_COLORS as any)[sizeResult.size] || 'border-border bg-pale'}`} style={{ padding: '20px 16px' }}>
                <p className="font-medium uppercase tracking-wide opacity-70" style={{ fontSize: '10px', marginBottom: '6px' }}>Tamaño de empresa</p>
                <p className="font-bold" style={{ fontSize: '18px' }}>{sizeResult.size}</p>
                <p className="opacity-70" style={{ fontSize: '11px', marginTop: '6px' }}>TMC: {sizeResult.tmcScore}</p>
              </div>
              <div className="rounded-xl border border-border text-center bg-pale" style={{ padding: '20px 16px' }}>
                <p className="font-medium uppercase tracking-wide text-muted" style={{ fontSize: '10px', marginBottom: '6px' }}>Productividad per capita</p>
                <p className="font-bold text-ink" style={{ fontSize: '18px' }}>${sizeResult.productivityIndex.toFixed(2)}</p>
                <p className="text-muted" style={{ fontSize: '10px', marginTop: '6px' }}>MDP por empleado</p>
              </div>
              <div className="rounded-xl border border-border text-center bg-pale" style={{ padding: '20px 16px' }}>
                <p className="font-medium uppercase tracking-wide text-muted" style={{ fontSize: '10px', marginBottom: '6px' }}>Puntaje TMC</p>
                <p className="font-bold text-ink" style={{ fontSize: '18px' }}>{sizeResult.tmcScore}</p>
                <p className="text-muted" style={{ fontSize: '11px', marginTop: '6px' }}>(Trabajadores x 10%) + (Ventas x 90%)</p>
              </div>
            </div>
          </div>
        )}

        {/* Datos Financieros — Margenes */}
        <div className="border-t border-border/50" style={{ paddingTop: '32px' }}>
          <h3 className="font-semibold text-navy uppercase tracking-wide" style={{ fontSize: '11px', marginBottom: '10px' }}>Datos Financieros</h3>
          <p className="text-muted" style={{ fontSize: '12px', marginBottom: '20px' }}>
            Indique qué márgenes financieros conoce de su empresa.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '20px' }}>
            {/* Margen Bruto */}
            <div className="rounded-xl border border-border/50 bg-pale/50" style={{ padding: '14px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
                <span className="font-medium text-ink" style={{ fontSize: '12px' }}>Margen Bruto</span>
                <div className="flex" style={{ gap: '4px' }}>
                  <button type="button" onClick={() => updateMarginData({ conoceMargenBruto: true })}
                    className={`font-semibold transition-all cursor-pointer ${marginData.conoceMargenBruto ? 'bg-accent text-white' : 'bg-white text-muted border border-border'}`}
                    style={{ padding: '2px 10px', borderRadius: '6px', fontSize: '10px' }}>Sí</button>
                  <button type="button" onClick={() => updateMarginData({ conoceMargenBruto: false, margenBruto: null })}
                    className={`font-semibold transition-all cursor-pointer ${marginData.conoceMargenBruto === false ? 'bg-navy/70 text-white' : 'bg-white text-muted border border-border'}`}
                    style={{ padding: '2px 10px', borderRadius: '6px', fontSize: '10px' }}>No</button>
                </div>
              </div>
              {marginData.conoceMargenBruto && (
                <InlineField label="" suffix="%">
                  <input type="number" value={marginData.margenBruto ?? ''} onChange={e => updateMarginData({ margenBruto: e.target.value ? Number(e.target.value) : null })} step="0.1" className="input-field" style={{ maxWidth: '90px' }} />
                </InlineField>
              )}
            </div>

            {/* Margen Operativo */}
            <div className="rounded-xl border border-border/50 bg-pale/50" style={{ padding: '14px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
                <span className="font-medium text-ink" style={{ fontSize: '12px' }}>M. Operativo</span>
                <div className="flex" style={{ gap: '4px' }}>
                  <button type="button" onClick={() => updateMarginData({ conoceMargenOperativo: true })}
                    className={`font-semibold transition-all cursor-pointer ${marginData.conoceMargenOperativo ? 'bg-accent text-white' : 'bg-white text-muted border border-border'}`}
                    style={{ padding: '2px 10px', borderRadius: '6px', fontSize: '10px' }}>Sí</button>
                  <button type="button" onClick={() => updateMarginData({ conoceMargenOperativo: false, margenOperativo: null })}
                    className={`font-semibold transition-all cursor-pointer ${marginData.conoceMargenOperativo === false ? 'bg-navy/70 text-white' : 'bg-white text-muted border border-border'}`}
                    style={{ padding: '2px 10px', borderRadius: '6px', fontSize: '10px' }}>No</button>
                </div>
              </div>
              {marginData.conoceMargenOperativo && (
                <InlineField label="" suffix="%">
                  <input type="number" value={marginData.margenOperativo ?? ''} onChange={e => updateMarginData({ margenOperativo: e.target.value ? Number(e.target.value) : null })} step="0.1" className="input-field" style={{ maxWidth: '90px' }} />
                </InlineField>
              )}
            </div>

            {/* Margen Neto */}
            <div className="rounded-xl border border-border/50 bg-pale/50" style={{ padding: '14px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
                <span className="font-medium text-ink" style={{ fontSize: '12px' }}>M. Neto</span>
                <div className="flex" style={{ gap: '4px' }}>
                  <button type="button" onClick={() => updateMarginData({ conoceMargenNeto: true })}
                    className={`font-semibold transition-all cursor-pointer ${marginData.conoceMargenNeto ? 'bg-accent text-white' : 'bg-white text-muted border border-border'}`}
                    style={{ padding: '2px 10px', borderRadius: '6px', fontSize: '10px' }}>Sí</button>
                  <button type="button" onClick={() => updateMarginData({ conoceMargenNeto: false, margenNeto: null })}
                    className={`font-semibold transition-all cursor-pointer ${marginData.conoceMargenNeto === false ? 'bg-navy/70 text-white' : 'bg-white text-muted border border-border'}`}
                    style={{ padding: '2px 10px', borderRadius: '6px', fontSize: '10px' }}>No</button>
                </div>
              </div>
              {marginData.conoceMargenNeto && (
                <InlineField label="" suffix="%">
                  <input type="number" value={marginData.margenNeto ?? ''} onChange={e => updateMarginData({ margenNeto: e.target.value ? Number(e.target.value) : null })} step="0.1" className="input-field" style={{ maxWidth: '90px' }} />
                </InlineField>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Dynamic socios section — adjusts detail rows based on number entered */
function SociosSection() {
  const situacion = useDiagnosticStore(s => s.situacionActual);
  const update = useDiagnosticStore(s => s.updateSituacionActual);
  const datos = useDiagnosticStore(s => s.datosGenerales);

  const respondentIsSocio = datos.esSocio === 'si';
  const respondentPct = datos.porcentajeAcciones;
  const respondentName = datos.respondente;

  const numSociosRaw = parseInt(situacion.socios, 10) || 0;
  const numSocios = Math.min(numSociosRaw, 15);
  const detalle = situacion.sociosDetalle ?? [];

  // Sync the detail array length with the socios count, pre-fill first socio with respondent data
  useEffect(() => {
    if (numSocios < 1) {
      if (detalle.length > 0) update({ sociosDetalle: [] });
      return;
    }
    if (detalle.length === numSocios) return;

    const next: SocioDetail[] = [];
    for (let i = 0; i < numSocios; i++) {
      if (i === 0 && !detalle[0] && respondentIsSocio) {
        next.push({ nombre: respondentName || '', esFamiliar: null, porcentaje: respondentPct || '' });
      } else {
        next.push(detalle[i] ?? { nombre: '', esFamiliar: null, porcentaje: '' });
      }
    }
    update({ sociosDetalle: next });
  }, [numSocios]); // eslint-disable-line react-hooks/exhaustive-deps

  function setSocio(index: number, partial: Partial<SocioDetail>) {
    const arr = [...(situacion.sociosDetalle ?? [])];
    arr[index] = { ...arr[index], ...partial };
    update({ sociosDetalle: arr });
  }

  return (
    <div>
      <InlineField label="Número de socios" required>
        <input
          type="number"
          value={situacion.socios}
          onChange={e => update({ socios: e.target.value })}
          placeholder=""
          min="0"
          max="15"
          className="input-field"
          style={{ maxWidth: '100px' }}
        />
      </InlineField>

      {numSocios > 0 && detalle.length === numSocios && (
        <div
          className="rounded-2xl border border-accent/20 bg-accent/5"
          style={{ marginTop: '16px', padding: '18px 20px' }}
        >
          <p className="text-muted font-medium" style={{ fontSize: '11px', marginBottom: '14px' }}>
            Detalle de cada socio:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {detalle.map((s, i) => {
              const isRespondent = i === 0 && respondentIsSocio;
              return (
              <div
                key={i}
                className={`flex items-center flex-wrap rounded-xl border ${isRespondent ? 'bg-accent/5 border-accent/30' : 'bg-white border-border/40'}`}
                style={{ padding: '10px 16px', gap: '12px' }}
              >
                <div className="shrink-0" style={{ minWidth: '50px' }}>
                  <span className="font-bold text-navy block" style={{ fontSize: '12px' }}>
                    Socio {i + 1}
                  </span>
                  {isRespondent && (
                    <span className="text-accent font-semibold block" style={{ fontSize: '9px' }}>
                      (Respondiente)
                    </span>
                  )}
                </div>

                {/* Nombre */}
                <input
                  type="text"
                  value={s.nombre ?? ''}
                  onChange={e => setSocio(i, { nombre: e.target.value })}
                  placeholder="Nombre del socio"
                  className="input-field"
                  style={{ maxWidth: '160px', fontSize: '12px', padding: '4px 8px' }}
                />

                {/* Es familiar? */}
                <div className="flex items-center" style={{ gap: '6px' }}>
                  <span className="text-muted font-medium shrink-0" style={{ fontSize: '11px' }}>Familiar?</span>
                  <button
                    type="button"
                    onClick={() => setSocio(i, { esFamiliar: true })}
                    className={`font-semibold transition-all cursor-pointer ${
                      s.esFamiliar === true
                        ? 'bg-accent text-white'
                        : 'bg-pale text-muted hover:bg-light border border-border'
                    }`}
                    style={{ padding: '3px 12px', borderRadius: '7px', fontSize: '11px' }}
                  >
                    Si
                  </button>
                  <button
                    type="button"
                    onClick={() => setSocio(i, { esFamiliar: false })}
                    className={`font-semibold transition-all cursor-pointer ${
                      s.esFamiliar === false
                        ? 'bg-navy/70 text-white'
                        : 'bg-pale text-muted hover:bg-light border border-border'
                    }`}
                    style={{ padding: '3px 12px', borderRadius: '7px', fontSize: '11px' }}
                  >
                    No
                  </button>
                </div>

                {/* Porcentaje */}
                <div className="flex items-center" style={{ gap: '5px' }}>
                  <span className="text-muted font-medium shrink-0" style={{ fontSize: '11px' }}>%&nbsp;empresa:</span>
                  <input
                    type="number"
                    value={s.porcentaje}
                    onChange={e => setSocio(i, { porcentaje: e.target.value })}
                    placeholder=""
                    min="0"
                    max="100"
                    className="input-field"
                    style={{ maxWidth: '70px', fontSize: '12px', padding: '4px 8px' }}
                  />
                  <span className="text-muted" style={{ fontSize: '11px' }}>%</span>
                </div>
              </div>
              );
            })}
          </div>

          {/* Total % indicator */}
          {detalle.some(s => s.porcentaje) && (() => {
            const total = detalle.reduce((sum, s) => sum + (parseFloat(s.porcentaje) || 0), 0);
            const isValid = Math.abs(total - 100) < 0.5;
            return (
              <div className="flex items-center justify-end" style={{ marginTop: '10px', gap: '6px' }}>
                <span className="text-muted font-medium" style={{ fontSize: '10px' }}>Total:</span>
                <span
                  className={`font-bold ${isValid ? 'text-success' : 'text-warn'}`}
                  style={{ fontSize: '12px' }}
                >
                  {total.toFixed(1)}%
                </span>
                {!isValid && (
                  <span className="text-warn" style={{ fontSize: '10px' }}>
                    (debe sumar 100%)
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function FiscalSlider({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  const pct = value ?? 0;
  const color = pct >= 75 ? 'var(--color-success)' : pct >= 40 ? 'var(--color-accent)' : 'var(--color-warn)';

  return (
    <div className="rounded-xl border border-border/50 bg-pale/50" style={{ padding: '14px 20px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
        <span className="font-medium text-ink" style={{ fontSize: '13px' }}>{label}</span>
        <span className="font-bold" style={{ fontSize: '20px', color, minWidth: '52px', textAlign: 'right' }}>
          {pct}%
        </span>
      </div>
      <div style={{ position: 'relative' }}>
        <div className="rounded-full" style={{ height: '8px', background: 'var(--color-border)', width: '100%', position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}>
          <div className="rounded-full transition-all" style={{ height: '100%', width: `${pct}%`, background: color }} />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={pct}
          onChange={e => onChange(Number(e.target.value))}
          className="fiscal-slider"
          style={{ width: '100%', position: 'relative', cursor: 'pointer' }}
        />
      </div>
      <div className="flex justify-between" style={{ marginTop: '6px' }}>
        <span className="text-muted" style={{ fontSize: '9px' }}>0%</span>
        <span className="text-muted" style={{ fontSize: '9px' }}>25%</span>
        <span className="text-muted" style={{ fontSize: '9px' }}>50%</span>
        <span className="text-muted" style={{ fontSize: '9px' }}>75%</span>
        <span className="text-muted" style={{ fontSize: '9px' }}>100%</span>
      </div>
    </div>
  );
}

function InlineField({ label, required, prefix, suffix, children }: { label: string; required?: boolean; prefix?: string; suffix?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center" style={{ gap: '8px' }}>
      <label className="font-medium text-ink shrink-0" style={{ fontSize: '12px' }}>
        {label}{required && <span className="text-error" style={{ marginLeft: '3px' }}>*</span>}:
      </label>
      {prefix && <span className="text-muted font-semibold shrink-0" style={{ fontSize: '13px' }}>{prefix}</span>}
      {children}
      {suffix && <span className="text-muted font-medium shrink-0" style={{ fontSize: '12px' }}>{suffix}</span>}
    </div>
  );
}
