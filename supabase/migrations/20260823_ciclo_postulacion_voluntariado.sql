-- PRUANED — Ciclo seguro de postulación, ingreso y promoción de voluntariado.
-- Esta migración no crea usuarios de Auth: el acceso se habilita cuando la
-- persona aprobada inicia sesión con el correo registrado en su ficha.

create table if not exists public.postulaciones_voluntariado (
  id uuid primary key default uuid_generate_v4(),
  tipo text not null default 'ingreso',
  estado text not null default 'pendiente',
  nombre_completo text not null,
  rut text not null,
  email text not null,
  telefono text,
  region text,
  comuna text,
  profesion_especialidad text,
  disponibilidad text,
  formulario_completo jsonb not null default '{}'::jsonb,
  origen_postulacion_socio_id uuid references public.postulaciones(id) on delete set null,
  voluntario_id uuid references public.voluntarios(id) on delete set null,
  socio_id uuid references public.socios(id) on delete set null,
  observacion_revision text,
  revisada_por uuid references auth.users(id) on delete set null,
  fecha_revision timestamptz,
  creada_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.postulaciones_voluntariado
  add column if not exists tipo text not null default 'ingreso',
  add column if not exists estado text not null default 'pendiente',
  add column if not exists formulario_completo jsonb not null default '{}'::jsonb,
  add column if not exists origen_postulacion_socio_id uuid references public.postulaciones(id) on delete set null,
  add column if not exists voluntario_id uuid references public.voluntarios(id) on delete set null,
  add column if not exists socio_id uuid references public.socios(id) on delete set null,
  add column if not exists observacion_revision text,
  add column if not exists revisada_por uuid references auth.users(id) on delete set null,
  add column if not exists fecha_revision timestamptz,
  add column if not exists creada_por uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'postulaciones_voluntariado_tipo_check') then
    alter table public.postulaciones_voluntariado add constraint postulaciones_voluntariado_tipo_check
      check (tipo in ('ingreso', 'ascenso_socio', 'derivada_socio'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'postulaciones_voluntariado_estado_check') then
    alter table public.postulaciones_voluntariado add constraint postulaciones_voluntariado_estado_check
      check (estado in ('pendiente', 'aprobada', 'rechazada', 'cancelada'));
  end if;
end $$;

alter table public.voluntarios
  add column if not exists estado text not null default 'activo',
  add column if not exists origen text not null default 'postulacion_voluntariado',
  add column if not exists postulacion_origen_id uuid references public.postulaciones_voluntariado(id) on delete set null,
  add column if not exists datos_postulacion jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'voluntarios_estado_check') then
    alter table public.voluntarios add constraint voluntarios_estado_check check (estado in ('activo', 'inactivo'));
  end if;
end $$;

create unique index if not exists postulaciones_voluntariado_pendiente_por_email
  on public.postulaciones_voluntariado (lower(email)) where estado = 'pendiente';
create unique index if not exists postulaciones_voluntariado_origen_socio_unico
  on public.postulaciones_voluntariado (origen_postulacion_socio_id) where origen_postulacion_socio_id is not null;
create index if not exists postulaciones_voluntariado_estado_created_at_idx
  on public.postulaciones_voluntariado (estado, created_at desc);
create index if not exists postulaciones_voluntariado_email_idx
  on public.postulaciones_voluntariado (lower(email));

create or replace function public.pruaned_is_master_user()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.role() = 'authenticated'
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'ag.pruaned@gmail.com';
$$;

create or replace function public.pruaned_is_directiva()
returns boolean language sql stable security definer set search_path = public as $$
  select public.pruaned_is_master_user() or exists (
    select 1
    from public.socios socio
    join public.directorio_cargos cargo on cargo.id = 1
    where lower(coalesce(socio.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and socio.id in (cargo.presidente_id, cargo.vicepresidente_id, cargo.secretario_id, cargo.tesorero_id)
  );
$$;

create or replace function public.pruaned_can_manage_voluntarios()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.role() = 'authenticated' and (
    public.pruaned_is_directiva()
    or exists (
      select 1 from public.socios socio
      where lower(coalesce(socio.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and coalesce(socio.permiso_gestion_voluntarios, false)
    )
    or exists (select 1 from public.lms_managers manager where manager.user_id = auth.uid())
  );
$$;

create or replace function public.pruaned_application_text(
  p_payload jsonb, p_key text, p_required boolean default false, p_max_length integer default 5000
)
returns text language plpgsql immutable set search_path = public as $$
declare value text := btrim(coalesce(p_payload ->> p_key, ''));
begin
  if p_required and value = '' then
    raise exception 'Falta el campo obligatorio: %', p_key using errcode = '22023';
  end if;
  if char_length(value) > p_max_length then
    raise exception 'El campo % excede el máximo permitido', p_key using errcode = '22023';
  end if;
  return nullif(value, '');
end;
$$;

create or replace function public.pruaned_submit_volunteer_application(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  application public.postulaciones_voluntariado;
  applicant_email text;
  applicant_rut text;
  applicant_name text;
begin
  if jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Formulario inválido' using errcode = '22023';
  end if;
  applicant_name := public.pruaned_application_text(p_payload, 'nombreCompleto', true, 180);
  applicant_rut := upper(public.pruaned_application_text(p_payload, 'rut', true, 15));
  applicant_email := lower(public.pruaned_application_text(p_payload, 'email', true, 254));
  if applicant_rut !~ '^[0-9]{7,8}-?[0-9K]$' then raise exception 'RUT inválido' using errcode = '22023'; end if;
  if applicant_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Correo inválido' using errcode = '22023'; end if;
  if coalesce(p_payload ->> 'aceptaTerminos', 'false') <> 'true' then
    raise exception 'Debe aceptar el tratamiento de datos' using errcode = '22023';
  end if;
  if auth.uid() is not null and lower(coalesce(auth.jwt() ->> 'email', '')) <> applicant_email then
    raise exception 'El correo debe coincidir con la sesión' using errcode = '42501';
  end if;
  if exists (select 1 from public.voluntarios where rut = applicant_rut or lower(coalesce(email, '')) = applicant_email) then
    raise exception 'Ya existe una ficha de voluntariado para estos datos' using errcode = '23505';
  end if;
  if exists (select 1 from public.postulaciones_voluntariado where estado = 'pendiente' and lower(email) = applicant_email) then
    raise exception 'Ya existe una solicitud pendiente para este correo' using errcode = '23505';
  end if;

  insert into public.postulaciones_voluntariado (
    tipo, estado, nombre_completo, rut, email, telefono, region, comuna,
    profesion_especialidad, disponibilidad, formulario_completo, creada_por
  ) values (
    'ingreso', 'pendiente', applicant_name, applicant_rut, applicant_email,
    public.pruaned_application_text(p_payload, 'telefono', false, 40),
    public.pruaned_application_text(p_payload, 'region', false, 120),
    public.pruaned_application_text(p_payload, 'comuna', false, 120),
    public.pruaned_application_text(p_payload, 'profesionEspecialidad', false, 300),
    public.pruaned_application_text(p_payload, 'disponibilidad', false, 500),
    p_payload, auth.uid()
  ) returning * into application;
  return to_jsonb(application);
end;
$$;

create or replace function public.pruaned_submit_socio_application(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  application public.postulaciones;
  form_payload jsonb := coalesce(p_payload -> 'formularioCompleto', p_payload -> 'formulario_completo', p_payload);
  applicant_email text;
  applicant_rut text;
begin
  if jsonb_typeof(p_payload) <> 'object' or jsonb_typeof(form_payload) <> 'object' then
    raise exception 'Formulario inválido' using errcode = '22023';
  end if;
  applicant_rut := upper(public.pruaned_application_text(form_payload, 'rut', true, 15));
  applicant_email := lower(public.pruaned_application_text(form_payload, 'email', true, 254));
  if applicant_rut !~ '^[0-9]{7,8}-?[0-9K]$' then raise exception 'RUT inválido' using errcode = '22023'; end if;
  if applicant_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Correo inválido' using errcode = '22023'; end if;
  if coalesce(form_payload ->> 'aceptaLeyDatos', '') not in ('Sí, acepto', 'true') then raise exception 'Debe aceptar el tratamiento de datos' using errcode = '22023'; end if;
  if auth.uid() is not null and lower(coalesce(auth.jwt() ->> 'email', '')) <> applicant_email then raise exception 'El correo debe coincidir con la sesión' using errcode = '42501'; end if;
  if exists (select 1 from public.postulaciones where estado = 'Pendiente Revisión Directorio' and (rut = applicant_rut or lower(email) = applicant_email)) then
    raise exception 'Ya existe una postulación de socio pendiente' using errcode = '23505';
  end if;
  insert into public.postulaciones (fecha_envio, estado, nombre_completo, rut, fecha_nacimiento, email, telefono, profesion, razones_integracion, formulario_completo)
  values (
    current_date, 'Pendiente Revisión Directorio', public.pruaned_application_text(form_payload, 'nombreCompleto', true, 180), applicant_rut,
    nullif(form_payload ->> 'fechaNacimiento', '')::date, applicant_email, public.pruaned_application_text(form_payload, 'telefono', false, 40),
    public.pruaned_application_text(form_payload, 'profesion', false, 300), public.pruaned_application_text(form_payload, 'razonesIntegracion', false, 5000), form_payload
  ) returning * into application;
  return to_jsonb(application);
end;
$$;

create or replace function public.pruaned_review_volunteer_application(
  p_application_id uuid, p_decision text, p_review_note text default ''
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare application public.postulaciones_voluntariado; volunteer public.voluntarios;
begin
  if not public.pruaned_can_manage_voluntarios() then raise exception 'Permiso de gestión de voluntariado requerido' using errcode = '42501'; end if;
  if p_decision not in ('aprobar', 'rechazar') then raise exception 'Decisión inválida' using errcode = '22023'; end if;
  select * into application from public.postulaciones_voluntariado where id = p_application_id for update;
  if not found then raise exception 'Solicitud no encontrada' using errcode = 'P0002'; end if;
  if application.tipo <> 'ingreso' or application.estado <> 'pendiente' then raise exception 'La solicitud no puede volver a revisarse' using errcode = 'P0001'; end if;

  if p_decision = 'aprobar' then
    select * into volunteer from public.voluntarios where rut = application.rut or lower(coalesce(email, '')) = lower(application.email) for update;
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
  return jsonb_build_object('application', to_jsonb(application), 'voluntario', case when volunteer.id is null then null else to_jsonb(volunteer) end);
end;
$$;

create or replace function public.pruaned_request_volunteer_membership(p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare volunteer public.voluntarios; application public.postulaciones_voluntariado; requester_email text;
begin
  if auth.uid() is null then raise exception 'Sesión autenticada requerida' using errcode = '42501'; end if;
  if jsonb_typeof(p_payload) <> 'object' then raise exception 'Solicitud inválida' using errcode = '22023'; end if;
  requester_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  select * into volunteer from public.voluntarios where lower(coalesce(email, '')) = requester_email and estado = 'activo' for update;
  if not found then raise exception 'Sólo voluntarios activos pueden solicitar ingreso como socio' using errcode = '42501'; end if;
  if exists (select 1 from public.socios where lower(coalesce(email, '')) = requester_email or rut = volunteer.rut) then
    raise exception 'Ya existe una ficha de socio para este voluntario' using errcode = '23505';
  end if;
  if exists (select 1 from public.postulaciones_voluntariado where tipo = 'ascenso_socio' and estado = 'pendiente' and voluntario_id = volunteer.id) then
    raise exception 'Ya existe una solicitud de ingreso a socios pendiente' using errcode = '23505';
  end if;
  insert into public.postulaciones_voluntariado (
    tipo, estado, nombre_completo, rut, email, telefono, region, profesion_especialidad, formulario_completo, voluntario_id, creada_por
  ) values (
    'ascenso_socio', 'pendiente', volunteer.nombre, volunteer.rut, volunteer.email, volunteer.telefono, volunteer.region,
    coalesce(volunteer.datos_postulacion -> 'formulario' ->> 'profesionEspecialidad', ''),
    p_payload || jsonb_build_object('voluntarioSnapshot', to_jsonb(volunteer)), volunteer.id, auth.uid()
  ) returning * into application;
  return to_jsonb(application);
end;
$$;

create or replace function public.pruaned_review_volunteer_membership(
  p_application_id uuid, p_decision text, p_categoria text default 'Socio Activo', p_review_note text default ''
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare application public.postulaciones_voluntariado; volunteer public.voluntarios; member public.socios;
begin
  if not public.pruaned_is_directiva() then raise exception 'Sólo el Directorio puede resolver ingreso a socios' using errcode = '42501'; end if;
  if p_decision not in ('aprobar', 'rechazar') or p_categoria not in ('Socio Activo', 'Socio Adherente', 'Socio Honorario') then raise exception 'Decisión o categoría inválida' using errcode = '22023'; end if;
  select * into application from public.postulaciones_voluntariado where id = p_application_id for update;
  if not found or application.tipo <> 'ascenso_socio' or application.estado <> 'pendiente' then raise exception 'Solicitud no disponible para revisión' using errcode = 'P0001'; end if;
  select * into volunteer from public.voluntarios where id = application.voluntario_id for update;
  if not found or volunteer.estado <> 'activo' then raise exception 'La ficha de voluntario ya no está activa' using errcode = 'P0001'; end if;
  if p_decision = 'aprobar' then
    select * into member from public.socios where rut = volunteer.rut or lower(coalesce(email, '')) = lower(volunteer.email) for update;
    if found and (member.rut <> volunteer.rut or lower(coalesce(member.email, '')) <> lower(volunteer.email)) then raise exception 'RUT o correo ya asociado a otro socio' using errcode = '23505'; end if;
    if found then
      update public.socios set categoria = p_categoria, voto = (p_categoria = 'Socio Activo') where id = member.id returning * into member;
    else
      insert into public.socios (rut, nombre, profesion, categoria, voto, email, region, fecha_ingreso)
      values (volunteer.rut, volunteer.nombre, application.profesion_especialidad, p_categoria, p_categoria = 'Socio Activo', volunteer.email, volunteer.region, current_date)
      returning * into member;
    end if;
    update public.postulaciones_voluntariado set estado = 'aprobada', socio_id = member.id,
      observacion_revision = nullif(btrim(coalesce(p_review_note, '')), ''), revisada_por = auth.uid(), fecha_revision = now(), updated_at = now()
    where id = application.id returning * into application;
  else
    update public.postulaciones_voluntariado set estado = 'rechazada',
      observacion_revision = nullif(btrim(coalesce(p_review_note, '')), ''), revisada_por = auth.uid(), fecha_revision = now(), updated_at = now()
    where id = application.id returning * into application;
  end if;
  return jsonb_build_object('application', to_jsonb(application), 'socio', case when member.id is null then null else to_jsonb(member) end);
end;
$$;

create or replace function public.pruaned_review_socio_application(
  p_application_id uuid, p_decision text, p_categoria text default 'Socio Activo', p_review_note text default ''
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare application public.postulaciones; volunteer_application public.postulaciones_voluntariado; volunteer public.voluntarios; member public.socios;
begin
  if not public.pruaned_is_directiva() then raise exception 'Sólo el Directorio puede resolver postulaciones de socios' using errcode = '42501'; end if;
  if p_decision not in ('aprobar', 'rechazar') or p_categoria not in ('Socio Activo', 'Socio Adherente', 'Socio Honorario') then raise exception 'Decisión o categoría inválida' using errcode = '22023'; end if;
  select * into application from public.postulaciones where id = p_application_id for update;
  if not found then raise exception 'Postulación de socio no encontrada' using errcode = 'P0002'; end if;
  if application.estado in ('Aceptada / Incorporado', 'Rechazada') then raise exception 'La postulación ya fue resuelta' using errcode = 'P0001'; end if;
  if p_decision = 'aprobar' then
    select * into member from public.socios where rut = application.rut or lower(coalesce(email, '')) = lower(application.email) for update;
    if found and (member.rut <> application.rut or lower(coalesce(member.email, '')) <> lower(application.email)) then raise exception 'RUT o correo ya asociado a otro socio' using errcode = '23505'; end if;
    if found then
      update public.socios set categoria = p_categoria, voto = (p_categoria = 'Socio Activo') where id = member.id returning * into member;
    else
      insert into public.socios (rut, nombre, profesion, categoria, voto, email, region, fecha_ingreso)
      values (application.rut, application.nombre_completo, application.profesion, p_categoria, p_categoria = 'Socio Activo', application.email,
        coalesce(application.formulario_completo ->> 'region', application.formulario_completo ->> 'comuna', 'Región Metropolitana'), current_date)
      returning * into member;
    end if;
    update public.postulaciones set estado = 'Aceptada / Incorporado' where id = application.id returning * into application;
  else
    update public.postulaciones set estado = 'Rechazada' where id = application.id returning * into application;
    insert into public.postulaciones_voluntariado (
      tipo, estado, nombre_completo, rut, email, telefono, region, comuna, profesion_especialidad, disponibilidad,
      formulario_completo, origen_postulacion_socio_id, revisada_por, fecha_revision, observacion_revision
    ) values (
      'derivada_socio', 'aprobada', application.nombre_completo, application.rut, application.email, application.telefono,
      coalesce(application.formulario_completo ->> 'region', application.formulario_completo ->> 'comuna'), application.formulario_completo ->> 'comuna',
      application.profesion, application.formulario_completo ->> 'tiempoDisponible', application.formulario_completo,
      application.id, auth.uid(), now(), 'Conversión automática desde postulación de socio rechazada'
    ) on conflict (origen_postulacion_socio_id) where origen_postulacion_socio_id is not null do update
      set updated_at = now()
    returning * into volunteer_application;
    select * into volunteer from public.voluntarios where rut = application.rut or lower(coalesce(email, '')) = lower(application.email) for update;
    if found and (volunteer.rut <> application.rut or lower(coalesce(volunteer.email, '')) <> lower(application.email)) then raise exception 'RUT o correo ya asociado a otra ficha de voluntariado' using errcode = '23505'; end if;
    if found then
      update public.voluntarios set estado = 'activo', origen = 'postulacion_socio_rechazada', postulacion_origen_id = volunteer_application.id,
        datos_postulacion = coalesce(datos_postulacion, '{}'::jsonb) || jsonb_build_object('formulario', application.formulario_completo)
      where id = volunteer.id returning * into volunteer;
    else
      insert into public.voluntarios (rut, nombre, email, telefono, region, disponibilidad_respuesta, estado, origen, postulacion_origen_id, datos_postulacion)
      values (application.rut, application.nombre_completo, application.email, application.telefono,
        coalesce(application.formulario_completo ->> 'region', application.formulario_completo ->> 'comuna'),
        application.formulario_completo ->> 'tiempoDisponible', 'activo', 'postulacion_socio_rechazada', volunteer_application.id,
        jsonb_build_object('formulario', application.formulario_completo)) returning * into volunteer;
    end if;
    update public.postulaciones_voluntariado set voluntario_id = volunteer.id, updated_at = now() where id = volunteer_application.id returning * into volunteer_application;
  end if;
  return jsonb_build_object('postulacionSocio', to_jsonb(application), 'voluntario', case when volunteer.id is null then null else to_jsonb(volunteer) end, 'socio', case when member.id is null then null else to_jsonb(member) end);
end;
$$;

create or replace function public.pruaned_list_volunteer_applications()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.pruaned_can_manage_voluntarios() then coalesce(jsonb_agg(to_jsonb(application) order by application.created_at desc), '[]'::jsonb) else '[]'::jsonb end
  from public.postulaciones_voluntariado application;
$$;

create or replace function public.pruaned_list_socio_applications()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.pruaned_is_directiva() then coalesce(jsonb_agg(to_jsonb(application) order by application.created_at desc), '[]'::jsonb) else '[]'::jsonb end
  from public.postulaciones application;
$$;

create or replace function public.pruaned_list_my_volunteer_applications()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(to_jsonb(application) order by application.created_at desc), '[]'::jsonb)
  from public.postulaciones_voluntariado application
  where auth.uid() is not null and lower(application.email) = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.pruaned_get_my_identity()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare email_address text := lower(coalesce(auth.jwt() ->> 'email', '')); member public.socios; volunteer public.voluntarios;
begin
  if auth.uid() is null or email_address = '' then return null; end if;
  if public.pruaned_is_master_user() then return jsonb_build_object('email', email_address, 'name', 'Administrador Maestro', 'role', 'master', 'rut', 'ADMIN-0', 'permisoGestionVoluntarios', true); end if;
  select * into member from public.socios where lower(coalesce(email, '')) = email_address limit 1;
  if found then return jsonb_build_object('email', member.email, 'name', member.nombre, 'role', case when public.pruaned_is_directiva() then 'directiva' else 'socio' end, 'rut', member.rut, 'permisoGestionVoluntarios', coalesce(member.permiso_gestion_voluntarios, false)); end if;
  select * into volunteer from public.voluntarios where lower(coalesce(email, '')) = email_address and estado = 'activo' limit 1;
  if found then return jsonb_build_object('email', volunteer.email, 'name', volunteer.nombre, 'role', 'voluntario', 'rut', volunteer.rut, 'permisoGestionVoluntarios', false); end if;
  return null;
end;
$$;

alter table public.postulaciones_voluntariado enable row level security;
alter table public.postulaciones enable row level security;
alter table public.voluntarios enable row level security;
drop policy if exists postulaciones_ins on public.postulaciones;
drop policy if exists postulaciones_read on public.postulaciones;
drop policy if exists postulaciones_voluntariado_direct_access on public.postulaciones_voluntariado;
drop policy if exists voluntarios_auth on public.voluntarios;
drop policy if exists voluntarios_read_self_or_manager on public.voluntarios;
drop policy if exists voluntarios_update_self_or_manager on public.voluntarios;
create policy voluntarios_read_self_or_manager on public.voluntarios for select to authenticated
  using (public.pruaned_can_manage_voluntarios() or lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', '')));
create policy voluntarios_update_self_or_manager on public.voluntarios for update to authenticated
  using (public.pruaned_can_manage_voluntarios() or lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', '')))
  with check (public.pruaned_can_manage_voluntarios() or lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', '')));

revoke all on public.postulaciones_voluntariado from anon, authenticated;
revoke all on function public.pruaned_application_text(jsonb, text, boolean, integer) from public;
revoke all on function public.pruaned_submit_volunteer_application(jsonb) from public;
revoke all on function public.pruaned_submit_socio_application(jsonb) from public;
revoke all on function public.pruaned_review_volunteer_application(uuid, text, text) from public;
revoke all on function public.pruaned_request_volunteer_membership(jsonb) from public;
revoke all on function public.pruaned_review_volunteer_membership(uuid, text, text, text) from public;
revoke all on function public.pruaned_review_socio_application(uuid, text, text, text) from public;
revoke all on function public.pruaned_list_volunteer_applications() from public;
revoke all on function public.pruaned_list_my_volunteer_applications() from public;
revoke all on function public.pruaned_list_socio_applications() from public;
revoke all on function public.pruaned_get_my_identity() from public;
grant execute on function public.pruaned_submit_volunteer_application(jsonb) to anon, authenticated;
grant execute on function public.pruaned_submit_socio_application(jsonb) to anon, authenticated;
grant execute on function public.pruaned_review_volunteer_application(uuid, text, text) to authenticated;
grant execute on function public.pruaned_request_volunteer_membership(jsonb) to authenticated;
grant execute on function public.pruaned_review_volunteer_membership(uuid, text, text, text) to authenticated;
grant execute on function public.pruaned_review_socio_application(uuid, text, text, text) to authenticated;
grant execute on function public.pruaned_list_volunteer_applications() to authenticated;
grant execute on function public.pruaned_list_my_volunteer_applications() to authenticated;
grant execute on function public.pruaned_list_socio_applications() to authenticated;
grant execute on function public.pruaned_get_my_identity() to authenticated;
grant execute on function public.pruaned_is_master_user() to authenticated;
grant execute on function public.pruaned_is_directiva() to authenticated;
grant execute on function public.pruaned_can_manage_voluntarios() to authenticated;
