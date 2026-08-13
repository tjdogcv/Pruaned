-- PRUANED A.G. — editor LMS de producción
-- Ejecutar después de que exista public.cursos_lms. Es aditiva e idempotente:
-- archiva la maqueta conocida, pero nunca borra cursos, progreso ni notas.

create extension if not exists "uuid-ossp";

do $$
begin
  if to_regclass('public.cursos_lms') is null then
    raise exception 'Falta public.cursos_lms. Ejecute primero la migración base del LMS.';
  end if;
end;
$$;

alter table public.cursos_lms
  add column if not exists audience text[] not null default array['socios', 'voluntarios']::text[],
  add column if not exists status text not null default 'published',
  add column if not exists instructor text,
  add column if not exists duration text,
  add column if not exists difficulty text,
  add column if not exists category text,
  add column if not exists requirements jsonb not null default '[]'::jsonb,
  add column if not exists video_url text,
  add column if not exists has_evaluation boolean not null default false,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id);

create table if not exists public.lms_managers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Conserva la cuenta institucional maestra como gestora si ya existe en Auth.
insert into public.lms_managers (user_id)
select id from auth.users where lower(email) = 'ag.pruaned@gmail.com'
on conflict (user_id) do nothing;

create table if not exists public.lms_participants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  participant_type text not null check (participant_type in ('socio', 'voluntario')),
  audiences text[] not null default array['socios']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists lms_participants_email_lower_key
  on public.lms_participants (lower(email));

create table if not exists public.lms_course_modules (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.cursos_lms(id) on delete cascade,
  title text not null,
  content text,
  video_url text,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position)
);

alter table public.lms_course_modules
  add column if not exists video_url text;

create table if not exists public.lms_evaluation_questions (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.cursos_lms(id) on delete cascade,
  prompt text not null,
  options jsonb not null,
  correct_option integer not null,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position),
  check (jsonb_typeof(options) = 'array'),
  check (jsonb_array_length(options) >= 2),
  check (correct_option >= 0 and correct_option < jsonb_array_length(options))
);

create table if not exists public.lms_module_progress (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  module_id uuid not null references public.lms_course_modules(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

create table if not exists public.lms_course_results (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid not null references public.cursos_lms(id) on delete cascade,
  status text not null default 'en_progreso' check (status in ('en_progreso', 'aprobado', 'reprobado')),
  score numeric(5,2),
  attempts integer not null default 0 check (attempts >= 0),
  first_started_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id),
  check (score is null or (score >= 0 and score <= 100))
);

create index if not exists lms_course_modules_course_position_idx
  on public.lms_course_modules (course_id, position);
create index if not exists lms_evaluation_questions_course_position_idx
  on public.lms_evaluation_questions (course_id, position);
create index if not exists lms_module_progress_module_idx
  on public.lms_module_progress (module_id);
create index if not exists lms_course_results_course_status_idx
  on public.lms_course_results (course_id, status);

create or replace function public.lms_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lms_courses_updated_at on public.cursos_lms;
create trigger lms_courses_updated_at before update on public.cursos_lms
  for each row execute function public.lms_set_updated_at();
drop trigger if exists lms_participants_updated_at on public.lms_participants;
create trigger lms_participants_updated_at before update on public.lms_participants
  for each row execute function public.lms_set_updated_at();
drop trigger if exists lms_course_modules_updated_at on public.lms_course_modules;
create trigger lms_course_modules_updated_at before update on public.lms_course_modules
  for each row execute function public.lms_set_updated_at();
drop trigger if exists lms_evaluation_questions_updated_at on public.lms_evaluation_questions;
create trigger lms_evaluation_questions_updated_at before update on public.lms_evaluation_questions
  for each row execute function public.lms_set_updated_at();
drop trigger if exists lms_course_results_updated_at on public.lms_course_results;
create trigger lms_course_results_updated_at before update on public.lms_course_results
  for each row execute function public.lms_set_updated_at();

create or replace function public.lms_is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.lms_managers manager where manager.user_id = auth.uid()
  ) or exists (
    select 1 from public.socios socio
    where lower(coalesce(socio.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and coalesce(socio.permiso_gestion_voluntarios, false)
  ) or exists (
    select 1
    from public.socios socio
    join public.directorio_cargos cargos on cargos.id = 1
    where lower(coalesce(socio.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and socio.id in (cargos.presidente_id, cargos.vicepresidente_id, cargos.secretario_id, cargos.tesorero_id)
  );
$$;

create or replace function public.lms_current_audiences()
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  result text[] := array[]::text[];
begin
  if current_email = '' then return result; end if;
  if exists (select 1 from public.socios where lower(coalesce(email, '')) = current_email) then
    result := array_append(result, 'socios');
  end if;
  if exists (select 1 from public.voluntarios where lower(coalesce(email, '')) = current_email) then
    result := array_append(result, 'voluntarios');
  end if;
  return result;
end;
$$;

create or replace function public.lms_can_read_course(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.lms_is_manager() or exists (
    select 1 from public.cursos_lms course
    where course.id = p_course_id
      and course.status = 'published'
      and course.audience && public.lms_current_audiences()
  );
$$;

create or replace function public.lms_is_safe_video_url(p_url text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select p_url is null or btrim(p_url) = '' or btrim(p_url) ~* '^https://(www\.)?(youtube\.com|m\.youtube\.com|youtu\.be|drive\.google\.com)/';
$$;

create or replace function public.lms_bootstrap_profile()
returns public.lms_participants
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  participant public.lms_participants;
  person_name text;
  person_type text;
  participant_audiences text[];
begin
  if current_user_id is null or current_email = '' then
    raise exception 'Sesión autenticada requerida' using errcode = '42501';
  end if;

  select nombre into person_name from public.voluntarios
  where lower(coalesce(email, '')) = current_email limit 1;
  if person_name is not null then
    person_type := 'voluntario';
  else
    select nombre into person_name from public.socios
    where lower(coalesce(email, '')) = current_email limit 1;
    person_type := 'socio';
  end if;

  participant_audiences := public.lms_current_audiences();
  if cardinality(participant_audiences) = 0 then
    if not public.lms_is_manager() then
      raise exception 'La cuenta no pertenece al padrón habilitado para el aula virtual' using errcode = '42501';
    end if;
    -- Un gestor explícito conserva acceso editorial; lms_can_read_course decide
    -- el catálogo y no convierte a otras cuentas en socios.
    participant_audiences := array['socios']::text[];
  end if;

  insert into public.lms_participants (user_id, email, display_name, participant_type, audiences)
  values (current_user_id, current_email, coalesce(nullif(person_name, ''), split_part(current_email, '@', 1)), person_type, participant_audiences)
  on conflict (user_id) do update set
    email = excluded.email,
    display_name = excluded.display_name,
    participant_type = excluded.participant_type,
    audiences = excluded.audiences
  returning * into participant;
  return participant;
end;
$$;

create or replace function public.lms_refresh_course_evaluation_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare affected_course_id uuid;
begin
  affected_course_id := case when tg_op = 'DELETE' then old.course_id else new.course_id end;
  update public.cursos_lms set has_evaluation = exists (
    select 1 from public.lms_evaluation_questions where course_id = affected_course_id
  ) where id = affected_course_id;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists lms_questions_sync_course_flag on public.lms_evaluation_questions;
create trigger lms_questions_sync_course_flag after insert or update or delete on public.lms_evaluation_questions
  for each row execute function public.lms_refresh_course_evaluation_flag();

create or replace function public.lms_complete_module(p_module_id uuid)
returns table (course_id uuid, module_id uuid, course_status text, completed_modules integer, total_modules integer)
language plpgsql
security definer
set search_path = public
as $$
declare target_course_id uuid; completed_count integer; total_count integer; has_evaluation boolean; resolved_status text;
begin
  if auth.uid() is null then raise exception 'Sesión autenticada requerida' using errcode = '42501'; end if;
  select module.course_id into target_course_id from public.lms_course_modules module where module.id = p_module_id;
  if target_course_id is null or not public.lms_can_read_course(target_course_id) then
    raise exception 'Módulo no disponible' using errcode = '42501';
  end if;
  insert into public.lms_module_progress (user_id, module_id) values (auth.uid(), p_module_id) on conflict do nothing;
  select count(*) into total_count from public.lms_course_modules where course_id = target_course_id;
  select count(*) into completed_count from public.lms_module_progress progress join public.lms_course_modules module on module.id = progress.module_id where progress.user_id = auth.uid() and module.course_id = target_course_id;
  select exists (select 1 from public.lms_evaluation_questions where course_id = target_course_id) into has_evaluation;
  resolved_status := case when total_count > 0 and total_count = completed_count and not has_evaluation then 'aprobado' else 'en_progreso' end;
  insert into public.lms_course_results (user_id, course_id, status, completed_at) values (auth.uid(), target_course_id, resolved_status, case when resolved_status = 'aprobado' then now() end)
  on conflict (user_id, course_id) do update set status = case when public.lms_course_results.status = 'aprobado' then 'aprobado' else excluded.status end, completed_at = coalesce(public.lms_course_results.completed_at, excluded.completed_at);
  return query select target_course_id, p_module_id, (select status from public.lms_course_results where user_id = auth.uid() and course_id = target_course_id), completed_count, total_count;
end;
$$;

create or replace function public.lms_get_assessment(p_course_id uuid)
returns table (id uuid, prompt text, options jsonb, question_position integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.lms_can_read_course(p_course_id) then raise exception 'Evaluación no disponible' using errcode = '42501'; end if;
  return query select question.id, question.prompt, question.options, question.position as question_position from public.lms_evaluation_questions question where question.course_id = p_course_id order by question.position;
end;
$$;

create or replace function public.lms_submit_assessment(p_course_id uuid, p_answers jsonb)
returns table (status text, score numeric, attempts integer, completed_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare total_modules integer; completed_modules integer; total_questions integer; correct_answers integer; calculated_score numeric(5,2); resolved_status text;
begin
  if auth.uid() is null or not public.lms_can_read_course(p_course_id) then raise exception 'Evaluación no disponible' using errcode = '42501'; end if;
  if jsonb_typeof(coalesce(p_answers, '{}'::jsonb)) <> 'object' then raise exception 'Formato de respuestas inválido' using errcode = '22023'; end if;
  select count(*) into total_modules from public.lms_course_modules where course_id = p_course_id;
  select count(*) into completed_modules from public.lms_module_progress progress join public.lms_course_modules module on module.id = progress.module_id where progress.user_id = auth.uid() and module.course_id = p_course_id;
  if total_modules > 0 and completed_modules < total_modules then raise exception 'Completa los módulos antes de rendir la evaluación' using errcode = '22023'; end if;
  select count(*) into total_questions from public.lms_evaluation_questions where course_id = p_course_id;
  if total_questions = 0 then raise exception 'Este curso no tiene evaluación publicada' using errcode = '22023'; end if;
  select count(*) into correct_answers from public.lms_evaluation_questions question where question.course_id = p_course_id and coalesce(p_answers ->> question.id::text, '') ~ '^[0-9]+$' and (p_answers ->> question.id::text)::integer = question.correct_option;
  calculated_score := round((correct_answers::numeric / total_questions::numeric) * 100, 2);
  resolved_status := case when calculated_score >= 70 then 'aprobado' else 'reprobado' end;
  insert into public.lms_course_results (user_id, course_id, status, score, attempts, last_attempt_at, completed_at) values (auth.uid(), p_course_id, resolved_status, calculated_score, 1, now(), case when resolved_status = 'aprobado' then now() end)
  on conflict (user_id, course_id) do update set status = excluded.status, score = excluded.score, attempts = public.lms_course_results.attempts + 1, last_attempt_at = excluded.last_attempt_at, completed_at = case when excluded.status = 'aprobado' then coalesce(public.lms_course_results.completed_at, excluded.completed_at) else public.lms_course_results.completed_at end;
  return query select result.status, result.score, result.attempts, result.completed_at from public.lms_course_results result where result.user_id = auth.uid() and result.course_id = p_course_id;
end;
$$;

-- RPCs editoriales. La respuesta correcta sólo se entrega a gestores mediante
-- lms_get_course_editor; el aula de alumnos usa lms_get_assessment.
create or replace function public.lms_get_course_editor(p_course_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare payload jsonb;
begin
  if not public.lms_is_manager() then raise exception 'Permiso de gestión LMS requerido' using errcode = '42501'; end if;
  if not exists (select 1 from public.cursos_lms where id = p_course_id) then raise exception 'Curso no encontrado' using errcode = 'P0002'; end if;
  select jsonb_build_object(
    'course', (select to_jsonb(course) from public.cursos_lms course where course.id = p_course_id),
    'modules', coalesce((select jsonb_agg(jsonb_build_object('id', module.id, 'title', module.title, 'content', module.content, 'video_url', module.video_url, 'position', module.position) order by module.position) from public.lms_course_modules module where module.course_id = p_course_id), '[]'::jsonb),
    'questions', coalesce((select jsonb_agg(jsonb_build_object('id', question.id, 'prompt', question.prompt, 'options', question.options, 'correct_option', question.correct_option, 'position', question.position) order by question.position) from public.lms_evaluation_questions question where question.course_id = p_course_id), '[]'::jsonb)
  ) into payload;
  return payload;
end;
$$;

create or replace function public.lms_save_course_bundle(p_course_id uuid, p_course jsonb, p_modules jsonb, p_questions jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_course_id uuid := p_course_id;
  entry jsonb;
  item_index integer;
  supplied_code text;
  supplied_title text;
  supplied_status text;
  supplied_audience text[];
  supplied_video_url text;
  supplied_hours numeric;
  supplied_correct integer;
begin
  if not public.lms_is_manager() then raise exception 'Permiso de gestión LMS requerido' using errcode = '42501'; end if;
  if jsonb_typeof(coalesce(p_course, '{}'::jsonb)) <> 'object' or jsonb_typeof(coalesce(p_modules, '[]'::jsonb)) <> 'array' or jsonb_typeof(coalesce(p_questions, '[]'::jsonb)) <> 'array' then
    raise exception 'Formato editorial inválido' using errcode = '22023';
  end if;

  supplied_code := upper(btrim(coalesce(p_course ->> 'code', '')));
  supplied_title := btrim(coalesce(p_course ->> 'title', ''));
  supplied_status := coalesce(nullif(btrim(p_course ->> 'status'), ''), 'draft');
  supplied_video_url := nullif(btrim(coalesce(p_course ->> 'videoUrl', p_course ->> 'video_url', '')), '');
  if supplied_code = '' or supplied_title = '' then raise exception 'Código y título son obligatorios' using errcode = '22023'; end if;
  if supplied_status not in ('draft', 'published') then raise exception 'Estado editorial inválido' using errcode = '22023'; end if;
  if not public.lms_is_safe_video_url(supplied_video_url) then raise exception 'El video debe ser una URL HTTPS de YouTube o Google Drive' using errcode = '22023'; end if;
  if jsonb_typeof(coalesce(p_course -> 'audience', '[]'::jsonb)) <> 'array' then raise exception 'Audiencia inválida' using errcode = '22023'; end if;
  select coalesce(array_agg(value), array[]::text[]) into supplied_audience from jsonb_array_elements_text(p_course -> 'audience') value;
  if cardinality(supplied_audience) = 0 or not (supplied_audience <@ array['socios', 'voluntarios']::text[]) then raise exception 'Audiencia inválida' using errcode = '22023'; end if;
  if coalesce(p_course ->> 'hours', '') <> '' then
    if (p_course ->> 'hours') !~ '^\d+(\.\d+)?$' then raise exception 'Horas inválidas' using errcode = '22023'; end if;
    supplied_hours := (p_course ->> 'hours')::numeric;
  end if;
  if supplied_status = 'published' and jsonb_array_length(p_modules) = 0 then raise exception 'Un curso publicado requiere al menos un módulo' using errcode = '22023'; end if;

  for item_index, entry in select ordinality - 1, value from jsonb_array_elements(p_modules) with ordinality loop
    if jsonb_typeof(entry) <> 'object' or btrim(coalesce(entry ->> 'title', '')) = '' then raise exception 'Cada módulo requiere título' using errcode = '22023'; end if;
    if not public.lms_is_safe_video_url(nullif(btrim(coalesce(entry ->> 'videoUrl', entry ->> 'video_url', '')), '')) then raise exception 'El video del módulo debe ser una URL HTTPS de YouTube o Google Drive' using errcode = '22023'; end if;
  end loop;
  for item_index, entry in select ordinality - 1, value from jsonb_array_elements(p_questions) with ordinality loop
    if jsonb_typeof(entry) <> 'object' or btrim(coalesce(entry ->> 'prompt', '')) = '' then raise exception 'Cada pregunta requiere enunciado' using errcode = '22023'; end if;
    if jsonb_typeof(coalesce(entry -> 'options', '[]'::jsonb)) <> 'array' or jsonb_array_length(entry -> 'options') < 2 then raise exception 'Cada pregunta requiere dos alternativas' using errcode = '22023'; end if;
    if exists (select 1 from jsonb_array_elements_text(entry -> 'options') option_value where btrim(option_value) = '') then raise exception 'Las alternativas no pueden estar vacías' using errcode = '22023'; end if;
    if coalesce(entry ->> 'correctOption', entry ->> 'correct_option', '') !~ '^\d+$' then raise exception 'Respuesta correcta inválida' using errcode = '22023'; end if;
    supplied_correct := coalesce(entry ->> 'correctOption', entry ->> 'correct_option')::integer;
    if supplied_correct < 0 or supplied_correct >= jsonb_array_length(entry -> 'options') then raise exception 'Respuesta correcta fuera de rango' using errcode = '22023'; end if;
  end loop;

  if target_course_id is not null then
    if not exists (select 1 from public.cursos_lms where id = target_course_id) then raise exception 'Curso no encontrado' using errcode = 'P0002'; end if;
    if exists (select 1 from public.cursos_lms where code = supplied_code and id <> target_course_id) then raise exception 'Ya existe otro curso con ese código' using errcode = '23505'; end if;
    if exists (select 1 from public.lms_course_results where course_id = target_course_id) or exists (select 1 from public.lms_module_progress progress join public.lms_course_modules module on module.id = progress.module_id where module.course_id = target_course_id) then
      raise exception 'Este curso ya tiene actividad académica. Archívalo y crea una nueva versión para proteger las notas.' using errcode = '55000';
    end if;
    update public.cursos_lms set code = supplied_code, title = supplied_title, description = nullif(btrim(coalesce(p_course ->> 'description', '')), ''), instructor = nullif(btrim(coalesce(p_course ->> 'instructor', '')), ''), duration = nullif(btrim(coalesce(p_course ->> 'duration', '')), ''), hours = supplied_hours, audience = supplied_audience, status = supplied_status, video_url = supplied_video_url, archived_at = null, archived_by = null where id = target_course_id;
    delete from public.lms_evaluation_questions where course_id = target_course_id;
    delete from public.lms_course_modules where course_id = target_course_id;
  else
    if exists (select 1 from public.cursos_lms where code = supplied_code) then raise exception 'Ya existe un curso con ese código' using errcode = '23505'; end if;
    insert into public.cursos_lms (code, title, description, instructor, duration, hours, audience, status, video_url) values (supplied_code, supplied_title, nullif(btrim(coalesce(p_course ->> 'description', '')), ''), nullif(btrim(coalesce(p_course ->> 'instructor', '')), ''), nullif(btrim(coalesce(p_course ->> 'duration', '')), ''), supplied_hours, supplied_audience, supplied_status, supplied_video_url) returning id into target_course_id;
  end if;

  for item_index, entry in select ordinality - 1, value from jsonb_array_elements(p_modules) with ordinality loop
    insert into public.lms_course_modules (course_id, title, content, video_url, position) values (target_course_id, btrim(entry ->> 'title'), nullif(btrim(coalesce(entry ->> 'content', '')), ''), nullif(btrim(coalesce(entry ->> 'videoUrl', entry ->> 'video_url', '')), ''), item_index);
  end loop;
  for item_index, entry in select ordinality - 1, value from jsonb_array_elements(p_questions) with ordinality loop
    insert into public.lms_evaluation_questions (course_id, prompt, options, correct_option, position) values (target_course_id, btrim(entry ->> 'prompt'), entry -> 'options', coalesce(entry ->> 'correctOption', entry ->> 'correct_option')::integer, item_index);
  end loop;
  update public.cursos_lms set has_evaluation = jsonb_array_length(p_questions) > 0 where id = target_course_id;
  return target_course_id;
end;
$$;

create or replace function public.lms_archive_course(p_course_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.lms_is_manager() then raise exception 'Permiso de gestión LMS requerido' using errcode = '42501'; end if;
  update public.cursos_lms set status = 'archived', archived_at = now(), archived_by = auth.uid() where id = p_course_id;
  if not found then raise exception 'Curso no encontrado' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.lms_restore_course(p_course_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.lms_is_manager() then raise exception 'Permiso de gestión LMS requerido' using errcode = '42501'; end if;
  update public.cursos_lms set status = 'draft', archived_at = null, archived_by = null where id = p_course_id;
  if not found then raise exception 'Curso no encontrado' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.lms_prevent_course_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Los cursos LMS no se eliminan; use lms_archive_course para conservar el historial' using errcode = '55000';
end;
$$;

drop trigger if exists lms_courses_no_delete on public.cursos_lms;
create trigger lms_courses_no_delete before delete on public.cursos_lms
  for each row execute function public.lms_prevent_course_delete();

-- La maqueta queda fuera del aula y de los indicadores, pero se conserva para
-- trazabilidad y puede revisarse desde el catálogo editorial.
update public.cursos_lms
set status = 'archived', archived_at = coalesce(archived_at, now())
where upper(coalesce(code, '')) in ('PRU-LMS-001', 'PRU-LMS-002')
  and status <> 'archived';

-- El frontend sólo consulta las vistas de lectura y las RPC. No hay políticas
-- de INSERT/UPDATE/DELETE directo para tablas editoriales.
alter table public.cursos_lms enable row level security;
alter table public.lms_managers enable row level security;
alter table public.lms_participants enable row level security;
alter table public.lms_course_modules enable row level security;
alter table public.lms_evaluation_questions enable row level security;
alter table public.lms_module_progress enable row level security;
alter table public.lms_course_results enable row level security;

drop policy if exists lms_courses_read on public.cursos_lms;
drop policy if exists lms_courses_manage on public.cursos_lms;
create policy lms_courses_read on public.cursos_lms for select to authenticated using (public.lms_can_read_course(id));
drop policy if exists lms_managers_read_self on public.lms_managers;
create policy lms_managers_read_self on public.lms_managers for select to authenticated using (user_id = auth.uid());
drop policy if exists lms_participants_read on public.lms_participants;
create policy lms_participants_read on public.lms_participants for select to authenticated using (user_id = auth.uid() or public.lms_is_manager());
drop policy if exists lms_modules_read on public.lms_course_modules;
drop policy if exists lms_modules_manage on public.lms_course_modules;
create policy lms_modules_read on public.lms_course_modules for select to authenticated using (public.lms_can_read_course(course_id));
drop policy if exists lms_questions_manage on public.lms_evaluation_questions;
drop policy if exists lms_questions_read on public.lms_evaluation_questions;
drop policy if exists lms_module_progress_read on public.lms_module_progress;
create policy lms_module_progress_read on public.lms_module_progress for select to authenticated using (user_id = auth.uid() or public.lms_is_manager());
drop policy if exists lms_course_results_read on public.lms_course_results;
create policy lms_course_results_read on public.lms_course_results for select to authenticated using (user_id = auth.uid() or public.lms_is_manager());

revoke all on function public.lms_is_manager() from public;
revoke all on function public.lms_current_audiences() from public;
revoke all on function public.lms_can_read_course(uuid) from public;
revoke all on function public.lms_is_safe_video_url(text) from public;
revoke all on function public.lms_bootstrap_profile() from public;
revoke all on function public.lms_complete_module(uuid) from public;
revoke all on function public.lms_get_assessment(uuid) from public;
revoke all on function public.lms_submit_assessment(uuid, jsonb) from public;
revoke all on function public.lms_get_course_editor(uuid) from public;
revoke all on function public.lms_save_course_bundle(uuid, jsonb, jsonb, jsonb) from public;
revoke all on function public.lms_archive_course(uuid) from public;
revoke all on function public.lms_restore_course(uuid) from public;
grant execute on function public.lms_is_manager() to authenticated;
grant execute on function public.lms_current_audiences() to authenticated;
grant execute on function public.lms_can_read_course(uuid) to authenticated;
grant execute on function public.lms_bootstrap_profile() to authenticated;
grant execute on function public.lms_complete_module(uuid) to authenticated;
grant execute on function public.lms_get_assessment(uuid) to authenticated;
grant execute on function public.lms_submit_assessment(uuid, jsonb) to authenticated;
grant execute on function public.lms_get_course_editor(uuid) to authenticated;
grant execute on function public.lms_save_course_bundle(uuid, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.lms_archive_course(uuid) to authenticated;
grant execute on function public.lms_restore_course(uuid) to authenticated;

-- Registre gestores adicionales sólo desde SQL de confianza, por ejemplo:
-- insert into public.lms_managers (user_id)
-- select id from auth.users where lower(email) = lower('gestor@pruaned.cl')
-- on conflict (user_id) do nothing;
