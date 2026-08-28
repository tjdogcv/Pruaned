/**
 * Normalizadores sin estado usados por AuthContext.
 *
 * Mantener estas funciones libres de React y Supabase permite reutilizarlas en
 * formularios y pruebas sin duplicar reglas de presentación o validación.
 */
export const DOCUMENT_MAX_BYTES = 20 * 1024 * 1024;
export const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);
export const DOCUMENT_EXTENSIONS = new Set(['pdf', 'docx', 'xlsx']);

export const DEFAULT_FINANCIAL_CATEGORIES = [
  { id: 'offline-donacion-ingreso-libre', tipo: 'donacion_ingreso', nombre: 'Aporte libre', activo: true },
  { id: 'offline-donacion-ingreso-campana', tipo: 'donacion_ingreso', nombre: 'Campaña de recaudación', activo: true },
  { id: 'offline-donacion-ingreso-convenio', tipo: 'donacion_ingreso', nombre: 'Convenio o alianza', activo: true },
  { id: 'offline-donacion-ingreso-destino', tipo: 'donacion_ingreso', nombre: 'Aporte con destino específico', activo: true },
  { id: 'offline-donacion-egreso-insumos', tipo: 'donacion_egreso', nombre: 'Insumos médicos veterinarios', activo: true },
  { id: 'offline-donacion-egreso-albergue', tipo: 'donacion_egreso', nombre: 'Alimentación y albergue', activo: true },
  { id: 'offline-donacion-egreso-logistica', tipo: 'donacion_egreso', nombre: 'Logística y transporte', activo: true },
  { id: 'offline-donacion-egreso-operativo', tipo: 'donacion_egreso', nombre: 'Operativo de emergencia', activo: true },
  { id: 'offline-donacion-egreso-capacitacion', tipo: 'donacion_egreso', nombre: 'Capacitación y materiales', activo: true }
];

export const formatDocumentSize = (bytes) => {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 1) return '—';
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

export const normalizeDocument = (document) => ({
  ...document,
  title: document.title || document.titulo || '',
  category: document.category || document.categoria || 'Sin categoría',
  description: document.description || document.descripcion || '',
  date: document.date || document.fecha || document.fechaPublicacion || document.createdAt || '',
  version: document.version || 'v1.0',
  size: document.size || formatDocumentSize(document.archivoBytes || document.archivo_bytes),
  published: document.published ?? document.publicado ?? true,
  visibility: document.visibility || document.visibilidad || 'publico',
  fileName: document.fileName || document.archivoNombre || document.archivo_nombre || '',
  fileType: document.fileType || document.archivoTipo || document.archivo_tipo || '',
  storagePath: document.storagePath || document.storage_path || ''
});

export const fileExtension = (fileName = '') => fileName.split('.').pop().toLowerCase();

export const safeStorageFileName = (fileName) => {
  const normalized = fileName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return normalized.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'documento';
};

export const normalizeAuditLog = (log) => {
  const action = log.event || log.accion || log.action || '';
  return {
    ...log,
    date: log.date || log.fecha || log.createdAt || '',
    user: log.user || log.usuario || 'Sistema PRUANED',
    event: action || 'SIN_ACCIÓN',
    label: log.label || log.accion || log.event || log.action || 'Sin acción registrada',
    severity: String(log.severity || log.severidad || 'INFO').toUpperCase(),
    ip: log.ip || log.ipOrigen || log.ip_origen || '—'
  };
};

export const toPublicDonation = (donation) => ({
  id: donation.id,
  fecha: donation.fecha,
  monto: donation.monto ?? donation.montoClp ?? donation.monto_clp ?? 0,
  banco: donation.banco || '',
  cuentaId: donation.cuentaId || donation.cuenta_id || null,
  numeroComprobante: donation.numeroComprobante || donation.numero_comprobante || donation.nComprobante || donation.n_comprobante || '',
  categoria: donation.categoria || donation.destinoAporte || donation.destino_aporte || 'Aporte libre'
});

export const normalizeChileanRut = (value) => String(value || '').replace(/[^0-9kK]/g, '').toUpperCase();

export const formatChileanRut = (value) => {
  const normalized = normalizeChileanRut(value);
  if (normalized.length < 2) return normalized;
  const body = normalized.slice(0, -1);
  const verifier = normalized.slice(-1);
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${verifier}`;
};

export const isValidChileanRut = (value) => {
  const normalized = normalizeChileanRut(value);
  if (!/^\d{7,8}[\dK]$/.test(normalized)) return false;
  const body = normalized.slice(0, -1);
  const verifier = normalized.slice(-1);
  let sum = 0;
  let multiplier = 2;
  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  const expected = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
  return verifier === expected;
};

export const snakeToCamel = (obj) => {
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
      result[camelKey] = snakeToCamel(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

/**
 * Contrato de persistencia para postulaciones. La ficha extensa se conserva
 * en JSONB y las columnas indexables se limitan al esquema base de Supabase.
 */
export const toPostulacionInsert = (postulacion) => ({
  fecha_envio: postulacion.fechaEnvio || postulacion.fecha_envio || new Date().toISOString().slice(0, 10),
  estado: postulacion.estado || 'Pendiente Revisión Directorio',
  nombre_completo: postulacion.nombreCompleto || postulacion.nombre_completo,
  rut: postulacion.rut,
  fecha_nacimiento: postulacion.fechaNacimiento || postulacion.fecha_nacimiento || null,
  email: postulacion.email,
  telefono: postulacion.telefono || null,
  profesion: postulacion.profesion || null,
  razones_integracion: postulacion.razonesIntegracion || postulacion.razones_integracion || null,
  formulario_completo: postulacion.formularioCompleto || postulacion.formulario_completo || postulacion
});
