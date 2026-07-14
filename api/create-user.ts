import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No authorization token' });
  }

  const { data: { user: caller }, error: authErr } = await adminClient.auth.getUser(token);
  if (authErr || !caller) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single();

  if (callerProfile?.role !== 'master') {
    return res.status(403).json({ error: 'Only master accounts can create users' });
  }

  const { email, password, displayName, username, permissions, logoUrl, status } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data: authData, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'client', display_name: displayName || email },
  });

  if (createErr || !authData.user) {
    return res.status(400).json({ error: createErr?.message || 'Failed to create user' });
  }

  const newUserId = authData.user.id;

  const { error: profileErr } = await adminClient
    .from('profiles')
    .upsert({
      id: newUserId,
      username: username || email.split('@')[0].toLowerCase(),
      role: 'client',
      display_name: displayName || email,
      email,
      survey_permissions: permissions || ['diagnostico_empresarial'],
      logo_url: logoUrl || null,
      status: status || 'activo',
    });

  if (profileErr) {
    await adminClient.auth.admin.deleteUser(newUserId);
    return res.status(500).json({ error: 'Failed to create profile: ' + profileErr.message });
  }

  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', newUserId)
    .single();

  return res.status(200).json({ user: profile });
}
