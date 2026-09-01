// ==========================================
// PROTECCIÓN ANTISPAM PARA FORMULARIOS PÚBLICOS
// ==========================================

const MIN_FILL_TIME_MS = 3000; // Mínimo 3 segundos para llenar el formulario
const MAX_SUBMISSIONS_PER_HOUR = 5;
const STORAGE_KEY_RATE_LIMIT = 'pruaned_form_submissions';

/**
 * Genera el estado inicial del detector de spam
 */
export const createAntiSpamSession = () => ({
  startedAt: Date.now(),
  honeypotValue: ''
});

/**
 * Valida si el envío parece legítimo o si proviene de un bot
 * @param {object} session - { startedAt, honeypotValue }
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateSubmission = (session) => {
  // 1. Verificación de Honeypot: si el campo trampa tiene texto, es un bot
  if (session.honeypotValue && session.honeypotValue.trim().length > 0) {
    console.warn('[AntiSpam] Bot detectado por Honeypot.');
    return { valid: false, error: 'Envío bloqueado por sistema de seguridad.' };
  }

  // 2. Verificación de Tiempo Mínimo: un humano no llena un formulario de 10 campos en < 3 segundos
  const fillTime = Date.now() - (session.startedAt || 0);
  if (fillTime < MIN_FILL_TIME_MS) {
    console.warn('[AntiSpam] Envío demasiado rápido:', fillTime, 'ms');
    return { valid: false, error: 'Por favor, tómate un momento para revisar los datos antes de enviar.' };
  }

  // 3. Rate limiting básico por navegador
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RATE_LIMIT);
    const submissions = raw ? JSON.parse(raw) : [];
    const oneHourAgo = Date.now() - 3600000;
    const recentSubmissions = submissions.filter(timestamp => timestamp > oneHourAgo);

    if (recentSubmissions.length >= MAX_SUBMISSIONS_PER_HOUR) {
      return { valid: false, error: 'Has alcanzado el límite de envíos por hora. Intenta más tarde.' };
    }

    recentSubmissions.push(Date.now());
    localStorage.setItem(STORAGE_KEY_RATE_LIMIT, JSON.stringify(recentSubmissions));
  } catch (_) {
    // Si localStorage está bloqueado, permitimos el flujo
  }

  return { valid: true };
};
