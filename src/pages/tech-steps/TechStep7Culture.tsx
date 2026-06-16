import { useTechSurveyStore } from '../../store/techSurveyStore';

const RESISTENCIA_OPTIONS = [
  { value: 'alta' as const, label: 'Alta', desc: 'Los empleados rechazan nuevas herramientas', icon: '🔴' },
  { value: 'media' as const, label: 'Media', desc: 'Aceptan con algo de resistencia', icon: '🟡' },
  { value: 'baja' as const, label: 'Baja', desc: 'En general aceptan los cambios', icon: '🟢' },
  { value: 'ninguna' as const, label: 'Ninguna', desc: 'El equipo abraza la tecnologia', icon: '💎' },
];

export default function TechStep7Culture() {
  const culture = useTechSurveyStore(s => s.culture);
  const update = useTechSurveyStore(s => s.updateCulture);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 className="font-serif text-navy" style={{ fontSize: '20px', marginBottom: '6px' }}>
          🧠 Cultura Digital
        </h2>
        <p className="text-muted" style={{ fontSize: '12px' }}>
          Disposicion al cambio, capacitacion y equipo de tecnologia.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
          Nivel de resistencia al cambio tecnologico
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {RESISTENCIA_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update({ resistenciaAlCambio: opt.value })}
              className={`rounded-xl border font-medium transition-all cursor-pointer text-left ${culture.resistenciaAlCambio === opt.value ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '14px', fontSize: '12px' }}
            >
              <span style={{ marginRight: '6px' }}>{opt.icon}</span>
              <span className="font-semibold">{opt.label}</span>
              <span className="text-muted" style={{ marginLeft: '8px', fontSize: '11px' }}>— {opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
          ¿Ofrece capacitacion en herramientas tecnologicas?
        </label>
        <div className="flex" style={{ gap: '10px' }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => update({ capacitacionTecnologica: val })}
              className={`flex-1 rounded-xl border font-medium transition-all cursor-pointer ${culture.capacitacionTecnologica === val ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '12px', fontSize: '13px' }}
            >
              {val ? 'Si' : 'No'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
          ¿Tiene equipo de TI dedicado?
        </label>
        <div className="flex" style={{ gap: '10px' }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => update({ equipoTI: val })}
              className={`flex-1 rounded-xl border font-medium transition-all cursor-pointer ${culture.equipoTI === val ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '12px', fontSize: '13px' }}
            >
              {val ? 'Si' : 'No'}
            </button>
          ))}
        </div>
      </div>

      {culture.equipoTI && (
        <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
          <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
            ¿Cuantas personas integran el equipo de TI?
          </label>
          <input
            type="number"
            min={1}
            value={culture.equipoTISize ?? ''}
            onChange={e => update({ equipoTISize: e.target.value ? Number(e.target.value) : null })}
            placeholder="Ej: 3"
            className="w-full rounded-xl border border-border bg-pale text-ink focus:outline-accent"
            style={{ padding: '12px 16px', fontSize: '13px' }}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
          ¿Tiene presupuesto asignado para tecnologia?
        </label>
        <div className="flex" style={{ gap: '10px' }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => update({ presupuestoTech: val })}
              className={`flex-1 rounded-xl border font-medium transition-all cursor-pointer ${culture.presupuestoTech === val ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '12px', fontSize: '13px' }}
            >
              {val ? 'Si' : 'No'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
          Principal reto tecnologico de la empresa
        </label>
        <textarea
          value={culture.retoPrincipalTech}
          onChange={e => update({ retoPrincipalTech: e.target.value })}
          placeholder="Describa brevemente el mayor reto tecnologico que enfrenta..."
          rows={3}
          className="w-full rounded-xl border border-border bg-pale text-ink focus:outline-accent resize-none"
          style={{ padding: '12px 16px', fontSize: '13px' }}
        />
      </div>
    </div>
  );
}
