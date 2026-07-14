import { useTechSurveyStore } from '../../store/techSurveyStore';

const IA_CASOS_USO = [
  { value: 'chatbots', label: 'Chatbots / Asistentes', icon: '💬' },
  { value: 'generacion_contenido', label: 'Generación de contenido', icon: '✍️' },
  { value: 'analisis_datos', label: 'Análisis de datos', icon: '📊' },
  { value: 'automatizacion', label: 'Automatización de tareas', icon: '⚙️' },
];

const INTERES_OPTIONS = [
  { value: 'alto' as const, label: 'Alto', desc: 'Es prioridad estratégica' },
  { value: 'medio' as const, label: 'Medio', desc: 'Interesa pero no es prioridad' },
  { value: 'bajo' as const, label: 'Bajo', desc: 'Poco interés por ahora' },
  { value: 'ninguno' as const, label: 'Ninguno', desc: 'No está en el radar' },
];

const INVERSION_OPTIONS = [
  { value: 'menos_50k' as const, label: 'Menos de $50,000' },
  { value: '50k_200k' as const, label: '$50,000 - $200,000' },
  { value: '200k_500k' as const, label: '$200,000 - $500,000' },
  { value: 'mas_500k' as const, label: 'Más de $500,000' },
  { value: 'no_sabe' as const, label: 'No lo sé' },
];

export default function TechStep5AI() {
  const ai = useTechSurveyStore(s => s.aiAdoption);
  const update = useTechSurveyStore(s => s.updateAIAdoption);

  function toggleCasoUso(val: string) {
    const current = ai.casosUsoIA;
    const next = current.includes(val)
      ? current.filter(v => v !== val)
      : [...current, val];
    update({ casosUsoIA: next });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 className="font-serif text-navy" style={{ fontSize: '20px', marginBottom: '6px' }}>
          🤖 Inteligencia Artificial
        </h2>
        <p className="text-muted" style={{ fontSize: '12px' }}>
          Nivel de conocimiento y adopción de IA en la empresa.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
          ¿Conoce las aplicaciones de Inteligencia Artificial para empresas?
        </label>
        <div className="flex" style={{ gap: '10px' }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => update({ conoceIA: val })}
              className={`flex-1 rounded-xl border font-medium transition-all cursor-pointer ${ai.conoceIA === val ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '12px', fontSize: '13px' }}
            >
              {val ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
          ¿Usa IA actualmente en la empresa?
        </label>
        <div className="flex" style={{ gap: '10px' }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => update({ usaIAEnEmpresa: val })}
              className={`flex-1 rounded-xl border font-medium transition-all cursor-pointer ${ai.usaIAEnEmpresa === val ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '12px', fontSize: '13px' }}
            >
              {val ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      </div>

      {ai.usaIAEnEmpresa && (
        <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
          <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
            ¿En qué áreas usa IA? (seleccione las que apliquen)
          </label>
          <div className="grid grid-cols-2" style={{ gap: '10px' }}>
            {IA_CASOS_USO.map(caso => {
              const selected = ai.casosUsoIA.includes(caso.value);
              return (
                <button
                  key={caso.value}
                  onClick={() => toggleCasoUso(caso.value)}
                  className={`rounded-xl border font-medium transition-all cursor-pointer text-left ${selected ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
                  style={{ padding: '14px', fontSize: '12px' }}
                >
                  <span style={{ marginRight: '6px' }}>{caso.icon}</span>
                  {caso.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
          Nivel de interés en implementar IA
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {INTERES_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update({ interesEnIA: opt.value })}
              className={`rounded-xl border font-medium transition-all cursor-pointer text-left ${ai.interesEnIA === opt.value ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '14px', fontSize: '12px' }}
            >
              <span className="font-semibold">{opt.label}</span>
              <span className="text-muted" style={{ marginLeft: '8px', fontSize: '11px' }}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/60 shadow-sm" style={{ padding: '24px' }}>
        <label className="font-semibold text-navy" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
          Inversión anual aproximada en tecnología (MXN)
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {INVERSION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update({ inversionTechAnual: opt.value })}
              className={`rounded-xl border font-medium transition-all cursor-pointer text-left ${ai.inversionTechAnual === opt.value ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted hover:border-mid'}`}
              style={{ padding: '14px', fontSize: '12px' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
