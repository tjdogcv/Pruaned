-- PRUANED — Contrato de ficha completa y activación segura de voluntariado.
-- La invitación se envía exclusivamente desde la Edge Function invite-volunteer.
-- Ninguna clave de servicio se almacena ni se expone en el cliente.

alter table public.voluntarios
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists auth_activation_status text not null default 'pendiente_invitacion',
  add column if not exists invitacion_solicitada_at timestamptz,
  add column if not exists ultima_invitacion_at timestamptz,
  add column if not exists activado_at timestamptz,
  add column if not exists ultimo_error_invitacion text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'voluntarios_auth_activation_status_check') then
    alter table public.voluntarios add constraint voluntarios_auth_activation_status_check check (
      auth_activation_status in (
        'pendiente_invitacion', 'invitacion_en_curso', 'invitado',
        'pendiente_confirmacion', 'activo', 'error_invitacion'
      )
    );
  end if;
end $$;

create unique index if not exists voluntarios_auth_user_id_unico
  on public.voluntarios (auth_user_id) where auth_user_id is not null;

-- Sincroniza sólo identidad y estado de activación; no copia metadata de Auth.
create or replace function public.pruaned_sync_volunteer_auth_activation()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if new.email is null or btrim(new.email) = '' then
    return new;
  end if;

  update public.voluntarios
  set
    auth_user_id = new.id,
    auth_activation_status = case when new.email_confirmed_at is not null then 'activo' else 'pendiente_confirmacion' end,
    activado_at = case when new.email_confirmed_at is not null then coalesce(activado_at, now()) else activado_at end,
    ultimo_error_invitacion = null,
    updated_at = now()
  where lower(coalesce(email, '')) = lower(new.email);

  return new;
end;
$$;

drop trigger if exists pruaned_sync_volunteer_auth_activation on auth.users;
create trigger pruaned_sync_volunteer_auth_activation
  after insert or update of email, email_confirmed_at on auth.users
  for each row execute function public.pruaned_sync_volunteer_auth_activation();

-- Refleja cuentas preexistentes al aplicar la migración.
update public.voluntarios volunteer
set
  auth_user_id = auth_user.id,
  auth_activation_status = case when auth_user.email_confirmed_at is not null then 'activo' else 'pendiente_confirmacion' end,
  activado_at = case when auth_user.email_confirmed_at is not null then coalesce(volunteer.activado_at, now()) else volunteer.activado_at end,
  ultimo_error_invitacion = null,
  updated_at = now()
from auth.users auth_user
where lower(coalesce(volunteer.email, '')) = lower(coalesce(auth_user.email, ''));

-- Contrato aditivo: conserva las claves históricas y añade la ficha íntegra.
create or replace function public.pruaned_volunteer_application_contract(
  p_application public.postulaciones_voluntariado
)
returns jsonb language sql stable security definer set search_path = public as $$
  select to_jsonb(p_application) || jsonb_build_object(
    'ficha_completa', coalesce(p_application.formulario_completo, '{}'::jsonb),
    'estado_activacion', coalesce(volunteer.auth_activation_status, 'pendiente_invitacion'),
    'ultima_invitacion_at', volunteer.ultima_invitacion_at,
    'activado_at', volunteer.activado_at
  )
  from public.voluntarios volunteer
  where volunteer.id = p_application.voluntario_id
  union all
  select to_jsonb(p_application) || jsonb_build_object(
    'ficha_completa', coalesce(p_application.formulario_completo, '{}'::jsonb),
    'estado_activacion', 'pendiente_invitacion',
    'ultima_invitacion_at', null,
    'activado_at', null
  )
  where p_application.voluntario_id is null
  limit 1;
$$;

create or replace function public.pruaned_list_volunteer_applications()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.pruaned_can_manage_voluntarios() then coalesce(
    jsonb_agg(public.pruaned_volunteer_application_contract(application) order by application.created_at desc),
    '[]'::jsonb
  ) else '[]'::jsonb end
  from public.postulaciones_voluntariado application;
$$;

create or replace function public.pruaned_list_my_volunteer_applications()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(
    jsonb_agg(public.pruaned_volunteer_application_contract(application) order by application.created_at desc),
    '[]'::jsonb
  )
  from public.postulaciones_voluntariado application
  where auth.uid() is not null
    and lower(application.email) = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.pruaned_get_volunteer_application_detail(p_application_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare application public.postulaciones_voluntariado;
begin
  select * into application from public.postulaciones_voluntariado where id = p_application_id;
  if not found then raise exception 'Solicitud no encontrada' using errcode = 'P0002'; end if;
  if not public.pruaned_can_manage_voluntarios()
    and (auth.uid() is null or lower(application.email) <> lower(coalesce(auth.jwt() ->> 'email', ''))) then
    raise exception 'No tiene permiso para consultar esta solicitud' using errcode = '42501';
  end if;
  return public.pruaned_volunteer_application_contract(application);
end;
$$;

-- Mantiene la firma de revisión y normaliza su respuesta al mismo contrato que
-- el listado. La transición de negocio sigue siendo atómica y autorizada.
create or replace function public.pruaned_review_volunteer_application(
  p_application_id uuid, p_decision text, p_review_note text default ''
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare application public.postulaciones_voluntariado; volunteer public.voluntarios;
begin
  if not public.pruaned_can_manage_voluntarios() then
    raise exception 'Permiso de gestión de voluntariado requerido' using errcode = '42501';
  end if;
  if p_decision not in ('aprobar', 'rechazar') then
    raise exception 'Decisión inválida' using errcode = '22023';
  end if;
  select * into application from public.postulaciones_voluntariado where id = p_application_id for update;
  if not found then raise exception 'Solicitud no encontrada' using errcode = 'P0002'; end if;
  if application.tipo <> 'ingreso' or application.estado <> 'pendiente' then
    raise exception 'La solicitud no puede volver a revisarse' using errcode = 'P0001';
  end if;

  if p_decision = 'aprobar' then
    select * into volunteer from public.voluntarios
      where rut = application.rut or lower(coalesce(email, '')) = lower(application.email) for update;
    if found and (volunteer.rut <> application.rut or lower(coalesce(volunteer.email, '')) <> lower(application.email)) then
      raise exception 'RUT o correo ya asociado a otra ficha de voluntariado' using errcode = '23505';
    end if;
    if found then
      update public.voluntarios set
        nombre = application.nombre_completo, telefono = coalesce(application.telefono, telefono),
        region = coalesce(application.region, region), estado = 'activo', origen = 'postulacion_voluntariado',
        postulacion_origen_id = application.id,
        datos_postulacion = coalesce(datos_postulacion, '{}'::jsonb) || jsonb_build_object('formulario', application.formulario_completo)
      where id = volunteer.id returning * into volunteer;
    else
      insert into public.voluntarios (
        rut, nombre, email, telefono, region, disponibilidad_respuesta, estado, origen, postulacion_origen_id, datos_postulacion
      ) values (
        application.rut, application.nombre_completo, application.email, application.telefono, application.region,
        application.disponibilidad, 'activo', 'postulacion_voluntariado', application.id,
        jsonb_build_object('formulario', application.formulario_completo)
      ) returning * into volunteer;
    end if;
    update public.postulaciones_voluntariado set estado = 'aprobada', voluntario_id = volunteer.id,
      observacion_revision = nullif(btrim(coalesce(p_review_note, '')), ''), revisada_por = auth.uid(), fecha_revision = now(), updated_at = now()
    where id = application.id returning * into application;
  else
    update public.postulaciones_voluntariado set estado = 'rechazada',
      observacion_revision = nullif(btrim(coalesce(p_review_note, '')), ''), revisada_por = auth.uid(), fecha_revision = now(), updated_at = now()
    where id = application.id returning * into application;
  end if;
  return jsonb_build_object(
    'application', public.pruaned_volunteer_application_contract(application),
    'voluntario', case when volunteer.id is null then null else to_jsonb(volunteer) end
  );
end;
$$;

-- Reserva una invitación de forma transaccional; sólo la Edge Function puede
-- usar esta reserva para llamar al administrador de Supabase Auth.
create or replace function public.pruaned_prepare_volunteer_invitation(p_voluntario_id uuid)
returns table(voluntario_id uuid, email text)
language plpgsql security definer set search_path = public as $$
declare volunteer public.voluntarios;
begin
  if not public.pruaned_can_manage_voluntarios() then
    raise exception 'Permiso de gestión de voluntariado requerido' using errcode = '42501';
  end if;
  select * into volunteer from public.voluntarios where id = p_voluntario_id for update;
  if not found then raise exception 'Ficha de voluntario no encontrada' using errcode = 'P0002'; end if;
  if volunteer.auth_activation_status = 'activo' then
    raise exception 'La cuenta del voluntario ya está activada' using errcode = 'P0001';
  end if;
  if volunteer.invitacion_solicitada_at is not null
    and volunteer.invitacion_solicitada_at > now() - interval '5 minutes' then
    raise exception 'Espere antes de reenviar otra invitación' using errcode = 'P0001';
  end if;
  if volunteer.email is null or btrim(volunteer.email) = '' then
    raise exception 'La ficha no tiene un correo válido' using errcode = '22023';
  end if;

  update public.voluntarios
  set auth_activation_status = 'invitacion_en_curso', invitacion_solicitada_at = now(),
      ultimo_error_invitacion = null, updated_at = now()
  where id = volunteer.id;
  return query select volunteer.id, lower(volunteer.email);
end;
$$;

revoke all on function public.pruaned_volunteer_application_contract(public.postulaciones_voluntariado) from public;
revoke all on function public.pruaned_get_volunteer_application_detail(uuid) from public;
revoke all on function public.pruaned_prepare_volunteer_invitation(uuid) from public;
grant execute on function public.pruaned_get_volunteer_application_detail(uuid) to authenticated;
grant execute on function public.pruaned_prepare_volunteer_invitation(uuid) to authenticated;
