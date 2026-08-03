-- ============================================================
-- Migración 0002: Elimina el sistema de sucursales (branches)
-- Ejecutar en: Supabase > SQL Editor > New Query > Run
--
-- Revierte la parte de "branches"/"operation_mode" de la migración
-- 0001 — la distribución por sucursales se maneja ahora como una
-- pregunta dentro de la Radiografía Empresarial (campo `sucursales`
-- en el JSON de `diagnostics`), no como cuentas/login separados.
--
-- NO toca `currency_code` ni `corporate_group` en `profiles` — esas
-- columnas siguen en uso (moneda por cliente, ej. CEMEX = USD).
-- ============================================================

-- 1. Políticas de lectura corporativa sobre diagnostics/org_surveys/tech_surveys
DROP POLICY IF EXISTS "select_diagnostics_corporate" ON diagnostics;
DROP POLICY IF EXISTS "select_org_surveys_corporate" ON org_surveys;
DROP POLICY IF EXISTS "select_tech_surveys_corporate" ON tech_surveys;

-- 2. Tabla de sucursales (con sus políticas e índice)
DROP TABLE IF EXISTS branches CASCADE;

-- 3. Columna operation_mode (ya no se usa; currency_code y corporate_group se conservan)
ALTER TABLE profiles DROP COLUMN IF EXISTS operation_mode;
