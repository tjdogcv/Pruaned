import emailjs from '@emailjs/browser';

// ==========================================
// CONFIGURACIÓN DE EMAILJS
// ==========================================
// Para que los correos funcionen debes:
// 1. Crear una cuenta en https://www.emailjs.com/
// 2. Conectar tu correo (ag.pruaned@gmail.com) como un "Service" (Obtendrás tu SERVICE_ID).
// 3. Crear los "Templates" (Plantillas de correo) y obtener sus TEMPLATE_ID.
// 4. Ir a Account -> API Keys y copiar tu PUBLIC_KEY.
// ==========================================

const EMAILJS_PUBLIC_KEY = "CLJN75H6twZHwZaMT"; // Actualizado desde tu cuenta
const EMAILJS_SERVICE_ID = "service_sdm9onf"; // Actualizado desde tu captura

// Template para notificar al directorio de una nueva postulación
const TEMPLATE_ID_POSTULACION = "template_postulacion"; // <-- REEMPLAZAR AQUÍ

// Template para notificar a tesorería de un pago de cuota
const TEMPLATE_ID_PAGO = "template_pago"; // <-- REEMPLAZAR AQUÍ

/**
 * Envía correo de notificación de Nueva Postulación
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
        to_email: "ag.pruaned@gmail.com", // A quién le llega el aviso
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
    throw error;
  }
};

/**
 * Envía correo de notificación de Pago de Cuota
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
        to_email: "ag.pruaned@gmail.com", // Tesorería
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
    throw error;
  }
};

// ==========================================
// NUEVOS CORREOS: APROBACIÓN Y RECHAZO
// ==========================================
const TEMPLATE_ID_APPROVAL = "template_mxedl3t"; // Actualizado desde tu captura
const TEMPLATE_ID_REJECTION = "template_qwammao"; // Actualizado desde tu captura

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
    throw error;
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
    throw error;
  }
};
