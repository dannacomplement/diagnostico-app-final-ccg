import { Lock, Circle } from 'lucide-react';
import { useTechSurveyStore } from '../../store/techSurveyStore';

const RESPALDOS_OPTIONS = [
  { value: 'nunca' as const, label: 'No se hacen respaldos', iconClassName: 'fill-error text-error' },
  { value: 'manual' as const, label: 'Manual / esporádico', iconClassName: 'fill-warn text-warn' },
  { value: 'automatico' as const, label: 'Automático / programado', iconClassName: 'fill-success text-success' },
];

export default function TechStep6Security() {
  const security = useTechSurveyStore(s => s.security);
  const update = useTechSurveyStore(s => s.updateSecurity);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 className="font-serif text-navy flex items-center" style={{ fontSize: 'var(--fs-20)', marginBottom: '6px', gap: '8px' }}>
          <Lock className="text-accent" style={{ width: 'var(--fs-20)', height: 'var(--fs-20)' }} />
          Ciberseguridad
        </h2>
        <p className="text-muted" style={{ fontSize: 'var(--fs-12)' }}>
          Medidas de seguridad informática, respaldos y uso de la nube.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: 'var(--fs-13)', marginBottom: '12px', display: 'block' }}>
          ¿Tiene software antivirus / endpoint protection?
        </label>
        <div className="flex" style={{ gap: '10px' }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => update({ tieneAntivirus: val })}
              className={`flex-1 rounded-xl border font-medium transition-all cursor-pointer ${security.tieneAntivirus === val ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '12px', fontSize: 'var(--fs-13)' }}
            >
              {val ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: 'var(--fs-13)', marginBottom: '12px', display: 'block' }}>
          Respaldo de datos
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {RESPALDOS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update({ respaldosDatos: opt.value })}
              className={`rounded-xl border font-medium transition-all cursor-pointer text-left ${security.respaldosDatos === opt.value ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '14px', fontSize: 'var(--fs-12)' }}
            >
              <Circle className={`inline ${opt.iconClassName}`} style={{ width: 'var(--fs-12)', height: 'var(--fs-12)', marginRight: '6px', verticalAlign: '1px' }} /> {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: 'var(--fs-13)', marginBottom: '12px', display: 'block' }}>
          ¿Tiene políticas de seguridad informática documentadas?
        </label>
        <div className="flex" style={{ gap: '10px' }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => update({ politicasSeguridad: val })}
              className={`flex-1 rounded-xl border font-medium transition-all cursor-pointer ${security.politicasSeguridad === val ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '12px', fontSize: 'var(--fs-13)' }}
            >
              {val ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: 'var(--fs-13)', marginBottom: '12px', display: 'block' }}>
          ¿Da capacitación en ciberseguridad a los empleados?
        </label>
        <div className="flex" style={{ gap: '10px' }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => update({ capacitacionSeguridad: val })}
              className={`flex-1 rounded-xl border font-medium transition-all cursor-pointer ${security.capacitacionSeguridad === val ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '12px', fontSize: 'var(--fs-13)' }}
            >
              {val ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: 'var(--fs-13)', marginBottom: '12px', display: 'block' }}>
          ¿Usa servicios en la nube?
        </label>
        <div className="flex" style={{ gap: '10px' }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => update({ usaNube: val })}
              className={`flex-1 rounded-xl border font-medium transition-all cursor-pointer ${security.usaNube === val ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '12px', fontSize: 'var(--fs-13)' }}
            >
              {val ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      </div>

      {security.usaNube && (
        <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
          <label className="font-semibold text-navy" style={{ fontSize: 'var(--fs-13)', marginBottom: '12px', display: 'block' }}>
            Proveedor de nube principal
          </label>
          <input
            type="text"
            value={security.proveedorNube}
            onChange={e => update({ proveedorNube: e.target.value })}
            placeholder="Ej: AWS, Azure, Google Cloud, Otro..."
            className="w-full rounded-xl border border-border bg-pale text-ink focus:outline-accent"
            style={{ padding: 'var(--sp-btn-c)', fontSize: 'var(--fs-13)' }}
          />
        </div>
      )}
    </div>
  );
}
