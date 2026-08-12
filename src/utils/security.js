// PRUANED Ciberseguridad & Utilitarios de Autenticación

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function evaluatePasswordStrength(password) {
  let score = 0;
  if (!password) return { score: 0, label: "Vacía", color: "gray" };

  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  if (score < 40) return { score, label: "Débil (Vulnerable)", color: "#E63946" };
  if (score < 75) return { score, label: "Aceptable", color: "#FFB703" };
  return { score, label: "Fuerte (Seguridad Alta)", color: "#1B8A44" };
}

export function generate2FACode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateCertificateHash(volunteerId, courseId) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRU-CERT-${timestamp}-${random}`;
}

const EVENT_LABELS = {
  AUTH_SUCCESS_SERVER_RESOLVED_ROLE_MASTER:   'Inicio de sesión — Usuario Maestro',
  AUTH_SUCCESS_SERVER_RESOLVED_ROLE_DIRECTIVA:'Inicio de sesión — Directivo/a',
  AUTH_SUCCESS_SERVER_RESOLVED_ROLE_SOCIO:    'Inicio de sesión — Socio/a',
  AUTH_SUCCESS_SERVER_RESOLVED_ROLE_VOLUNTARIO:'Inicio de sesión — Voluntario/a',
  USER_LOGOUT:                                'Cierre de sesión',
  UPDATE_OFFICIAL_SIGNATURE_presidenteFirma:  'Firma oficial actualizada — Presidente/a',
  UPDATE_OFFICIAL_SIGNATURE_secretarioFirma:  'Firma oficial actualizada — Secretario/a',
  CREATE_LMS_COURSE:                          'Nuevo curso LMS creado',
  DELETE_LMS_COURSE:                          'Curso LMS eliminado',
  PROMOTED_VOLUNTEER_RANK:                    'Voluntario promovido de nivel',
  UPDATE_SOCIO_CATEGORY:                      'Categoría de socio modificada',
  UPDATE_DIRECTORIO_CARGO_presidenteId:       'Cargo de Presidente/a reasignado',
  UPDATE_DIRECTORIO_CARGO_vicepresidenteId:   'Cargo de Vicepresidente/a reasignado',
  UPDATE_DIRECTORIO_CARGO_secretarioId:       'Cargo de Secretario/a reasignado',
  UPDATE_DIRECTORIO_CARGO_tesoreroId:         'Cargo de Tesorero/a reasignado',
  UPDATE_SOCIO_PROFILE:                       'Perfil de socio actualizado',
  TOGGLE_VOLUNTEER_PERMISSION:                'Permiso de gestión de voluntarios modificado',
  ADD_BANK_DONATION:                          'Donación bancaria registrada',
  DELETE_DONATION:                            'Donación eliminada',
  EMERGENCY_CONVOCATORIA_RAISED:              '🚨 Convocatoria de emergencia activada',
  EMERGENCY_CONVOCATORIA_CLOSED:              'Convocatoria de emergencia cerrada',
  UPDATE_VOLUNTEER_AVAILABILITY:              'Disponibilidad de voluntario actualizada',
  NEW_SOCIO_APPLICATION:                      'Nueva postulación de socio recibida',
};

function humanize(eventType) {
  // Exact match first
  if (EVENT_LABELS[eventType]) return EVENT_LABELS[eventType];
  // Prefix match (handles dynamic suffixes like IDs)
  const prefix = Object.keys(EVENT_LABELS).find(k => eventType.startsWith(k));
  if (prefix) return EVENT_LABELS[prefix];
  // Fallback: replace underscores and capitalize
  return eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function logSecurityEvent(logs, eventType, userEmail, severity = "INFO") {
  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    user: userEmail || "invitado@pruaned.cl",
    ip: "190.160.10.22",
    event: eventType,
    label: humanize(eventType),
    severity
  };
  return [newLog, ...logs];
}
