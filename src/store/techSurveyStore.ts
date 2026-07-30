import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { saveTechSurvey as saveToStorage, updateTechSurvey as updateInStorage } from '../lib/storage';
import { getCurrentUser } from '../lib/auth';
import { AREA_STATEMENTS, GENERAL_STATEMENTS, computeMaturityPercentage } from '../config/techQuestions';
import type { TechMaturityArea, TechMaturityScore, SavedTechSurvey } from '../lib/types';

/* ── Store Interface ───────────────────────────────────── */

interface TechSurveyState {
  testMode: boolean;
  currentStep: number;
  companyName: string;
  respondentArea: TechMaturityArea | null;
  rolCargo: string;
  sistemasPrincipales: string;
  areaAnswers: Record<string, TechMaturityScore>;
  generalAnswers: Record<string, TechMaturityScore>;
  savedResultId: string | null;
  draftActive: boolean;
  editMode: boolean;
  editSurveyId: string | null;

  setTestMode: (v: boolean) => void;
  setDraftActive: (v: boolean) => void;
  setStep: (step: number) => void;
  setCompanyName: (name: string) => void;
  setRespondentArea: (area: TechMaturityArea) => void;
  setRolCargo: (rol: string) => void;
  setSistemasPrincipales: (sistemas: string) => void;
  setAnswer: (id: string, score: TechMaturityScore, isGeneral: boolean) => void;
  saveTechSurvey: () => string;
  resetTechSurvey: () => void;
  loadTechSurveyForReport: (survey: SavedTechSurvey) => void;
  loadTechSurveyForEdit: (survey: SavedTechSurvey) => void;
}

const initialState = {
  currentStep: 0,
  companyName: '',
  respondentArea: null as TechMaturityArea | null,
  rolCargo: '',
  sistemasPrincipales: '',
  areaAnswers: {} as Record<string, TechMaturityScore>,
  generalAnswers: {} as Record<string, TechMaturityScore>,
  savedResultId: null as string | null,
  draftActive: false,
  editMode: false,
  editSurveyId: null as string | null,
};

/* ── Store ─────────────────────────────────────────────── */

export const useTechSurveyStore = create<TechSurveyState>()(
  persist(
    (set, get) => ({
      testMode: false,
      ...initialState,

      setTestMode: (v) => set({ testMode: v }),
      setDraftActive: (v) => set({ draftActive: v }),
      setStep: (step) => set({ currentStep: step }),
      setCompanyName: (name) => set({ companyName: name }),
      setRespondentArea: (area) => set({ respondentArea: area }),
      setRolCargo: (rol) => set({ rolCargo: rol }),
      setSistemasPrincipales: (sistemas) => set({ sistemasPrincipales: sistemas }),

      setAnswer: (id, score, isGeneral) =>
        set(s => isGeneral
          ? { generalAnswers: { ...s.generalAnswers, [id]: score } }
          : { areaAnswers: { ...s.areaAnswers, [id]: score } }),

      saveTechSurvey: () => {
        const state = get();
        const id = state.editMode && state.editSurveyId ? state.editSurveyId : uuidv4();
        const area = state.respondentArea ?? 'comercial';

        const areaAnswers = AREA_STATEMENTS[area]
          .filter(st => state.areaAnswers[st.id] !== undefined)
          .map(st => ({ id: st.id, score: state.areaAnswers[st.id] }));
        const generalAnswers = GENERAL_STATEMENTS
          .filter(st => state.generalAnswers[st.id] !== undefined)
          .map(st => ({ id: st.id, score: state.generalAnswers[st.id] }));

        const survey: SavedTechSurvey = {
          id,
          savedAt: new Date().toISOString(),
          companyName: state.companyName,
          respondentArea: area,
          rolCargo: state.rolCargo,
          sistemasPrincipales: state.sistemasPrincipales,
          areaAnswers,
          generalAnswers,
          areaScore: computeMaturityPercentage(areaAnswers),
          generalScore: computeMaturityPercentage(generalAnswers),
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

      resetTechSurvey: () => set({ ...initialState }),

      loadTechSurveyForReport: (survey) =>
        set({
          companyName: survey.companyName,
          respondentArea: survey.respondentArea,
          rolCargo: survey.rolCargo,
          sistemasPrincipales: survey.sistemasPrincipales,
          areaAnswers: Object.fromEntries(survey.areaAnswers.map(a => [a.id, a.score])),
          generalAnswers: Object.fromEntries(survey.generalAnswers.map(a => [a.id, a.score])),
        }),

      loadTechSurveyForEdit: (survey) =>
        set({
          companyName: survey.companyName,
          respondentArea: survey.respondentArea,
          rolCargo: survey.rolCargo,
          sistemasPrincipales: survey.sistemasPrincipales,
          areaAnswers: Object.fromEntries(survey.areaAnswers.map(a => [a.id, a.score])),
          generalAnswers: Object.fromEntries(survey.generalAnswers.map(a => [a.id, a.score])),
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
      version: 2,
      migrate: () => ({ ...initialState }),
      partialize: (state) => ({
        currentStep: state.currentStep,
        draftActive: state.draftActive,
        companyName: state.companyName,
        respondentArea: state.respondentArea,
        rolCargo: state.rolCargo,
        sistemasPrincipales: state.sistemasPrincipales,
        areaAnswers: state.areaAnswers,
        generalAnswers: state.generalAnswers,
      }),
    },
  ),
);
