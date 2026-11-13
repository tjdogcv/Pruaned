-- =========================================================================
-- CONFIGURACIÓN DE STORAGE Y BUCKETS PARA POSTULACIONES - PRUANED A.G.
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- (Nota: No se debe usar ALTER TABLE en storage.objects porque Supabase
--  ya tiene RLS habilitado por defecto y su propietario es storage_admin)
-- =========================================================================

-- 1. Asegurar la columna jsonb flexible en postulaciones
ALTER TABLE public.postulaciones 
  ADD COLUMN IF NOT EXISTS formulario_completo jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Crear o actualizar los Buckets en Supabase Storage como Públicos
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('documentos-socios', 'documentos-socios', true),
  ('cartas-intencion', 'cartas-intencion', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Políticas de Lectura (Permitir lectura de los certificados a Directiva y público)
DROP POLICY IF EXISTS "Lectura publica documentos-socios" ON storage.objects;
CREATE POLICY "Lectura publica documentos-socios"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('documentos-socios', 'cartas-intencion'));

-- 4. Políticas de Subida (Permitir que postulantes externos y miembros puedan subir sus archivos)
DROP POLICY IF EXISTS "Subida postulantes documentos-socios" ON storage.objects;
CREATE POLICY "Subida postulantes documentos-socios"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('documentos-socios', 'cartas-intencion'));

-- 5. Políticas de Gestión (Permitir actualizar/borrar a usuarios autenticados)
DROP POLICY IF EXISTS "Gestion autorizada documentos-socios" ON storage.objects;
CREATE POLICY "Gestion autorizada documentos-socios"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id IN ('documentos-socios', 'cartas-intencion'))
  WITH CHECK (bucket_id IN ('documentos-socios', 'cartas-intencion'));
