#!/bin/bash
# cleanup-pruaned.sh
# Script seguro para eliminar archivos basura del proyecto PRUANED
# Uso: bash cleanup-pruaned.sh

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     PRUANED A.G. - Limpieza de Archivos Basura            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. VERIFICACIONES PREVIAS
echo -e "${YELLOW}📋 Fase 1: Verificaciones Previas${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo -e "${RED}❌ Error: No estamos en el directorio raíz de PRUANED${NC}"
    echo "   Ejecuta desde: c:\\PRUANED"
    exit 1
fi

echo -e "${GREEN}✅ Estamos en el directorio correcto${NC}"

# Verificar que git está disponible
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Error: Git no encontrado${NC}"
    echo "   Instala git o asegúrate que está en PATH"
    exit 1
fi

echo -e "${GREEN}✅ Git disponible${NC}"

# Verificar que los archivos críticos existen
if [ ! -f "public/estatutos_redisenados.html" ]; then
    echo -e "${YELLOW}⚠️  Advertencia: public/estatutos_redisenados.html no encontrado${NC}"
    echo "   Este archivo debe existir antes de eliminar los scripts"
    read -p "   ¿Deseas continuar? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${YELLOW}Limpieza cancelada${NC}"
        exit 0
    fi
fi

echo -e "${GREEN}✅ Verificaciones pasadas${NC}"
echo ""

# 2. BACKUP
echo -e "${YELLOW}💾 Fase 2: Crear Backup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BACKUP_TAG="backup-cleanup-$(date +%Y%m%d-%H%M%S)"

echo "Haciendo commit de backup: $BACKUP_TAG"
git add -A
git commit -m "backup: before cleanup - removing PDF processing scripts" \
    -m "Scripts a eliminar: build_*, parse_*, extract_*, verify_*, check_*, etc." \
    -m "Archivos de datos: blocks_dump.txt, definitivos_*.txt, extracted_*.txt" \
    -m "Este commit se puede revertir con: git reset --hard $BACKUP_TAG^"

git tag $BACKUP_TAG

echo -e "${GREEN}✅ Backup creado: $BACKUP_TAG${NC}"
echo -e "${GREEN}   Para revertir: git reset --hard $BACKUP_TAG^${NC}"
echo ""

# 3. LISTAR ARCHIVOS A ELIMINAR
echo -e "${YELLOW}📋 Fase 3: Archivos a Eliminar${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FILES_TO_DELETE=(
    # Scripts Python (13)
    "build_estatutos.py"
    "build_full_definitivos_html.py"
    "check_articles.py"
    "convert_pdf_to_images.py"
    "dump_definitivos.py"
    "extract_clean_content_definitivos.py"
    "fix_mismatches.py"
    "generate_exact_html.py"
    "parse_definitivos.py"
    "parse_definitivos_structure.py"
    "strict_text_checker.py"
    "summarize_pages.py"
    "verify_text_fidelity.py"
    
    # Datos generados (5)
    "blocks_dump.txt"
    "definitivos_clean.txt"
    "definitivos_dump_full.txt"
    "definitivos_extracted.txt"
    "extracted_definitivos_blocks.txt"
    
    # Test files (2)
    "test.html"
    "test_puppeteer.pdf"
    
    # Scripts Node (3)
    "render_pdf.js"
    "render_pdf.cjs"
    "build_sql.cjs"
)

echo "Archivos a eliminar:"
echo ""

TOTAL_SIZE=0
COUNT=0

for file in "${FILES_TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        SIZE=$(stat --format=%s "$file" 2>/dev/null || du -b "$file" | cut -f1)
        SIZE_KB=$((SIZE / 1024))
        echo -e "  ${RED}✗${NC} $file (${SIZE_KB}KB)"
        TOTAL_SIZE=$((TOTAL_SIZE + SIZE))
        COUNT=$((COUNT + 1))
    fi
done

TOTAL_SIZE_MB=$((TOTAL_SIZE / 1024 / 1024))

echo ""
echo -e "Total: ${RED}$COUNT archivos${NC} (${YELLOW}~${TOTAL_SIZE_MB}MB${NC})"
echo ""

# 4. CONFIRMACIÓN
echo -e "${YELLOW}⚠️  Fase 4: Confirmación${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}⚠️  ADVERTENCIA:${NC}"
echo "   Esta acción NO se puede deshacer (a menos que uses el backup)"
echo "   Se eliminarán $COUNT archivos (~${TOTAL_SIZE_MB}MB)"
echo ""
echo "   Archivos críticos se conservarán:"
echo "   ✓ src/          (código React)"
echo "   ✓ supabase/     (base de datos)"
echo "   ✓ tests/        (tests)"
echo "   ✓ public/estatutos_redisenados.html (resultado final)"
echo "   ✓ public/pdf_preview_pages/ (imágenes)"
echo ""
echo "   Si algo sale mal, puedes revertir:"
echo "   git reset --hard $BACKUP_TAG^"
echo ""

read -p "¿Deseas continuar? (escribe 'SÍ ELIMINAR' para confirmar): " confirmation

if [ "$confirmation" != "SÍ ELIMINAR" ]; then
    echo -e "${YELLOW}Limpieza cancelada${NC}"
    echo -e "Para revertir el backup: ${BLUE}git reset --hard $BACKUP_TAG^${NC}"
    exit 0
fi

echo ""

# 5. ELIMINAR
echo -e "${RED}🗑️  Fase 5: Eliminando archivos${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DELETED_COUNT=0

for file in "${FILES_TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        echo -e "  ${GREEN}✓${NC} Eliminado: $file"
        DELETED_COUNT=$((DELETED_COUNT + 1))
    else
        echo -e "  ${YELLOW}~${NC} No encontrado: $file (ya estaba eliminado?)"
    fi
done

echo ""
echo -e "${GREEN}✅ Eliminados $DELETED_COUNT archivos${NC}"
echo ""

# 6. COMMIT
echo -e "${YELLOW}📝 Fase 6: Commit de cambios${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

git add -A
git commit -m "cleanup: remove PDF processing scripts and generated files" \
    -m "Removed:
- 13 Python scripts for PDF processing (no longer needed)
- 5 generated text files from PDF extraction
- 2 test/demo files
- 3 Node scripts for PDF rendering

Total freed: ~${TOTAL_SIZE_MB}MB

These files were one-time tools used to generate public/estatutos_redisenados.html
and public/pdf_preview_pages/. The final outputs are preserved.

Reversible: git reset --hard $BACKUP_TAG^"

echo -e "${GREEN}✅ Cambios guardados${NC}"
echo ""

# 7. VERIFICACIÓN
echo -e "${YELLOW}✔️  Fase 7: Verificación${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Verificando que archivos críticos existen..."

CRITICAL_FILES=(
    "src/App.jsx"
    "src/context/AuthContext.jsx"
    "package.json"
    "vite.config.js"
    "public/estatutos_redisenados.html"
    "supabase_schema.sql"
)

ALL_OK=true

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} FALTA: $file"
        ALL_OK=false
    fi
done

echo ""

if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}✅ Todos los archivos críticos existen${NC}"
else
    echo -e "${RED}❌ Faltan archivos críticos - Revertir con: git reset --hard $BACKUP_TAG^${NC}"
    exit 1
fi

echo ""

# 8. RESUMEN
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  ✅ LIMPIEZA COMPLETADA                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "📊 Estadísticas:"
echo "   Archivos eliminados: $DELETED_COUNT"
echo "   Espacio liberado: ~${TOTAL_SIZE_MB}MB"
echo "   Backup guardado: $BACKUP_TAG"
echo ""
echo -e "🔄 Si necesitas revertir:"
echo -e "   ${BLUE}git reset --hard $BACKUP_TAG^${NC}"
echo ""
echo -e "🧪 Próximo paso: Verificar que todo funciona"
echo -e "   ${BLUE}npm run build${NC}"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
