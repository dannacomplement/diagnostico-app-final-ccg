import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  DatosGenerales,
  SituacionActual,
  CriterionAnswer,
  Gerencia,
  CalificadoStatus,
  FamilyAnalysis,
  UrgencySelection,
  SavedDiagnostic,
  CompanySizeResult,
  ScoreResult,
  OpportunityArea,
  UrgencyLevel,
  MarginData,
  MarginEvaluation,
  SoftwareSelections,
  LineaNegocio,
} from '../lib/types';
import { calculateCompanySize, calculateScore, mapOpportunityAreas, calculateUrgency, evaluateMargins } from '../lib/calculations';
import { useBenchmarkStore } from './benchmarkStore';
import { PROFESIONALIZACION_CRITERIA, INSTITUCIONALIZACION_CRITERIA } from '../config/questions';
import { GERENCIA_AREAS } from '../config/constants';
import { saveDiagnostic as saveToStorage, updateDiagnostic as updateInStorage, savePrefill as savePrefillToStorage } from '../lib/storage';
import type { PrefillData } from '../lib/storage';
import { getCurrentUser } from '../lib/auth';

function defaultSoftwareSelections(): SoftwareSelections {
  return {
    selected: [],
    erpDetalle: '',
    mrpDetalle: '',
    crmDetalle: '',
    excelNivel: '',
  };
}

function migrateSoftwareField(
  oldSoftware?: string,
  oldDetalle?: string,
): SoftwareSelections {
  const result = defaultSoftwareSelections();
  if (!oldSoftware || oldSoftware === 'nada') {
    result.selected = ['nada'];
  } else if (oldSoftware === 'erp_crm') {
    result.selected = ['erp', 'crm'];
    if (oldDetalle) result.erpDetalle = oldDetalle;
  } else if (oldSoftware === 'excel') {
    result.selected = ['excel'];
  }
  return result;
}

function defaultDatosGenerales(): DatosGenerales {
  return {
    nombreComercial: '',
    ubicacion: '',
    antiguedadConstituida: '',
    antiguedadOperativa: '',
    empresaFamiliar: 'no',
    respondente: '',
    email: '',
    puestoEmpresa: '',
    puestoFamilia: '',
    esSocio: '',
    porcentajeAcciones: '',
    sector: 'servicios',
    softwareSelections: defaultSoftwareSelections(),
  };
}

function defaultSituacionActual(): SituacionActual {
  return {
    ventasAnualesMDP: null,
    empleadosTotales: null,
    empleadosFamiliares: null,
    socios: '',
    sociosDetalle: [],
    familiaresEnPoder: '',
    sueldoMasAlto: '',
    pctIngresoFiscalizado: null,
    pctEgresoFiscalizado: null,
  };
}

function defaultCriterionAnswers(criteria: { id: string }[]): CriterionAnswer[] {
  return criteria.map(c => ({ criterionId: c.id, siNo: true, rating: -1, comentario: '' }));
}

function defaultGerencias(): Gerencia[] {
  return GERENCIA_AREAS.map(area => ({
    area,
    nombre: '',
    cubierto: null,
    antiguedad: '',
    calificado: 'por_evaluar' as CalificadoStatus,
  }));
}

function defaultMarginData(): MarginData {
  return {
    tieneDatosFinancieros: false,
    conoceMargenBruto: false,
    conoceMargenOperativo: false,
    conoceMargenNeto: false,
    margenBruto: null,
    margenOperativo: null,
    margenNeto: null,
  };
}

function defaultFamilyAnalysis(): FamilyAnalysis {
  return {
    gobiernoFamiliar: '',
    planSucesion: '',
    protocoloFamiliar: '',
    conflictosFamiliares: '',
    rolesOperacion: '',
    profesionalizacionFamiliares: '',
  };
}

export type AppView = 'login' | 'home' | 'wizard' | 'result' | 'history' | 'report' | 'dashboard' | 'org_wizard' | 'org_result' | 'org_report' | 'tech_wizard' | 'tech_result' | 'tech_report' | 'settings';

interface DiagnosticState {
  view: AppView;
  testMode: boolean;
  currentStep: number;
  datosGenerales: DatosGenerales;
  situacionActual: SituacionActual;
  descripcionNegocio: string;
  lineasNegocio: LineaNegocio[];
  profAnswers: CriterionAnswer[];
  instAnswers: CriterionAnswer[];
  gerencias: Gerencia[];
  retos: string[];
  urgencia: UrgencySelection | null;
  tieneLiderInterno: boolean | null;
  analisisFamiliar: FamilyAnalysis;
  marginData: MarginData;
  savedResultId: string | null;
  emailStatus: 'idle' | 'sending' | 'sent' | 'error';

  /* ── Draft mode (save & exit to continue later) ── */
  draftActive: boolean;

  /* ── Prefill mode (master pre-populates for a client) ── */
  prefillMode: boolean;
  prefillTargetUserId: string | null;

  /* ── Edit mode (modify an already-saved diagnostic) ── */
  editMode: boolean;
  editDiagnosticId: string | null;

  /* ── Tracks whether the current diagnostic was loaded from prefill data ── */
  originatedFromPrefill: boolean;

  setView: (view: AppView) => void;
  setTestMode: (v: boolean) => void;
  setDraftActive: (v: boolean) => void;
  setStep: (step: number) => void;
  updateDatosGenerales: (partial: Partial<DatosGenerales>) => void;
  updateSituacionActual: (partial: Partial<SituacionActual>) => void;
  setDescripcionNegocio: (text: string) => void;
  setLineasNegocio: (lineas: LineaNegocio[]) => void;
  setCriterionAnswer: (category: 'prof' | 'inst', id: string, answer: Partial<CriterionAnswer>) => void;
  setGerencia: (index: number, data: Partial<Gerencia>) => void;
  setReto: (index: number, text: string) => void;
  setUrgencia: (level: UrgencySelection) => void;
  updateAnalisisFamiliar: (partial: Partial<FamilyAnalysis>) => void;
  updateMarginData: (partial: Partial<MarginData>) => void;
  isFamilyBusiness: () => boolean;
  getCompanySize: () => CompanySizeResult | null;
  getProfScore: () => ScoreResult;
  getInstScore: () => ScoreResult;
  getOpportunityAreas: () => OpportunityArea[];
  getUrgencyLevel: () => UrgencyLevel | null;
  getMarginEvaluation: () => MarginEvaluation | null;
  setEmailStatus: (status: 'idle' | 'sending' | 'sent' | 'error') => void;
  saveDiagnostic: () => SavedDiagnostic;
  resetDiagnostic: () => void;
  loadDiagnosticForReport: (d: SavedDiagnostic) => void;
  loadDiagnosticForEdit: (d: SavedDiagnostic) => void;
  startPrefillMode: (userId: string) => void;
  editPrefillMode: (userId: string, data: PrefillData) => void;
  loadPrefill: (data: PrefillData) => void;
  savePrefillData: () => Promise<boolean>;
  setTieneLiderInterno: (v: boolean | null) => void;
}

export const useDiagnosticStore = create<DiagnosticState>()(
  persist(
    (set, get) => ({
      view: 'home',
      testMode: false,
      currentStep: 0,
      datosGenerales: defaultDatosGenerales(),
      situacionActual: defaultSituacionActual(),
      descripcionNegocio: '',
      lineasNegocio: [],
      profAnswers: defaultCriterionAnswers(PROFESIONALIZACION_CRITERIA),
      instAnswers: defaultCriterionAnswers(INSTITUCIONALIZACION_CRITERIA),
      gerencias: defaultGerencias(),
      retos: ['', '', ''],
      urgencia: null,
      tieneLiderInterno: null,
      analisisFamiliar: defaultFamilyAnalysis(),
      marginData: defaultMarginData(),
      savedResultId: null,
      emailStatus: 'idle',
      draftActive: false,
      prefillMode: false,
      prefillTargetUserId: null,
      editMode: false,
      editDiagnosticId: null,
      originatedFromPrefill: false,

      setView: (view) => set({ view }),
      setTestMode: (v) => set({ testMode: v }),
      setDraftActive: (v) => set({ draftActive: v }),
      setStep: (step) => set({ currentStep: step }),
      setEmailStatus: (status) => set({ emailStatus: status }),

      updateDatosGenerales: (partial) =>
        set((state) => ({ datosGenerales: { ...state.datosGenerales, ...partial } })),

      updateSituacionActual: (partial) =>
        set((state) => ({ situacionActual: { ...state.situacionActual, ...partial } })),

      setDescripcionNegocio: (text) => set({ descripcionNegocio: text }),
      setLineasNegocio: (lineas) => set({ lineasNegocio: lineas }),

      setCriterionAnswer: (category, id, answer) =>
        set((state) => {
          const key = category === 'prof' ? 'profAnswers' : 'instAnswers';
          const answers = state[key].map(a =>
            a.criterionId === id ? { ...a, ...answer } : a
          );
          return { [key]: answers };
        }),

      setGerencia: (index, data) =>
        set((state) => {
          const gerencias = [...state.gerencias];
          gerencias[index] = { ...gerencias[index], ...data };
          return { gerencias };
        }),

      setReto: (index, text) =>
        set((state) => {
          const retos = [...state.retos];
          retos[index] = text;
          return { retos };
        }),

      setUrgencia: (level) => set({ urgencia: level }),
      setTieneLiderInterno: (v) => set({ tieneLiderInterno: v }),

      updateAnalisisFamiliar: (partial) =>
        set((state) => ({ analisisFamiliar: { ...state.analisisFamiliar, ...partial } })),

      updateMarginData: (partial) =>
        set((state) => ({ marginData: { ...state.marginData, ...partial } })),

      isFamilyBusiness: () => {
        const ef = get().datosGenerales.empresaFamiliar;
        return ef === 'si_1era' || ef === 'si_1era_transicion' || ef === 'si_2da' || ef === 'si_3era';
      },

      getCompanySize: () => {
        const { sector } = get().datosGenerales;
        const { empleadosTotales, ventasAnualesMDP } = get().situacionActual;
        return calculateCompanySize(sector, empleadosTotales, ventasAnualesMDP);
      },

      getProfScore: () => {
        return calculateScore(get().profAnswers, PROFESIONALIZACION_CRITERIA);
      },

      getInstScore: () => {
        const isFamily = get().isFamilyBusiness();
        const applicableCriteria = INSTITUCIONALIZACION_CRITERIA.filter(
          c => !c.requiresFamilyBusiness || isFamily
        );
        const applicableAnswers = get().instAnswers.filter(a =>
          applicableCriteria.some(c => c.id === a.criterionId)
        );
        return calculateScore(applicableAnswers, applicableCriteria);
      },

      getOpportunityAreas: () => {
        const isFamily = get().isFamilyBusiness();
        const applicableInstCriteria = INSTITUCIONALIZACION_CRITERIA.filter(
          c => !c.requiresFamilyBusiness || isFamily
        );
        const applicableInstAnswers = get().instAnswers.filter(a =>
          applicableInstCriteria.some(c => c.id === a.criterionId)
        );
        return mapOpportunityAreas(
          get().profAnswers,
          applicableInstAnswers,
          [...PROFESIONALIZACION_CRITERIA, ...applicableInstCriteria]
        );
      },

      getUrgencyLevel: () => {
        const { urgencia } = get();
        return urgencia ? calculateUrgency(urgencia) : null;
      },

      getMarginEvaluation: () => {
        const { marginData, datosGenerales } = get();
        const hasAny = marginData.conoceMargenBruto || marginData.conoceMargenOperativo || marginData.conoceMargenNeto || marginData.tieneDatosFinancieros;
        if (!hasAny) return null;
        const benchmarks = useBenchmarkStore.getState().benchmarks;
        const benchmark = benchmarks[datosGenerales.sector];
        return evaluateMargins(marginData, benchmark);
      },

      saveDiagnostic: () => {
        const state = get();
        const id = state.editMode && state.editDiagnosticId ? state.editDiagnosticId : uuidv4();
        const companySize = state.getCompanySize() ?? { size: 'Micro' as const, tmcScore: 0, productivityIndex: 0 };
        const profScore = state.getProfScore();
        const instScore = state.getInstScore();
        const opportunityAreas = state.getOpportunityAreas();
        const urgencyLevel = state.getUrgencyLevel() ?? 'Baja';

        const marginEval = state.getMarginEvaluation();

        const diagnostic: SavedDiagnostic = {
          id,
          savedAt: state.editMode ? state.editDiagnosticId ? new Date().toISOString() : new Date().toISOString() : new Date().toISOString(),
          datosGenerales: { ...state.datosGenerales },
          situacionActual: { ...state.situacionActual },
          companySize,
          profesionalizacion: profScore,
          institucionalizacion: instScore,
          opportunityAreas,
          gerencias: [...state.gerencias],
          descripcionNegocio: state.descripcionNegocio,
          lineasNegocio: state.lineasNegocio.length > 0 ? [...state.lineasNegocio] : undefined,
          retos: [...state.retos],
          urgenciaSelection: state.urgencia ?? 'deseable',
          urgenciaLevel: urgencyLevel,
          tieneLiderInterno: state.tieneLiderInterno,
          analisisFamiliar: state.isFamilyBusiness() ? { ...state.analisisFamiliar } : null,
          marginData: (state.marginData.conoceMargenBruto || state.marginData.conoceMargenOperativo || state.marginData.conoceMargenNeto) ? { ...state.marginData, tieneDatosFinancieros: true } : undefined,
          marginEvaluation: marginEval ?? undefined,
          wasPrefilled: state.originatedFromPrefill,
        };

        // In testMode (master preview), skip persisting to Supabase
        if (!state.testMode) {
          if (state.editMode && state.editDiagnosticId) {
            // Update existing record
            updateInStorage(state.editDiagnosticId, diagnostic).catch(err =>
              console.error('Failed to update diagnostic in Supabase:', err),
            );
          } else {
            const currentUser = getCurrentUser();
            saveToStorage(diagnostic, currentUser?.id).catch(err => console.error('Failed to save to Supabase:', err));
          }
        }
        set({ savedResultId: id, editMode: false, editDiagnosticId: null, draftActive: false });
        return diagnostic;
      },

      resetDiagnostic: () =>
        set({
          view: 'home',
          currentStep: 0,
          datosGenerales: defaultDatosGenerales(),
          situacionActual: defaultSituacionActual(),
          descripcionNegocio: '',
          lineasNegocio: [],
          profAnswers: defaultCriterionAnswers(PROFESIONALIZACION_CRITERIA),
          instAnswers: defaultCriterionAnswers(INSTITUCIONALIZACION_CRITERIA),
          gerencias: defaultGerencias(),
          retos: ['', '', ''],
          urgencia: null,
          tieneLiderInterno: null,
          analisisFamiliar: defaultFamilyAnalysis(),
          marginData: defaultMarginData(),
          savedResultId: null,
          emailStatus: 'idle',
          draftActive: false,
          prefillMode: false,
          prefillTargetUserId: null,
          editMode: false,
          editDiagnosticId: null,
          originatedFromPrefill: false,
        }),

      loadDiagnosticForReport: (d) => {
        // Normalize old data that lacks softwareSelections
        const dg = { ...d.datosGenerales };
        if (!dg.softwareSelections) {
          dg.softwareSelections = migrateSoftwareField(dg.software, dg.softwareDetalle);
        }
        // Normalize old data that lacks split puesto fields
        if (!dg.puestoEmpresa && dg.puestoEmpresaFamilia) {
          const parts = dg.puestoEmpresaFamilia.split('/').map((s: string) => s.trim());
          dg.puestoEmpresa = parts[0] || '';
          dg.puestoFamilia = parts[1] || '';
        }
        dg.puestoEmpresa = dg.puestoEmpresa ?? '';
        dg.puestoFamilia = dg.puestoFamilia ?? '';
        dg.email = dg.email ?? '';
        set({
          datosGenerales: dg,
          situacionActual: { ...defaultSituacionActual(), ...d.situacionActual },
          descripcionNegocio: d.descripcionNegocio ?? '',
          lineasNegocio: d.lineasNegocio ?? [],
          profAnswers: d.profesionalizacion.answers.map(a => ({ ...a })),
          instAnswers: d.institucionalizacion.answers.map(a => ({ ...a })),
          gerencias: d.gerencias.map(g => ({ ...g, nombre: g.nombre ?? '' })),
          retos: [...d.retos],
          urgencia: d.urgenciaSelection,
          tieneLiderInterno: (d as any).tieneLiderInterno ?? null,
          analisisFamiliar: d.analisisFamiliar ? { ...d.analisisFamiliar } : defaultFamilyAnalysis(),
          marginData: d.marginData ? { ...d.marginData, conoceMargenBruto: d.marginData.conoceMargenBruto ?? false, conoceMargenOperativo: d.marginData.conoceMargenOperativo ?? false, conoceMargenNeto: d.marginData.conoceMargenNeto ?? false } : defaultMarginData(),
          view: 'report',
        });
      },

      loadDiagnosticForEdit: (d) => {
        const dg = { ...d.datosGenerales };
        if (!dg.softwareSelections) {
          dg.softwareSelections = migrateSoftwareField(dg.software, dg.softwareDetalle);
        }
        if (!dg.puestoEmpresa && dg.puestoEmpresaFamilia) {
          const parts = dg.puestoEmpresaFamilia.split('/').map((s: string) => s.trim());
          dg.puestoEmpresa = parts[0] || '';
          dg.puestoFamilia = parts[1] || '';
        }
        dg.puestoEmpresa = dg.puestoEmpresa ?? '';
        dg.puestoFamilia = dg.puestoFamilia ?? '';
        dg.email = dg.email ?? '';
        set({
          datosGenerales: dg,
          situacionActual: { ...defaultSituacionActual(), ...d.situacionActual },
          descripcionNegocio: d.descripcionNegocio ?? '',
          lineasNegocio: d.lineasNegocio ?? [],
          profAnswers: d.profesionalizacion.answers.map(a => ({ ...a })),
          instAnswers: d.institucionalizacion.answers.map(a => ({ ...a })),
          gerencias: d.gerencias.map(g => ({ ...g, nombre: g.nombre ?? '' })),
          retos: [...d.retos],
          urgencia: d.urgenciaSelection,
          tieneLiderInterno: (d as any).tieneLiderInterno ?? null,
          analisisFamiliar: d.analisisFamiliar ? { ...d.analisisFamiliar } : defaultFamilyAnalysis(),
          marginData: d.marginData ? { ...d.marginData, conoceMargenBruto: d.marginData.conoceMargenBruto ?? false, conoceMargenOperativo: d.marginData.conoceMargenOperativo ?? false, conoceMargenNeto: d.marginData.conoceMargenNeto ?? false } : defaultMarginData(),
          editMode: true,
          editDiagnosticId: d.id,
          testMode: false,
          draftActive: false,
          prefillMode: false,
          prefillTargetUserId: null,
          originatedFromPrefill: d.wasPrefilled ?? false,
          currentStep: 0,
          savedResultId: null,
          emailStatus: 'idle',
          view: 'wizard',
        });
      },

      /* ── Prefill mode ──────────────────────────────────── */

      startPrefillMode: (userId: string) =>
        set({
          view: 'wizard',
          currentStep: 0,
          datosGenerales: defaultDatosGenerales(),
          situacionActual: defaultSituacionActual(),
          descripcionNegocio: '',
          lineasNegocio: [],
          profAnswers: defaultCriterionAnswers(PROFESIONALIZACION_CRITERIA),
          instAnswers: defaultCriterionAnswers(INSTITUCIONALIZACION_CRITERIA),
          gerencias: defaultGerencias(),
          retos: ['', '', ''],
          urgencia: null,
          tieneLiderInterno: null,
          analisisFamiliar: defaultFamilyAnalysis(),
          marginData: defaultMarginData(),
          savedResultId: null,
          emailStatus: 'idle',
          testMode: false,
          draftActive: false,
          prefillMode: true,
          prefillTargetUserId: userId,
          originatedFromPrefill: false,
        }),

      editPrefillMode: (userId: string, data: PrefillData) => {
        const dg = { ...defaultDatosGenerales(), ...(data.datosGenerales ?? {}) };
        if (!dg.softwareSelections) dg.softwareSelections = defaultSoftwareSelections();
        dg.puestoEmpresa = dg.puestoEmpresa ?? '';
        dg.puestoFamilia = dg.puestoFamilia ?? '';
        dg.email = dg.email ?? '';

        set({
          view: 'wizard',
          currentStep: 0,
          datosGenerales: dg,
          situacionActual: { ...defaultSituacionActual(), ...(data.situacionActual ?? {}) },
          descripcionNegocio: data.descripcionNegocio ?? '',
          lineasNegocio: data.lineasNegocio ?? [],
          profAnswers: data.profAnswers ?? defaultCriterionAnswers(PROFESIONALIZACION_CRITERIA),
          instAnswers: data.instAnswers ?? defaultCriterionAnswers(INSTITUCIONALIZACION_CRITERIA),
          gerencias: data.gerencias ?? defaultGerencias(),
          retos: data.retos ?? ['', '', ''],
          urgencia: data.urgencia ?? null,
          tieneLiderInterno: data.tieneLiderInterno ?? null,
          analisisFamiliar: data.analisisFamiliar ?? defaultFamilyAnalysis(),
          marginData: data.marginData ?? defaultMarginData(),
          savedResultId: null,
          emailStatus: 'idle',
          draftActive: false,
          prefillMode: true,
          prefillTargetUserId: userId,
          originatedFromPrefill: false,
        });
      },

      loadPrefill: (data: PrefillData) => {
        // Deep-merge with defaults so every field exists
        const dg = { ...defaultDatosGenerales(), ...(data.datosGenerales ?? {}) };
        if (!dg.softwareSelections) dg.softwareSelections = defaultSoftwareSelections();
        dg.puestoEmpresa = dg.puestoEmpresa ?? '';
        dg.puestoFamilia = dg.puestoFamilia ?? '';
        dg.email = dg.email ?? '';

        set({
          view: 'wizard',
          currentStep: 0,
          datosGenerales: dg,
          situacionActual: { ...defaultSituacionActual(), ...(data.situacionActual ?? {}) },
          descripcionNegocio: data.descripcionNegocio ?? '',
          lineasNegocio: data.lineasNegocio ?? [],
          profAnswers: data.profAnswers ?? defaultCriterionAnswers(PROFESIONALIZACION_CRITERIA),
          instAnswers: data.instAnswers ?? defaultCriterionAnswers(INSTITUCIONALIZACION_CRITERIA),
          gerencias: data.gerencias ?? defaultGerencias(),
          retos: data.retos ?? ['', '', ''],
          urgencia: data.urgencia ?? null,
          tieneLiderInterno: data.tieneLiderInterno ?? null,
          analisisFamiliar: data.analisisFamiliar ?? defaultFamilyAnalysis(),
          marginData: data.marginData ?? defaultMarginData(),
          savedResultId: null,
          emailStatus: 'idle',
          draftActive: false,
          prefillMode: false,
          prefillTargetUserId: null,
          originatedFromPrefill: true,
        });
      },

      savePrefillData: async () => {
        const state = get();
        if (!state.prefillTargetUserId) return false;
        const data: PrefillData = {
          datosGenerales: { ...state.datosGenerales },
          situacionActual: { ...state.situacionActual },
          descripcionNegocio: state.descripcionNegocio,
          lineasNegocio: [...state.lineasNegocio],
          profAnswers: state.profAnswers.map(a => ({ ...a })),
          instAnswers: state.instAnswers.map(a => ({ ...a })),
          gerencias: state.gerencias.map(g => ({ ...g })),
          retos: [...state.retos],
          urgencia: state.urgencia,
          tieneLiderInterno: state.tieneLiderInterno,
          analisisFamiliar: { ...state.analisisFamiliar },
          marginData: { ...state.marginData },
        };
        return savePrefillToStorage(state.prefillTargetUserId, 'diagnostico_empresarial', data);
      },
    }),
    {
      name: 'ccg_diagnostic_draft',
      version: 5,
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === undefined || version < 2) {
          // Convert old puestosClave to gerencias
          if (persistedState.puestosClave && !persistedState.gerencias) {
            persistedState.gerencias = persistedState.puestosClave.map((p: any) => ({
              area: p.area,
              cubierto: !!p.nombrePersona,
              antiguedad: p.antiguedad ?? '',
              calificado: p.calificado === 'Sí' ? 'si' : p.calificado === 'No' ? 'no' : 'por_evaluar',
            }));
          }
          delete persistedState.puestosClave;
          delete persistedState.highestSalary;

          // Add descripcionNegocio
          if (!persistedState.descripcionNegocio) {
            persistedState.descripcionNegocio = '';
          }

          // Reset step to 0 since step indices changed
          persistedState.currentStep = 0;
        }

        // v2 → v3: migrate software single-select to multi-select
        if (version < 3) {
          const dg = persistedState.datosGenerales;
          if (dg && !dg.softwareSelections) {
            dg.softwareSelections = migrateSoftwareField(dg.software, dg.softwareDetalle);
          }
        }

        // v3 → v4: split puestoEmpresaFamilia into puestoEmpresa + puestoFamilia
        if (version < 4) {
          const dg = persistedState.datosGenerales;
          if (dg?.puestoEmpresaFamilia && !dg.puestoEmpresa) {
            const parts = dg.puestoEmpresaFamilia.split('/').map((s: string) => s.trim());
            dg.puestoEmpresa = parts[0] || '';
            dg.puestoFamilia = parts[1] || '';
          }
          if (dg) {
            dg.puestoEmpresa = dg.puestoEmpresa ?? '';
            dg.puestoFamilia = dg.puestoFamilia ?? '';
          }
        }

        // v4 → v5: institutionalization questions changed (8 → 10, new content)
        if (version < 5) {
          persistedState.instAnswers = defaultCriterionAnswers(INSTITUCIONALIZACION_CRITERIA);
          // Ensure sociosDetalle exists
          if (persistedState.situacionActual && !persistedState.situacionActual.sociosDetalle) {
            persistedState.situacionActual.sociosDetalle = [];
          }
        }

        return persistedState;
      },
      merge: (persistedState: unknown, currentState: DiagnosticState): DiagnosticState => {
        const persisted = persistedState as Partial<DiagnosticState>;
        const merged: DiagnosticState = { ...currentState, ...persisted };
        // Deep-merge datosGenerales so new fields (softwareSelections) always exist
        merged.datosGenerales = {
          ...currentState.datosGenerales,
          ...(persisted.datosGenerales ?? {}),
        };
        // Ensure softwareSelections is always present
        if (!merged.datosGenerales.softwareSelections) {
          merged.datosGenerales.softwareSelections = defaultSoftwareSelections();
        }
        // Ensure puesto fields always exist
        merged.datosGenerales.puestoEmpresa = merged.datosGenerales.puestoEmpresa ?? '';
        merged.datosGenerales.puestoFamilia = merged.datosGenerales.puestoFamilia ?? '';
        // Deep-merge situacionActual so new fields (sueldoMasAlto) always exist
        merged.situacionActual = {
          ...currentState.situacionActual,
          ...(persisted.situacionActual ?? {}),
        };
        return merged;
      },
      partialize: (state) => ({
        currentStep: state.currentStep,
        draftActive: state.draftActive,
        datosGenerales: state.datosGenerales,
        situacionActual: state.situacionActual,
        descripcionNegocio: state.descripcionNegocio,
        profAnswers: state.profAnswers,
        instAnswers: state.instAnswers,
        gerencias: state.gerencias,
        retos: state.retos,
        urgencia: state.urgencia,
        tieneLiderInterno: state.tieneLiderInterno,
        analisisFamiliar: state.analisisFamiliar,
        marginData: state.marginData,
      }),
    }
  )
);
