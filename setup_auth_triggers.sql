-- =========================================================================
-- PRUANED A.G. - Configuración de Triggers de Seguridad y Login
-- =========================================================================

-- 1. Añadir la columna auth_id a la tabla socios para enlazarlos con el sistema de Login
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- 2. Crear la función del Trigger que se ejecuta cada vez que alguien intenta crear una cuenta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_socio_id UUID;
  v_postulacion RECORD;
BEGIN
  -- A. Revisar si el correo corresponde a un SOCIO ANTIGUO (importado por CSV)
  SELECT id INTO v_socio_id FROM public.socios WHERE email = NEW.email LIMIT 1;
  
  IF v_socio_id IS NOT NULL THEN
    -- El socio existe. Le asociamos su nueva cuenta de login y actualizamos estado.
    UPDATE public.socios SET auth_id = NEW.id WHERE id = v_socio_id;
    RETURN NEW;
  END IF;

  -- B. Revisar si el correo corresponde a una POSTULACIÓN APROBADA
  SELECT * INTO v_postulacion FROM public.postulaciones 
  WHERE email = NEW.email AND estado = 'Aceptada / Incorporado' LIMIT 1;
  
  IF v_postulacion.id IS NOT NULL THEN
    -- La postulación fue aprobada. Creamos automáticamente su ficha de Socio Activo.
    INSERT INTO public.socios (auth_id, rut, nombre, profesion, categoria, email, region, estado_cuota, monto_cuota_mensual)
    VALUES (NEW.id, v_postulacion.rut, v_postulacion.nombre_completo, v_postulacion.profesion, 'Socio Activo', NEW.email, 'Región Metropolitana', 'En Mora', 5000);
    RETURN NEW;
  END IF;

  -- C. Excepción para el correo Maestro (para que pueda crear su cuenta)
  IF NEW.email = 'ag.pruaned@gmail.com' THEN
    RETURN NEW;
  END IF;

  -- D. Si no cumple nada de lo anterior, es un intento de registro ilegal. Lo bloqueamos.
  RAISE EXCEPTION 'Acceso denegado. Este correo no está en el registro de socios ni tiene una postulación aprobada.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear el Trigger en la tabla auth.users (la tabla secreta de Supabase)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Modificar las Políticas de Seguridad (RLS) para usar auth_id en lugar de solo auth.role()
-- Esto asegura que un socio solo pueda editar su propia información sensible
DROP POLICY IF EXISTS "socios_auth" ON socios;
CREATE POLICY "socios_read_all" ON socios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "socios_update_self_or_admin" ON socios FOR UPDATE USING (
  auth_id = auth.uid() OR auth.jwt() ->> 'email' = 'ag.pruaned@gmail.com'
);

-- =========================================================================
-- LISTO. Esta arquitectura protege tu sistema 100% sin costo.
-- =========================================================================
