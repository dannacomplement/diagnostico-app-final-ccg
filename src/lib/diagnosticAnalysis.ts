/**
 * Shared diagnostic analysis engine.
 * Used by both the web ReportPage and the PDF export.
 */
import type { SavedDiagnostic, Sector } from './types';
import { ALL_CRITERIA } from '../config/questions';
import { DEFAULT_INDUSTRY_BENCHMARKS } from '../config/constants';

/* ========================================
   Types
   ======================================== */

export interface MaturityResult {
  score: number;             // 0-100
  level: string;             // 'Muy Bajo' | 'Bajo' | 'Medio' | 'Alto'
  profContrib: number;
  instContrib: number;
  gerContrib: number;
  marginContrib: number;
}

export interface RiskItem {
  risk: string;
  severity: 'critico' | 'alto' | 'moderado';
  impact: string;
}

export interface GrowthReadiness {
  ready: boolean;
  score: number;
  factors: string[];
}

/* ========================================
   Maturity Index
   ======================================== */

export function computeMaturityIndex(d: SavedDiagnostic): MaturityResult {
  const profScore = Math.max(0, d.profesionalizacion.average) * 0.35;
  const instScore = Math.max(0, d.institucionalizacion.average) * 0.25;

  const totalG = d.gerencias.length || 1;
  const coveredG = d.gerencias.filter(g => g.cubierto).length;
  const qualifiedG = d.gerencias.filter(g => g.cubierto && g.calificado === 'si').length;
  const gerScore = ((coveredG / totalG) * 10 + (qualifiedG / totalG) * 10);

  let marginScore = 10;
  if (d.marginEvaluation) {
    const marginLevels = [d.marginEvaluation.margenBruto.level, d.marginEvaluation.margenOperativo.level, d.marginEvaluation.margenNeto.level];
    const marginPoints = marginLevels.reduce((sum, lvl) => {
      if (lvl === 'arriba_industria') return sum + 6.67;
      if (lvl === 'en_rango') return sum + 5;
      if (lvl === 'debajo_industria') return sum + 2.5;
      return sum + 0;
    }, 0);
    marginScore = marginPoints;
  }

  const total = Math.round(profScore + instScore + gerScore + marginScore);
  const capped = Math.min(100, Math.max(0, total));

  let level: string;
  if (capped < 30) { level = 'Muy Bajo'; }
  else if (capped < 60) { level = 'Bajo'; }
  else if (capped < 85) { level = 'Medio'; }
  else { level = 'Alto'; }

  return {
    score: capped,
    level,
    profContrib: Math.round(profScore),
    instContrib: Math.round(instScore),
    gerContrib: Math.round(gerScore),
    marginContrib: Math.round(marginScore),
  };
}

/* ========================================
   Risk Profile
   ======================================== */

export function computeRiskProfile(d: SavedDiagnostic): RiskItem[] {
  const risks: RiskItem[] = [];

  const succession = d.institucionalizacion.answers.find(a => a.criterionId === 'inst_05');
  if (succession && succession.rating <= 0) {
    risks.push({
      risk: 'Sucesion directiva sin definir',
      severity: 'critico',
      impact: 'No tener documentado el proceso de sucesion directiva pone en riesgo la continuidad del negocio ante la salida del lider actual.',
    });
  }

  const finControl = d.profesionalizacion.answers.find(a => a.criterionId === 'prof_05');
  if (finControl && finControl.rating <= 0) {
    risks.push({
      risk: 'Sin control financiero claro',
      severity: 'critico',
      impact: 'No tener visibilidad de ingresos, egresos y ganancias reales impide tomar decisiones informadas y puede llevar a problemas de flujo de efectivo.',
    });
  }

  const uncovered = d.gerencias.filter(g => !g.cubierto);
  if (uncovered.length >= 2) {
    risks.push({
      risk: `${uncovered.length} puestos gerenciales sin cubrir`,
      severity: 'critico',
      impact: `Las areas de ${uncovered.map(g => g.area).join(' y ')} no tienen responsable asignado, generando cuellos de botella y falta de liderazgo.`,
    });
  } else if (uncovered.length === 1) {
    risks.push({
      risk: `Puesto sin cubrir: ${uncovered[0].area}`,
      severity: 'alto',
      impact: `El area de ${uncovered[0].area} no tiene responsable, concentrando la carga en otras posiciones.`,
    });
  }

  if (d.marginEvaluation) {
    const criticalMargins = (['margenBruto', 'margenOperativo', 'margenNeto'] as const)
      .filter(k => d.marginEvaluation![k].level === 'critico');
    if (criticalMargins.length > 0) {
      const labels = criticalMargins.map(k => k === 'margenBruto' ? 'bruto' : k === 'margenOperativo' ? 'operativo' : 'neto');
      risks.push({
        risk: `Margenes en nivel critico: ${labels.join(', ')}`,
        severity: 'critico',
        impact: 'Los margenes estan significativamente por debajo de la industria, poniendo en riesgo la rentabilidad y sostenibilidad del negocio.',
      });
    }
  }

  const strategy = d.profesionalizacion.answers.find(a => a.criterionId === 'prof_06');
  const planning = d.profesionalizacion.answers.find(a => a.criterionId === 'prof_07');
  if (strategy && planning && strategy.rating <= 0 && planning.rating <= 0) {
    risks.push({
      risk: 'Sin estrategia ni planeacion formal',
      severity: 'alto',
      impact: 'Operar sin estrategia comercial ni planeacion limita el crecimiento y hace a la empresa reactiva ante los cambios del mercado.',
    });
  }

  const consejo = d.profesionalizacion.answers.find(a => a.criterionId === 'prof_10');
  if (consejo && consejo.rating <= 0) {
    risks.push({
      risk: 'Sin consejo consultivo ni de administracion',
      severity: 'alto',
      impact: 'La falta de un consejo con independientes limita la supervision externa y la calidad de las decisiones estrategicas.',
    });
  }

  const procesos = d.profesionalizacion.answers.find(a => a.criterionId === 'prof_04');
  if (procesos && procesos.rating <= 0) {
    risks.push({
      risk: 'Procesos clave sin documentar',
      severity: 'moderado',
      impact: 'Sin procesos estandarizados, la calidad depende de las personas y no de la empresa. Dificulta escalar operaciones.',
    });
  }

  const isFamily = d.datosGenerales.empresaFamiliar !== 'no';
  if (isFamily) {
    const conflictos = d.institucionalizacion.answers.find(a => a.criterionId === 'inst_09');
    if (conflictos && conflictos.rating <= 0) {
      risks.push({
        risk: 'Conflictos familiares activos o latentes',
        severity: 'alto',
        impact: 'Los conflictos familiares no resueltos pueden paralizar la toma de decisiones y poner en riesgo la continuidad de la empresa.',
      });
    }
  }

  return risks.slice(0, 6);
}

/* ========================================
   Diagnostic Narrative
   ======================================== */

export function generateDiagnosticNarrative(d: SavedDiagnostic, maturity: MaturityResult): string {
  const dg = d.datosGenerales;
  const sa = d.situacionActual;
  const isFamily = dg.empresaFamiliar !== 'no';
  const sectorLabel = dg.sector === 'manufactura' ? 'manufactura' : dg.sector === 'comercio' ? 'comercio' : 'servicios';

  let narrative = '';
  const sizeLabel = d.companySize.size.toLowerCase();
  if (dg.antiguedadOperativa) {
    narrative += `${dg.nombreComercial || 'La empresa'} es una ${isFamily ? 'empresa familiar ' : ''}${sizeLabel} del sector ${sectorLabel} con ${dg.antiguedadOperativa} anos de operacion`;
  } else {
    narrative += `${dg.nombreComercial || 'La empresa'} es una ${isFamily ? 'empresa familiar ' : ''}${sizeLabel} del sector ${sectorLabel}`;
  }
  if (sa.empleadosTotales) {
    narrative += ` y ${sa.empleadosTotales} colaboradores`;
  }
  narrative += '. ';

  if (maturity.score <= 30) {
    narrative += 'El analisis refleja una empresa en etapa inicial de formalizacion, donde la mayoria de los procesos dependen de las personas y no de sistemas estructurados. ';
  } else if (maturity.score <= 55) {
    narrative += 'El diagnostico muestra una empresa en desarrollo que ha avanzado en algunas areas pero requiere fortalecer su estructura para crecer de forma sostenible. ';
  } else if (maturity.score <= 80) {
    narrative += 'Los resultados muestran una empresa con buena base de formalizacion que puede enfocarse en optimizar las areas especificas identificadas para alcanzar la madurez. ';
  } else {
    narrative += 'La empresa muestra un alto nivel de madurez empresarial con procesos solidos y buena estructura organizacional. ';
  }

  const highAnswers = [...d.profesionalizacion.answers, ...d.institucionalizacion.answers]
    .filter(a => a.rating >= 8);
  if (highAnswers.length > 0) {
    const topLabels = highAnswers.slice(0, 3).map(a =>
      ALL_CRITERIA.find(c => c.id === a.criterionId)?.shortLabel?.toLowerCase()
    ).filter(Boolean);
    if (topLabels.length > 0) {
      narrative += `Destaca positivamente en ${topLabels.join(', ')}. `;
    }
  }

  const lowestAnswer = [...d.profesionalizacion.answers, ...d.institucionalizacion.answers]
    .filter(a => a.rating >= 0)
    .sort((a, b) => a.rating - b.rating)[0];
  if (lowestAnswer && lowestAnswer.rating <= 3) {
    const label = ALL_CRITERIA.find(c => c.id === lowestAnswer.criterionId)?.shortLabel?.toLowerCase();
    if (label) {
      narrative += `El area con mayor oportunidad de mejora es ${label}, que requiere atencion prioritaria. `;
    }
  }

  if (d.marginEvaluation) {
    const criticalCount = (['margenBruto', 'margenOperativo', 'margenNeto'] as const)
      .filter(k => d.marginEvaluation![k].level === 'critico').length;
    const aboveCount = (['margenBruto', 'margenOperativo', 'margenNeto'] as const)
      .filter(k => d.marginEvaluation![k].level === 'arriba_industria').length;
    if (criticalCount > 0) {
      narrative += 'Los margenes financieros presentan niveles criticos que requieren atencion inmediata para asegurar la viabilidad del negocio. ';
    } else if (aboveCount >= 2) {
      narrative += 'La rentabilidad es solida, con margenes por encima del promedio de la industria. ';
    }
  }

  if (d.urgenciaLevel === 'Crítica' || d.urgenciaLevel === 'Alta') {
    narrative += 'El nivel de urgencia reportado sugiere que actuar con prontitud es clave para el crecimiento y la armonia empresarial.';
  }

  return narrative;
}

/* ========================================
   Growth Readiness
   ======================================== */

export function generateGrowthReadiness(d: SavedDiagnostic): GrowthReadiness {
  let score = 0;
  const factors: string[] = [];

  const coveredPct = d.gerencias.filter(g => g.cubierto).length / (d.gerencias.length || 1);
  if (coveredPct >= 0.8) { score += 25; factors.push('Equipo gerencial completo'); }
  else if (coveredPct >= 0.6) { score += 10; }
  else { factors.push('Falta cubrir puestos gerenciales clave'); }

  if (d.profesionalizacion.average >= 70) { score += 25; factors.push('Procesos bien establecidos'); }
  else if (d.profesionalizacion.average >= 40) { score += 12; }
  else { factors.push('Procesos aun no formalizados'); }

  if (d.institucionalizacion.average >= 70) { score += 25; factors.push('Gobierno corporativo solido'); }
  else if (d.institucionalizacion.average >= 40) { score += 12; }
  else { factors.push('Falta institucionalizar la empresa'); }

  if (d.marginEvaluation) {
    const healthy = (['margenBruto', 'margenOperativo', 'margenNeto'] as const)
      .filter(k => d.marginEvaluation![k].level === 'arriba_industria' || d.marginEvaluation![k].level === 'en_rango').length;
    if (healthy >= 2) { score += 25; factors.push('Rentabilidad saludable'); }
    else if (healthy >= 1) { score += 10; }
    else { factors.push('Rentabilidad insuficiente para crecer'); }
  } else {
    score += 12;
  }

  return { ready: score >= 60, score: Math.min(100, score), factors };
}

/* ========================================
   Smart Recommendations
   ======================================== */

export function generateSmartRecommendations(d: SavedDiagnostic, maturity: MaturityResult, risks: RiskItem[]): string[] {
  const recs: string[] = [];
  const isFamily = d.datosGenerales.empresaFamiliar !== 'no';

  for (const risk of risks.filter(r => r.severity === 'critico').slice(0, 2)) {
    if (risk.risk.includes('sucesion')) {
      recs.push('Documentar un plan de sucesion directiva que incluya: perfil del sucesor, cronograma de transicion (12-24 meses), y proceso de evaluacion. Iniciar la preparacion del candidato de forma inmediata.');
    } else if (risk.risk.includes('financiero')) {
      recs.push('Implementar un tablero financiero mensual que incluya estado de resultados, flujo de efectivo, y comparativo vs. presupuesto. Considere un sistema contable que genere estos reportes automaticamente.');
    } else if (risk.risk.includes('gerenciales') || risk.risk.includes('Puesto sin cubrir')) {
      recs.push('Priorizar la contratacion o asignacion de responsables en los puestos clave pendientes. Definir perfil de puesto, rango salarial y proceso de seleccion para cada posicion.');
    } else if (risk.risk.includes('Margenes')) {
      const bench = DEFAULT_INDUSTRY_BENCHMARKS[d.datosGenerales.sector as Sector];
      recs.push(`Realizar un analisis de estructura de costos para identificar donde se concentra la erosion del margen. El benchmark de ${d.datosGenerales.sector} es: bruto ${bench.margenBruto}%, operativo ${bench.margenOperativo}%, neto ${bench.margenNeto}%.`);
    }
  }

  const sortedAnswers = [...d.profesionalizacion.answers, ...d.institucionalizacion.answers]
    .filter(a => a.rating >= 0)
    .sort((a, b) => a.rating - b.rating);

  const critRecs: Record<string, string> = {
    prof_01: 'Implementar reuniones periodicas de revision de resultados por area, con indicadores claros y acciones concretas de seguimiento.',
    prof_02: 'Disenar un organigrama funcional, documentar las responsabilidades de cada puesto y definir perfiles claros.',
    prof_03: 'Disenar e implementar un sistema de evaluacion de desempeno con indicadores medibles, y una tabulacion salarial alineada al mercado.',
    prof_04: 'Documentar y sistematizar los procesos clave del negocio. Priorizar los que mas impactan la operacion y la satisfaccion del cliente.',
    prof_05: 'Establecer estados financieros mensuales con revision de ingresos, egresos y utilidades reales, no solo contabilidad fiscal.',
    prof_06: 'Desarrollar un plan comercial con: propuesta de valor diferenciada, segmentacion de mercado, presupuesto de ventas por canal, y KPIs de seguimiento.',
    prof_07: 'Realizar un ejercicio de planeacion estrategica: definir mision/vision, analisis FODA, objetivos a 3 anos, y presupuestos de inversion anuales.',
    prof_08: 'Definir presupuestos de reinversion y una politica de dividendos acordada por todos los socios o propietarios.',
    prof_09: 'Formalizar el perfil de la direccion general incluyendo competencias, esquema de compensacion, y mecanismo de supervision y evaluacion.',
    prof_10: 'Establecer un consejo consultivo o de administracion con al menos un consejero independiente externo para supervisar y mejorar la gestion.',
    inst_01: 'Realizar una valuacion formal de la empresa para conocer el valor real de las acciones y patrimonio. Documentarlo y compartirlo con todos los propietarios.',
    inst_02: 'Separar las finanzas familiares de las de la empresa con politicas claras de dividendos, prestamos y compensaciones.',
    inst_03: 'Trabajar en alinear la vision entre familiares-propietarios sobre el destino de la empresa. Facilitar comunicacion abierta intergeneracional.',
    inst_04: 'Establecer criterios formales de contratacion para familiares indirectos, o definir una politica clara sobre su participacion.',
    inst_05: 'Documentar un plan de sucesion directiva que incluya: perfil del sucesor, cronograma de transicion (12-24 meses), y proceso de evaluacion.',
    inst_06: 'Definir y documentar el proceso de sucesion accionaria incluyendo responsabilidades, tipo de consejero y acuerdos entre socios.',
    inst_07: 'Desarrollar un protocolo familiar que establezca reglas claras para la relacion familia-empresa: incorporacion de familiares, compensacion, gobierno y resolucion de conflictos.',
    inst_08: 'Definir y separar claramente los roles de empleado, propietario y familiar dentro de la empresa. Cada circulo debe tener sus propias reglas y responsabilidades.',
    inst_09: 'Abordar de forma proactiva los conflictos familiares mediante acuerdos claros, mediacion profesional y protocolos de resolucion de disputas.',
    inst_10: 'Asegurar que existan convenios, contratos, testamentos y documentos legales que protejan la continuidad de la empresa ante cualquier eventualidad.',
  };

  for (const ans of sortedAnswers.slice(0, 3)) {
    const rec = critRecs[ans.criterionId];
    if (rec && !recs.some(r => r.includes(rec.substring(0, 30)))) {
      recs.push(rec);
    }
  }

  if (maturity.score <= 55) {
    recs.push('Antes de buscar crecimiento agresivo, enfoquese en consolidar la base operativa: documentar procesos, cubrir puestos clave, y establecer controles financieros. Una empresa que crece sin estructura multiplica sus problemas.');
  }

  if (isFamily && d.analisisFamiliar) {
    if (!d.analisisFamiliar.protocoloFamiliar) {
      recs.push('Como empresa familiar, se recomienda desarrollar un protocolo familiar que establezca reglas claras para la relacion familia-empresa: incorporacion de familiares, compensacion, gobierno, y resolucion de conflictos.');
    }
  }

  const sw = d.datosGenerales.softwareSelections;
  if (sw.selected.includes('nada') || (sw.selected.includes('excel') && sw.selected.length === 1)) {
    recs.push('La gestion basada unicamente en Excel o sin herramientas digitales limita el control y la escalabilidad. Evaluar la implementacion de un sistema ERP adecuado al tamano de la empresa.');
  }

  return recs.slice(0, 6);
}
