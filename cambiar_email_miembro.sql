-- =========================================================================
-- MIGRACIÓN: Función RPC para Cambio de Correo de Socios y Voluntarios
-- =========================================================================
-- Permite a Administradores (Master) y Miembros de la Directiva Nacional
-- modificar el correo de un socio o voluntario en caso de pérdida de acceso,
-- sincronizando la tabla respectiva (socios o voluntarios), auth.users y auditoría.

CREATE OR REPLACE FUNCTION public.pruaned_admin_change_member_email(
    p_tipo text,            -- 'socio' | 'voluntario'
    p_id uuid,              -- ID del socio o voluntario
    p_new_email text,       -- Nuevo correo electrónico
    p_motivo text DEFAULT 'Pérdida de acceso a correo anterior'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_clean_email text;
    v_old_email text;
    v_nombre text;
    v_rut text;
    v_actor_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
    -- 1. Validar autorización del operador (Master o Directiva)
    IF NOT (public.pruaned_is_master_user() OR public.pruaned_is_directiva()) THEN
        RAISE EXCEPTION 'No autorizado: sólo administradores o directiva nacional pueden cambiar correos' USING errcode = '42501';
    END IF;

    -- 2. Normalizar y validar formato del nuevo correo (RFC)
    v_clean_email := lower(btrim(coalesce(p_new_email, '')));
    IF v_clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
        RAISE EXCEPTION 'El formato del nuevo correo electrónico es inválido' USING errcode = '22023';
    END IF;

    -- 3. Validar unicidad: no debe pertenecer a otro socio o voluntario
    IF EXISTS (
        SELECT 1 FROM public.socios 
        WHERE lower(coalesce(email, '')) = v_clean_email AND id <> p_id
    ) THEN
        RAISE EXCEPTION 'El correo ya se encuentra registrado por otro socio en el padrón' USING errcode = '23505';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.voluntarios 
        WHERE lower(coalesce(email, '')) = v_clean_email AND id <> p_id
    ) THEN
        RAISE EXCEPTION 'El correo ya se encuentra registrado por otro voluntario en el padrón' USING errcode = '23505';
    END IF;

    -- 4. Actualizar tabla correspondiente
    IF p_tipo = 'socio' THEN
        SELECT email, nombre, rut INTO v_old_email, v_nombre, v_rut
        FROM public.socios WHERE id = p_id FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Socio no encontrado' USING errcode = 'P0002';
        END IF;

        UPDATE public.socios
        SET email = v_clean_email,
            updated_at = now()
        WHERE id = p_id;

    ELSIF p_tipo = 'voluntario' THEN
        SELECT email, nombre, rut INTO v_old_email, v_nombre, v_rut
        FROM public.voluntarios WHERE id = p_id FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Voluntario no encontrado' USING errcode = 'P0002';
        END IF;

        UPDATE public.voluntarios
        SET email = v_clean_email,
            updated_at = now()
        WHERE id = p_id;
    ELSE
        RAISE EXCEPTION 'Tipo de miembro inválido: debe ser "socio" o "voluntario"' USING errcode = '22023';
    END IF;

    -- 5. Sincronizar cuenta en auth.users si ya existía para el correo anterior
    IF v_old_email IS NOT NULL AND v_old_email <> '' THEN
        UPDATE auth.users
        SET email = v_clean_email,
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            updated_at = now()
        WHERE lower(email) = lower(v_old_email);
    END IF;

    -- 6. Registro de Auditoría Obligatorio
    INSERT INTO public.auditoria_logs (fecha, accion, usuario, severidad)
    VALUES (
        to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SSOF'),
        format('CAMBIO_EMAIL_%s_%s: de <%s> a <%s>. Motivo: %s', 
               upper(p_tipo), 
               COALESCE(v_rut, p_id::text), 
               COALESCE(v_old_email, 'sin-email'), 
               v_clean_email, 
               p_motivo),
        COALESCE(v_actor_email, 'directiva/admin'),
        'WARN'
    );

    RETURN jsonb_build_object(
        'success', true,
        'tipo', p_tipo,
        'id', p_id,
        'oldEmail', v_old_email,
        'newEmail', v_clean_email,
        'nombre', v_nombre,
        'rut', v_rut,
        'motivo', p_motivo
    );
END;
$$;

REVOKE ALL ON FUNCTION public.pruaned_admin_change_member_email(text, uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.pruaned_admin_change_member_email(text, uuid, text, text) TO authenticated;
