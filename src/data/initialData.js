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
  cuotaMensualActual: 15000,
  cuotaIncorporacionActual: 30000
};

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
    glosa: "Impresión de estatutos 2025 y carpetas institucionales"
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

export const INITIAL_NEWS = [
  {
    id: "n1",
    title: "PRUANED A.G. formaliza sus Estatutos y Reglamento General 2025",
    summary: "Se aprueba el cuerpo reglamentario marco para fortalecer la inclusión de los animales en el Sistema Nacional de Prevención y Respuesta ante Desastres.",
    category: "Institucional",
    date: "2025-03-10",
    author: "Directorio Nacional",
    image: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80",
    content: "La Asociación Gremial Profesionales Unidos por los Animales en Emergencias y Desastres (PRUANED A.G.) ha publicado sus Estatutos y Reglamento General de Funcionamiento 2025."
  },
  {
    id: "n2",
    title: "Simulacro de Evacuación Zoosanitaria en Ñuble y Biobío",
    summary: "Equipos operativos de PRUANED desplegaron protocolos de albergue temporal para animales de producción y compañía.",
    category: "Operativos",
    date: "2025-05-22",
    author: "Dirección RRD-GRD",
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80",
    content: "En conjunto con autoridades locales y brigadas de respuesta, la Dirección RRD-GRD de PRUANED lideró un simulacro de evacuación veterinaria."
  },
  {
    id: "n3",
    title: "Lanzamiento de la Academia de Capacitación Digital para Voluntarios",
    summary: "Nuevo portal interactivo permite a voluntarios permanentes y espontáneos cursar módulos en línea y certificar competencias.",
    category: "Capacitaciones",
    date: "2025-07-15",
    author: "Dirección de Voluntariado",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    content: "La Dirección de Voluntariado pone a disposición de todos sus inscritos la plataforma LMS con cursos interactivos."
  }
];

export const INITIAL_DOC_CATEGORIES = [
  "Estatutos & Reglamentos",
  "Protocolos RRD - GRD",
  "Guías Técnicas Veterinarias",
  "Convenios & Alianzas",
  "Informes Financieros & Memoria"
];

export const INITIAL_DOCUMENTS = [
  {
    id: "doc-1",
    title: "Estatutos y Reglamento General de Funcionamiento PRUANED A.G. 2025",
    category: "Estatutos & Reglamentos",
    date: "2025-01-15",
    size: "2.4 MB",
    version: "v1.0 Oficial",
    description: "Documento rector con la estructura orgánica, estatutos, régimen de cuotas y reglamento del voluntariado (19 páginas).",
    url: "#"
  },
  {
    id: "doc-2",
    title: "Protocolo Operativo de Evacuación de Animales de Compañía en Incendios",
    category: "Protocolos RRD - GRD",
    date: "2025-02-20",
    size: "1.8 MB",
    version: "v2.1",
    description: "Estándar de actuación para brigadas veterinarias en zonas de catástrofe y albergues temporales.",
    url: "#"
  },
  {
    id: "doc-3",
    title: "Guía de Primeros Auxilios y Bioseguridad Zoonótica en Terreno",
    category: "Guías Técnicas Veterinarias",
    date: "2025-04-12",
    size: "3.1 MB",
    version: "v1.2",
    description: "Manual de atención primaria para caninos, felinos, equinos y fauna silvestre bajo catástrofe.",
    url: "#"
  },
  {
    id: "doc-4",
    title: "Convenio Marco PRUANED A.G. - Red de Municipalidades y SENAPRED",
    category: "Convenios & Alianzas",
    date: "2025-06-05",
    size: "1.2 MB",
    version: "Firmado 2025",
    description: "Acuerdo de coordinación interinstitucional para despliegues de emergencia y capacitación conjunta.",
    url: "#"
  }
];

export const INITIAL_SOCIOS = [
  {
    id: "soc-101",
    rut: "15.482.910-K",
    nombre: "Dra. Camila Morales Valenzuela",
    profesion: "Médico Veterinaria - Especialista GRD",
    categoria: "Socio Activo",
    voto: true,
    email: "camila.morales@pruaned.cl",
    region: "Región de Ñuble",
    fechaIngreso: "2025-01-10",
    estadoCuota: "Al Día",
    montoCuotaMensual: 15000,
    cuotaIncorporacionPagada: true,
    montoCuotaIncorporacion: 30000,
    mesesAdeudados: 0,
    ultimaCuotaPagada: "Agosto 2026",
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
    region: "Región del Biobío",
    fechaIngreso: "2025-01-12",
    estadoCuota: "Al Día",
    montoCuotaMensual: 15000,
    cuotaIncorporacionPagada: true,
    montoCuotaIncorporacion: 30000,
    mesesAdeudados: 0,
    ultimaCuotaPagada: "Agosto 2026",
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
    region: "Región de Valparaíso",
    fechaIngreso: "2025-03-01",
    estadoCuota: "En Mora",
    montoCuotaMensual: 15000,
    cuotaIncorporacionPagada: true,
    montoCuotaIncorporacion: 30000,
    mesesAdeudados: 3, // Adeuda Junio, Julio, Agosto 2026
    ultimaCuotaPagada: "Mayo 2026",
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
    region: "Región Metropolitana",
    fechaIngreso: "2025-01-05",
    estadoCuota: "Exento",
    montoCuotaMensual: 0,
    cuotaIncorporacionPagada: true,
    montoCuotaIncorporacion: 0,
    mesesAdeudados: 0,
    ultimaCuotaPagada: "Exento Por Estatuto",
    historialPagos: []
  },
  {
    id: "soc-105",
    rut: "17.654.321-9",
    nombre: "Dra. Valentina Lagos Parra",
    profesion: "Médico Veterinaria Especies Silvestres",
    categoria: "Socio Activo",
    voto: true,
    email: "valentina.lagos@pruaned.cl",
    region: "Región de la Araucanía",
    fechaIngreso: "2025-02-15",
    estadoCuota: "Suspensión Art. 42",
    montoCuotaMensual: 15000,
    cuotaIncorporacionPagada: true,
    montoCuotaIncorporacion: 30000,
    mesesAdeudados: 0,
    ultimaCuotaPagada: "Marzo 2026",
    historialPagos: [
      { mes: "Marzo 2026", monto: 15000, fecha: "2026-03-05", comprobante: "TRF-7120" }
    ]
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
    estadoOperativo: "Disponible / Desplegable",
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
    estadoOperativo: "Disponible / Desplegable",
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
    description: "Curso obligatorio sobre estatutos 2025, bioseguridad y principios de actuación gremial.",
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
    description: "Capacitación práctica en estabilización básica, quemaduras e inalación de humo.",
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
  { id: "log-1", date: "2026-08-12 04:30:12", user: "admin@pruaned.cl", ip: "190.160.45.12", event: "LOGIN_SUCCESS_2FA", severity: "INFO" },
  { id: "log-2", date: "2026-08-12 04:15:00", user: "camila.morales@pruaned.cl", ip: "200.75.12.88", event: "SOCIO_INTRANET_ACCESS", severity: "INFO" }
];
