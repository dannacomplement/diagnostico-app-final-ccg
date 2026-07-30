import { useTechSurveyStore } from '../../store/techSurveyStore';
import { TECH_AREAS } from '../../config/techQuestions';

export default function TechIntroStep() {
  const companyName = useTechSurveyStore(s => s.companyName);
  const setCompanyName = useTechSurveyStore(s => s.setCompanyName);
  const respondentArea = useTechSurveyStore(s => s.respondentArea);
  const setRespondentArea = useTechSurveyStore(s => s.setRespondentArea);
  const rolCargo = useTechSurveyStore(s => s.rolCargo);
  const setRolCargo = useTechSurveyStore(s => s.setRolCargo);
  const sistemasPrincipales = useTechSurveyStore(s => s.sistemasPrincipales);
  const setSistemasPrincipales = useTechSurveyStore(s => s.setSistemasPrincipales);

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: 'var(--fs-17)', marginBottom: '8px' }}>
        Diagnóstico de Madurez Digital
      </h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: 'var(--fs-13)', marginBottom: '32px' }}>
        Evaluación del uso e integración de tecnología en tu área. Al final también te preguntaremos sobre sistemas y seguridad, que aplica a toda la empresa.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '8px' }}>
            Nombre de la empresa
          </label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="Nombre comercial de la empresa"
            className="input-field"
            style={{ fontSize: 'var(--fs-13)' }}
          />
        </div>

        <div>
          <p className="font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '8px' }}>
            Área a la que perteneces
          </p>
          <div className="grid grid-cols-2" style={{ gap: '10px' }}>
            {TECH_AREAS.map(area => (
              <button
                key={area.id}
                onClick={() => setRespondentArea(area.id)}
                className={`rounded-xl border-2 text-left transition-all cursor-pointer ${
                  respondentArea === area.id ? 'border-accent bg-accent/5' : 'border-border/40 bg-white hover:border-accent/30'
                }`}
                style={{ padding: '14px 16px' }}
              >
                <div className="flex items-center" style={{ gap: '8px', marginBottom: '4px' }}>
                  <area.icon className="text-accent" style={{ width: 'var(--fs-16)', height: 'var(--fs-16)' }} />
                  <span className="font-semibold text-ink" style={{ fontSize: 'var(--fs-12)' }}>{area.name}</span>
                </div>
                <p className="text-muted" style={{ fontSize: 'var(--fs-10)' }}>{area.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '8px' }}>
            Rol / Cargo
          </label>
          <input
            type="text"
            value={rolCargo}
            onChange={e => setRolCargo(e.target.value)}
            placeholder="Ej: Gerente, Coordinador, Operativo"
            className="input-field"
            style={{ fontSize: 'var(--fs-13)' }}
          />
        </div>

        <div>
          <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '8px' }}>
            Sistemas principales que utilizas en el día a día
          </label>
          <input
            type="text"
            value={sistemasPrincipales}
            onChange={e => setSistemasPrincipales(e.target.value)}
            placeholder="Ej: ERP, CRM, Excel, software a medida"
            className="input-field"
            style={{ fontSize: 'var(--fs-13)' }}
          />
        </div>
      </div>
    </div>
  );
}
