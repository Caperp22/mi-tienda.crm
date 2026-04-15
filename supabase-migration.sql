-- ============================================================
-- MIGRACIÓN COMPLETA: Sistema de Módulos, Licencias y Upgrades
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- ── 1. Columnas nuevas en la tabla empresas ─────────────────
-- Ejecutar una sola vez en Supabase (PostgreSQL). Si la columna ya existe, omitir esa línea.
ALTER TABLE empresas ADD COLUMN modulos     JSONB;
ALTER TABLE empresas ADD COLUMN email_admin TEXT;
ALTER TABLE empresas ADD COLUMN licencia    TEXT;

-- ── 2. Módulos por defecto según plan para registros existentes
UPDATE empresas SET modulos = CASE
  WHEN plan = 'advance' THEN '{"tienda":true,"inventario":true,"pedidos":true,"domicilios":true,"cupones":true,"pos":true,"clientes":true,"agenda":true,"servicios":true,"empleados":true,"fidelizacion":true,"admins":true,"ventas":true,"estadisticas":true,"reportes":true}'::jsonb
  WHEN plan = 'pro'     THEN '{"tienda":true,"inventario":true,"pedidos":true,"domicilios":true,"cupones":true,"pos":false,"clientes":true,"agenda":true,"servicios":true,"empleados":false,"fidelizacion":false,"admins":true,"ventas":true,"estadisticas":true,"reportes":false}'::jsonb
  ELSE                       '{"tienda":true,"inventario":true,"pedidos":true,"domicilios":false,"cupones":false,"pos":false,"clientes":true,"agenda":false,"servicios":false,"empleados":false,"fidelizacion":false,"admins":false,"ventas":false,"estadisticas":false,"reportes":false}'::jsonb
END
WHERE modulos IS NULL OR modulos = '{}'::jsonb;

-- ── 3. Tabla de solicitudes de upgrade de plan ───────────────
CREATE TABLE IF NOT EXISTS solicitudes_upgrade (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  plan_actual     TEXT NOT NULL,
  plan_solicitado TEXT NOT NULL,
  estado          TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Índices ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_empresas_modulos   ON empresas USING GIN (modulos);
CREATE INDEX IF NOT EXISTS idx_upgrades_empresa   ON solicitudes_upgrade (empresa_id);
CREATE INDEX IF NOT EXISTS idx_upgrades_estado    ON solicitudes_upgrade (estado);

-- ── 5. RLS para solicitudes_upgrade ──────────────────────────
ALTER TABLE solicitudes_upgrade ENABLE ROW LEVEL SECURITY;

-- Admins pueden insertar solicitudes para su propia empresa
CREATE POLICY "admins_insert_upgrade" ON solicitudes_upgrade
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM administradores WHERE email = auth.jwt()->>'email'
    )
  );

-- Admins pueden ver sus propias solicitudes
CREATE POLICY "admins_select_upgrade" ON solicitudes_upgrade
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM administradores WHERE email = auth.jwt()->>'email'
    )
  );

-- Superadmin puede ver y actualizar todo (ajusta el email de superadmin)
-- IMPORTANTE: reemplaza 'tu-email@superadmin.com' con tu email real
CREATE POLICY "superadmin_all_upgrades" ON solicitudes_upgrade
  FOR ALL USING (
    auth.jwt()->>'email' IN (
      SELECT email FROM administradores WHERE rol = 'superadmin'
    )
  );

-- ── 6. Verificar resultado ───────────────────────────────────
SELECT id, nombre, plan, email_admin, licencia,
       jsonb_object_keys(modulos) AS modulo_activo
FROM empresas
WHERE modulos IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
