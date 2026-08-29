const hasValue = (value) => value !== undefined && value !== null && value !== '';

const toObject = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const applicationForm = (application = {}) => ({
  ...toObject(application.formularioCompleto),
  ...toObject(application.formulario_completo),
  ...application
});

export const volunteerForm = (volunteer = {}) => ({
  ...toObject(volunteer.datosPostulacion?.formulario),
  ...toObject(volunteer.datos_postulacion?.formulario),
  ...volunteer
});

export const displayValue = (value, fallback = 'No informado') => {
  if (!hasValue(value)) return fallback;
  if (Array.isArray(value)) return value.length ? value.join(', ') : fallback;
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') return Object.entries(value)
    .map(([key, entry]) => `${key}: ${displayValue(entry, '—')}`)
    .join(' · ') || fallback;
  return String(value);
};

export const firstValue = (source, keys, fallback) => {
  for (const key of keys) {
    if (hasValue(source?.[key])) return source[key];
  }
  return fallback;
};

export const APPLICATION_FIELD_GROUPS = [
  {
    title: 'Identificación y contacto',
    fields: [
      ['Nombre completo', ['nombreCompleto', 'nombre']],
      ['RUT', ['rut']],
      ['Fecha de nacimiento', ['fechaNacimiento']],
      ['Correo electrónico', ['email']],
      ['Teléfono', ['telefono']],
      ['Región', ['region']],
      ['Comuna', ['comuna']]
    ]
  },
  {
    title: 'Perfil y disponibilidad',
    fields: [
      ['Profesión o especialidad', ['profesionEspecialidad', 'profesion', 'especialidad']],
      ['Experiencia', ['experiencia']],
      ['Disponibilidad', ['disponibilidad', 'tiempoDisponible', 'disponibilidadRespuesta']],
      ['Áreas de interés', ['areasInteres', 'areas_interes']],
      ['Recursos propios', ['recursos', 'recursosPropios', 'recursos_propios']],
      ['Labores que puede realizar', ['laboresQuePuedeRealizar', 'labores_que_puede_realizar']],
      ['Motivación', ['motivacion', 'razonesIntegracion']]
    ]
  },
  {
    title: 'Consentimientos y antecedentes',
    fields: [
      ['Aceptación de términos', ['aceptaTerminos', 'aceptaLeyDatos']],
      ['Antecedentes relevantes', ['antecedentes']],
      ['Observación de revisión', ['observacionRevision', 'reviewNote']]
    ]
  }
];

const activationValues = (record = {}) => ({
  account: firstValue(record, ['accountStatus', 'account_status', 'estadoCuenta', 'estado_cuenta'], ''),
  invitation: firstValue(record, ['invitationStatus', 'invitation_status', 'inviteStatus', 'invite_status', 'estadoInvitacion', 'estado_invitacion'], ''),
  sentAt: firstValue(record, ['invitationSentAt', 'invitation_sent_at', 'inviteSentAt', 'invite_sent_at', 'fechaInvitacion'], ''),
  expiresAt: firstValue(record, ['invitationExpiresAt', 'invitation_expires_at', 'inviteExpiresAt', 'invite_expires_at', 'fechaExpiracionInvitacion'], '')
});

export const accessStatus = (record = {}, hasAccount = false) => {
  const values = activationValues(record);
  const normalized = `${values.account} ${values.invitation}`.toLowerCase();
  if (hasAccount || /activ|created|active|habilitad/.test(normalized)) {
    return { label: 'Cuenta activa', detail: 'La persona ya puede ingresar a la intranet y al aula virtual.', tone: 'emerald', ...values };
  }
  if (/expir|venc|failed|fall/.test(normalized)) {
    return { label: 'Invitación vencida o fallida', detail: 'Se requiere una nueva invitación o revisar el correo registrado.', tone: 'rose', ...values };
  }
  if (/sent|enviad|pending|pendiente/.test(normalized)) {
    return { label: 'Invitación enviada', detail: 'La persona debe completar la activación desde el correo recibido.', tone: 'amber', ...values };
  }
  return { label: 'Activación pendiente', detail: 'Aún no hay una cuenta o invitación de acceso registrada.', tone: 'slate', ...values };
};

export const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('es-CL');
};
