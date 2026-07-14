import { useDiagnosticStore } from '../../store/diagnosticStore';
import type { LineaNegocio } from '../../lib/types';

export default function StepExplicaNegocio() {
  const descripcion = useDiagnosticStore(s => s.descripcionNegocio);
  const setDescripcion = useDiagnosticStore(s => s.setDescripcionNegocio);
  const lineas = useDiagnosticStore(s => s.lineasNegocio);
  const setLineas = useDiagnosticStore(s => s.setLineasNegocio);

  function addLinea() {
    setLineas([...lineas, { nombre: '', porcentaje: '' }]);
  }

  function updateLinea(index: number, partial: Partial<LineaNegocio>) {
    const next = lineas.map((l, i) => i === index ? { ...l, ...partial } : l);
    setLineas(next);
  }

  function removeLinea(index: number) {
    setLineas(lineas.filter((_, i) => i !== index));
  }

  const total = lineas.reduce((sum, l) => sum + (parseFloat(l.porcentaje) || 0), 0);
  const isValid = lineas.length === 0 || Math.abs(total - 100) < 0.5;

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: '17px', marginBottom: '8px' }}>Explícanos tu negocio</h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: '13px', marginBottom: '40px' }}>
        Describa brevemente a qué se dedica su empresa: qué productos o servicios ofrece, quiénes son sus clientes principales, y qué la hace diferente en su mercado.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '10px' }}>
            Descripción del negocio
          </label>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Ej: Somos una empresa familiar dedicada a la manufactura de productos alimenticios para el mercado regional. Nuestros principales clientes son tiendas de autoservicio y distribuidores mayoristas..."
            className="w-full border border-border bg-pale focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none resize-none transition-all leading-relaxed"
            style={{ padding: '14px 18px', fontSize: '13px', borderRadius: '12px' }}
            rows={6}
          />
        </div>

        {/* Líneas de negocio */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
            <div>
              <label className="block font-medium text-ink" style={{ fontSize: '12px' }}>
                Líneas de negocio
              </label>
              <p className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>
                Indique las líneas de negocio y el porcentaje que representa cada una (deben sumar 100%).
              </p>
            </div>
            <button
              type="button"
              onClick={addLinea}
              className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer shadow-sm shrink-0"
              style={{ fontSize: '11px', padding: '6px 14px', borderRadius: '8px' }}
            >
              + Agregar
            </button>
          </div>

          {lineas.length > 0 && (
            <div
              className="rounded-2xl border border-accent/20 bg-accent/5"
              style={{ padding: '16px 20px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {lineas.map((linea, i) => (
                  <div
                    key={i}
                    className="flex items-center flex-wrap rounded-xl border bg-white border-border/40"
                    style={{ padding: '10px 16px', gap: '12px' }}
                  >
                    <span className="font-bold text-navy shrink-0" style={{ fontSize: '12px', minWidth: '24px' }}>
                      {i + 1}.
                    </span>
                    <input
                      type="text"
                      value={linea.nombre}
                      onChange={e => updateLinea(i, { nombre: e.target.value })}
                      placeholder="Nombre de la línea de negocio"
                      className="input-field flex-1"
                      style={{ fontSize: '12px', padding: '6px 10px', minWidth: '150px' }}
                    />
                    <div className="flex items-center shrink-0" style={{ gap: '5px' }}>
                      <input
                        type="number"
                        value={linea.porcentaje}
                        onChange={e => updateLinea(i, { porcentaje: e.target.value })}
                        min="0"
                        max="100"
                        className="input-field"
                        style={{ maxWidth: '70px', fontSize: '12px', padding: '6px 8px' }}
                      />
                      <span className="text-muted" style={{ fontSize: '11px' }}>%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLinea(i)}
                      className="text-muted hover:text-error transition-colors cursor-pointer shrink-0"
                      style={{ fontSize: '16px', lineHeight: 1, padding: '2px 4px', background: 'none' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {lineas.some(l => l.porcentaje) && (
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
