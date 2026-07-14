import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AppSettings {
  companyLogo: string | null;       // base64 data URL or null (use default)
  companyLogoIcon: string | null;   // smaller icon version for header
  floatingLogo: string | null;      // logo for login floating animation (null = use companyLogo)
  loaded: boolean;
}

interface SettingsState extends AppSettings {
  loadSettings: () => Promise<void>;
  setCompanyLogo: (logo: string | null, icon: string | null) => Promise<boolean>;
  setFloatingLogo: (logo: string | null) => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  companyLogo: null,
  companyLogoIcon: null,
  floatingLogo: null,
  loaded: false,

  loadSettings: async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['company_logo', 'company_logo_icon', 'floating_logo']);

      if (error) {
        // Table might not exist yet — use defaults
        console.warn('app_settings table not available:', error.message);
        set({ loaded: true });
        return;
      }

      const map = new Map((data ?? []).map(r => [r.key as string, r.value as string]));
      set({
        companyLogo: map.get('company_logo') ?? null,
        companyLogoIcon: map.get('company_logo_icon') ?? null,
        floatingLogo: map.get('floating_logo') ?? null,
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  setCompanyLogo: async (logo, icon) => {
    try {
      // Upsert both values
      const rows = [
        { key: 'company_logo', value: logo ?? '' },
        { key: 'company_logo_icon', value: icon ?? '' },
      ];

      const { error } = await supabase
        .from('app_settings')
        .upsert(rows, { onConflict: 'key' });

      if (error) {
        console.error('Failed to save logo settings:', error);
        return false;
      }

      set({
        companyLogo: logo,
        companyLogoIcon: icon,
      });
      return true;
    } catch {
      return false;
    }
  },

  setFloatingLogo: async (logo) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert([{ key: 'floating_logo', value: logo ?? '' }], { onConflict: 'key' });

      if (error) {
        console.error('Failed to save floating logo:', error);
        return false;
      }

      set({ floatingLogo: logo });
      return true;
    } catch {
      return false;
    }
  },
}));
