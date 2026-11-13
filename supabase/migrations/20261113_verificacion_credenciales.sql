-- ============================================================================
-- PRUANED — Verificación Pública de Credenciales (Socios y Voluntarios QR)
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- ============================================================================

create or replace function public.pruaned_verify_credential(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_code text := upper(btrim(coalesce(p_code, '')));
  target text;
  target_rut text;
  socio_row public.socios;
  socio_json jsonb;
  vol_row public.voluntarios;
  vol_form jsonb;
  is_renunciante boolean := false;
begin
  if raw_code = '' then
    return jsonb_build_object('valid', false, 'message', 'Código vacío');
  end if;

  if raw_code like 'PRU-SOC-%' then
    target := substr(raw_code, 9);
    target_rut := regexp_replace(target, '[^0-9K]', '', 'g');

    select * into socio_row
    from public.socios s
    where (length(target_rut) >= 7 and regexp_replace(upper(coalesce(s.rut, '')), '[^0-9K]', '', 'g') = target_rut)
       or lower(s.id::text) = lower(target)
       or lower(left(s.id::text, 8)) = lower(target)
    limit 1;

    if found then
      socio_json := to_jsonb(socio_row);
      is_renunciante := (
        coalesce(socio_json ->> 'estado_socio', '') = 'Renunciante'
        or nullif(coalesce(socio_json ->> 'motivo_renuncia', ''), '') is not null
        or coalesce(socio_row.estado_cuota, '') ilike '%Desvinculad%'
        or coalesce(socio_row.estado_cuota, '') ilike '%Renuncia%'
      );

      return jsonb_build_object(
        'valid', not is_renunciante,
        'vigente', not is_renunciante,
        'type', 'socio',
        'code', raw_code,
        'nombre', socio_row.nombre,
        'rut', socio_row.rut,
        'categoria', coalesce(socio_row.categoria, 'Socio Activo'),
        'profesion', coalesce(socio_row.profesion, 'Profesional Asociado/a'),
        'region', coalesce(socio_row.region, 'Chile'),
        'estado', case when is_renunciante then 'Desvinculado / Retiro' else coalesce(socio_row.estado_cuota, 'Al Día') end,
        'fechaIngreso', socio_row.fecha_ingreso,
        'legalReference', 'Decreto Ley N° 2.757 de 1979'
      );
    end if;
  end if;

  if raw_code like 'PRU-VOL-%' then
    target := substr(raw_code, 9);
    target_rut := regexp_replace(target, '[^0-9K]', '', 'g');

    select * into vol_row
    from public.voluntarios v
    where (length(target_rut) >= 7 and regexp_replace(upper(coalesce(v.rut, '')), '[^0-9K]', '', 'g') = target_rut)
       or lower(v.id::text) = lower(target)
       or lower(left(v.id::text, 8)) = lower(target)
    limit 1;

    if found then
      vol_form := coalesce(vol_row.datos_postulacion -> 'formulario', '{}'::jsonb);
      return jsonb_build_object(
        'valid', coalesce(vol_row.estado, 'activo') = 'activo',
        'vigente', coalesce(vol_row.estado, 'activo') = 'activo',
        'type', 'voluntario',
        'code', raw_code,
        'nombre', vol_row.nombre,
        'rut', vol_row.rut,
        'nivelAcreditacion', coalesce(vol_row.nivel_acreditacion, 'Voluntario/a Permanente'),
        'profesion', coalesce(
          nullif(btrim(vol_form ->> 'profesionEspecialidad'), ''),
          nullif(btrim(vol_form ->> 'especialidad'), ''),
          nullif(btrim(vol_form ->> 'condicionAcademica'), ''),
          'Voluntariado Operativo'
        ),
        'region', coalesce(vol_row.region, nullif(btrim(vol_form ->> 'region'), ''), 'Chile'),
        'estado', coalesce(vol_row.estado, 'activo'),
        'fechaIngreso', vol_row.fecha_ingreso
      );
    end if;
  end if;

  return jsonb_build_object(
    'valid', false,
    'message', 'El código ingresado no se encuentra registrado en el Padrón Oficial de PRUANED A.G.'
  );
end;
$$;

revoke all on function public.pruaned_verify_credential(text) from public;
grant execute on function public.pruaned_verify_credential(text) to anon, authenticated;
