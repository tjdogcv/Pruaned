# cleanup-pruaned.ps1
# Script PowerShell para eliminar archivos basura del proyecto PRUANED
# Uso: powershell -ExecutionPolicy Bypass -File cleanup-pruaned.ps1

$ErrorActionPreference = "Stop"

# Función para imprimir con colores
function Write-Status {
    param(
        [string]$Message,
        [ValidateSet("Success", "Error", "Warning", "Info")]
        [string]$Status = "Info"
    )
    
    $Colors = @{
        Success = 'Green'
        Error = 'Red'
        Warning = 'Yellow'
        Info = 'Cyan'
    }
    
    Write-Host $Message -ForegroundColor $Colors[$Status]
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "╔$("═" * 60)╗" -ForegroundColor Cyan
    Write-Host "║ $Title$(" " * (58 - $Title.Length))║" -ForegroundColor Cyan
    Write-Host "╚$("═" * 60)╝" -ForegroundColor Cyan
    Write-Host ""
}

# ============================================================================
# INICIO
# ============================================================================

Write-Section "PRUANED A.G. - Limpieza de Archivos Basura"

# 1. VERIFICACIONES PREVIAS
Write-Section "Fase 1: Verificaciones Previas"

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json") -or -not (Test-Path "src")) {
    Write-Status "Error: No estamos en el directorio raíz de PRUANED" "Error"
    Write-Host "   Ejecuta desde: c:\PRUANED"
    exit 1
}

Write-Status "✅ Estamos en el directorio correcto" "Success"

# Verificar que git está disponible
try {
    $null = git --version
    Write-Status "✅ Git disponible" "Success"
} catch {
    Write-Status "Error: Git no encontrado" "Error"
    Write-Host "   Instala git o asegúrate que está en PATH"
    exit 1
}

# Verificar que los archivos críticos existen
if (-not (Test-Path "public/estatutos_redisenados.html")) {
    Write-Status "Advertencia: public/estatutos_redisenados.html no encontrado" "Warning"
    Write-Host "   Este archivo debe existir antes de eliminar los scripts"
    $response = Read-Host "   ¿Deseas continuar? (s/n)"
    if ($response -ne "s") {
        Write-Status "Limpieza cancelada" "Warning"
        exit 0
    }
}

Write-Status "✅ Verificaciones pasadas" "Success"

# ============================================================================
# BACKUP
# ============================================================================

Write-Section "Fase 2: Crear Backup"

$BackupTag = "backup-cleanup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "Haciendo commit de backup: $BackupTag"
git add -A
git commit -m "backup: before cleanup - removing PDF processing scripts" `
    -m "Scripts a eliminar: build_*, parse_*, extract_*, verify_*, check_*, etc." `
    -m "Archivos de datos: blocks_dump.txt, definitivos_*.txt, extracted_*.txt" `
    -m "Este commit se puede revertir con: git reset --hard $BackupTag^"

git tag $BackupTag

Write-Status "✅ Backup creado: $BackupTag" "Success"
Write-Status "   Para revertir: git reset --hard $BackupTag^" "Info"

# ============================================================================
# LISTAR ARCHIVOS A ELIMINAR
# ============================================================================

Write-Section "Fase 3: Archivos a Eliminar"

$FilesToDelete = @(
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

Write-Host "Archivos a eliminar:" -ForegroundColor Yellow
Write-Host ""

$TotalSize = 0
$Count = 0

foreach ($file in $FilesToDelete) {
    if (Test-Path $file) {
        $Size = (Get-Item $file).Length
        $SizeKB = [Math]::Round($Size / 1024)
        Write-Host "  ✗ $file ($SizeKB KB)" -ForegroundColor Red
        $TotalSize += $Size
        $Count++
    }
}

$TotalSizeMB = [Math]::Round($TotalSize / 1024 / 1024)

Write-Host ""
Write-Status "Total: $Count archivos (~${TotalSizeMB}MB)" "Warning"
Write-Host ""

# ============================================================================
# CONFIRMACIÓN
# ============================================================================

Write-Section "Fase 4: Confirmación"

Write-Status "ADVERTENCIA:" "Error"
Write-Host "   Esta acción NO se puede deshacer (a menos que uses el backup)"
Write-Host "   Se eliminarán $Count archivos (~${TotalSizeMB}MB)"
Write-Host ""
Write-Host "   Archivos críticos se conservarán:"
Write-Host "   ✓ src/          (código React)"
Write-Host "   ✓ supabase/     (base de datos)"
Write-Host "   ✓ tests/        (tests)"
Write-Host "   ✓ public/estatutos_redisenados.html (resultado final)"
Write-Host "   ✓ public/pdf_preview_pages/ (imágenes)"
Write-Host ""
Write-Host "   Si algo sale mal, puedes revertir:"
Write-Host "   git reset --hard $BackupTag^" -ForegroundColor Cyan
Write-Host ""

$Confirmation = Read-Host "¿Deseas continuar? (escribe 'SÍ ELIMINAR' para confirmar)"

if ($Confirmation -ne "SÍ ELIMINAR") {
    Write-Status "Limpieza cancelada" "Warning"
    Write-Host "Para revertir el backup: git reset --hard $BackupTag^" -ForegroundColor Cyan
    exit 0
}

Write-Host ""

# ============================================================================
# ELIMINAR
# ============================================================================

Write-Section "Fase 5: Eliminando archivos"

$DeletedCount = 0

foreach ($file in $FilesToDelete) {
    if (Test-Path $file) {
        Remove-Item -Path $file -Force
        Write-Host "  ✓ Eliminado: $file" -ForegroundColor Green
        $DeletedCount++
    } else {
        Write-Host "  ~ No encontrado: $file (ya estaba eliminado?)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Status "✅ Eliminados $DeletedCount archivos" "Success"
Write-Host ""

# ============================================================================
# COMMIT
# ============================================================================

Write-Section "Fase 6: Commit de cambios"

git add -A
git commit -m "cleanup: remove PDF processing scripts and generated files" `
    -m "Removed:
- 13 Python scripts for PDF processing (no longer needed)
- 5 generated text files from PDF extraction
- 2 test/demo files
- 3 Node scripts for PDF rendering

Total freed: ~${TotalSizeMB}MB

These files were one-time tools used to generate public/estatutos_redisenados.html
and public/pdf_preview_pages/. The final outputs are preserved.

Reversible: git reset --hard $BackupTag^"

Write-Status "✅ Cambios guardados" "Success"
Write-Host ""

# ============================================================================
# VERIFICACIÓN
# ============================================================================

Write-Section "Fase 7: Verificación"

Write-Host "Verificando que archivos críticos existen..."
Write-Host ""

$CriticalFiles = @(
    "src/App.jsx"
    "src/context/AuthContext.jsx"
    "package.json"
    "vite.config.js"
    "public/estatutos_redisenados.html"
    "supabase_schema.sql"
)

$AllOK = $true

foreach ($file in $CriticalFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ FALTA: $file" -ForegroundColor Red
        $AllOK = $false
    }
}

Write-Host ""

if ($AllOK) {
    Write-Status "✅ Todos los archivos críticos existen" "Success"
} else {
    Write-Status "❌ Faltan archivos críticos - Revertir con: git reset --hard $BackupTag^" "Error"
    exit 1
}

Write-Host ""

# ============================================================================
# RESUMEN
# ============================================================================

Write-Host "╔$("═" * 60)╗" -ForegroundColor Cyan
Write-Host "║ ✅ LIMPIEZA COMPLETADA$(" " * (32))║" -ForegroundColor Cyan
Write-Host "╚$("═" * 60)╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Estadísticas:" -ForegroundColor Cyan
Write-Host "   Archivos eliminados: $DeletedCount"
Write-Host "   Espacio liberado: ~${TotalSizeMB}MB"
Write-Host "   Backup guardado: $BackupTag"
Write-Host ""

Write-Host "🔄 Si necesitas revertir:" -ForegroundColor Cyan
Write-Host "   git reset --hard $BackupTag^" -ForegroundColor Cyan
Write-Host ""

Write-Host "🧪 Próximo paso: Verificar que todo funciona" -ForegroundColor Cyan
Write-Host "   npm run build" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
