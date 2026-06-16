import type { CriterionConfig } from '../lib/types';

/* ── Card Options per Criterion ──────────────────────────── */
export interface CardOption {
  icon: string;
  title: string;
  description: string;
  score: number; // 0 | 5 | 10  – never shown to user
}

export const CRITERION_CARD_OPTIONS: Record<string, CardOption[]> = {
  // ── PROFESIONALIZACIÓN (10 preguntas nuevas) ──────────────
  prof_01: [
    { icon: '📭', title: 'Nunca', description: 'No se revisan resultados periódicamente.', score: 0 },
    { icon: '📋', title: 'Esporádico', description: 'Se revisan de manera ocasional.', score: 5 },
    { icon: '📊', title: 'Formal mensual', description: 'Revisión formal y periódica de resultados.', score: 10 },
  ],
  prof_02: [
    { icon: '🏗️', title: 'Sin claridad', description: 'No están definidos.', score: 0 },
    { icon: '🔧', title: 'Existe con diferencias', description: 'Hay organigrama pero con discrepancias.', score: 5 },
    { icon: '✅', title: 'Todos claros', description: 'Organigrama, funciones y perfiles definidos.', score: 10 },
  ],
  prof_03: [
    { icon: '❌', title: 'No existe', description: 'No hay evaluación de desempeño.', score: 0 },
    { icon: '⚙️', title: 'Sin estructura', description: 'Se evalúa informalmente, sin método.', score: 5 },
    { icon: '📝', title: 'Proceso formal', description: 'Evaluación y tabulación formales.', score: 10 },
  ],
  prof_04: [
    { icon: '❓', title: 'No conocidos', description: 'No se conocen los procesos clave.', score: 0 },
    { icon: '📄', title: 'Algunos documentados', description: 'Algunos procesos están documentados.', score: 5 },
    { icon: '🗂️', title: 'Documentados y sistematizados', description: 'Procesos claros, documentados y sistematizados.', score: 10 },
  ],
  prof_05: [
    { icon: '💸', title: 'Solo contable', description: 'Solo se lleva la contabilidad básica.', score: 0 },
    { icon: '📑', title: 'Info parcial', description: 'Se revisa información financiera parcial.', score: 5 },
    { icon: '💰', title: 'Estados financieros mensuales', description: 'Revisión periódica de ingresos, egresos y ganancias.', score: 10 },
  ],
  prof_06: [
    { icon: '🎯', title: 'Sin claridad', description: 'No hay estrategia comercial.', score: 0 },
    { icon: '📌', title: 'Existe sin documentar', description: 'Hay estrategia pero no está documentada.', score: 5 },
    { icon: '🚀', title: 'Toda la organización la conoce', description: 'Estrategia clara, documentada y compartida.', score: 10 },
  ],
  prof_07: [
    { icon: '🗒️', title: 'Nunca', description: 'No se ha realizado planeación estratégica.', score: 0 },
    { icon: '📐', title: 'Existe sin actualizar', description: 'Hay planeación pero no se da seguimiento.', score: 5 },
    { icon: '🗺️', title: 'Plan con seguimiento', description: 'Plan estratégico con metas y seguimiento.', score: 10 },
  ],
  prof_08: [
    { icon: '💸', title: 'No hay presupuesto', description: 'No existen presupuestos de reinversión.', score: 0 },
    { icon: '👤', title: 'Solo dirección', description: 'Solo la dirección conoce los presupuestos.', score: 5 },
    { icon: '✅', title: 'Comprometido por todos', description: 'Presupuestos definidos y asumidos por todos.', score: 10 },
  ],
  prof_09: [
    { icon: '🚷', title: 'No definida', description: 'No hay perfil ni esquema para la dirección.', score: 0 },
    { icon: '💭', title: 'Perfil sin métricas', description: 'Existe perfil pero sin compensación ni supervisión.', score: 5 },
    { icon: '📋', title: 'Perfil, compensación y supervisión formales', description: 'Todo formalizado y documentado.', score: 10 },
  ],
  prof_10: [
    { icon: '❌', title: 'No existe', description: 'No hay consejo consultivo ni de administración.', score: 0 },
    { icon: '👥', title: 'Consejo formal con independientes', description: 'Consejo establecido con consejeros independientes.', score: 10 },
  ],

  // ── INSTITUCIONALIZACIÓN (10 preguntas) ──────────
  inst_01: [
    { icon: '❓', title: 'No lo conocemos', description: 'No se conoce el valor de la empresa ni el patrimonio.', score: 0 },
    { icon: '📊', title: 'Dato sin documentar', description: 'Tenemos el dato pero no esta documentado.', score: 5 },
    { icon: '💎', title: 'Documentado y reconocido', description: 'Conocemos y esta documentado. Todos los propietarios y familiares lo reconocen.', score: 10 },
  ],
  inst_02: [
    { icon: '🔀', title: 'Totalmente mezcladas', description: 'Las finanzas familiares y de la empresa estan totalmente mezcladas.', score: 0 },
    { icon: '⚖️', title: 'Algunas cosas se mezclan', description: 'Hay cierta separacion pero algunas cosas se mezclan.', score: 5 },
    { icon: '✅', title: 'Completamente separadas', description: 'Finanzas completamente separadas con politica de dividendos.', score: 10 },
  ],
  inst_03: [
    { icon: '🚫', title: 'No coinciden', description: 'No coinciden o no se ha hablado. Sin comunicacion abierta sobre esto.', score: 0 },
    { icon: '⚠️', title: 'Coinciden parcialmente', description: 'Coinciden en algunos puntos. Hay discordancias entre generaciones.', score: 5 },
    { icon: '🎯', title: 'Vision alineada', description: 'Se trabaja en alinear la vision entre propietarios y siguientes generaciones.', score: 10 },
  ],
  inst_04: [
    { icon: '👨‍👩‍👦', title: 'Sin criterios formales', description: 'Si, hay familiares indirectos sin criterios formales de contratacion.', score: 0 },
    { icon: '📋', title: 'Siguen protocolos de RH', description: 'Si, pero siguen protocolos de RH para su contratacion.', score: 5 },
    { icon: '🚷', title: 'Politica de no contratar', description: 'Politica de no contratar familiares indirectos.', score: 10 },
  ],
  inst_05: [
    { icon: '❓', title: 'Sin definir', description: 'No se sabe quien sucederia. Sin proceso ni candidato.', score: 0 },
    { icon: '💭', title: 'Sucesor identificado', description: 'Sucesor identificado sin proceso formal. Tiene las capacidades pero sin documento.', score: 5 },
    { icon: '📝', title: 'Formalizado', description: 'Puesto y sucesor formalizados. Responsabilidades, sueldo, supervision y sucesor nombrado.', score: 10 },
  ],
  inst_06: [
    { icon: '❌', title: 'Sin definir', description: 'No se sabe quienes seran futuros accionistas.', score: 0 },
    { icon: '🤝', title: 'Accionistas identificados', description: 'Futuros accionistas identificados pero sin formalizacion.', score: 5 },
    { icon: '✅', title: 'Metodo claro', description: 'Metodo de asignacion y evaluacion claros y documentados.', score: 10 },
  ],
  inst_07: [
    { icon: '📭', title: 'No existe', description: 'No existe tal documento de protocolo familiar.', score: 0 },
    { icon: '📋', title: 'Reglas empiricas', description: 'Reglas empiricas no documentadas. O documento que no se sigue ni respeta.', score: 5 },
    { icon: '📖', title: 'Protocolo vivo', description: 'Protocolo conocido y vivo. Se revisa en el consejo de familia.', score: 10 },
  ],
  inst_08: [
    { icon: '🔀', title: 'Sin separacion', description: 'No existe separacion ni claridad de los 3 circulos.', score: 0 },
    { icon: '🔃', title: 'Roles empiricos', description: 'Roles empiricos sin formalidad.', score: 5 },
    { icon: '✅', title: 'Roles bien definidos', description: 'Roles bien definidos y respetados para empleado, propietario y familia.', score: 10 },
  ],
  inst_09: [
    { icon: '⚡', title: 'Conflictos no resueltos', description: 'Existen conflictos no resueltos. Sin plan para evitar que impacten la empresa.', score: 0 },
    { icon: '☀️', title: 'Sin conflictos o con protocolos', description: 'No hay conflictos o existen protocolos. Acuerdos de mediacion que mitigan riesgos.', score: 10 },
  ],
  inst_10: [
    { icon: '❌', title: 'Sin blindaje legal', description: 'No existen documentos suficientes. Sin blindaje legal.', score: 0 },
    { icon: '✅', title: 'Documentos completos', description: 'Asesorados con todos los documentos. Contratos, convenios y protocolos para asegurar continuidad.', score: 10 },
  ],
};

export const PROFESIONALIZACION_CRITERIA: CriterionConfig[] = [
  {
    id: 'prof_01',
    category: 'profesionalizacion',
    text: 'La empresa acostumbra revisar los resultados más importantes de las diferentes áreas, de forma periódica y formal.',
    shortLabel: 'Revisión de resultados',
    requiresFamilyBusiness: false,
    serviceAreaMappings: ['business_analytics', 'estructura_organizacional'],
    weight: 1,
  },
  {
    id: 'prof_02',
    category: 'profesionalizacion',
    text: 'La empresa tiene claro su organigrama, funciones, perfiles y responsabilidades.',
    shortLabel: 'Organigrama y funciones',
    requiresFamilyBusiness: false,
    serviceAreaMappings: ['estructura_organizacional'],
    weight: 1,
  },
  {
    id: 'prof_03',
    category: 'profesionalizacion',
    text: 'La empresa tiene claro y aplicado el método de evaluación de desempeño y correcta tabulación de salarios.',
    shortLabel: 'Evaluación de desempeño',
    requiresFamilyBusiness: false,
    serviceAreaMappings: ['estructura_organizacional'],
    weight: 1,
  },
  {
    id: 'prof_04',
    category: 'profesionalizacion',
    text: 'La empresa tiene claros sus procesos clave, los tiene documentados y busca sistematizarlos.',
    shortLabel: 'Procesos clave',
    requiresFamilyBusiness: false,
    serviceAreaMappings: ['procesos'],
    weight: 1,
  },
  {
    id: 'prof_05',
    category: 'profesionalizacion',
    text: 'La empresa revisa periódicamente los ingresos, egresos y ganancias reales de la empresa.',
    shortLabel: 'Revisión financiera',
    requiresFamilyBusiness: false,
    serviceAreaMappings: ['business_analytics'],
    weight: 1,
  },
  {
    id: 'prof_06',
    category: 'profesionalizacion',
    text: 'La empresa tiene una clara estrategia comercial, presupuestos de venta, propuesta de valor, nicho de mercado e indicadores.',
    shortLabel: 'Estrategia comercial',
    requiresFamilyBusiness: false,
    serviceAreaMappings: ['planeacion_estrategica', 'investigacion_mercado'],
    weight: 1,
  },
  {
    id: 'prof_07',
    category: 'profesionalizacion',
    text: 'La empresa ha realizado algún tipo de planeación estratégica, objetivos, metas, misión y visión.',
    shortLabel: 'Planeación estratégica',
    requiresFamilyBusiness: false,
    serviceAreaMappings: ['planeacion_estrategica'],
    weight: 1,
  },
  {
    id: 'prof_08',
    category: 'profesionalizacion',
    text: 'La empresa tiene presupuestos de reinversión y política de dividendos a los propietarios.',
    shortLabel: 'Presupuestos y dividendos',
    requiresFamilyBusiness: false,
    serviceAreaMappings: ['planeacion_estrategica', 'business_analytics'],
    weight: 1,
  },
  {
    id: 'prof_09',
    category: 'profesionalizacion',
    text: 'La dirección general tiene su perfil de puesto, esquema de compensación y supervisión.',
    shortLabel: 'Perfil de dirección',
    requiresFamilyBusiness: false,
    serviceAreaMappings: ['juntas_directivas', 'estructura_organizacional'],
    weight: 1,
  },
  {
    id: 'prof_10',
    category: 'profesionalizacion',
    text: 'La empresa tiene un consejo consultivo o de administración, con consejeros independientes externos, supervisando la gestión.',
    shortLabel: 'Consejo consultivo',
    requiresFamilyBusiness: false,
    serviceAreaMappings: ['juntas_directivas'],
    weight: 1,
  },
];

export const INSTITUCIONALIZACION_CRITERIA: CriterionConfig[] = [
  {
    id: 'inst_01',
    category: 'institucionalizacion',
    text: 'Se conoce el valor de su empresa, de las acciones y del patrimonio.',
    shortLabel: 'Valor de empresa',
    requiresFamilyBusiness: false,
    serviceAreaMappings: ['business_analytics', 'planeacion_estrategica'],
    weight: 1,
  },
  {
    id: 'inst_02',
    category: 'institucionalizacion',
    text: 'Las finanzas familiares estan separadas de las finanzas de la empresa y se sigue una politica de dividendos.',
    shortLabel: 'Separacion finanzas',
    requiresFamilyBusiness: true,
    serviceAreaMappings: ['estructura_organizacional', 'planeacion_estrategica'],
    weight: 1,
  },
  {
    id: 'inst_03',
    category: 'institucionalizacion',
    text: 'Los familiares-propietarios coinciden en la vision y destino de la empresa a mediano/largo plazo.',
    shortLabel: 'Vision compartida',
    requiresFamilyBusiness: true,
    serviceAreaMappings: ['planeacion_estrategica', 'juntas_directivas'],
    weight: 1,
  },
  {
    id: 'inst_04',
    category: 'institucionalizacion',
    text: 'Hay familiares indirectos (conyuges, tios, primos, etc.) trabajando dentro de la empresa.',
    shortLabel: 'Familiares indirectos',
    requiresFamilyBusiness: true,
    serviceAreaMappings: ['estructura_organizacional'],
    weight: 1,
  },
  {
    id: 'inst_05',
    category: 'institucionalizacion',
    text: 'Se tiene definido, claro y documentado el proceso de sucesion directiva (perfil, compensacion, evaluacion).',
    shortLabel: 'Sucesion directiva',
    requiresFamilyBusiness: false,
    serviceAreaMappings: ['juntas_directivas', 'planeacion_estrategica'],
    weight: 1,
  },
  {
    id: 'inst_06',
    category: 'institucionalizacion',
    text: 'Se tiene definido, claro y documentado su proceso de sucesion accionaria (responsabilidades, tipo de consejero, acuerdos).',
    shortLabel: 'Sucesion accionaria',
    requiresFamilyBusiness: false,
    serviceAreaMappings: ['juntas_directivas', 'planeacion_estrategica'],
    weight: 1,
  },
  {
    id: 'inst_07',
    category: 'institucionalizacion',
    text: 'Tienen documentado su protocolo familiar (reglas entre la familia y la empresa).',
    shortLabel: 'Protocolo familiar',
    requiresFamilyBusiness: true,
    serviceAreaMappings: ['juntas_directivas', 'estructura_organizacional'],
    weight: 1,
  },
  {
    id: 'inst_08',
    category: 'institucionalizacion',
    text: 'Los roles y responsabilidades de los 3 circulos (empleado, propietario y familia) estan claramente definidos.',
    shortLabel: 'Roles 3 circulos',
    requiresFamilyBusiness: true,
    serviceAreaMappings: ['estructura_organizacional'],
    weight: 1,
  },
  {
    id: 'inst_09',
    category: 'institucionalizacion',
    text: 'La empresa esta libre de conflictos familiares graves que pongan en riesgo la continuidad, confianza y armonia.',
    shortLabel: 'Libre de conflictos',
    requiresFamilyBusiness: true,
    serviceAreaMappings: ['estructura_organizacional', 'juntas_directivas'],
    weight: 1,
  },
  {
    id: 'inst_10',
    category: 'institucionalizacion',
    text: 'Existen convenios, contratos, testamentos y otros documentos legales que blinden a la empresa de cualquier eventualidad.',
    shortLabel: 'Blindaje legal',
    requiresFamilyBusiness: false,
    serviceAreaMappings: ['juntas_directivas', 'planeacion_estrategica'],
    weight: 1,
  },
];

export const ALL_CRITERIA = [...PROFESIONALIZACION_CRITERIA, ...INSTITUCIONALIZACION_CRITERIA];
