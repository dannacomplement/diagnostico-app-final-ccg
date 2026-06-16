import { create } from 'zustand';
import type { AppUser } from '../lib/types';
import { loginUser, getCurrentUser, setCurrentUser, logout as logoutSession } from '../lib/auth';

interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,

  login: async (username, password) => {
    const user = await loginUser(username, password);
    if (user) {
      setCurrentUser(user);
      set({ user });
      return true;
    }
    return false;
  },

  logout: () => {
    logoutSession();
    set({ user: null });
  },

  initialize: () => {
    const user = getCurrentUser();
    set({ user, isLoading: false });
  },
}));
