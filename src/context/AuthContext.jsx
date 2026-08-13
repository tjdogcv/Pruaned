import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  INITIAL_NEWS, 
  INITIAL_DOCUMENTS, 
  INITIAL_DOC_CATEGORIES, 
  INITIAL_SOCIOS, 
  INITIAL_VOLUNTARIOS, 
  INITIAL_COURSES,
  INITIAL_SECURITY_LOGS,
  INITIAL_FINANCIAL_SETTINGS,
  INITIAL_EXPENSES,
  INITIAL_DONACIONES,
  INITIAL_DIRECTORIO_CARGOS,
  INITIAL_FIRMAS
} from '../data/initialData';
import { logSecurityEvent } from '../utils/security';
import { supabase, isSupabaseReady } from '../lib/supabase';

const SESSION_KEY = 'pruaned_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutos

const AuthContext = createContext();

const USER_DATABASE = [
  {
    email: "ag.pruaned@gmail.com",
    name: "Usuario Maestro PRUANED A.G.",
    role: "master",
    rut: "10.102.304-5",
    permisoGestionVoluntarios: true
  },
  {
    email: "presidente.directiva@pruaned.cl",
    name: "Dra. Camila Morales (Presidenta Directiva Nacional)",
    role: "directiva",
    rut: "15.482.910-K",
    permisoGestionVoluntarios: true
  },
  {
    email: "secretario.directiva@pruaned.cl",
    name: "Lic. Javiera Araya (Secretaria Directiva Nacional)",
    role: "directiva",
    rut: "16.789.201-3",
    permisoGestionVoluntarios: true
  },
  {
    email: "camila.morales@pruaned.cl",
    name: "Dra. Camila Morales Valenzuela",
    role: "directiva",
    rut: "15.482.910-K",
    permisoGestionVoluntarios: true
  },
  {
    email: "roberto.silva@pruaned.cl",
    name: "Dr. Roberto Silva Fuentes",
    role: "socio",
    rut: "12.304.551-8",
    permisoGestionVoluntarios: false
  },
  {
    email: "felipe.henriquez@gmail.com",
    name: "Felipe Henríquez Palma",
    role: "voluntario",
    rut: "18.912.440-1",
    permisoGestionVoluntarios: false
  },
  {
    email: "conny.ugarte@gmail.com",
    name: "Constanza Ugarte Mella",
    role: "voluntario",
    rut: "20.123.876-5",
    permisoGestionVoluntarios: false
  }
];

function generateSessionToken() {
  return 'pruaned-sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function loadPersistedSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.expiresAt || Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const persistedSession = loadPersistedSession();
  const [currentUser, setCurrentUser] = useState(persistedSession?.user || null);
  const [is2FAVerified, setIs2FAVerified] = useState(!!persistedSession);
  const [activeTab, setActiveTab] = useState('home');

  // Firmas Digitales Oficiales (Presidente y Secretario)
  const [firmasOficiales, setFirmasOficiales] = useState(() => {
    const saved = localStorage.getItem('pruaned_firmas_oficiales');
    return saved ? JSON.parse(saved) : INITIAL_FIRMAS;
  });

  // Estado de Convocatoria Activa de Emergencia
  const [convocatoriaActiva, setConvocatoriaActiva] = useState(() => {
    const saved = localStorage.getItem('pruaned_convocatoria_activa');
    return saved ? JSON.parse(saved) : {
      activa: false,
      asunto: '',
      mensaje: '',
      fechaDespacho: ''
    };
  });

  const [directorioCargos, setDirectorioCargos] = useState(INITIAL_DIRECTORIO_CARGOS);

  const [donacionesList, setDonacionesList] = useState(() => {
    const saved = localStorage.getItem('pruaned_donaciones');
    return saved ? JSON.parse(saved) : INITIAL_DONACIONES;
  });

  const [postulacionesList, setPostulacionesList] = useState(() => {
    const saved = localStorage.getItem('pruaned_postulaciones');
    return saved ? JSON.parse(saved) : [
      {
        id: "POST-982101",
        fechaEnvio: "2026-08-10",
        estado: "Pendiente Revisión Directorio",
        nombreCompleto: "Dra. María Paz Morales",
        rut: "17.102.394-5",
        fechaNacimiento: "1992-05-14",
        email: "maria.morales@gmail.com",
        telefono: "+56 9 9123 4567",
        domicilio: "Av. Las Condes 4020",
        comuna: "Santiago",
        profesion: "Médico Veterinaria Cirujana",
        nivelEstudios: "Educación Superior Completa",
        experienciaPrevia: "5 años de respuesta operativa en albergues veterinarios post-incendios.",
        formacionCertificada: ["Rescate técnico animal", "Primeros auxilios veterinarios"],
        razonesIntegracion: "Deseo aportar desde la coordinación científica y veterinaria en terreno.",
        aporteEsperado: "Redes institucionales y protocolos de triage rápido.",
        haParticipadoOrgs: "Sí",
        tiempoDisponible: "8–12 horas",
        areasParticipacion: ["Activación en emergencias", "Capacitaciones"],
        experienciasComplejas: "Sí",
        descripcionExperiencias: "Atención de felinos con quemaduras de 3er grado en incendio Valparaíso.",
        necesitaApoyoBienestar: "No",
        tipoApoyoUtil: "No aplica",
        cartaIntencionNombre: "Carta_Intencion_MariaMorales.pdf",
        declaracionVeracidad: "Sí",
        autorizacionDatos: "Sí",
        aceptaLeyDatos: "Sí, acepto"
      }
    ];
  });

  const [financialSettings, setFinancialSettings] = useState(() => {
    const saved = localStorage.getItem('pruaned_financial_settings');
    return saved ? JSON.parse(saved) : INITIAL_FINANCIAL_SETTINGS;
  });

  const [expensesList, setExpensesList] = useState([]);
  const [cobrosList, setCobrosList] = useState([]);
  const [balancesList, setBalancesList] = useState([]);

  const [newsList, setNewsList] = useState(() => {
    const saved = localStorage.getItem('pruaned_news');
    return saved ? JSON.parse(saved) : INITIAL_NEWS;
  });

  const [docCategories, setDocCategories] = useState(() => {
    const saved = localStorage.getItem('pruaned_doc_categories');
    return saved ? JSON.parse(saved) : INITIAL_DOC_CATEGORIES;
  });

  const [documentsList, setDocumentsList] = useState(() => {
    const saved = localStorage.getItem('pruaned_documents');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [sociosList, setSociosList] = useState(() => {
    const saved = localStorage.getItem('pruaned_socios');
    return saved ? JSON.parse(saved) : INITIAL_SOCIOS;
  });

  const [voluntariosList, setVoluntariosList] = useState(() => {
    const saved = localStorage.getItem('pruaned_voluntarios');
    return saved ? JSON.parse(saved) : INITIAL_VOLUNTARIOS;
  });

  const [coursesList, setCoursesList] = useState(() => {
    const saved = localStorage.getItem('pruaned_courses');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  // FETCH DESDE SUPABASE SIEMPRE (RLS se encarga de filtrar qué puede ver un visitante vs un admin)
  useEffect(() => {
    if (isSupabaseReady()) {
      const fetchSupabaseData = async () => {
        try {
          const [sociosRes, volRes, newsRes, docsRes, donRes, cargosRes, egresosRes, cobrosRes, balancesRes] = await Promise.all([
            supabase.from('socios').select('*'),
            supabase.from('voluntarios').select('*'),
            supabase.from('noticias').select('*'),
            supabase.from('documentos').select('*'),
            supabase.from('donaciones').select('*'),
            supabase.from('directorio_cargos').select('*').eq('id', 1).single(),
            supabase.from('egresos').select('*'),
            supabase.from('cobros').select('*'),
            supabase.from('balances_anuales').select('*')
          ]);

          const snakeToCamel = (obj) => {
            if (Array.isArray(obj)) {
              return obj.map(v => snakeToCamel(v));
            } else if (obj !== null && obj.constructor === Object) {
              return Object.keys(obj).reduce((result, key) => {
                const camelKey = key.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
                result[camelKey] = snakeToCamel(obj[key]);
                return result;
              }, {});
            }
            return obj;
          };

          if (sociosRes.data && sociosRes.data.length > 0) {
            const mappedSocios = snakeToCamel(sociosRes.data).map(s => ({
              ...s,
              historialPagos: s.historialPagos || []
            }));
            setSociosList(mappedSocios);
          } else if (sociosRes.data && sociosRes.data.length === 0) setSociosList([]); 

          if (volRes.data && volRes.data.length > 0) setVoluntariosList(snakeToCamel(volRes.data));
          else if (volRes.data && volRes.data.length === 0) setVoluntariosList([]);

          if (newsRes.data && newsRes.data.length > 0) setNewsList(snakeToCamel(newsRes.data));
          else if (newsRes.data && newsRes.data.length === 0) setNewsList([]);

          if (docsRes.data && docsRes.data.length > 0) setDocumentsList(snakeToCamel(docsRes.data));
          else if (docsRes.data && docsRes.data.length === 0) setDocumentsList([]);

          if (donRes.data && donRes.data.length > 0) setDonacionesList(snakeToCamel(donRes.data));
          else if (donRes.data && donRes.data.length === 0) setDonacionesList([]);

          if (egresosRes.data && egresosRes.data.length > 0) setExpensesList(snakeToCamel(egresosRes.data));
          else if (egresosRes.data && egresosRes.data.length === 0) setExpensesList([]);

          if (cobrosRes.data && cobrosRes.data.length > 0) setCobrosList(snakeToCamel(cobrosRes.data));
          else if (cobrosRes.data && cobrosRes.data.length === 0) setCobrosList([]);

          if (balancesRes.data && balancesRes.data.length > 0) setBalancesList(snakeToCamel(balancesRes.data));
          else if (balancesRes.data && balancesRes.data.length === 0) setBalancesList([]);

          if (cargosRes.data) {
            setDirectorioCargos({
              presidenteId: cargosRes.data.presidente_id || INITIAL_DIRECTORIO_CARGOS.presidenteId,
              vicepresidenteId: cargosRes.data.vicepresidente_id || INITIAL_DIRECTORIO_CARGOS.vicepresidenteId,
              secretarioId: cargosRes.data.secretario_id || INITIAL_DIRECTORIO_CARGOS.secretarioId,
              tesoreroId: cargosRes.data.tesorero_id || INITIAL_DIRECTORIO_CARGOS.tesoreroId
            });
          }

        } catch (error) {
          console.error("Error sincronizando con Supabase:", error);
        }
      };
      
      fetchSupabaseData();
    }
  }, [currentUser]);

  const [securityLogs, setSecurityLogs] = useState(() => {
    const saved = localStorage.getItem('pruaned_security_logs');
    return saved ? JSON.parse(saved) : INITIAL_SECURITY_LOGS;
  });

  // Sync localStorage
  useEffect(() => {
    localStorage.setItem('pruaned_firmas_oficiales', JSON.stringify(firmasOficiales));
  }, [firmasOficiales]);

  useEffect(() => {
    localStorage.setItem('pruaned_convocatoria_activa', JSON.stringify(convocatoriaActiva));
  }, [convocatoriaActiva]);



  useEffect(() => {
    localStorage.setItem('pruaned_donaciones', JSON.stringify(donacionesList));
  }, [donacionesList]);

  useEffect(() => {
    localStorage.setItem('pruaned_postulaciones', JSON.stringify(postulacionesList));
  }, [postulacionesList]);

  useEffect(() => {
    localStorage.setItem('pruaned_financial_settings', JSON.stringify(financialSettings));
  }, [financialSettings]);



  useEffect(() => {
    localStorage.setItem('pruaned_news', JSON.stringify(newsList));
  }, [newsList]);

  useEffect(() => {
    localStorage.setItem('pruaned_doc_categories', JSON.stringify(docCategories));
  }, [docCategories]);

  useEffect(() => {
    localStorage.setItem('pruaned_documents', JSON.stringify(documentsList));
  }, [documentsList]);

  useEffect(() => {
    localStorage.setItem('pruaned_socios', JSON.stringify(sociosList));
  }, [sociosList]);

  useEffect(() => {
    localStorage.setItem('pruaned_voluntarios', JSON.stringify(voluntariosList));
  }, [voluntariosList]);

  useEffect(() => {
    localStorage.setItem('pruaned_courses', JSON.stringify(coursesList));
  }, [coursesList]);

  useEffect(() => {
    localStorage.setItem('pruaned_security_logs', JSON.stringify(securityLogs));
  }, [securityLogs]);

  // INACTIVITY TIMER
  const inactivityTimerRef = React.useRef(null);

  const resetInactivityTimer = React.useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (currentUser) {
      inactivityTimerRef.current = setTimeout(() => {
        logout();
      }, INACTIVITY_LIMIT_MS);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [currentUser, resetInactivityTimer]);

  // AUTHENTICATION
  const loginWithCredentials = async (emailInput, passwordInput) => {
    const cleanEmail = emailInput.trim().toLowerCase();

    if (isSupabaseReady()) {
      // Modo Nube Real (Supabase)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: passwordInput,
      });
      if (error) throw new Error(error.message);
    }

    const foundUser = USER_DATABASE.find(u => u.email.toLowerCase() === cleanEmail);

    let userObj;
    if (foundUser) {
      userObj = { ...foundUser };
    } else {
      const foundSocio = sociosList.find(s => s.email.toLowerCase() === cleanEmail);
      const foundVol = voluntariosList.find(v => v.email.toLowerCase() === cleanEmail);

      if (foundSocio) {
        userObj = {
          email: foundSocio.email,
          name: foundSocio.nombre,
          role: "socio",
          rut: foundSocio.rut,
          permisoGestionVoluntarios: foundSocio.permisoGestionVoluntarios || false
        };
      } else if (foundVol) {
        userObj = {
          email: foundVol.email,
          name: foundVol.nombre,
          role: "voluntario",
          rut: foundVol.rut,
          permisoGestionVoluntarios: false
        };
      } else {
        userObj = {
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          role: "socio",
          rut: "15.482.910-K",
          permisoGestionVoluntarios: false
        };
      }
    }

    setCurrentUser(userObj);
    setIs2FAVerified(true);
    setSecurityLogs(prev => logSecurityEvent(prev, `AUTH_SUCCESS_SERVER_RESOLVED_ROLE_${userObj.role.toUpperCase()}`, userObj.email, "INFO"));

    // Persistir sesión en localStorage
    const session = {
      token: generateSessionToken(),
      user: userObj,
      expiresAt: Date.now() + SESSION_DURATION_MS,
      loginAt: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    if (userObj.role === 'master' || userObj.role === 'directiva' || userObj.role === 'socio') {
      return 'socios';
    } else {
      return 'voluntarios';
    }
  };

  const logout = async () => {
    if (isSupabaseReady()) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(SESSION_KEY);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (currentUser) {
      setSecurityLogs(prev => logSecurityEvent(prev, "USER_LOGOUT", currentUser.email, "INFO"));
    }
    setCurrentUser(null);
    setIs2FAVerified(false);
    setActiveTab('home');
  };

  // RBAC PERMISSION HELPERS
  const isMasterUser = currentUser?.email === 'ag.pruaned@gmail.com' || currentUser?.role === 'master' || currentUser?.role === 'admin';
  const isDirectiva = currentUser?.role === 'directiva' || isMasterUser;
  const socioPermisoVoluntarios = sociosList.find(s => s.email === currentUser?.email)?.permisoGestionVoluntarios || currentUser?.permisoGestionVoluntarios || false;

  const canManageCategoriesAndCargos = isMasterUser || isDirectiva;
  const canManageVoluntarios = isMasterUser || isDirectiva || socioPermisoVoluntarios;
  const canManageFinances = isMasterUser || isDirectiva;
  const canPublishCMS = isMasterUser || isDirectiva;

  // DIGITALIZACIÓN DE FIRMAS OFICIALES
  const updateFirmaOficial = (cargoKey, firmaDataUrl) => {
    setFirmasOficiales(prev => ({
      ...prev,
      [cargoKey]: firmaDataUrl
    }));
    setSecurityLogs(prev => logSecurityEvent(prev, `UPDATE_OFFICIAL_SIGNATURE_${cargoKey}`, currentUser?.email, "INFO"));
  };

  // GESTIÓN DEL MÓDULO LMS (CREAR Y ELIMINAR CURSOS)
  const addCourse = (courseData) => {
    const newId = `c${Date.now()}`;
    const newCourse = { ...courseData, id: newId };
    setCoursesList(prev => [newCourse, ...prev]);
    setSecurityLogs(prev => logSecurityEvent(prev, `CREATE_LMS_COURSE_${courseData.code}`, currentUser?.email, "INFO"));
  };

  const deleteCourse = (courseId) => {
    setCoursesList(prev => prev.filter(c => c.id !== courseId));
    setSecurityLogs(prev => logSecurityEvent(prev, `DELETE_LMS_COURSE_${courseId}`, currentUser?.email, "WARN"));
  };

  // ACREDITACIÓN Y ESCALAFÓN DE VOLUNTARIOS
  const updateVoluntarioAcreditacion = (volId, nuevoNivel) => {
    setVoluntariosList(prev => prev.map(vol => {
      if (vol.id === volId) {
        return {
          ...vol,
          nivelAcreditacion: nuevoNivel
        };
      }
      return vol;
    }));
    setSecurityLogs(prev => logSecurityEvent(prev, `PROMOTED_VOLUNTEER_RANK_${volId}_TO_${nuevoNivel}`, currentUser?.email, "INFO"));
  };

  const updateSocioCategoria = (socioId, nuevaCategoria) => {
    setSociosList(prev => prev.map(s => {
      if (s.id === socioId) {
        return {
          ...s,
          categoria: nuevaCategoria,
          voto: nuevaCategoria === 'Socio Activo',
          estadoCuota: nuevaCategoria === 'Socio Honorario' ? 'Exento' : s.estadoCuota,
          montoCuotaMensual: nuevaCategoria === 'Socio Honorario' ? 0 : financialSettings.cuotaMensualActual
        };
      }
      return s;
    }));
    setSecurityLogs(prev => logSecurityEvent(prev, `UPDATE_SOCIO_CATEGORY_${socioId}_TO_${nuevaCategoria}`, currentUser?.email, "INFO"));
  };

  const updateSocioCuotaIncorporacion = (id, pagada) => {
    setSociosList(prev => prev.map(s => s.id === id ? { ...s, cuotaIncorporacionPagada: pagada } : s));
  };

  const levantarConvocatoriaEmergencia = (asunto, mensaje) => {
    const nuevaConvocatoria = {
      activa: true,
      asunto: asunto,
      mensaje: mensaje,
      fechaDespacho: new Date().toISOString()
    };
    setConvocatoriaActiva(nuevaConvocatoria);
    setSecurityLogs(prev => logSecurityEvent(prev, `EMERGENCY_CONVOCATORIA_RAISED`, currentUser?.email, "WARN"));
  };

  const cerrarConvocatoriaEmergencia = () => {
    setConvocatoriaActiva({
      activa: false,
      asunto: '',
      mensaje: '',
      fechaDespacho: ''
    });
    setSecurityLogs(prev => logSecurityEvent(prev, `EMERGENCY_CONVOCATORIA_CLOSED`, currentUser?.email, "INFO"));
  };

  const updateSocioPerfil = (socioId, perfilData) => {
    setSociosList(prev => prev.map(s => {
      if (s.id === socioId || s.email === perfilData.email) {
        const updated = {
          ...s,
          email: perfilData.email || s.email,
          telefono: perfilData.telefono || s.telefono,
          domicilio: perfilData.domicilio || s.domicilio,
          comuna: perfilData.comuna || s.comuna,
          fotoPerfil: perfilData.fotoPerfil || s.fotoPerfil
        };
        return updated;
      }
      return s;
    }));

    if (currentUser && (currentUser.email === perfilData.email || currentUser.id === socioId)) {
      setCurrentUser(prev => ({
        ...prev,
        email: perfilData.email || prev.email,
        fotoPerfil: perfilData.fotoPerfil || prev.fotoPerfil
      }));
    }

    setSecurityLogs(prev => logSecurityEvent(prev, `UPDATE_SOCIO_PROFILE_${socioId}`, currentUser?.email, "INFO"));
  };

  const updateDirectorioCargo = async (cargoKey, newSocioId) => {
    setDirectorioCargos(prev => ({
      ...prev,
      [cargoKey]: newSocioId
    }));

    if (isSupabaseReady()) {
      const dbColumn = cargoKey.replace(/Id$/, '_id');
      try {
        await supabase.from('directorio_cargos').update({ [dbColumn]: newSocioId }).eq('id', 1);
      } catch (error) {
        console.error("Error updating directorio_cargos in Supabase:", error);
      }
    }

    setSecurityLogs(prev => logSecurityEvent(prev, `UPDATE_DIRECTORIO_CARGO_${cargoKey}_TO_${newSocioId}`, currentUser?.email, "INFO"));
  };

  const getDirectorioMember = (cargoKey) => {
    const socioId = directorioCargos[cargoKey];
    return sociosList.find(s => s.id === socioId) || sociosList[0];
  };

  const togglePermisoGestionVoluntariosSocio = (socioId) => {
    setSociosList(prev => prev.map(s => {
      if (s.id === socioId) {
        const nuevoPermiso = !s.permisoGestionVoluntarios;
        return { ...s, permisoGestionVoluntarios: nuevoPermiso };
      }
      return s;
    }));
    setSecurityLogs(prev => logSecurityEvent(prev, `TOGGLE_VOLUNTEER_PERMISSION_${socioId}`, currentUser?.email, "INFO"));
  };

  const addDonacion = (donacionData) => {
    const itemWithId = { ...donacionData, id: `don-${Date.now()}` };
    setDonacionesList(prev => [itemWithId, ...prev]);
    setSecurityLogs(prev => logSecurityEvent(prev, `ADD_BANK_DONATION_${donacionData.monto}`, currentUser?.email, "INFO"));
  };

  const deleteDonacion = (id) => {
    setDonacionesList(prev => donacionesList.filter(d => d.id !== id));
    setSecurityLogs(prev => logSecurityEvent(prev, `DELETE_DONATION_${id}`, currentUser?.email, "WARN"));
  };

  const updateVoluntarioDisponibilidad = (volId, disponibilidadData) => {
    setVoluntariosList(prev => prev.map(vol => {
      if (vol.id === volId) {
        return {
          ...vol,
          disponibilidadRespuesta: disponibilidadData.disponibilidadRespuesta,
          recursosPropios: disponibilidadData.recursosPropios,
          laboresQuePuedeRealizar: disponibilidadData.laboresQuePuedeRealizar,
          ultimaActualizacionDisponibilidad: new Date().toISOString()
        };
      }
      return vol;
    }));
    setSecurityLogs(prev => logSecurityEvent(prev, `UPDATE_VOLUNTEER_AVAILABILITY_${volId}`, currentUser?.email, "INFO"));
  };

  const addPostulacion = (postulacionData) => {
    setPostulacionesList(prev => [postulacionData, ...prev]);
    setSecurityLogs(prev => logSecurityEvent(prev, `NEW_SOCIO_APPLICATION_${postulacionData.rut}`, postulacionData.email, "INFO"));
  };

  const updatePostulacionEstado = (id, nuevoEstado, categoriaAsignada = "Socio Activo") => {
    const post = postulacionesList.find(p => p.id === id);
    setPostulacionesList(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));

    if (nuevoEstado === 'Aceptada / Incorporado' && post) {
      const newSocio = {
        id: `soc-${Date.now()}`,
        rut: post.rut,
        nombre: post.nombreCompleto,
        profesion: post.profesion,
        categoria: categoriaAsignada,
        voto: categoriaAsignada === 'Socio Activo',
        email: post.email,
        region: post.comuna || 'Región Metropolitana',
        fechaIngreso: new Date().toISOString().split('T')[0],
        estadoCuota: 'En Mora',
        montoCuotaMensual: financialSettings.cuotaMensualActual,
        cuotaIncorporacionPagada: false,
        montoCuotaIncorporacion: financialSettings.cuotaIncorporacionActual,
        mesesAdeudados: 1,
        ultimaCuotaPagada: 'Pendiente Pago Incorporación',
        permisoGestionVoluntarios: false,
        fotoPerfil: '',
        historialPagos: []
      };
      setSociosList(prev => [newSocio, ...prev]);
    }
  };

  const solicitarRenunciaSocio = (socioId, motivoRenuncia) => {
    setSociosList(prev => prev.map(socio => {
      if (socio.id === socioId) {
        return {
          ...socio,
          estadoCuota: 'Solicitud Renuncia Pendiente Directorio',
          motivoRenuncia: motivoRenuncia,
          fechaSolicitudRenuncia: new Date().toISOString().split('T')[0]
        };
      }
      return socio;
    }));
  };

  const aprobarRenunciaDirectorio = (socioId, numeroActaDirectorio) => {
    setSociosList(prev => prev.map(socio => {
      if (socio.id === socioId) {
        return {
          ...socio,
          estadoCuota: 'Desvinculado / Retiro Aprobado DL 2757',
          fechaRetiroOficial: new Date().toISOString().split('T')[0],
          actaDirectorioAprobacion: numeroActaDirectorio || 'Acta Directorio N° 2025-08',
          email: 'contacto.anonimizado@pruaned.cl',
          telefono: 'Desvinculado ARCO',
          domicilio: 'Anonimizado por Ley 21.719'
        };
      }
      return socio;
    }));
  };

  const updateFinancialSettings = (newCuotaMensual, newCuotaIncorporacion) => {
    const updated = {
      cuotaMensualActual: Number(newCuotaMensual),
      cuotaIncorporacionActual: Number(newCuotaIncorporacion)
    };
    setFinancialSettings(updated);
    setSociosList(prev => prev.map(s => {
      if (s.categoria !== 'Socio Honorario') {
        return { ...s, montoCuotaMensual: Number(newCuotaMensual) };
      }
      return s;
    }));
  };

  const addExpense = async (expenseItem) => {
    if (isSupabaseReady()) {
      const dbItem = {
        fecha: expenseItem.fecha,
        tipo_documento: expenseItem.tipoDocumento,
        numero_documento: expenseItem.numeroDocumento,
        proveedor: expenseItem.proveedor,
        categoria: expenseItem.categoria,
        origen_fondo: expenseItem.origenFondo || 'Fondo Cuotas',
        monto: expenseItem.monto,
        glosa: expenseItem.glosa
      };
      const { data, error } = await supabase.from('egresos').insert([dbItem]).select();
      if (!error && data && data.length > 0) {
        const d = data[0];
        setExpensesList(prev => [...prev, {
          id: d.id, fecha: d.fecha, tipoDocumento: d.tipo_documento, 
          numeroDocumento: d.numero_documento, proveedor: d.proveedor, 
          categoria: d.categoria, origenFondo: d.origen_fondo, 
          monto: d.monto, glosa: d.glosa
        }]);
      }
    } else {
      const itemWithId = { ...expenseItem, id: `exp-${Date.now()}` };
      setExpensesList(prev => [...prev, itemWithId]);
    }
  };

  const deleteExpense = async (id) => {
    if (isSupabaseReady()) {
      await supabase.from('egresos').delete().eq('id', id);
    }
    setExpensesList(prev => prev.filter(e => e.id !== id));
  };

  const addCobrosBatch = async (cobrosArray) => {
    if (isSupabaseReady()) {
      const dbItems = cobrosArray.map(c => ({
        socio_id: c.socioId,
        titulo: c.titulo,
        monto: c.monto,
        pagado: c.pagado || false
      }));
      const { data, error } = await supabase.from('cobros').insert(dbItems).select();
      if (!error && data) {
        const camelData = data.map(d => ({
          id: d.id, socioId: d.socio_id, titulo: d.titulo, monto: d.monto, pagado: d.pagado, fechaCreacion: d.fecha_creacion
        }));
        setCobrosList(prev => [...prev, ...camelData]);
      }
    } else {
      const localData = cobrosArray.map((c, i) => ({ ...c, id: `cobro-${Date.now()}-${i}` }));
      setCobrosList(prev => [...prev, ...localData]);
    }
  };

  const updateSocioCuota = (socioId, newEstado, newComprobante = null, isSuspensionRequest = false, isCuotaIncorporacion = false) => {
    setSociosList(prev => prev.map(socio => {
      if (socio.id === socioId) {
        let updatedPagos = socio.historialPagos;
        let isIncorporacionPaid = socio.cuotaIncorporacionPagada;
        let mesesAdeudados = socio.mesesAdeudados;

        if (isCuotaIncorporacion) {
          isIncorporacionPaid = true;
          updatedPagos = [
            { mes: "Cuota Incorporación", monto: socio.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual, fecha: new Date().toISOString().split('T')[0], comprobante: newComprobante || 'Validado por Tesorería' },
            ...socio.historialPagos
          ];
        } else if (newComprobante !== null) {
          const currentMonthYear = "Agosto 2026";
          mesesAdeudados = Math.max(0, mesesAdeudados - 1);
          updatedPagos = [
            { mes: currentMonthYear, monto: socio.montoCuotaMensual || financialSettings.cuotaMensualActual, fecha: new Date().toISOString().split('T')[0], comprobante: newComprobante || 'Validado por Tesorería' },
            ...socio.historialPagos
          ];
        }

        return {
          ...socio,
          estadoCuota: newEstado,
          mesesAdeudados: mesesAdeudados,
          cuotaIncorporacionPagada: isIncorporacionPaid,
          ultimaCuotaPagada: newComprobante || isCuotaIncorporacion ? "Agosto 2026" : socio.ultimaCuotaPagada,
          historialPagos: updatedPagos,
          solicitudSuspenso: isSuspensionRequest ? "Pendiente Aprobación Directorio Art. 42" : socio.solicitudSuspenso
        };
      }
      return socio;
    }));
  };

  const addNews = (newsItem) => {
    const itemWithId = { ...newsItem, id: `n-${Date.now()}` };
    setNewsList(prev => [itemWithId, ...prev]);
  };

  const deleteNews = (id) => {
    setNewsList(prev => prev.filter(n => n.id !== id));
  };

  const addDocCategory = (categoryName) => {
    if (!docCategories.includes(categoryName.trim())) {
      setDocCategories(prev => [...prev, categoryName.trim()]);
    }
  };

  const deleteDocCategory = (categoryName) => {
    setDocCategories(prev => prev.filter(c => c !== categoryName));
  };

  const addDocument = (docItem) => {
    const itemWithId = { ...docItem, id: `doc-${Date.now()}` };
    setDocumentsList(prev => [itemWithId, ...prev]);
  };

  const deleteDocument = (id) => {
    setDocumentsList(prev => prev.filter(d => d.id !== id));
  };

  const updateVolunteerCert = (volId, courseId) => {
    setVoluntariosList(prev => prev.map(vol => {
      if (vol.id === volId) {
        const cursos = vol.cursosAprobados.includes(courseId) ? vol.cursosAprobados : [...vol.cursosAprobados, courseId];
        return {
          ...vol,
          cursosAprobados: cursos,
          horasAcumuladas: vol.horasAcumuladas + 10
        };
      }
      return vol;
    }));
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loginWithCredentials,
      logout,
      is2FAVerified,
      setIs2FAVerified,
      activeTab,
      setActiveTab,
      // Firmas Digitales
      firmasOficiales,
      updateFirmaOficial,
      // LMS Management
      addCourse,
      deleteCourse,
      // Escalafón Acreditación
      updateVoluntarioAcreditacion,
      // Convocatoria State
      convocatoriaActiva,
      levantarConvocatoriaEmergencia,
      cerrarConvocatoriaEmergencia,
      // Roles & Permissions
      isMasterUser,
      isDirectiva,
      canManageCategoriesAndCargos,
      canManageVoluntarios,
      canManageFinances,
      canPublishCMS,
      updateSocioCategoria,
      updateSocioCuotaIncorporacion,
      togglePermisoGestionVoluntariosSocio,
      // Directorio Cargos & Profile
      directorioCargos,
      updateDirectorioCargo,
      getDirectorioMember,
      updateSocioPerfil,
      // Data
      donacionesList,
      addDonacion,
      deleteDonacion,
      postulacionesList,
      addPostulacion,
      updatePostulacionEstado,
      solicitarRenunciaSocio,
      aprobarRenunciaDirectorio,
      financialSettings,
      updateFinancialSettings,
      expensesList,
      addExpense,
      deleteExpense,
      cobrosList,
      setCobrosList,
      addCobrosBatch,
      balancesList,
      setBalancesList,
      newsList,
      addNews,
      deleteNews,
      docCategories,
      addDocCategory,
      deleteDocCategory,
      documentsList,
      addDocument,
      deleteDocument,
      sociosList,
      updateSocioCuota,
      voluntariosList,
      updateVolunteerCert,
      updateVoluntarioDisponibilidad,
      coursesList,
      securityLogs
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
