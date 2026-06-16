import { useOrgSurveyStore } from '../../store/orgSurveyStore';

const DESC_OPTIONS = [
  { value: 'todas' as const, label: 'Todas', color: 'bg-success text-white' },
  { value: 'algunas' as const, label: 'Algunas', color: 'bg-warn text-white' },
  { value: 'ninguna' as const, label: 'Ninguna', color: 'bg-error/80 text-white' },
];

export default function OrgStep1Estructura() {
  const companyName = useOrgSurveyStore(s => s.companyName);
  const setCompanyName = useOrgSurveyStore(s => s.setCompanyName);
  const org = useOrgSurveyStore(s => s.orgStructure);
  const update = useOrgSurveyStore(s => s.updateOrgStructure);

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: '17px', marginBottom: '8px' }}>Estructura y Organigrama</h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: '13px', marginBottom: '36px' }}>
        Información sobre la estructura organizacional de la empresa.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Nombre de la empresa */}
        <div>
          <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '8px' }}>
            Nombre de la empresa
          </label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="Nombre comercial de la empresa"
            className="input-field"
            style={{ fontSize: '13px' }}
          />
        </div>

        {/* Organigrama */}
        <div className="rounded-xl border border-border bg-pale" style={{ padding: '20px' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ink" style={{ fontSize: '13px' }}>¿Tiene organigrama formal?</p>
              <p className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>Un documento que muestre la estructura jerárquica de la empresa</p>
            </div>
            <div className="flex" style={{ gap: '4px' }}>
              <button
                type="button"
                onClick={() => update({ tieneOrganigrama: true })}
                className={`font-semibold transition-all cursor-pointer ${
                  org.tieneOrganigrama ? 'bg-success text-white' : 'bg-white text-muted hover:bg-light border border-border'
                }`}
                style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px' }}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => update({ tieneOrganigrama: false, organigramaActualizado: null })}
                className={`font-semibold transition-all cursor-pointer ${
                  !org.tieneOrganigrama ? 'bg-error/80 text-white' : 'bg-white text-muted hover:bg-light border border-border'
                }`}
                style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px' }}
              >
                No
              </button>
            </div>
          </div>

          {/* Actualizado - solo si tiene organigrama */}
          {org.tieneOrganigrama && (
            <div className="flex items-center justify-between border-t border-border/40" style={{ marginTop: '14px', paddingTop: '14px' }}>
              <p className="font-medium text-ink" style={{ fontSize: '12px' }}>¿Está actualizado?</p>
              <div className="flex" style={{ gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => update({ organigramaActualizado: true })}
                  className={`font-semibold transition-all cursor-pointer ${
                    org.organigramaActualizado === true ? 'bg-success text-white' : 'bg-white text-muted hover:bg-light border border-border'
                  }`}
                  style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px' }}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => update({ organigramaActualizado: false })}
                  className={`font-semibold transition-all cursor-pointer ${
                    org.organigramaActualizado === false ? 'bg-error/80 text-white' : 'bg-white text-muted hover:bg-light border border-border'
                  }`}
                  style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px' }}
                >
                  No
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Descripciones de puesto */}
        <div className="rounded-xl border border-border bg-pale" style={{ padding: '20px' }}>
          <p className="font-medium text-ink" style={{ fontSize: '13px', marginBottom: '4px' }}>¿Tiene descripciones de puesto documentadas?</p>
          <p className="text-muted" style={{ fontSize: '11px', marginBottom: '12px' }}>Documentos formales que describan las funciones de cada posición</p>
          <div className="flex" style={{ gap: '6px' }}>
            {DESC_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ descripcionesPuesto: opt.value })}
                className={`font-semibold transition-all cursor-pointer ${
                  org.descripcionesPuesto === opt.value ? opt.color : 'bg-white text-muted hover:bg-light border border-border'
                }`}
                style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabulador de sueldos */}
        <div className="rounded-xl border border-border bg-pale" style={{ padding: '20px' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ink" style={{ fontSize: '13px' }}>¿Tiene tabulador de sueldos?</p>
              <p className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>Tabla con rangos salariales por puesto o nivel</p>
            </div>
            <div className="flex" style={{ gap: '4px' }}>
              <button
                type="button"
                onClick={() => update({ tieneTabulador: true })}
                className={`font-semibold transition-all cursor-pointer ${
                  org.tieneTabulador ? 'bg-success text-white' : 'bg-white text-muted hover:bg-light border border-border'
                }`}
                style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px' }}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => update({ tieneTabulador: false })}
                className={`font-semibold transition-all cursor-pointer ${
                  !org.tieneTabulador ? 'bg-error/80 text-white' : 'bg-white text-muted hover:bg-light border border-border'
                }`}
                style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px' }}
              >
                No
              </button>
            </div>
          </div>
        </div>

        {/* Nómina mensual */}
        <div>
          <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '8px' }}>
            Nómina mensual total aproximada
          </label>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <span className="text-muted font-medium" style={{ fontSize: '13px' }}>$</span>
            <input
              type="number"
              value={org.nominaMensualTotal ?? ''}
              onChange={e => update({ nominaMensualTotal: e.target.value ? Number(e.target.value) : null })}
              placeholder="0"
              className="input-field"
              style={{ fontSize: '13px', maxWidth: '220px' }}
            />
            <span className="text-muted" style={{ fontSize: '11px' }}>MXN / mes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
