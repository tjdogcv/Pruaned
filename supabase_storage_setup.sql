-- =========================================================================
-- CONFIGURACIÓN DE SUPABASE STORAGE BUCKETS - PRUANED A.G.
-- Ejecutar en Supabase -> SQL Editor
-- =========================================================================

-- 1. Crear buckets públicos para perfiles, firmas y comprobantes
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('perfiles', 'perfiles', true),
  ('firmas', 'firmas', true),
  ('comprobantes', 'comprobantes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Seguridad (RLS) para Storage
-- Permitir lectura pública de los recursos
CREATE POLICY "Lectura pública de perfiles"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'perfiles');

CREATE POLICY "Lectura pública de firmas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'firmas');

CREATE POLICY "Lectura pública de comprobantes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comprobantes');

-- Permitir subida a usuarios autenticados
CREATE POLICY "Subida autorizada de perfiles"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'perfiles');

CREATE POLICY "Subida autorizada de firmas"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'firmas');

CREATE POLICY "Subida autorizada de comprobantes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'comprobantes');
