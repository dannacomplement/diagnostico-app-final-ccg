import { v4 as uuidv4 } from 'uuid';
import type { SavedDiagnostic, SavedOrgSurvey } from './types';
import { PROFESIONALIZACION_CRITERIA, INSTITUCIONALIZACION_CRITERIA } from '../config/questions';
import { calculateCompanySize, calculateScore, mapOpportunityAreas, calculateUrgency } from './calculations';
import { saveDiagnostic } from './storage';

export function generateSampleDiagnostic(): SavedDiagnostic {
  const datosGenerales = {
    nombreComercial: 'Grupo Alimentos del Norte S.A. de C.V.',
    antiguedadConstituida: '22',
    antiguedadOperativa: '25',
    empresaFamiliar: 'si_2da' as const,
    respondente: 'Carlos Mendoza Ruiz',
    email: 'carlos.mendoza@grupoalimentos.com',
    puestoEmpresa: 'Director General',
    puestoFamilia: 'Hijo del fundador',
    esSocio: 'si' as const,
    porcentajeAcciones: '35',
    ubicacion: 'Nuevo León',
    sector: 'manufactura' as const,
    softwareSelections: {
      selected: ['excel' as const],
      erpDetalle: '',
      mrpDetalle: '',
      crmDetalle: '',
      excelNivel: 'intermedio' as const,
    },
  };

  const situacionActual = {
    ventasAnualesMDP: 120,
    empleadosTotales: 85,
    empleadosFamiliares: 8,
    socios: '3',
    sociosDetalle: [
      { nombre: 'Roberto Mendoza', esFamiliar: true, porcentaje: '50' },
      { nombre: 'Carlos Mendoza', esFamiliar: true, porcentaje: '35' },
      { nombre: 'Javier López', esFamiliar: false, porcentaje: '15' },
    ],
    familiaresEnPoder: '4',
    sueldoMasAlto: '85000',
    pctIngresoFiscalizado: 70,
    pctEgresoFiscalizado: 55,
  };

  const profAnswers = [
    { criterionId: 'prof_01', siNo: true, rating: 5, comentario: 'Se revisan de manera ocasional' },
    { criterionId: 'prof_02', siNo: false, rating: 0, comentario: 'Existe organigrama pero con diferencias' },
    { criterionId: 'prof_03', siNo: false, rating: 0, comentario: 'No hay evaluación de desempeño formal' },
    { criterionId: 'prof_04', siNo: true, rating: 5, comentario: 'Algunos procesos documentados' },
    { criterionId: 'prof_05', siNo: true, rating: 5, comentario: 'Se revisa información financiera parcial' },
    { criterionId: 'prof_06', siNo: false, rating: 0, comentario: 'No hay estrategia comercial clara' },
    { criterionId: 'prof_07', siNo: false, rating: 5, comentario: 'Hay misión y visión pero sin seguimiento' },
    { criterionId: 'prof_08', siNo: false, rating: 0, comentario: 'No hay presupuesto de reinversión' },
    { criterionId: 'prof_09', siNo: false, rating: 0, comentario: 'Dirección sin perfil formal' },
    { criterionId: 'prof_10', siNo: false, rating: 0, comentario: 'No existe consejo consultivo' },
  ];

  const instAnswers = [
    { criterionId: 'inst_01', siNo: false, rating: 0, comentario: 'No se conoce el valor real de la empresa' },
    { criterionId: 'inst_02', siNo: true, rating: 5, comentario: 'Algunas cosas se mezclan entre familia y empresa' },
    { criterionId: 'inst_03', siNo: true, rating: 5, comentario: 'Coinciden en algunos puntos pero hay discordancias generacionales' },
    { criterionId: 'inst_04', siNo: false, rating: 0, comentario: 'Hay familiares indirectos sin criterios formales' },
    { criterionId: 'inst_05', siNo: false, rating: 0, comentario: 'No hay plan de sucesion directiva documentado' },
    { criterionId: 'inst_06', siNo: false, rating: 0, comentario: 'No se sabe quienes seran futuros accionistas' },
    { criterionId: 'inst_07', siNo: false, rating: 0, comentario: 'No existe protocolo familiar' },
    { criterionId: 'inst_08', siNo: false, rating: 0, comentario: 'Los roles de empleado, propietario y familia no estan separados' },
    { criterionId: 'inst_09', siNo: false, rating: 0, comentario: 'Existen conflictos no resueltos entre hermanos' },
    { criterionId: 'inst_10', siNo: false, rating: 0, comentario: 'No existen documentos legales suficientes' },
  ];

  const gerencias = [
    { area: 'Dirección General', nombre: 'Carlos Mendoza', cubierto: true, antiguedad: '12', calificado: 'si' as const, rangoSueldo: '120-150 mil', esFamiliar: true, dgEvaluation: { nivelEstudios: 8, experienciaLaboral: 10, seguimientoResultados: 6 } },
    { area: 'Administración y Finanzas', nombre: 'Patricia Mendoza', cubierto: true, antiguedad: '18', calificado: 'no' as const, rangoSueldo: '55-75 mil', esFamiliar: false },
    { area: 'Comercial y Ventas', nombre: 'Laura Ríos', cubierto: true, antiguedad: '6', calificado: 'si' as const, rangoSueldo: '75-90 mil', esFamiliar: false },
    { area: 'Operaciones', nombre: 'Miguel Mendoza', cubierto: true, antiguedad: '15', calificado: 'por_evaluar' as const, rangoSueldo: '40-55 mil', esFamiliar: true },
    { area: 'Capital Humano', nombre: 'Ana García', cubierto: true, antiguedad: '3', calificado: 'si' as const, rangoSueldo: '30-40 mil', esFamiliar: false },
  ];

  const retos = [
    'Profesionalizar la operación y reducir la dependencia de decisiones familiares informales',
    'Separar las finanzas personales/familiares de las finanzas de la empresa de manera clara',
    'Preparar la empresa para una transición generacional ordenada en los próximos 5 años',
  ];

  const analisisFamiliar = {
    gobiernoFamiliar: 'No existe un consejo de familia formal. Las decisiones se toman en reuniones informales entre el padre fundador y sus dos hijos. No hay estructura de gobierno definida.',
    planSucesion: 'El fundador (72 años) sigue siendo presidente del consejo pero el hijo mayor opera como DG. No hay plan documentado ni cronograma de transición.',
    protocoloFamiliar: 'No existe protocolo familiar. Las reglas son implícitas y basadas en costumbre. Se han presentado desacuerdos sobre la incorporación de la esposa de uno de los hijos.',
    conflictosFamiliares: 'Existen tensiones moderadas por diferencias en la visión del negocio entre los hermanos. También hay conflicto potencial por la incorporación de familiares políticos.',
    rolesOperacion: 'Los roles no están claramente separados. El padre fundador interviene en decisiones operativas sin seguir el organigrama. Los hermanos a veces duplican funciones.',
    profesionalizacionFamiliares: 'Carlos (DG) tiene MBA. Su hermano Miguel (Planta) tiene experiencia pero sin formación administrativa formal. La tía Patricia no tiene perfil para el puesto.',
  };

  const companySize = calculateCompanySize(datosGenerales.sector, situacionActual.empleadosTotales, situacionActual.ventasAnualesMDP)
    ?? { size: 'Mediana' as const, tmcScore: 116.5, productivityIndex: 1.41 };

  const profScore = calculateScore(profAnswers, PROFESIONALIZACION_CRITERIA);
  const instScore = calculateScore(instAnswers, INSTITUCIONALIZACION_CRITERIA);

  const opportunityAreas = mapOpportunityAreas(
    profAnswers,
    instAnswers,
    [...PROFESIONALIZACION_CRITERIA, ...INSTITUCIONALIZACION_CRITERIA]
  );

  const urgencyLevel = calculateUrgency('muy_urgente');

  const diagnostic: SavedDiagnostic = {
    id: uuidv4(),
    savedAt: new Date().toISOString(),
    datosGenerales,
    situacionActual,
    companySize,
    profesionalizacion: profScore,
    institucionalizacion: instScore,
    opportunityAreas,
    gerencias,
    descripcionNegocio: 'Somos una empresa familiar dedicada a la manufactura y distribución de productos alimenticios en el norte de México. Nuestros principales clientes son cadenas de autoservicio regionales y distribuidores mayoristas. Contamos con una planta de producción propia y una flotilla de distribución. Nuestra ventaja competitiva es la calidad artesanal de nuestros productos y las relaciones comerciales de más de 20 años con nuestros clientes principales.',
    retos,
    urgenciaSelection: 'muy_urgente',
    urgenciaLevel: urgencyLevel,
    tieneLiderInterno: true,
    analisisFamiliar,
    priority: true,
    classification: 'seguimiento',
  };

  return diagnostic;
}

export async function loadSampleDiagnostic(): Promise<SavedDiagnostic> {
  const diagnostic = generateSampleDiagnostic();
  await saveDiagnostic(diagnostic);
  return diagnostic;
}

export function generateSampleOrgSurvey(): SavedOrgSurvey {
  return {
    id: uuidv4(),
    savedAt: new Date().toISOString(),
    companyName: 'Grupo Alimentos del Norte S.A. de C.V.',
    orgStructure: {
      tieneOrganigrama: true,
      organigramaActualizado: false,
      descripcionesPuesto: 'algunas',
      tieneTabulador: false,
      nominaMensualTotal: 850000,
    },
    areaDetails: [
      { nombre: 'Dirección General', colaboradores: 3, sueldoPromedio: 45000, tieneLider: true },
      { nombre: 'Administración y Finanzas', colaboradores: 12, sueldoPromedio: 14000, tieneLider: true },
      { nombre: 'Comercial y Ventas', colaboradores: 18, sueldoPromedio: 12500, tieneLider: true },
      { nombre: 'Operaciones / Producción', colaboradores: 38, sueldoPromedio: 8500, tieneLider: true },
      { nombre: 'Capital Humano', colaboradores: 4, sueldoPromedio: 15000, tieneLider: true },
      { nombre: 'Logística y Distribución', colaboradores: 10, sueldoPromedio: 9000, tieneLider: false, isCustom: true },
    ],
    talentProcesses: {
      procesoReclutamiento: true,
      evaluacionesDesempeno: 'parcialmente',
      programaCapacitacion: false,
      rotacionAnual: 22,
      competitividadSueldos: 'debajo',
      retoCapitalHumano: 'La rotación en el área de producción es alta debido a sueldos por debajo del mercado. Necesitamos implementar un programa de retención y un tabulador competitivo. También falta un programa formal de capacitación para mandos medios.',
    },
  };
}
