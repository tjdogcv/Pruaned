-- PRUANED A.G. — Fondo de donaciones y categorías financieras
-- Ejecutar una vez en Supabase SQL Editor, después de las migraciones LMS.
-- Es idempotente: puede volver a ejecutarse sin duplicar columnas, categorías o políticas propias.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Alinea el libro de donaciones con el cliente actual y conserva cualquier dato legado.
ALTER TABLE public.donaciones ADD COLUMN IF NOT EXISTS monto integer;
ALTER TABLE public.donaciones ADD COLUMN IF NOT EXISTS numero_comprobante text;
ALTER TABLE public.donaciones ADD COLUMN IF NOT EXISTS banco text;
ALTER TABLE public.donaciones ADD COLUMN IF NOT EXISTS metodo_pago text;
ALTER TABLE public.donaciones ADD COLUMN IF NOT EXISTS codigo_transaccion text;
ALTER TABLE public.donaciones ADD COLUMN IF NOT EXISTS categoria text;
ALTER TABLE public.donaciones ADD COLUMN IF NOT EXISTS publico boolean NOT NULL DEFAULT true;

-- Las primeras versiones usaban monto_clp y n_comprobante. La copia sólo se
-- ejecuta si esas columnas aún existen en la base que se está migrando.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'donaciones' AND column_name = 'monto_clp'
  ) THEN
    EXECUTE 'UPDATE public.donaciones SET monto = COALESCE(monto, monto_clp) WHERE monto IS NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'donaciones' AND column_name = 'n_comprobante'
  ) THEN
    EXECUTE 'UPDATE public.donaciones SET numero_comprobante = COALESCE(numero_comprobante, n_comprobante) WHERE numero_comprobante IS NULL';
  END IF;
END;
$$;

-- Si la instalación antigua aún exige monto_clp, se mantiene sincronizada con
-- el nuevo campo monto sin obligar al cliente a conocer dos esquemas.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'donaciones' AND column_name = 'monto_clp'
  ) THEN
    EXECUTE $legacy$
      CREATE OR REPLACE FUNCTION public.sync_donaciones_monto_legacy()
      RETURNS trigger
      LANGUAGE plpgsql
      SET search_path = public
      AS $body$
      BEGIN
        NEW.monto := COALESCE(NEW.monto, NEW.monto_clp);
        NEW.monto_clp := COALESCE(NEW.monto_clp, NEW.monto);
        RETURN NEW;
      END;
      $body$;
    $legacy$;
    EXECUTE 'DROP TRIGGER IF EXISTS trg_sync_donaciones_monto_legacy ON public.donaciones';
    EXECUTE 'CREATE TRIGGER trg_sync_donaciones_monto_legacy BEFORE INSERT OR UPDATE ON public.donaciones FOR EACH ROW EXECUTE FUNCTION public.sync_donaciones_monto_legacy()';
  END IF;
END;
$$;

UPDATE public.donaciones
SET categoria = COALESCE(NULLIF(btrim(categoria), ''), NULLIF(btrim(destino_aporte), ''), 'Aporte libre')
WHERE categoria IS NULL OR btrim(categoria) = '';

-- Cada egreso pertenece explícitamente a cuotas o al Fondo de Donaciones.
ALTER TABLE public.egresos
  ADD COLUMN IF NOT EXISTS origen_fondo text NOT NULL DEFAULT 'Fondo Cuotas';

UPDATE public.egresos
SET origen_fondo = 'Fondo Cuotas'
WHERE origen_fondo IS NULL OR btrim(origen_fondo) = '';

UPDATE public.egresos
SET origen_fondo = CASE
  WHEN lower(origen_fondo) LIKE '%donac%' THEN 'Fondo Donaciones'
  ELSE 'Fondo Cuotas'
END
WHERE origen_fondo NOT IN ('Fondo Cuotas', 'Fondo Donaciones');

ALTER TABLE public.egresos DROP CONSTRAINT IF EXISTS egresos_origen_fondo_fondo_check;
ALTER TABLE public.egresos
  ADD CONSTRAINT egresos_origen_fondo_fondo_check
  CHECK (origen_fondo IN ('Fondo Cuotas', 'Fondo Donaciones'));

-- Las categorías son administrables y se archivan para no alterar registros históricos.
CREATE TABLE IF NOT EXISTS public.categorias_financieras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('donacion_ingreso', 'donacion_egreso')),
  nombre text NOT NULL CHECK (char_length(btrim(nombre)) BETWEEN 2 AND 100),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid()
);

CREATE UNIQUE INDEX IF NOT EXISTS categorias_financieras_tipo_nombre_unico
  ON public.categorias_financieras (tipo, lower(btrim(nombre)));
CREATE INDEX IF NOT EXISTS egresos_origen_fondo_fecha_idx
  ON public.egresos (origen_fondo, fecha DESC);
CREATE INDEX IF NOT EXISTS donaciones_categoria_fecha_idx
  ON public.donaciones (categoria, fecha DESC);

INSERT INTO public.categorias_financieras (tipo, nombre)
SELECT catalogo.tipo, catalogo.nombre
FROM (
  VALUES
    ('donacion_ingreso', 'Aporte libre'),
    ('donacion_ingreso', 'Campaña de recaudación'),
    ('donacion_ingreso', 'Convenio o alianza'),
    ('donacion_ingreso', 'Aporte con destino específico'),
    ('donacion_egreso', 'Insumos médicos veterinarios'),
    ('donacion_egreso', 'Alimentación y albergue'),
    ('donacion_egreso', 'Logística y transporte'),
    ('donacion_egreso', 'Operativo de emergencia'),
    ('donacion_egreso', 'Capacitación y materiales')
) AS catalogo(tipo, nombre)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.categorias_financieras AS existente
  WHERE existente.tipo = catalogo.tipo
    AND lower(btrim(existente.nombre)) = lower(btrim(catalogo.nombre))
);

-- El permiso de servidor replica el criterio institucional: cuenta maestra o
-- integrante vigente del Directorio Nacional. No depende de un flag del navegador.
CREATE OR REPLACE FUNCTION public.pruaned_is_finance_manager()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF auth.role() <> 'authenticated' OR requester_email = '' THEN
    RETURN false;
  END IF;

  IF requester_email = 'ag.pruaned@gmail.com' THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.socios AS socio
    CROSS JOIN public.directorio_cargos AS cargos
    WHERE lower(coalesce(socio.email, '')) = requester_email
      AND socio.id IN (
        cargos.presidente_id,
        cargos.vicepresidente_id,
        cargos.secretario_id,
        cargos.tesorero_id
      )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.pruaned_is_finance_manager() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pruaned_is_finance_manager() TO authenticated;

ALTER TABLE public.categorias_financieras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS categorias_financieras_select_manager ON public.categorias_financieras;
DROP POLICY IF EXISTS categorias_financieras_insert_manager ON public.categorias_financieras;
DROP POLICY IF EXISTS categorias_financieras_update_manager ON public.categorias_financieras;

CREATE POLICY categorias_financieras_select_manager
  ON public.categorias_financieras
  FOR SELECT TO authenticated
  USING (public.pruaned_is_finance_manager());

CREATE POLICY categorias_financieras_insert_manager
  ON public.categorias_financieras
  FOR INSERT TO authenticated
  WITH CHECK (
    public.pruaned_is_finance_manager()
    AND created_by = auth.uid()
  );

CREATE POLICY categorias_financieras_update_manager
  ON public.categorias_financieras
  FOR UPDATE TO authenticated
  USING (public.pruaned_is_finance_manager())
  WITH CHECK (public.pruaned_is_finance_manager());

COMMIT;
