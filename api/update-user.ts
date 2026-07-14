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
    return res.status(403).json({ error: 'Only master accounts can update users' });
  }

  const { userId, password, email, displayName, username, permissions, logoUrl, status } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  if (password || email) {
    const authUpdate: Record<string, string> = {};
    if (password) authUpdate.password = password;
    if (email) authUpdate.email = email;

    const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, authUpdate);
    if (updateErr) {
      return res.status(400).json({ error: updateErr.message });
    }
  }

  const profilePayload: Record<string, any> = {};
  if (displayName !== undefined) profilePayload.display_name = displayName;
  if (username !== undefined) profilePayload.username = username;
  if (email !== undefined) profilePayload.email = email;
  if (permissions !== undefined) profilePayload.survey_permissions = permissions;
  if (logoUrl !== undefined) profilePayload.logo_url = logoUrl;
  if (status !== undefined) profilePayload.status = status;

  if (Object.keys(profilePayload).length > 0) {
    const { error: profileErr } = await adminClient
      .from('profiles')
      .update(profilePayload)
      .eq('id', userId);

    if (profileErr) {
      return res.status(500).json({ error: 'Failed to update profile: ' + profileErr.message });
    }
  }

  return res.status(200).json({ success: true });
}
