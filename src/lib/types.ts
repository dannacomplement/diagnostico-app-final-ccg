import type { LucideIcon } from 'lucide-react';

export type ServiceAreaId =
  | 'estructura_organizacional'
  | 'planeacion_estrategica'
  | 'business_analytics'
  | 'procesos'
  | 'investigacion_mercado'
  | 'juntas_directivas';

export type EmpresaFamiliar = 'si_1era' | 'si_1era_transicion' | 'si_2da' | 'si_3era' | 'no';
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
  notApplicableLabel?: string;
}

export interface ServiceAreaConfig {
  id: ServiceAreaId;
  name: string;
  description: string;
  icon: LucideIcon;
}

export interface DatosGenerales {
  nombreComercial: string;
  ubicacion: string;
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
  nombre: string;
  esFamiliar: boolean | null;
  porcentaje: string;
}

export interface LineaNegocio {
  nombre: string;
  porcentaje: string;
}

export interface Sucursal {
  nombre: string;
  porcentajeVentas: string;
}

export interface SituacionActual {
  ventasAnualesMDP: number | null;
  empleadosTotales: number | null;
  empleadosFamiliares: number | null;
  socios: string;
  sociosDetalle: SocioDetail[];
  familiaresEnPoder: string;
  pctIngresoFiscalizado: number | null;
  pctEgresoFiscalizado: number | null;
}

export interface CriterionAnswer {
  criterionId: string;
  siNo: boolean;
  rating: number;
  comentario: string;
}

export type CalificadoStatus = 'si' | 'no' | 'por_evaluar';

export interface DGEvaluation {
  nivelEstudios: number | null;
  experienciaLaboral: number | null;
  seguimientoResultados: number | null;
}

export interface Gerencia {
  area: string;
  nombre: string;
  cubierto: boolean | null;
  antiguedad: string;
  calificado: CalificadoStatus;
  rangoSueldo?: string;
  esFamiliar?: boolean;
  soyYo?: boolean;
  dgEvaluation?: DGEvaluation;
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

export type MarginLevel = 'en_rango' | 'fuera_de_rango';

export interface MarginData {
  tieneDatosFinancieros: boolean;
  conoceMargenBruto: boolean;
  conoceMargenOperativo: boolean;
  conoceMargenNeto: boolean;
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
}

export type IndustryBenchmarks = Record<Sector, IndustryBenchmark>;

export type DiagnosticClassification = 'prospecto' | 'en_proceso' | 'cerrado' | 'seguimiento';

export type UserRole = 'master' | 'client';
export type SurveyType = 'diagnostico_empresarial' | 'estructura_organizacional' | 'prueba_tecnologia';
export type ClientStatus = 'activo' | 'inactivo' | 'prospecto';

export type CurrencyCode = 'MXN' | 'USD';

export interface AppUser {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
  email?: string;
  surveyPermissions?: SurveyType[];
  logoUrl?: string;
  status?: ClientStatus;
  createdAt?: string;
  currencyCode?: CurrencyCode;
  /** Etiqueta libre para agrupar varios clientes bajo un mismo corporativo (ej. "CEMEX") en la lista del master. */
  corporateGroup?: string;
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
  lineasNegocio?: LineaNegocio[];
  tieneMultiplesSucursales?: boolean;
  sucursales?: Sucursal[];
  retos: string[];
  urgenciaSelection: UrgencySelection;
  urgenciaLevel: UrgencyLevel;
  tieneLiderInterno?: boolean | null;
  nombreLiderInterno?: string;
  analisisFamiliar: FamilyAnalysis | null;
  marginData?: MarginData;
  marginEvaluation?: MarginEvaluation;
  priority?: boolean;
  classification?: DiagnosticClassification;
  wasPrefilled?: boolean;
  reportEmailStatus?: 'enviado' | 'error';
}

/* ── Prueba de Tecnología Survey ─────────────────────── */
/* Multi-respondent: cada persona contesta las afirmaciones de SU área
   (Comercial, Operaciones, RH o Admin) más las de Sistemas y Seguridad,
   que son generales para todas las áreas. */

export type TechMaturityArea = 'comercial' | 'operaciones' | 'rrhh' | 'admin';

export type TechMaturityScore = 1 | 2 | 3 | 4 | 5;

export interface TechMaturityAnswer {
  id: string;           // e.g. 'COM-01'
  score: TechMaturityScore;
}

export interface SavedTechSurvey {
  id: string;
  savedAt: string;
  companyName: string;
  respondentArea: TechMaturityArea;
  rolCargo: string;
  sistemasPrincipales: string;
  areaAnswers: TechMaturityAnswer[];
  generalAnswers: TechMaturityAnswer[];
  areaScore: number;      // 0-100, promedio de las afirmaciones del área
  generalScore: number;   // 0-100, promedio de las afirmaciones de Sistemas y Seguridad
}
