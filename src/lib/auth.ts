import { supabase } from './supabase';
import type { AppUser, SurveyType } from './types';

const ALL_SURVEYS: SurveyType[] = ['diagnostico_empresarial', 'estructura_organizacional', 'prueba_tecnologia'];
const DEFAULT_PERMISSIONS: SurveyType[] = ['diagnostico_empresarial'];

function profileToAppUser(profile: any, email?: string): AppUser {
  const isMaster = profile.role === 'master';
  return {
    id: profile.id,
    username: profile.username ?? email ?? '',
    role: profile.role as AppUser['role'],
    displayName: profile.display_name || profile.username || email || '',
    email: profile.email ?? email ?? undefined,
    surveyPermissions: isMaster
      ? ALL_SURVEYS
      : (profile.survey_permissions as SurveyType[] | null) ?? DEFAULT_PERMISSIONS,
    logoUrl: (profile.logo_url as string | null) ?? undefined,
    status: (profile.status as AppUser['status']) ?? 'activo',
    createdAt: (profile.created_at as string | null) ?? undefined,
  };
}

export async function loginUser(identifier: string, password: string): Promise<AppUser | null> {
  let email = identifier;

  // If identifier doesn't look like an email, look up the email from profiles
  if (!identifier.includes('@')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', identifier)
      .single();

    if (!profile?.email) return null;
    email = profile.email;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (!profile) return null;

  return profileToAppUser(profile, data.user.email ?? undefined);
}

export async function getCurrentSession(): Promise<AppUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) return null;

  return profileToAppUser(profile, session.user.email ?? undefined);
}

export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function refreshSession(): Promise<boolean> {
  const { data, error } = await supabase.auth.refreshSession();
  return !error && !!data.session;
}

export async function ensureFreshSession(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const expiresAt = session.expires_at ?? 0;
  const nowSecs = Math.floor(Date.now() / 1000);
  // Refresh if less than 5 minutes left
  if (expiresAt - nowSecs < 300) {
    await supabase.auth.refreshSession();
  }
}

export function getCurrentUser(): AppUser | null {
  // Synchronous read — used by stores that need user.id immediately.
  // Reads from the Zustand store via a lazy import to avoid circular deps.
  try {
    const raw = localStorage.getItem('ccg_auth_user');
    if (!raw) return null;
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export function persistUserLocally(user: AppUser | null): void {
  if (user) {
    localStorage.setItem('ccg_auth_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('ccg_auth_user');
  }
}

export async function logout(): Promise<void> {
  localStorage.removeItem('ccg_auth_user');
  await supabase.auth.signOut();
}
