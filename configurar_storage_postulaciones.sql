-- =========================================================================
-- CONFIGURACIÓN DE STORAGE Y BUCKETS PARA POSTULACIONES - PRUANED A.G.
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- =========================================================================

-- 1. Asegurar que la tabla public.postulaciones tenga la columna jsonb flexible
ALTER TABLE public.postulaciones 
  ADD COLUMN IF NOT EXISTS formulario_completo jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Crear los Buckets en Supabase Storage (si no existen)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'documentos-socios', 
    'documentos-socios', 
    true, 
    15728640, -- 15 MB máximo por archivo
    ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
  ),
  (
    'cartas-intencion', 
    'cartas-intencion', 
    true, 
    15728640, -- 15 MB máximo por archivo
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Habilitar RLS en la tabla de objetos de Storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Lectura (Permitir lectura de los certificados a la Directiva y visores)
DROP POLICY IF EXISTS "Lectura publica documentos-socios" ON storage.objects;
CREATE POLICY "Lectura publica documentos-socios"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('documentos-socios', 'cartas-intencion'));

-- 5. Políticas de Subida (Permitir que los postulantes externos puedan subir sus documentos)
DROP POLICY IF EXISTS "Subida postulantes documentos-socios" ON storage.objects;
CREATE POLICY "Subida postulantes documentos-socios"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id IN ('documentos-socios', 'cartas-intencion'));

-- 6. Políticas de Gestión (Permitir actualizar/borrar sólo a usuarios administradores autenticados)
DROP POLICY IF EXISTS "Gestion autorizada documentos-socios" ON storage.objects;
CREATE POLICY "Gestion autorizada documentos-socios"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id IN ('documentos-socios', 'cartas-intencion'))
  WITH CHECK (bucket_id IN ('documentos-socios', 'cartas-intencion'));
