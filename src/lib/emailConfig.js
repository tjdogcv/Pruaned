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
  
  const nombre = socioData.nombre || 'Socio';
  const montoStr = Number(montoValidado || 0).toLocaleString('es-CL');

  try {
    return await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATE_ID_APPROVAL,
      {
        to_email: socioData.email,
        to_name: nombre,
        nombre_postulante: nombre,
        subject: `Comprobante de Pago Validado ($${montoStr} CLP) - PRUANED A.G.`,
        asunto: `Comprobante de Pago Validado ($${montoStr} CLP) - PRUANED A.G.`,
        message: `Confirmamos que tu pago por un monto de $${montoStr} CLP ha sido validado exitosamente por Tesorería de PRUANED A.G.\n\nTu registro en el padrón social se encuentra debidamente actualizado y al día.\n\nMuchas gracias por tu compromiso continuo con nuestra asociación gremial.`,
        body_html: `Confirmamos que tu pago por un monto de $${montoStr} CLP ha sido validado exitosamente por Tesorería de PRUANED A.G.\n\nTu registro en el padrón social se encuentra debidamente actualizado y al día.\n\nMuchas gracias por tu compromiso continuo con nuestra asociación gremial.`,
        mensaje_personalizado: `Tu comprobante de pago por $${montoStr} CLP ha sido validado exitosamente por Tesorería.`
      },
      EMAILJS_PUBLIC_KEY
    );
  } catch (err) {
    console.warn("[Email] No se pudo enviar confirmación de pago validado:", err);
    return null;
  }
};

/**
 * Envía un aviso / recordatorio de cobro de cuotas pendientes con datos bancarios
 */
export const sendAvisoCobroEmail = async (socioData, deudaDetalle = {}) => {
  if (!socioData?.email || socioData.email.includes('anonimizado')) return;
  
  const nombre = socioData.nombre || 'Socio';
  const totalCLP = Number(deudaDetalle.montoTotal || 0).toLocaleString('es-CL');

  try {
    return await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATE_ID_APPROVAL,
      {
        to_email: socioData.email,
        to_name: nombre,
        nombre_postulante: nombre,
        subject: `Recordatorio de Cuotas Sociales Pendientes - PRUANED A.G.`,
        asunto: `Recordatorio de Cuotas Sociales Pendientes - PRUANED A.G.`,
        message: `Le recordamos desde Tesorería PRUANED A.G. que registra compromisos sociales pendientes por un total de $${totalCLP} CLP (${deudaDetalle.detalle || 'Cuotas ordinarias'}).\n\nDatos de transferencia bancaria oficial:\n• Titular: PRUANED A.G.\n• RUT: 65.272.406-K\n• Banco: Mercado Pago\n• Tipo: Cuenta Vista\n• N° Cuenta: 1046032015\n• Correo: ag.pruaned@gmail.com\n\nFavor enviar el comprobante de transferencia a este correo para actualizar su estado de cuota a "Al Día".`,
        body_html: `Le recordamos desde Tesorería PRUANED A.G. que registra compromisos sociales pendientes por un total de $${totalCLP} CLP (${deudaDetalle.detalle || 'Cuotas ordinarias'}).\n\nDatos de transferencia bancaria oficial:\n• Titular: PRUANED A.G.\n• RUT: 65.272.406-K\n• Banco: Mercado Pago\n• Tipo: Cuenta Vista\n• N° Cuenta: 1046032015\n• Correo: ag.pruaned@gmail.com\n\nFavor enviar el comprobante de transferencia a este correo para actualizar su estado de cuota a "Al Día".`,
        mensaje_personalizado: `Registras compromisos sociales pendientes por $${totalCLP} CLP.`
      },
      EMAILJS_PUBLIC_KEY
    );
  } catch (err) {
    console.warn("[Email] Error enviando recordatorio de cobro:", err);
    return null;
  }
};

export const sendApprovalEmail = async (postulanteData) => {
  if (EMAILJS_PUBLIC_KEY === "TU_PUBLIC_KEY") {
    console.warn(`[SIMULACIÓN] Correo de APROBACIÓN enviado a: ${postulanteData.email}`);
    return Promise.resolve("Simulated");
  }

  const nombre = postulanteData.nombreCompleto || postulanteData.nombre || 'Postulante';

  try {
    return await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATE_ID_APPROVAL,
      {
        to_email: postulanteData.email,
        to_name: nombre,
        nombre_postulante: nombre,
        subject: "¡Resolución de Postulación: APROBADA! - PRUANED A.G.",
        asunto: "¡Resolución de Postulación: APROBADA! - PRUANED A.G.",
        message: `El Directorio Nacional de la Asociación Gremial de Profesionales Unidos por los Animales en Emergencias y Desastres (PRUANED A.G.) tiene el agrado de informarle que, tras revisar los antecedentes presentados, su postulación de membresía ha sido APROBADA OFICIALMENTE.\n\n¡Bienvenido/a a PRUANED A.G.!\n\nA partir de este momento, usted es formalmente reconocido como Socio y se encuentra habilitado para acceder a todos los beneficios, derechos y deberes que confieren nuestros estatutos.\n\nPasos a seguir:\n1. Ingrese al Portal Seguro en www.pruaned.cl e inicie sesión activando su cuenta con este mismo correo.\n2. Ingrese a Mi Perfil para revisar sus credenciales y estado gremial.`,
        body_html: `El Directorio Nacional de la Asociación Gremial de Profesionales Unidos por los Animales en Emergencias y Desastres (PRUANED A.G.) tiene el agrado de informarle que, tras revisar los antecedentes presentados, su postulación de membresía ha sido APROBADA OFICIALMENTE.\n\n¡Bienvenido/a a PRUANED A.G.!\n\nA partir de este momento, usted es formalmente reconocido como Socio y se encuentra habilitado para acceder a todos los beneficios, derechos y deberes que confieren nuestros estatutos.\n\nPasos a seguir:\n1. Ingrese al Portal Seguro en www.pruaned.cl e inicie sesión activando su cuenta con este mismo correo.\n2. Ingrese a Mi Perfil para revisar sus credenciales y estado gremial.`,
        mensaje_personalizado: "¡Bienvenido/a a PRUANED A.G.! Su postulación ha sido aprobada oficialmente."
      },
      EMAILJS_PUBLIC_KEY
    );
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
