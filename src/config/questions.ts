import type { CriterionConfig } from '../lib/types';
import type { LucideIcon } from 'lucide-react';
import {
  Ban, Banknote, BarChart3, BookOpen, Building2, CircleCheck, CircleHelp, CircleX,
  ClipboardList, File, FileText, Files, FolderOpen, Gem, Handshake, Inbox, Map,
  MessageCircle, NotebookText, PiggyBank, Pin, RefreshCw, Rocket, Ruler, Scale,
  Settings, Shuffle, Sun, Target, TriangleAlert, User, UserX, Users, UsersRound,
  Wrench, Zap,
} from 'lucide-react';

/* ── Card Options per Criterion ──────────────────────────── */
export interface CardOption {
  icon: LucideIcon;
  title: string;
  description: string;
  score: number; // 0 | 5 | 10  – never shown to user
}

export const CRITERION_CARD_OPTIONS: Record<string, CardOption[]> = {
  // ── PROFESIONALIZACIÓN (10 preguntas nuevas) ──────────────
  prof_01: [
    { icon: Inbox, title: 'Nunca', description: 'Nunca hacemos reuniones de resultados.', score: 0 },
    { icon: ClipboardList, title: 'Esporádico', description: 'Reuniones esporádicas e informales.', score: 5 },
    { icon: BarChart3, title: 'Formal mensual', description: 'Reuniones formales mensuales por área.', score: 10 },
  ],
  prof_02: [
    { icon: Building2, title: 'Sin claridad', description: 'No hay claridad de roles. Los familiares no siguen estos lineamientos.', score: 0 },
    { icon: Wrench, title: 'Existe con diferencias', description: 'Existe pero con diferencias. Confusiones sobre jerarquías y liderazgos.', score: 5 },
    { icon: CircleCheck, title: 'Todos claros', description: 'Todos tienen claras sus funciones. Incluyendo familiares; liderazgo identificado.', score: 10 },
  ],
  prof_03: [
    { icon: CircleX, title: 'No existe', description: 'No existe método de evaluación.', score: 0 },
    { icon: Settings, title: 'Sin estructura', description: 'Evaluaciones sin estructura.', score: 5 },
    { icon: FileText, title: 'Proceso formal', description: 'Proceso formal igual para todos.', score: 10 },
  ],
  prof_04: [
    { icon: CircleHelp, title: 'No conocidos', description: 'No conocemos los procesos clave. Los familiares no siguen procesos.', score: 0 },
    { icon: File, title: 'Algunos documentados', description: 'Algunos documentados. Se siguen de forma manual, no sistematizada.', score: 5 },
    { icon: FolderOpen, title: 'Documentados y sistematizados', description: 'Documentados y sistematizados. Con sistemas que aseguran que se cumplan.', score: 10 },
  ],
  prof_05: [
    { icon: Banknote, title: 'Solo contable', description: 'Solo conocemos lo contable.', score: 0 },
    { icon: Files, title: 'Info parcial', description: 'Algo de info pero no cuadra.', score: 5 },
    { icon: PiggyBank, title: 'Estados financieros mensuales', description: 'Estados financieros mensuales.', score: 10 },
  ],
  prof_06: [
    { icon: Target, title: 'Sin claridad', description: 'No tenemos claro el plan comercial.', score: 0 },
    { icon: Pin, title: 'Existe sin documentar', description: 'Existe plan pero falta documentar. No toda la organización lo entiende.', score: 5 },
    { icon: Rocket, title: 'Toda la organización la conoce', description: 'Toda la organización conoce la estrategia. Con métricas y planes de acción aterrizados.', score: 10 },
  ],
  prof_07: [
    { icon: NotebookText, title: 'Nunca', description: 'Nunca nos hemos reunido a planear.', score: 0 },
    { icon: Ruler, title: 'Existe sin actualizar', description: 'Existe pero no actualizado.', score: 5 },
    { icon: Map, title: 'Plan con seguimiento', description: 'Plan estratégico con seguimiento continuo.', score: 10 },
  ],
  prof_08: [
    { icon: Banknote, title: 'No hay presupuesto', description: 'No hay presupuesto formal. Tampoco políticas de reinversión ni dividendos.', score: 0 },
    { icon: User, title: 'Solo dirección', description: 'Presupuesto manejado solo por dirección. Administración o dirección general.', score: 5 },
    { icon: CircleCheck, title: 'Comprometido por todos', description: 'Presupuesto comprometido por todos. Reinversión y dividendos bien definidos.', score: 10 },
  ],
  prof_09: [
    { icon: UserX, title: 'No definida', description: 'Dirección no definida o repartida.', score: 0 },
    { icon: MessageCircle, title: 'Perfil sin métricas', description: 'Existe perfil pero sin métricas claras.', score: 5 },
    { icon: ClipboardList, title: 'Perfil formal', description: 'Perfil, compensación y supervisión formales.', score: 10 },
  ],
  prof_10: [
    { icon: CircleX, title: 'No existe', description: 'No existe tal consejo. Sin supervisión a la dirección ni consejería externa.', score: 0 },
    { icon: Users, title: 'Consejo formal con independientes', description: 'Consejo formal con independientes. Patrimoniales e independientes que supervisan la dirección.', score: 10 },
  ],

  // ── INSTITUCIONALIZACIÓN (10 preguntas) ──────────
  inst_01: [
    { icon: CircleHelp, title: 'No lo conocemos', description: 'No se conoce el valor de la empresa ni el patrimonio.', score: 0 },
    { icon: BarChart3, title: 'Dato sin documentar', description: 'Tenemos el dato pero no está documentado.', score: 5 },
    { icon: Gem, title: 'Documentado y reconocido', description: 'Conocemos y está documentado. Todos los propietarios y familiares lo reconocen.', score: 10 },
  ],
  inst_02: [
    { icon: Shuffle, title: 'Totalmente mezcladas', description: 'Las finanzas familiares y de la empresa están totalmente mezcladas.', score: 0 },
    { icon: Scale, title: 'Algunas cosas se mezclan', description: 'Hay cierta separación pero algunas cosas se mezclan.', score: 5 },
    { icon: CircleCheck, title: 'Completamente separadas', description: 'Finanzas completamente separadas con política de dividendos.', score: 10 },
  ],
  inst_03: [
    { icon: Ban, title: 'No coinciden', description: 'No coinciden o no se ha hablado. Sin comunicación abierta sobre esto.', score: 0 },
    { icon: TriangleAlert, title: 'Coinciden parcialmente', description: 'Coinciden en algunos puntos. Hay discordancias entre generaciones.', score: 5 },
    { icon: Target, title: 'Visión alineada', description: 'Se trabaja en alinear la visión entre propietarios y siguientes generaciones.', score: 10 },
  ],
  inst_04: [
    { icon: UsersRound, title: 'Sin criterios formales', description: 'Sí, hay familiares indirectos sin criterios formales de contratación.', score: 0 },
    { icon: ClipboardList, title: 'Siguen protocolos de RH', description: 'Sí, pero siguen protocolos de RH para su contratación.', score: 5 },
    { icon: UserX, title: 'Política de no contratar', description: 'Política de no contratar familiares indirectos.', score: 10 },
  ],
  inst_05: [
    { icon: CircleHelp, title: 'Sin definir', description: 'No se sabe quién sucedería. Sin proceso ni candidato.', score: 0 },
    { icon: MessageCircle, title: 'Sucesor identificado', description: 'Sucesor identificado sin proceso formal. Tiene las capacidades pero sin documento.', score: 5 },
    { icon: FileText, title: 'Formalizado', description: 'Puesto y sucesor formalizados. Responsabilidades, sueldo, supervisión y sucesor nombrado.', score: 10 },
  ],
  inst_06: [
    { icon: CircleX, title: 'Sin definir', description: 'No se sabe quiénes serán futuros accionistas.', score: 0 },
    { icon: Handshake, title: 'Accionistas identificados', description: 'Futuros accionistas identificados pero sin formalización.', score: 5 },
    { icon: CircleCheck, title: 'Método claro', description: 'Método de asignación y evaluación claros y documentados.', score: 10 },
  ],
  inst_07: [
    { icon: Inbox, title: 'No existe', description: 'No existe tal documento de protocolo familiar.', score: 0 },
    { icon: ClipboardList, title: 'Reglas empíricas', description: 'Reglas empíricas no documentadas. O documento que no se sigue ni respeta.', score: 5 },
    { icon: BookOpen, title: 'Protocolo vivo', description: 'Protocolo conocido y vivo. Se revisa en el consejo de familia.', score: 10 },
  ],
  inst_08: [
    { icon: Shuffle, title: 'Sin separación', description: 'No existe separación ni claridad de los 3 círculos.', score: 0 },
    { icon: RefreshCw, title: 'Roles empíricos', description: 'Roles empíricos sin formalidad.', score: 5 },
    { icon: CircleCheck, title: 'Roles bien definidos', description: 'Roles bien definidos y respetados para empleado, propietario y familia.', score: 10 },
  ],
  inst_09: [
    { icon: Zap, title: 'Conflictos no resueltos', description: 'Existen conflictos no resueltos. Sin plan para evitar que impacten la empresa.', score: 0 },
    { icon: Sun, title: 'Sin conflictos o con protocolos', description: 'No hay conflictos o existen protocolos. Acuerdos de mediación que mitigan riesgos.', score: 10 },
  ],
  inst_10: [
    { icon: CircleX, title: 'Sin blindaje legal', description: 'No existen documentos suficientes. Sin blindaje legal.', score: 0 },
    { icon: CircleCheck, title: 'Documentos completos', description: 'Asesorados con todos los documentos. Contratos, convenios y protocolos para asegurar continuidad.', score: 10 },
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
    text: 'La empresa revisa periódicamente los ingresos, egresos y ganancias reales de la(s) empresa(s) familiar(es).',
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
    text: 'Las finanzas familiares están separadas de las finanzas de la empresa y se sigue una política de dividendos.',
    shortLabel: 'Separación finanzas',
    requiresFamilyBusiness: true,
    serviceAreaMappings: ['estructura_organizacional', 'planeacion_estrategica'],
    weight: 1,
  },
  {
    id: 'inst_03',
    category: 'institucionalizacion',
    text: 'Los familiares-propietarios coinciden en la visión y destino de la empresa a mediano/largo plazo.',
    shortLabel: 'Visión compartida',
    requiresFamilyBusiness: true,
    serviceAreaMappings: ['planeacion_estrategica', 'juntas_directivas'],
    weight: 1,
  },
  {
    id: 'inst_04',
    category: 'institucionalizacion',
    text: 'Hay familiares indirectos (cónyuges, tíos, primos, etc.) trabajando dentro de la empresa.',
    shortLabel: 'Familiares indirectos',
    requiresFamilyBusiness: true,
    serviceAreaMappings: ['estructura_organizacional'],
    weight: 1,
    notApplicableLabel: 'No hay familiares indirectos en la empresa',
  },
  {
    id: 'inst_05',
    category: 'institucionalizacion',
    text: 'Se tiene definido, claro y documentado el proceso de sucesión directiva (perfil, compensación, evaluación).',
    shortLabel: 'Sucesión directiva',
    requiresFamilyBusiness: false,
    serviceAreaMappings: ['juntas_directivas', 'planeacion_estrategica'],
    weight: 1,
  },
  {
    id: 'inst_06',
    category: 'institucionalizacion',
    text: 'Se tiene definido, claro y documentado su proceso de sucesión accionaria (responsabilidades, tipo de consejero, acuerdos).',
    shortLabel: 'Sucesión accionaria',
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
    text: 'Los roles y responsabilidades de los 3 círculos (empleado, propietario y familia) están claramente definidos.',
    shortLabel: 'Roles 3 círculos',
    requiresFamilyBusiness: true,
    serviceAreaMappings: ['estructura_organizacional'],
    weight: 1,
  },
  {
    id: 'inst_09',
    category: 'institucionalizacion',
    text: 'La empresa está libre de conflictos familiares graves que pongan en riesgo la continuidad, confianza y armonía.',
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
