import { useTechSurveyStore } from '../../store/techSurveyStore';

const AUTOMATION_LEVELS = [
  { value: 'ninguno' as const, icon: '🔴', label: 'Ninguno', desc: 'Todo es manual' },
  { value: 'algunos' as const, icon: '🟡', label: 'Algunos', desc: 'Pocos procesos' },
  { value: 'mayoria' as const, icon: '🟢', label: 'Mayoria', desc: 'Casi todos' },
  { value: 'todos' as const, icon: '🚀', label: 'Todos', desc: 'Completamente' },
];

const DIGITAL_TOOLS = [
  { key: 'facturaElectronica' as const, label: 'Factura electronica' },
  { key: 'bancaDigital' as const, label: 'Banca digital' },
  { key: 'firmaElectronica' as const, label: 'Firma electronica' },
  { key: 'gestionDocumentalDigital' as const, label: 'Gestion documental digital' },
];

export default function TechStep3Automation() {
  const auto = useTechSurveyStore(s => s.automation);
  const update = useTechSurveyStore(s => s.updateAutomation);

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: '17px', marginBottom: '8px' }}>
        Automatizacion de Procesos
      </h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: '13px', marginBottom: '36px' }}>
        Evaluemos el nivel de automatizacion y digitalizacion de sus procesos operativos.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Nivel de automatizacion */}
        <div>
          <p className="font-medium text-ink" style={{ fontSize: '13px', marginBottom: '10px' }}>
            ¿Que tan automatizados estan sus procesos?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '10px' }}>
            {AUTOMATION_LEVELS.map(opt => (
              <button
                key={opt.value}
                onClick={() => update({ procesosAutomatizados: opt.value })}
                className={`rounded-xl border-2 text-center transition-all cursor-pointer ${
                  auto.procesosAutomatizados === opt.value ? 'border-accent bg-accent/5' : 'border-border/40 bg-white hover:border-accent/30'
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

        {/* Areas mas automatizadas */}
        <div>
          <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '8px' }}>
            ¿Cuales areas estan mas automatizadas?
          </label>
          <textarea
            value={auto.areasMasAutomatizadas}
            onChange={e => update({ areasMasAutomatizadas: e.target.value })}
            placeholder="Ej: Contabilidad, facturacion, nomina, inventarios..."
            className="input-field"
            rows={3}
            style={{ fontSize: '13px', resize: 'vertical' }}
          />
        </div>

        {/* Herramientas digitales - compact horizontal toggles */}
        <div>
          <p className="font-medium text-ink" style={{ fontSize: '13px', marginBottom: '4px' }}>
            Herramientas digitales en uso
          </p>
          <p className="text-muted" style={{ fontSize: '11px', marginBottom: '12px' }}>
            Seleccione las herramientas digitales que utiliza su empresa
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DIGITAL_TOOLS.map(tool => (
              <div
                key={tool.key}
                className="flex items-center justify-between bg-pale/50 rounded-xl border border-border/30"
                style={{ padding: '14px 18px' }}
              >
                <span className="text-ink font-medium" style={{ fontSize: '13px' }}>{tool.label}</span>
                <button
                  onClick={() => update({ [tool.key]: !auto[tool.key] })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${auto[tool.key] ? 'bg-accent' : 'bg-border'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${auto[tool.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
