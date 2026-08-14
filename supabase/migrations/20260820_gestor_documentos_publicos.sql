-- PRUANED — Gestor de documentos publicados
-- Aditiva e idempotente: no borra documentos ni archivos existentes.

create extension if not exists "uuid-ossp";

do $$
begin
  if to_regclass('public.documentos') is null then
    raise exception 'Falta public.documentos. Ejecute primero el esquema base.';
  end if;
end;
$$;

alter table public.documentos
  add column if not exists fecha date default current_date,
  add column if not exists publicado boolean not null default true,
  add column if not exists version text not null default 'v1.0',
  add column if not exists archivo_nombre text,
  add column if not exists archivo_tipo text,
  add column if not exists archivo_bytes bigint,
  add column if not exists storage_path text,
  add column if not exists uploaded_by uuid references auth.users(id),
  add column if not exists archivado_at timestamptz,
  add column if not exists archivado_por uuid references auth.users(id),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists documentos_storage_path_unique
  on public.documentos (storage_path)
  where storage_path is not null;

create index if not exists documentos_publicados_fecha_idx
  on public.documentos (publicado, fecha desc);

create table if not exists public.document_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique check (btrim(name) <> ''),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

do $migration$
begin
  if to_regclass('public.parametros_sistema') is not null then
    execute $sql$
      insert into public.document_categories (name)
      select distinct btrim(category_name)
      from public.parametros_sistema parameter,
        lateral jsonb_array_elements_text(
          case when jsonb_typeof(parameter.valor) = 'array' then parameter.valor else '[]'::jsonb end
        ) category_name
      where parameter.id = 'doc_categories'
        and btrim(category_name) <> ''
      on conflict (name) do nothing
    $sql$;
  end if;
end;
$migration$;

insert into public.document_categories (name)
values
  ('Actas y asambleas'),
  ('Estatutos & Reglamentos'),
  ('Protocolos RRD - GRD'),
  ('Guías Técnicas Veterinarias'),
  ('Convenios & Alianzas'),
  ('Informes Financieros & Memoria')
on conflict (name) do nothing;

create or replace function public.document_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'ag.pruaned@gmail.com'
  or exists (
    select 1
    from public.socios socio
    join public.directorio_cargos cargos on cargos.id = 1
    where lower(coalesce(socio.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and socio.id in (
        cargos.presidente_id,
        cargos.vicepresidente_id,
        cargos.secretario_id,
        cargos.tesorero_id
      )
  );
$$;

create or replace function public.document_set_metadata()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' and new.uploaded_by is null then
    new.uploaded_by := auth.uid();
  end if;
  if tg_op = 'UPDATE' and old.publicado and not new.publicado then
    new.archivado_at := now();
    new.archivado_por := auth.uid();
  elsif tg_op = 'UPDATE' and not old.publicado and new.publicado then
    new.archivado_at := null;
    new.archivado_por := null;
  end if;
  return new;
end;
$$;

drop trigger if exists documentos_set_metadata on public.documentos;
create trigger documentos_set_metadata
  before insert or update on public.documentos
  for each row execute function public.document_set_metadata();

create or replace function public.document_category_must_be_unused()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1 from public.documentos where categoria = old.name
  ) then
    raise exception 'La categoría aún tiene documentos asociados' using errcode = '23503';
  end if;
  return old;
end;
$$;

drop trigger if exists document_category_must_be_unused on public.document_categories;
create trigger document_category_must_be_unused
  before delete on public.document_categories
  for each row execute function public.document_category_must_be_unused();

insert into public.documentos (
  titulo, categoria, descripcion, url, fecha, version, publicado
)
select
  'Estatutos PRUANED A.G.',
  'Estatutos & Reglamentos',
  'Versión oficial publicada de los estatutos de PRUANED A.G.',
  '/Estatutos-v-3.pdf',
  current_date,
  'v3',
  true
where not exists (
  select 1 from public.documentos
  where lower(titulo) = lower('Estatutos PRUANED A.G.')
);

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'documentos-publicos',
  'documentos-publicos',
  true,
  20971520,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.documentos enable row level security;
alter table public.document_categories enable row level security;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'documentos'
  loop
    execute format('drop policy if exists %I on public.documentos', existing_policy.policyname);
  end loop;

  for existing_policy in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'document_categories'
  loop
    execute format('drop policy if exists %I on public.document_categories', existing_policy.policyname);
  end loop;
end;
$$;

create policy documentos_public_read
  on public.documentos for select to anon, authenticated
  using (publicado = true);

create policy documentos_manager_read
  on public.documentos for select to authenticated
  using (public.document_manager());

create policy documentos_manager_insert
  on public.documentos for insert to authenticated
  with check (public.document_manager());

create policy documentos_manager_update
  on public.documentos for update to authenticated
  using (public.document_manager())
  with check (public.document_manager());

create policy document_categories_public_read
  on public.document_categories for select to anon, authenticated
  using (true);

create policy document_categories_manager_insert
  on public.document_categories for insert to authenticated
  with check (public.document_manager());

create policy document_categories_manager_update
  on public.document_categories for update to authenticated
  using (public.document_manager())
  with check (public.document_manager());

create policy document_categories_manager_delete
  on public.document_categories for delete to authenticated
  using (public.document_manager());

drop policy if exists documentos_public_files_read on storage.objects;
drop policy if exists documentos_manager_files_insert on storage.objects;
drop policy if exists documentos_manager_files_update on storage.objects;
drop policy if exists documentos_manager_files_delete on storage.objects;

create policy documentos_public_files_read
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'documentos-publicos');

create policy documentos_manager_files_insert
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos-publicos' and public.document_manager());

create policy documentos_manager_files_update
  on storage.objects for update to authenticated
  using (bucket_id = 'documentos-publicos' and public.document_manager())
  with check (bucket_id = 'documentos-publicos' and public.document_manager());

create policy documentos_manager_files_delete
  on storage.objects for delete to authenticated
  using (bucket_id = 'documentos-publicos' and public.document_manager());

grant select on public.documentos to anon, authenticated;
grant insert, update on public.documentos to authenticated;
grant select on public.document_categories to anon, authenticated;
grant insert, update, delete on public.document_categories to authenticated;
revoke delete on public.documentos from anon, authenticated;

revoke all on function public.document_manager() from public;
grant execute on function public.document_manager() to authenticated;
