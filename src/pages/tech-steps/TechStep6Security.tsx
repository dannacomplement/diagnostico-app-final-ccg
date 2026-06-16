import { useTechSurveyStore } from '../../store/techSurveyStore';

const RESPALDOS_OPTIONS = [
  { value: 'nunca' as const, label: 'No se hacen respaldos', icon: '🔴' },
  { value: 'manual' as const, label: 'Manual / esporadico', icon: '🟡' },
  { value: 'automatico' as const, label: 'Automatico / programado', icon: '🟢' },
];

export default function TechStep6Security() {
  const security = useTechSurveyStore(s => s.security);
  const update = useTechSurveyStore(s => s.updateSecurity);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 className="font-serif text-navy" style={{ fontSize: '20px', marginBottom: '6px' }}>
          🔒 Ciberseguridad
        </h2>
        <p className="text-muted" style={{ fontSize: '12px' }}>
          Medidas de seguridad informatica, respaldos y uso de la nube.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
          ¿Tiene software antivirus / endpoint protection?
        </label>
        <div className="flex" style={{ gap: '10px' }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => update({ tieneAntivirus: val })}
              className={`flex-1 rounded-xl border font-medium transition-all cursor-pointer ${security.tieneAntivirus === val ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '12px', fontSize: '13px' }}
            >
              {val ? 'Si' : 'No'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
          Respaldo de datos
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {RESPALDOS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update({ respaldosDatos: opt.value })}
              className={`rounded-xl border font-medium transition-all cursor-pointer text-left ${security.respaldosDatos === opt.value ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '14px', fontSize: '12px' }}
            >
              <span style={{ marginRight: '6px' }}>{opt.icon}</span> {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
          ¿Tiene politicas de seguridad informatica documentadas?
        </label>
        <div className="flex" style={{ gap: '10px' }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => update({ politicasSeguridad: val })}
              className={`flex-1 rounded-xl border font-medium transition-all cursor-pointer ${security.politicasSeguridad === val ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '12px', fontSize: '13px' }}
            >
              {val ? 'Si' : 'No'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
          ¿Da capacitacion en ciberseguridad a los empleados?
        </label>
        <div className="flex" style={{ gap: '10px' }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => update({ capacitacionSeguridad: val })}
              className={`flex-1 rounded-xl border font-medium transition-all cursor-pointer ${security.capacitacionSeguridad === val ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '12px', fontSize: '13px' }}
            >
              {val ? 'Si' : 'No'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
          ¿Usa servicios en la nube?
        </label>
        <div className="flex" style={{ gap: '10px' }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => update({ usaNube: val })}
              className={`flex-1 rounded-xl border font-medium transition-all cursor-pointer ${security.usaNube === val ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '12px', fontSize: '13px' }}
            >
              {val ? 'Si' : 'No'}
            </button>
          ))}
        </div>
      </div>

      {security.usaNube && (
        <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
          <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
            Proveedor de nube principal
          </label>
          <input
            type="text"
            value={security.proveedorNube}
            onChange={e => update({ proveedorNube: e.target.value })}
            placeholder="Ej: AWS, Azure, Google Cloud, Otro..."
            className="w-full rounded-xl border border-border bg-pale text-ink focus:outline-accent"
            style={{ padding: '12px 16px', fontSize: '13px' }}
          />
        </div>
      )}
    </div>
  );
}
