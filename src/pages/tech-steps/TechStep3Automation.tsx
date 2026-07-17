import { Circle, Rocket } from 'lucide-react';
import { useTechSurveyStore } from '../../store/techSurveyStore';

const AUTOMATION_LEVELS = [
  { value: 'ninguno' as const, icon: Circle, iconClassName: 'fill-error text-error', label: 'Ninguno', desc: 'Todo es manual' },
  { value: 'algunos' as const, icon: Circle, iconClassName: 'fill-warn text-warn', label: 'Algunos', desc: 'Pocos procesos' },
  { value: 'mayoria' as const, icon: Circle, iconClassName: 'fill-success text-success', label: 'Mayoría', desc: 'Casi todos' },
  { value: 'todos' as const, icon: Rocket, iconClassName: 'text-accent', label: 'Todos', desc: 'Completamente' },
];

const DIGITAL_TOOLS = [
  { key: 'facturaElectronica' as const, label: 'Factura electrónica' },
  { key: 'bancaDigital' as const, label: 'Banca digital' },
  { key: 'firmaElectronica' as const, label: 'Firma electrónica' },
  { key: 'gestionDocumentalDigital' as const, label: 'Gestión documental digital' },
];

export default function TechStep3Automation() {
  const auto = useTechSurveyStore(s => s.automation);
  const update = useTechSurveyStore(s => s.updateAutomation);

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: 'var(--fs-17)', marginBottom: '8px' }}>
        Automatización de Procesos
      </h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: 'var(--fs-13)', marginBottom: '36px' }}>
        Evaluemos el nivel de automatización y digitalización de sus procesos operativos.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Nivel de automatizacion */}
        <div>
          <p className="font-medium text-ink" style={{ fontSize: 'var(--fs-13)', marginBottom: '10px' }}>
            ¿Qué tan automatizados están sus procesos?
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
                <opt.icon className={`mx-auto ${opt.iconClassName}`} style={{ width: 'var(--fs-20)', height: 'var(--fs-20)' }} />
                <p className="font-semibold text-ink" style={{ fontSize: 'var(--fs-12)', marginTop: '6px' }}>{opt.label}</p>
                <p className="text-muted" style={{ fontSize: 'var(--fs-10)', marginTop: '2px' }}>{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Areas mas automatizadas */}
        <div>
          <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '8px' }}>
            ¿Cuáles áreas están más automatizadas?
          </label>
          <textarea
            value={auto.areasMasAutomatizadas}
            onChange={e => update({ areasMasAutomatizadas: e.target.value })}
            placeholder="Ej: Contabilidad, facturación, nómina, inventarios..."
            className="input-field"
            rows={3}
            style={{ fontSize: 'var(--fs-13)', resize: 'vertical' }}
          />
        </div>

        {/* Herramientas digitales - compact horizontal toggles */}
        <div>
          <p className="font-medium text-ink" style={{ fontSize: 'var(--fs-13)', marginBottom: '4px' }}>
            Herramientas digitales en uso
          </p>
          <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginBottom: '12px' }}>
            Seleccione las herramientas digitales que utiliza su empresa
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DIGITAL_TOOLS.map(tool => (
              <div
                key={tool.key}
                className="flex items-center justify-between bg-pale/50 rounded-xl border border-border/30"
                style={{ padding: 'var(--sp-btn-a)' }}
              >
                <span className="text-ink font-medium" style={{ fontSize: 'var(--fs-13)' }}>{tool.label}</span>
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
