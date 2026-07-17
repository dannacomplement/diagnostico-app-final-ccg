import { useOrgSurveyStore } from '../../store/orgSurveyStore';
import type { PerformanceEvaluation, SalaryCompetitiveness } from '../../lib/types';

const EVAL_OPTIONS: { value: PerformanceEvaluation; label: string; color: string }[] = [
  { value: 'si', label: 'Sí', color: 'bg-success text-white' },
  { value: 'parcialmente', label: 'Parcialmente', color: 'bg-warn text-white' },
  { value: 'no', label: 'No', color: 'bg-error/80 text-white' },
];

const COMPETITIVENESS_OPTIONS: { value: SalaryCompetitiveness; label: string; color: string }[] = [
  { value: 'arriba', label: 'Arriba del mercado', color: 'bg-success text-white' },
  { value: 'en_rango', label: 'En rango', color: 'bg-mid text-white' },
  { value: 'debajo', label: 'Debajo', color: 'bg-warn text-white' },
  { value: 'no_se', label: 'No sé', color: 'bg-pale text-muted border border-border' },
];

export default function OrgStep3Talento() {
  const talent = useOrgSurveyStore(s => s.talentProcesses);
  const update = useOrgSurveyStore(s => s.updateTalentProcesses);

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: 'var(--fs-17)', marginBottom: '8px' }}>Talento y Procesos de RH</h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: 'var(--fs-13)', marginBottom: '36px' }}>
        Información sobre los procesos de recursos humanos y gestión del talento.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Proceso de reclutamiento */}
        <div className="rounded-xl border border-border bg-pale" style={{ padding: '20px' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ink" style={{ fontSize: 'var(--fs-13)' }}>¿Tiene proceso formal de reclutamiento y selección?</p>
              <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginTop: '2px' }}>Procedimiento documentado para contratar personal</p>
            </div>
            <div className="flex" style={{ gap: '4px' }}>
              <button
                type="button"
                onClick={() => update({ procesoReclutamiento: true })}
                className={`font-semibold transition-all cursor-pointer ${
                  talent.procesoReclutamiento ? 'bg-success text-white' : 'bg-white text-muted hover:bg-light border border-border'
                }`}
                style={{ padding: '6px 16px', borderRadius: '8px', fontSize: 'var(--fs-12)' }}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => update({ procesoReclutamiento: false })}
                className={`font-semibold transition-all cursor-pointer ${
                  !talent.procesoReclutamiento ? 'bg-error/80 text-white' : 'bg-white text-muted hover:bg-light border border-border'
                }`}
                style={{ padding: '6px 16px', borderRadius: '8px', fontSize: 'var(--fs-12)' }}
              >
                No
              </button>
            </div>
          </div>
        </div>

        {/* Evaluaciones de desempeño */}
        <div className="rounded-xl border border-border bg-pale" style={{ padding: '20px' }}>
          <p className="font-medium text-ink" style={{ fontSize: 'var(--fs-13)', marginBottom: '4px' }}>¿Realiza evaluaciones de desempeño?</p>
          <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginBottom: '12px' }}>Evaluaciones periódicas del rendimiento del personal</p>
          <div className="flex flex-wrap" style={{ gap: '6px' }}>
            {EVAL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ evaluacionesDesempeno: opt.value })}
                className={`font-semibold transition-all cursor-pointer ${
                  talent.evaluacionesDesempeno === opt.value ? opt.color : 'bg-white text-muted hover:bg-light border border-border'
                }`}
                style={{ padding: '6px 16px', borderRadius: '8px', fontSize: 'var(--fs-12)' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Programa de capacitación */}
        <div className="rounded-xl border border-border bg-pale" style={{ padding: '20px' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ink" style={{ fontSize: 'var(--fs-13)' }}>¿Tiene programa de capacitación?</p>
              <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginTop: '2px' }}>Plan formal de entrenamiento y desarrollo del personal</p>
            </div>
            <div className="flex" style={{ gap: '4px' }}>
              <button
                type="button"
                onClick={() => update({ programaCapacitacion: true })}
                className={`font-semibold transition-all cursor-pointer ${
                  talent.programaCapacitacion ? 'bg-success text-white' : 'bg-white text-muted hover:bg-light border border-border'
                }`}
                style={{ padding: '6px 16px', borderRadius: '8px', fontSize: 'var(--fs-12)' }}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => update({ programaCapacitacion: false })}
                className={`font-semibold transition-all cursor-pointer ${
                  !talent.programaCapacitacion ? 'bg-error/80 text-white' : 'bg-white text-muted hover:bg-light border border-border'
                }`}
                style={{ padding: '6px 16px', borderRadius: '8px', fontSize: 'var(--fs-12)' }}
              >
                No
              </button>
            </div>
          </div>
        </div>

        {/* Rotación anual */}
        <div>
          <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '4px' }}>
            Rotación anual aproximada
          </label>
          <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginBottom: '8px' }}>Porcentaje de colaboradores que abandonan la empresa al año</p>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <input
              type="number"
              value={talent.rotacionAnual ?? ''}
              onChange={e => update({ rotacionAnual: e.target.value ? Number(e.target.value) : null })}
              placeholder="0"
              className="input-field"
              style={{ fontSize: 'var(--fs-13)', maxWidth: '120px' }}
              min={0}
              max={100}
            />
            <span className="text-muted font-medium" style={{ fontSize: 'var(--fs-13)' }}>%</span>
          </div>
        </div>

        {/* Competitividad de sueldos */}
        <div className="rounded-xl border border-border bg-pale" style={{ padding: '20px' }}>
          <p className="font-medium text-ink" style={{ fontSize: 'var(--fs-13)', marginBottom: '4px' }}>¿Los sueldos son competitivos vs el mercado?</p>
          <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginBottom: '12px' }}>Comparación general de su nivel salarial respecto al mercado</p>
          <div className="flex flex-wrap" style={{ gap: '6px' }}>
            {COMPETITIVENESS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ competitividadSueldos: opt.value })}
                className={`font-semibold transition-all cursor-pointer ${
                  talent.competitividadSueldos === opt.value ? opt.color : 'bg-white text-muted hover:bg-light border border-border'
                }`}
                style={{ padding: '6px 16px', borderRadius: '8px', fontSize: 'var(--fs-12)' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reto principal */}
        <div>
          <label className="block font-medium text-ink" style={{ fontSize: 'var(--fs-12)', marginBottom: '4px' }}>
            Principal reto de capital humano
          </label>
          <p className="text-muted" style={{ fontSize: 'var(--fs-11)', marginBottom: '8px' }}>¿Cuál es el mayor desafío que enfrenta en gestión de personal?</p>
          <textarea
            value={talent.retoCapitalHumano}
            onChange={e => update({ retoCapitalHumano: e.target.value })}
            placeholder="Describa brevemente el reto principal..."
            className="input-field"
            rows={3}
            style={{ fontSize: 'var(--fs-13)', resize: 'vertical' }}
          />
        </div>
      </div>
    </div>
  );
}
