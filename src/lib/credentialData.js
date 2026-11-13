import { formatChileanRut, normalizeChileanRut } from './authData.js';
import { firstValue, formatDate, volunteerForm } from './volunteerPresentation.js';

/**
 * Estándar físico ISO/IEC 7810 ID-1 (CR80 — tamaño máximo tarjeta de crédito).
 * 300 DPI exactos para impresión nítida y recorte 1:1 en papel o PVC.
 */
export const CR80 = {
  horizontal: {
    widthMm: 85.6,
    heightMm: 53.98,
    widthPx: 1011,
    heightPx: 638,
    orientation: 'horizontal'
  },
  vertical: {
    widthMm: 53.98,
    heightMm: 85.6,
    widthPx: 638,
    heightPx: 1011,
    orientation: 'vertical'
  }
};

const INACTIVE_STATUS_RE = /inactiv|renunc|suspend|baja|rechaz/i;

const sanitizeFileSlug = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 48) || 'pruaned';

const buildShortCodeSuffix = (rut, id) => {
  const cleanRut = normalizeChileanRut(rut);
  if (cleanRut.length >= 2) {
    return `${cleanRut.slice(0, -1)}-${cleanRut.slice(-1)}`;
  }
  const cleanId = String(id || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase();
  return cleanId || 'REGISTRO';
};

export const computeValidityDate = (member = {}, form = {}, isActive = true, referenceDate = new Date()) => {
  if (!isActive) return 'Sin vigencia';

  const explicit = firstValue(
    { ...form, ...member },
    ['vigenciaHasta', 'vigencia_hasta', 'fechaVigencia', 'fecha_vigencia', 'vigencia'],
    ''
  );
  if (explicit) {
    return /^\d{2}\/\d{2}\/\d{4}$/.test(String(explicit).trim())
      ? String(explicit).trim()
      : (formatDate(explicit)?.replace(/-/g, '/') || String(explicit));
  }

  const ref = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
    ? referenceDate
    : new Date();
  const rawStart = firstValue(
    { ...form, ...member },
    ['fechaIngreso', 'fecha_ingreso', 'fechaAprobacion', 'fecha_aprobacion', 'createdAt', 'created_at'],
    ''
  );

  if (rawStart) {
    const startDate = new Date(rawStart);
    if (!Number.isNaN(startDate.getTime())) {
      const plusOneYear = new Date(startDate);
      plusOneYear.setFullYear(plusOneYear.getFullYear() + 1);
      if (plusOneYear.getTime() > ref.getTime()) {
        return plusOneYear.toLocaleDateString('es-CL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).replace(/-/g, '/');
      }
    }
  }

  const year = ref.getMonth() === 11 && ref.getDate() >= 15
    ? ref.getFullYear() + 1
    : ref.getFullYear();
  return `31/12/${year}`;
};

export const buildCredentialData = ({
  member = {},
  type,
  origin = 'https://pruaned.cl',
  referenceDate = new Date()
} = {}) => {
  const form = volunteerForm(member);
  const resolvedType = type === 'voluntario' || (
    type !== 'socio' && /voluntari/i.test(String(member.categoria || member.rol || ''))
  )
    ? 'voluntario'
    : 'socio';

  const fullName = firstValue(
    form,
    ['nombreCompleto', 'nombre', 'nombre_completo'],
    'Miembro PRUANED'
  ).trim();

  const rawRut = firstValue(form, ['rut'], '');
  const formattedRut = rawRut && normalizeChileanRut(rawRut).length >= 2
    ? formatChileanRut(rawRut)
    : (rawRut || 'No informado');

  const explicitCode = firstValue(
    form,
    ['numeroRegistro', 'numero_registro', 'codigoCredencial', 'codigo_credencial'],
    ''
  );
  const defaultPrefix = resolvedType === 'voluntario' ? 'PRU-VOL' : 'PRU-SOC';
  const code = explicitCode && /^PRU-(VOL|SOC)-/i.test(String(explicitCode))
    ? String(explicitCode).toUpperCase()
    : `${defaultPrefix}-${buildShortCodeSuffix(rawRut, member.id)}`;

  const rawStatus = firstValue(
    member,
    ['estado', 'estadoOperativo', 'categoria'],
    ''
  );
  const explicitActive = member.activo !== undefined ? Boolean(member.activo) : !INACTIVE_STATUS_RE.test(String(rawStatus));
  const isActive = explicitActive && !INACTIVE_STATUS_RE.test(String(member.estado || ''));

  const profession = firstValue(
    form,
    ['profesionEspecialidad', 'profesion', 'especialidad', 'condicionAcademica'],
    resolvedType === 'voluntario' ? 'Voluntario/a de Emergencias' : 'Profesional Veterinario/a'
  );

  const region = firstValue(form, ['region', 'comuna'], 'Nacional · Chile');
  const photoUrl = firstValue(
    { ...form, ...member },
    ['fotoPerfil', 'foto_perfil', 'avatarUrl', 'avatar_url'],
    ''
  );

  const roleLabel = resolvedType === 'voluntario'
    ? (isActive ? 'Voluntario/a' : 'Voluntario/a Inactivo/a')
    : (firstValue(member, ['categoria'], '') || (isActive ? 'Socio Activo' : 'Socio Inactivo'));

  const vigencia = computeValidityDate(member, form, isActive, referenceDate);
  const feeStatus = resolvedType === 'socio'
    ? (member.estadoCuota || (member.mesesAdeudados > 0 ? 'Cuotas pendientes' : 'Al Día'))
    : (isActive ? 'Acreditación Vigente' : 'Acreditación Inactiva');

  const safeOrigin = String(origin || 'https://pruaned.cl').replace(/\/+$/, '');
  const verifyUrl = `${safeOrigin}/verificar/${encodeURIComponent(code)}`;
  const spec = resolvedType === 'voluntario' ? CR80.vertical : CR80.horizontal;

  return {
    type: resolvedType,
    spec,
    code,
    verifyUrl,
    fullName,
    rut: formattedRut,
    roleLabel,
    profession,
    region,
    vigencia,
    feeStatus,
    photoUrl,
    isActive,
    fileName: `credencial-pruaned-${resolvedType}-${sanitizeFileSlug(fullName)}.png`
  };
};
