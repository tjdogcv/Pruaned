-- PRUANED A.G. — RUT público del titular de cuentas receptoras
-- Ejecutar después de 20260817_cuentas_publicas_donaciones.sql.

BEGIN;

ALTER TABLE public.cuentas_financieras
  ADD COLUMN IF NOT EXISTS rut_titular text;

ALTER TABLE public.cuentas_financieras
  DROP CONSTRAINT IF EXISTS cuentas_financieras_rut_titular_formato_check;
ALTER TABLE public.cuentas_financieras
  ADD CONSTRAINT cuentas_financieras_rut_titular_formato_check
  CHECK (
    rut_titular IS NULL
    OR rut_titular ~ '^[0-9]{1,2}(\.[0-9]{3}){2}-[0-9Kk]$'
  );

-- Una cuenta sin RUT se conserva para completar el dato, pero no se publica
-- ni se ofrece como destino de nuevas donaciones hasta que esté regularizada.
DROP POLICY IF EXISTS cuentas_financieras_publicas_lectura ON public.cuentas_financieras;
CREATE POLICY cuentas_financieras_publicas_lectura ON public.cuentas_financieras
  FOR SELECT
  USING (
    publicada = true
    AND activa = true
    AND nullif(btrim(rut_titular), '') IS NOT NULL
  );

COMMIT;
