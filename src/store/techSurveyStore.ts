import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { saveTechSurvey as saveToStorage, updateTechSurvey as updateInStorage } from '../lib/storage';
import { getCurrentUser } from '../lib/auth';
import { computeTechMaturityScore } from '../config/techQuestions';
import type {
  TechToolsData,
  TechDigitalPresence,
  TechAutomation,
  TechDataAnalytics,
  TechAIAdoption,
  TechSecurity,
  TechCulture,
  SavedTechSurvey,
} from '../lib/types';

/* ── Defaults ──────────────────────────────────────────── */

function defaultTools(): TechToolsData {
  return {
    usaExcel: false,
    excelNivel: '',
    tieneERP: false,
    erpNombre: '',
    tieneCRM: false,
    crmNombre: '',
    tieneMRP: false,
    mrpNombre: '',
    otrasHerramientas: '',
  };
}

function defaultDigitalPresence(): TechDigitalPresence {
  return {
    tieneWebsite: false,
    websiteActualizado: false,
    tieneEcommerce: false,
    usaRedesSociales: false,
    redesActivas: [],
    marketingDigital: false,
  };
}

function defaultAutomation(): TechAutomation {
  return {
    procesosAutomatizados: 'ninguno',
    areasMasAutomatizadas: '',
    facturaElectronica: false,
    bancaDigital: false,
    firmaElectronica: false,
    gestionDocumentalDigital: false,
  };
}

function defaultDataAnalytics(): TechDataAnalytics {
  return {
    usaDatosParaDecisiones: 'nunca',
    tieneKPIs: false,
    dashboardsBI: false,
    herramientaBI: '',
    analiticaAvanzada: false,
  };
}

function defaultAIAdoption(): TechAIAdoption {
  return {
    conoceIA: false,
    usaIAEnEmpresa: false,
    casosUsoIA: [],
    interesEnIA: 'ninguno',
    inversionTechAnual: 'no_sabe',
  };
}

function defaultSecurity(): TechSecurity {
  return {
    tieneAntivirus: false,
    respaldosDatos: 'nunca',
    politicasSeguridad: false,
    capacitacionSeguridad: false,
    usaNube: false,
    proveedorNube: '',
  };
}

function defaultCulture(): TechCulture {
  return {
    resistenciaAlCambio: 'alta',
    capacitacionTecnologica: false,
    equipoTI: false,
    equipoTISize: null,
    presupuestoTech: false,
    retoPrincipalTech: '',
  };
}

/* ── Store Interface ───────────────────────────────────── */

interface TechSurveyState {
  testMode: boolean;
  currentStep: number;
  companyName: string;
  tools: TechToolsData;
  digitalPresence: TechDigitalPresence;
  automation: TechAutomation;
  dataAnalytics: TechDataAnalytics;
  aiAdoption: TechAIAdoption;
  security: TechSecurity;
  culture: TechCulture;
  savedResultId: string | null;
  draftActive: boolean;
  editMode: boolean;
  editSurveyId: string | null;

  setTestMode: (v: boolean) => void;
  setDraftActive: (v: boolean) => void;
  setStep: (step: number) => void;
  setCompanyName: (name: string) => void;
  updateTools: (partial: Partial<TechToolsData>) => void;
  updateDigitalPresence: (partial: Partial<TechDigitalPresence>) => void;
  updateAutomation: (partial: Partial<TechAutomation>) => void;
  updateDataAnalytics: (partial: Partial<TechDataAnalytics>) => void;
  updateAIAdoption: (partial: Partial<TechAIAdoption>) => void;
  updateSecurity: (partial: Partial<TechSecurity>) => void;
  updateCulture: (partial: Partial<TechCulture>) => void;
  saveTechSurvey: () => string;
  resetTechSurvey: () => void;
  loadTechSurveyForReport: (survey: SavedTechSurvey) => void;
  loadTechSurveyForEdit: (survey: SavedTechSurvey) => void;
}

/* ── Store ─────────────────────────────────────────────── */

export const useTechSurveyStore = create<TechSurveyState>()(
  persist(
    (set, get) => ({
      testMode: false,
      currentStep: 0,
      companyName: '',
      tools: defaultTools(),
      digitalPresence: defaultDigitalPresence(),
      automation: defaultAutomation(),
      dataAnalytics: defaultDataAnalytics(),
      aiAdoption: defaultAIAdoption(),
      security: defaultSecurity(),
      culture: defaultCulture(),
      savedResultId: null,
      draftActive: false,
      editMode: false,
      editSurveyId: null,

      setTestMode: (v) => set({ testMode: v }),
      setDraftActive: (v) => set({ draftActive: v }),
      setStep: (step) => set({ currentStep: step }),
      setCompanyName: (name) => set({ companyName: name }),

      updateTools: (partial) =>
        set(s => ({ tools: { ...s.tools, ...partial } })),

      updateDigitalPresence: (partial) =>
        set(s => ({ digitalPresence: { ...s.digitalPresence, ...partial } })),

      updateAutomation: (partial) =>
        set(s => ({ automation: { ...s.automation, ...partial } })),

      updateDataAnalytics: (partial) =>
        set(s => ({ dataAnalytics: { ...s.dataAnalytics, ...partial } })),

      updateAIAdoption: (partial) =>
        set(s => ({ aiAdoption: { ...s.aiAdoption, ...partial } })),

      updateSecurity: (partial) =>
        set(s => ({ security: { ...s.security, ...partial } })),

      updateCulture: (partial) =>
        set(s => ({ culture: { ...s.culture, ...partial } })),

      saveTechSurvey: () => {
        const state = get();
        const id = state.editMode && state.editSurveyId ? state.editSurveyId : uuidv4();

        const { score, level } = computeTechMaturityScore({
          tools: state.tools,
          digitalPresence: state.digitalPresence,
          automation: state.automation,
          dataAnalytics: state.dataAnalytics,
          aiAdoption: state.aiAdoption,
          security: state.security,
          culture: state.culture,
        });

        const survey: SavedTechSurvey = {
          id,
          savedAt: new Date().toISOString(),
          companyName: state.companyName,
          tools: { ...state.tools },
          digitalPresence: { ...state.digitalPresence },
          automation: { ...state.automation },
          dataAnalytics: { ...state.dataAnalytics },
          aiAdoption: { ...state.aiAdoption },
          security: { ...state.security },
          culture: { ...state.culture },
          maturityScore: score,
          maturityLevel: level,
        };

        // In testMode (master preview), skip persisting to Supabase
        if (!state.testMode) {
          if (state.editMode && state.editSurveyId) {
            updateInStorage(state.editSurveyId, survey).catch(err =>
              console.error('Failed to update tech survey in Supabase:', err),
            );
          } else {
            const currentUser = getCurrentUser();
            saveToStorage(survey, currentUser?.id).catch(err =>
              console.error('Failed to save tech survey to Supabase:', err),
            );
          }
        }
        set({ savedResultId: id, editMode: false, editSurveyId: null, draftActive: false });
        return id;
      },

      resetTechSurvey: () =>
        set({
          currentStep: 0,
          companyName: '',
          tools: defaultTools(),
          digitalPresence: defaultDigitalPresence(),
          automation: defaultAutomation(),
          dataAnalytics: defaultDataAnalytics(),
          aiAdoption: defaultAIAdoption(),
          security: defaultSecurity(),
          culture: defaultCulture(),
          savedResultId: null,
          draftActive: false,
          editMode: false,
          editSurveyId: null,
        }),

      loadTechSurveyForReport: (survey) =>
        set({
          companyName: survey.companyName,
          tools: { ...survey.tools },
          digitalPresence: { ...survey.digitalPresence },
          automation: { ...survey.automation },
          dataAnalytics: { ...survey.dataAnalytics },
          aiAdoption: { ...survey.aiAdoption },
          security: { ...survey.security },
          culture: { ...survey.culture },
        }),

      loadTechSurveyForEdit: (survey) =>
        set({
          companyName: survey.companyName,
          tools: { ...survey.tools },
          digitalPresence: { ...survey.digitalPresence },
          automation: { ...survey.automation },
          dataAnalytics: { ...survey.dataAnalytics },
          aiAdoption: { ...survey.aiAdoption },
          security: { ...survey.security },
          culture: { ...survey.culture },
          editMode: true,
          editSurveyId: survey.id,
          testMode: false,
          draftActive: false,
          currentStep: 0,
          savedResultId: null,
        }),
    }),
    {
      name: 'ccg_tech_survey_draft',
      version: 1,
      partialize: (state) => ({
        currentStep: state.currentStep,
        draftActive: state.draftActive,
        companyName: state.companyName,
        tools: state.tools,
        digitalPresence: state.digitalPresence,
        automation: state.automation,
        dataAnalytics: state.dataAnalytics,
        aiAdoption: state.aiAdoption,
        security: state.security,
        culture: state.culture,
      }),
    },
  ),
);
