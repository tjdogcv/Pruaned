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

export function logSecurityEvent(logs, eventType, userEmail, severity = "INFO") {
  const newLog = {
    id: `log-${Date.now()}`,
    date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    user: userEmail || "invitado@pruaned.cl",
    ip: "190.160.10.22",
    event: eventType,
    severity
  };
  return [newLog, ...logs];
}
