import { useDiagnosticStore } from '../../store/diagnosticStore';
import { INSTITUCIONALIZACION_CRITERIA } from '../../config/questions';
import TypeformCriteria from '../../components/criteria/TypeformCriteria';

export default function Step4Institucionalizacion() {
  const answers = useDiagnosticStore(s => s.instAnswers);
  const setCriterionAnswer = useDiagnosticStore(s => s.setCriterionAnswer);
  const getInstScore = useDiagnosticStore(s => s.getInstScore);
  const isFamilyBusiness = useDiagnosticStore(s => s.isFamilyBusiness);

  const isFamily = isFamilyBusiness();
  const score = getInstScore();

  const visibleCriteria = INSTITUCIONALIZACION_CRITERIA.filter(
    c => !c.requiresFamilyBusiness || isFamily
  );

  return (
    <div>
      {!isFamily && (
        <div className="bg-pale border border-border rounded-xl text-muted" style={{ padding: '16px 20px', marginBottom: '16px', fontSize: '12px' }}>
          <strong className="text-ink">Nota:</strong> Algunos criterios aplican solo para empresas familiares y se han ocultado segun su respuesta anterior.
        </div>
      )}
      <TypeformCriteria
        title="Institucionalización"
        description="Evalúe el nivel de gobierno, propiedad y estructura formal de su empresa."
        criteria={visibleCriteria}
        answers={answers}
        onAnswerChange={(id, partial) => setCriterionAnswer('inst', id, partial)}
        averageScore={score.average}
        level={score.level}
      />
    </div>
  );
}
