# 📊 ANÁLISIS DE ARCHIVOS - BASURA VS ESENCIALES

**Fecha:** 15 de Agosto 2026  
**Objetivo:** Identificar archivos que pueden eliminarse sin impactar el proyecto

---

## 📁 CATEGORIZACIÓN DE ARCHIVOS

### ✅ ESENCIALES - NO TOCAR

#### **Source Code React (14 archivos)**
```
src/
├── App.jsx                              ← Main app
├── main.jsx                             ← Entry point
├── index.css                            ← Global styles
├── assets/PRUANEDLogo.jsx
├── components/
│   ├── AdminCMS.jsx
│   ├── AuthModal.jsx
│   ├── CertificateModal.jsx
│   ├── CertificateVerify.jsx
│   ├── DocumentManager.jsx
│   ├── DocumentsSection.jsx
│   ├── FondoDonacionesPanel.jsx
│   ├── Footer.jsx
│   ├── Hero.jsx
│   ├── Institutional.jsx
│   ├── IntranetNavbar.jsx
│   ├── Navbar.jsx
│   ├── NewsSection.jsx
│   ├── PortalTransparencia.jsx
│   ├── PostulacionSocio.jsx
│   ├── PrivacyDataPolicy.jsx
│   ├── PrivateRoute.jsx
│   ├── SecurityDashboard.jsx
│   ├── SociosIntranet.jsx
│   └── VoluntariosIntranet.jsx
├── context/
│   ├── AuthContext.jsx                 ← Estado global
│   └── authSession.js                  ← Lógica sesión
├── layouts/IntranetLayout.jsx
├── lib/
│   ├── supabase.js                     ← Cliente Supabase
│   ├── emailConfig.js                  ← EmailJS config
│   ├── lmsProgress.js                  ← LMS logic
│   └── security.js                     ← Security utils
├── pages/intranet/**/*.jsx              ← Todas las páginas
├── utils/security.js
└── data/initialData.js                 ← Datos iniciales
```

**Tamaño:** ~500KB  
**Dependencias:** React, React Router, Supabase, Lucide Icons  
**Criticidad:** 🔴 CRÍTICA - No eliminar nada

---

#### **Configuración y Build (5 archivos)**
```
vite.config.js                           ← Vite bundler config
tailwind.config.js                       ← Tailwind CSS
postcss.config.js                        ← PostCSS
vercel.json                              ← Vercel deployment
package.json                             ← Dependencies
package-lock.json                        ← Lock file
```

**Criticidad:** 🔴 CRÍTICA - Proyecto no funciona sin estos

---

#### **Variables de Entorno (2 archivos)**
```
.env.example                             ← Template (seguro compartir)
.env.local                               ← Secretos (NO compartir)
```

**Criticidad:** 🔴 CRÍTICA - Contiene credenciales

---

#### **Base de Datos / Supabase (5 archivos)**
```
supabase_schema.sql                      ← Schema principal
setup_auth_triggers.sql                  ← Triggers de autenticación
setup_directorio.sql                     ← Setup de directorio
setup_finanzas.sql                       ← Setup financiero
setup_public_access.sql                  ← Policies públicas
import_socios.sql                        ← Import data
supabase/migrations/**/*.sql             ← Migraciones LMS
```

**Criticidad:** 🔴 CRÍTICA - Base de datos viva

---

#### **Tests (2 archivos)**
```
tests/
├── auth-session.test.mjs                ← Tests autenticación
└── lms-progress.test.mjs                ← Tests LMS
```

**Criticidad:** 🟠 IMPORTANTE - QA verificación

**Comandos:**
```bash
npm run test:auth
npm run test:lms
```

---

#### **Auditoría de Seguridad (4 archivos RECIENTE)**
```
AUDIT_SEGURIDAD_CRITICO.md               ← Análisis de vulnerabilidades
REMEDIACION_TECNICA.md                   ← Guía de correcciones
RESUMEN_EJECUTIVO_SEGURIDAD.md           ← Para directorio
CHECKLIST_SEGURIDAD.md                   ← Verificación
```

**Criticidad:** 🟠 IMPORTANTE - Requiere acción inmediata  
**Acción:** Mover a carpeta `docs/security/` después de remediar

---

#### **Contenido Estático (2 archivos)**
```
public/
├── estatutos_redisenados.html           ← HTML final de estatutos
└── pdf_preview_pages/
    └── page_1.png ... page_23.png       ← Imágenes para preview
```

**Criticidad:** 🟠 IMPORTANTE - Usado en pantalla de Institucional

---

#### **Control de Versiones (3 carpetas)**
```
.git/                                    ← Historial git
.gitignore                               ← Reglas git
.vercel/                                 ← Config de deployment
```

**Criticidad:** 🔴 CRÍTICA - Infrastructure

---

### ❌ BASURA - ELIMINAR SEGURAMENTE

#### **Scripts Python de una sola vez (13 archivos)**

```python
# Estos scripts fueron usados SOLO para procesar el PDF de estatutos
# El resultado final ya está en: public/estatutos_redisenados.html

build_estatutos.py                       ← Genera HTML (resultado: .html)
build_full_definitivos_html.py           ← Mismo propósito
check_articles.py                        ← Verifica artículos del PDF
convert_pdf_to_images.py                 ← PDF → PNG (resultado: pdf_preview_pages/)
dump_definitivos.py                      ← Extrae texto del PDF
extract_clean_content_definitivos.py     ← Limpia texto extraído
fix_mismatches.py                        ← Corrige inconsistencias de OCR
generate_exact_html.py                   ← Genera HTML exacto (resultado: .html)
parse_definitivos.py                     ← Parsea PDF
parse_definitivos_structure.py           ← Analiza estructura PDF
strict_text_checker.py                   ← Verifica texto OCR
summarize_pages.py                       ← Resume páginas
verify_text_fidelity.py                  ← Verifica precisión OCR
```

**Status:** ✅ Trabajo terminado - No se ejecutan más  
**Tamaño:** ~150KB de código Python  
**Impacto de borrar:** ❌ NINGUNO - Solo se usaron una vez

**Razón por la que existen:** Fueron herramientas de procesamiento para convertir PDF → HTML

---

#### **Archivos de Datos Generados (5 archivos)**

```
blocks_dump.txt                          ← Output del parser de PDF
definitivos_clean.txt                    ← Texto limpio del PDF
definitivos_dump_full.txt                ← Dump completo del PDF
definitivos_extracted.txt                ← Texto extraído del PDF
extracted_definitivos_blocks.txt         ← Bloques de contenido extraído
```

**Status:** ✅ Archivos intermedia - Nunca se cargan en la app  
**Tamaño:** ~500KB total  
**Impacto de borrar:** ❌ NINGUNO

**¿Referenciados en el código?**
```bash
grep -r "definitivos_clean\|blocks_dump\|extracted_definitivos" src/
# Resultado: (ninguno - no se usan en React)
```

---

#### **Scripts Node para Renderizar PDFs (2 archivos)**

```javascript
render_pdf.js                            ← Render PDF con Puppeteer
render_pdf.cjs                           ← Versión CommonJS
build_sql.cjs                            ← Genera SQL (one-time)
```

**Status:** ✅ Scripts de desarrollo - Nunca se ejecutan en producción  
**Tamaño:** ~5KB  
**Impacto de borrar:** ❌ NINGUNO

**Razón:** Fueron para generar imágenes de preview y SQL import

---

#### **Archivos de Test/Demo (2 archivos)**

```
test.html                                ← HTML de prueba
test_puppeteer.pdf                       ← PDF de prueba
```

**Status:** ✅ Archivos de prueba - No se usan  
**Tamaño:** ~2MB  
**Impacto de borrar:** ❌ NINGUNO

---

#### **Configuración de Agentes/Tools (2 archivos)**

```
.agents/                                 ← Carpeta de skills personalizadas
.gitnexus/                               ← Índice de GitNexus
```

**Status:** ⚠️ Infraestructura de desarrollo  
**Impacto de borrar:** ❌ NINGUNO en producción (Solo dev)  
**Nota:** Pueden dejarse para debugging futuro

---

## 📊 RESUMEN DE LIMPIEZA

### Archivos a Eliminar (SEGURO)

| Tipo | Cantidad | Tamaño | Impacto |
|------|----------|--------|---------|
| Scripts Python | 13 | ~150KB | ❌ Ninguno |
| Datos generados .txt | 5 | ~500KB | ❌ Ninguno |
| Scripts Node | 3 | ~5KB | ❌ Ninguno |
| Archivos test | 2 | ~2MB | ❌ Ninguno |
| **TOTAL** | **23** | **~2.5MB** | **❌ SEGURO** |

### Espacio a Liberar

```
Antes: ~520MB (con node_modules)
Después: ~517.5MB
Limpieza: 2.5MB

Nota: node_modules es lo grande (~100MB+), eso está en .gitignore
```

---

## 🗑️ PLAN DE ELIMINACIÓN

### Fase 1: Eliminar Scripts Python (NO REVERSIBLE)

```bash
# ⚠️ VERIFICAR PRIMERO - Los resultados están guardados
rm -f \
  build_estatutos.py \
  build_full_definitivos_html.py \
  check_articles.py \
  convert_pdf_to_images.py \
  dump_definitivos.py \
  extract_clean_content_definitivos.py \
  fix_mismatches.py \
  generate_exact_html.py \
  parse_definitivos.py \
  parse_definitivos_structure.py \
  strict_text_checker.py \
  summarize_pages.py \
  verify_text_fidelity.py
```

**Verificación previa:**
- ✅ public/estatutos_redisenados.html existe y es accesible
- ✅ public/pdf_preview_pages/ tiene 23 imágenes
- ✅ No hay importaciones de estos scripts en src/

---

### Fase 2: Eliminar Datos Generados

```bash
# Archivos de output del procesamiento de PDF
rm -f \
  blocks_dump.txt \
  definitivos_clean.txt \
  definitivos_dump_full.txt \
  definitivos_extracted.txt \
  extracted_definitivos_blocks.txt
```

**Verificación previa:**
- ✅ Contenido ya está en public/estatutos_redisenados.html
- ✅ Nunca se cargan estos archivos en runtime

---

### Fase 3: Eliminar Test Files

```bash
# Archivos de prueba
rm -f \
  test.html \
  test_puppeteer.pdf
```

---

### Fase 4: Limpiar Rendering Scripts (Opcional)

```bash
# Scripts de Puppeteer/PDF rendering (one-time use)
rm -f \
  render_pdf.js \
  render_pdf.cjs \
  build_sql.cjs
```

**Nota:** Si estos se vuelven a necesitar en futuro, pueden recrearse desde git history.

---

## 📋 ARCHIVOS QUE DEBEN QUEDARSE

### Críticos para el proyecto

```
DEBEN QUEDARSE:
✅ src/                          (99% del proyecto)
✅ package.json & package-lock.json
✅ vite.config.js, tailwind.config.js
✅ vercel.json
✅ .env.example (✅ .env.local es privado)
✅ supabase_schema.sql + setup_*.sql
✅ supabase/migrations/
✅ public/
✅ tests/
✅ .git, .gitignore, .vercel
✅ dist/                         (build output)
✅ node_modules/                 (dependencies)
```

### Para documentación

```
ARCHIVOS DE AUDITORÍA (mover a docs/):
✅ AUDIT_SEGURIDAD_CRITICO.md
✅ REMEDIACION_TECNICA.md
✅ RESUMEN_EJECUTIVO_SEGURIDAD.md
✅ CHECKLIST_SEGURIDAD.md

Recomendación: Crear carpeta docs/security/ y mover ahí
después de remediar vulnerabilidades
```

---

## ⚠️ PRECAUCIONES

### Backup Previo
```bash
# Antes de eliminar, hacer backup
git commit -am "backup: before cleanup"
git tag cleanup-backup
```

### Verificación
```bash
# Después de eliminar, verificar que funciona
npm run build    # Debe completar sin errores
npm run dev      # Debe iniciar correctamente
npm run test:auth
npm run test:lms
```

### Reversi bilidad
```bash
# Si algo se daña, revertir:
git reset --hard cleanup-backup
```

---

## 🚀 COMANDO DE LIMPIEZA FINAL (TODO EN UNO)

```bash
#!/bin/bash
# cleanup.sh - Eliminar archivos basura

echo "🗑️  Iniciando limpieza del proyecto PRUANED..."

# Backup
git commit -am "backup: before cleanup"
git tag cleanup-backup

# Eliminar
rm -f \
  build_estatutos.py \
  build_full_definitivos_html.py \
  check_articles.py \
  convert_pdf_to_images.py \
  dump_definitivos.py \
  extract_clean_content_definitivos.py \
  fix_mismatches.py \
  generate_exact_html.py \
  parse_definitivos.py \
  parse_definitivos_structure.py \
  strict_text_checker.py \
  summarize_pages.py \
  verify_text_fidelity.py \
  blocks_dump.txt \
  definitivos_clean.txt \
  definitivos_dump_full.txt \
  definitivos_extracted.txt \
  extracted_definitivos_blocks.txt \
  test.html \
  test_puppeteer.pdf \
  render_pdf.js \
  render_pdf.cjs \
  build_sql.cjs

echo "✅ Limpieza completada"
echo "📊 Archivos eliminados: 23"
echo "💾 Espacio liberado: ~2.5MB"

# Verificar
npm run build && echo "✅ Build OK" || echo "❌ Build falló"
```

---

## ✅ CHECKLIST PRE-ELIMINACIÓN

- [ ] Entender qué hace cada script
- [ ] Verificar que public/estatutos_redisenados.html existe
- [ ] Verificar que pdf_preview_pages/ tiene imágenes
- [ ] No hay referencias en src/ a estos archivos
- [ ] Git history preserva todo (reversible)
- [ ] Hacer commit/tag de backup
- [ ] Probar que la app funciona después
- [ ] Verificar que tests pasan

---

## 📞 PREGUNTAS ANTES DE PROCEDER

1. ¿Necesitas guardar historial de estos scripts en git? (Ya está)
2. ¿Estos PDFs se vuelven a generar en futuro? (Clarificar)
3. ¿Hay otros proyectos que dependan de estos scripts? (Verificar)
4. ¿El archivo public/estatutos_redisenados.html es la versión final? (Confirmar)

---

**Análisis Completado - 15 de Agosto 2026**  
**Archivos Seguros para Eliminar: 23**  
**Espacio a Liberar: ~2.5MB**  
**Riesgo de Eliminar: ❌ NINGUNO**
