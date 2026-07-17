import { Brain, Circle, Gem } from 'lucide-react';
import { useTechSurveyStore } from '../../store/techSurveyStore';

const RESISTENCIA_OPTIONS = [
  { value: 'alta' as const, label: 'Alta', desc: 'Los empleados rechazan nuevas herramientas', icon: Circle, iconClassName: 'fill-error text-error' },
  { value: 'media' as const, label: 'Media', desc: 'Aceptan con algo de resistencia', icon: Circle, iconClassName: 'fill-warn text-warn' },
  { value: 'baja' as const, label: 'Baja', desc: 'En general aceptan los cambios', icon: Circle, iconClassName: 'fill-success text-success' },
  { value: 'ninguna' as const, label: 'Ninguna', desc: 'El equipo abraza la tecnología', icon: Gem, iconClassName: 'text-accent' },
];

export default function TechStep7Culture() {
  const culture = useTechSurveyStore(s => s.culture);
  const update = useTechSurveyStore(s => s.updateCulture);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 className="font-serif text-navy flex items-center" style={{ fontSize: 'var(--fs-20)', marginBottom: '6px', gap: '8px' }}>
          <Brain className="text-accent" style={{ width: 'var(--fs-20)', height: 'var(--fs-20)' }} />
          Cultura Digital
        </h2>
        <p className="text-muted" style={{ fontSize: 'var(--fs-12)' }}>
          Disposición al cambio, capacitación y equipo de tecnología.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: 'var(--fs-13)', marginBottom: '12px', display: 'block' }}>
          Nivel de resistencia al cambio tecnológico
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {RESISTENCIA_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update({ resistenciaAlCambio: opt.value })}
              className={`rounded-xl border font-medium transition-all cursor-pointer text-left ${culture.resistenciaAlCambio === opt.value ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '14px', fontSize: 'var(--fs-12)' }}
            >
              <opt.icon className={`inline ${opt.iconClassName}`} style={{ width: 'var(--fs-13)', height: 'var(--fs-13)', marginRight: '6px', verticalAlign: '1px' }} />
              <span className="font-semibold">{opt.label}</span>
              <span className="text-muted" style={{ marginLeft: '8px', fontSize: 'var(--fs-11)' }}>— {opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: 'var(--fs-13)', marginBottom: '12px', display: 'block' }}>
          ¿Ofrece capacitación en herramientas tecnológicas?
        </label>
        <div className="flex" style={{ gap: '10px' }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => update({ capacitacionTecnologica: val })}
              className={`flex-1 rounded-xl border font-medium transition-all cursor-pointer ${culture.capacitacionTecnologica === val ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '12px', fontSize: 'var(--fs-13)' }}
            >
              {val ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: 'var(--fs-13)', marginBottom: '12px', display: 'block' }}>
          ¿Tiene equipo de TI dedicado?
        </label>
        <div className="flex" style={{ gap: '10px' }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => update({ equipoTI: val })}
              className={`flex-1 rounded-xl border font-medium transition-all cursor-pointer ${culture.equipoTI === val ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '12px', fontSize: 'var(--fs-13)' }}
            >
              {val ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      </div>

      {culture.equipoTI && (
        <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
          <label className="font-semibold text-navy" style={{ fontSize: 'var(--fs-13)', marginBottom: '12px', display: 'block' }}>
            ¿Cuántas personas integran el equipo de TI?
          </label>
          <input
            type="number"
            min={1}
            value={culture.equipoTISize ?? ''}
            onChange={e => update({ equipoTISize: e.target.value ? Number(e.target.value) : null })}
            placeholder="Ej: 3"
            className="w-full rounded-xl border border-border bg-pale text-ink focus:outline-accent"
            style={{ padding: 'var(--sp-btn-c)', fontSize: 'var(--fs-13)' }}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: 'var(--fs-13)', marginBottom: '12px', display: 'block' }}>
          ¿Tiene presupuesto asignado para tecnología?
        </label>
        <div className="flex" style={{ gap: '10px' }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => update({ presupuestoTech: val })}
              className={`flex-1 rounded-xl border font-medium transition-all cursor-pointer ${culture.presupuestoTech === val ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '12px', fontSize: 'var(--fs-13)' }}
            >
              {val ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: 'var(--fs-13)', marginBottom: '12px', display: 'block' }}>
          Principal reto tecnológico de la empresa
        </label>
        <textarea
          value={culture.retoPrincipalTech}
          onChange={e => update({ retoPrincipalTech: e.target.value })}
          placeholder="Describa brevemente el mayor reto tecnológico que enfrenta..."
          rows={3}
          className="w-full rounded-xl border border-border bg-pale text-ink focus:outline-accent resize-none"
          style={{ padding: 'var(--sp-btn-c)', fontSize: 'var(--fs-13)' }}
        />
      </div>
    </div>
  );
}
