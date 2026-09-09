-- ============================================================================
-- SCRIPT MAESTRO DE INICIALIZACIÓN Y DESPLIEGUE — SUPABASE PRUANED A.G.
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONES Y ESQUEMA
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. VERIFICACIÓN Y AMPLIACIÓN DE COLUMNAS EN TABLA 'socios'
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.socios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rut text UNIQUE NOT NULL,
    nombre text NOT NULL,
    email text,
    profesion text,
    categoria text DEFAULT 'Socio Activo',
    voto boolean DEFAULT true,
    region text,
    comuna text,
    direccion_completa text,
    telefono text,
    estado_civil text,
    fecha_ingreso date DEFAULT CURRENT_DATE,
    estado_cuota text DEFAULT 'Al Día',
    monto_cuota_mensual integer DEFAULT 5000,
    cuota_incorporacion_pagada boolean DEFAULT false,
    monto_cuota_incorporacion integer DEFAULT 30000,
    meses_adeudados integer DEFAULT 0,
    ultima_cuota_pagada text,
    permiso_gestion_voluntarios boolean DEFAULT false,
    foto_perfil text,
    historial_pagos jsonb DEFAULT '[]'::jsonb,
    motivo_renuncia text,
    fecha_solicitud_renuncia date,
    fecha_retiro_oficial date,
    acta_directorio_aprobacion text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Asegurar columnas si la tabla ya existía previamente
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS profesion text;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'Socio Activo';
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS voto boolean DEFAULT true;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS comuna text;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS direccion_completa text;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS telefono text;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS estado_civil text;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS fecha_ingreso date DEFAULT CURRENT_DATE;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS estado_cuota text DEFAULT 'Al Día';
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS monto_cuota_mensual integer DEFAULT 5000;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS cuota_incorporacion_pagada boolean DEFAULT false;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS monto_cuota_incorporacion integer DEFAULT 30000;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS meses_adeudados integer DEFAULT 0;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS ultima_cuota_pagada text;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS permiso_gestion_voluntarios boolean DEFAULT false;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS foto_perfil text;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS historial_pagos jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS motivo_renuncia text;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS fecha_solicitud_renuncia date;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS fecha_retiro_oficial date;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS acta_directorio_aprobacion text;

-- ----------------------------------------------------------------------------
-- 3. TABLA DE COBROS Y CUOTAS (SISTEMA DE COBROS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cobros (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    socio_id uuid REFERENCES public.socios(id) ON DELETE CASCADE,
    titulo text NOT NULL,
    monto integer NOT NULL DEFAULT 5000,
    pagado boolean DEFAULT false,
    fecha_creacion timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. TABLA DE EGRESOS Y CONTABILIDAD
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.egresos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha date DEFAULT CURRENT_DATE,
    tipo_documento text,
    numero_documento text,
    proveedor text,
    categoria text,
    origen_fondo text DEFAULT 'Fondo Cuotas',
    monto integer NOT NULL,
    glosa text
);

-- ----------------------------------------------------------------------------
-- 5. TABLA DE BALANCES ANUALES Y MEMORIAS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.balances_anuales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ano integer NOT NULL,
    titulo text NOT NULL,
    url_documento text NOT NULL,
    fecha_publicacion timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 6. TABLA DE CARGOS DEL DIRECTORIO NACIONAL
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.directorio_cargos (
    id integer PRIMARY KEY DEFAULT 1,
    presidente_id uuid REFERENCES public.socios(id) ON DELETE SET NULL,
    vicepresidente_id uuid REFERENCES public.socios(id) ON DELETE SET NULL,
    secretario_id uuid REFERENCES public.socios(id) ON DELETE SET NULL,
    tesorero_id uuid REFERENCES public.socios(id) ON DELETE SET NULL
);
INSERT INTO public.directorio_cargos (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. TABLA DE POSTULACIONES A SOCIO
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.postulaciones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo text NOT NULL,
    rut text NOT NULL,
    email text NOT NULL,
    telefono text,
    profesion text,
    region text,
    comuna text,
    domicilio text,
    carta_intencion_url text,
    estado text DEFAULT 'Pendiente', -- 'Pendiente', 'Aprobada', 'Rechazada'
    fecha_postulacion timestamp with time zone DEFAULT now(),
    observaciones text
);

-- ----------------------------------------------------------------------------
-- 8. STORAGE BUCKETS (ARCHIVOS, FIRMAS, COMPROBANTES, DOCUMENTOS)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('perfiles', 'perfiles', true),
    ('firmas', 'firmas', true),
    ('firmas-oficiales', 'firmas-oficiales', true),
    ('comprobantes', 'comprobantes', true),
    ('documentos-publicos', 'documentos-publicos', true),
    ('documentos-socios', 'documentos-socios', true),
    ('cartas-intencion', 'cartas-intencion', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- ----------------------------------------------------------------------------
-- 9. HABILITAR ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances_anuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directorio_cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postulaciones ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 10. POLÍTICAS DE SEGURIDAD (RLS) PARA TABLAS PÚBLICAS Y AUTENTICADAS
-- ----------------------------------------------------------------------------

-- Políticas de lectura
DROP POLICY IF EXISTS "allow_read_socios" ON public.socios;
CREATE POLICY "allow_read_socios" ON public.socios FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_write_socios" ON public.socios;
CREATE POLICY "allow_write_socios" ON public.socios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_read_cobros" ON public.cobros;
CREATE POLICY "allow_read_cobros" ON public.cobros FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_write_cobros" ON public.cobros;
CREATE POLICY "allow_write_cobros" ON public.cobros FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_read_egresos" ON public.egresos;
CREATE POLICY "allow_read_egresos" ON public.egresos FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_write_egresos" ON public.egresos;
CREATE POLICY "allow_write_egresos" ON public.egresos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_read_balances" ON public.balances_anuales;
CREATE POLICY "allow_read_balances" ON public.balances_anuales FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_write_balances" ON public.balances_anuales;
CREATE POLICY "allow_write_balances" ON public.balances_anuales FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_read_directorio" ON public.directorio_cargos;
CREATE POLICY "allow_read_directorio" ON public.directorio_cargos FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_write_directorio" ON public.directorio_cargos;
CREATE POLICY "allow_write_directorio" ON public.directorio_cargos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_read_postulaciones" ON public.postulaciones;
CREATE POLICY "allow_read_postulaciones" ON public.postulaciones FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_write_postulaciones" ON public.postulaciones;
CREATE POLICY "allow_write_postulaciones" ON public.postulaciones FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 11. POLÍTICAS DE ACCESO PARA STORAGE (OBJETOS)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "storage_public_read_all" ON storage.objects;
CREATE POLICY "storage_public_read_all" ON storage.objects 
FOR SELECT USING (
    bucket_id IN (
        'perfiles', 'firmas', 'firmas-oficiales', 'comprobantes', 
        'documentos-publicos', 'documentos-socios', 'cartas-intencion'
    )
);

DROP POLICY IF EXISTS "storage_upload_all" ON storage.objects;
CREATE POLICY "storage_upload_all" ON storage.objects 
FOR INSERT WITH CHECK (
    bucket_id IN (
        'perfiles', 'firmas', 'firmas-oficiales', 'comprobantes', 
        'documentos-publicos', 'documentos-socios', 'cartas-intencion'
    )
);

DROP POLICY IF EXISTS "storage_update_all" ON storage.objects;
CREATE POLICY "storage_update_all" ON storage.objects 
FOR UPDATE USING (
    bucket_id IN (
        'perfiles', 'firmas', 'firmas-oficiales', 'comprobantes', 
        'documentos-publicos', 'documentos-socios', 'cartas-intencion'
    )
);

DROP POLICY IF EXISTS "storage_delete_all" ON storage.objects;
CREATE POLICY "storage_delete_all" ON storage.objects 
FOR DELETE USING (
    bucket_id IN (
        'perfiles', 'firmas', 'firmas-oficiales', 'comprobantes', 
        'documentos-publicos', 'documentos-socios', 'cartas-intencion'
    )
);

-- ============================================================================
-- FIN DEL SCRIPT MAESTRO
-- ============================================================================
