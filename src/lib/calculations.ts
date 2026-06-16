import type {
  Sector,
  CompanySizeResult,
  ScoreResult,
  ScoreLevel,
  CriterionAnswer,
  CriterionConfig,
  OpportunityArea,
  UrgencySelection,
  UrgencyLevel,
  ServiceAreaId,
  MarginData,
  MarginEvaluation,
  MarginLevel,
  IndustryBenchmark,
} from './types';
import { classifyCompanySize } from '../config/companySize';
import { SERVICE_AREAS } from '../config/serviceAreas';

export function calculateCompanySize(
  sector: Sector,
  employees: number | null,
  salesMDP: number | null
): CompanySizeResult | null {
  if (!employees || !salesMDP || employees <= 0 || salesMDP <= 0) return null;

  const { size, tmcScore } = classifyCompanySize(sector, employees, salesMDP);
  const productivityIndex = salesMDP / employees;

  return { size, tmcScore: Math.round(tmcScore * 100) / 100, productivityIndex: Math.round(productivityIndex * 100) / 100 };
}

function getScoreLevel(score: number): ScoreLevel {
  if (score < 40) return 'Bajo';
  if (score < 75) return 'Medio';
  return 'Alto';
}

export function calculateScore(answers: CriterionAnswer[], criteria: CriterionConfig[]): ScoreResult {
  // Only count answered questions (rating >= 0); skip -1 (unselected)
  const applicableAnswers = answers.filter(a => {
    const config = criteria.find(c => c.id === a.criterionId);
    return config !== undefined && a.rating >= 0;
  });

  if (applicableAnswers.length === 0) {
    return { average: 0, level: 'Bajo', answers };
  }

  let totalWeight = 0;
  let weightedSum = 0;

  for (const answer of applicableAnswers) {
    const config = criteria.find(c => c.id === answer.criterionId);
    const weight = config?.weight ?? 1;
    weightedSum += answer.rating * weight;
    totalWeight += weight;
  }

  // Scale to 0-100: average on 0-10 scale × 10
  const avg010 = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const average = Math.round(avg010 * 10 * 100) / 100;
  return { average, level: getScoreLevel(average), answers };
}

export function mapOpportunityAreas(
  profAnswers: CriterionAnswer[],
  instAnswers: CriterionAnswer[],
  allCriteria: CriterionConfig[],
  threshold = 5
): OpportunityArea[] {
  const areaScores: Record<ServiceAreaId, { needScore: number; triggers: { id: string; text: string; rating: number }[] }> = {
    estructura_organizacional: { needScore: 0, triggers: [] },
    planeacion_estrategica: { needScore: 0, triggers: [] },
    business_analytics: { needScore: 0, triggers: [] },
    procesos: { needScore: 0, triggers: [] },
    investigacion_mercado: { needScore: 0, triggers: [] },
    juntas_directivas: { needScore: 0, triggers: [] },
  };

  const allAnswers = [...profAnswers, ...instAnswers];

  for (const answer of allAnswers) {
    if (answer.rating >= 0 && answer.rating < threshold) {
      const config = allCriteria.find(c => c.id === answer.criterionId);
      if (!config) continue;

      const gap = threshold - answer.rating;
      for (const areaId of config.serviceAreaMappings) {
        areaScores[areaId].needScore += gap * config.weight;
        areaScores[areaId].triggers.push({
          id: config.id,
          text: config.shortLabel,
          rating: answer.rating,
        });
      }
    }
  }

  return Object.entries(areaScores)
    .filter(([, data]) => data.needScore > 0)
    .map(([id, data]) => {
      const serviceArea = SERVICE_AREAS.find(a => a.id === id)!;
      const priority = data.needScore >= 8 ? 'alta' : data.needScore >= 4 ? 'media' : 'baja';
      return {
        serviceArea,
        needScore: Math.round(data.needScore * 100) / 100,
        priority: priority as 'alta' | 'media' | 'baja',
        triggeringCriteria: data.triggers,
      };
    })
    .sort((a, b) => b.needScore - a.needScore);
}

export function calculateUrgency(selection: UrgencySelection): UrgencyLevel {
  switch (selection) {
    case 'muy_urgente': return 'Crítica';
    case 'necesario': return 'Media';
    case 'deseable': return 'Baja';
  }
}

function evaluateSingleMargin(value: number | null, benchmark: number, tolerancia: number, criticoUmbral: number): MarginLevel {
  if (value === null) return 'en_rango';
  if (value > benchmark + tolerancia) return 'arriba_industria';
  if (value >= benchmark - tolerancia) return 'en_rango';
  if (value < benchmark - criticoUmbral || (value < 0 && benchmark > 0)) return 'critico';
  return 'debajo_industria';
}

export function evaluateMargins(marginData: MarginData, benchmark: IndustryBenchmark): MarginEvaluation {
  return {
    margenBruto: {
      value: marginData.margenBruto,
      level: evaluateSingleMargin(marginData.margenBruto, benchmark.margenBruto, benchmark.tolerancia, benchmark.criticoUmbral),
    },
    margenOperativo: {
      value: marginData.margenOperativo,
      level: evaluateSingleMargin(marginData.margenOperativo, benchmark.margenOperativo, benchmark.tolerancia, benchmark.criticoUmbral),
    },
    margenNeto: {
      value: marginData.margenNeto,
      level: evaluateSingleMargin(marginData.margenNeto, benchmark.margenNeto, benchmark.tolerancia, benchmark.criticoUmbral),
    },
  };
}

export function formatMDP(value: number): string {
  if (value >= 1) {
    return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MDP`;
  }
  const thousands = value * 1000;
  return `$${thousands.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mil`;
}
