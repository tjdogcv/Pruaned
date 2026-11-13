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

  const updatePostulacionVoluntariadoData = useCallback(async (id, updates = {}) => {
    if (!supabaseReady || !supabase) {
      return emptyResult({ code: 'SUPABASE_UNAVAILABLE', message: 'La edición de fichas requiere una conexión segura.' });
    }

    const { data, error } = await supabase.rpc('pruaned_update_volunteer_application', {
      p_application_id: id,
      p_updates: updates
    });
    if (error) return emptyResult(error);

    const application = normalizeApplication(data);
    setPostulacionesVoluntariadoList((previous) =>
      previous.map((item) => (item.id === application.id ? application : item))
    );

    if (application.voluntarioId && typeof setVoluntariosList === 'function') {
      const form = application.formularioCompleto || {};
      setVoluntariosList((previous) =>
        previous.map((vol) => {
          if (vol.id !== application.voluntarioId) return vol;
          return {
            ...vol,
            nombre: application.nombreCompleto || vol.nombre,
            rut: application.rut || vol.rut,
            email: application.email || vol.email,
            telefono: application.telefono || vol.telefono,
            region: application.region || vol.region,
            especialidad: application.profesionEspecialidad || vol.especialidad,
            disponibilidadRespuesta: form.disponibilidadRespuesta || form.disponibilidad || vol.disponibilidadRespuesta,
            recursosPropios: Array.isArray(form.recursos)
              ? form.recursos.join(', ')
              : (form.recursosPropios || vol.recursosPropios),
            laboresQuePuedeRealizar: Array.isArray(form.labores)
              ? form.labores.join(', ')
              : (form.laboresQuePuedeRealizar || vol.laboresQuePuedeRealizar),
            datosPostulacion: {
              ...(vol.datosPostulacion || {}),
              formulario: {
                ...(vol.datosPostulacion?.formulario || {}),
                ...form
              }
            }
          };
        })
      );
    }

    return { ok: true, data: application };
  }, [setVoluntariosList, supabaseReady]);

  const updateVoluntarioData = useCallback(async (volunteerId, updates = {}) => {
    if (!supabaseReady || !supabase) {
      let updatedLocal = null;
      if (typeof setVoluntariosList === 'function') {
        setVoluntariosList((previous) =>
          previous.map((vol) => {
            if (vol.id !== volunteerId) return vol;
            const prevForm = vol.datosPostulacion?.formulario || {};
            const nextForm = { ...prevForm, ...updates };
            updatedLocal = {
              ...vol,
              nombre: updates.nombreCompleto || updates.nombre || vol.nombre,
              rut: updates.rut || vol.rut,
              email: updates.email || vol.email,
              telefono: updates.telefono ?? vol.telefono,
              region: updates.region ?? vol.region,
              especialidad: updates.profesionEspecialidad || updates.especialidad || vol.especialidad,
              nivelAcreditacion: updates.nivelAcreditacion || vol.nivelAcreditacion,
              estado: updates.estado || vol.estado,
              disponibilidadRespuesta: updates.disponibilidadRespuesta ?? vol.disponibilidadRespuesta,
              recursosPropios: Array.isArray(updates.recursos)
                ? updates.recursos.join(', ')
                : (updates.recursosPropios ?? vol.recursosPropios),
              laboresQuePuedeRealizar: Array.isArray(updates.labores)
                ? updates.labores.join(', ')
                : (updates.laboresQuePuedeRealizar ?? vol.laboresQuePuedeRealizar),
              ultimaActualizacionDisponibilidad: new Date().toISOString(),
              datosPostulacion: {
                ...(vol.datosPostulacion || {}),
                formulario: nextForm
              }
            };
            return updatedLocal;
          })
        );
      }
      return { ok: true, data: updatedLocal };
    }

    const { data, error } = await supabase.rpc('pruaned_update_volunteer_profile', {
      p_volunteer_id: volunteerId,
      p_updates: updates
    });
    if (error) return emptyResult(error);

    const volunteer = snakeToCamel(data);
    if (typeof setVoluntariosList === 'function') {
      setVoluntariosList((previous) =>
        previous.map((vol) => (vol.id === volunteer.id ? volunteer : vol))
      );
    }
    if (canManageVoluntarios) {
      await refreshPostulacionesVoluntariado();
    }

    return { ok: true, data: volunteer };
  }, [canManageVoluntarios, refreshPostulacionesVoluntariado, setVoluntariosList, supabaseReady]);

  return {
    postulacionesVoluntariadoList,
    refreshPostulacionesVoluntariado,
    addPostulacionVoluntario,
    updatePostulacionVoluntariadoEstado,
    updatePostulacionVoluntariadoData,
    updateVoluntarioData,
    solicitarIngresoSocioDesdeVoluntariado,
    updateSolicitudIngresoSocioDesdeVoluntariado
  };
};
