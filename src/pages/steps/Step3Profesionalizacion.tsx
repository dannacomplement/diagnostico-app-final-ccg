import { useDiagnosticStore } from '../../store/diagnosticStore';
import { PROFESIONALIZACION_CRITERIA } from '../../config/questions';
import TypeformCriteria from '../../components/criteria/TypeformCriteria';

export default function Step3Profesionalizacion() {
  const answers = useDiagnosticStore(s => s.profAnswers);
  const setCriterionAnswer = useDiagnosticStore(s => s.setCriterionAnswer);
  const getProfScore = useDiagnosticStore(s => s.getProfScore);

  const score = getProfScore();

  return (
    <div>
      <TypeformCriteria
        title="Profesionalizacion"
        description="Evalue que tan profesionalizada esta su empresa en cada uno de los siguientes criterios."
        criteria={PROFESIONALIZACION_CRITERIA}
        answers={answers}
        onAnswerChange={(id, partial) => setCriterionAnswer('prof', id, partial)}
        averageScore={score.average}
        level={score.level}
      />
    </div>
  );
}
