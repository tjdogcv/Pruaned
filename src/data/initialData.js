export const INSTITUTIONAL_INFO = {
  name: "PRUANED A.G.",
  fullName: "Asociación Gremial de Profesionales Unidos por los Animales en Emergencias y Desastres",
  motto: "Por la inclusión de los animales en la gestión del riesgo de desastres",
  legalId: "Decreto Ley N° 2.757 de 1979",
  address: "Avenida Andes N° 338, San Fabián de Alico, Región de Ñuble, Chile",
  email: "ag.pruaned@gmail.com",
  domain: "www.pruaned.cl",
  instagram: "https://www.instagram.com/pruaned",
  frameworks: ["One Health", "One Welfare", "Marco de Sendai 2015-2030", "Objetivos de Desarrollo Sostenible (ODS)", "Política Nacional RRD Chile"]
};

export const INITIAL_FINANCIAL_SETTINGS = {
  cuotaMensualActual: 5000,
  cuotaIncorporacionActual: 30000
};

export const INITIAL_DIRECTORIO_CARGOS = {
  presidenteId: "soc-101",
  vicepresidenteId: "soc-102",
  secretarioId: "soc-103",
  tesoreroId: "soc-104"
};

// FIRMAS DIGITALES ESCANEADAS DEFAULT DE LA DIRECTIVA
export const INITIAL_FIRMAS = {
  presidenteFirma: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Jon_Kirsch_Signature.png",
  secretarioFirma: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Signature_example.png"
};

export const INITIAL_DONACIONES = [
  {
    id: "don-101",
    fecha: "2026-08-01",
    donante: "Fundación Internacional Protección Animal & Bienestar",
    rutODocumentoDonante: "65.102.940-2",
    monto: 500000,
    banco: "BancoEstado (Cta. Corriente PRUANED A.G.)",
    numeroComprobante: "TRF-889102",
    destinoAporte: "Fondo Emergencias, Botiquines Terreno & Insumos Zoosanitarios",
    publico: true
  },
  {
    id: "don-102",
    fecha: "2026-08-06",
    donante: "Empresa Agrícola & Ganadera del Sur S.A.",
    rutODocumentoDonante: "77.409.110-5",
    monto: 250000,
    banco: "Banco de Chile (Cta. Vista Oficial)",
    numeroComprobante: "TRF-992014",
    destinoAporte: "Albergues Temporales & Alimentación Pecuaria",
    publico: true
  }
];

export const INITIAL_EXPENSES = [
  {
    id: "exp-1",
    fecha: "2026-08-02",
    tipoDocumento: "Factura",
    numeroDocumento: "FAC-9841",
    proveedor: "Droguería Veterinaria Chile S.A.",
    monto: 145000,
    categoria: "Insumos Médicos Veterinarios",
    glosa: "Compra de botiquines de emergencias, fluidoterapia y sueros fisiológicos para operativos"
  },
  {
    id: "exp-2",
    fecha: "2026-08-05",
    tipoDocumento: "Boleta",
    numeroDocumento: "BOL-12049",
    proveedor: "Copec San Fabián",
    monto: 38000,
    categoria: "Logística Terreno & Combustible",
    glosa: "Combustible camioneta de rescate para simulacro zoosanitario"
  },
  {
    id: "exp-3",
    fecha: "2026-08-08",
    tipoDocumento: "Boleta",
    numeroDocumento: "BOL-33910",
    proveedor: "Impresos & Papelería Ñuble",
    monto: 25000,
    categoria: "Gastos Administrativos",
    glosa: "Impresión de estatutos v3 oficiales y carpetas institucionales"
  }
];

export const INITIAL_TECHNICAL_DIRECTIONS = [
  {
    id: "voluntariado",
    title: "1. Dirección de Voluntariado",
    director: "Coordinación Nacional de Voluntariado",
    description: "Gestión del ciclo completo de voluntariado permanente y espontáneo: reclutamiento, inducción, acreditación, plan de formación y seguimiento psicosocial.",
    icon: "Users"
  },
  {
    id: "one-health",
    title: "2. Dirección One Health",
    director: "Comité Técnico Interdisciplinario",
    description: "Integración de salud animal, humana y ambiental. Vigilancia de zoonosis, bioseguridad, educación sanitaria e investigación aplicada.",
    icon: "Activity"
  },
  {
    id: "rrd-grd",
    title: "3. Dirección RRD – GRD",
    director: "Coordinación de Operaciones y Catástrofes",
    description: "Planificación de la Reducción del Riesgo de Desastres y respuesta en terreno. Coordinación activa con SENAPRED, SAG, municipios y bomberos.",
    icon: "ShieldAlert"
  },
  {
    id: "pueblos-originarios",
    title: "4. Dirección de Pueblos Originarios",
    director: "Comité de Cosmovisión e Interculturalidad",
    description: "Incorporación de saberes ancestrales y prácticas territoriales con comunidades indígenas, garantizando pertinencia cultural en operativos.",
    icon: "Globe"
  },
  {
    id: "alianzas-donaciones",
    title: "5. Alianzas, Convenios y Donaciones",
    director: "Dirección de Cooperación Internacional",
    description: "Articulación con ONG donatarias, organismos internacionales, universidades y administración transparente de aportes institucionales.",
    icon: "Handshake"
  },
  {
    id: "mascotas",
    title: "6. Dirección de Mascotas",
    director: "Área de Animales de Compañía",
    description: "Protección, atención veterinaria primaria, reunificación, albergues temporales y tenencia responsable en contextos de emergencia.",
    icon: "Heart"
  },
  {
    id: "animales-produccion",
    title: "7. Animales de Producción",
    director: "Área Pecuaria y Agrícola",
    description: "Planes de contingencia alimentaria e hídrica para ganado, aves y abejas. Continuidad productiva y asesoría a pequeños agricultores.",
    icon: "Wheat"
  },
  {
    id: "fauna-silvestre",
    title: "8. Dirección de Fauna Silvestre",
    director: "Área de Biodiversidad y Rescate",
    description: "Rescate, contención química/mecánica, rehabilitación y liberación segura de especies silvestres afectadas por incendios y desastres.",
    icon: "Feather"
  }
];

export const INITIAL_NEWS = [];

export const INITIAL_DOC_CATEGORIES = [
  "Estatutos & Reglamentos",
  "Protocolos RRD - GRD",
  "Guías Técnicas Veterinarias",
  "Convenios & Alianzas",
  "Informes Financieros & Memoria"
];

export const INITIAL_DOCUMENTS = [];

export const INITIAL_SOCIOS = [
  {
    id: "soc-101",
    rut: "15.482.910-K",
    nombre: "Dra. Camila Morales Valenzuela",
    profesion: "Médico Veterinaria - Especialista GRD",
    categoria: "Socio Activo",
    voto: true,
    email: "camila.morales@pruaned.cl",
    telefono: "+56 9 9876 5432",
    domicilio: "Av. Bernardo O'Higgins 1204",
    comuna: "San Fabián",
    region: "Región de Ñuble",
    fechaIngreso: "2025-01-10",
    estadoCuota: "Al Día",
    montoCuotaMensual: 15000,
    cuotaIncorporacionPagada: true,
    montoCuotaIncorporacion: 30000,
    mesesAdeudados: 0,
    ultimaCuotaPagada: "Agosto 2026",
    permisoGestionVoluntarios: true,
    fotoPerfil: "",
    historialPagos: [
      { mes: "Julio 2026", monto: 15000, fecha: "2026-07-02", comprobante: "TRF-9821" },
      { mes: "Agosto 2026", monto: 15000, fecha: "2026-08-01", comprobante: "TRF-1049" },
      { mes: "Cuota Incorporación", monto: 30000, fecha: "2025-01-10", comprobante: "TRF-001" }
    ]
  },
  {
    id: "soc-102",
    rut: "12.304.551-8",
    nombre: "Dr. Roberto Silva Fuentes",
    profesion: "Ingeniero en Prevención de Riesgos",
    categoria: "Socio Activo",
    voto: true,
    email: "roberto.silva@pruaned.cl",
    telefono: "+56 9 8765 4321",
    domicilio: "Calle Prat 450",
    comuna: "Concepción",
    region: "Región del Biobío",
    fechaIngreso: "2025-01-12",
    estadoCuota: "Al Día",
    montoCuotaMensual: 15000,
    cuotaIncorporacionPagada: true,
    montoCuotaIncorporacion: 30000,
    mesesAdeudados: 0,
    ultimaCuotaPagada: "Agosto 2026",
    permisoGestionVoluntarios: false,
    fotoPerfil: "",
    historialPagos: [
      { mes: "Agosto 2026", monto: 15000, fecha: "2026-08-03", comprobante: "TRF-1102" },
      { mes: "Cuota Incorporación", monto: 30000, fecha: "2025-01-12", comprobante: "TRF-002" }
    ]
  },
  {
    id: "soc-103",
    rut: "16.789.201-3",
    nombre: "Lic. Javiera Araya Castro",
    profesion: "Trabajadora Social / Gestión Intercultural",
    categoria: "Socio Adherente",
    voto: false,
    email: "javiera.araya@gmail.com",
    telefono: "+56 9 7654 3210",
    domicilio: "Av. Libertad 890",
    comuna: "Valparaíso",
    region: "Región de Valparaíso",
    fechaIngreso: "2025-03-01",
    estadoCuota: "En Mora",
    montoCuotaMensual: 15000,
    cuotaIncorporacionPagada: true,
    montoCuotaIncorporacion: 30000,
    mesesAdeudados: 3,
    ultimaCuotaPagada: "Mayo 2026",
    permisoGestionVoluntarios: false,
    fotoPerfil: "",
    historialPagos: [
      { mes: "Mayo 2026", monto: 15000, fecha: "2026-05-10", comprobante: "TRF-8820" }
    ]
  },
  {
    id: "soc-104",
    rut: "9.872.100-4",
    nombre: "Dr. Hernán Sepúlveda Riquelme",
    profesion: "Doctor en Salud Pública Veterinario",
    categoria: "Socio Honorario",
    voto: false,
    email: "hsepulveda@uchile.cl",
    telefono: "+56 9 6543 2109",
    domicilio: "Av. Providencia 2030",
    comuna: "Santiago",
    region: "Región Metropolitana",
    fechaIngreso: "2025-01-05",
    estadoCuota: "Exento",
    montoCuotaMensual: 0,
    cuotaIncorporacionPagada: true,
    montoCuotaIncorporacion: 0,
    mesesAdeudados: 0,
    ultimaCuotaPagada: "Exento Por Estatuto",
    permisoGestionVoluntarios: false,
    fotoPerfil: "",
    historialPagos: []
  }
];

export const INITIAL_VOLUNTARIOS = [
  {
    id: "vol-201",
    rut: "18.912.440-1",
    nombre: "Felipe Henríquez Palma",
    tipo: "Voluntario Permanente",
    nivelAcreditacion: "Nivel 3 - Operativo Avanzado",
    especialidad: "Manejo y Contención Pecuaria",
    region: "Región de Ñuble",
    email: "felipe.henriquez@gmail.com",
    telefono: "+56 9 8765 4321",
    estadoOperativo: "Disponible de inmediato",
    disponibilidadRespuesta: "Disponible de inmediato (Respuesta en < 12h)",
    recursosPropios: ["Camioneta 4x4", "Remolque de Ganado", "Botiquín Veterinario de Campo", "Jaulas de Transporte"],
    laboresQuePuedeRealizar: ["Contención Pecuaria", "Transporte de Animales", "Triage Veterinario", "Logística Terreno"],
    horasAcumuladas: 142,
    cursosAprobados: ["c1", "c2", "c3"],
    despliegues: [
      { evento: "Incendio Forestal Quillón", fecha: "Febrero 2025", horas: 36, rol: "Líder de Albergue Canino" },
      { evento: "Inundación Licantén", fecha: "Junio 2025", horas: 48, rol: "Rescate Equino" }
    ]
  },
  {
    id: "vol-202",
    rut: "20.123.876-5",
    nombre: "Constanza Ugarte Mella",
    tipo: "Voluntario Permanente",
    nivelAcreditacion: "Nivel 2 - Táctico Intermedio",
    especialidad: "Triage y Primeros Auxilios Caninos/Felinos",
    region: "Región del Biobío",
    email: "conny.ugarte@gmail.com",
    telefono: "+56 9 7654 3210",
    estadoOperativo: "Disponible en 24h",
    disponibilidadRespuesta: "Disponible en 24 Horas",
    recursosPropios: ["Insomios de Primeros Auxilios", "Alimento Mascotas 50kg", "Cajas de Transporte Canino"],
    laboresQuePuedeRealizar: ["Atención Veterinaria Primaria", "Gestión de Albergues Temporales", "Apoyo Administrativo"],
    horasAcumuladas: 85,
    cursosAprobados: ["c1", "c2"],
    despliegues: [
      { evento: "Emergencia Volcánica Nevados de Chillán", fecha: "Noviembre 2025", horas: 24, rol: "Apoyo Veterinario" }
    ]
  }
];

export const INITIAL_COURSES = [
  {
    id: "c1",
    code: "PRU-CUR-01",
    title: "Inducción General PRUANED: Ética, Seguridad y Marco Legal DL 2757",
    instructor: "Dr. Roberto Silva & Comité de Ética",
    duration: "4 Horas",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description: "Curso obligatorio sobre estatutos v3, bioseguridad y principios de actuación gremial.",
    modules: [
      "Módulo 1: Visión One Health y Marco de Sendai",
      "Módulo 2: Deberes, Derechos y Código de Ética (Art. 60-69)",
      "Módulo 3: Bioseguridad y Autocuidado en Terreno"
    ],
    examQuestions: [
      {
        q: "¿Cuál es el lema oficial de PRUANED A.G.?",
        options: [
          "Por la inclusión de los animales en la gestión del riesgo de desastres",
          "Rescate animal ante todo",
          "Veterinarios unidos por Chile"
        ],
        correct: 0
      }
    ]
  },
  {
    id: "c2",
    code: "PRU-CUR-02",
    title: "Primeros Auxilios Veterinarios y Triage Canino/Felino en Desastres",
    instructor: "Dra. Camila Morales V.",
    duration: "8 Horas",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description: "Capacitación práctica en estabilización básica, quemaduras e inhalación de humo.",
    modules: [
      "Módulo 1: Triage Zoosanitario",
      "Módulo 2: Tratamiento de Quemaduras",
      "Módulo 3: Hospital de Campaña"
    ],
    examQuestions: [
      {
        q: "¿Cuál es la prioridad en el triage veterinario de urgencia?",
        options: [
          "Estabilización cardiorrespiratoria y manejo de shock",
          "Limpieza cosmética del pelaje",
          "Alimentación pesada inmediata"
        ],
        correct: 0
      }
    ]
  }
];

export const INITIAL_SECURITY_LOGS = [
  { id: "log-1", date: "2026-08-12 04:30:12", user: "ag.pruaned@gmail.com", ip: "190.160.45.12", event: "LOGIN_SUCCESS_2FA", severity: "INFO" },
  { id: "log-2", date: "2026-08-12 04:15:00", user: "camila.morales@pruaned.cl", ip: "200.75.12.88", event: "SOCIO_INTRANET_ACCESS", severity: "INFO" }
];
