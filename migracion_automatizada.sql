-- ========================================================================
-- SCRIPT DE MIGRACIÓN AUTOMATIZADO - Usuario ag.pruaned@gmail.com
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ========================================================================

-- ✅ PASO 1: DIAGNOSTICAR ESTADO ACTUAL
-- ========================================================================

-- ¿Existe el usuario en auth.users?
SELECT 
  'DIAGNÓSTICO: ¿Existe en auth.users?' as paso,
  COUNT(*) as cantidad,
  CASE WHEN COUNT(*) = 0 THEN '❌ NO EXISTE - Crear en Supabase Auth'
       WHEN COUNT(*) = 1 THEN '✅ EXISTE - Continuar con migración'
       ELSE '⚠️ MÚLTIPLES - Revisar duplicados' END as acción
FROM auth.users 
WHERE email = 'ag.pruaned@gmail.com';

-- ¿Está en tabla socios?
SELECT 
  'DIAGNÓSTICO: ¿Está en socios?' as paso,
  COUNT(*) as cantidad,
  STRING_AGG(id::text, ', ') as socio_id
FROM socios 
WHERE email = 'ag.pruaned@gmail.com';

-- ¿Existe tabla user_roles?
SELECT 
  'DIAGNÓSTICO: ¿Existe tabla user_roles?' as paso,
  CASE WHEN EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN '✅ EXISTE'
  ELSE '❌ NO EXISTE - Crear ahora' END as status;

-- ========================================================================
-- ✅ PASO 2: CREAR TABLA user_roles (SI NO EXISTE)
-- ========================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('master', 'directiva', 'socio', 'voluntario')),
  permiso_gestion_voluntarios BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(activo) WHERE activo = true;

-- Habilitar RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ========================================================================
-- ✅ PASO 3: MIGRAR USUARIO ag.pruaned@gmail.com AUTOMÁTICAMENTE
-- ========================================================================

-- Migración automática: Obtener user_id de auth.users y crear registro
WITH user_auth AS (
  SELECT id, email FROM auth.users 
  WHERE email = 'ag.pruaned@gmail.com'
),
inserted_role AS (
  INSERT INTO user_roles (user_id, email, role, permiso_gestion_voluntarios, activo)
  SELECT 
    ua.id,
    ua.email,
    'master'::text,
    true,
    true
  FROM user_auth ua
  ON CONFLICT (email) DO UPDATE SET 
    role = 'master',
    permiso_gestion_voluntarios = true,
    activo = true,
    updated_at = NOW()
  RETURNING id, user_id, email, role
)
SELECT 
  'MIGRACIÓN COMPLETADA' as resultado,
  COUNT(*) as registros_procesados,
  MAX(email) as usuario
FROM inserted_role;

-- ========================================================================
-- ✅ PASO 4: MIGRAR TODOS LOS USUARIOS DEL USER_DATABASE
-- ========================================================================

-- Migrar usuarios directiva
WITH directiva_users AS (
  SELECT id, email FROM auth.users 
  WHERE email IN (
    'presidente.directiva@pruaned.cl',
    'secretario.directiva@pruaned.cl',
    'camila.morales@pruaned.cl'
  )
)
INSERT INTO user_roles (user_id, email, role, permiso_gestion_voluntarios, activo)
SELECT 
  du.id,
  du.email,
  'directiva'::text,
  true,
  true
FROM directiva_users du
ON CONFLICT (email) DO UPDATE SET 
  role = 'directiva',
  permiso_gestion_voluntarios = true,
  updated_at = NOW();

-- Migrar usuarios socios
WITH socio_users AS (
  SELECT id, email FROM auth.users 
  WHERE email = 'roberto.silva@pruaned.cl'
)
INSERT INTO user_roles (user_id, email, role, permiso_gestion_voluntarios, activo)
SELECT 
  su.id,
  su.email,
  'socio'::text,
  false,
  true
FROM socio_users su
ON CONFLICT (email) DO UPDATE SET 
  role = 'socio',
  permiso_gestion_voluntarios = false,
  updated_at = NOW();

-- Migrar usuarios voluntarios
WITH volunteer_users AS (
  SELECT id, email FROM auth.users 
  WHERE email IN (
    'felipe.henriquez@gmail.com',
    'conny.ugarte@gmail.com'
  )
)
INSERT INTO user_roles (user_id, email, role, permiso_gestion_voluntarios, activo)
SELECT 
  vu.id,
  vu.email,
  'voluntario'::text,
  false,
  true
FROM volunteer_users vu
ON CONFLICT (email) DO UPDATE SET 
  role = 'voluntario',
  permiso_gestion_voluntarios = false,
  updated_at = NOW();

-- ========================================================================
-- ✅ PASO 5: CREAR RLS POLICIES SEGURAS
-- ========================================================================

-- Política 1: Usuarios pueden leer su propio rol
DROP POLICY IF EXISTS "users_read_own_role" ON user_roles;
CREATE POLICY "users_read_own_role" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política 2: Solo master pueden actualizar roles
DROP POLICY IF EXISTS "only_master_can_update" ON user_roles;
CREATE POLICY "only_master_can_update" ON user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'master'
      AND ur.activo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'master'
      AND ur.activo = true
    )
  );

-- Política 3: No pueden eliminar propios roles (protección)
DROP POLICY IF EXISTS "prevent_self_deletion" ON user_roles;
CREATE POLICY "prevent_self_deletion" ON user_roles
  FOR DELETE
  USING (auth.uid() != user_id AND 
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'master'
      AND ur.activo = true
    )
  );

-- ========================================================================
-- ✅ PASO 6: CREAR RPC FUNCTIONS (Server-Side Verification)
-- ========================================================================

-- Función: Obtener rol del usuario
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM user_roles
  WHERE user_id = p_user_id AND activo = true;
  RETURN COALESCE(v_role, 'none');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Función: Verificar si es master (para admin actions)
CREATE OR REPLACE FUNCTION is_master_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id 
    AND role = 'master' 
    AND activo = true
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Función: Obtener permisos completos
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE(role TEXT, permiso_gestion_voluntarios BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    user_roles.role,
    user_roles.permiso_gestion_voluntarios
  FROM user_roles
  WHERE user_id = p_user_id AND activo = true;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Funciones de autorización server-side para evitar confiar en el navegador
CREATE OR REPLACE FUNCTION pruaned_current_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = auth.uid() AND activo = true;
  RETURN COALESCE(v_role, 'none');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION pruaned_is_master_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'master'
      AND activo = true
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION pruaned_is_directiva()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('master', 'directiva')
      AND activo = true
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION pruaned_can_manage_categories()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN pruaned_is_directiva() OR pruaned_is_master_user();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION pruaned_can_manage_voluntarios()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN pruaned_is_directiva() OR pruaned_is_master_user() OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.permiso_gestion_voluntarios = true
      AND ur.activo = true
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION pruaned_can_manage_finances()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN pruaned_is_directiva() OR pruaned_is_master_user();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION pruaned_can_publish_cms()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN pruaned_is_directiva() OR pruaned_is_master_user();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

REVOKE ALL ON FUNCTION pruaned_current_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION pruaned_is_master_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION pruaned_is_directiva() FROM PUBLIC;
REVOKE ALL ON FUNCTION pruaned_can_manage_categories() FROM PUBLIC;
REVOKE ALL ON FUNCTION pruaned_can_manage_voluntarios() FROM PUBLIC;
REVOKE ALL ON FUNCTION pruaned_can_manage_finances() FROM PUBLIC;
REVOKE ALL ON FUNCTION pruaned_can_publish_cms() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pruaned_current_role() TO authenticated;
GRANT EXECUTE ON FUNCTION pruaned_is_master_user() TO authenticated;
GRANT EXECUTE ON FUNCTION pruaned_is_directiva() TO authenticated;
GRANT EXECUTE ON FUNCTION pruaned_can_manage_categories() TO authenticated;
GRANT EXECUTE ON FUNCTION pruaned_can_manage_voluntarios() TO authenticated;
GRANT EXECUTE ON FUNCTION pruaned_can_manage_finances() TO authenticated;
GRANT EXECUTE ON FUNCTION pruaned_can_publish_cms() TO authenticated;

-- Función: manejo seguro de bloqueo por intentos fallidos en backend
CREATE OR REPLACE FUNCTION pruaned_login_lockout(
  p_email TEXT,
  p_ip TEXT DEFAULT NULL
)
RETURNS TABLE(
  blocked BOOLEAN,
  attempts INTEGER,
  retry_after_seconds INTEGER,
  last_attempt TIMESTAMPTZ
) AS $$
DECLARE
  v_key TEXT := lower(trim(p_email));
  v_row RECORD;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  CREATE TABLE IF NOT EXISTS public.auth_login_attempts (
    email TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_attempt TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (email)
  );

  INSERT INTO public.auth_login_attempts(email, attempts, locked_until, last_attempt)
  VALUES (v_key, 1, NULL, v_now)
  ON CONFLICT (email)
  DO NOTHING;

  SELECT * INTO v_row
  FROM public.auth_login_attempts
  WHERE email = v_key;

  IF v_row.locked_until IS NOT NULL AND v_row.locked_until > v_now THEN
    RETURN QUERY SELECT TRUE, v_row.attempts, EXTRACT(EPOCH FROM (v_row.locked_until - v_now))::INTEGER, v_row.last_attempt;
    RETURN;
  END IF;

  UPDATE public.auth_login_attempts
  SET attempts = attempts + 1,
      last_attempt = v_now,
      locked_until = CASE
        WHEN attempts + 1 >= 5 THEN v_now + INTERVAL '5 minutes'
        ELSE NULL
      END
  WHERE email = v_key;

  SELECT * INTO v_row
  FROM public.auth_login_attempts
  WHERE email = v_key;

  IF v_row.locked_until IS NOT NULL AND v_row.locked_until > v_now THEN
    RETURN QUERY SELECT TRUE, v_row.attempts, EXTRACT(EPOCH FROM (v_row.locked_until - v_now))::INTEGER, v_row.last_attempt;
    RETURN;
  END IF;

  RETURN QUERY SELECT FALSE, v_row.attempts, 0, v_row.last_attempt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: registrar eventos de login con metadata del backend
CREATE OR REPLACE FUNCTION pruaned_record_login_event(
  p_email TEXT,
  p_event TEXT,
  p_ip TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.auditoria_logs (fecha, accion, usuario, severidad, ip)
  VALUES (
    NOW(),
    'AUTH_' || upper(p_event),
    lower(trim(p_email)),
    CASE WHEN p_event = 'success' THEN 'INFO' WHEN p_event = 'failed' THEN 'WARN' ELSE 'INFO' END,
    COALESCE(p_ip, 'backend-detected')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- ✅ PASO 7: VERIFICACIÓN FINAL
-- ========================================================================

-- Verificar que la migración fue exitosa
SELECT 
  'RESULTADO FINAL' as estado,
  role,
  COUNT(*) as cantidad,
  COUNT(CASE WHEN activo = true THEN 1 END) as activos
FROM user_roles
GROUP BY role
ORDER BY role;

-- Verificar usuario maestro específicamente
SELECT 
  'USUARIO MAESTRO' as tipo,
  user_id,
  email,
  role,
  permiso_gestion_voluntarios,
  activo,
  created_at
FROM user_roles
WHERE email = 'ag.pruaned@gmail.com';

-- Verificar quién puede hacer cambios admin
SELECT 
  'USUARIOS CON PERMISOS ADMIN' as tipo,
  email,
  role,
  permiso_gestion_voluntarios
FROM user_roles
WHERE role IN ('master', 'directiva')
AND activo = true
ORDER BY role, email;

-- ========================================================================
-- ✅ PASO 8: SINCRONIZAR CON TABLA SOCIOS (OPCIONAL)
-- ========================================================================

-- Si quieres que la tabla socios tenga el auth_id sincronizado
UPDATE socios s
SET auth_id = ur.user_id
FROM user_roles ur
WHERE s.email = ur.email
AND s.auth_id IS NULL
AND ur.activo = true;

-- Verificar sincronización
SELECT 
  'SINCRONIZACIÓN SOCIOS' as tipo,
  COUNT(*) as socios_con_auth_id,
  COUNT(CASE WHEN auth_id IS NULL THEN 1 END) as socios_sin_auth_id
FROM socios;

-- ========================================================================
-- 📋 RESUMEN EJECUTIVO
-- ========================================================================

/*
CAMBIOS REALIZADOS:

✅ Tabla user_roles creada con:
   - UUID único por usuario
   - Email único
   - Role: master, directiva, socio, voluntario
   - Permisos granulares

✅ Usuario ag.pruaned@gmail.com migrado como:
   - role: 'master'
   - permiso_gestion_voluntarios: true
   - activo: true

✅ RLS Policies implementadas:
   - Lectura: Solo pueden ver su propio rol
   - Escritura: Solo master puede cambiar roles
   - Protección: No pueden auto-eliminarse

✅ RPC Functions creadas:
   - get_user_role(user_id) → Obtener rol
   - is_master_user(user_id) → Verificar si es master
   - get_user_permissions(user_id) → Permisos completos

✅ Tabla socios sincronizada:
   - auth_id actualizado automáticamente

PRÓXIMO PASO:
1. Actualizar src/context/AuthContext.jsx para usar RPC functions
2. Eliminar USER_DATABASE del código
3. Ejecutar tests
4. Deploy a staging
*/
