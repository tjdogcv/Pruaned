# 🔧 GUÍA DE REMEDIACIÓN TÉCNICA - PRUANED A.G.

**Documentación de correcciones técnicas específicas para vulnerabilidades críticas**

---

## Tabla de Contenidos

1. [Remover Credenciales Hardcodeadas](#1-remover-credenciales-hardcodeadas)
2. [Implementar Verificación de Permisos](#2-implementar-verificación-de-permisos)
3. [Migrar Sessions a Cookies HttpOnly](#3-migrar-sessions-a-cookies-httponly)
4. [Logging Server-Side](#4-logging-server-side)
5. [2FA Validado Server-Side](#5-2fa-validado-server-side)
6. [Role-Based Access Control (RBAC)](#6-role-based-access-control-rbac)

---

## 1. Remover Credenciales Hardcodeadas

### Problema Actual

```javascript
// ❌ INSEGURO: src/context/AuthContext.jsx
const USER_DATABASE = [
  {
    email: "ag.pruaned@gmail.com",
    role: "master",
    rut: "10.102.304-5",
    permisoGestionVoluntarios: true
  },
  {
    email: "presidente.directiva@pruaned.cl",
    role: "directiva",
    rut: "15.482.910-K",
  },
  // ... más usuarios hardcodeados
];
```

### Solución: Usar Supabase Auth con Custom Claims

**Paso 1: Configurar Supabase Auth**

```sql
-- Crear tabla de roles personalizados
create table if not exists public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('master', 'directiva', 'socio', 'voluntario')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Crear tabla de permisos
create table if not exists public.user_permissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  permission text not null,
  created_at timestamptz default now(),
  unique(user_id, permission)
);

-- Crear función para obtener rol desde JWT
create or replace function public.get_user_role()
returns text as $$
  select role
  from public.user_roles
  where user_id = auth.uid()
  limit 1;
$$ language sql stable;

-- Crear trigger para actualizar custom claims
create or replace function public.update_user_claims()
returns trigger as $$
begin
  -- Supabase actualizará automáticamente el JWT con custom claims
  -- si configuras la extensión de usuario
  return new;
end;
$$ language plpgsql;

create trigger on_user_role_change
after insert or update on public.user_roles
for each row
execute function public.update_user_claims();
```

**Paso 2: Actualizar AuthContext.jsx**

```javascript
// ✅ SEGURO: src/context/AuthContext.jsx

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    if (!isSupabaseReady()) return;
    
    // Obtener usuario del JWT de Supabase
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // El rol viene del JWT custom claim
        const userRole = session.user.user_metadata?.role || 'socio';
        
        // Obtener datos adicionales de la tabla socios/voluntarios
        const { data } = await supabase
          .from('socios')
          .select('id, email, nombre, rut, permisoGestionVoluntarios')
          .eq('email', session.user.email)
          .single();
        
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: data?.nombre || session.user.email,
          role: userRole,
          rut: data?.rut,
          permisoGestionVoluntarios: data?.permisoGestionVoluntarios || false
        });
      }
    });
  }, []);
  
  return (
    <AuthContext.Provider value={{ currentUser, ... }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Paso 3: Remover USER_DATABASE**

Eliminar completamente la constante `USER_DATABASE` del código. No guardar datos de usuario sensibles en el frontend.

---

## 2. Implementar Verificación de Permisos

### Problema Actual

```javascript
// ❌ INSEGURO
const addNews = async (newsItem) => {
  // Sin verificación de permisos
  setNewsList(prev => [itemWithId, ...prev]);
  await supabase.from('noticias').insert([...]);
};
```

### Solución Segura

**Crear funciones helper de permisos:**

```javascript
// ✅ src/lib/permissions.ts
import { supabase } from './supabase';

export const permissions = {
  CAN_PUBLISH_NEWS: 'can_publish_news',
  CAN_MANAGE_DOCUMENTS: 'can_manage_documents',
  CAN_MANAGE_USERS: 'can_manage_users',
  CAN_EDIT_LMS: 'can_edit_lms',
};

/**
 * Verificar permiso del usuario actual
 */
export async function checkPermission(permission: string): Promise<boolean> {
  if (!permission) return false;
  
  try {
    const { data, error } = await supabase.rpc('check_user_permission', {
      p_permission: permission
    });
    
    if (error) {
      console.error('Permission check error:', error);
      return false;
    }
    
    return data === true;
  } catch (err) {
    console.error('Permission check exception:', err);
    return false;
  }
}

/**
 * Verificar múltiples permisos (ANY)
 */
export async function checkAnyPermission(...perms: string[]): Promise<boolean> {
  const results = await Promise.all(
    perms.map(p => checkPermission(p))
  );
  return results.some(r => r === true);
}

/**
 * Verificar múltiples permisos (ALL)
 */
export async function checkAllPermissions(...perms: string[]): Promise<boolean> {
  const results = await Promise.all(
    perms.map(p => checkPermission(p))
  );
  return results.every(r => r === true);
}
```

**SQL en Supabase (Edge Function o RPC):**

```sql
create or replace function public.check_user_permission(p_permission text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_role text;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    return false;
  end if;
  
  -- Obtener rol del usuario
  select role into v_role
  from public.user_roles
  where user_id = v_user_id;
  
  -- Si no tiene rol asignado, rechazar
  if v_role is null then
    return false;
  end if;
  
  -- Verificar permiso específico
  return exists(
    select 1
    from public.role_permissions rp
    join public.user_roles ur on ur.role = rp.role
    where ur.user_id = v_user_id
      and rp.permission = p_permission
  );
end;
$$;

-- Tabla de permisos por rol
create table if not exists public.role_permissions (
  id uuid primary key default uuid_generate_v4(),
  role text not null,
  permission text not null,
  created_at timestamptz default now(),
  unique(role, permission)
);

-- Insertar permisos iniciales
insert into public.role_permissions (role, permission) values
  ('master', 'can_publish_news'),
  ('master', 'can_manage_documents'),
  ('master', 'can_manage_users'),
  ('master', 'can_edit_lms'),
  ('directiva', 'can_publish_news'),
  ('directiva', 'can_manage_documents'),
  ('directiva', 'can_edit_lms'),
  ('voluntario', 'can_view_courses')
on conflict do nothing;
```

**Usar en componentes:**

```javascript
// ✅ SEGURO: src/context/AuthContext.jsx

import { checkPermission, permissions } from '../lib/permissions';

export const AuthProvider = ({ children }) => {
  // ... código previo ...
  
  const addNews = async (newsItem) => {
    // 1. Verificar permisos en cliente
    const canPublish = await checkPermission(permissions.CAN_PUBLISH_NEWS);
    if (!canPublish) {
      throw new Error('No tienes permiso para publicar noticias');
    }
    
    // 2. Insertar en Supabase (RLS verificará nuevamente)
    const { error } = await supabase.from('noticias').insert([{
      titulo: newsItem.title,
      contenido: newsItem.content,
      fecha_publicacion: newsItem.date,
      autor: currentUser?.email,
      categoria: newsItem.category,
      imagen_url: newsItem.image
    }]);
    
    if (error) throw error;
    
    // 3. Actualizar estado local
    setNewsList(prev => [itemWithId, ...prev]);
  };
  
  // Aplicar a todas las funciones admin
  const deleteNews = async (id) => {
    const canPublish = await checkPermission(permissions.CAN_PUBLISH_NEWS);
    if (!canPublish) throw new Error('Permiso denegado');
    
    const { error } = await supabase.from('noticias').delete().eq('id', id);
    if (error) throw error;
    
    setNewsList(prev => prev.filter(n => n.id !== id));
  };
  
  const addDocCategory = async (categoryName) => {
    const canManage = await checkPermission(permissions.CAN_MANAGE_DOCUMENTS);
    if (!canManage) throw new Error('Permiso denegado');
    
    // ... resto del código
  };
};
```

---

## 3. Migrar Sessions a Cookies HttpOnly

### Problema Actual

```javascript
// ❌ INSEGURO: Tokens en localStorage
localStorage.setItem('pruaned_session', JSON.stringify(session));
const session = localStorage.getItem('pruaned_session');
```

### Solución: Usar Cookies HttpOnly

**Configurar Supabase (automático):**

```javascript
// ✅ SEGURO: src/lib/supabase.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Usar cookies automáticamente
    persistSession: true,
    // Almacenar en cookies httpOnly
    storage: {
      getItem: (key) => {
        // Supabase detectará automáticamente cookies httpOnly
        return null; // Las cookies son manejadas automáticamente
      },
      setItem: (key, value) => {
        // Las cookies httpOnly se establecen automáticamente
      },
      removeItem: (key) => {
        // Las cookies se limpian automáticamente
      },
    },
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Usar PKCE flow (más seguro)
  },
});

export const isSupabaseReady = () =>
  !!supabaseUrl &&
  supabaseUrl !== 'PENDING' &&
  !!supabaseAnonKey &&
  supabaseAnonKey !== 'PENDING';
```

**Remover de localStorage:**

```javascript
// ❌ ELIMINAR estas líneas:
export const LEGACY_SESSION_KEY = 'pruaned_session';
localStorage.setItem('pruaned_session', ...);
localStorage.getItem('pruaned_session');

// ✅ REEMPLAZAR con:
// Las cookies httpOnly las maneja Supabase automáticamente
const { data: { session } } = await supabase.auth.getSession();
```

**Configurar respuesta HTTP en Vercel (vercel.json):**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Set-Cookie",
          "value": "Path=/; HttpOnly; Secure; SameSite=Strict"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

---

## 4. Logging Server-Side

### Problema Actual

```javascript
// ❌ INSEGURO: IP hardcodeada
export function logSecurityEvent(logs, eventType, userEmail, severity = "INFO") {
  const newLog = {
    ip: "190.160.10.22",  // ⚠️ HARDCODEADA
  };
}
```

### Solución: Logging en Supabase Edge Function

**Crear Edge Function:**

```typescript
// ✅ supabase/functions/log-security-event/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

serve(async (req) => {
  // Solo POST
  if (req.method !== 'POST') {
    return new Response('Not allowed', { status: 405 })
  }

  try {
    // Obtener JWT del header
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      return new Response(JSON.stringify({ error: 'No token' }), { status: 401 })
    }

    // Verificar JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 })
    }

    // Obtener datos del evento
    const { eventType, severity, metadata } = await req.json()

    // Capturar IP real del cliente
    const ip = req.headers.get('x-forwarded-for') ||
               req.headers.get('cf-connecting-ip') ||
               req.headers.get('x-real-ip') ||
               'unknown'

    // Registrar en la base de datos
    const { error: insertError } = await supabase
      .from('auditoria_logs')
      .insert({
        usuario: user.email,
        accion: eventType,
        severidad: severity || 'INFO',
        fecha: new Date().toISOString(),
        ip_origen: ip.split(',')[0].trim(), // Primer IP si hay múltiples
        metadata: metadata,
        user_id: user.id
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to log event' }),
        { status: 500 }
      )
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

**Usar desde el frontend:**

```javascript
// ✅ src/lib/securityLogging.js

import { supabase } from './supabase';

export async function logSecurityEvent(eventType, severity = 'INFO', metadata = {}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Llamar a la Edge Function
    const { error } = await supabase.functions.invoke('log-security-event', {
      body: {
        eventType,
        severity,
        metadata
      },
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('Logging error:', error);
    }
  } catch (err) {
    console.error('Security logging exception:', err);
  }
}

// Usar en AuthContext:
// import { logSecurityEvent } from '../lib/securityLogging';

// await logSecurityEvent('AUTH_SUCCESS', 'INFO', {
//   user_email: currentUser.email,
//   role: currentUser.role
// });
```

---

## 5. 2FA Validado Server-Side

### Problema Actual

```javascript
// ❌ INSEGURO: 2FA solo en frontend
setIs2FAVerified(true);  // Validación local
```

### Solución: 2FA con Server-Side Verification

**Schema SQL para 2FA:**

```sql
-- Tabla de códigos 2FA
create table if not exists public.two_fa_codes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  verified_at timestamptz,
  attempts int default 0,
  unique(user_id, code)
);

-- Tabla de sesiones 2FA verificadas
create table if not exists public.verified_2fa_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_token text unique not null,
  verified_at timestamptz default now(),
  expires_at timestamptz not null,
  ip_address text,
  user_agent text
);

create index on two_fa_codes (user_id, expires_at);
create index on verified_2fa_sessions (user_id, expires_at);
```

**Funciones RPC para 2FA:**

```sql
-- Enviar código 2FA (por email)
create or replace function public.send_2fa_code()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_code text;
  v_expires_at timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('error', 'Not authenticated');
  end if;

  -- Generar código
  v_code := floor(100000 + random() * 900000)::int::text;
  v_expires_at := now() + interval '15 minutes';

  -- Eliminar códigos previos no usados
  delete from public.two_fa_codes
  where user_id = v_user_id
    and verified_at is null
    and expires_at < now();

  -- Insertar nuevo código
  insert into public.two_fa_codes (user_id, code, expires_at)
  values (v_user_id, v_code, v_expires_at);

  -- TODO: Enviar por email (usar Supabase email o SendGrid)
  -- Para desarrollo, retornar el código
  return json_build_object(
    'success', true,
    'code', v_code,  -- SOLO en desarrollo
    'expires_in_seconds', (extract(epoch from v_expires_at) - extract(epoch from now()))::int
  );
end;
$$;

-- Verificar código 2FA
create or replace function public.verify_2fa_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_verified bool;
  v_session_token text;
  v_expires_at timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('error', 'Not authenticated');
  end if;

  -- Buscar código válido
  select verified_at into v_verified
  from public.two_fa_codes
  where user_id = v_user_id
    and code = p_code
    and expires_at > now()
  limit 1;

  if v_verified is not null then
    return json_build_object('error', 'Code already used');
  end if;

  -- Actualizar código como verificado
  update public.two_fa_codes
  set verified_at = now()
  where user_id = v_user_id
    and code = p_code
    and expires_at > now();

  if not found then
    return json_build_object('error', 'Invalid or expired code');
  end if;

  -- Crear sesión 2FA verificada
  v_session_token := encode(
    gen_random_bytes(32),
    'hex'
  );
  v_expires_at := now() + interval '24 hours';

  insert into public.verified_2fa_sessions (
    user_id,
    session_token,
    expires_at,
    ip_address,
    user_agent
  ) values (
    v_user_id,
    v_session_token,
    v_expires_at,
    current_setting('request.headers')::json->>'x-forwarded-for',
    current_setting('request.headers')::json->>'user-agent'
  );

  return json_build_object(
    'success', true,
    'session_token', v_session_token
  );
end;
$$;

-- Verificar si la sesión 2FA es válida
create or replace function public.has_valid_2fa_session()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.verified_2fa_sessions
    where user_id = auth.uid()
      and expires_at > now()
  );
$$;
```

**Políticas RLS que requieren 2FA:**

```sql
-- Crear policy que requiere 2FA verificado
create policy "require_2fa_for_socios" on public.socios
  for all
  using (
    auth.role() = 'service_role' or
    auth.uid() = id or
    has_valid_2fa_session()
  )
  with check (
    auth.role() = 'service_role' or
    auth.uid() = id or
    has_valid_2fa_session()
  );

-- Aplicar a tablas sensibles
alter table public.socios enable row level security;
alter table public.donaciones enable row level security;
alter table public.auditoria_logs enable row level security;
```

**Frontend - Usar 2FA verificado:**

```javascript
// ✅ src/context/AuthContext.jsx

export const AuthProvider = ({ children }) => {
  const [twoFASessionToken, setTwoFASessionToken] = useState(null);
  const [twoFARequired, setTwoFARequired] = useState(false);

  const loginStep1_RequestOTP = async (email, password) => {
    // ... autenticación normal en Supabase ...
    
    // Solicitar código 2FA
    const { data, error } = await supabase.rpc('send_2fa_code');
    
    if (error) throw error;
    
    setTwoFARequired(true);
    setTwoFASessionToken(data.code);  // Solo para desarrollo
    
    return { success: true };
  };

  const loginStep2_VerifyOTP = async (code) => {
    if (!twoFARequired) {
      throw new Error('2FA no requerido');
    }

    // Verificar código
    const { data, error } = await supabase.rpc('verify_2fa_code', {
      p_code: code
    });

    if (error) throw error;

    // Guardar token de sesión 2FA verificada
    setTwoFASessionToken(data.session_token);
    setTwoFARequired(false);

    // Este token se envía automáticamente en siguiente request
    return { success: true };
  };

  // El token se incluye en los headers de Supabase automáticamente
  // si está en localStorage como 'sb-session-token'
};
```

---

## 6. Role-Based Access Control (RBAC)

### Implementar RBAC Completo

**Actualizar AdminCMS.jsx:**

```javascript
// ✅ SEGURO: src/components/AdminCMS.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { checkPermission, permissions } from '../lib/permissions';

export const AdminCMS = () => {
  const { currentUser, newsList, addNews, deleteNews } = useAuth();
  const [canPublishNews, setCanPublishNews] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar permisos al montar
  useEffect(() => {
    const checkPermissions = async () => {
      if (!currentUser) {
        setCanPublishNews(false);
      } else {
        const hasPermission = await checkPermission(permissions.CAN_PUBLISH_NEWS);
        setCanPublishNews(hasPermission);
      }
      setIsLoading(false);
    };

    checkPermissions();
  }, [currentUser]);

  // Mostrar pantalla de acceso denegado
  if (!isLoading && !canPublishNews) {
    return (
      <section className="py-16 bg-red-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Acceso Denegado
          </h2>
          <p className="text-gray-600">
            No tienes permiso para acceder al panel de administración.
            Solo los usuarios con rol de Directiva o Administrador pueden acceder.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Usuario actual: {currentUser?.email}
          </p>
          <p className="text-gray-500 text-sm">
            Rol: {currentUser?.role || 'Sin rol'}
          </p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return <div>Verificando permisos...</div>;
  }

  // Resto del componente AdminCMS
  return (
    <section className="py-16 bg-slate-900 text-white min-h-screen">
      {/* ... contenido del admin panel ... */}
    </section>
  );
};
```

**PrivateRoute mejorada:**

```javascript
// ✅ SEGURO: src/components/PrivateRoute.jsx

import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPrivateRouteState } from '../context/authSession';
import { checkPermission } from '../lib/permissions';

export const PrivateRoute = ({ 
  children, 
  requiredRole = null,
  requiredPermission = null 
}) => {
  const { currentUser, is2FAVerified, isAuthRestoring } = useAuth();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const routeState = getPrivateRouteState({
        isAuthRestoring,
        currentUser,
        is2FAVerified
      });

      if (routeState === 'unauthorized' || routeState === 'restoring') {
        setIsAuthorized(false);
        return;
      }

      // Verificar rol específico si es requerido
      if (requiredRole && !requiredRole.includes(currentUser.role)) {
        setIsAuthorized(false);
        return;
      }

      // Verificar permiso específico si es requerido
      if (requiredPermission) {
        const hasPermission = await checkPermission(requiredPermission);
        setIsAuthorized(hasPermission);
      } else {
        setIsAuthorized(true);
      }

      setIsLoading(false);
    };

    checkAccess();
  }, [currentUser, is2FAVerified, isAuthRestoring, requiredRole, requiredPermission]);

  if (isLoading) {
    return <div role="status">Verificando acceso...</div>;
  }

  if (!isAuthorized) {
    return (
      <Navigate 
        to="/?login=required" 
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
};

// Usar así:
// <PrivateRoute requiredRole={['directiva', 'master']}>
//   <AdminCMS />
// </PrivateRoute>
//
// <PrivateRoute requiredPermission={permissions.CAN_MANAGE_DOCUMENTS}>
//   <DocumentManager />
// </PrivateRoute>
```

---

## 🎯 Plan de Implementación

### Fase 1 (Semana 1-2): Críticas
- [ ] Remover USER_DATABASE hardcodeado
- [ ] Implementar verificación de permisos en funciones admin
- [ ] Migrar a cookies httpOnly

### Fase 2 (Semana 3-4): Logging y 2FA
- [ ] Implementar logging server-side
- [ ] Implementar 2FA server-side verification
- [ ] Crear policies RLS mejoradas

### Fase 3 (Semana 5-6): RBAC Completo
- [ ] Implementar RBAC en todos los componentes
- [ ] Auditar todas las políticas RLS
- [ ] Testing de seguridad

### Fase 4 (Semana 7-8): Documentación y Training
- [ ] Documentar cambios de seguridad
- [ ] Capacitar al equipo
- [ ] Realizar penetration testing

---

## 📚 Recursos Adicionales

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [SQL Injection Prevention](https://owasp.org/www-community/attacks/SQL_Injection)

---

**Documentación de Remediación Técnica**  
**Versión 1.0 - 15 de Agosto 2026**
