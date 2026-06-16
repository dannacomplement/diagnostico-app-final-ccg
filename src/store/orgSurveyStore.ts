import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { GERENCIA_AREAS } from '../config/constants';
import { saveOrgSurvey as saveToStorage, updateOrgSurvey as updateInStorage } from '../lib/storage';
import { getCurrentUser } from '../lib/auth';
import type {
  OrgStructureData,
  AreaDetail,
  TalentProcesses,
  SavedOrgSurvey,
  SalaryCompetitiveness,
  PerformanceEvaluation,
} from '../lib/types';

/* ── Defaults ──────────────────────────────────────────── */

function defaultOrgStructure(): OrgStructureData {
  return {
    tieneOrganigrama: false,
    organigramaActualizado: null,
    descripcionesPuesto: 'ninguna',
    tieneTabulador: false,
    nominaMensualTotal: null,
  };
}

function defaultAreaDetails(): AreaDetail[] {
  return GERENCIA_AREAS.map(name => ({
    nombre: name,
    colaboradores: null,
    sueldoPromedio: null,
    tieneLider: false,
    isCustom: false,
  }));
}

function defaultTalentProcesses(): TalentProcesses {
  return {
    procesoReclutamiento: false,
    evaluacionesDesempeno: 'no' as PerformanceEvaluation,
    programaCapacitacion: false,
    rotacionAnual: null,
    competitividadSueldos: 'no_se' as SalaryCompetitiveness,
    retoCapitalHumano: '',
  };
}

/* ── Store Interface ───────────────────────────────────── */

interface OrgSurveyState {
  testMode: boolean;
  currentStep: number;
  companyName: string;
  orgStructure: OrgStructureData;
  areaDetails: AreaDetail[];
  talentProcesses: TalentProcesses;
  savedResultId: string | null;
  draftActive: boolean;
  editMode: boolean;
  editSurveyId: string | null;

  setTestMode: (v: boolean) => void;
  setDraftActive: (v: boolean) => void;
  setStep: (step: number) => void;
  setCompanyName: (name: string) => void;
  updateOrgStructure: (partial: Partial<OrgStructureData>) => void;
  setAreaDetail: (index: number, data: Partial<AreaDetail>) => void;
  addCustomArea: () => void;
  removeArea: (index: number) => void;
  updateTalentProcesses: (partial: Partial<TalentProcesses>) => void;
  saveOrgSurvey: () => string;
  resetOrgSurvey: () => void;
  loadOrgSurveyForReport: (survey: SavedOrgSurvey) => void;
  loadOrgSurveyForEdit: (survey: SavedOrgSurvey) => void;

  // Computed helpers
  getTotalColaboradores: () => number;
  getTotalNomina: () => number;
}

/* ── Store ─────────────────────────────────────────────── */

export const useOrgSurveyStore = create<OrgSurveyState>()(
  persist(
    (set, get) => ({
      testMode: false,
      currentStep: 0,
      companyName: '',
      orgStructure: defaultOrgStructure(),
      areaDetails: defaultAreaDetails(),
      talentProcesses: defaultTalentProcesses(),
      savedResultId: null,
      draftActive: false,
      editMode: false,
      editSurveyId: null,

      setTestMode: (v) => set({ testMode: v }),
      setDraftActive: (v) => set({ draftActive: v }),
      setStep: (step) => set({ currentStep: step }),
      setCompanyName: (name) => set({ companyName: name }),

      updateOrgStructure: (partial) =>
        set(s => ({ orgStructure: { ...s.orgStructure, ...partial } })),

      setAreaDetail: (index, data) =>
        set(s => {
          const areas = [...s.areaDetails];
          areas[index] = { ...areas[index], ...data };
          return { areaDetails: areas };
        }),

      addCustomArea: () =>
        set(s => ({
          areaDetails: [
            ...s.areaDetails,
            { nombre: '', colaboradores: null, sueldoPromedio: null, tieneLider: false, isCustom: true },
          ],
        })),

      removeArea: (index) =>
        set(s => ({
          areaDetails: s.areaDetails.filter((_, i) => i !== index),
        })),

      updateTalentProcesses: (partial) =>
        set(s => ({ talentProcesses: { ...s.talentProcesses, ...partial } })),

      saveOrgSurvey: () => {
        const state = get();
        const id = state.editMode && state.editSurveyId ? state.editSurveyId : uuidv4();

        const survey: SavedOrgSurvey = {
          id,
          savedAt: new Date().toISOString(),
          companyName: state.companyName,
          orgStructure: { ...state.orgStructure },
          areaDetails: state.areaDetails.map(a => ({ ...a })),
          talentProcesses: { ...state.talentProcesses },
        };

        // In testMode (master preview), skip persisting to Supabase
        if (!state.testMode) {
          if (state.editMode && state.editSurveyId) {
            updateInStorage(state.editSurveyId, survey).catch(err =>
              console.error('Failed to update org survey in Supabase:', err),
            );
          } else {
            const currentUser = getCurrentUser();
            saveToStorage(survey, currentUser?.id).catch(err =>
              console.error('Failed to save org survey to Supabase:', err),
            );
          }
        }
        set({ savedResultId: id, editMode: false, editSurveyId: null, draftActive: false });
        return id;
      },

      resetOrgSurvey: () =>
        set({
          currentStep: 0,
          companyName: '',
          orgStructure: defaultOrgStructure(),
          areaDetails: defaultAreaDetails(),
          talentProcesses: defaultTalentProcesses(),
          savedResultId: null,
          draftActive: false,
          editMode: false,
          editSurveyId: null,
        }),

      loadOrgSurveyForReport: (survey) =>
        set({
          companyName: survey.companyName,
          orgStructure: { ...survey.orgStructure },
          areaDetails: survey.areaDetails.map(a => ({ ...a })),
          talentProcesses: { ...survey.talentProcesses },
        }),

      loadOrgSurveyForEdit: (survey) =>
        set({
          companyName: survey.companyName,
          orgStructure: { ...survey.orgStructure },
          areaDetails: survey.areaDetails.map(a => ({ ...a })),
          talentProcesses: { ...survey.talentProcesses },
          editMode: true,
          editSurveyId: survey.id,
          testMode: false,
          draftActive: false,
          currentStep: 0,
          savedResultId: null,
        }),

      // Computed helpers
      getTotalColaboradores: () => {
        return get().areaDetails.reduce((sum, a) => sum + (a.colaboradores ?? 0), 0);
      },
      getTotalNomina: () => {
        return get().areaDetails.reduce((sum, a) => {
          const count = a.colaboradores ?? 0;
          const avg = a.sueldoPromedio ?? 0;
          return sum + count * avg;
        }, 0);
      },
    }),
    {
      name: 'ccg_org_survey_draft',
      version: 1,
      partialize: (state) => ({
        currentStep: state.currentStep,
        draftActive: state.draftActive,
        companyName: state.companyName,
        orgStructure: state.orgStructure,
        areaDetails: state.areaDetails,
        talentProcesses: state.talentProcesses,
      }),
    },
  ),
);
