import { useOrgSurveyStore } from '../../store/orgSurveyStore';

function getAreaIcon(name: string): string {
  if (name === 'Dirección General') return '🏢';
  if (name === 'Administración y Finanzas') return '💼';
  if (name === 'Comercial y Ventas') return '📊';
  if (name === 'Operaciones') return '⚙️';
  if (name === 'Capital Humano') return '👥';
  return '📋';
}

export default function OrgStep2Areas() {
  const areas = useOrgSurveyStore(s => s.areaDetails);
  const setAreaDetail = useOrgSurveyStore(s => s.setAreaDetail);
  const addCustomArea = useOrgSurveyStore(s => s.addCustomArea);
  const removeArea = useOrgSurveyStore(s => s.removeArea);
  const getTotalColaboradores = useOrgSurveyStore(s => s.getTotalColaboradores);
  const getTotalNomina = useOrgSurveyStore(s => s.getTotalNomina);

  const totalColab = getTotalColaboradores();
  const totalNomina = getTotalNomina();

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: '17px', marginBottom: '8px' }}>Detalle por Área</h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: '13px', marginBottom: '36px' }}>
        Para cada área de la empresa, indique el número de colaboradores, sueldo promedio y si cuenta con un líder formal.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {areas.map((area, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-pale"
            style={{ padding: '20px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
              <div className="flex items-center" style={{ gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>{getAreaIcon(area.nombre)}</span>
                {area.isCustom ? (
                  <input
                    type="text"
                    value={area.nombre}
                    onChange={e => setAreaDetail(i, { nombre: e.target.value })}
                    placeholder="Nombre del área"
                    className="input-field-sm font-semibold"
                    style={{ maxWidth: '200px' }}
                  />
                ) : (
                  <h3 className="font-semibold text-ink" style={{ fontSize: '13px' }}>{area.nombre}</h3>
                )}
              </div>
              <div className="flex items-center" style={{ gap: '8px' }}>
                {/* Líder toggle */}
                <span className="text-muted font-medium" style={{ fontSize: '10px' }}>¿Líder formal?</span>
                <div className="flex" style={{ gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setAreaDetail(i, { tieneLider: true })}
                    className={`font-semibold transition-all cursor-pointer ${
                      area.tieneLider ? 'bg-success text-white' : 'bg-white text-muted hover:bg-light border border-border'
                    }`}
                    style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px' }}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setAreaDetail(i, { tieneLider: false })}
                    className={`font-semibold transition-all cursor-pointer ${
                      !area.tieneLider ? 'bg-error/80 text-white' : 'bg-white text-muted hover:bg-light border border-border'
                    }`}
                    style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px' }}
                  >
                    No
                  </button>
                </div>
                {area.isCustom && (
                  <button
                    type="button"
                    onClick={() => removeArea(i)}
                    className="text-muted hover:text-error transition-colors cursor-pointer"
                    style={{ fontSize: '14px', padding: '2px 6px' }}
                    title="Eliminar área"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Inputs */}
            <div className="flex flex-wrap items-center" style={{ gap: '16px' }}>
              <div>
                <label className="block text-muted font-medium" style={{ fontSize: '10px', marginBottom: '4px' }}>
                  # Colaboradores
                </label>
                <input
                  type="number"
                  value={area.colaboradores ?? ''}
                  onChange={e => setAreaDetail(i, { colaboradores: e.target.value ? Number(e.target.value) : null })}
                  placeholder="0"
                  className="input-field-sm"
                  style={{ width: '100px' }}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-muted font-medium" style={{ fontSize: '10px', marginBottom: '4px' }}>
                  Sueldo promedio mensual
                </label>
                <div className="flex items-center" style={{ gap: '4px' }}>
                  <span className="text-muted" style={{ fontSize: '12px' }}>$</span>
                  <input
                    type="number"
                    value={area.sueldoPromedio ?? ''}
                    onChange={e => setAreaDetail(i, { sueldoPromedio: e.target.value ? Number(e.target.value) : null })}
                    placeholder="0"
                    className="input-field-sm"
                    style={{ width: '140px' }}
                    min={0}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add custom area button */}
        <button
          type="button"
          onClick={addCustomArea}
          className="w-full rounded-xl border-2 border-dashed border-accent/30 text-accent font-semibold hover:bg-accent/5 transition-all cursor-pointer"
          style={{ padding: '14px', fontSize: '12px' }}
        >
          + Agregar otra área
        </button>

        {/* Totals summary */}
        <div className="rounded-xl bg-navy/5 border border-navy/10" style={{ padding: '16px 20px' }}>
          <p className="font-semibold text-navy uppercase tracking-wide" style={{ fontSize: '10px', marginBottom: '10px' }}>Resumen</p>
          <div className="flex" style={{ gap: '24px' }}>
            <div>
              <p className="text-muted" style={{ fontSize: '10px' }}>Total colaboradores</p>
              <p className="font-bold text-ink" style={{ fontSize: '16px' }}>{totalColab}</p>
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '10px' }}>Nómina mensual estimada</p>
              <p className="font-bold text-ink" style={{ fontSize: '16px' }}>
                ${totalNomina.toLocaleString('es-MX')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
