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
// Template ID por defecto: usamos el configurado por el usuario o 'template_mxedl3t' (activo en EmailJS)
export const getMassivoTemplateId = () => {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem('pruaned_emailjs_template_masivo');
    if (saved && saved.trim()) return saved.trim();
  }
  return 'template_mxedl3t';
};

export const setMassivoTemplateId = (templateId) => {
  if (typeof window !== 'undefined' && templateId) {
    window.localStorage.setItem('pruaned_emailjs_template_masivo', templateId.trim());
  }
};

/**
 * Validador estricto de sintaxis de correo electrónico
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  if (clean.includes('anonimizado')) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(clean);
};

/**
 * Envía un correo individual como parte de una comunicación masiva.
 * Incluye nombres de variables universales para funcionar con cualquier plantilla de EmailJS.
 */
const sendSingleMassivoEmail = async (toEmail, toName, subject, bodyHtml, customTemplateId = null) => {
  const templateId = customTemplateId || getMassivoTemplateId();
  return emailjs.send(
    EMAILJS_SERVICE_ID,
    templateId,
    {
      to_email: toEmail,
      to_name: toName,
      nombre_postulante: toName,
      subject: subject,
      asunto: subject,
      body_html: bodyHtml,
      mensaje_personalizado: bodyHtml,
      message: bodyHtml
    },
    EMAILJS_PUBLIC_KEY
  );
};

/**
 * Envía un correo masivo a una lista de destinatarios.
 * Retorna un resumen { sent, failed, errors }.
 * Agrega un delay de 400ms entre envíos para respetar el rate limit de EmailJS.
 */
export const sendMassivoEmail = async (recipients, subject, bodyHtml, onProgress = null, customTemplateId = null) => {
  const results = { sent: 0, failed: 0, errors: [] };
  const templateId = customTemplateId || getMassivoTemplateId();

  for (let i = 0; i < recipients.length; i++) {
    const { email, nombre } = recipients[i];
    if (!email || !isValidEmail(email)) {
      results.failed++;
      results.errors.push({ email: email || 'Sin correo', error: 'Formato de correo inválido' });
      continue;
    }
    try {
      await sendSingleMassivoEmail(email, nombre || email, subject, bodyHtml, templateId);
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
