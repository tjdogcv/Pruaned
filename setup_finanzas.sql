CREATE TABLE IF NOT EXISTS public.egresos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha date,
    tipo_documento text,
    numero_documento text,
    proveedor text,
    categoria text,
    origen_fondo text DEFAULT 'Fondo Cuotas', -- 'Fondo Cuotas' o 'Fondo Donaciones'
    monto integer,
    glosa text
);

CREATE TABLE IF NOT EXISTS public.cobros (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    socio_id uuid REFERENCES public.socios(id) ON DELETE CASCADE,
    titulo text,
    monto integer,
    pagado boolean DEFAULT false,
    fecha_creacion timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.balances_anuales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ano integer,
    titulo text,
    url_documento text,
    fecha_publicacion timestamp with time zone DEFAULT now()
);

-- Políticas RLS (Lectura pública para balances, solo auth para cobros/egresos)
ALTER TABLE public.egresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances_anuales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "egresos_read" ON public.egresos FOR SELECT USING (true);
CREATE POLICY "cobros_read" ON public.cobros FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "balances_read" ON public.balances_anuales FOR SELECT USING (true);

-- Políticas CRUD para administradores (auth)
CREATE POLICY "admin_all_egresos" ON public.egresos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_cobros" ON public.cobros FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_balances" ON public.balances_anuales FOR ALL USING (auth.role() = 'authenticated');
