-- ============================================================
-- Migración 0001: Modo de operación multisucursal + moneda configurable
-- Ejecutar en: Supabase > SQL Editor > New Query > Run
--
-- No afecta datos existentes: las columnas nuevas usan DEFAULT +
-- NOT NULL, así que todos los perfiles actuales quedan
-- automáticamente en operation_mode='STANDARD', currency_code='MXN'
-- sin backfill manual. Ninguna tabla existente se modifica salvo
-- por estas 2 columnas nuevas en `profiles`.
-- ============================================================

-- 1. Modo de operación y moneda por cliente/expediente
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS operation_mode TEXT NOT NULL DEFAULT 'STANDARD'
    CHECK (operation_mode IN ('STANDARD', 'MULTI_BRANCH')),
  ADD COLUMN IF NOT EXISTS currency_code TEXT NOT NULL DEFAULT 'MXN'
    CHECK (currency_code IN ('MXN', 'USD')),
  ADD COLUMN IF NOT EXISTS corporate_group TEXT;

-- corporate_group: etiqueta libre para agrupar varios clientes bajo un mismo
-- corporativo en la lista del master (ej. "CEMEX"), sin relación con el
-- sistema de sucursales de abajo — cada cliente en el grupo sigue siendo
-- un expediente STANDARD normal, independiente.

-- 2. Tabla de sucursales
-- Una sucursal vincula un perfil corporativo (corporate_client_id) con,
-- opcionalmente, el perfil/login propio del responsable de esa sucursal
-- (branch_profile_id). El responsable de sucursal usa el mismo flujo de
-- diagnóstico que cualquier cliente STANDARD hoy — no se duplican aquí
-- empleados/ventas/avance, esos viven en su propio diagnóstico una vez
-- creado (diagnostics.data, vía branch_profile_id -> user_id).
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  branch_profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  internal_code TEXT,
  country TEXT NOT NULL,
  region TEXT,
  city TEXT,
  address TEXT,
  responsible_name TEXT,
  responsible_position TEXT,
  responsible_email TEXT,
  responsible_phone TEXT,
  status TEXT NOT NULL DEFAULT 'activa'
    CHECK (status IN ('activa', 'inactiva', 'archivada')),
  diagnostic_status TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (diagnostic_status IN ('pendiente', 'en_proceso', 'terminado')),
  admin_notes TEXT,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_branches_corporate_client_id ON branches(corporate_client_id);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Master: acceso total.
-- Corporativo: puede ver (no escribir) sus propias sucursales.
-- Sucursal: puede ver (no escribir) únicamente su propia fila.
-- INSERT/UPDATE/DELETE: solo master en esta primera fase.
CREATE POLICY "select_branches" ON branches FOR SELECT
  USING (
    is_master()
    OR auth.uid() = corporate_client_id
    OR auth.uid() = branch_profile_id
  );
CREATE POLICY "insert_branches" ON branches FOR INSERT
  WITH CHECK (is_master());
CREATE POLICY "update_branches" ON branches FOR UPDATE
  USING (is_master());
CREATE POLICY "delete_branches" ON branches FOR DELETE
  USING (is_master());

-- 3. Lectura corporativa de diagnósticos/encuestas de sucursales
-- Política ADICIONAL (no reemplaza las existentes): permite que el
-- perfil corporativo padre LEA (nunca escriba) los diagnósticos/encuestas
-- de sus propias sucursales, para el panel consolidado. El aislamiento
-- entre sucursales (una sucursal no ve la de otra) sigue intacto porque
-- las políticas "auth.uid() = user_id" ya existentes no se tocan.
CREATE POLICY "select_diagnostics_corporate" ON diagnostics FOR SELECT
  USING (
    auth.uid() IN (
      SELECT corporate_client_id FROM branches WHERE branch_profile_id = diagnostics.user_id
    )
  );
CREATE POLICY "select_org_surveys_corporate" ON org_surveys FOR SELECT
  USING (
    auth.uid() IN (
      SELECT corporate_client_id FROM branches WHERE branch_profile_id = org_surveys.user_id
    )
  );
CREATE POLICY "select_tech_surveys_corporate" ON tech_surveys FOR SELECT
  USING (
    auth.uid() IN (
      SELECT corporate_client_id FROM branches WHERE branch_profile_id = tech_surveys.user_id
    )
  );
