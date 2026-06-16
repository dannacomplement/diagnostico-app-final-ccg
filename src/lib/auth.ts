import { supabase } from './supabase';
import type { AppUser, SurveyType } from './types';

const SESSION_KEY = 'ccg_current_user';

const ALL_SURVEYS: SurveyType[] = ['diagnostico_empresarial', 'estructura_organizacional', 'prueba_tecnologia'];
const DEFAULT_PERMISSIONS: SurveyType[] = ['diagnostico_empresarial'];

export async function loginUser(identifier: string, password: string): Promise<AppUser | null> {
  let data: any = null;

  // Try login by email first, then by username for backward compatibility
  const isEmail = identifier.includes('@');

  const res1 = await supabase
    .from('users')
    .select('id, username, password, role, display_name, email, survey_permissions, logo_url')
    .eq(isEmail ? 'email' : 'username', identifier)
    .single();

  if (res1.error && (res1.error.message?.includes('survey_permissions') || res1.error.message?.includes('logo_url') || res1.error.message?.includes('email'))) {
    // Columns don't exist yet — query with basic columns
    const res2 = await supabase
      .from('users')
      .select('id, username, password, role, display_name')
      .eq('username', identifier)
      .single();
    if (res2.error || !res2.data) return null;
    data = res2.data;
  } else if (res1.error || !res1.data) {
    // If email login failed, try username as fallback
    if (isEmail) {
      const res3 = await supabase
        .from('users')
        .select('id, username, password, role, display_name, email, survey_permissions, logo_url')
        .eq('username', identifier)
        .single();
      if (res3.error || !res3.data) return null;
      data = res3.data;
    } else {
      return null;
    }
  } else {
    data = res1.data;
  }

  if (data.password !== password) return null;

  const isMasterRole = data.role === 'master';

  return {
    id: data.id,
    username: data.username,
    role: data.role as AppUser['role'],
    displayName: data.display_name || data.username,
    email: (data.email as string | null) ?? undefined,
    surveyPermissions: isMasterRole
      ? ALL_SURVEYS
      : (data.survey_permissions as SurveyType[] | null) ?? DEFAULT_PERMISSIONS,
    logoUrl: (data.logo_url as string | null) ?? undefined,
  };
}

export function getCurrentUser(): AppUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AppUser): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

export function isMaster(): boolean {
  return getCurrentUser()?.role === 'master';
}
