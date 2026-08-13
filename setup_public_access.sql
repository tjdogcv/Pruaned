-- 1. Políticas públicas para las tablas de contenido (Noticias, Documentos, Donaciones)
DROP POLICY IF EXISTS "public_noticias_read" ON public.noticias;
CREATE POLICY "public_noticias_read" ON public.noticias FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_documentos_read" ON public.documentos;
CREATE POLICY "public_documentos_read" ON public.documentos FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_donaciones_read" ON public.donaciones;
CREATE POLICY "public_donaciones_read" ON public.donaciones FOR SELECT USING (true);

-- 2. Permitir lectura pública a la tabla socios SOLO para quienes sean parte del Directorio Nacional
DROP POLICY IF EXISTS "public_read_directorio" ON public.socios;
CREATE POLICY "public_read_directorio" ON public.socios 
FOR SELECT USING (
  id IN (
    SELECT presidente_id FROM public.directorio_cargos
    UNION
    SELECT vicepresidente_id FROM public.directorio_cargos
    UNION
    SELECT secretario_id FROM public.directorio_cargos
    UNION
    SELECT tesorero_id FROM public.directorio_cargos
  )
);
