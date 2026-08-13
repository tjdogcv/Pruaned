-- PRUANED A.G. — LMS operativo y seguro
-- Ejecutar una vez en Supabase SQL Editor, con una cuenta administradora.
-- Esta migración es aditiva: no elimina ni modifica datos académicos existentes.

create extension if not exists "uuid-ossp";

-- El catálogo existente fue creado en distintas versiones con columnas distintas.
-- Estas columnas normalizan el contrato que consume el Aula Virtual.
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
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cursos_lms_audience_valid'
  ) then
    alter table public.cursos_lms
      add constraint cursos_lms_audience_valid
      check (
        cardinality(audience) > 0
        and audience <@ array['socios', 'voluntarios']::text[]
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'cursos_lms_status_valid'
  ) then
    alter table public.cursos_lms
      add constraint cursos_lms_status_valid
      check (status in ('draft', 'published', 'archived')) not valid;
  end if;
end;
$$;

create table if not exists public.lms_managers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.lms_participants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  participant_type text not null check (participant_type in ('socio', 'voluntario')),
  audiences text[] not null default array['socios']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lms_participants_audiences_valid check (
    cardinality(audiences) > 0
    and audiences <@ array['socios', 'voluntarios']::text[]
  )
);

create unique index if not exists lms_participants_email_lower_key
  on public.lms_participants (lower(email));

create table if not exists public.lms_course_modules (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.cursos_lms(id) on delete cascade,
  title text not null,
  content text,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position)
);

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

create or replace function public.lms_refresh_course_evaluation_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_course_id uuid;
begin
  affected_course_id := case when tg_op = 'DELETE' then old.course_id else new.course_id end;
  update public.cursos_lms
    set has_evaluation = exists (
      select 1 from public.lms_evaluation_questions
      where course_id = affected_course_id
    )
  where id = affected_course_id;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists lms_questions_sync_course_flag on public.lms_evaluation_questions;
create trigger lms_questions_sync_course_flag
  after insert or update or delete on public.lms_evaluation_questions
  for each row execute function public.lms_refresh_course_evaluation_flag();

update public.cursos_lms course
set has_evaluation = exists (
  select 1 from public.lms_evaluation_questions question where question.course_id = course.id
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

drop trigger if exists lms_participants_updated_at on public.lms_participants;
create trigger lms_participants_updated_at
  before update on public.lms_participants
  for each row execute function public.lms_set_updated_at();

drop trigger if exists lms_course_modules_updated_at on public.lms_course_modules;
create trigger lms_course_modules_updated_at
  before update on public.lms_course_modules
  for each row execute function public.lms_set_updated_at();

drop trigger if exists lms_evaluation_questions_updated_at on public.lms_evaluation_questions;
create trigger lms_evaluation_questions_updated_at
  before update on public.lms_evaluation_questions
  for each row execute function public.lms_set_updated_at();

drop trigger if exists lms_course_results_updated_at on public.lms_course_results;
create trigger lms_course_results_updated_at
  before update on public.lms_course_results
  for each row execute function public.lms_set_updated_at();

-- La autoridad real no viene del rol que declara el navegador. Un gestor es una
-- cuenta explícitamente registrada o un socio con permiso de gestión persistido.
create or replace function public.lms_is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.lms_managers manager
    where manager.user_id = auth.uid()
  ) or exists (
    select 1 from public.socios socio
    where lower(coalesce(socio.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and coalesce(socio.permiso_gestion_voluntarios, false)
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
  if current_email = '' then
    return result;
  end if;

  if exists (select 1 from public.socios where lower(coalesce(email, '')) = current_email) then
    result := array_append(result, 'socios');
  end if;

  if exists (select 1 from public.voluntarios where lower(coalesce(email, '')) = current_email) then
    result := array_append(result, 'voluntarios');
  end if;

  -- Un usuario autenticado sin ficha todavía puede completar su perfil como socio.
  return case when cardinality(result) = 0 then array['socios']::text[] else result end;
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

-- Crea/actualiza la ficha LMS usando sólo el usuario autenticado y los padrones
-- institucionales; el cliente no puede escoger su tipo de participante.
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
begin
  if current_user_id is null or current_email = '' then
    raise exception 'Sesión autenticada requerida' using errcode = '42501';
  end if;

  select nombre into person_name
  from public.voluntarios
  where lower(coalesce(email, '')) = current_email
  limit 1;

  if person_name is not null then
    person_type := 'voluntario';
  else
    select nombre into person_name
    from public.socios
    where lower(coalesce(email, '')) = current_email
    limit 1;
    person_type := 'socio';
  end if;

  insert into public.lms_participants (user_id, email, display_name, participant_type, audiences)
  values (
    current_user_id,
    current_email,
    coalesce(nullif(person_name, ''), split_part(current_email, '@', 1)),
    person_type,
    public.lms_current_audiences()
  )
  on conflict (user_id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        participant_type = excluded.participant_type,
        audiences = excluded.audiences
  returning * into participant;

  return participant;
end;
$$;

create or replace function public.lms_complete_module(p_module_id uuid)
returns table (
  course_id uuid,
  module_id uuid,
  course_status text,
  completed_modules integer,
  total_modules integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_course_id uuid;
  completed_count integer;
  total_count integer;
  has_evaluation boolean;
  resolved_status text;
begin
  if auth.uid() is null then
    raise exception 'Sesión autenticada requerida' using errcode = '42501';
  end if;

  select module.course_id into target_course_id
  from public.lms_course_modules module
  where module.id = p_module_id;

  if target_course_id is null or not public.lms_can_read_course(target_course_id) then
    raise exception 'Módulo no disponible' using errcode = '42501';
  end if;

  insert into public.lms_module_progress (user_id, module_id)
  values (auth.uid(), p_module_id)
  on conflict (user_id, module_id) do nothing;

  select count(*) into total_count
  from public.lms_course_modules
  where course_id = target_course_id;

  select count(*) into completed_count
  from public.lms_module_progress progress
  join public.lms_course_modules module on module.id = progress.module_id
  where progress.user_id = auth.uid()
    and module.course_id = target_course_id;

  select exists (
    select 1 from public.lms_evaluation_questions where course_id = target_course_id
  ) into has_evaluation;

  resolved_status := case
    when total_count > 0 and completed_count = total_count and not has_evaluation then 'aprobado'
    else 'en_progreso'
  end;

  insert into public.lms_course_results (user_id, course_id, status, completed_at)
  values (
    auth.uid(),
    target_course_id,
    resolved_status,
    case when resolved_status = 'aprobado' then now() else null end
  )
  on conflict (user_id, course_id) do update
    set status = case
      when public.lms_course_results.status = 'aprobado' then 'aprobado'
      else excluded.status
    end,
    completed_at = coalesce(public.lms_course_results.completed_at, excluded.completed_at);

  return query
  select target_course_id, p_module_id,
    (select status from public.lms_course_results where user_id = auth.uid() and course_id = target_course_id),
    completed_count, total_count;
end;
$$;

-- Sólo entrega enunciados y alternativas. La respuesta correcta jamás cruza al cliente.
create or replace function public.lms_get_assessment(p_course_id uuid)
returns table (id uuid, prompt text, options jsonb, question_position integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.lms_can_read_course(p_course_id) then
    raise exception 'Evaluación no disponible' using errcode = '42501';
  end if;

  return query
  select question.id, question.prompt, question.options, question.position as question_position
  from public.lms_evaluation_questions question
  where question.course_id = p_course_id
  order by question.position;
end;
$$;

create or replace function public.lms_submit_assessment(p_course_id uuid, p_answers jsonb)
returns table (status text, score numeric, attempts integer, completed_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  total_modules integer;
  completed_modules integer;
  total_questions integer;
  correct_answers integer;
  calculated_score numeric(5,2);
  passing_score numeric(5,2) := 70.00;
  resolved_status text;
begin
  if auth.uid() is null or not public.lms_can_read_course(p_course_id) then
    raise exception 'Evaluación no disponible' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_answers, '{}'::jsonb)) <> 'object' then
    raise exception 'Formato de respuestas inválido' using errcode = '22023';
  end if;

  select count(*) into total_modules
  from public.lms_course_modules
  where course_id = p_course_id;

  select count(*) into completed_modules
  from public.lms_module_progress progress
  join public.lms_course_modules module on module.id = progress.module_id
  where progress.user_id = auth.uid() and module.course_id = p_course_id;

  if total_modules > 0 and completed_modules < total_modules then
    raise exception 'Completa los módulos antes de rendir la evaluación' using errcode = '22023';
  end if;

  select count(*) into total_questions
  from public.lms_evaluation_questions
  where course_id = p_course_id;

  if total_questions = 0 then
    raise exception 'Este curso no tiene evaluación publicada' using errcode = '22023';
  end if;

  select count(*) into correct_answers
  from public.lms_evaluation_questions question
  where question.course_id = p_course_id
    and coalesce(p_answers ->> question.id::text, '') ~ '^[0-9]+$'
    and (p_answers ->> question.id::text)::integer = question.correct_option;

  calculated_score := round((correct_answers::numeric / total_questions::numeric) * 100, 2);
  resolved_status := case when calculated_score >= passing_score then 'aprobado' else 'reprobado' end;

  insert into public.lms_course_results (
    user_id, course_id, status, score, attempts, last_attempt_at, completed_at
  )
  values (
    auth.uid(), p_course_id, resolved_status, calculated_score, 1, now(),
    case when resolved_status = 'aprobado' then now() else null end
  )
  on conflict (user_id, course_id) do update
    set status = excluded.status,
        score = excluded.score,
        attempts = public.lms_course_results.attempts + 1,
        last_attempt_at = excluded.last_attempt_at,
        completed_at = case
          when excluded.status = 'aprobado' then coalesce(public.lms_course_results.completed_at, excluded.completed_at)
          else public.lms_course_results.completed_at
        end;

  return query
  select result.status, result.score, result.attempts, result.completed_at
  from public.lms_course_results result
  where result.user_id = auth.uid() and result.course_id = p_course_id;
end;
$$;

revoke all on function public.lms_is_manager() from public;
revoke all on function public.lms_current_audiences() from public;
revoke all on function public.lms_can_read_course(uuid) from public;
grant execute on function public.lms_is_manager() to authenticated;
grant execute on function public.lms_current_audiences() to authenticated;
grant execute on function public.lms_can_read_course(uuid) to authenticated;
grant execute on function public.lms_bootstrap_profile() to authenticated;
grant execute on function public.lms_complete_module(uuid) to authenticated;
grant execute on function public.lms_get_assessment(uuid) to authenticated;
grant execute on function public.lms_submit_assessment(uuid, jsonb) to authenticated;

alter table public.cursos_lms enable row level security;
alter table public.lms_managers enable row level security;
alter table public.lms_participants enable row level security;
alter table public.lms_course_modules enable row level security;
alter table public.lms_evaluation_questions enable row level security;
alter table public.lms_module_progress enable row level security;
alter table public.lms_course_results enable row level security;

drop policy if exists lms_courses_read on public.cursos_lms;
create policy lms_courses_read on public.cursos_lms
  for select to authenticated
  using (public.lms_can_read_course(id));

drop policy if exists lms_courses_manage on public.cursos_lms;
create policy lms_courses_manage on public.cursos_lms
  for all to authenticated
  using (public.lms_is_manager())
  with check (public.lms_is_manager());

drop policy if exists lms_managers_read_self on public.lms_managers;
create policy lms_managers_read_self on public.lms_managers
  for select to authenticated using (user_id = auth.uid());

drop policy if exists lms_participants_read on public.lms_participants;
create policy lms_participants_read on public.lms_participants
  for select to authenticated
  using (user_id = auth.uid() or public.lms_is_manager());

drop policy if exists lms_modules_read on public.lms_course_modules;
create policy lms_modules_read on public.lms_course_modules
  for select to authenticated using (public.lms_can_read_course(course_id));

drop policy if exists lms_modules_manage on public.lms_course_modules;
create policy lms_modules_manage on public.lms_course_modules
  for all to authenticated
  using (public.lms_is_manager())
  with check (public.lms_is_manager());

drop policy if exists lms_questions_manage on public.lms_evaluation_questions;
create policy lms_questions_manage on public.lms_evaluation_questions
  for all to authenticated
  using (public.lms_is_manager())
  with check (public.lms_is_manager());

drop policy if exists lms_module_progress_read on public.lms_module_progress;
create policy lms_module_progress_read on public.lms_module_progress
  for select to authenticated
  using (user_id = auth.uid() or public.lms_is_manager());

drop policy if exists lms_course_results_read on public.lms_course_results;
create policy lms_course_results_read on public.lms_course_results
  for select to authenticated
  using (user_id = auth.uid() or public.lms_is_manager());

-- Migración inicial de fichas existentes. Es segura de repetir.
insert into public.lms_participants (user_id, email, display_name, participant_type, audiences)
select
  auth_user.id,
  lower(auth_user.email),
  coalesce(nullif(voluntario.nombre, ''), nullif(socio.nombre, ''), split_part(auth_user.email, '@', 1)),
  case when voluntario.id is not null then 'voluntario' else 'socio' end,
  array_remove(array[
    case when socio.id is not null then 'socios' end,
    case when voluntario.id is not null then 'voluntarios' end
  ], null)
from auth.users auth_user
left join public.socios socio on lower(coalesce(socio.email, '')) = lower(auth_user.email)
left join public.voluntarios voluntario on lower(coalesce(voluntario.email, '')) = lower(auth_user.email)
where auth_user.email is not null and (socio.id is not null or voluntario.id is not null)
on conflict (user_id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      participant_type = excluded.participant_type,
      audiences = excluded.audiences;

-- Conserva aprobaciones antiguas cuando el JSON legado ya contiene UUID de
-- cursos existentes. Los identificadores de demostración (por ejemplo, c1) no
-- se fuerzan: requieren una equivalencia editorial explícita para no acreditar
-- por error un curso equivocado.
insert into public.lms_course_results (user_id, course_id, status, attempts, completed_at)
select
  participant.user_id,
  course.id,
  'aprobado',
  1,
  now()
from public.voluntarios volunteer
join public.lms_participants participant
  on lower(participant.email) = lower(volunteer.email)
cross join lateral jsonb_array_elements_text(coalesce(volunteer.cursos_aprobados, '[]'::jsonb)) legacy_course(id)
join public.cursos_lms course on course.id::text = legacy_course.id
on conflict (user_id, course_id) do nothing;

-- Mantiene la cuenta institucional maestra ya usada por la aplicación como
-- gestora del LMS, sólo si existe en Supabase Auth.
insert into public.lms_managers (user_id)
select id from auth.users where lower(email) = 'ag.pruaned@gmail.com'
on conflict (user_id) do nothing;

-- Para gestores que no estén marcados en socios.permiso_gestion_voluntarios,
-- agregue explícitamente su cuenta (reemplace el correo):
-- insert into public.lms_managers (user_id)
-- select id from auth.users where lower(email) = lower('gestor@pruaned.cl')
-- on conflict (user_id) do nothing;
