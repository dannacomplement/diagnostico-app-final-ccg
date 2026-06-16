import { useDiagnosticStore } from '../../store/diagnosticStore';

export default function Step7AnalisisFamiliar() {
  const analysis = useDiagnosticStore(s => s.analisisFamiliar);
  const update = useDiagnosticStore(s => s.updateAnalisisFamiliar);

  const fields: { key: keyof typeof analysis; label: string; placeholder: string }[] = [
    {
      key: 'gobiernoFamiliar',
      label: 'Gobierno Familiar',
      placeholder: 'Describa la estructura de gobierno familiar: ¿existe un consejo de familia? ¿Cómo se toman las decisiones?',
    },
    {
      key: 'planSucesion',
      label: 'Plan de Sucesión',
      placeholder: '¿Existe un plan de sucesión documentado? ¿Quién es el sucesor identificado? ¿Cuál es el cronograma?',
    },
    {
      key: 'protocoloFamiliar',
      label: 'Protocolo Familiar',
      placeholder: '¿Existe un protocolo familiar documentado? ¿Qué reglas rigen la relación entre familia y empresa?',
    },
    {
      key: 'conflictosFamiliares',
      label: 'Conflictos Familiares',
      placeholder: '¿Existen conflictos actuales o potenciales? ¿Relacionados con incorporación de familiares, sociedades, herencias?',
    },
    {
      key: 'rolesOperacion',
      label: 'Roles Familiares en la Operación',
      placeholder: '¿Los roles de empleado, socio y familiar están claramente separados y definidos?',
    },
    {
      key: 'profesionalizacionFamiliares',
      label: 'Profesionalización de Familiares',
      placeholder: '¿Los familiares en la empresa cumplen con perfiles profesionales? ¿Existe una política de incorporación?',
    },
  ];

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: '17px', marginBottom: '8px' }}>Análisis Familiar</h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: '13px', marginBottom: '40px' }}>
        Esta sección evalúa aspectos clave de la relación entre familia y empresa. Responda con el mayor detalle posible.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {fields.map(field => (
          <div key={field.key}>
            <label className="block font-semibold text-ink" style={{ fontSize: '12px', marginBottom: '10px' }}>{field.label}</label>
            <textarea
              value={analysis[field.key]}
              onChange={e => update({ [field.key]: e.target.value })}
              placeholder={field.placeholder}
              className="w-full border border-border bg-pale focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none resize-none transition-all leading-relaxed"
              style={{ padding: '14px 18px', fontSize: '13px', borderRadius: '12px' }}
              rows={4}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
