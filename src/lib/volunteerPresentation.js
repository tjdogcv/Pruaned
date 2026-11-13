export const hasFieldValue = (value) => {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

const toObject = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const REGIONES_CHILE = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  "Libertador General Bernardo O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena'
];

export const VOLUNTEER_OPTIONS = {
  condicionAcademica: [
    'Estudiante de Medicina Veterinaria',
    'Estudiante de carrera técnica / afín animal',
    'Profesional Médico/a Veterinario/a',
    'Técnico/a Veterinario/a o afín',
    'Otro profesional / apoyo operativo'
  ],
  proyeccionSocio: [
    'Sí, me interesa proyectarme a futuro como Socio/a Activo/a',
    'Por ahora prefiero aportar como Voluntario/a Permanente',
    'Me gustaría evaluarlo más adelante'
  ],
  disponibilidadMensual: [
    'Menos de 4 horas al mes',
    '4 a 8 horas al mes',
    'Más de 8 horas al mes',
    'Fines de semana o turnos puntuales'
  ],
  disponibilidadRespuesta: [
    'Inmediata (menos de 6 horas)',
    'Mismo día (6 a 24 horas)',
    'En 24 a 48 horas',
    'Solo fines de semana o coordinación remota'
  ],
  transportePropio: [
    'Sí, vehículo 4x4 / camioneta',
    'Sí, vehículo particular / citycar',
    'Motocicleta / bicicleta',
    'No cuento con vehículo propio (requiero traslado o apoyo remoto)'
  ],
  desplazamientoTerritorial: [
    'Solo mi comuna',
    'Dentro de mi provincia / región',
    'Regiones vecinas',
    'Todo el país según requerimiento'
  ],
  labores: [
    'Atención clínica y triage en terreno',
    'Manejo de albergues / refugios temporales',
    'Bienestar animal y etología en crisis',
    'Vacunación, registro y trazabilidad',
    'Logística, bodega y acopio de insumos',
    'Transporte y movilización en terreno',
    'Comunicaciones, RRSS y educación comunitaria',
    'Apoyo administrativo, coordinación y enlace',
    'Apoyo remoto (fichas, seguimiento y difusión)'
  ],
  areasInteres: [
    'Respuesta en emergencias',
    'Bienestar animal',
    'Salud pública y prevención',
    'Logística y acopio',
    'Comunicaciones',
    'Apoyo administrativo',
    'Capacitación'
  ],
  especiesComodas: [
    'Animales de compañía (perros y gatos)',
    'Equinos y ganado mayor (bovinos, ovinos, caprinos)',
    'Aves de corral y fauna productiva menor',
    'Fauna silvestre y exóticos',
    'Solo apoyo no clínico (logística, administración o comunicaciones)'
  ],
  formacionCertificada: [
    'SCI-100 / Sistema de Comando de Incidentes',
    'Primeros auxilios veterinarios en desastres',
    'Manejo e inmovilización de fauna silvestre',
    'Primeros auxilios psicológicos / trabajo comunitario',
    'Manejo defensivo / conducción 4x4 / radiofrecuencia'
  ],
  recursos: [
    'Botiquín o insumos',
    'Vehículo propio',
    'Espacio de acopio',
    'Equipamiento EPP / terreno',
    'Transporte / jaulas / caniles',
    'Ninguno por ahora'
  ]
};

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

export const extractVolunteerDocuments = (source = {}) => {
  const form = {
    ...toObject(source.formularioCompleto),
    ...toObject(source.formulario_completo),
    ...toObject(source.datosPostulacion?.formulario),
    ...toObject(source.datos_postulacion?.formulario),
    ...source
  };

  const academicUrl = firstValue(form, ['certificadoAcademicoUrl', 'certificado_academico_url'], '');
  const academicName = firstValue(
    form,
    ['certificadoAcademicoNombre', 'certificado_academico_nombre'],
    academicUrl ? 'Certificado académico adjunto' : ''
  );
  const pendingByEmail = Boolean(firstValue(form, ['enviaraCertificadoPorCorreo', 'enviara_certificado_por_correo'], false));

  const rawExtras = firstValue(form, ['certificacionesExtras', 'certificaciones_extras'], []);
  const extraCerts = Array.isArray(rawExtras)
    ? rawExtras
      .filter((item) => item && (item.url || item.nombre))
      .map((item, idx) => ({
        id: item.id || `cert-extra-${idx}`,
        nombre: item.nombre || `Certificación adicional ${idx + 1}`,
        url: item.url || '',
        tamano: item.tamano || null,
        fecha: item.fecha || null
      }))
    : [];

  const academicCert = academicUrl || academicName
    ? { nombre: academicName || 'Certificado académico', url: academicUrl }
    : null;

  return {
    academicCert,
    pendingByEmail,
    extraCerts,
    totalCount: (academicCert?.url ? 1 : 0) + extraCerts.filter((item) => item.url).length
  };
};

export const displayValue = (value, fallback = 'No informado') => {
  if (!hasFieldValue(value)) return fallback;
  if (Array.isArray(value)) return value.length ? value.join(', ') : fallback;
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') return Object.entries(value)
    .map(([key, entry]) => `${key}: ${displayValue(entry, '—')}`)
    .join(' · ') || fallback;
  return String(value);
};

export const firstValue = (source, keys, fallback) => {
  for (const key of keys) {
    if (hasFieldValue(source?.[key])) return source[key];
  }
  return fallback;
};

export const APPLICATION_FIELD_GROUPS = [
  {
    title: 'Identificación y ubicación',
    fields: [
      ['Nombre completo', ['nombreCompleto', 'nombre']],
      ['RUT', ['rut']],
      ['Fecha de nacimiento', ['fechaNacimiento']],
      ['Correo electrónico', ['email']],
      ['Teléfono', ['telefono']],
      ['Región', ['region']],
      ['Comuna', ['comuna']],
      ['Domicilio / sector', ['domicilio', 'direccion'], { optional: true }],
      ['Redes sociales / LinkedIn', ['redesSociales', 'instagram'], { optional: true }]
    ]
  },
  {
    title: 'Formación y condición académica',
    fields: [
      ['Condición actual', ['condicionAcademica'], { optional: true }],
      ['Profesión o especialidad', ['profesionEspecialidad', 'profesion', 'especialidad']],
      ['Institución de estudios', ['institucionEstudios', 'institucion'], { optional: true }],
      ['Nivel de estudios', ['nivelEstudios'], { optional: true }],
      ['Formación y cursos certificados', ['formacionCertificada'], { optional: true }],
      ['Experiencia previa', ['experiencia']]
    ]
  },
  {
    title: 'Capacidades operativas y disponibilidad',
    fields: [
      ['Disponibilidad mensual', ['disponibilidad', 'tiempoDisponible']],
      ['Tiempo de activación ante alerta', ['disponibilidadRespuesta', 'disponibilidad_respuesta'], { optional: true }],
      ['Transporte propio', ['transportePropio', 'transporte_propio'], { optional: true }],
      ['Alcance de desplazamiento', ['desplazamientoTerritorial', 'desplazamiento_territorial'], { optional: true }],
      ['Labores operativas y de apoyo', ['labores', 'laboresQuePuedeRealizar', 'labores_que_puede_realizar']],
      ['Especies con las que se siente cómodo/a', ['especiesComodas', 'especies_comodas'], { optional: true }],
      ['Restricciones o especies a evitar', ['especiesEvitarRestricciones', 'especies_evitar_restricciones'], { optional: true }],
      ['Áreas de interés', ['areasInteres', 'areas_interes'], { optional: true }],
      ['Recursos propios', ['recursos', 'recursosPropios', 'recursos_propios'], { optional: true }]
    ]
  },
  {
    title: 'Proyección, ética y antecedentes',
    fields: [
      ['Motivación', ['motivacion', 'razonesIntegracion']],
      ['Proyección a Socio/a PRUANED', ['proyeccionSocio', 'proyeccion_socio'], { optional: true }],
      ['Trabajo bajo protocolos y cadena de mando (SCI)', ['trabajoProtocolosSCI'], { optional: true }],
      ['Respeto de límites legales del ejercicio', ['respetoLimitesProfesionales'], { optional: true }],
      ['Disposición a capacitación LMS', ['dispuestoCapacitarseLMS'], { optional: true }],
      ['Aceptación de términos', ['aceptaTerminos', 'aceptaLeyDatos']],
      ['Antecedentes relevantes', ['antecedentes'], { optional: true }],
      ['Observación de revisión', ['observacionRevision', 'reviewNote'], { optional: true }]
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
