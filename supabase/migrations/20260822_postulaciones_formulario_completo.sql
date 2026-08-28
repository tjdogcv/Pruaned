-- PRUANED — Persistencia de la ficha ampliada de postulación de socios.
-- Conserva las columnas indexables y agrupa las respuestas extensas en JSONB.

alter table public.postulaciones
  add column if not exists formulario_completo jsonb not null default '{}'::jsonb;
