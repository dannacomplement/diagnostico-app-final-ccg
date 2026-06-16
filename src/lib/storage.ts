import { supabase } from './supabase';
import type {
  SavedDiagnostic, SavedOrgSurvey, SavedTechSurvey, AppUser, SurveyType,
  DatosGenerales, SituacionActual, CriterionAnswer, Gerencia,
  FamilyAnalysis, MarginData, UrgencySelection,
} from './types';

/* ── Prefill data shape (raw wizard state) ─────────────── */

export interface PrefillData {
  datosGenerales?: Partial<DatosGenerales>;
  situacionActual?: Partial<SituacionActual>;
  descripcionNegocio?: string;
  profAnswers?: CriterionAnswer[];
  instAnswers?: CriterionAnswer[];
  gerencias?: Gerencia[];
  retos?: string[];
  urgencia?: UrgencySelection | null;
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
  const insertPayload: Record<string, any> = {
    username,
    password,
    role: 'client',
    display_name: displayName || username,
  };

  // Build full payload with optional columns
  const fullPayload: Record<string, any> = {
    ...insertPayload,
    survey_permissions: permissions,
    ...(logoUrl ? { logo_url: logoUrl } : {}),
    ...(email ? { email } : {}),
  };

  const selectCols = 'id, username, role, display_name, email, survey_permissions, logo_url';

  const { data, error } = await supabase
    .from('users')
    .insert(fullPayload)
    .select(selectCols)
    .single();

  if (error && (error.message?.includes('survey_permissions') || error.message?.includes('logo_url') || error.message?.includes('email'))) {
    // One or more columns don't exist — insert with basic columns only
    const { data: d2, error: e2 } = await supabase
      .from('users')
      .insert(insertPayload)
      .select('id, username, role, display_name')
      .single();
    if (e2 || !d2) {
      console.error('Supabase createClientAccount error:', e2);
      return null;
    }
    return {
      id: d2.id,
      username: d2.username,
      role: d2.role as AppUser['role'],
      displayName: d2.display_name || d2.username,
      surveyPermissions: ['diagnostico_empresarial'],
    };
  }

  if (error || !data) {
    console.error('Supabase createClientAccount error:', error);
    return null;
  }

  return {
    id: data.id,
    username: data.username,
    role: data.role as AppUser['role'],
    displayName: data.display_name || data.username,
    email: (data.email as string | null) ?? undefined,
    surveyPermissions: (data.survey_permissions as SurveyType[] | null) ?? ['diagnostico_empresarial'],
    logoUrl: (data.logo_url as string | null) ?? undefined,
  };
}

export async function getAllClientAccounts(): Promise<AppUser[]> {
  let rows: any[] = [];

  const res1 = await supabase
    .from('users')
    .select('id, username, role, display_name, email, created_at, survey_permissions, logo_url')
    .eq('role', 'client')
    .order('created_at', { ascending: false });

  if (res1.error && (res1.error.message?.includes('survey_permissions') || res1.error.message?.includes('logo_url') || res1.error.message?.includes('email'))) {
    const res2 = await supabase
      .from('users')
      .select('id, username, role, display_name, created_at')
      .eq('role', 'client')
      .order('created_at', { ascending: false });
    if (res2.error) {
      console.error('Supabase getAllClientAccounts error:', res2.error);
      return [];
    }
    rows = res2.data ?? [];
  } else if (res1.error) {
    console.error('Supabase getAllClientAccounts error:', res1.error);
    return [];
  } else {
    rows = res1.data ?? [];
  }

  return rows.map(row => ({
    id: row.id,
    username: row.username,
    role: row.role as AppUser['role'],
    displayName: row.display_name || row.username,
    email: (row.email as string | null) ?? undefined,
    surveyPermissions: (row.survey_permissions as SurveyType[] | null) ?? ['diagnostico_empresarial'],
    logoUrl: (row.logo_url as string | null) ?? undefined,
  }));
}

export async function updateClientLogo(userId: string, logoUrl: string | null): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ logo_url: logoUrl })
    .eq('id', userId);

  if (error) {
    console.warn('Supabase updateClientLogo error (run ALTER TABLE to add logo_url column):', error);
  }
}

export async function updateClientProfile(
  userId: string,
  updates: { displayName?: string; username?: string; password?: string; logoUrl?: string | null; email?: string; permissions?: SurveyType[] },
): Promise<boolean> {
  const payload: Record<string, any> = {};
  if (updates.displayName !== undefined) payload.display_name = updates.displayName;
  if (updates.username !== undefined) payload.username = updates.username;
  if (updates.password !== undefined) payload.password = updates.password;
  if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.permissions !== undefined) payload.survey_permissions = updates.permissions;

  if (Object.keys(payload).length === 0) return true;

  const { error } = await supabase
    .from('users')
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
    .from('users')
    .update({ survey_permissions: permissions })
    .eq('id', userId);

  if (error) {
    // Column might not exist yet — warn but don't break
    console.warn('Supabase updateUserPermissions error (run ALTER TABLE to add survey_permissions column):', error);
  }
}

export async function deleteClientAccount(userId: string): Promise<void> {
  // Delete all diagnostics belonging to this user
  const { error: diagErr } = await supabase
    .from('diagnostics')
    .delete()
    .eq('user_id', userId);

  if (diagErr) {
    console.error('Supabase deleteClientAccount diagnostics error:', diagErr);
  }

  // Delete all org surveys belonging to this user
  const { error: orgErr } = await supabase
    .from('org_surveys')
    .delete()
    .eq('user_id', userId);

  if (orgErr) {
    console.error('Supabase deleteClientAccount org_surveys error:', orgErr);
  }

  // Delete all tech surveys belonging to this user
  const { error: techErr } = await supabase
    .from('tech_surveys')
    .delete()
    .eq('user_id', userId);

  if (techErr) {
    console.error('Supabase deleteClientAccount tech_surveys error:', techErr);
  }

  // Delete any prefills for this user
  await deletePrefill(userId, 'diagnostico_empresarial').catch(() => {});

  // Then delete the user
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Supabase deleteClientAccount error:', error);
  }
}

/* ── Prefills (master pre-populates survey for client) ─── */

export async function savePrefill(
  userId: string,
  surveyType: SurveyType,
  data: PrefillData,
): Promise<boolean> {
  // Upsert — one prefill per user per survey type
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
