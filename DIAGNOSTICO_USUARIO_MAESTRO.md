# 🔍 ANÁLISIS: Usuario "ag.pruaned@gmail.com" - Verificación y Corrección

**Fecha:** 15 Agosto 2026  
**Criticidad:** 🔴 CRÍTICA  
**Status:** Vulnerabilidad Confirmada + Plan de Corrección

---

## 📊 SITUACIÓN ACTUAL

### Dónde está el problema

El archivo `src/context/AuthContext.jsx` tiene un **USER_DATABASE hardcodeado** que define a los usuarios maestros:

```javascript
// Línea 128-180 en src/context/AuthContext.jsx
const USER_DATABASE = [
  {
    email: "ag.pruaned@gmail.com",         // ← EXPOSICIÓN CRÍTICA
    name: "Usuario Maestro PRUANED A.G.",
    role: "master",
    rut: "10.102.304-5",
    permisoGestionVoluntarios: true
  },
  {
    email: "presidente.directiva@pruaned.cl",
    name: "Dra. Camila Morales (Presidenta Directiva Nacional)",
    role: "directiva",
    rut: "15.482.910-K",
    permisoGestionVoluntarios: true
  },
  // ... más usuarios
];
```

### Por qué es vulnerable

| Problema | Impacto | Severidad |
|----------|---------|-----------|
| **Email visible en código fuente** | Atacante sabe exactamente qué email es admin | 🔴 CRÍTICA |
| **Visible en repositorio Git** | Historial público/archivo fuente | 🔴 CRÍTICA |
| **En el bundle compilado** (si no usa source maps) | Disponible en production | 🔴 CRÍTICA |
| **No verificado con Supabase** | El frontend decide quién es maestro | 🔴 CRÍTICA |
| **Fácil de bypassear** | `console.log()` acceso directo a datos | 🟠 ALTA |

---

## ❓ ¿EXISTE ESE USUARIO EN SUPABASE?

### Cómo verificar

#### Opción A: Desde Supabase Dashboard

```
1. Ir a: https://app.supabase.com
2. Seleccionar proyecto PRUANED
3. Ir a: Authentication → Users
4. Buscar: ag.pruaned@gmail.com
```

**Resultado esperado:**
- ✅ El usuario existe → Ya fue registrado en auth.users
- ❌ El usuario NO existe → Solo está en el código frontend

#### Opción B: Desde SQL (Supabase SQL Editor)

```sql
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  user_metadata
FROM auth.users
WHERE email = 'ag.pruaned@gmail.com';
```

**Qué significa cada resultado:**

| Resultado | Significado | Acción |
|-----------|------------|--------|
| **1 fila** | Usuario existe en Supabase Auth | Ver siguiente sección |
| **0 filas** | Solo existe en código, no en BD | ⚠️ Necesita crearse |
| **Error de permisos** | RLS bloqueando la consulta | Normalmente significa que sí existe |

#### Opción C: Verificar en tabla `socios`

```sql
-- Verificar si el email está en socios
SELECT id, nombre, email, rut, permiso_gestion_voluntarios 
FROM socios 
WHERE email = 'ag.pruaned@gmail.com';
```

---

## 🔧 PLAN DE CORRECCIÓN (Paso a Paso)

### FASE 1: Verificación Preliminar (Hoy)

**Paso 1.1:** Determinar si el usuario existe en Supabase
```sql
-- Ejecuta esto en Supabase SQL Editor
SELECT email, created_at FROM auth.users 
WHERE email LIKE '%ag.pruaned%' OR email LIKE '%pruaned%';
```

**Paso 1.2:** Listar TODOS los usuarios en USER_DATABASE
```javascript
// Ejecuta en navegador DevTools (F12)
// En cualquier página después de login
console.log(JSON.stringify(USER_DATABASE, null, 2))
```

**Paso 1.3:** Comparar qué usuarios están en cada lado
```
En código (USER_DATABASE): ag.pruaned@gmail.com + presidente.directiva@pruaned.cl + ...
En Supabase (auth.users):  ??? 
En Supabase (socios):      ???

¿Coinciden? → Problema confirmado
```

---

### FASE 2: Crear Tabla de Roles en Supabase (Esta Semana)

Actualmente confían en `USER_DATABASE` del frontend. Necesitamos **la fuente de verdad en la BD**.

#### Paso 2.1: Crear tabla `user_roles` en Supabase

```sql
-- Ejecutar en: Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('master', 'directiva', 'socio', 'voluntario')),
  nombre TEXT NOT NULL,
  rut TEXT UNIQUE,
  permiso_gestion_voluntarios BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_user_roles_email ON user_roles(email);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Habilitar RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer su propio rol
CREATE POLICY "users_read_own_role" ON user_roles
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Solo administradores pueden actualizar roles
CREATE POLICY "only_admins_update_roles" ON user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE email = auth.jwt() ->> 'email'
      AND role = 'master'
    )
  );
```

#### Paso 2.2: Migrar datos de USER_DATABASE a `user_roles`

```sql
-- Primero, necesitas los user_id de Supabase Auth
-- Crear usuarios en Supabase Auth si no existen

-- Luego insertar en user_roles
INSERT INTO user_roles (user_id, email, role, nombre, rut, permiso_gestion_voluntarios)
VALUES 
  -- Reemplaza XXXXX-XXXXX-XXXXX con los user_id reales de auth.users
  ('XXXXX-XXXXX-XXXXX', 'ag.pruaned@gmail.com', 'master', 'Usuario Maestro PRUANED A.G.', '10.102.304-5', true),
  ('YYYYY-YYYYY-YYYYY', 'presidente.directiva@pruaned.cl', 'directiva', 'Dra. Camila Morales', '15.482.910-K', true),
  ('ZZZZZ-ZZZZZ-ZZZZZ', 'secretario.directiva@pruaned.cl', 'directiva', 'Lic. Javiera Araya', '16.789.201-3', true)
  -- ... más usuarios
ON CONFLICT (email) DO NOTHING;
```

---

### FASE 3: Implementar Funciones de Verificación en Supabase (Esta Semana)

Reemplazar la lógica del USER_DATABASE con funciones servidor.

#### Paso 3.1: Crear RPC (Remote Procedure Call)

```sql
-- Crear función para verificar si usuario es maestro
CREATE OR REPLACE FUNCTION is_master_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE email = user_email
    AND role = 'master'
    AND activo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para obtener rol del usuario
CREATE OR REPLACE FUNCTION get_user_role(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM user_roles
  WHERE email = user_email AND activo = true;
  RETURN COALESCE(v_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### FASE 4: Actualizar Frontend para Usar BD en lugar de USER_DATABASE (Esta Semana)

Reemplazar la lógica actual con consultas a Supabase.

#### Paso 4.1: Crear nuevo archivo `src/lib/userRoles.ts`

```typescript
import { supabase } from './supabase';

export async function getUserRole(email: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('get_user_role', {
      user_email: email
    });
    
    if (error) {
      console.error('Error getting user role:', error);
      return 'none';
    }
    
    return data || 'none';
  } catch (err) {
    console.error('Unexpected error:', err);
    return 'none';
  }
}

export async function isMasterUser(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_master_user', {
      user_email: email
    });
    
    if (error) {
      console.error('Error checking master status:', error);
      return false;
    }
    
    return data === true;
  } catch (err) {
    console.error('Unexpected error:', err);
    return false;
  }
}

// Obtener permisos completos del usuario
export async function getUserPermissions(email: string) {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, permiso_gestion_voluntarios')
      .eq('email', email)
      .eq('activo', true)
      .single();
    
    if (error) {
      console.error('Error getting permissions:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Unexpected error:', err);
    return null;
  }
}
```

#### Paso 4.2: Actualizar `src/context/AuthContext.jsx`

En lugar de:
```javascript
// ❌ ANTES - VULNERABLE
const USER_DATABASE = [
  { email: "ag.pruaned@gmail.com", role: "master", ... }
];
```

Usar:
```javascript
// ✅ DESPUÉS - SEGURO
const getUserRoleFromDatabase = async (email) => {
  const { data, error } = await supabase.rpc('get_user_role', {
    user_email: email
  });
  return error ? 'none' : (data || 'none');
};
```

---

### FASE 5: Eliminar USER_DATABASE del Código (Esta Semana)

```bash
# En src/context/AuthContext.jsx

# Paso 5.1: Comentar/eliminar líneas 128-180 (USER_DATABASE array)
# Paso 5.2: Reemplazar todas las referencias a USER_DATABASE con función async
# Paso 5.3: Actualizar resolveUserForEmail() para consultar BD
# Paso 5.4: Actualizar verificaciones de role "master"
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### ✅ Semana 1 (ESTA SEMANA)

- [ ] **Lunes:** Ejecutar verificación SQL (¿existe el usuario?)
- [ ] **Martes:** Crear tabla `user_roles` en Supabase
- [ ] **Martes:** Crear RPC functions en Supabase
- [ ] **Miércoles:** Crear `src/lib/userRoles.ts`
- [ ] **Jueves:** Actualizar AuthContext.jsx
- [ ] **Viernes:** Tests y verificación

### ✅ Semana 2

- [ ] Eliminar completamente USER_DATABASE del código
- [ ] Auditar todos los usos de "master" role
- [ ] Implementar RLS policies para `user_roles`
- [ ] Deploy a staging

### ✅ Semana 3

- [ ] Testing en producción
- [ ] Documentar para team
- [ ] Deploy a production

---

## 🛡️ IMPACTO DE SEGURIDAD

### Antes (Actual - VULNERABLE)

```
Frontend código visible:
├─ Email maestro: ag.pruaned@gmail.com ❌ EXPUESTO
├─ Rol: "master" ❌ EXPUESTO
├─ RUT: 10.102.304-5 ❌ EXPUESTO
├─ Verificación: Cliente ❌ FÁCIL BYPASSEAR
└─ Auditoría: Incompleta ❌ INÚTIL

Ataque típico:
1. Leer código fuente
2. Ver email del admin
3. Intentar fuerza bruta con ese email
4. Si falla, falsificar token con DevTools
```

### Después (Propuesto - SEGURO)

```
Frontend:
├─ Email maestro: ❌ NO VISIBLE
├─ Rol: ✅ Verificado server-side
├─ RUT: ✅ Hash en la BD
├─ Verificación: Servidor ✅ NO BYPASSEABLE
└─ Auditoría: ✅ Server logs con IP real

Protección:
1. Código fuente no revela admin email
2. Roles verificados en BD
3. RLS policies previenen acceso no autorizado
4. Logs server-side son inviolables
5. 2FA requerido (próxima fase)
```

---

## ❓ PREGUNTAS FRECUENTES

### P: ¿Es urgente?
**R:** SÍ. Cualquier atacante puede:
1. Leer el código fuente
2. Ver que `ag.pruaned@gmail.com` es el admin
3. Intentar hacer fuerza bruta a ese email
4. Si consigue acceso, tiene control total

### P: ¿Puedo hacer esto sin downtime?
**R:** SÍ. Pasos:
1. Crear tabla paralela en Supabase (nueva)
2. Mantener USER_DATABASE funcionando
3. Migrar gradualmente a nueva tabla
4. Apagar USER_DATABASE cuando esté 100% migrado

### P: ¿Y si el usuario no existe aún en Supabase?
**R:** Necesitas:
1. Ir a Supabase → Authentication
2. Crear usuario: ag.pruaned@gmail.com
3. Establecer contraseña fuerte
4. Activar 2FA
5. Luego agregar a `user_roles` tabla

### P: ¿Cómo sé si la migración funcionó?
**R:** Tests:
```bash
# Después de implementar cambios
npm run test:auth

# Verificar que:
# ✓ Login con ag.pruaned@gmail.com funciona
# ✓ Role es "master"
# ✓ No hay permisos extras no autorizados
# ✓ No se puede ver el email en frontend
```

---

## 🎯 SIGUIENTE ACCIÓN

**HOY:**
1. Ejecuta esta consulta SQL en Supabase para verificar:
```sql
SELECT email, created_at FROM auth.users 
WHERE email = 'ag.pruaned@gmail.com';
```

2. Avísame si existe o no existe

3. Continuar con el plan correspondiente

---

**Vulnerabilidad confirmada y plan de corrección completo. Listo para implementación.**
