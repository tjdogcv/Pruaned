-- PRUANED — Visibilidad de documentos: público o sólo socios.
-- Requiere ejecutar antes 20260820_gestor_documentos_publicos.sql.

do $$
begin
  if to_regclass('public.documentos') is null then
    raise exception 'Falta public.documentos. Ejecute primero el esquema base.';
  end if;
end;
$$;

alter table public.documentos
  add column if not exists visibilidad text not null default 'publico'
  check (visibilidad in ('publico', 'socios'));

update public.documentos
set visibilidad = 'publico'
where visibilidad is null or visibilidad not in ('publico', 'socios');

create index if not exists documentos_visibilidad_publicacion_idx
  on public.documentos (visibilidad, publicado, fecha desc);

create or replace function public.document_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.socios socio
    where lower(coalesce(socio.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.documentos enable row level security;

drop policy if exists documentos_public_read on public.documentos;
drop policy if exists documentos_socios_read on public.documentos;
drop policy if exists documentos_manager_read on public.documentos;
drop policy if exists documentos_manager_insert on public.documentos;
drop policy if exists documentos_manager_update on public.documentos;

create policy documentos_public_read
  on public.documentos for select to anon, authenticated
  using (publicado = true and visibilidad = 'publico');

create policy documentos_socios_read
  on public.documentos for select to authenticated
  using (publicado = true and visibilidad = 'socios' and public.document_member());

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos-socios',
  'documentos-socios',
  false,
  20971520,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists documentos_manager_files_insert on storage.objects;
drop policy if exists documentos_manager_files_update on storage.objects;
drop policy if exists documentos_manager_files_delete on storage.objects;
drop policy if exists documentos_socios_files_read on storage.objects;

create policy documentos_manager_files_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('documentos-publicos', 'documentos-socios')
    and public.document_manager()
  );

create policy documentos_manager_files_update
  on storage.objects for update to authenticated
  using (
    bucket_id in ('documentos-publicos', 'documentos-socios')
    and public.document_manager()
  )
  with check (
    bucket_id in ('documentos-publicos', 'documentos-socios')
    and public.document_manager()
  );

create policy documentos_manager_files_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('documentos-publicos', 'documentos-socios')
    and public.document_manager()
  );

create policy documentos_socios_files_read
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documentos-socios'
    and (public.document_member() or public.document_manager())
  );

revoke all on function public.document_member() from public;
grant execute on function public.document_member() to authenticated;
