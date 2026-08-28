-- ==============================================================
-- VERIFICACIÓN USUARIO MAESTRO - ag.pruaned@gmail.com
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ==============================================================

-- PASO 1: Verificar si el usuario existe en auth.users (Supabase Auth)
-- ================================================================

SELECT 
  'VERIFICACIÓN: ¿Usuario existe en Supabase Auth?' as paso,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'ag.pruaned@gmail.com') as cantidad_usuarios;

-- Si cantidad_usuarios = 1 → Usuario EXISTE
-- Si cantidad_usuarios = 0 → Usuario NO EXISTE (solo en código frontend)

-- PASO 2: Si existe, obtener detalles del usuario
-- ================================================================

SELECT 
  'USUARIO EN AUTH.USERS' as seccion,
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at,
  is_super_admin
FROM auth.users
WHERE email = 'ag.pruaned@gmail.com';

-- PASO 3: Verificar si está en la tabla socios
-- ================================================================

SELECT 
  'BÚSQUEDA EN TABLA SOCIOS' as seccion,
  id,
  nombre,
  email,
  rut,
  role as categoria,
  permiso_gestion_voluntarios,
  created_at
FROM socios
WHERE email = 'ag.pruaned@gmail.com'
   OR email LIKE '%ag.pruaned%'
   OR email LIKE '%pruaned%'
LIMIT 10;

-- PASO 4: Verificar si hay tabla de user_roles (si fue creada)
-- ================================================================

SELECT 
  'VERIFICACIÓN: ¿Existe tabla user_roles?' as paso,
  EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
  ) as tabla_existe;

-- Si tabla_existe = true → Ya existe table user_roles
-- Si tabla_existe = false → Necesita crearse

-- PASO 5: Si existe user_roles, obtener datos del usuario
-- ================================================================

-- Descomenta esto si la tabla existe:
/*
SELECT 
  'USUARIO EN USER_ROLES' as seccion,
  id,
  user_id,
  email,
  role,
  nombre,
  rut,
  permiso_gestion_voluntarios,
  activo,
  created_at
FROM user_roles
WHERE email = 'ag.pruaned@gmail.com';
*/

-- PASO 6: Listar TODOS los usuarios maestros/admin potenciales
-- ================================================================

SELECT 
  'TODOS LOS USUARIOS CON ROL ADMINISTRATIVO EN SOCIOS' as seccion,
  COUNT(*) as total_admin_usuarios
FROM socios
WHERE role IN ('master', 'directiva', 'admin')
   OR categoria IN ('master', 'directiva', 'admin');

-- Detalles
SELECT 
  'USUARIOS ADMIN POTENCIALES' as seccion,
  nombre,
  email,
  rut,
  role as categoria
FROM socios
WHERE role IN ('master', 'directiva', 'admin')
   OR categoria IN ('master', 'directiva', 'admin')
LIMIT 20;

-- PASO 7: Comparación - ¿Qué está en el código vs BD?
-- ================================================================

-- Los usuarios en USER_DATABASE (frontend) deberían estar aquí:
SELECT 
  'EMAILS QUE DEBERÍAN ESTAR EN SUPABASE (según USER_DATABASE)' as seccion,
  email
FROM (VALUES 
  ('ag.pruaned@gmail.com'),
  ('presidente.directiva@pruaned.cl'),
  ('secretario.directiva@pruaned.cl'),
  ('camila.morales@pruaned.cl'),
  ('roberto.silva@pruaned.cl'),
  ('felipe.henriquez@gmail.com'),
  ('conny.ugarte@gmail.com')
) AS expected(email)
WHERE email NOT IN (
  SELECT DISTINCT email FROM auth.users
  UNION ALL
  SELECT DISTINCT email FROM socios WHERE email IS NOT NULL
)
ORDER BY email;

-- PASO 8: Auditoría - ¿Hay intentos de login fallidos?
-- ================================================================

SELECT 
  'EVENTOS DE SEGURIDAD RELACIONADOS' as seccion,
  COUNT(*) as total_eventos,
  MAX(fecha) as ultimo_evento
FROM auditoria
WHERE evento LIKE '%ag.pruaned%'
   OR usuario LIKE '%ag.pruaned%'
   OR evento LIKE '%login%'
   OR evento LIKE '%auth%'
   OR evento LIKE '%master%';

-- Detalles de eventos
SELECT 
  fecha,
  usuario,
  evento,
  label,
  severidad,
  ip,
  metadata
FROM auditoria
WHERE evento LIKE '%ag.pruaned%'
   OR usuario LIKE '%ag.pruaned%'
   OR evento LIKE '%master%'
ORDER BY fecha DESC
LIMIT 50;

-- ==============================================================
-- RESUMEN PARA EL USUARIO
-- ==============================================================

/*
INTERPRETACIÓN DE RESULTADOS:

1. Si CANTIDAD_USUARIOS = 1:
   ✅ Usuario EXISTE en Supabase Auth
   → Pasar a PASO 2 para obtener detalles
   
2. Si CANTIDAD_USUARIOS = 0:
   ⚠️  Usuario NO EXISTE en Supabase Auth
   → Solo está en código frontend (VULNERABLE)
   → Necesita crearse antes de continuar
   
3. Verificar SOCIOS:
   ✅ Si existe → Está registrado como socio
   ❌ Si no existe → Nunca se registró
   
4. Verificar TABLA_EXISTE user_roles:
   ✅ Si existe → Fase 2 ya fue completada
   ❌ Si no existe → Necesita crearse
   
5. EMAILS EN USER_DATABASE:
   ✅ Si todos están en auth.users → Migracion posible
   ❌ Si faltan algunos → Crear primero en Supabase
   
6. INTENTOS DE LOGIN FALLIDOS:
   ⚠️  Si hay muchos → Posible ataque de fuerza bruta
   ✅ Si no hay → Sistema está seguro hasta ahora

SIGUIENTE PASO:
→ Compartir resultados con el equipo técnico
→ Seguir plan de DIAGNOSTICO_USUARIO_MAESTRO.md
*/
