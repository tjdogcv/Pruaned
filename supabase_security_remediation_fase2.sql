-- ============================================================================
-- SCRIPT FINAL DE BLINDAJE DE SEGURIDAD (FASE 2) - SUPABASE PRUANED A.G.
-- ============================================================================

-- ============================================================================
-- 1. CORREGIR POLÍTICAS RLS RESTANTES (rls_policy_always_true)
-- ============================================================================

-- A. Cursos LMS: Separar lectura para autenticados y escritura para directiva/gestores
ALTER TABLE IF EXISTS public.cursos_lms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cursos: todas operaciones autenticados" ON public.cursos_lms;

DROP POLICY IF EXISTS "Cursos: lectura autenticados" ON public.cursos_lms;
CREATE POLICY "Cursos: lectura autenticados" ON public.cursos_lms 
  FOR SELECT TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Cursos: gestion directiva" ON public.cursos_lms;
CREATE POLICY "Cursos: gestion directiva" ON public.cursos_lms 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('master', 'directiva')
    ) OR auth.email() = 'ag.pruaned@gmail.com'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('master', 'directiva')
    ) OR auth.email() = 'ag.pruaned@gmail.com'
  );

-- B. Postulaciones Socios: Validación de campos (nombre_completo, rut, email)
DROP POLICY IF EXISTS "Postulaciones: insertar público" ON public.postulaciones;
CREATE POLICY "Postulaciones: insertar público" ON public.postulaciones 
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL AND 
    rut IS NOT NULL AND 
    nombre_completo IS NOT NULL
  );

-- C. Postulaciones Voluntariado: Validación de campos
DROP POLICY IF EXISTS "Postulaciones voluntariado insertar público" ON public.postulaciones_voluntariado;
CREATE POLICY "Postulaciones voluntariado insertar público" ON public.postulaciones_voluntariado 
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL AND 
    rut IS NOT NULL AND
    nombre_completo IS NOT NULL
  );


-- ============================================================================
-- 2. CAMBIAR FUNCIONES A "SECURITY INVOKER" (anon / authenticated_security_definer)
-- ============================================================================

DO $$
BEGIN
  -- Funciones utilitarias
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'auth_email') THEN
    ALTER FUNCTION public.auth_email() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'document_manager') THEN
    ALTER FUNCTION public.document_manager() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'document_member') THEN
    ALTER FUNCTION public.document_member() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'protect_socio_financials') THEN
    ALTER FUNCTION public.protect_socio_financials() SECURITY INVOKER;
  END IF;

  -- Funciones de permisos y roles
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'get_user_role' AND pronargs = 1) THEN
    ALTER FUNCTION public.get_user_role(uuid) SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'get_user_permissions' AND pronargs = 1) THEN
    ALTER FUNCTION public.get_user_permissions(uuid) SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'is_master_user' AND pronargs = 1) THEN
    ALTER FUNCTION public.is_master_user(uuid) SECURITY INVOKER;
  END IF;

  -- Funciones de PRUANED
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_current_role') THEN
    ALTER FUNCTION public.pruaned_current_role() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_is_master_user') THEN
    ALTER FUNCTION public.pruaned_is_master_user() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_is_directiva') THEN
    ALTER FUNCTION public.pruaned_is_directiva() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_is_finance_manager') THEN
    ALTER FUNCTION public.pruaned_is_finance_manager() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_can_manage_categories') THEN
    ALTER FUNCTION public.pruaned_can_manage_categories() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_can_manage_finances') THEN
    ALTER FUNCTION public.pruaned_can_manage_finances() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_can_manage_voluntarios') THEN
    ALTER FUNCTION public.pruaned_can_manage_voluntarios() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_can_publish_cms') THEN
    ALTER FUNCTION public.pruaned_can_publish_cms() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_get_my_identity') THEN
    ALTER FUNCTION public.pruaned_get_my_identity() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_login_lockout') THEN
    ALTER FUNCTION public.pruaned_login_lockout(text, text) SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_record_login_event') THEN
    ALTER FUNCTION public.pruaned_record_login_event(text, text, text) SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_list_socio_applications') THEN
    ALTER FUNCTION public.pruaned_list_socio_applications() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_submit_socio_application') THEN
    ALTER FUNCTION public.pruaned_submit_socio_application(jsonb) SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_review_socio_application') THEN
    ALTER FUNCTION public.pruaned_review_socio_application(uuid, text, text, text) SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_list_volunteer_applications') THEN
    ALTER FUNCTION public.pruaned_list_volunteer_applications() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_list_my_volunteer_applications') THEN
    ALTER FUNCTION public.pruaned_list_my_volunteer_applications() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_submit_volunteer_application') THEN
    ALTER FUNCTION public.pruaned_submit_volunteer_application(jsonb) SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_review_volunteer_application') THEN
    ALTER FUNCTION public.pruaned_review_volunteer_application(uuid, text, text) SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_request_volunteer_membership') THEN
    ALTER FUNCTION public.pruaned_request_volunteer_membership(jsonb) SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'pruaned_review_volunteer_membership') THEN
    ALTER FUNCTION public.pruaned_review_volunteer_membership(uuid, text, text, text) SECURITY INVOKER;
  END IF;

  -- Funciones de LMS
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'lms_is_manager') THEN
    ALTER FUNCTION public.lms_is_manager() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'lms_current_audiences') THEN
    ALTER FUNCTION public.lms_current_audiences() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'lms_can_read_course') THEN
    ALTER FUNCTION public.lms_can_read_course(uuid) SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'lms_bootstrap_profile') THEN
    ALTER FUNCTION public.lms_bootstrap_profile() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'lms_archive_course') THEN
    ALTER FUNCTION public.lms_archive_course(uuid) SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'lms_restore_course') THEN
    ALTER FUNCTION public.lms_restore_course(uuid) SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'lms_complete_module') THEN
    ALTER FUNCTION public.lms_complete_module(uuid) SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'lms_get_assessment') THEN
    ALTER FUNCTION public.lms_get_assessment(uuid) SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'lms_get_course_editor') THEN
    ALTER FUNCTION public.lms_get_course_editor(uuid) SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'lms_refresh_course_evaluation_flag') THEN
    ALTER FUNCTION public.lms_refresh_course_evaluation_flag() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'lms_save_course_bundle') THEN
    ALTER FUNCTION public.lms_save_course_bundle(uuid, jsonb, jsonb, jsonb) SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname = 'lms_submit_assessment') THEN
    ALTER FUNCTION public.lms_submit_assessment(uuid, jsonb) SECURITY INVOKER;
  END IF;

END $$;
