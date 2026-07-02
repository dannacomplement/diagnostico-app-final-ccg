import { create } from 'zustand';
import type { AppUser } from '../lib/types';
import { loginUser, logout as logoutAuth, getCurrentSession, persistUserLocally } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useDiagnosticStore } from './diagnosticStore';
import { useOrgSurveyStore } from './orgSurveyStore';
import { useTechSurveyStore } from './techSurveyStore';

interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  loginTransitioning: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  initialize: () => void;
  startLoginTransition: () => void;
  endLoginTransition: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,
  loginTransitioning: false,

  login: async (identifier, password) => {
    const user = await loginUser(identifier, password);
    if (user) {
      persistUserLocally(user);
      set({ user });
      return true;
    }
    return false;
  },

  logout: () => {
    logoutAuth();
    useDiagnosticStore.getState().resetDiagnostic();
    useOrgSurveyStore.getState().resetOrgSurvey();
    useTechSurveyStore.getState().resetTechSurvey();
    set({ user: null });
  },

  initialize: () => {
    getCurrentSession().then(user => {
      persistUserLocally(user);
      set({ user, isLoading: false });
    });

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        persistUserLocally(null);
        set({ user: null });
      } else if (event === 'TOKEN_REFRESHED') {
        const user = await getCurrentSession();
        if (user) {
          persistUserLocally(user);
          set({ user });
        }
      }
    });

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        persistUserLocally(null);
        set({ user: null });
        return;
      }
      const expiresAt = session.expires_at ?? 0;
      const nowSecs = Math.floor(Date.now() / 1000);
      if (expiresAt - nowSecs < 300) {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) {
          persistUserLocally(null);
          set({ user: null });
          return;
        }
        const user = await getCurrentSession();
        if (user) {
          persistUserLocally(user);
          set({ user });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  },

  startLoginTransition: () => set({ loginTransitioning: true }),
  endLoginTransition: () => set({ loginTransitioning: false }),
}));
