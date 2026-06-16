export type ServiceAreaId =
  | 'estructura_organizacional'
  | 'planeacion_estrategica'
  | 'business_analytics'
  | 'procesos'
  | 'investigacion_mercado'
  | 'juntas_directivas';

export type EmpresaFamiliar = 'si_1era' | 'si_2da' | 'si_3era' | 'no';
export type Sector = 'manufactura' | 'comercio' | 'servicios';
/** @deprecated Use SoftwareOption[] via softwareSelections instead */
export type SoftwareGestion = 'erp_crm' | 'excel' | 'nada';

export type SoftwareOption = 'erp' | 'mrp' | 'crm' | 'excel' | 'nada';
export type ExcelNivel = 'basico' | 'intermedio' | 'avanzado';

export interface SoftwareSelections {
  selected: SoftwareOption[];
  erpDetalle: string;
  mrpDetalle: string;
  crmDetalle: string;
  excelNivel: ExcelNivel | '';
}
export type UrgencySelection = 'muy_urgente' | 'necesario' | 'deseable';
export type UrgencyLevel = 'Crítica' | 'Alta' | 'Media' | 'Baja';
export type CompanySize = 'Micro' | 'Pequeña' | 'Mediana' | 'Grande';
export type ScoreLevel = 'Bajo' | 'Medio' | 'Alto' | 'Avanzado';

export interface CriterionConfig {
  id: string;
  category: 'profesionalizacion' | 'institucionalizacion';
  text: string;
  shortLabel: string;
  requiresFamilyBusiness: boolean;
  serviceAreaMappings: ServiceAreaId[];
  weight: number;
}

export interface ServiceAreaConfig {
  id: ServiceAreaId;
  name: string;
  description: string;
  icon: string;
}

export interface DatosGenerales {
  nombreComercial: string;
  antiguedadConstituida: string;
  antiguedadOperativa: string;
  empresaFamiliar: EmpresaFamiliar;
  respondente: string;
  email: string;
  puestoEmpresa: string;
  puestoFamilia: string;
  /** @deprecated Kept for backward-compat with old saved data */
  puestoEmpresaFamilia?: string;
  esSocio: 'si' | 'no' | '';
  porcentajeAcciones: string;
  sector: Sector;
  softwareSelections: SoftwareSelections;
  /** @deprecated Kept for backward-compat with old saved data */
  software?: SoftwareGestion;
  /** @deprecated Kept for backward-compat with old saved data */
  softwareDetalle?: string;
}

export interface SocioDetail {
  esFamiliar: boolean | null;
  porcentaje: string;
}

export interface SituacionActual {
  ventasAnualesMDP: number | null;
  empleadosTotales: number | null;
  empleadosFamiliares: number | null;
  socios: string;
  sociosDetalle: SocioDetail[];
  familiaresEnPoder: string;
  sueldoMasAlto: string;
}

export interface CriterionAnswer {
  criterionId: string;
  siNo: boolean;
  rating: number;
  comentario: string;
}

export type CalificadoStatus = 'si' | 'no' | 'por_evaluar';

export interface Gerencia {
  area: string;
  cubierto: boolean;
  antiguedad: string;
  calificado: CalificadoStatus;
  rangoSueldo?: string;
  esFamiliar?: boolean;
}

export interface FamilyAnalysis {
  gobiernoFamiliar: string;
  planSucesion: string;
  protocoloFamiliar: string;
  conflictosFamiliares: string;
  rolesOperacion: string;
  profesionalizacionFamiliares: string;
}

export interface CompanySizeResult {
  size: CompanySize;
  tmcScore: number;
  productivityIndex: number;
}

export interface ScoreResult {
  average: number;
  level: ScoreLevel;
  answers: CriterionAnswer[];
}

export interface OpportunityArea {
  serviceArea: ServiceAreaConfig;
  needScore: number;
  priority: 'alta' | 'media' | 'baja';
  triggeringCriteria: { id: string; text: string; rating: number }[];
}

export type MarginLevel = 'arriba_industria' | 'en_rango' | 'debajo_industria' | 'critico';

export interface MarginData {
  tieneDatosFinancieros: boolean;
  margenBruto: number | null;
  margenOperativo: number | null;
  margenNeto: number | null;
}

export interface MarginEvaluation {
  margenBruto: { value: number | null; level: MarginLevel };
  margenOperativo: { value: number | null; level: MarginLevel };
  margenNeto: { value: number | null; level: MarginLevel };
}

export interface IndustryBenchmark {
  margenBruto: number;
  margenOperativo: number;
  margenNeto: number;
  tolerancia: number;        // % above/below benchmark to be "en rango"
  criticoUmbral: number;     // % below benchmark to be "critico"
}

export type IndustryBenchmarks = Record<Sector, IndustryBenchmark>;

export type DiagnosticClassification = 'prospecto' | 'en_proceso' | 'cerrado' | 'seguimiento';

export type UserRole = 'master' | 'client';
export type SurveyType = 'diagnostico_empresarial' | 'estructura_organizacional' | 'prueba_tecnologia';

export interface AppUser {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
  email?: string;
  surveyPermissions?: SurveyType[];
  logoUrl?: string;
}

/* ── Estructura Organizacional Survey ──────────────────── */

export interface OrgStructureData {
  tieneOrganigrama: boolean;
  organigramaActualizado: boolean | null;
  descripcionesPuesto: 'todas' | 'algunas' | 'ninguna';
  tieneTabulador: boolean;
  nominaMensualTotal: number | null;
}

export interface AreaDetail {
  nombre: string;
  colaboradores: number | null;
  sueldoPromedio: number | null;
  tieneLider: boolean;
  isCustom?: boolean;
}

export type SalaryCompetitiveness = 'arriba' | 'en_rango' | 'debajo' | 'no_se';
export type PerformanceEvaluation = 'si' | 'parcialmente' | 'no';

export interface TalentProcesses {
  procesoReclutamiento: boolean;
  evaluacionesDesempeno: PerformanceEvaluation;
  programaCapacitacion: boolean;
  rotacionAnual: number | null;
  competitividadSueldos: SalaryCompetitiveness;
  retoCapitalHumano: string;
}

export interface SavedOrgSurvey {
  id: string;
  savedAt: string;
  companyName: string;
  orgStructure: OrgStructureData;
  areaDetails: AreaDetail[];
  talentProcesses: TalentProcesses;
}

export interface SavedDiagnostic {
  id: string;
  savedAt: string;
  datosGenerales: DatosGenerales;
  situacionActual: SituacionActual;
  companySize: CompanySizeResult;
  profesionalizacion: ScoreResult;
  institucionalizacion: ScoreResult;
  opportunityAreas: OpportunityArea[];
  gerencias: Gerencia[];
  descripcionNegocio?: string;
  retos: string[];
  urgenciaSelection: UrgencySelection;
  urgenciaLevel: UrgencyLevel;
  analisisFamiliar: FamilyAnalysis | null;
  marginData?: MarginData;
  marginEvaluation?: MarginEvaluation;
  priority?: boolean;
  classification?: DiagnosticClassification;
  wasPrefilled?: boolean;
}

/* ── Prueba de Tecnología Survey ─────────────────────── */

export type TechMaturityLevel = 'basico' | 'intermedio' | 'avanzado' | 'lider_digital';

export interface TechToolsData {
  usaExcel: boolean;
  excelNivel: 'basico' | 'intermedio' | 'avanzado' | '';
  tieneERP: boolean;
  erpNombre: string;
  tieneCRM: boolean;
  crmNombre: string;
  tieneMRP: boolean;
  mrpNombre: string;
  otrasHerramientas: string;
}

export interface TechDigitalPresence {
  tieneWebsite: boolean;
  websiteActualizado: boolean;
  tieneEcommerce: boolean;
  usaRedesSociales: boolean;
  redesActivas: string[];       // e.g. ['facebook','instagram','linkedin','tiktok']
  marketingDigital: boolean;
}

export interface TechAutomation {
  procesosAutomatizados: 'ninguno' | 'algunos' | 'mayoria' | 'todos';
  areasMasAutomatizadas: string;
  facturaElectronica: boolean;
  bancaDigital: boolean;
  firmaElectronica: boolean;
  gestionDocumentalDigital: boolean;
}

export interface TechDataAnalytics {
  usaDatosParaDecisiones: 'nunca' | 'a_veces' | 'frecuentemente' | 'siempre';
  tieneKPIs: boolean;
  dashboardsBI: boolean;
  herramientaBI: string;       // e.g. 'Power BI', 'Tableau', 'Ninguna'
  analiticaAvanzada: boolean;
}

export interface TechAIAdoption {
  conoceIA: boolean;
  usaIAEnEmpresa: boolean;
  casosUsoIA: string[];        // e.g. ['chatbots','generacion_contenido','analisis_datos','automatizacion']
  interesEnIA: 'alto' | 'medio' | 'bajo' | 'ninguno';
  inversionTechAnual: 'menos_50k' | '50k_200k' | '200k_500k' | 'mas_500k' | 'no_sabe';
}

export interface TechSecurity {
  tieneAntivirus: boolean;
  respaldosDatos: 'nunca' | 'manual' | 'automatico';
  politicasSeguridad: boolean;
  capacitacionSeguridad: boolean;
  usaNube: boolean;
  proveedorNube: string;       // e.g. 'AWS','Azure','Google Cloud','Otro','Ninguno'
}

export interface TechCulture {
  resistenciaAlCambio: 'alta' | 'media' | 'baja' | 'ninguna';
  capacitacionTecnologica: boolean;
  equipoTI: boolean;
  equipoTISize: number | null;
  presupuestoTech: boolean;
  retoPrincipalTech: string;
}

export interface SavedTechSurvey {
  id: string;
  savedAt: string;
  companyName: string;
  tools: TechToolsData;
  digitalPresence: TechDigitalPresence;
  automation: TechAutomation;
  dataAnalytics: TechDataAnalytics;
  aiAdoption: TechAIAdoption;
  security: TechSecurity;
  culture: TechCulture;
  maturityScore: number;       // 0-100 computed
  maturityLevel: TechMaturityLevel;
}
