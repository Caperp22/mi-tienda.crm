-- ============================================================
-- MIGRACIÓN: Sistema de Módulos por Empresa
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- 1. Agrega la columna 'modulos' (JSONB) a la tabla empresas
--    DEFAULT: todos los módulos básicos activos para registros existentes
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS modulos JSONB DEFAULT '{
    "tienda": true,
    "inventario": true,
    "pedidos": true,
    "clientes": true,
    "agenda": false,
    "servicios": false,
    "ventas": false,
    "estadisticas": false,
    "admins": false
  }'::jsonb;

-- 2. Actualiza empresas existentes según su plan actual
--    (migra los datos legacy usa_inventario / usa_citas al nuevo formato)
UPDATE empresas
SET modulos = CASE
  WHEN plan = 'advance' THEN '{
    "tienda": true, "inventario": true, "pedidos": true, "clientes": true,
    "agenda": true, "servicios": true, "ventas": true, "estadisticas": true, "admins": true
  }'::jsonb
  WHEN plan = 'pro' THEN '{
    "tienda": true, "inventario": true, "pedidos": true, "clientes": true,
    "agenda": true, "servicios": true, "ventas": true, "estadisticas": true, "admins": false
  }'::jsonb
  ELSE '{
    "tienda": true, "inventario": true, "pedidos": true, "clientes": true,
    "agenda": false, "servicios": false, "ventas": false, "estadisticas": false, "admins": false
  }'::jsonb
END
WHERE modulos IS NULL
   OR modulos = '{}'::jsonb;

-- 3. (Opcional) Índice GIN para búsquedas eficientes por módulos
CREATE INDEX IF NOT EXISTS idx_empresas_modulos ON empresas USING GIN (modulos);

-- Verificar resultado
SELECT id, nombre, plan, modulos FROM empresas ORDER BY created_at DESC;
