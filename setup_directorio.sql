CREATE TABLE IF NOT EXISTS public.directorio_cargos (
    id integer PRIMARY KEY DEFAULT 1,
    presidente_id uuid REFERENCES public.socios(id),
    vicepresidente_id uuid REFERENCES public.socios(id),
    secretario_id uuid REFERENCES public.socios(id),
    tesorero_id uuid REFERENCES public.socios(id)
);

ALTER TABLE public.directorio_cargos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read" ON public.directorio_cargos;
CREATE POLICY "Allow public read" ON public.directorio_cargos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.directorio_cargos;
CREATE POLICY "Allow all for authenticated" ON public.directorio_cargos FOR ALL USING (auth.role() = 'authenticated');

INSERT INTO public.directorio_cargos (id) VALUES (1) ON CONFLICT DO NOTHING;

-- FIX DEUDA DE $35.000: Marcar cuota de incorporación pagada para los socios importados
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS cuota_incorporacion_pagada boolean DEFAULT false;

UPDATE public.socios 
SET cuota_incorporacion_pagada = true 
WHERE cuota_incorporacion_pagada IS NOT true;
