-- PRUANED A.G. — privacidad del libro de donaciones
-- Ejecutar después de 20260817_cuentas_publicas_donaciones.sql.
-- La transparencia publica sólo movimiento, cuenta, categoría y monto.

BEGIN;

-- Vista deliberadamente mínima para Transparencia. No expone donante, RUT,
-- identificador de usuario ni metadatos internos del libro contable.
CREATE OR REPLACE VIEW public.donaciones_publicas AS
SELECT
  id,
  fecha,
  numero_comprobante,
  banco,
  categoria,
  monto,
  cuenta_id
FROM public.donaciones
WHERE publico = true;

REVOKE ALL ON TABLE public.donaciones_publicas FROM PUBLIC;
GRANT SELECT ON TABLE public.donaciones_publicas TO anon, authenticated;

-- El libro completo, que sí contiene datos personales, queda sólo para
-- Tesorería/Directorio. Se sustituye la política heredada demasiado amplia.
ALTER TABLE public.donaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS donaciones_auth ON public.donaciones;
DROP POLICY IF EXISTS donaciones_select_gestor ON public.donaciones;
DROP POLICY IF EXISTS donaciones_insert_gestor ON public.donaciones;
DROP POLICY IF EXISTS donaciones_update_gestor ON public.donaciones;
DROP POLICY IF EXISTS donaciones_delete_gestor ON public.donaciones;

CREATE POLICY donaciones_select_gestor ON public.donaciones
  FOR SELECT TO authenticated
  USING (public.pruaned_is_finance_manager());

CREATE POLICY donaciones_insert_gestor ON public.donaciones
  FOR INSERT TO authenticated
  WITH CHECK (public.pruaned_is_finance_manager());

CREATE POLICY donaciones_update_gestor ON public.donaciones
  FOR UPDATE TO authenticated
  USING (public.pruaned_is_finance_manager())
  WITH CHECK (public.pruaned_is_finance_manager());

CREATE POLICY donaciones_delete_gestor ON public.donaciones
  FOR DELETE TO authenticated
  USING (public.pruaned_is_finance_manager());

COMMIT;
