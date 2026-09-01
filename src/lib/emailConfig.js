import emailjs from '@emailjs/browser';

// ==========================================
// CONFIGURACIÓN DE EMAILJS
// ==========================================
const EMAILJS_PUBLIC_KEY = "CLJN75H6twZHwZaMT";
const EMAILJS_SERVICE_ID = "service_sdm9onf";

const TEMPLATE_ID_POSTULACION = "template_postulacion";
const TEMPLATE_ID_PAGO = "template_pago";
const TEMPLATE_ID_APPROVAL = "template_mxedl3t";
const TEMPLATE_ID_REJECTION = "template_qwammao";

/**
 * Envía correo de notificación de Nueva Postulación de Socio
 */
export const sendPostulacionEmail = async (postulacionData) => {
  if (EMAILJS_PUBLIC_KEY === "TU_PUBLIC_KEY") {
    console.warn("EmailJS no está configurado. Simulado envío de postulación.");
    return Promise.resolve("Simulated");
  }

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATE_ID_POSTULACION,
      {
        to_email: "ag.pruaned@gmail.com",
        from_name: postulacionData.nombreCompleto,
        from_email: postulacionData.email,
        postulacion_id: postulacionData.id,
        rut: postulacionData.rut,
        profesion: postulacionData.profesion
      },
      EMAILJS_PUBLIC_KEY
    );
    return response;
  } catch (error) {
    console.error("Error al enviar email de postulación", error);
    return null;
  }
};

/**
 * Envía correo de notificación de Pago de Cuota a Tesorería
 */
export const sendPagoEmail = async (pagoData, socioData) => {
  if (EMAILJS_PUBLIC_KEY === "TU_PUBLIC_KEY") {
    console.warn("EmailJS no está configurado. Simulado envío de pago.");
    return Promise.resolve("Simulated");
  }

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATE_ID_PAGO,
      {
        to_email: "ag.pruaned@gmail.com",
        socio_nombre: socioData.nombre,
        socio_rut: socioData.rut,
        monto: pagoData.monto,
        meses_cancelados: pagoData.mesesCancelados || "No especificado",
        referencia: pagoData.referencia || "Sin referencia"
      },
      EMAILJS_PUBLIC_KEY
    );
    return response;
  } catch (error) {
    console.error("Error al enviar email de pago", error);
    return null;
  }
};

/**
 * Notifica al socio que su comprobante de pago fue validado y su cuenta quedó 'Al Día'
 */
export const sendPagoValidadoEmail = async (socioData, montoValidado) => {
  if (!socioData?.email || socioData.email.includes('anonimizado')) return;
  
  try {
    return await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATE_ID_APPROVAL,
      {
        to_email: socioData.email,
        nombre_postulante: socioData.nombre,
        mensaje_personalizado: `Tu comprobante de pago por $${Number(montoValidado || 0).toLocaleString('es-CL')} ha sido validado exitosamente por Tesorería. Tu cuenta gremial se encuentra ahora Al Día.`
      },
      EMAILJS_PUBLIC_KEY
    );
  } catch (err) {
    console.warn("[Email] No se pudo enviar confirmación de pago validado:", err);
    return null;
  }
};

export const sendApprovalEmail = async (postulanteData) => {
  if (EMAILJS_PUBLIC_KEY === "TU_PUBLIC_KEY") {
    console.warn(`[SIMULACIÓN] Correo de APROBACIÓN enviado a: ${postulanteData.email}`);
    return Promise.resolve("Simulated");
  }

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATE_ID_APPROVAL,
      {
        to_email: postulanteData.email,
        nombre_postulante: postulanteData.nombreCompleto
      },
      EMAILJS_PUBLIC_KEY
    );
    return response;
  } catch (error) {
    console.error("Error al enviar email de aprobación", error);
    return null;
  }
};

export const sendRejectionEmail = async (postulanteData) => {
  if (EMAILJS_PUBLIC_KEY === "TU_PUBLIC_KEY") {
    console.warn(`[SIMULACIÓN] Correo de RECHAZO enviado a: ${postulanteData.email}`);
    return Promise.resolve("Simulated");
  }

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATE_ID_REJECTION,
      {
        to_email: postulanteData.email,
        nombre_postulante: postulanteData.nombreCompleto
      },
      EMAILJS_PUBLIC_KEY
    );
    return response;
  } catch (error) {
    console.error("Error al enviar email de rechazo", error);
    return null;
  }
};
