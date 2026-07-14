import { useTechSurveyStore } from '../../store/techSurveyStore';

const DATA_USAGE_OPTIONS = [
  { value: 'nunca' as const, icon: '🔴', label: 'Nunca', desc: 'Sin datos' },
  { value: 'a_veces' as const, icon: '🟡', label: 'A veces', desc: 'Ocasionalmente' },
  { value: 'frecuentemente' as const, icon: '🟢', label: 'Frecuentemente', desc: 'Casi siempre' },
  { value: 'siempre' as const, icon: '🚀', label: 'Siempre', desc: 'Data-driven' },
];

const BI_OPTIONS = ['Power BI', 'Tableau', 'Google Data Studio', 'Excel avanzado', 'Otro'];

export default function TechStep4Data() {
  const data = useTechSurveyStore(s => s.dataAnalytics);
  const update = useTechSurveyStore(s => s.updateDataAnalytics);

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: '17px', marginBottom: '8px' }}>
        Datos y Analítica
      </h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: '13px', marginBottom: '36px' }}>
        Evaluemos cómo su empresa utiliza los datos para la toma de decisiones.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Uso de datos para decisiones */}
        <div>
          <p className="font-medium text-ink" style={{ fontSize: '13px', marginBottom: '10px' }}>
            ¿Usa datos para tomar decisiones?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '10px' }}>
            {DATA_USAGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => update({ usaDatosParaDecisiones: opt.value })}
                className={`rounded-xl border-2 text-center transition-all cursor-pointer ${
                  data.usaDatosParaDecisiones === opt.value ? 'border-accent bg-accent/5' : 'border-border/40 bg-white hover:border-accent/30'
                }`}
                style={{ padding: '16px 12px' }}
              >
                <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                <p className="font-semibold text-ink" style={{ fontSize: '12px', marginTop: '6px' }}>{opt.label}</p>
                <p className="text-muted" style={{ fontSize: '10px', marginTop: '2px' }}>{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="flex items-center justify-between bg-pale/50 rounded-xl border border-border/30" style={{ padding: '14px 18px' }}>
          <span className="text-ink font-medium" style={{ fontSize: '13px' }}>¿Tiene KPIs definidos?</span>
          <button
            onClick={() => update({ tieneKPIs: !data.tieneKPIs })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${data.tieneKPIs ? 'bg-accent' : 'bg-border'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.tieneKPIs ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Dashboards / BI */}
        <div>
          <div className="flex items-center justify-between bg-pale/50 rounded-xl border border-border/30" style={{ padding: '14px 18px', marginBottom: '12px' }}>
            <span className="text-ink font-medium" style={{ fontSize: '13px' }}>¿Usa dashboards o Business Intelligence?</span>
            <button
              onClick={() => update({ dashboardsBI: !data.dashboardsBI, herramientaBI: !data.dashboardsBI ? data.herramientaBI : '' })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${data.dashboardsBI ? 'bg-accent' : 'bg-border'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.dashboardsBI ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {data.dashboardsBI && (
            <div style={{ marginLeft: '8px' }}>
              <label className="block text-muted font-medium" style={{ fontSize: '11px', marginBottom: '6px' }}>
                ¿Cuál herramienta de BI utiliza?
              </label>
              <select
                value={data.herramientaBI}
                onChange={e => update({ herramientaBI: e.target.value })}
                className="input-field"
                style={{ fontSize: '13px', maxWidth: '280px' }}
              >
                <option value="">Seleccione una opción</option>
                {BI_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Analitica avanzada */}
        <div className="flex items-center justify-between bg-pale/50 rounded-xl border border-border/30" style={{ padding: '14px 18px' }}>
          <span className="text-ink font-medium" style={{ fontSize: '13px' }}>¿Usa analítica avanzada o modelos predictivos?</span>
          <button
            onClick={() => update({ analiticaAvanzada: !data.analiticaAvanzada })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${data.analiticaAvanzada ? 'bg-accent' : 'bg-border'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.analiticaAvanzada ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
