import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { snakeToCamel } from '../lib/authData';

const emptyResult = (error) => ({
  ok: false,
  error: {
    code: error?.code || 'VOLUNTEER_APPLICATION_ERROR',
    message: error?.message || 'No fue posible completar la operación.'
  }
});

const normalizeApplication = (application = {}) => {
  const normalized = snakeToCamel(application);
  return {
    ...normalized,
    nombreCompleto: normalized.nombreCompleto || normalized.nombre || '',
    observacionRevision: normalized.observacionRevision || normalized.reviewNote || '',
    fechaRevision: normalized.fechaRevision || normalized.reviewedAt || null,
    origenPostulacionSocioId: normalized.origenPostulacionSocioId || null
  };
};

/**
 * Contrato de solicitudes de voluntariado. Las reglas de transición y los
 * permisos se evalúan exclusivamente en RPC; el estado local sólo refleja la
 * respuesta ya autorizada del servidor.
 */
export const useVolunteerApplicationsDomain = ({
  supabaseReady,
  currentUser,
  canManageVoluntarios,
  setVoluntariosList,
  setSociosList
}) => {
  const [postulacionesVoluntariadoList, setPostulacionesVoluntariadoList] = useState([]);

  const refreshPostulacionesVoluntariado = useCallback(async () => {
    if (!supabaseReady || !currentUser?.email) {
      setPostulacionesVoluntariadoList([]);
      return { ok: true, data: [] };
    }

    const rpcName = canManageVoluntarios
      ? 'pruaned_list_volunteer_applications'
      : 'pruaned_list_my_volunteer_applications';
    const { data, error } = await supabase.rpc(rpcName);
    if (error) return emptyResult(error);

    const applications = Array.isArray(data) ? data.map(normalizeApplication) : [];
    setPostulacionesVoluntariadoList(applications);
    return { ok: true, data: applications };
  }, [canManageVoluntarios, currentUser?.email, supabaseReady]);

  useEffect(() => {
    void refreshPostulacionesVoluntariado();
  }, [refreshPostulacionesVoluntariado]);

  const addPostulacionVoluntario = useCallback(async (payload) => {
    if (!supabaseReady) {
      return emptyResult({ code: 'SUPABASE_UNAVAILABLE', message: 'La postulación requiere una conexión segura.' });
    }

    const { data, error } = await supabase.rpc('pruaned_submit_volunteer_application', { p_payload: payload });
    if (error) return emptyResult(error);
    return { ok: true, data: normalizeApplication(data) };
  }, [supabaseReady]);

  const updatePostulacionVoluntariadoEstado = useCallback(async (id, decision, observacion = '') => {
    if (!supabaseReady) {
      return emptyResult({ code: 'SUPABASE_UNAVAILABLE', message: 'La revisión requiere una conexión segura.' });
    }

    const { data, error } = await supabase.rpc('pruaned_review_volunteer_application', {
      p_application_id: id,
      p_decision: decision,
      p_review_note: observacion
    });
    if (error) return emptyResult(error);

    await refreshPostulacionesVoluntariado();
    if (data?.voluntario) {
      const volunteer = snakeToCamel(data.voluntario);
      setVoluntariosList((previous) => [
        ...previous.filter((item) => item.id !== volunteer.id),
        volunteer
      ]);
    }
    return { ok: true, data };
  }, [refreshPostulacionesVoluntariado, setVoluntariosList, supabaseReady]);

  const solicitarIngresoSocioDesdeVoluntariado = useCallback(async (payload = {}) => {
    if (!supabaseReady) {
      return emptyResult({ code: 'SUPABASE_UNAVAILABLE', message: 'La solicitud requiere una conexión segura.' });
    }

    const { data, error } = await supabase.rpc('pruaned_request_volunteer_membership', { p_payload: payload });
    if (error) return emptyResult(error);
    await refreshPostulacionesVoluntariado();
    return { ok: true, data: normalizeApplication(data) };
  }, [refreshPostulacionesVoluntariado, supabaseReady]);

  const updateSolicitudIngresoSocioDesdeVoluntariado = useCallback(async (
    id,
    decision,
    categoria = 'Socio Activo',
    observacion = ''
  ) => {
    if (!supabaseReady) {
      return emptyResult({ code: 'SUPABASE_UNAVAILABLE', message: 'La revisión requiere una conexión segura.' });
    }

    const { data, error } = await supabase.rpc('pruaned_review_volunteer_membership', {
      p_application_id: id,
      p_decision: decision,
      p_categoria: categoria,
      p_review_note: observacion
    });
    if (error) return emptyResult(error);

    await refreshPostulacionesVoluntariado();
    if (data?.socio) {
      const socio = snakeToCamel(data.socio);
      setSociosList((previous) => [...previous.filter((item) => item.id !== socio.id), socio]);
    }
    return { ok: true, data };
  }, [refreshPostulacionesVoluntariado, setSociosList, supabaseReady]);

  return {
    postulacionesVoluntariadoList,
    refreshPostulacionesVoluntariado,
    addPostulacionVoluntario,
    updatePostulacionVoluntariadoEstado,
    solicitarIngresoSocioDesdeVoluntariado,
    updateSolicitudIngresoSocioDesdeVoluntariado
  };
};
