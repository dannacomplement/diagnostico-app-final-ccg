import { supabase } from './supabase';
import { getAccessToken, ensureFreshSession } from './auth';
import type {
  SavedDiagnostic, SavedOrgSurvey, SavedTechSurvey, AppUser, SurveyType,
  DatosGenerales, SituacionActual, CriterionAnswer, Gerencia,
  FamilyAnalysis, MarginData, UrgencySelection, LineaNegocio,
} from './types';

/* ── Prefill data shape (raw wizard state) ─────────────── */

export interface PrefillData {
  datosGenerales?: Partial<DatosGenerales>;
  situacionActual?: Partial<SituacionActual>;
  descripcionNegocio?: string;
  lineasNegocio?: LineaNegocio[];
  profAnswers?: CriterionAnswer[];
  instAnswers?: CriterionAnswer[];
  gerencias?: Gerencia[];
  retos?: string[];
  urgencia?: UrgencySelection | null;
  tieneLiderInterno?: boolean | null;
  analisisFamiliar?: FamilyAnalysis;
  marginData?: MarginData;
}

function rowToDiagnostic(row: any): SavedDiagnostic {
  const d = row.data as any;
  // Preserve priority/classification from DB columns (they may be updated independently)
  d.priority = row.priority ?? d.priority;
  d.classification = row.classification ?? d.classification;
  return d as SavedDiagnostic;
}

/* ── Diagnostics ────────────────────────────────────────── */

export async function getAllDiagnostics(): Promise<SavedDiagnostic[]> {
  const { data, error } = await supabase
    .from('diagnostics')
    .select('*')
    .order('saved_at', { ascending: false });

  if (error) {
    console.error('Supabase getAllDiagnostics error:', error);
    return [];
  }
  return (data ?? []).map(rowToDiagnostic);
}

export async function getDiagnosticsByUser(userId: string): Promise<SavedDiagnostic[]> {
  const { data, error } = await supabase
    .from('diagnostics')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  if (error) {
    console.error('Supabase getDiagnosticsByUser error:', error);
    return [];
  }
  return (data ?? []).map(rowToDiagnostic);
}

export async function saveDiagnostic(diagnostic: SavedDiagnostic, userId?: string): Promise<void> {
  await ensureFreshSession();
  const { error } = await supabase
    .from('diagnostics')
    .insert({
      id: diagnostic.id,
      saved_at: diagnostic.savedAt,
      nombre_comercial: diagnostic.datosGenerales.nombreComercial || 'Sin nombre',
      sector: diagnostic.datosGenerales.sector,
      company_size: diagnostic.companySize.size,
      priority: diagnostic.priority ?? false,
      classification: diagnostic.classification ?? null,
      user_id: userId ?? null,
      data: diagnostic,
    });

  if (error) {
    console.error('Supabase saveDiagnostic error:', error);
  }
}

export async function getDiagnosticById(id: string): Promise<SavedDiagnostic | undefined> {
  const { data, error } = await supabase
    .from('diagnostics')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return undefined;
  return rowToDiagnostic(data);
}

export async function deleteDiagnostic(id: string): Promise<void> {
  const { error } = await supabase
    .from('diagnostics')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase deleteDiagnostic error:', error);
  }
}

export async function updateDiagnostic(id: string, partial: Partial<SavedDiagnostic>): Promise<void> {
  // First get the current data
  const { data: current, error: fetchErr } = await supabase
    .from('diagnostics')
    .select('data')
    .eq('id', id)
    .single();

  if (fetchErr || !current) {
    console.error('Supabase updateDiagnostic fetch error:', fetchErr);
    return;
  }

  const updatedData = { ...current.data, ...partial };

  const { error } = await supabase
    .from('diagnostics')
    .update({
      priority: updatedData.priority ?? false,
      classification: updatedData.classification ?? null,
      data: updatedData,
    })
    .eq('id', id);

  if (error) {
    console.error('Supabase updateDiagnostic error:', error);
  }
}

/* ── Org Surveys ───────────────────────────────────────── */

export async function saveOrgSurvey(survey: SavedOrgSurvey, userId?: string): Promise<void> {
  const { error } = await supabase
    .from('org_surveys')
    .insert({
      id: survey.id,
      saved_at: survey.savedAt,
      company_name: survey.companyName || 'Sin nombre',
      user_id: userId ?? null,
      data: survey,
    });

  if (error) {
    console.error('Supabase saveOrgSurvey error:', error);
  }
}

export async function getAllOrgSurveys(): Promise<SavedOrgSurvey[]> {
  const { data, error } = await supabase
    .from('org_surveys')
    .select('*')
    .order('saved_at', { ascending: false });

  if (error) {
    console.error('Supabase getAllOrgSurveys error:', error);
    return [];
  }
  return (data ?? []).map(row => row.data as SavedOrgSurvey);
}

export async function getOrgSurveysByUser(userId: string): Promise<SavedOrgSurvey[]> {
  const { data, error } = await supabase
    .from('org_surveys')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  if (error) {
    console.error('Supabase getOrgSurveysByUser error:', error);
    return [];
  }
  return (data ?? []).map(row => row.data as SavedOrgSurvey);
}

export async function deleteOrgSurvey(id: string): Promise<void> {
  const { error } = await supabase
    .from('org_surveys')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase deleteOrgSurvey error:', error);
  }
}

export async function updateOrgSurvey(id: string, survey: SavedOrgSurvey): Promise<void> {
  const { error } = await supabase
    .from('org_surveys')
    .update({
      company_name: survey.companyName || 'Sin nombre',
      data: survey,
    })
    .eq('id', id);

  if (error) {
    console.error('Supabase updateOrgSurvey error:', error);
  }
}

/* ── Tech Surveys ──────────────────────────────────────── */

export async function saveTechSurvey(survey: SavedTechSurvey, userId?: string): Promise<void> {
  const { error } = await supabase
    .from('tech_surveys')
    .insert({
      id: survey.id,
      saved_at: survey.savedAt,
      company_name: survey.companyName || 'Sin nombre',
      user_id: userId ?? null,
      data: survey,
    });

  if (error) {
    console.error('Supabase saveTechSurvey error:', error);
  }
}

export async function getAllTechSurveys(): Promise<SavedTechSurvey[]> {
  const { data, error } = await supabase
    .from('tech_surveys')
    .select('*')
    .order('saved_at', { ascending: false });

  if (error) {
    console.error('Supabase getAllTechSurveys error:', error);
    return [];
  }
  return (data ?? []).map(row => row.data as SavedTechSurvey);
}

export async function getTechSurveysByUser(userId: string): Promise<SavedTechSurvey[]> {
  const { data, error } = await supabase
    .from('tech_surveys')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  if (error) {
    console.error('Supabase getTechSurveysByUser error:', error);
    return [];
  }
  return (data ?? []).map(row => row.data as SavedTechSurvey);
}

export async function deleteTechSurvey(id: string): Promise<void> {
  const { error } = await supabase
    .from('tech_surveys')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase deleteTechSurvey error:', error);
  }
}

export async function updateTechSurvey(id: string, survey: SavedTechSurvey): Promise<void> {
  const { error } = await supabase
    .from('tech_surveys')
    .update({
      company_name: survey.companyName || 'Sin nombre',
      data: survey,
    })
    .eq('id', id);

  if (error) {
    console.error('Supabase updateTechSurvey error:', error);
  }
}

/* ── Client Expediente Data (grouped by user) ──────────── */

export async function getExpedienteDataForClients(): Promise<
  Map<string, { diagnostics: SavedDiagnostic[]; orgSurveys: SavedOrgSurvey[]; techSurveys: SavedTechSurvey[] }>
> {
  const [diagRes, orgRes, techRes] = await Promise.all([
    supabase.from('diagnostics').select('*').order('saved_at', { ascending: false }),
    supabase.from('org_surveys').select('*').order('saved_at', { ascending: false }),
    supabase.from('tech_surveys').select('*').order('saved_at', { ascending: false }),
  ]);

  const map = new Map<string, { diagnostics: SavedDiagnostic[]; orgSurveys: SavedOrgSurvey[]; techSurveys: SavedTechSurvey[] }>();

  for (const row of diagRes.data ?? []) {
    if (!row.user_id) continue;
    if (!map.has(row.user_id)) map.set(row.user_id, { diagnostics: [], orgSurveys: [], techSurveys: [] });
    map.get(row.user_id)!.diagnostics.push(rowToDiagnostic(row));
  }
  for (const row of orgRes.data ?? []) {
    if (!row.user_id) continue;
    if (!map.has(row.user_id)) map.set(row.user_id, { diagnostics: [], orgSurveys: [], techSurveys: [] });
    map.get(row.user_id)!.orgSurveys.push(row.data as SavedOrgSurvey);
  }
  for (const row of techRes.data ?? []) {
    if (!row.user_id) continue;
    if (!map.has(row.user_id)) map.set(row.user_id, { diagnostics: [], orgSurveys: [], techSurveys: [] });
    map.get(row.user_id)!.techSurveys.push(row.data as SavedTechSurvey);
  }

  return map;
}

/* ── User Accounts ──────────────────────────────────────── */

export async function createClientAccount(
  username: string,
  password: string,
  displayName: string,
  permissions: SurveyType[] = ['diagnostico_empresarial'],
  logoUrl?: string,
  email?: string,
): Promise<AppUser | null> {
  if (!email) {
    console.error('createClientAccount: email is required for Supabase Auth');
    return null;
  }

  const token = await getAccessToken();
  if (!token) {
    console.error('createClientAccount: no auth token');
    return null;
  }

  const res = await fetch('/api/create-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email, password, displayName: displayName || username, username, permissions, logoUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('createClientAccount error:', err.error || res.statusText);
    return null;
  }

  const { user: profile } = await res.json();
  return {
    id: profile.id,
    username: profile.username,
    role: profile.role as AppUser['role'],
    displayName: profile.display_name || profile.username,
    email: profile.email ?? undefined,
    surveyPermissions: (profile.survey_permissions as SurveyType[] | null) ?? ['diagnostico_empresarial'],
    logoUrl: (profile.logo_url as string | null) ?? undefined,
    status: (profile.status as AppUser['status']) ?? 'activo',
    createdAt: (profile.created_at as string | null) ?? undefined,
  };
}

export async function getAllClientAccounts(): Promise<AppUser[]> {
  const { data: rows, error } = await supabase
    .from('profiles')
    .select('id, username, role, display_name, email, created_at, survey_permissions, logo_url, status')
    .eq('role', 'client')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase getAllClientAccounts error:', error);
    return [];
  }

  return (rows ?? []).map(row => ({
    id: row.id,
    username: row.username,
    role: row.role as AppUser['role'],
    displayName: row.display_name || row.username,
    email: (row.email as string | null) ?? undefined,
    surveyPermissions: (row.survey_permissions as SurveyType[] | null) ?? ['diagnostico_empresarial'],
    logoUrl: (row.logo_url as string | null) ?? undefined,
    status: (row.status as AppUser['status']) ?? 'activo',
    createdAt: (row.created_at as string | null) ?? undefined,
  }));
}

export async function updateClientLogo(userId: string, logoUrl: string | null): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ logo_url: logoUrl })
    .eq('id', userId);

  if (error) {
    console.warn('Supabase updateClientLogo error:', error);
  }
}

export async function updateClientProfile(
  userId: string,
  updates: { displayName?: string; username?: string; password?: string; logoUrl?: string | null; email?: string; permissions?: SurveyType[]; status?: string },
): Promise<boolean> {
  // Password and email changes require the admin API (server-side)
  if (updates.password || updates.email) {
    const token = await getAccessToken();
    if (!token) return false;

    const res = await fetch('/api/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        userId,
        password: updates.password,
        email: updates.email,
        displayName: updates.displayName,
        username: updates.username,
        permissions: updates.permissions,
        logoUrl: updates.logoUrl,
        status: updates.status,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('updateClientProfile API error:', err.error || res.statusText);
      return false;
    }
    return true;
  }

  // Metadata-only updates go directly to profiles table
  const payload: Record<string, any> = {};
  if (updates.displayName !== undefined) payload.display_name = updates.displayName;
  if (updates.username !== undefined) payload.username = updates.username;
  if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl;
  if (updates.permissions !== undefined) payload.survey_permissions = updates.permissions;
  if (updates.status !== undefined) payload.status = updates.status;

  if (Object.keys(payload).length === 0) return true;

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId);

  if (error) {
    console.error('Supabase updateClientProfile error:', error);
    return false;
  }
  return true;
}

export async function updateUserPermissions(userId: string, permissions: SurveyType[]): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ survey_permissions: permissions })
    .eq('id', userId);

  if (error) {
    console.warn('Supabase updateUserPermissions error:', error);
  }
}

export async function deleteClientAccount(userId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    console.error('deleteClientAccount: no auth token');
    return;
  }

  const res = await fetch('/api/delete-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('deleteClientAccount error:', err.error || res.statusText);
  }
}

/* ── Prefills (master pre-populates survey for client) ─── */

export async function savePrefill(

  userId: string,
  surveyType: SurveyType,
  data: PrefillData,
): Promise<boolean> {
  await ensureFreshSession();
  const { error } = await supabase
    .from('prefills')
    .upsert(
      {
        user_id: userId,
        survey_type: surveyType,
        data,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,survey_type' }
    );

  if (error) {
    console.error('Supabase savePrefill error:', error);
    return false;
  }
  return true;
}

export async function getPrefillForUser(
  userId: string,
  surveyType: SurveyType = 'diagnostico_empresarial',
): Promise<PrefillData | null> {
  const { data, error } = await supabase
    .from('prefills')
    .select('data')
    .eq('user_id', userId)
    .eq('survey_type', surveyType)
    .maybeSingle();

  if (error) {
    // Table might not exist yet — just return null
    if (!error.message?.includes('prefills')) {
      console.error('Supabase getPrefillForUser error:', error);
    }
    return null;
  }
  return (data?.data as PrefillData) ?? null;
}

export async function deletePrefill(
  userId: string,
  surveyType: SurveyType = 'diagnostico_empresarial',
): Promise<void> {
  const { error } = await supabase
    .from('prefills')
    .delete()
    .eq('user_id', userId)
    .eq('survey_type', surveyType);

  if (error) {
    console.error('Supabase deletePrefill error:', error);
  }
}

export async function getPrefillsForClients(): Promise<Map<string, SurveyType[]>> {
  const { data, error } = await supabase
    .from('prefills')
    .select('user_id, survey_type');

  const map = new Map<string, SurveyType[]>();
  if (error || !data) return map;

  for (const row of data) {
    const uid = row.user_id as string;
    if (!map.has(uid)) map.set(uid, []);
    map.get(uid)!.push(row.survey_type as SurveyType);
  }
  return map;
}

/* ── Test client IDs (stored in app_settings) ─────────── */

export async function getTestClientIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'test_client_ids')
    .maybeSingle();

  if (error || !data?.value) return [];
  try { return JSON.parse(data.value as string); } catch { return []; }
}

export async function setTestClientIds(ids: string[]): Promise<boolean> {
  const { error } = await supabase
    .from('app_settings')
    .upsert([{ key: 'test_client_ids', value: JSON.stringify(ids) }], { onConflict: 'key' });

  if (error) {
    console.error('Failed to save test client ids:', error);
    return false;
  }
  return true;
}
