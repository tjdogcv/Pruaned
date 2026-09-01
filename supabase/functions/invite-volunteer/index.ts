import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const respond = (body: Record<string, unknown>, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });

const configuredOrigins = () => new Set(
  (Deno.env.get('ALLOWED_ORIGINS') ?? Deno.env.get('SITE_URL') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const corsFor = (origin: string | null) => {
  if (!origin || !configuredOrigins().has(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin'
  };
};

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin');
  const cors = corsFor(origin);
  if (origin && !cors) return respond({ error: 'Origen no autorizado.' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors ?? {} });
  if (request.method !== 'POST') return respond({ error: 'Método no permitido.' }, 405, cors ?? {});

  const projectUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const siteUrl = Deno.env.get('SITE_URL');
  const authorization = request.headers.get('Authorization');
  if (!projectUrl || !anonKey || !serviceRoleKey || !siteUrl || !authorization) {
    return respond({ error: 'Servicio de invitación no configurado.' }, 503, cors ?? {});
  }

  let volunteerId = '';
  try {
    const payload = await request.json();
    volunteerId = typeof payload?.volunteerId === 'string' ? payload.volunteerId : '';
  } catch {
    return respond({ error: 'Solicitud inválida.' }, 400, cors ?? {});
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(volunteerId)) {
    return respond({ error: 'Identificador de voluntario inválido.' }, 400, cors ?? {});
  }

  const requester = createClient(projectUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: identity, error: identityError } = await requester.auth.getUser();
  if (identityError || !identity.user) return respond({ error: 'Sesión no válida.' }, 401, cors ?? {});

  const { data: target, error: targetError } = await requester
    .rpc('pruaned_prepare_volunteer_invitation', { p_voluntario_id: volunteerId })
    .single();
  if (targetError || !target?.email) {
    return respond({ error: targetError?.message ?? 'No fue posible preparar la invitación.' }, 422, cors ?? {});
  }

  const administrator = createClient(projectUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const redirectTo = new URL('/intranet', siteUrl).toString();
  const { error: inviteError } = await administrator.auth.admin.inviteUserByEmail(target.email, { redirectTo });
  if (inviteError) {
    await administrator
      .from('voluntarios')
      .update({
        auth_activation_status: 'error_invitacion',
        ultimo_error_invitacion: 'No fue posible enviar la invitación.',
        updated_at: new Date().toISOString()
      })
      .eq('id', target.voluntario_id)
      .neq('auth_activation_status', 'activo');
    return respond({ error: 'No fue posible enviar la invitación. Revise el correo y vuelva a intentarlo.' }, 422, cors ?? {});
  }

  await administrator
    .from('voluntarios')
    .update({
      auth_activation_status: 'invitado',
      ultima_invitacion_at: new Date().toISOString(),
      ultimo_error_invitacion: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', target.voluntario_id)
    .neq('auth_activation_status', 'activo');

  return respond({ ok: true, activationStatus: 'invitado' }, 200, cors ?? {});
});
