-- =========================================================================
-- FASE 1: Migración de Base de Datos y Funciones RPC para Excepciones y Cobros
-- PRUANED A.G. — Ejecutar en Supabase SQL Editor
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. Actualización de la tabla public.socios (Columnas de Estado y Auditoría)
-- -------------------------------------------------------------------------
ALTER TABLE public.socios 
    ADD COLUMN IF NOT EXISTS estado_socio text DEFAULT 'Activo',
    ADD COLUMN IF NOT EXISTS gracia_motivo text,
    ADD COLUMN IF NOT EXISTS gracia_desde date,
    ADD COLUMN IF NOT EXISTS gracia_hasta date,
    ADD COLUMN IF NOT EXISTS gracia_respaldo_acta text;

-- Sincronizar retroactivamente socios con solicitud de renuncia o retiro registrado
UPDATE public.socios
SET estado_socio = 'Renunciante'
WHERE (
    fecha_solicitud_renuncia IS NOT NULL 
    OR motivo_renuncia IS NOT NULL 
    OR fecha_retiro_oficial IS NOT NULL 
    OR estado_cuota ILIKE '%desvinculad%'
) 
AND (estado_socio IS NULL OR estado_socio = 'Activo');

-- Asegurar que el resto de socios tenga estado_socio 'Activo' por defecto
UPDATE public.socios
SET estado_socio = 'Activo'
WHERE estado_socio IS NULL;


-- -------------------------------------------------------------------------
-- 2. Función RPC para Generación Masiva de Cobro Mensual (Atómica e Idempotente)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generar_cobro_mensual_masivo(
    p_titulo_cobro text,
    p_monto_default integer DEFAULT 5000
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_socio RECORD;
    v_procesados integer := 0;
    v_exonerados integer := 0;
    v_ya_existentes integer := 0;
    v_monto_a_cobrar integer;
    v_titulo_clean text;
BEGIN
    v_titulo_clean := TRIM(p_titulo_cobro);

    IF v_titulo_clean IS NULL OR v_titulo_clean = '' THEN
        RETURN json_build_object(
            'status', 'error',
            'mensaje', 'El título de la cuota no puede estar vacío.'
        );
    END IF;

    -- Iterar sobre todos los socios registrados
    FOR v_socio IN 
        SELECT 
            id, 
            nombre, 
            rut, 
            categoria,
            monto_cuota_mensual, 
            estado_socio, 
            estado_cuota,
            gracia_desde,
            gracia_hasta
        FROM public.socios 
    LOOP
        -- REGLA 1: Excluir socios honorarios si no pagan cuota
        IF v_socio.categoria = 'Socio Honorario' THEN
            v_exonerados := v_exonerados + 1;
            CONTINUE;
        END IF;

        -- REGLA 2: Omitir si NO es activo (ej. Renunciante, Suspendido, Excluido de Cobro)
        IF COALESCE(v_socio.estado_socio, 'Activo') <> 'Activo' THEN
            v_exonerados := v_exonerados + 1;
            CONTINUE;
        END IF;

        -- REGLA 3: Omitir si su estado de cuota es Exento o Excluido de Cobro
        IF v_socio.estado_cuota IN ('Exento', 'Excluido de Cobro') THEN
            v_exonerados := v_exonerados + 1;
            CONTINUE;
        END IF;

        -- REGLA 4: Omitir si está 'En Gracia' (vigente)
        IF v_socio.estado_cuota = 'En Gracia' THEN
            -- Si tiene fecha de término y ya venció, se procesa; si no ha vencido o no tiene fecha fin, se exonera
            IF v_socio.gracia_hasta IS NULL OR v_socio.gracia_hasta >= CURRENT_DATE THEN
                v_exonerados := v_exonerados + 1;
                CONTINUE;
            END IF;
        END IF;

        -- REGLA 5: Idempotencia. Si ya se le emitió este cobro específico, no duplicar
        IF EXISTS (
            SELECT 1 FROM public.cobros 
            WHERE socio_id = v_socio.id 
              AND LOWER(TRIM(titulo)) = LOWER(v_titulo_clean)
        ) THEN
            v_ya_existentes := v_ya_existentes + 1;
            CONTINUE;
        END IF;

        -- Determinar monto (personalizado del socio o default)
        v_monto_a_cobrar := COALESCE(v_socio.monto_cuota_mensual, p_monto_default);

        -- Insertar el cobro programado en public.cobros
        INSERT INTO public.cobros (
            socio_id, 
            titulo, 
            monto, 
            pagado, 
            fecha_creacion
        ) VALUES (
            v_socio.id, 
            v_titulo_clean, 
            v_monto_a_cobrar, 
            false, 
            now()
        );

        -- Incrementar contador de meses adeudados y pasar a 'En Mora' si estaba 'Al Día'
        UPDATE public.socios
        SET meses_adeudados = COALESCE(meses_adeudados, 0) + 1,
            estado_cuota = CASE 
                WHEN estado_cuota = 'Al Día' THEN 'En Mora' 
                ELSE estado_cuota 
            END,
            updated_at = now()
        WHERE id = v_socio.id;

        v_procesados := v_procesados + 1;
    END LOOP;

    -- Retornar resumen de ejecución en formato JSON
    RETURN json_build_object(
        'status', 'success',
        'mensaje', 'Generación de cobros masivos completada exitosamente.',
        'titulo', v_titulo_clean,
        'socios_procesados', v_procesados,
        'socios_exonerados', v_exonerados,
        'cobros_ya_existentes', v_ya_existentes
    );
END;
$$;

-- Permisos de ejecución para la API de Supabase
GRANT EXECUTE ON FUNCTION public.generar_cobro_mensual_masivo(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generar_cobro_mensual_masivo(text, integer) TO service_role;


-- -------------------------------------------------------------------------
-- 3. Función RPC para Asignar / Revocar Meses de Gracia con Auditoría
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.asignar_meses_gracia(
    p_socio_id uuid,
    p_motivo text,
    p_desde date DEFAULT CURRENT_DATE,
    p_hasta date DEFAULT NULL,
    p_acta text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.socios
    SET 
        estado_cuota = 'En Gracia',
        gracia_motivo = p_motivo,
        gracia_desde = p_desde,
        gracia_hasta = p_hasta,
        gracia_respaldo_acta = p_acta,
        updated_at = now()
    WHERE id = p_socio_id;

    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'mensaje', 'Socio no encontrado.');
    END IF;

    RETURN json_build_object(
        'status', 'success', 
        'mensaje', 'Meses de gracia aplicados con éxito.',
        'socio_id', p_socio_id,
        'hasta', p_hasta
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.asignar_meses_gracia(uuid, text, date, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.asignar_meses_gracia(uuid, text, date, date, text) TO service_role;
