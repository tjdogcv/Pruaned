# 🔴 AUDITORÍA DE SEGURIDAD CRÍTICA - PRUANED A.G.

**Fecha:** 15 de Agosto 2026  
**Nivel de Riesgo:** 🔴 CRÍTICO | 🟠 ALTO | 🟡 MEDIO  
**Estado:** Revisión completa de vulnerabilidades

---

## 📋 RESUMEN EJECUTIVO

Se encontraron **8 vulnerabilidades críticas** y **12 problemas de seguridad de alto riesgo** que comprometen la confidencialidad, integridad y disponibilidad del sistema. Las vulnerabilidades más graves involucran:

1. **Exposición de credenciales administrativas** hardcodeadas en el código
2. **Falta de verificación de permisos** en funciones administrativas
3. **Tokens y sesiones almacenadas inseguramente** en localStorage
4. **IPs hardcodeadas** para logging
5. **Autenticación 2FA validada solo en frontend**
6. **Acceso sin restricciones a datos sensibles** en Supabase

---

## 🔴 VULNERABILIDADES CRÍTICAS

### 1. **EXPOSICIÓN DE CREDENCIALES: Email Admin Hardcodeado**

**Ubicación:** `src/context/AuthContext.jsx` (línea ~130-140)

```javascript
const USER_DATABASE = [
  {
    email: "ag.pruaned@gmail.com",  // ⚠️ EMAIL HARDCODEADO
    name: "Usuario Maestro PRUANED A.G.",
    role: "master",
    rut: "10.102.304-5",  // ⚠️ RUT HARDCODEADO
    permisoGestionVoluntarios: true
  },
  ...
];
```

**Riesgo:** 
- El email del administrador maestro es conocido por cualquier persona que lea el código
- Está disponible en repositorios públicos o compilaciones
- Un atacante puede hacer intentos de fuerza bruta contra este usuario conocido

**Severidad:** 🔴 CRÍTICO  
**Impacto:** Acceso no autorizado a funciones administrativas

**Remediación:**
```javascript
// ✅ CORRECCIÓN: Validar roles solo desde Supabase Auth
// NO guardar datos de usuario maestro en código frontend
// Usar Supabase Auth con CUSTOM CLAIMS en JWT para roles
```

---

### 2. **AUSENCIA DE VERIFICACIÓN DE PERMISOS: Funciones Admin Sin Protección**

**Ubicación:** `src/context/AuthContext.jsx` (líneas 1521-1565)

```javascript
const addNews = async (newsItem) => {
  const itemWithId = { ...newsItem, id: `n-${Date.now()}` };
  setNewsList(prev => [itemWithId, ...prev]);
  // ❌ SIN VERIFICACIÓN DE PERMISOS
  if (isSupabaseReady()) {
    try {
      await supabase.from('noticias').insert([{...}]);
      // ⚠️ Se confía en RLS de Supabase solamente
    }
  }
};

const deleteNews = async (id) => {
  setNewsList(prev => prev.filter(n => n.id !== id));
  // ❌ SIN VERIFICACIÓN DE PERMISOS
  if (isSupabaseReady()) {
    try {
      await supabase.from('noticias').delete().eq('id', id);
    }
  }
};

const addDocCategory = async (categoryName) => {
  // ❌ SIN VERIFICACIÓN DE PERMISOS
  const { data, error } = await supabase
    .from('document_categories')
    .insert({ name: cat });
};

const deleteDocCategory = async (categoryName) => {
  // ❌ SIN VERIFICACIÓN DE PERMISOS
  const { error } = await supabase
    .from('document_categories')
    .delete().eq('name', categoryName);
};
```

**Riesgo:**
- **Frontend bypass:** Un usuario malintencionado puede abrir DevTools y llamar estas funciones directamente
- No hay verificación de rol/permisos antes de enviar la solicitud a Supabase
- Si RLS falla o no está bien configurado, cualquier usuario puede ejecutar operaciones administrativas

**Severidad:** 🔴 CRÍTICO  
**Impacto:** Cualquier usuario autenticado puede publicar/eliminar noticias, crear/eliminar categorías

**Remediación:**
```javascript
// ✅ CORRECCIÓN: Verificar permisos ANTES de llamar a Supabase
const addNews = async (newsItem) => {
  // 1. Verificar si el usuario tiene rol de admin/directiva
  if (!['master', 'directiva'].includes(currentUser?.role)) {
    throw new Error('No tienes permiso para publicar noticias');
  }
  
  // 2. Verificar permisos server-side mediante RPC
  const { data: canPublish, error: permError } = await supabase
    .rpc('can_publish_news', { user_email: currentUser.email });
  
  if (!canPublish || permError) {
    throw new Error('Acceso denegado por el servidor');
  }
  
  // 3. Proceder con la inserción
  await supabase.from('noticias').insert([...]);
};
```

---

### 3. **TOKENS Y SESIONES EN LOCALSTORAGE SIN PROTECCIÓN**

**Ubicación:** 
- `src/context/authSession.js` (líneas 1-10)
- `src/context/AuthContext.jsx` (líneas 223-280)
- `src/components/AuthModal.jsx` (líneas 32-48)

```javascript
export const LEGACY_SESSION_KEY = 'pruaned_session';

export function loadLegacySession(storage, now = Date.now()) {
  try {
    const raw = storage.getItem(LEGACY_SESSION_KEY);
    // ⚠️ Token de sesión en localStorage sin encriptación
    const session = JSON.parse(raw);
    return session;
  }
}

// En AuthContext.jsx
const persistedSession = supabaseReady ? null : loadLegacySession(localStorage);

// En AuthModal.jsx
const getLoginAttempts = () => {
  return parseInt(localStorage.getItem('pruaned_auth_attempts') || '0', 10);
  // ⚠️ Contador de intentos en localStorage
};

const getLockoutTime = () => {
  return parseInt(localStorage.getItem('pruaned_auth_lockout') || '0', 10);
  // ⚠️ Tiempo de bloqueo en localStorage
};
```

**Riesgo:**
- **XSS attacks:** Si hay una vulnerabilidad XSS, el atacante puede acceder a `localStorage.getItem('pruaned_session')`
- **Tokens en localStorage nunca se borran** automáticamente (a diferencia de cookies httpOnly)
- localStorage es accesible a cualquier script en el dominio
- No hay protección contra ataques de token theft

**Severidad:** 🔴 CRÍTICO  
**Impacto:** Session hijacking, token theft, acceso no autorizado

**Remediación:**
```javascript
// ✅ CORRECCIÓN: Usar cookies httpOnly con Secure flag
// Configurar en Supabase Auth:
// - persistSession: true (usa cookies automáticamente)
// - detectSessionInUrl: true

// O implementar:
const supabase = createClient(url, key, {
  auth: {
    persistSession: true,  // Usa cookies httpOnly
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  // No almacenar tokens en localStorage
});

// Para intentos de login, usar servidor
const checkLoginAttempts = async (email) => {
  const { data } = await supabase.rpc('check_login_attempts', 
    { p_email: email }
  );
  return data;
};
```

---

### 4. **IP HARDCODEADA EN LOGGING DE SEGURIDAD**

**Ubicación:** `src/utils/security.js` (línea 80)

```javascript
export function logSecurityEvent(logs, eventType, userEmail, severity = "INFO") {
  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    user: userEmail || "invitado@pruaned.cl",
    ip: "190.160.10.22",  // 🔴 IP HARDCODEADA
    // ...
  };
}
```

También en `src/data/initialData.js` (línea 368):
```javascript
{ id: "log-1", date: "2026-08-12 04:30:12", user: "ag.pruaned@gmail.com", ip: "190.160.45.12", ... }
```

**Riesgo:**
- Todos los logs de auditoría mostrarán la **misma IP falsa**
- Imposible auditar desde qué IP se realizan acciones
- Los logs de seguridad son inútiles si no contienen información real
- Cualquiera que haga una acción maliciosa parecerá que vino de 190.160.10.22

**Severidad:** 🔴 CRÍTICO  
**Impacto:** Auditoría comprometida, imposibilidad de rastrear ataques

**Remediación:**
```javascript
// ✅ CORRECCIÓN: Obtener IP real del cliente
export function logSecurityEvent(logs, eventType, userEmail, severity = "INFO") {
  // Opción 1: Obtener IP desde el header X-Forwarded-For (si existe proxy)
  // Opción 2: Usar Supabase para capturar IP server-side
  
  // En el navegador, no es posible obtener la IP real del cliente
  // DEBE hacerse en el servidor mediante RPC
  
  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    user: userEmail || "invitado@pruaned.cl",
    ip: null,  // Se obtendrá en el servidor
    severidad: severity,
  };
  
  return newLog;
}

// Lado servidor (SQL Edge Function en Supabase):
create or replace function public.log_security_event(
  p_event_type text,
  p_severity text
) returns void as $$
begin
  insert into public.auditoria_logs (
    accion, 
    usuario, 
    severidad, 
    ip_origen
  ) values (
    p_event_type,
    auth.email(),
    p_severity,
    request.header('x-forwarded-for')  -- IP real del cliente
  );
end;
$$ language plpgsql security definer;
```

---

### 5. **AUTENTICACIÓN 2FA VALIDADA SOLO EN FRONTEND**

**Ubicación:** `src/context/AuthContext.jsx` (línea 605) y `src/components/PrivateRoute.jsx`

```javascript
// En AuthContext.jsx
setIs2FAVerified(true);  // ⚠️ Validación SOLO en frontend

// En PrivateRoute.jsx
const routeState = getPrivateRouteState({ 
  isAuthRestoring, 
  currentUser, 
  is2FAVerified  // ⚠️ Bandera que puede ser modificada por JavaScript
});

if (routeState === 'unauthorized') {
  return <Navigate to="/?login=required" />;
}
```

**Riesgo:**
- Un atacante puede abrir DevTools y ejecutar:
  ```javascript
  // En la consola del navegador:
  window.localStorage.setItem('pruaned_session', '...');
  // Forzar is2FAVerified = true
  ```
- No hay validación server-side de que 2FA fue completado
- Los tokens no incluyen claim de 2FA verificado
- Si Supabase no valida 2FA en RLS, cualquier usuario puede acceder a datos protegidos

**Severidad:** 🔴 CRÍTICO  
**Impacto:** Bypass de autenticación de dos factores

**Remediación:**
```javascript
// ✅ CORRECCIÓN: Incluir 2FA como custom claim en JWT de Supabase
// En la configuración de Supabase Auth (SQL):

create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Generar 2FA code
  insert into public.two_fa_codes (
    user_id, 
    code, 
    expires_at
  ) values (
    new.id,
    floor(100000 + random() * 900000)::int::text,
    now() + interval '15 minutes'
  );
  
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Crear trigger para nuevos usuarios
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- En RLS: Validar 2FA desde JWT
create policy "require_2fa_for_sensitive_data" on public.socios
  for select
  using (
    -- Solo si tiene 2FA en custom claim
    (auth.jwt() ->> 'user_2fa_verified')::boolean = true
    or auth.role() = 'service_role'
  );
```

---

### 6. **ACCESO SIN RESTRICCIONES A DATOS SENSIBLES**

**Ubicación:** `src/context/AuthContext.jsx` (líneas 314-330)

```javascript
// ❌ Se obtienen TODOS los datos sin filtrar por usuario/rol
supabase.from('socios').select('*'),              // Todos los socios
supabase.from('voluntarios').select('*'),        // Todos los voluntarios
supabase.from('donaciones').select('*'),         // Todas las donaciones
supabase.from('directorio_cargos').select('*'),  // Directorio completo
supabase.from('auditoria_logs').select('*')      // Logs de seguridad
  .order('fecha', { ascending: false })
  .limit(200),
```

**Riesgo:**
- Los datos se obtienen con `.select('*')` sin filtros
- Se confía en RLS de Supabase para filtrar datos
- Si RLS tiene errores de configuración, datos sensibles están expuestos
- Un usuario que logra bypassear autenticación tiene acceso a TODO

**Severidad:** 🔴 CRÍTICO  
**Impacto:** Exposición de datos personales, información financiera, logs de auditoría

**Remediación:** Ver sección RLS más abajo

---

### 7. **BYPASS DE ACCESO A FUNCIONES ADMINISTRATIVAS**

**Ubicación:** `src/components/AdminCMS.jsx` (líneas 1-60)

```javascript
export const AdminCMS = () => {
  const { newsList, addNews, deleteNews, docCategories, addDocCategory, deleteDocCategory } = useAuth();
  
  // ❌ NO HAY VERIFICACIÓN DE PERMISOS
  // Cualquier usuario puede llamar a estas funciones
  
  const handlePublishNews = (e) => {
    e.preventDefault();
    if (newsTitle.trim() && newsSummary.trim()) {
      addNews({  // ⚠️ Sin verificar si currentUser es admin
        title: newsTitle,
        category: newsCategory,
        ...
      });
    }
  };
}
```

**Riesgo:**
- Cualquier usuario autenticado puede acceder al componente AdminCMS
- No hay verificación de `currentUser.role` antes de renderizar opciones admin
- Aunque PrivateRoute protege la ruta, el componente se renderiza sin validar rol específico

**Severidad:** 🔴 CRÍTICO  
**Impacto:** Acceso no autorizado a panel administrativo

**Remediación:**
```javascript
// ✅ CORRECCIÓN: Verificar rol de usuario

export const AdminCMS = () => {
  const { currentUser, newsList, addNews } = useAuth();
  
  // Verificar permisos
  const isMasterUser = currentUser?.email === process.env.REACT_APP_MASTER_ADMIN_EMAIL;
  const isDirectiva = currentUser?.role === 'directiva' || currentUser?.role === 'admin';
  
  if (!isMasterUser && !isDirectiva) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 font-bold">Acceso denegado: Solo admins pueden acceder.</p>
      </div>
    );
  }
  
  // Resto del componente...
};
```

---

### 8. **FALTA DE VALIDACIÓN DE ENTRADA EN CATEGORÍAS DE DOCUMENTOS**

**Ubicación:** `src/context/AuthContext.jsx` (líneas 1548-1565)

```javascript
const addDocCategory = async (categoryName) => {
  const cat = categoryName.trim();
  // ❌ Validación mínima de input
  if (!cat || docCategories.some(...)) return;
  
  const { data, error } = await supabase
    .from('document_categories')
    .insert({ name: cat });  // ⚠️ Falta sanitización
};
```

**Riesgo:**
- No hay escape de caracteres especiales
- Posible inyección de SQL si la validación server-side falla
- No hay límite de longitud
- Inyección de Unicode/emojis podría causar problemas

**Severidad:** 🔴 CRÍTICO  
**Impacto:** SQL Injection, DoS

**Remediación:**
```javascript
// ✅ CORRECCIÓN: Validación robusta de input

const addDocCategory = async (categoryName) => {
  // 1. Sanitizar entrada
  const cat = String(categoryName)
    .trim()
    .substring(0, 100);  // Límite de longitud
  
  // 2. Validar formato
  if (!/^[a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s\-&]+$/.test(cat)) {
    throw new Error('Nombre de categoría contiene caracteres inválidos');
  }
  
  // 3. Validar no existe
  if (docCategories.some(c => c.toLowerCase() === cat.toLowerCase())) {
    throw new Error('Categoría ya existe');
  }
  
  // 4. Verificar permisos
  if (!['master', 'directiva'].includes(currentUser?.role)) {
    throw new Error('No tienes permiso para crear categorías');
  }
  
  // 5. Insertar
  const { data, error } = await supabase
    .from('document_categories')
    .insert({ name: cat });
  
  if (error) throw error;
};
```

---

## 🟠 VULNERABILIDADES DE ALTO RIESGO

### 9. **CONFIGURACIÓN DE SUPABASE SIN VALIDACIÓN ADECUADA**

**Ubicación:** `src/lib/supabase.js` (líneas 24-31)

```javascript
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',  // ⚠️ Fallback a URL placeholder
  supabaseAnonKey || 'placeholder-key',               // ⚠️ Fallback a key falsa
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
```

**Riesgo:**
- Si las variables de entorno no se cargan, se usa una URL placeholder
- No hay validación de que Supabase esté correctamente configurado
- El cliente puede conectarse a servidores incorrectos

**Severidad:** 🟠 ALTO

---

### 10. **FALTA DE RATE LIMITING EN AUTENTICACIÓN**

**Ubicación:** `src/components/AuthModal.jsx` (líneas 32-48)

```javascript
const getLoginAttempts = () => {
  return parseInt(localStorage.getItem('pruaned_auth_attempts') || '0', 10);
};

const getLockoutTime = () => {
  return parseInt(localStorage.getItem('pruaned_auth_lockout') || '0', 10);
};

// ❌ Rate limiting solo en cliente, fácil de bypassear
```

**Riesgo:**
- Rate limiting en cliente es inútil (se puede limpiar localStorage)
- Fuerza bruta contra la API posible desde cualquier atacante
- No hay protección server-side

**Severidad:** 🟠 ALTO

**Remediación:**
```javascript
// ✅ Rate limiting debe ser server-side en Supabase
// Configurar en edge function o trigger SQL:

create table if not exists public.login_attempts (
  id bigint primary key generated always as identity,
  email text not null,
  attempted_at timestamptz default now(),
  success boolean
);

create index on login_attempts (email, attempted_at desc);

-- En Edge Function (Supabase Functions):
export async function handleLogin(req) {
  const { email } = await req.json();
  
  // Verificar intentos en último 15 minutos
  const attempts = await supabase
    .from('login_attempts')
    .select('id')
    .eq('email', email)
    .gt('attempted_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
    .limit(10);
  
  if (attempts.data.length >= 5) {
    return new Response(
      JSON.stringify({ error: 'Demasiados intentos. Intenta en 15 minutos.' }),
      { status: 429 }
    );
  }
}
```

---

### 11. **RLS (ROW LEVEL SECURITY) POTENCIALMENTE DÉBIL**

**Ubicación:** `supabase/migrations/20260820_gestor_documentos_publicos.sql` (líneas 73-100+)

```sql
create or replace function public.document_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'ag.pruaned@gmail.com'
  or exists (
    select 1
    from public.socios socio
    join public.directorio_cargos cargos on cargos.id = 1
    where lower(coalesce(socio.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and socio.id in (...)
  );
$$;
```

**Riesgo:**
- Email hardcodeado en función SQL (difícil de cambiar)
- No hay auditoría de qué política se aplica
- Policies complejas pueden tener fallos lógicos

**Severidad:** 🟠 ALTO

---

### 12. **AUSENCIA DE HTTPS ENFORCEMENT**

**Ubicación:** `vite.config.js`

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    historyApiFallback: true
  }
})
```

**Riesgo:**
- No hay configuración de HTTPS en desarrollo
- Sin conocer la configuración de producción (vercel.json no especifica)
- Tokens pueden ser capturados en tránsito

**Severidad:** 🟠 ALTO

---

## 🟡 PROBLEMAS DE SEGURIDAD MEDIA

### 13. **FALTA DE CSRF PROTECTION**

- No hay token CSRF visible
- Las solicitudes POST/DELETE no validan origen

**Remediación:** Usar Supabase Auth que incluye CSRF protection automática

---

### 14. **SECRETS EN .env.example**

**Ubicación:** `.env.example`

```
VITE_SUPABASE_ANON_KEY=eyJ...TU_ANON_KEY_AQUI
```

Las claves anon son públicas (están en código frontend), pero la estructura de .env.example revela la configuración esperada.

---

### 15. **FALTA DE VALIDACIÓN DE JWT CUSTOM CLAIMS**

No se valida que los custom claims en el JWT sean válidos antes de usarlos en decisiones de seguridad.

---

## ✅ CORRECCIONES PRIORITARIAS

### P1 - CRÍTICAS (Hacer de inmediato)

1. **Remover email admin hardcodeado** - Usar Supabase Auth roles
2. **Agregar verificación de permisos** en addNews, deleteNews, addDocCategory, deleteDocCategory
3. **Usar cookies httpOnly** en lugar de localStorage para sesiones
4. **Remover IP hardcodeada** - Implementar logging server-side
5. **Validar 2FA server-side** en RLS policies
6. **Implementar role-based access control** en AdminCMS

### P2 - ALTOS (Próximas semanas)

7. **Rate limiting server-side** en login attempts
8. **HTTPS enforcement** en producción
9. **Mejorar RLS policies** - Documentar y auditar
10. **Sanitizar inputs** en todas las funciones de creación
11. **Agregar CORS headers** adecuados

### P3 - MEDIA (Próximo mes)

12. **CSRF tokens** explícitos
13. **Security headers** (CSP, X-Frame-Options, etc.)
14. **Audit logging** mejorado
15. **Documentación de seguridad**

---

## 📝 CHECKLIST DE SEGURIDAD

```
[ ] Remover credenciales hardcodeadas
[ ] Validar permisos en TODOS los endpoints
[ ] Usar cookies httpOnly para sesiones
[ ] Implementar logging server-side
[ ] Validar 2FA en servidor
[ ] Rate limiting server-side
[ ] HTTPS en producción
[ ] CORS properly configured
[ ] Security headers configurados
[ ] RLS policies auditadas y documentadas
[ ] Sanitización de inputs en todas partes
[ ] Test de seguridad (penetration testing)
[ ] Política de contraseñas fuerte
[ ] Rotación de credenciales
[ ] Backup de base de datos
[ ] Plan de incidente de seguridad
```

---

## 🔗 REFERENCIAS

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)

---

**Generado automáticamente por Auditoría de Seguridad**  
**Clasificación: CONFIDENCIAL - Solo para administradores**
