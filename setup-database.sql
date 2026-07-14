-- ============================================================
-- Diagnostico App CCG — Database Setup (Supabase Auth)
-- Ejecutar en: Supabase > SQL Editor > New Query > Run
-- ============================================================

-- 1. Tabla de perfiles (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'client',
  display_name TEXT,
  email TEXT,
  survey_permissions JSONB DEFAULT '["diagnostico_empresarial"]',
  logo_url TEXT,
  status TEXT DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Trigger: auto-crear perfil al registrar usuario en auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, display_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Tabla de diagnosticos empresariales
CREATE TABLE IF NOT EXISTS diagnostics (
  id TEXT PRIMARY KEY,
  saved_at TEXT NOT NULL,
  nombre_comercial TEXT,
  sector TEXT,
  company_size TEXT,
  priority BOOLEAN DEFAULT false,
  classification TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL
);

-- 4. Tabla de encuestas de estructura organizacional
CREATE TABLE IF NOT EXISTS org_surveys (
  id TEXT PRIMARY KEY,
  saved_at TEXT NOT NULL,
  company_name TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL
);

-- 5. Tabla de encuestas de tecnologia
CREATE TABLE IF NOT EXISTS tech_surveys (
  id TEXT PRIMARY KEY,
  saved_at TEXT NOT NULL,
  company_name TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL
);

-- 6. Tabla de pre-llenados
CREATE TABLE IF NOT EXISTS prefills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  survey_type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, survey_type)
);

-- 7. Tabla de configuracion global
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- 8. Helper: verificar si el usuario actual es master
CREATE OR REPLACE FUNCTION public.is_master()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 9. Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE prefills ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 10. Politicas RLS — profiles
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  USING (is_master() OR auth.uid() = id);
CREATE POLICY "insert_profiles" ON profiles FOR INSERT
  WITH CHECK (is_master() OR auth.uid() = id);
CREATE POLICY "update_profiles" ON profiles FOR UPDATE
  USING (is_master() OR auth.uid() = id);
CREATE POLICY "delete_profiles" ON profiles FOR DELETE
  USING (is_master());

-- 11. Politicas RLS — diagnostics
CREATE POLICY "select_diagnostics" ON diagnostics FOR SELECT
  USING (is_master() OR auth.uid() = user_id);
CREATE POLICY "insert_diagnostics" ON diagnostics FOR INSERT
  WITH CHECK (is_master() OR auth.uid() = user_id);
CREATE POLICY "update_diagnostics" ON diagnostics FOR UPDATE
  USING (is_master() OR auth.uid() = user_id);
CREATE POLICY "delete_diagnostics" ON diagnostics FOR DELETE
  USING (is_master() OR auth.uid() = user_id);

-- 12. Politicas RLS — org_surveys
CREATE POLICY "select_org_surveys" ON org_surveys FOR SELECT
  USING (is_master() OR auth.uid() = user_id);
CREATE POLICY "insert_org_surveys" ON org_surveys FOR INSERT
  WITH CHECK (is_master() OR auth.uid() = user_id);
CREATE POLICY "update_org_surveys" ON org_surveys FOR UPDATE
  USING (is_master() OR auth.uid() = user_id);
CREATE POLICY "delete_org_surveys" ON org_surveys FOR DELETE
  USING (is_master() OR auth.uid() = user_id);

-- 13. Politicas RLS — tech_surveys
CREATE POLICY "select_tech_surveys" ON tech_surveys FOR SELECT
  USING (is_master() OR auth.uid() = user_id);
CREATE POLICY "insert_tech_surveys" ON tech_surveys FOR INSERT
  WITH CHECK (is_master() OR auth.uid() = user_id);
CREATE POLICY "update_tech_surveys" ON tech_surveys FOR UPDATE
  USING (is_master() OR auth.uid() = user_id);
CREATE POLICY "delete_tech_surveys" ON tech_surveys FOR DELETE
  USING (is_master() OR auth.uid() = user_id);

-- 14. Politicas RLS — prefills
CREATE POLICY "select_prefills" ON prefills FOR SELECT
  USING (is_master() OR auth.uid() = user_id);
CREATE POLICY "insert_prefills" ON prefills FOR INSERT
  WITH CHECK (is_master());
CREATE POLICY "update_prefills" ON prefills FOR UPDATE
  USING (is_master());
CREATE POLICY "delete_prefills" ON prefills FOR DELETE
  USING (is_master() OR auth.uid() = user_id);

-- 15. Politicas RLS — app_settings
CREATE POLICY "select_settings" ON app_settings FOR SELECT
  USING (true);
CREATE POLICY "insert_settings" ON app_settings FOR INSERT
  WITH CHECK (is_master());
CREATE POLICY "update_settings" ON app_settings FOR UPDATE
  USING (is_master());
CREATE POLICY "delete_settings" ON app_settings FOR DELETE
  USING (is_master());
