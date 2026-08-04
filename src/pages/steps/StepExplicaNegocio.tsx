import { X } from 'lucide-react';
import { useDiagnosticStore } from '../../store/diagnosticStore';
import type { LineaNegocio, Sucursal } from '../../lib/types';

export default function StepExplicaNegocio() {
  const descripcion = useDiagnosticStore(s => s.descripcionNegocio);
  const setDescripcion = useDiagnosticStore(s => s.setDescripcionNegocio);
  const lineas = useDiagnosticStore(s => s.lineasNegocio);
  const setLineas = useDiagnosticStore(s => s.setLineasNegocio);
  const tieneMultiplesSucursales = useDiagnosticStore(s => s.tieneMultiplesSucursales);
  const setTieneMultiplesSucursales = useDiagnosticStore(s => s.setTieneMultiplesSucursales);
  const sucursales = useDiagnosticStore(s => s.sucursales);
  const setSucursales = useDiagnosticStore(s => s.setSucursales);

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

  function addSucursal() {
    setSucursales([...sucursales, { nombre: '', porcentajeVentas: '' }]);
  }

  function updateSucursal(index: number, partial: Partial<Sucursal>) {
    const next = sucursales.map((s, i) => i === index ? { ...s, ...partial } : s);
    setSucursales(next);
  }

  function removeSucursal(index: number) {
    setSucursales(sucursales.filter((_, i) => i !== index));
  }

  const totalSucursales = sucursales.reduce((sum, s) => sum + (parseFloat(s.porcentajeVentas) || 0), 0);
  const isValidSucursales = sucursales.length === 0 || Math.abs(totalSucursales - 100) < 0.5;

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: 'var(--fs-17)', marginBottom: '8px' }}>Explícanos tu negocio</h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: 'var(--fs-13)', marginBottom: '40px' }}>
        Describa brevemente a qué se dedica su empresa: qué productos o servicios ofrece, quiénes son sus clientes principales, y qué la hace diferente en su mercado.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '10px' }}>
            Descripción del negocio
          </label>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Ej: Somos una empresa familiar dedicada a la manufactura de productos alimenticios para el mercado regional. Nuestros principales clientes son tiendas de autoservicio y distribuidores mayoristas..."
            className="w-full border border-border bg-pale focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none resize-none transition-all leading-relaxed"
            style={{ padding: 'var(--sp-btn-a)', fontSize: 'var(--fs-13)', borderRadius: '12px' }}
            rows={6}
          />
        </div>

        {/* Líneas de negocio */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
            <div>
              <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)' }}>
                Líneas de negocio
              </label>
              <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginTop: '4px' }}>
                Indique las líneas de negocio y el porcentaje que representa cada una (deben sumar 100%).
              </p>
            </div>
            <button
              type="button"
              onClick={addLinea}
              className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer shadow-sm shrink-0"
              style={{ fontSize: 'var(--fs-11)', padding: 'var(--sp-btn-d)', borderRadius: '8px' }}
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
                    style={{ padding: 'var(--sp-btn-b)', gap: '12px' }}
                  >
                    <span className="font-bold text-navy shrink-0" style={{ fontSize: 'var(--fs-12)', minWidth: '24px' }}>
                      {i + 1}.
                    </span>
                    <input
                      type="text"
                      value={linea.nombre}
                      onChange={e => updateLinea(i, { nombre: e.target.value })}
                      placeholder="Nombre de la línea de negocio"
                      className="input-field flex-1"
                      style={{ fontSize: 'var(--fs-12)', padding: '6px 10px', minWidth: '150px' }}
                    />
                    <div className="flex items-center shrink-0" style={{ gap: '5px' }}>
                      <input
                        type="number"
                        value={linea.porcentaje}
                        onChange={e => updateLinea(i, { porcentaje: e.target.value })}
                        min="0"
                        max="100"
                        className="input-field"
                        style={{ maxWidth: '70px', fontSize: 'var(--fs-12)', padding: '6px 8px' }}
                      />
                      <span className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLinea(i)}
                      className="text-muted hover:text-error transition-colors cursor-pointer shrink-0"
                      style={{ lineHeight: 1, padding: '2px 4px', background: 'none' }}
                    >
                      <X style={{ width: 'var(--fs-15)', height: 'var(--fs-15)' }} />
                    </button>
                  </div>
                ))}
              </div>

              {lineas.some(l => l.porcentaje) && (
                <div className="flex items-center justify-end" style={{ marginTop: '10px', gap: '6px' }}>
                  <span className="text-muted font-medium" style={{ fontSize: 'var(--fs-10)' }}>Total:</span>
                  <span
                    className={`font-bold ${isValid ? 'text-success' : 'text-warn'}`}
                    style={{ fontSize: 'var(--fs-12)' }}
                  >
                    {total.toFixed(1)}%
                  </span>
                  {!isValid && (
                    <span className="text-warn" style={{ fontSize: 'var(--fs-10)' }}>
                      (debe sumar 100%)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sucursales */}
        <div>
          <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '10px' }}>
            ¿Cuántas sucursales tienen?
          </label>
          <div className="flex" style={{ gap: '10px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setTieneMultiplesSucursales(false)}
              className={`flex-1 border font-medium transition-all cursor-pointer ${
                tieneMultiplesSucursales === false ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-pale text-muted'
              }`}
              style={{ padding: '10px 16px', borderRadius: '10px', fontSize: 'var(--fs-12)' }}
            >
              Una sucursal
            </button>
            <button
              type="button"
              onClick={() => setTieneMultiplesSucursales(true)}
              className={`flex-1 border font-medium transition-all cursor-pointer ${
                tieneMultiplesSucursales === true ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-pale text-muted'
              }`}
              style={{ padding: '10px 16px', borderRadius: '10px', fontSize: 'var(--fs-12)' }}
            >
              Más de una sucursal
            </button>
          </div>

          {tieneMultiplesSucursales === true && (
            <div className="rounded-2xl border border-accent/20 bg-accent/5" style={{ padding: '16px 20px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                <p className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>
                  Indique el nombre de cada sucursal y el porcentaje de ventas que representa (deben sumar 100%).
                </p>
                <button
                  type="button"
                  onClick={addSucursal}
                  className="bg-accent text-white font-semibold hover:bg-mid transition-all cursor-pointer shadow-sm shrink-0"
                  style={{ fontSize: 'var(--fs-11)', padding: 'var(--sp-btn-d)', borderRadius: '8px', marginLeft: '12px' }}
                >
                  + Agregar
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sucursales.map((sucursal, i) => (
                  <div
                    key={i}
                    className="flex items-center flex-wrap rounded-xl border bg-white border-border/40"
                    style={{ padding: 'var(--sp-btn-b)', gap: '12px' }}
                  >
                    <span className="font-bold text-navy shrink-0" style={{ fontSize: 'var(--fs-12)', minWidth: '24px' }}>
                      {i + 1}.
                    </span>
                    <input
                      type="text"
                      value={sucursal.nombre}
                      onChange={e => updateSucursal(i, { nombre: e.target.value })}
                      placeholder="Nombre o ubicación de la sucursal"
                      className="input-field flex-1"
                      style={{ fontSize: 'var(--fs-12)', padding: '6px 10px', minWidth: '150px' }}
                    />
                    <div className="flex items-center shrink-0" style={{ gap: '5px' }}>
                      <input
                        type="number"
                        value={sucursal.porcentajeVentas}
                        onChange={e => updateSucursal(i, { porcentajeVentas: e.target.value })}
                        min="0"
                        max="100"
                        className="input-field"
                        style={{ maxWidth: '70px', fontSize: 'var(--fs-12)', padding: '6px 8px' }}
                      />
                      <span className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSucursal(i)}
                      className="text-muted hover:text-error transition-colors cursor-pointer shrink-0"
                      style={{ lineHeight: 1, padding: '2px 4px', background: 'none' }}
                    >
                      <X style={{ width: 'var(--fs-15)', height: 'var(--fs-15)' }} />
                    </button>
                  </div>
                ))}
              </div>

              {sucursales.length === 0 && (
                <p className="text-muted" style={{ fontSize: 'var(--fs-11)' }}>Agregue al menos una sucursal.</p>
              )}

              {sucursales.some(s => s.porcentajeVentas) && (
                <div className="flex items-center justify-end" style={{ marginTop: '10px', gap: '6px' }}>
                  <span className="text-muted font-medium" style={{ fontSize: 'var(--fs-10)' }}>Total:</span>
                  <span
                    className={`font-bold ${isValidSucursales ? 'text-success' : 'text-warn'}`}
                    style={{ fontSize: 'var(--fs-12)' }}
                  >
                    {totalSucursales.toFixed(1)}%
                  </span>
                  {!isValidSucursales && (
                    <span className="text-warn" style={{ fontSize: 'var(--fs-10)' }}>
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
