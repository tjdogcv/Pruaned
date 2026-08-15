# ✅ CHECKLIST DE SEGURIDAD - PRUANED A.G.

**Verificación paso a paso de vulnerabilidades y correcciones**

---

## 🔴 VULNERABILIDADES CRÍTICAS - REMEDIAR AHORA

### [  ] 1. Remover Email Admin Hardcodeado

**Ubicación:** `src/context/AuthContext.jsx`

**Verificación:**
```bash
grep -n "ag.pruaned@gmail.com" src/context/AuthContext.jsx
```

**Status Actual:** ❌ PRESENTE - CRÍTICO

**Pasos para remediar:**
- [ ] Eliminar constante `USER_DATABASE` completamente
- [ ] No guardar emails de admin en código frontend
- [ ] Usar Supabase Auth custom claims para roles
- [ ] Verificar que no hay otros emails hardcodeados

**Verificación Post-Remediación:**
```bash
grep -r "presidente.directiva@pruaned.cl" src/
grep -r "secretario.directiva@pruaned.cl" src/
# Resultado esperado: Sin coincidencias
```

**¿Remediado?** [ ] Sí [ ] No - Si No, completar antes de proseguir

---

### [  ] 2. Verificación de Permisos en addNews()

**Ubicación:** `src/context/AuthContext.jsx` línea 1521

**Código Actual (❌ INSEGURO):**
```javascript
const addNews = async (newsItem) => {
  const itemWithId = { ...newsItem, id: `n-${Date.now()}` };
  setNewsList(prev => [itemWithId, ...prev]);
  if (isSupabaseReady()) {
    try {
      await supabase.from('noticias').insert([...]);
    }
  }
};
```

**Status Actual:** ❌ SIN VERIFICACIÓN

**Pasos para remediar:**
- [ ] Crear función `checkPermission()`
- [ ] Agregar verificación antes de insertar:
  ```javascript
  if (!await checkPermission('can_publish_news')) {
    throw new Error('Permiso denegado');
  }
  ```
- [ ] Probar con usuario sin permisos
- [ ] Verificar que RLS de Supabase también rechaza

**Verificación Post-Remediación:**
```bash
# Verificar que existe verificación de permisos
grep -A5 "const addNews = async" src/context/AuthContext.jsx | grep -i "permission\|role\|admin"
# Resultado esperado: Línea con verificación de permisos
```

**¿Remediado?** [ ] Sí [ ] No

---

### [  ] 3. Verificación de Permisos en deleteNews()

**Ubicación:** `src/context/AuthContext.jsx` línea 1539

**Status Actual:** ❌ SIN VERIFICACIÓN

**Pasos:** Mismo que addNews()

**¿Remediado?** [ ] Sí [ ] No

---

### [  ] 4. Verificación de Permisos en addDocCategory()

**Ubicación:** `src/context/AuthContext.jsx` línea 1548

**Status Actual:** ❌ SIN VERIFICACIÓN

**Código Actual:**
```javascript
const addDocCategory = async (categoryName) => {
  const cat = categoryName.trim();
  if (!cat || docCategories.some(...)) return;
  const { data, error } = await supabase
    .from('document_categories')
    .insert({ name: cat });
};
```

**Problemas:**
- [ ] No verifica permisos
- [ ] No valida entrada adecuadamente
- [ ] No tiene límite de longitud

**Pasos para remediar:**
- [ ] Agregar verificación de permisos
- [ ] Validar input: máx 100 caracteres, solo caracteres permitidos
- [ ] Agregar sanitización

**¿Remediado?** [ ] Sí [ ] No

---

### [  ] 5. Verificación de Permisos en deleteDocCategory()

**Ubicación:** `src/context/AuthContext.jsx` línea 1557

**Status Actual:** ❌ SIN VERIFICACIÓN

**¿Remediado?** [ ] Sí [ ] No

---

### [  ] 6. Proteger AdminCMS con Verificación de Rol

**Ubicación:** `src/components/AdminCMS.jsx`

**Status Actual:** ❌ SIN VERIFICACIÓN

**Código Actual:**
```javascript
export const AdminCMS = () => {
  const { newsList, addNews, deleteNews, ... } = useAuth();
  // ❌ Directamente accesible a cualquier usuario
  return (
    <section className="py-16 bg-slate-900">
      {/* Panel de admin */}
    </section>
  );
};
```

**Pasos para remediar:**
- [ ] Agregar verificación de rol:
  ```javascript
  if (!['master', 'directiva'].includes(currentUser?.role)) {
    return <div>Acceso denegado</div>;
  }
  ```
- [ ] Mostrar mensaje de error
- [ ] Agregar logging del intento de acceso

**Verificación:**
```bash
grep -n "currentUser?.role" src/components/AdminCMS.jsx
# Resultado esperado: Línea con verificación de rol
```

**¿Remediado?** [ ] Sí [ ] No

---

### [  ] 7. Remover Sesiones de localStorage

**Ubicaciones:**
- `src/context/authSession.js` - línea 1
- `src/context/AuthContext.jsx` - línea 223
- `src/components/AuthModal.jsx` - línea 32-48

**Status Actual:** ❌ TOKENS EN LOCALSTORAGE

**Código Actual (❌ INSEGURO):**
```javascript
localStorage.setItem('pruaned_session', JSON.stringify(session));
const session = localStorage.getItem('pruaned_session');
localStorage.setItem('pruaned_auth_attempts', '0');
```

**Pasos para remediar:**
- [ ] Eliminar `LEGACY_SESSION_KEY`
- [ ] Eliminar `loadLegacySession()`
- [ ] Eliminar accesos a localStorage para sesiones
- [ ] Eliminar accesos a localStorage para intentos de login
- [ ] Verificar que Supabase usa cookies httpOnly automáticamente

**Verificación:**
```bash
grep -r "localStorage.setItem.*session" src/
grep -r "localStorage.getItem.*session" src/
# Resultado esperado: Sin coincidencias relacionadas con sesiones
```

**Nota:** localStorage para datos NO sensibles (como preferencias de UI) está OK.

**¿Remediado?** [ ] Sí [ ] No

---

### [  ] 8. Remover IP Hardcodeada

**Ubicaciones:**
- `src/utils/security.js` - línea 80: `"190.160.10.22"`
- `src/data/initialData.js` - línea 368: `"190.160.45.12"`

**Status Actual:** ❌ IPS HARDCODEADAS

**Código Actual (❌ INSEGURO):**
```javascript
export function logSecurityEvent(logs, eventType, userEmail, severity = "INFO") {
  const newLog = {
    ip: "190.160.10.22",  // ❌ HARDCODEADA
  };
}
```

**Pasos para remediar:**
- [ ] Remover valor hardcodeado "190.160.10.22"
- [ ] Remover valor "190.160.45.12" de datos demo
- [ ] Implementar logging server-side (ver REMEDIACION_TECNICA.md)
- [ ] Usar Edge Function de Supabase para capturar IP real

**Verificación:**
```bash
grep -r "190.160" src/
# Resultado esperado: Sin coincidencias
```

**¿Remediado?** [ ] Sí [ ] No

---

## 🟠 VULNERABILIDADES ALTAS - REMEDIAR EN 2 SEMANAS

### [  ] 9. Implementar 2FA Server-Side

**Ubicación:** `src/context/authSession.js`

**Status Actual:** ⚠️ 2FA SOLO EN CLIENTE

**Problema:**
```javascript
// ❌ INSEGURO: Validación solo frontend
setIs2FAVerified(true);  // Puede ser manipulado
```

**Pasos:**
- [ ] Crear tabla `two_fa_codes` en Supabase
- [ ] Crear RPC `send_2fa_code()`
- [ ] Crear RPC `verify_2fa_code()`
- [ ] Crear tabla `verified_2fa_sessions`
- [ ] Crear policy RLS que requiera 2FA verificado
- [ ] Verificar en RPC antes de permitir acceso

**Verificación:**
```bash
# Verificar que existe tabla en Supabase
psql -d supabase <<< "\dt two_fa_codes"
# Resultado esperado: Table exists
```

**¿Remediado?** [ ] Sí [ ] No

---

### [  ] 10. Implementar Logging Server-Side

**Ubicación:** `src/utils/security.js`

**Status Actual:** ⚠️ LOGGING INÚTIL (IP falsa)

**Pasos:**
- [ ] Crear Edge Function: `supabase/functions/log-security-event/`
- [ ] Función obtiene IP real del cliente
- [ ] Función valida JWT y registra usuario
- [ ] Remover `logSecurityEvent()` del frontend
- [ ] Usar Edge Function en su lugar

**¿Remediado?** [ ] Sí [ ] No

---

### [  ] 11. Configurar Rate Limiting

**Ubicación:** `src/components/AuthModal.jsx`

**Status Actual:** ⚠️ RATE LIMITING SOLO EN CLIENTE

**Problema:**
```javascript
// ❌ INÚTIL: Se puede limpiar localStorage
localStorage.setItem('pruaned_auth_attempts', '0');
```

**Pasos:**
- [ ] Crear tabla `login_attempts` en Supabase
- [ ] Crear función SQL que verifique intentos
- [ ] Edge Function rechaza después de 5 intentos
- [ ] Implementar cooldown de 15 minutos
- [ ] Remover rate limiting del cliente

**¿Remediado?** [ ] Sí [ ] No

---

### [  ] 12. Configurar HTTPS en Producción

**Ubicación:** `vercel.json`

**Status Actual:** ⚠️ NO CONFIGURADO

**Verificación:**
```bash
# Verificar que header HSTS existe
curl -I https://pruaned.cl | grep -i "strict-transport"
# Resultado esperado: strict-transport-security header
```

**Pasos:**
- [ ] Actualizar `vercel.json` con security headers
- [ ] Incluir: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- [ ] Forzar HTTPS redirect
- [ ] Verificar certificado SSL válido

**¿Remediado?** [ ] Sí [ ] No

---

### [  ] 13. Auditar y Mejorar RLS Policies

**Ubicación:** `supabase/migrations/20260820_gestor_documentos_publicos.sql`

**Status Actual:** ⚠️ POLICIES DÉBILES

**Verificación en Supabase:**
```sql
-- Ver todas las policies
select policy_name, table_name, definition 
from pg_policies 
where schema_name = 'public'
order by table_name;

-- Resultado esperado: >10 policies bien configuradas
```

**Pasos:**
- [ ] Documentar CADA policy RLS
- [ ] Crear matriz de permisos (quién puede qué)
- [ ] Verificar policies no heredadas incorrectamente
- [ ] Probar con diferentes roles
- [ ] Realizar penetration testing de RLS

**¿Remediado?** [ ] Sí [ ] No

---

## 🟡 VULNERABILIDADES MEDIAS - REMEDIAR EN 1 MES

### [  ] 14. Implementar CSRF Protection Explícita

**Ubicación:** Todos los formularios

**Status Actual:** ⚠️ SIN TOKENS CSRF VISIBLES

**Nota:** Supabase Auth proporciona CSRF protection automática, pero validar:
- [ ] Formularios incluyen CSRF token
- [ ] Backend valida token antes de procesar

**¿Remediado?** [ ] Sí [ ] No

---

### [  ] 15. Implementar Security Headers

**Ubicación:** `vercel.json`

**Headers a agregar:**
```json
[
  "Strict-Transport-Security: max-age=31536000; includeSubDomains",
  "X-Content-Type-Options: nosniff",
  "X-Frame-Options: DENY",
  "X-XSS-Protection: 1; mode=block",
  "Referrer-Policy: strict-origin-when-cross-origin",
  "Permissions-Policy: geolocation=(), microphone=(), camera=()"
]
```

**Verificación:**
```bash
curl -I https://pruaned.cl | grep -i "x-content-type"
# Resultado esperado: x-content-type-options: nosniff
```

**¿Remediado?** [ ] Sí [ ] No

---

### [  ] 16. Sanitización Robusta de Inputs

**Ubicación:** `src/utils/security.js` - función `sanitizeInput()`

**Status Actual:** ⚠️ SANITIZACIÓN BÁSICA

**Verificación:**
```javascript
// Probar con:
console.log(sanitizeInput('<script>alert("xss")</script>'));
// Esperado: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
```

**Pasos:**
- [ ] Verificar que sanitizeInput() se usa en TODOS los inputs
- [ ] Considerar usar biblioteca especializada (DOMPurify)
- [ ] Validar longitud máxima de inputs
- [ ] Validar formato/patrón de inputs

**¿Remediado?** [ ] Sí [ ] No

---

### [  ] 17. Validación de Entrada en Categorías

**Ubicación:** `src/context/AuthContext.jsx` - `addDocCategory()`

**Status Actual:** ⚠️ VALIDACIÓN MÍNIMA

**Pasos:**
- [ ] Máximo 100 caracteres
- [ ] Solo alfanuméricos, espacios, guiones
- [ ] No acepta caracteres especiales peligrosos
- [ ] Validar contra regex seguro

**Código esperado:**
```javascript
if (!/^[a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s\-&]+$/.test(cat)) {
  throw new Error('Caracteres inválidos');
}
```

**¿Remediado?** [ ] Sí [ ] No

---

## 📋 TESTING DE SEGURIDAD

### [  ] 18. Prueba: Bypass de Autenticación

**Pasos:**
1. [ ] Limpiar localStorage: `localStorage.clear()`
2. [ ] Inspeccionar DevTools → Network
3. [ ] Intentar acceder a ruta protegida
4. [ ] **Esperado:** Redirige a login
5. [ ] **No esperado:** Acceso permitido

**Resultado:** [ ] PASS [ ] FAIL

---

### [  ] 19. Prueba: Bypass de Permisos

**Pasos:**
1. [ ] Autenticarse como usuario "voluntario"
2. [ ] DevTools → Console
3. [ ] Intentar llamar: `addNews({ title: "Test" })`
4. [ ] **Esperado:** Error "Permiso denegado"
5. [ ] **No esperado:** Noticia creada

**Resultado:** [ ] PASS [ ] FAIL

---

### [  ] 20. Prueba: Acceso a AdminCMS sin permisos

**Pasos:**
1. [ ] Autenticarse como "voluntario"
2. [ ] Intentar navegar a `/admin`
3. [ ] **Esperado:** Página "Acceso denegado"
4. [ ] **No esperado:** Panel de admin visible

**Resultado:** [ ] PASS [ ] FAIL

---

### [  ] 21. Prueba: XSS en Categorías de Documentos

**Pasos:**
1. [ ] Autenticarse como admin
2. [ ] Crear categoría: `<img src=x onerror=alert('xss')>`
3. [ ] **Esperado:** Rechazo con error de validación
4. [ ] **No esperado:** Se ejecuta alert()

**Resultado:** [ ] PASS [ ] FAIL

---

### [  ] 22. Prueba: SQL Injection en Categorías

**Pasos:**
1. [ ] Crear categoría: `'; DROP TABLE document_categories; --`
2. [ ] **Esperado:** Rechazo o escapeado en Supabase
3. [ ] **No esperado:** Tabla eliminada

**Resultado:** [ ] PASS [ ] FAIL

---

### [  ] 23. Prueba: Fuerza Bruta en Login

**Pasos:**
1. [ ] Intentar login 10 veces con contraseña incorrecta
2. [ ] **Esperado:** Bloqueado después de 5 intentos
3. [ ] **No esperado:** Permite seguir intentando

**Resultado:** [ ] PASS [ ] FAIL

---

## 📊 REPORTE FINAL

### Status de Remediación

```
CRÍTICAS:
[ ] 1. Email admin removido
[ ] 2. addNews() verificado
[ ] 3. deleteNews() verificado
[ ] 4. addDocCategory() verificado
[ ] 5. deleteDocCategory() verificado
[ ] 6. AdminCMS protegido
[ ] 7. localStorage limpio
[ ] 8. IP removida

ALTAS:
[ ] 9. 2FA server-side
[ ] 10. Logging server-side
[ ] 11. Rate limiting
[ ] 12. HTTPS configurado
[ ] 13. RLS auditado

MEDIAS:
[ ] 14. CSRF tokens
[ ] 15. Security headers
[ ] 16. Sanitización
[ ] 17. Validación inputs

TESTING:
[ ] 18. Bypass auth
[ ] 19. Bypass permisos
[ ] 20. AdminCMS access
[ ] 21. XSS test
[ ] 22. SQL injection test
[ ] 23. Rate limiting test
```

### Fecha de Inicio: _______________
### Fecha de Finalización Esperada: _______________
### Responsable: _______________
### Revisado por: _______________

---

**Checklist de Seguridad - PRUANED A.G.**  
**Versión 1.0 - 15 de Agosto 2026**
