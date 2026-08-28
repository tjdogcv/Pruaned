# 🔐 ANÁLISIS DEL SCHEMA - Usuario Maestro ag.pruaned@gmail.com

**Fecha:** 15 Agosto 2026  
**Status:** Análisis completado del schema real  
**Conclusión:** Vulnerabilidad CONFIRMADA + Solución específica

---

## 📊 PROBLEMA ENCONTRADOa EN EL SCHEMA

### ❌ LO QUE FALTA EN LA BASE DE DATOS

En el schema de Supabase, veo:

```sql
-- En tabla SOCIOS (línea con auth_id)
auth_id uuid,
CONSTRAINT socios_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id)
```

**Pero NO hay:**
- ❌ Campo `role` en la tabla `socios`
- ❌ Campo `role` en la tabla `voluntarios`
- ❌ Tabla `user_roles` separada
- ❌ Información de permisos en Supabase

**Donde ESTÁ el role:**
- ✅ Solo en el código frontend → `src/context/AuthContext.jsx` (USER_DATABASE)

### 🔴 IMPACTO DE SEGURIDAD

```
Frontend (CÓDIGO VISIBLE):
└─ USER_DATABASE
   ├─ email: "ag.pruaned@gmail.com" ❌ EXPUESTO
   ├─ role: "master" ❌ EXPUESTO
   └─ permisoGestionVoluntarios: true ❌ EXPUESTO

Supabase (BASE DE DATOS):
└─ Tabla socios (solo tiene datos de registro)
   ├─ nombre, email, rut ✅
   ├─ role: ❌ NO EXISTE
   └─ permisos: ❌ NO EXISTEN
```

---

## 🎯 SOLUCIÓN ESPECÍFICA BASADA EN EL SCHEMA

### PASO 1: Crear Tabla de Roles en Supabase (HOJA DE RUTA)

Actualmente el schema tiene dos opciones:

#### Opción A: Agregar columna `role` a la tabla existente `socios` (SIMPLE)

```sql
-- Agregar columna a tabla existente
ALTER TABLE socios ADD COLUMN role TEXT DEFAULT 'socio' 
  CHECK (role IN ('master', 'directiva', 'socio'));

-- Índice para búsquedas rápidas
CREATE INDEX idx_socios_role ON socios(role);
```

**Ventajas:**
- ✅ Rápido (una línea)
- ✅ No requiere tabla nueva
- ✅ Compatible con schema existente

**Desventajas:**
- ❌ Mezcla datos de usuarios con datos de roles
- ❌ No es escalable si se necesitan más permisos

#### Opción B: Crear tabla separada `user_roles` (RECOMENDADO)

```sql
-- Tabla dedicada para roles y permisos
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('master', 'directiva', 'socio', 'voluntario')),
  permiso_gestion_voluntarios BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_roles_email ON user_roles(email);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- RLS: Solo propietarios pueden leer su rol
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_role" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Ventajas:**
- ✅ Separación de responsabilidades
- ✅ Escalable para permisos granulares
- ✅ Sigue mejores prácticas

**Desventajas:**
- ⚠️ Requiere sincronización con tabla `socios`

---

## 🔄 PLAN DE MIGRACIÓN ESPECÍFICO

### FASE A: Verificar qué usuarios existen

```sql
-- ¿Existe ag.pruaned@gmail.com en auth.users?
SELECT COUNT(*) as usuarios_encontrados
FROM auth.users
WHERE email = 'ag.pruaned@gmail.com';

-- Resultado esperado:
-- usuarios_encontrados = 1 → Usuario YA EXISTE
-- usuarios_encontrados = 0 → Usuario NO EXISTE (solo en código)
```

### FASE B: Si el usuario EXISTE en auth.users

```sql
-- 1. Obtener su ID
SELECT id, email, created_at
FROM auth.users
WHERE email = 'ag.pruaned@gmail.com';

-- Resultado esperado (copiar el ID):
-- id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
-- email: 'ag.pruaned@gmail.com'
-- created_at: '2026-08-15 ...'

-- 2. Actualizar la tabla socios con auth_id (si existe registro)
UPDATE socios
SET auth_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'  -- ← Reemplazar con ID real
WHERE email = 'ag.pruaned@gmail.com';

-- 3. Crear tabla user_roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('master', 'directiva', 'socio', 'voluntario')),
  permiso_gestion_voluntarios BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Migrar datos del USER_DATABASE a user_roles
INSERT INTO user_roles (user_id, email, role, permiso_gestion_voluntarios)
VALUES 
  ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'ag.pruaned@gmail.com', 'master', true),
  ('yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy', 'presidente.directiva@pruaned.cl', 'directiva', true),
  ('zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz', 'secretario.directiva@pruaned.cl', 'directiva', true);
  -- ... más usuarios según USER_DATABASE

-- 5. Verificar que la migración funcionó
SELECT * FROM user_roles ORDER BY role;
```

### FASE C: Si el usuario NO EXISTE en auth.users

```sql
-- ⚠️ PROBLEMA: El usuario solo existe en código frontend

-- OPCIÓN 1: Crear el usuario en Supabase Auth (manual)
-- Ir a: https://app.supabase.com → Authentication → Add User
-- Email: ag.pruaned@gmail.com
-- Password: Generar temporalmente
-- Enviar link de confirmación

-- OPCIÓN 2: Crear via SQL (requiere permisos especiales)
-- (Supabase no permite crear usuarios vía SQL por seguridad)

-- ✅ Una vez creado, seguir FASE B
```

---

## 🔧 SCRIPTS LISTOS PARA EJECUTAR

### Script 1: Diagnosticar el estado actual

```sql
-- Ejecutar en: Supabase → SQL Editor

-- ¿Existe el usuario?
SELECT 'PASO 1: ¿Existe en auth.users?' as diagnostico,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'ag.pruaned@gmail.com') as encontrados;

-- ¿Tiene auth_id en socios?
SELECT 'PASO 2: ¿Tiene auth_id en socios?' as diagnostico,
  id, email, auth_id FROM socios 
  WHERE email = 'ag.pruaned@gmail.com';

-- ¿Existe tabla user_roles?
SELECT 'PASO 3: ¿Existe tabla user_roles?' as diagnostico,
  EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) as tabla_existe;

-- ¿Cuántos usuarios con "master" o "directiva" en el código?
SELECT 'PASO 4: Usuarios administrativos en USER_DATABASE (código)' as diagnostico,
  'Se pueden obtener solo inspeccionando src/context/AuthContext.jsx' as info;
```

### Script 2: Crear tabla user_roles

```sql
-- Ejecutar después de diagnosticar

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('master', 'directiva', 'socio', 'voluntario')),
  permiso_gestion_voluntarios BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_roles_email ON user_roles(email);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_active ON user_roles(activo) WHERE activo = true;

-- RLS: Solo usuarios autenticados pueden ver si existen roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Política 1: Cualquier usuario puede leer su propio rol
CREATE POLICY "users_can_read_own_role" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política 2: Solo master pueden actualizar roles
CREATE POLICY "only_master_can_update_roles" ON user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role = 'master'
      AND activo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role = 'master'
      AND activo = true
    )
  );

-- Resultado esperado:
-- "Table user_roles created successfully"
```

### Script 3: Migrar usuarios desde USER_DATABASE

```sql
-- IMPORTANTE: Reemplazar los UUIDs reales de auth.users

-- Primero, obtener los UUIDs reales:
SELECT id, email FROM auth.users 
WHERE email IN (
  'ag.pruaned@gmail.com',
  'presidente.directiva@pruaned.cl',
  'secretario.directiva@pruaned.cl',
  'camila.morales@pruaned.cl',
  'roberto.silva@pruaned.cl',
  'felipe.henriquez@gmail.com',
  'conny.ugarte@gmail.com'
);

-- Luego, migrar los datos (REEMPLAZAR IDs):
INSERT INTO user_roles (user_id, email, role, permiso_gestion_voluntarios, activo)
VALUES 
  -- Reemplazar 'XXXXXX...' con los UUIDs reales obtenidos arriba
  ('XXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX', 'ag.pruaned@gmail.com', 'master', true, true),
  ('YYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY', 'presidente.directiva@pruaned.cl', 'directiva', true, true),
  ('ZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ', 'secretario.directiva@pruaned.cl', 'directiva', true, true),
  ('AAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'camila.morales@pruaned.cl', 'directiva', true, true),
  ('BBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB', 'roberto.silva@pruaned.cl', 'socio', false, true),
  ('CCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC', 'felipe.henriquez@gmail.com', 'voluntario', false, true),
  ('DDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'conny.ugarte@gmail.com', 'voluntario', false, true)
ON CONFLICT (email) DO NOTHING;

-- Verificar migración
SELECT role, COUNT(*) as cantidad FROM user_roles GROUP BY role;
```

---

## 📋 CHECKLIST EXACTO

Basado en el schema real de Supabase:

### ✅ Semana 1 - HOJA DE RUTA

**Lunes:**
- [ ] Ejecutar Script 1 (Diagnosticar) en Supabase SQL Editor
- [ ] Anotar resultados:
  - ¿Usuarios en auth.users? SI / NO
  - ¿Tabla user_roles existe? SI / NO
  - ¿Cuántos usuarios en socios con auth_id? _____

**Martes:**
- [ ] Crear tabla user_roles ejecutando Script 2
- [ ] Verificar: `SELECT * FROM user_roles;` (debería estar vacía)

**Miércoles:**
- [ ] Obtener UUIDs reales de auth.users
- [ ] Ejecutar Script 3 (Migración) con UUIDs reales
- [ ] Verificar migración: `SELECT * FROM user_roles;`

**Jueves:**
- [ ] Crear RPC function para verificar roles (ver siguiente sección)
- [ ] Crear `src/lib/userRoles.ts` en frontend
- [ ] Tests iniciales

**Viernes:**
- [ ] Actualizar AuthContext.jsx para usar BD en lugar de USER_DATABASE
- [ ] npm run build
- [ ] npm run test:auth

---

## 🛡️ RPC FUNCTIONS (Server-Side Verification)

Después de migrar a `user_roles`, crear estas funciones:

```sql
-- Función 1: Obtener rol del usuario
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM user_roles
  WHERE user_id = p_user_id AND activo = true;
  RETURN COALESCE(v_role, 'none');
END;
$$ LANGUAGE plpgsql STABLE;

-- Función 2: Verificar si es master
CREATE OR REPLACE FUNCTION is_master(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id 
    AND role = 'master' 
    AND activo = true
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Función 3: Obtener permisos completos
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
$$ LANGUAGE plpgsql STABLE;
```

---

## 🔐 Cambio en Frontend (src/context/AuthContext.jsx)

### ANTES (Vulnerable):

```javascript
// ❌ CÓDIGO ACTUAL - USER_DATABASE VISIBLE
const USER_DATABASE = [
  {
    email: "ag.pruaned@gmail.com",
    name: "Usuario Maestro PRUANED A.G.",
    role: "master",
    rut: "10.102.304-5",
    permisoGestionVoluntarios: true
  },
  // ... más usuarios
];
```

### DESPUÉS (Seguro):

```typescript
// ✅ NUEVO CÓDIGO - Consultar BD
async function getUserRole(userId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_user_role', {
    p_user_id: userId
  });
  return error ? 'none' : (data || 'none');
}

async function isMasterUser(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_master', {
    p_user_id: userId
  });
  return error ? false : (data === true);
}

// Usar en contexto:
const currentUserRole = await getUserRole(user.id); // Desde BD, no código
```

---

## 📊 RESUMEN DE CAMBIOS

| Elemento | Antes | Después |
|----------|-------|---------|
| **Dónde está el rol** | Código frontend | Base de datos |
| **Visible en** | Código fuente, DevTools | Solo si acceso a BD |
| **Verificación** | Cliente (bypasseable) | Servidor (seguro) |
| **Escalabilidad** | Limitada | Granular |
| **Sincronización** | Manual | Automática |
| **Auditoría** | Incompleta | Completa |

---

## ❓ PRÓXIMOS PASOS EXACTOS

**HOY:**

1. Copia el **Script 1** (Diagnosticar)
2. Pégalo en: Supabase Dashboard → SQL Editor → New Query
3. Ejecuta (Cmd/Ctrl + Enter)
4. **Comparte los resultados conmigo**

**Basado en los resultados, continuamos con:**
- Si usuario existe: Ejecutar Scripts 2 y 3
- Si usuario NO existe: Crear primero en Supabase Auth

---

**Vulnerabilidad confirmada en el schema. Listo para remediar.**
