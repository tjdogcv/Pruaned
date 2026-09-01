import emailjs from '@emailjs/browser';

const EMAILJS_PUBLIC_KEY = "CLJN75H6twZHwZaMT";
const EMAILJS_SERVICE_ID = "service_sdm9onf";

// ==========================================
// CORREOS MASIVOS - COMUNICACIONES GREMIALES
// ==========================================
// Template para comunicaciones masivas
// Crea un template en EmailJS con:
// - to_email   : {{to_email}}
// - to_name    : {{to_name}}
// - subject    : {{subject}}
// - body_html  : {{body_html}}
const TEMPLATE_ID_MASIVO = "template_masivo"; // <-- REEMPLAZAR CON TU TEMPLATE ID

/**
 * Envía un correo individual como parte de una comunicación masiva.
 * @param {string} toEmail - Email del destinatario
 * @param {string} toName  - Nombre del destinatario
 * @param {string} subject - Asunto del correo
 * @param {string} bodyHtml - Cuerpo del mensaje en texto plano (se puede incluir HTML básico)
 */
const sendSingleMassivoEmail = async (toEmail, toName, subject, bodyHtml) => {
  return emailjs.send(
    EMAILJS_SERVICE_ID,
    TEMPLATE_ID_MASIVO,
    { to_email: toEmail, to_name: toName, subject, body_html: bodyHtml },
    EMAILJS_PUBLIC_KEY
  );
};

/**
 * Envía un correo masivo a una lista de destinatarios.
 * Retorna un resumen { sent, failed, errors }.
 * Agrega un delay de 300ms entre envíos para no saturar la API de EmailJS.
 */
export const sendMassivoEmail = async (recipients, subject, bodyHtml, onProgress = null) => {
  const results = { sent: 0, failed: 0, errors: [] };

  for (let i = 0; i < recipients.length; i++) {
    const { email, nombre } = recipients[i];
    if (!email || email.includes('anonimizado')) {
      results.failed++;
      continue;
    }
    try {
      await sendSingleMassivoEmail(email, nombre || email, subject, bodyHtml);
      results.sent++;
    } catch (err) {
      results.failed++;
      results.errors.push({ email, error: err.text || err.message || 'Error desconocido' });
    }
    if (onProgress) onProgress(i + 1, recipients.length);
    // Delay para respetar rate limit de EmailJS (400ms entre envíos)
    await new Promise(r => setTimeout(r, 400));
  }

  return results;
};
