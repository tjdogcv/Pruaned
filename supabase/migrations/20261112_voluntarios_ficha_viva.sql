-- ============================================================================
-- PRUANED — Ficha Viva de Voluntarios Permanentes, Capacidades, Adjuntos y Edición
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- Nota: No altera storage.objects para evitar ERROR 42501 (must be owner).
-- ============================================================================

-- 1. Helper seguro para convertir arrays JSONB a texto legible (comas)
create or replace function public.pruaned_jsonb_to_csv(p_val jsonb)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when p_val is null or jsonb_typeof(p_val) = 'null' then null
    when jsonb_typeof(p_val) = 'array' then (
      select nullif(string_agg(elem, ', '), '')
      from jsonb_array_elements_text(p_val) as elem
    )
    else nullif(btrim(p_val #>> '{}'), '')
  end;
$$;

-- 2. Normalización de RUT chileno (acepta puntos/guion y devuelve 12345678-9)
create or replace function public.pruaned_normalize_rut(p_raw text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  cleaned text := regexp_replace(upper(btrim(coalesce(p_raw, ''))), '[^0-9K]', '', 'g');
begin
  if cleaned !~ '^[0-9]{7,8}[0-9K]$' then
    return null;
  end if;
  return regexp_replace(cleaned, '^([0-9]{7,8})([0-9K])$', '\1-\2');
end;
$$;

-- 3. Postulación pública de voluntariado permanente (acepta nuevos campos y RUT con puntos)
create or replace function public.pruaned_submit_volunteer_application(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  application public.postulaciones_voluntariado;
  applicant_email text;
  applicant_rut text;
  applicant_name text;
  normalized_payload jsonb;
begin
  if jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Formulario inválido' using errcode = '22023';
  end if;

  applicant_name := public.pruaned_application_text(p_payload, 'nombreCompleto', true, 180);
  applicant_rut := public.pruaned_normalize_rut(p_payload ->> 'rut');
  applicant_email := lower(public.pruaned_application_text(p_payload, 'email', true, 254));

  if applicant_rut is null then
    raise exception 'RUT inválido. Ingresa formato 12345678-9' using errcode = '22023';
  end if;
  if applicant_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Correo inválido' using errcode = '22023';
  end if;
  if coalesce(p_payload ->> 'aceptaTerminos', 'false') <> 'true' then
    raise exception 'Debe aceptar el tratamiento de datos' using errcode = '22023';
  end if;
  if auth.uid() is not null and lower(coalesce(auth.jwt() ->> 'email', '')) <> applicant_email then
    raise exception 'El correo debe coincidir con la sesión activa' using errcode = '42501';
  end if;
  if exists (select 1 from public.voluntarios where rut = applicant_rut or lower(coalesce(email, '')) = applicant_email) then
    raise exception 'Ya existe una ficha de voluntariado para estos datos' using errcode = '23505';
  end if;
  if exists (select 1 from public.postulaciones_voluntariado where estado = 'pendiente' and lower(email) = applicant_email) then
    raise exception 'Ya existe una solicitud pendiente para este correo' using errcode = '23505';
  end if;

  normalized_payload := p_payload || jsonb_build_object('rut', applicant_rut, 'email', applicant_email);

  insert into public.postulaciones_voluntariado (
    tipo, estado, nombre_completo, rut, email, telefono, region, comuna,
    profesion_especialidad, disponibilidad, formulario_completo, creada_por
  ) values (
    'ingreso',
    'pendiente',
    applicant_name,
    applicant_rut,
    applicant_email,
    public.pruaned_application_text(normalized_payload, 'telefono', false, 40),
    public.pruaned_application_text(normalized_payload, 'region', false, 120),
    public.pruaned_application_text(normalized_payload, 'comuna', false, 120),
    public.pruaned_application_text(normalized_payload, 'profesionEspecialidad', false, 300),
    coalesce(
      public.pruaned_application_text(normalized_payload, 'disponibilidad', false, 500),
      public.pruaned_application_text(normalized_payload, 'disponibilidadRespuesta', false, 500)
    ),
    normalized_payload,
    auth.uid()
  ) returning * into application;

  return public.pruaned_volunteer_application_contract(application);
end;
$$;

-- 4. Revisión / Aprobación de postulación de voluntariado (propaga capacidades y recursos)
create or replace function public.pruaned_review_volunteer_application(
  p_application_id uuid, p_decision text, p_review_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  application public.postulaciones_voluntariado;
  volunteer public.voluntarios;
  v_disp text;
  v_recursos text;
  v_labores text;
begin
  if not public.pruaned_can_manage_voluntarios() then
    raise exception 'Permiso de gestión de voluntariado requerido' using errcode = '42501';
  end if;
  if p_decision not in ('aprobar', 'rechazar') then
    raise exception 'Decisión inválida' using errcode = '22023';
  end if;

  select * into application from public.postulaciones_voluntariado where id = p_application_id for update;
  if not found then
    raise exception 'Solicitud no encontrada' using errcode = 'P0002';
  end if;
  if application.tipo <> 'ingreso' or application.estado <> 'pendiente' then
    raise exception 'La solicitud no puede volver a revisarse' using errcode = 'P0001';
  end if;

  if p_decision = 'aprobar' then
    v_disp := coalesce(
      nullif(btrim(application.formulario_completo ->> 'disponibilidadRespuesta'), ''),
      application.disponibilidad
    );
    v_recursos := coalesce(
      public.pruaned_jsonb_to_csv(application.formulario_completo -> 'recursos'),
      public.pruaned_jsonb_to_csv(application.formulario_completo -> 'recursosPropios')
    );
    v_labores := coalesce(
      public.pruaned_jsonb_to_csv(application.formulario_completo -> 'labores'),
      public.pruaned_jsonb_to_csv(application.formulario_completo -> 'laboresQuePuedeRealizar'),
      public.pruaned_jsonb_to_csv(application.formulario_completo -> 'areasInteres')
    );

    select * into volunteer from public.voluntarios
      where rut = application.rut or lower(coalesce(email, '')) = lower(application.email) for update;

    if found and (volunteer.rut <> application.rut or lower(coalesce(volunteer.email, '')) <> lower(application.email)) then
      raise exception 'RUT o correo ya asociado a otra ficha de voluntariado' using errcode = '23505';
    end if;

    if found then
      update public.voluntarios set
        nombre = application.nombre_completo,
        telefono = coalesce(application.telefono, telefono),
        region = coalesce(application.region, region),
        disponibilidad_respuesta = coalesce(v_disp, disponibilidad_respuesta),
        recursos_propios = coalesce(v_recursos, recursos_propios),
        labores_que_puede_realizar = coalesce(v_labores, labores_que_puede_realizar),
        ultima_actualizacion_disponibilidad = now(),
        estado = 'activo',
        origen = 'postulacion_voluntariado',
        postulacion_origen_id = application.id,
        datos_postulacion = coalesce(datos_postulacion, '{}'::jsonb) || jsonb_build_object('formulario', application.formulario_completo),
        updated_at = now()
      where id = volunteer.id returning * into volunteer;
    else
      insert into public.voluntarios (
        rut, nombre, email, telefono, region, disponibilidad_respuesta,
        recursos_propios, labores_que_puede_realizar, ultima_actualizacion_disponibilidad,
        estado, origen, postulacion_origen_id, datos_postulacion
      ) values (
        application.rut, application.nombre_completo, application.email, application.telefono, application.region,
        v_disp, v_recursos, v_labores, now(),
        'activo', 'postulacion_voluntariado', application.id,
        jsonb_build_object('formulario', application.formulario_completo)
      ) returning * into volunteer;
    end if;

    update public.postulaciones_voluntariado set
      estado = 'aprobada',
      voluntario_id = volunteer.id,
      observacion_revision = nullif(btrim(coalesce(p_review_note, '')), ''),
      revisada_por = auth.uid(),
      fecha_revision = now(),
      updated_at = now()
    where id = application.id returning * into application;
  else
    update public.postulaciones_voluntariado set
      estado = 'rechazada',
      observacion_revision = nullif(btrim(coalesce(p_review_note, '')), ''),
      revisada_por = auth.uid(),
      fecha_revision = now(),
      updated_at = now()
    where id = application.id returning * into application;
  end if;

  return jsonb_build_object(
    'application', public.pruaned_volunteer_application_contract(application),
    'voluntario', case when volunteer.id is null then null else to_jsonb(volunteer) end
  );
end;
$$;

-- 5. Edición de ficha y carga de adjuntos en Solicitud de Voluntariado (Coordinación / Directiva)
create or replace function public.pruaned_update_volunteer_application(
  p_application_id uuid,
  p_updates jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  application public.postulaciones_voluntariado;
  updated_form jsonb;
  next_name text;
  next_rut text;
  next_email text;
  next_telefono text;
  next_region text;
  next_comuna text;
  next_profesion text;
  next_disp text;
  next_disp_resp text;
  next_recursos text;
  next_labores text;
begin
  if not public.pruaned_can_manage_voluntarios() then
    raise exception 'Permiso de gestión de voluntariado requerido' using errcode = '42501';
  end if;
  if jsonb_typeof(p_updates) <> 'object' then
    raise exception 'Datos de actualización inválidos' using errcode = '22023';
  end if;

  select * into application from public.postulaciones_voluntariado where id = p_application_id for update;
  if not found then
    raise exception 'Solicitud no encontrada' using errcode = 'P0002';
  end if;

  updated_form := coalesce(application.formulario_completo, '{}'::jsonb) || p_updates;

  next_name := coalesce(nullif(btrim(updated_form ->> 'nombreCompleto'), ''), application.nombre_completo);

  if p_updates ? 'rut' and nullif(btrim(p_updates ->> 'rut'), '') is not null then
    next_rut := public.pruaned_normalize_rut(p_updates ->> 'rut');
    if next_rut is null then
      raise exception 'RUT inválido. Usa formato 12345678-9' using errcode = '22023';
    end if;
    updated_form := updated_form || jsonb_build_object('rut', next_rut);
  else
    next_rut := application.rut;
  end if;

  if p_updates ? 'email' and nullif(btrim(p_updates ->> 'email'), '') is not null then
    next_email := lower(btrim(p_updates ->> 'email'));
    if next_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      raise exception 'Correo electrónico inválido' using errcode = '22023';
    end if;
    if application.estado = 'pendiente' and lower(next_email) <> lower(application.email) then
      if exists (
        select 1 from public.postulaciones_voluntariado
        where estado = 'pendiente' and id <> application.id and lower(email) = next_email
      ) then
        raise exception 'Ya existe otra solicitud pendiente con este correo' using errcode = '23505';
      end if;
    end if;
    updated_form := updated_form || jsonb_build_object('email', next_email);
  else
    next_email := application.email;
  end if;

  next_telefono := coalesce(nullif(btrim(updated_form ->> 'telefono'), ''), application.telefono);
  next_region := coalesce(nullif(btrim(updated_form ->> 'region'), ''), application.region);
  next_comuna := coalesce(nullif(btrim(updated_form ->> 'comuna'), ''), application.comuna);
  next_profesion := coalesce(
    nullif(btrim(updated_form ->> 'profesionEspecialidad'), ''),
    nullif(btrim(updated_form ->> 'profesion'), ''),
    application.profesion_especialidad
  );
  next_disp := coalesce(
    nullif(btrim(updated_form ->> 'disponibilidad'), ''),
    nullif(btrim(updated_form ->> 'tiempoDisponible'), ''),
    application.disponibilidad
  );

  update public.postulaciones_voluntariado set
    nombre_completo = next_name,
    rut = next_rut,
    email = next_email,
    telefono = next_telefono,
    region = next_region,
    comuna = next_comuna,
    profesion_especialidad = next_profesion,
    disponibilidad = next_disp,
    formulario_completo = updated_form,
    observacion_revision = case
      when p_updates ? 'observacionRevision' then nullif(btrim(p_updates ->> 'observacionRevision'), '')
      else observacion_revision
    end,
    updated_at = now()
  where id = application.id returning * into application;

  -- Si la solicitud ya generó un voluntario en padrón, mantenerlo sincronizado
  if application.voluntario_id is not null then
    next_disp_resp := coalesce(nullif(btrim(updated_form ->> 'disponibilidadRespuesta'), ''), next_disp);
    next_recursos := coalesce(
      public.pruaned_jsonb_to_csv(updated_form -> 'recursos'),
      public.pruaned_jsonb_to_csv(updated_form -> 'recursosPropios')
    );
    next_labores := coalesce(
      public.pruaned_jsonb_to_csv(updated_form -> 'labores'),
      public.pruaned_jsonb_to_csv(updated_form -> 'laboresQuePuedeRealizar'),
      public.pruaned_jsonb_to_csv(updated_form -> 'areasInteres')
    );

    update public.voluntarios set
      nombre = next_name,
      telefono = coalesce(next_telefono, telefono),
      region = coalesce(next_region, region),
      disponibilidad_respuesta = coalesce(next_disp_resp, disponibilidad_respuesta),
      recursos_propios = coalesce(next_recursos, recursos_propios),
      labores_que_puede_realizar = coalesce(next_labores, labores_que_puede_realizar),
      datos_postulacion = coalesce(datos_postulacion, '{}'::jsonb) || jsonb_build_object('formulario', updated_form),
      updated_at = now()
    where id = application.voluntario_id;
  end if;

  return public.pruaned_volunteer_application_contract(application);
end;
$$;

-- 6. Edición de ficha viva y disponibilidad de voluntario ya incorporado (Coordinación o propio voluntario)
create or replace function public.pruaned_update_volunteer_profile(
  p_volunteer_id uuid,
  p_updates jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  volunteer public.voluntarios;
  is_manager boolean := public.pruaned_can_manage_voluntarios();
  requester_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  current_form jsonb;
  allowed_updates jsonb;
  updated_form jsonb;
  next_name text;
  next_rut text;
  next_disp_resp text;
  next_recursos text;
  next_labores text;
begin
  if auth.uid() is null then
    raise exception 'Sesión autenticada requerida' using errcode = '42501';
  end if;
  if jsonb_typeof(p_updates) <> 'object' then
    raise exception 'Datos inválidos' using errcode = '22023';
  end if;

  select * into volunteer from public.voluntarios where id = p_volunteer_id for update;
  if not found then
    raise exception 'Voluntario no encontrado' using errcode = 'P0002';
  end if;

  if not is_manager and lower(coalesce(volunteer.email, '')) <> requester_email then
    raise exception 'No tienes permiso para editar esta ficha' using errcode = '42501';
  end if;

  -- Si es autogestión del propio voluntario, restringir campos administrativos sensibles
  if is_manager then
    allowed_updates := p_updates;
  else
    allowed_updates := p_updates - array['estado', 'nivelAcreditacion', 'nivel_acreditacion', 'horasAcumuladas', 'horas_acumuladas', 'rut', 'email'];
  end if;

  current_form := coalesce(volunteer.datos_postulacion -> 'formulario', '{}'::jsonb);
  updated_form := current_form || allowed_updates;

  next_name := case
    when is_manager and nullif(btrim(allowed_updates ->> 'nombreCompleto'), '') is not null
      then btrim(allowed_updates ->> 'nombreCompleto')
    when is_manager and nullif(btrim(allowed_updates ->> 'nombre'), '') is not null
      then btrim(allowed_updates ->> 'nombre')
    else volunteer.nombre
  end;

  if is_manager and allowed_updates ? 'rut' and nullif(btrim(allowed_updates ->> 'rut'), '') is not null then
    next_rut := public.pruaned_normalize_rut(allowed_updates ->> 'rut');
    if next_rut is null then
      raise exception 'RUT inválido' using errcode = '22023';
    end if;
    updated_form := updated_form || jsonb_build_object('rut', next_rut);
  else
    next_rut := volunteer.rut;
  end if;

  next_disp_resp := coalesce(
    nullif(btrim(updated_form ->> 'disponibilidadRespuesta'), ''),
    nullif(btrim(updated_form ->> 'disponibilidad'), ''),
    volunteer.disponibilidad_respuesta
  );
  next_recursos := coalesce(
    public.pruaned_jsonb_to_csv(updated_form -> 'recursos'),
    public.pruaned_jsonb_to_csv(updated_form -> 'recursosPropios'),
    volunteer.recursos_propios
  );
  next_labores := coalesce(
    public.pruaned_jsonb_to_csv(updated_form -> 'labores'),
    public.pruaned_jsonb_to_csv(updated_form -> 'laboresQuePuedeRealizar'),
    public.pruaned_jsonb_to_csv(updated_form -> 'areasInteres'),
    volunteer.labores_que_puede_realizar
  );

  update public.voluntarios set
    nombre = next_name,
    rut = next_rut,
    telefono = coalesce(nullif(btrim(updated_form ->> 'telefono'), ''), telefono),
    region = coalesce(nullif(btrim(updated_form ->> 'region'), ''), region),
    disponibilidad_respuesta = next_disp_resp,
    recursos_propios = next_recursos,
    labores_que_puede_realizar = next_labores,
    ultima_actualizacion_disponibilidad = now(),
    nivel_acreditacion = case
      when is_manager and nullif(btrim(allowed_updates ->> 'nivelAcreditacion'), '') is not null
        then btrim(allowed_updates ->> 'nivelAcreditacion')
      else nivel_acreditacion
    end,
    estado = case
      when is_manager and (allowed_updates ->> 'estado') in ('activo', 'inactivo')
        then allowed_updates ->> 'estado'
      else estado
    end,
    datos_postulacion = coalesce(datos_postulacion, '{}'::jsonb) || jsonb_build_object('formulario', updated_form),
    updated_at = now()
  where id = volunteer.id returning * into volunteer;

  -- Sincronizar de vuelta a la postulación de origen si existe
  if volunteer.postulacion_origen_id is not null then
    update public.postulaciones_voluntariado set
      nombre_completo = volunteer.nombre,
      telefono = coalesce(volunteer.telefono, telefono),
      region = coalesce(volunteer.region, region),
      comuna = coalesce(nullif(btrim(updated_form ->> 'comuna'), ''), comuna),
      profesion_especialidad = coalesce(nullif(btrim(updated_form ->> 'profesionEspecialidad'), ''), profesion_especialidad),
      disponibilidad = coalesce(nullif(btrim(updated_form ->> 'disponibilidad'), ''), disponibilidad),
      formulario_completo = updated_form,
      updated_at = now()
    where id = volunteer.postulacion_origen_id;
  end if;

  return to_jsonb(volunteer);
end;
$$;

-- 7. Solicitud de ascenso a Socio conservando toda la ficha viva y nuevos adjuntos del voluntario
create or replace function public.pruaned_request_volunteer_membership(p_payload jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  volunteer public.voluntarios;
  application public.postulaciones_voluntariado;
  requester_email text;
  merged_form jsonb;
begin
  if auth.uid() is null then
    raise exception 'Sesión autenticada requerida' using errcode = '42501';
  end if;
  if jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Solicitud inválida' using errcode = '22023';
  end if;

  requester_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  select * into volunteer from public.voluntarios where lower(coalesce(email, '')) = requester_email and estado = 'activo' for update;
  if not found then
    raise exception 'Sólo voluntarios activos pueden solicitar ingreso como socio' using errcode = '42501';
  end if;
  if exists (select 1 from public.socios where lower(coalesce(email, '')) = requester_email or rut = volunteer.rut) then
    raise exception 'Ya existe una ficha de socio para este voluntario' using errcode = '23505';
  end if;
  if exists (select 1 from public.postulaciones_voluntariado where tipo = 'ascenso_socio' and estado = 'pendiente' and voluntario_id = volunteer.id) then
    raise exception 'Ya existe una solicitud de ingreso a socios pendiente' using errcode = '23505';
  end if;

  merged_form := coalesce(volunteer.datos_postulacion -> 'formulario', '{}'::jsonb)
    || p_payload
    || jsonb_build_object('voluntarioSnapshot', to_jsonb(volunteer));

  insert into public.postulaciones_voluntariado (
    tipo, estado, nombre_completo, rut, email, telefono, region, comuna,
    profesion_especialidad, disponibilidad, formulario_completo, voluntario_id, creada_por
  ) values (
    'ascenso_socio',
    'pendiente',
    volunteer.nombre,
    volunteer.rut,
    volunteer.email,
    volunteer.telefono,
    volunteer.region,
    coalesce(merged_form ->> 'comuna', ''),
    coalesce(merged_form ->> 'profesionEspecialidad', ''),
    coalesce(volunteer.disponibilidad_respuesta, merged_form ->> 'disponibilidad', ''),
    merged_form,
    volunteer.id,
    auth.uid()
  ) returning * into application;

  return public.pruaned_volunteer_application_contract(application);
end;
$$;

-- 8. Intentar asegurar bucket de Storage (si hay permiso en storage.buckets, sin tocar storage.objects)
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('documentos-voluntarios', 'documentos-voluntarios', true)
  on conflict (id) do update set public = true;
exception when insufficient_privilege then
  raise notice 'Crear el bucket documentos-voluntarios desde Supabase Storage UI.';
end $$;

-- 9. Permisos explícitos de ejecución
revoke all on function public.pruaned_jsonb_to_csv(jsonb) from public;
revoke all on function public.pruaned_normalize_rut(text) from public;
revoke all on function public.pruaned_submit_volunteer_application(jsonb) from public;
revoke all on function public.pruaned_review_volunteer_application(uuid, text, text) from public;
revoke all on function public.pruaned_update_volunteer_application(uuid, jsonb) from public;
revoke all on function public.pruaned_update_volunteer_profile(uuid, jsonb) from public;
revoke all on function public.pruaned_request_volunteer_membership(jsonb) from public;

grant execute on function public.pruaned_submit_volunteer_application(jsonb) to anon, authenticated;
grant execute on function public.pruaned_review_volunteer_application(uuid, text, text) to authenticated;
grant execute on function public.pruaned_update_volunteer_application(uuid, jsonb) to authenticated;
grant execute on function public.pruaned_update_volunteer_profile(uuid, jsonb) to authenticated;
grant execute on function public.pruaned_request_volunteer_membership(jsonb) to authenticated;
