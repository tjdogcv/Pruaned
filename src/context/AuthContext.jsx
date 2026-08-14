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
import { attachCourseModules, normalizeAudience } from '../lib/lmsProgress';
import {
  LEGACY_SESSION_DURATION_MS,
  clearLegacySession,
  createRestorationEpoch,
  getSignedOutAuthState,
  loadLegacySession,
  validateSupabaseSession
} from './authSession';

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutos

const DEFAULT_FINANCIAL_CATEGORIES = [
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

const toPublicDonation = (donation) => ({
  id: donation.id,
  fecha: donation.fecha,
  monto: donation.monto ?? donation.montoClp ?? donation.monto_clp ?? 0,
  banco: donation.banco || '',
  cuentaId: donation.cuentaId || donation.cuenta_id || null,
  numeroComprobante: donation.numeroComprobante || donation.numero_comprobante || donation.nComprobante || donation.n_comprobante || '',
  categoria: donation.categoria || donation.destinoAporte || donation.destino_aporte || 'Aporte libre'
});

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

function resolveUserForEmail(email, socios, voluntarios) {
  const cleanEmail = email.trim().toLowerCase();
  const foundUser = USER_DATABASE.find(user => user.email.toLowerCase() === cleanEmail);

  if (foundUser) return { ...foundUser };

  const foundSocio = socios.find(socio => socio.email?.toLowerCase() === cleanEmail);
  if (foundSocio) {
    return {
      email: foundSocio.email,
      name: foundSocio.nombre,
      role: 'socio',
      rut: foundSocio.rut,
      permisoGestionVoluntarios: foundSocio.permisoGestionVoluntarios || false
    };
  }

  const foundVoluntario = voluntarios.find(voluntario => voluntario.email?.toLowerCase() === cleanEmail);
  if (foundVoluntario) {
    return {
      email: foundVoluntario.email,
      name: foundVoluntario.nombre,
      role: 'voluntario',
      rut: foundVoluntario.rut,
      permisoGestionVoluntarios: false
    };
  }

  return {
    email: cleanEmail,
    name: cleanEmail.split('@')[0],
    role: 'socio',
    rut: '15.482.910-K',
    permisoGestionVoluntarios: false
  };
}

export const AuthProvider = ({ children }) => {
  const supabaseReady = isSupabaseReady();
  const persistedSession = supabaseReady ? null : loadLegacySession(localStorage);
  const [currentUser, setCurrentUser] = useState(persistedSession?.user || null);
  const [is2FAVerified, setIs2FAVerified] = useState(!!persistedSession);
  const [isAuthRestoring, setIsAuthRestoring] = useState(supabaseReady);
  const [activeTab, setActiveTab] = useState('home');

  // Firmas Digitales Oficiales (Presidente y Secretario)
  const [firmasOficiales, setFirmasOficiales] = useState(INITIAL_FIRMAS);

  // Estado de Convocatoria Activa de Emergencia
  const [convocatoriaActiva, setConvocatoriaActiva] = useState({
    activa: false,
    asunto: '',
    mensaje: '',
    fechaDespacho: ''
  });

  const [directorioCargos, setDirectorioCargos] = useState(INITIAL_DIRECTORIO_CARGOS);

  const [donacionesList, setDonacionesList] = useState(() => {
    if (supabaseReady) return [];
    const saved = localStorage.getItem('pruaned_donaciones');
    return saved ? JSON.parse(saved) : INITIAL_DONACIONES;
  });
  const [publicDonationsList, setPublicDonationsList] = useState(() => (
    supabaseReady ? [] : INITIAL_DONACIONES.map(toPublicDonation)
  ));

  const [postulacionesList, setPostulacionesList] = useState([]);

  const [financialSettings, setFinancialSettings] = useState(INITIAL_FINANCIAL_SETTINGS);

  const [expensesList, setExpensesList] = useState([]);
  const [financialCategories, setFinancialCategories] = useState(() => (
    supabaseReady ? [] : DEFAULT_FINANCIAL_CATEGORIES
  ));
  const [financialAccounts, setFinancialAccounts] = useState([]);
  const [cobrosList, setCobrosList] = useState([]);
  const [balancesList, setBalancesList] = useState([]);

  const [newsList, setNewsList] = useState(() => {
    const saved = localStorage.getItem('pruaned_news');
    return saved ? JSON.parse(saved) : INITIAL_NEWS;
  });

  const [docCategories, setDocCategories] = useState(INITIAL_DOC_CATEGORIES);

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

  const sociosListRef = React.useRef(sociosList);
  const voluntariosListRef = React.useRef(voluntariosList);

  useEffect(() => {
    sociosListRef.current = sociosList;
  }, [sociosList]);

  useEffect(() => {
    voluntariosListRef.current = voluntariosList;
  }, [voluntariosList]);

  // Los datos de demostración sólo existen para la experiencia offline. Una
  // instancia Supabase configurada parte sin cursos hasta que se publiquen.
  const [coursesList, setCoursesList] = useState(() => supabaseReady ? [] : INITIAL_COURSES);
  const [lmsProfile, setLmsProfile] = useState(null);
  const [lmsParticipants, setLmsParticipants] = useState([]);
  const [lmsModules, setLmsModules] = useState([]);
  const [lmsResults, setLmsResults] = useState([]);
  const [lmsModuleProgress, setLmsModuleProgress] = useState([]);
  const [isLmsLoading, setIsLmsLoading] = useState(false);
  const [isLmsManager, setIsLmsManager] = useState(false);
  const [lmsReloadKey, setLmsReloadKey] = useState(0);

  // FETCH DESDE SUPABASE SIEMPRE (RLS se encarga de filtrar qué puede ver un visitante vs un admin)
  useEffect(() => {
    if (isSupabaseReady()) {
      const fetchSupabaseData = async () => {
        try {
          const [sociosRes, volRes, newsRes, docsRes, donRes, publicDonRes, cargosRes, egresosRes, financialCategoriesRes, financialAccountsRes, cobrosRes, balancesRes, postulacionesRes, paramsRes, cursosRes, logsRes] = await Promise.all([
            supabase.from('socios').select('*'),
            supabase.from('voluntarios').select('*'),
            supabase.from('noticias').select('*'),
            supabase.from('documentos').select('*'),
            supabase.from('donaciones').select('*'),
            supabase.from('donaciones_publicas').select('*').order('fecha', { ascending: false }),
            supabase.from('directorio_cargos').select('*').eq('id', 1).single(),
            supabase.from('egresos').select('*'),
            supabase.from('categorias_financieras').select('*').order('tipo').order('nombre'),
            supabase.from('cuentas_financieras').select('*').order('nombre'),
            supabase.from('cobros').select('*'),
            supabase.from('balances_anuales').select('*'),
            supabase.from('postulaciones').select('*').order('created_at', { ascending: false }),
            supabase.from('parametros_sistema').select('*'),
            supabase.from('cursos_lms').select('id, code, title, description, hours, level, modality, audience, status, instructor, duration, difficulty, category, requirements, video_url, has_evaluation, created_at, updated_at').order('created_at', { ascending: false }),
            supabase.from('auditoria_logs').select('*').order('fecha', { ascending: false }).limit(200)
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

          if (publicDonRes.data) setPublicDonationsList(snakeToCamel(publicDonRes.data));

          if (egresosRes.data && egresosRes.data.length > 0) setExpensesList(snakeToCamel(egresosRes.data));
          else if (egresosRes.data && egresosRes.data.length === 0) setExpensesList([]);

          if (financialCategoriesRes.data) setFinancialCategories(snakeToCamel(financialCategoriesRes.data));
          if (financialAccountsRes.data) setFinancialAccounts(snakeToCamel(financialAccountsRes.data));

          if (cobrosRes.data && cobrosRes.data.length > 0) setCobrosList(snakeToCamel(cobrosRes.data));
          else if (cobrosRes.data && cobrosRes.data.length === 0) setCobrosList([]);

          if (balancesRes.data && balancesRes.data.length > 0) setBalancesList(snakeToCamel(balancesRes.data));
          else if (balancesRes.data && balancesRes.data.length === 0) setBalancesList([]);

          if (postulacionesRes.data && postulacionesRes.data.length > 0) setPostulacionesList(snakeToCamel(postulacionesRes.data));
          else if (postulacionesRes.data && postulacionesRes.data.length === 0) setPostulacionesList([]);

          if (cargosRes.data) {
            setDirectorioCargos({
              presidenteId: cargosRes.data.presidente_id || INITIAL_DIRECTORIO_CARGOS.presidenteId,
              vicepresidenteId: cargosRes.data.vicepresidente_id || INITIAL_DIRECTORIO_CARGOS.vicepresidenteId,
              secretarioId: cargosRes.data.secretario_id || INITIAL_DIRECTORIO_CARGOS.secretarioId,
              tesoreroId: cargosRes.data.tesorero_id || INITIAL_DIRECTORIO_CARGOS.tesoreroId
            });
          }

          if (paramsRes && paramsRes.data) {
            paramsRes.data.forEach(param => {
              if (param.id === 'financial_settings') setFinancialSettings(param.valor);
              if (param.id === 'doc_categories') setDocCategories(param.valor);
              if (param.id === 'convocatoria_activa') setConvocatoriaActiva(param.valor);
              if (param.id === 'firmas_oficiales') setFirmasOficiales(param.valor);
            });
          }
          if (cursosRes && cursosRes.data) setCoursesList(snakeToCamel(cursosRes.data));
          if (logsRes && logsRes.data && logsRes.data.length > 0) setSecurityLogs(snakeToCamel(logsRes.data));

        } catch (error) {
          console.error("Error sincronizando con Supabase:", error);
        }
      };
      
      fetchSupabaseData();
    }
  }, [currentUser]);

  // El progreso académico tiene su propio contrato y RLS. Nunca se deduce de la
  // ficha de voluntario de otra persona ni se guarda en localStorage.
  useEffect(() => {
    if (!supabaseReady || !currentUser) {
      setLmsProfile(null);
      setLmsParticipants([]);
      setLmsModules([]);
      setLmsResults([]);
      setLmsModuleProgress([]);
      setIsLmsLoading(false);
      setIsLmsManager(false);
      return undefined;
    }

    let cancelled = false;
    const loadLmsData = async () => {
      setIsLmsLoading(true);
      try {
        const profileRes = await supabase.rpc('lms_bootstrap_profile');
        if (profileRes.error) throw profileRes.error;

        const [managerRes, coursesRes, participantsRes, modulesRes, resultsRes, progressRes] = await Promise.all([
          supabase.rpc('lms_is_manager'),
          supabase.from('cursos_lms').select('id, code, title, description, hours, level, modality, audience, status, instructor, duration, difficulty, category, requirements, video_url, has_evaluation, created_at, updated_at').order('created_at', { ascending: false }),
          supabase.from('lms_participants').select('user_id, email, display_name, participant_type, audiences'),
          supabase.from('lms_course_modules').select('id, course_id, title, content, video_url, position').order('position'),
          supabase.from('lms_course_results').select('user_id, course_id, status, score, attempts, completed_at, last_attempt_at'),
          supabase.from('lms_module_progress').select('user_id, module_id, completed_at')
        ]);
        if (managerRes.error) throw managerRes.error;
        if (coursesRes.error) throw coursesRes.error;
        if (participantsRes.error) throw participantsRes.error;
        if (modulesRes.error) throw modulesRes.error;
        if (resultsRes.error) throw resultsRes.error;
        if (progressRes.error) throw progressRes.error;
        if (cancelled) return;

        setLmsProfile(profileRes.data ? {
          ...profileRes.data,
          userId: profileRes.data.user_id,
          participantType: profileRes.data.participant_type
        } : null);
        setIsLmsManager(Boolean(managerRes.data));
        setCoursesList((coursesRes.data || []).map((course) => ({
          ...course,
          videoUrl: course.video_url,
          hasEvaluation: course.has_evaluation,
          createdAt: course.created_at,
          updatedAt: course.updated_at
        })));
        setLmsParticipants((participantsRes.data || []).map((participant) => ({
          userId: participant.user_id,
          email: participant.email,
          displayName: participant.display_name,
          participantType: participant.participant_type,
          audiences: participant.audiences || []
        })));
        setLmsModules((modulesRes.data || []).map((module) => ({
          id: module.id,
          courseId: module.course_id,
          title: module.title,
          content: module.content,
          videoUrl: module.video_url,
          position: module.position
        })));
        setLmsResults((resultsRes.data || []).map((result) => ({
          userId: result.user_id,
          courseId: result.course_id,
          status: result.status,
          score: result.score,
          attempts: result.attempts,
          completedAt: result.completed_at,
          lastAttemptAt: result.last_attempt_at
        })));
        setLmsModuleProgress((progressRes.data || []).map((progress) => ({
          userId: progress.user_id,
          moduleId: progress.module_id,
          completedAt: progress.completed_at
        })));
      } catch (error) {
        console.error('Error sincronizando el registro académico:', error);
      } finally {
        if (!cancelled) setIsLmsLoading(false);
      }
    };

    loadLmsData();
    return () => { cancelled = true; };
  }, [supabaseReady, currentUser?.email, lmsReloadKey]);

  const [securityLogs, setSecurityLogs] = useState(INITIAL_SECURITY_LOGS);

  const addSecurityLog = (eventType, userEmail, severity = "INFO") => {
    // Generar el log y actualizar UI localmente (pasando 'prev')
    setSecurityLogs(prev => logSecurityEvent(prev, eventType, userEmail, severity));

    // Si Supabase está listo, también lo insertamos en la BD usando humanize 
    if (isSupabaseReady()) {
      // Necesitamos recrear la misma lógica de humanize, o extraer el último elemento agregado, 
      // pero logSecurityEvent hace humanize por nosotros.
      // logSecurityEvent(prev, eventType...) retorna un arreglo con el nuevo log en la posición 0.
      const newLogs = logSecurityEvent([], eventType, userEmail, severity);
      const newLog = newLogs[0];
      supabase.from('auditoria_logs').insert([{
        fecha: newLog.date,
        accion: newLog.label,
        usuario: newLog.user,
        severidad: newLog.severity
      }]).then(({ error }) => {
        if (error) console.error("Error guardando log de auditoría:", error);
      }).catch(err => console.error("Error guardando log de auditoría:", err));
    }
  };

  // Limpiar localStorage de tablas migradas a Supabase
  useEffect(() => {
    const keysToRemove = [
      'pruaned_postulaciones',
      'pruaned_firmas_oficiales',
      'pruaned_convocatoria_activa',
      'pruaned_financial_settings',
      'pruaned_doc_categories',
      'pruaned_courses',
      'pruaned_security_logs'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }, []);

  // Sesión de demo: se conserva el TTL y cierre por inactividad sólo fuera de Supabase.
  const inactivityTimerRef = React.useRef(null);
  const restorationEpochRef = React.useRef(createRestorationEpoch());

  const invalidateRestoration = React.useCallback(() => {
    restorationEpochRef.current.invalidate();
  }, []);

  const enableRestoration = React.useCallback(() => {
    restorationEpochRef.current.enable();
  }, []);

  const clearCurrentAuthentication = React.useCallback(() => {
    const signedOutState = getSignedOutAuthState();
    invalidateRestoration();
    clearLegacySession(localStorage);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    setCurrentUser(signedOutState.currentUser);
    setIs2FAVerified(signedOutState.is2FAVerified);
    setIsAuthRestoring(signedOutState.isAuthRestoring);
    setActiveTab('home');
  }, [invalidateRestoration]);

  useEffect(() => {
    if (!supabaseReady) {
      setIsAuthRestoring(false);
      return undefined;
    }

    let isMounted = true;
    let validationInFlight = false;
    let restorationCompleted = false;

    const restoreSupabaseSession = async (forceValidation = false) => {
      if (!isMounted || validationInFlight || (restorationCompleted && !forceValidation)) return;

      const validationEpoch = restorationEpochRef.current.capture();
      if (validationEpoch === null) return;

      validationInFlight = true;
      const isValidationCurrent = () =>
        isMounted && restorationEpochRef.current.isCurrent(validationEpoch);
      setIsAuthRestoring(true);

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const session = sessionData?.session;
        let user = null;
        let userError = null;

        if (!sessionError && session) {
          const userResponse = await supabase.auth.getUser();
          user = userResponse.data?.user || null;
          userError = userResponse.error;
        }

        const validation = validateSupabaseSession({ session, user, sessionError, userError });
        if (!validation.isValid) {
          if (isValidationCurrent()) clearCurrentAuthentication();
          return;
        }

        if (isValidationCurrent()) {
          clearLegacySession(localStorage);
          setCurrentUser(resolveUserForEmail(user.email, sociosListRef.current, voluntariosListRef.current));
          setIs2FAVerified(true);
        }
      } catch {
        if (isValidationCurrent()) clearCurrentAuthentication();
      } finally {
        validationInFlight = false;
        if (isValidationCurrent()) {
          restorationCompleted = true;
          setIsAuthRestoring(false);
        }
      }
    };

    const queueValidation = (forceValidation = false) => {
      window.setTimeout(() => {
        void restoreSupabaseSession(forceValidation);
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'INITIAL_SESSION') queueValidation();
      if (event === 'TOKEN_REFRESHED') queueValidation(true);
      if (event === 'SIGNED_OUT') {
        clearCurrentAuthentication();
      }
    });

    void restoreSupabaseSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [clearCurrentAuthentication, supabaseReady]);

  const resetInactivityTimer = React.useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (!supabaseReady && currentUser) {
      inactivityTimerRef.current = setTimeout(() => {
        logout();
      }, INACTIVITY_LIMIT_MS);
    }
  }, [currentUser, supabaseReady]);

  useEffect(() => {
    if (!currentUser || supabaseReady) return undefined;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [currentUser, resetInactivityTimer, supabaseReady]);

  // AUTHENTICATION
  const loginStep1_RequestOTP = async (emailInput, passwordInput) => {
    const cleanEmail = emailInput.trim().toLowerCase();

    if (isSupabaseReady()) {
      // Paso 1: Validar la contraseña primero
      const { error: passError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: passwordInput,
      });
      
      if (passError) throw new Error(passError.message);
      
      // Contraseña correcta. Cerramos sesión inmediatamente para no otorgar acceso aún.
      await supabase.auth.signOut();
      
      // Paso 2: Disparar el envío del OTP por correo
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
      });
      
      if (otpError) throw new Error("Error enviando código OTP al correo: " + otpError.message);
      
      return true;
    }

    // Modo Mock
    return true; 
  };

  const loginStep2_VerifyOTP = async (emailInput, otpCode) => {
    const cleanEmail = emailInput.trim().toLowerCase();

    if (isSupabaseReady()) {
      const { error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: otpCode,
        type: 'email'
      });

      
      if (error) throw new Error("Código 2FA incorrecto o expirado.");
    } else {
      if (otpCode !== '123456') throw new Error("Código inválido (usa 123456 en modo demo).");
    }

    if (supabaseReady) enableRestoration();

    const userObj = resolveUserForEmail(cleanEmail, sociosList, voluntariosList);

    setCurrentUser(userObj);
    setIs2FAVerified(true);
    setIsAuthRestoring(false);
    addSecurityLog(`AUTH_SUCCESS_SERVER_RESOLVED_ROLE_${userObj.role.toUpperCase()}`, userObj.email, "INFO");

    // Persistir sesión en localStorage
    if (!supabaseReady) {
      const session = {
        token: generateSessionToken(),
        user: userObj,
        expiresAt: Date.now() + LEGACY_SESSION_DURATION_MS,
        loginAt: new Date().toISOString()
      };
      localStorage.setItem('pruaned_session', JSON.stringify(session));
    } else {
      clearLegacySession(localStorage);
    }

    if (userObj.role === 'master' || userObj.role === 'directiva' || userObj.role === 'socio') {
      return 'socios';
    } else {
      return 'voluntarios';
    }
  };

  const resetPasswordRequest = async (emailInput) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    if (isSupabaseReady()) {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin + '/?type=recovery'
      });
      if (error) throw new Error("Error solicitando recuperación: " + error.message);
      return true;
    }
    // Mock mode
    return true;
  };

  const updatePassword = async (newPassword) => {
    if (isSupabaseReady()) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error("Error actualizando contraseña: " + error.message);
      return true;
    }
    // Mock mode
    return true;
  };

  const logout = async () => {
    const userLoggingOut = currentUser;
    invalidateRestoration();
    try {
      if (supabaseReady) {
        await supabase.auth.signOut();
      }
    } finally {
      clearCurrentAuthentication();
      if (userLoggingOut) {
        addSecurityLog("USER_LOGOUT", userLoggingOut.email, "INFO");
      }
    }
  };

  // RBAC PERMISSION HELPERS
  const isMasterUser = currentUser?.email === 'ag.pruaned@gmail.com' || currentUser?.role === 'master' || currentUser?.role === 'admin';
  const currentUserSocio = sociosList.find(s => s.email === currentUser?.email);
  const isDirectiva = currentUser?.role === 'directiva' || isMasterUser || (currentUserSocio && [
    directorioCargos.presidenteId, 
    directorioCargos.vicepresidenteId, 
    directorioCargos.secretarioId, 
    directorioCargos.tesoreroId
  ].includes(currentUserSocio.id));
  const socioPermisoVoluntarios = sociosList.find(s => s.email === currentUser?.email)?.permisoGestionVoluntarios || currentUser?.permisoGestionVoluntarios || false;

  const canManageCategoriesAndCargos = isMasterUser || isDirectiva;
  const canManageVoluntarios = isMasterUser || isDirectiva || socioPermisoVoluntarios || isLmsManager;
  const canManageFinances = isMasterUser || isDirectiva;
  const canPublishCMS = isMasterUser || isDirectiva;

  // DIGITALIZACIÓN DE FIRMAS OFICIALES
  const updateFirmaOficial = async (cargoKey, firmaDataUrl) => {
    let newState = {};
    setFirmasOficiales(prev => {
      newState = { ...prev, [cargoKey]: firmaDataUrl };
      return newState;
    });
    if (isSupabaseReady()) {
      try {
        await supabase.from('parametros_sistema').upsert({ id: 'firmas_oficiales', valor: newState });
      } catch (err) { console.error('Error saving firmasOficiales:', err); }
    }
    addSecurityLog(`UPDATE_OFFICIAL_SIGNATURE_${cargoKey}`, currentUser?.email, "INFO");
  };

  // GESTIÓN DEL MÓDULO LMS (CREAR Y ELIMINAR CURSOS)
  // La edicion editorial pasa por RPC: no hay DML directo desde el navegador.
  const refreshLmsData = () => setLmsReloadKey((value) => value + 1);

  const getLmsCourseEditor = async (courseId) => {
    if (!supabaseReady) throw new Error('La administracion del aula requiere una conexion segura a Supabase.');
    const { data, error } = await supabase.rpc('lms_get_course_editor', { p_course_id: courseId });
    if (error) throw error;
    return data;
  };

  const saveLmsCourseBundle = async ({ courseId = null, course, modules = [], questions = [] }) => {
    if (!supabaseReady) throw new Error('La administracion del aula requiere una conexion segura a Supabase.');
    const { data, error } = await supabase.rpc('lms_save_course_bundle', {
      p_course_id: courseId,
      p_course: { ...course, audience: normalizeAudience(course.audience) },
      p_modules: modules,
      p_questions: questions
    });
    if (error) throw error;
    refreshLmsData();
    addSecurityLog(`${courseId ? 'UPDATE' : 'CREATE'}_LMS_COURSE_${course.code}`, currentUser?.email, 'INFO');
    return data;
  };

  const archiveLmsCourse = async (courseId) => {
    if (!supabaseReady) throw new Error('La administracion del aula requiere una conexion segura a Supabase.');
    const { error } = await supabase.rpc('lms_archive_course', { p_course_id: courseId });
    if (error) throw error;
    refreshLmsData();
    addSecurityLog(`ARCHIVE_LMS_COURSE_${courseId}`, currentUser?.email, 'WARN');
  };

  const restoreLmsCourse = async (courseId) => {
    if (!supabaseReady) throw new Error('La administracion del aula requiere una conexion segura a Supabase.');
    const { error } = await supabase.rpc('lms_restore_course', { p_course_id: courseId });
    if (error) throw error;
    refreshLmsData();
    addSecurityLog(`RESTORE_LMS_COURSE_${courseId}`, currentUser?.email, 'INFO');
  };

  // Compatibilidad con consumidores antiguos: ambas rutas mantienen el
  // contrato transaccional y el archivado, sin borrados fisicos.
  const addCourse = (courseData) => saveLmsCourseBundle({
    course: courseData,
    modules: courseData.modules || [],
    questions: courseData.questions || []
  });
  const deleteCourse = archiveLmsCourse;

  // ACREDITACIÓN Y ESCALAFÓN DE VOLUNTARIOS
  const updateVoluntarioAcreditacion = async (volId, nuevoNivel) => {
    setVoluntariosList(prev => prev.map(vol => {
      if (vol.id === volId) {
        return {
          ...vol,
          nivelAcreditacion: nuevoNivel
        };
      }
      return vol;
    }));
    if (isSupabaseReady()) {
      try {
        await supabase.from('voluntarios').update({ nivel_acreditacion: nuevoNivel }).eq('id', volId);
      } catch (err) { console.error('Error in updateVoluntarioAcreditacion:', err); }
    }
    addSecurityLog(`PROMOTED_VOLUNTEER_RANK_${volId}_TO_${nuevoNivel}`, currentUser?.email, "INFO");
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
    addSecurityLog(`UPDATE_SOCIO_CATEGORY_${socioId}_TO_${nuevaCategoria}`, currentUser?.email, "INFO");
  };

  const updateSocioCuotaIncorporacion = (id, pagada) => {
    setSociosList(prev => prev.map(s => s.id === id ? { ...s, cuotaIncorporacionPagada: pagada } : s));
  };

  const levantarConvocatoriaEmergencia = async (asunto, mensaje) => {
    const nuevaConvocatoria = {
      activa: true,
      asunto: asunto,
      mensaje: mensaje,
      fechaDespacho: new Date().toISOString()
    };
    setConvocatoriaActiva(nuevaConvocatoria);
    if (isSupabaseReady()) {
      try {
        await supabase.from('parametros_sistema').upsert({ id: 'convocatoria_activa', valor: nuevaConvocatoria });
      } catch (err) { console.error('Error raising emergency:', err); }
    }
    addSecurityLog(`EMERGENCY_CONVOCATORIA_RAISED`, currentUser?.email, "WARN");
  };

  const cerrarConvocatoriaEmergencia = async () => {
    const cerrada = {
      activa: false,
      asunto: '',
      mensaje: '',
      fechaDespacho: ''
    };
    setConvocatoriaActiva(cerrada);
    if (isSupabaseReady()) {
      try {
        await supabase.from('parametros_sistema').upsert({ id: 'convocatoria_activa', valor: cerrada });
      } catch (err) { console.error('Error closing emergency:', err); }
    }
    addSecurityLog(`EMERGENCY_CONVOCATORIA_CLOSED`, currentUser?.email, "INFO");
  };

  const updateSocioPerfil = async (socioId, perfilData) => {
    if (isSupabaseReady()) {
      try {
        const { error } = await supabase
          .from('socios')
          .update({
            email: perfilData.email,
            telefono: perfilData.telefono,
            domicilio: perfilData.domicilio,
            comuna: perfilData.comuna,
            region: perfilData.region,
            fecha_nacimiento: perfilData.fechaNacimiento,
            estado_civil: perfilData.estadoCivil,
            profesion: perfilData.profesion,
            foto_perfil: perfilData.fotoPerfil
          })
          .eq('id', socioId);
        
        if (error) {
          console.error("Error actualizando perfil en Supabase", error);
        }
      } catch (err) {
        console.error("Excepción actualizando perfil", err);
      }
    }

    setSociosList(prev => prev.map(s => {
      if (s.id === socioId || s.email === perfilData.email) {
        const updated = {
          ...s,
          email: perfilData.email || s.email,
          telefono: perfilData.telefono || s.telefono,
          domicilio: perfilData.domicilio || s.domicilio,
          comuna: perfilData.comuna || s.comuna,
          region: perfilData.region || s.region,
          fechaNacimiento: perfilData.fechaNacimiento || s.fechaNacimiento,
          estadoCivil: perfilData.estadoCivil || s.estadoCivil,
          profesion: perfilData.profesion || s.profesion,
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

    addSecurityLog(`UPDATE_SOCIO_PROFILE_${socioId}`, currentUser?.email, "INFO");
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

    addSecurityLog(`UPDATE_DIRECTORIO_CARGO_${cargoKey}_TO_${newSocioId}`, currentUser?.email, "INFO");
  };

  const getDirectorioMember = (cargoKey) => {
    const socioId = directorioCargos[cargoKey];
    return sociosList.find(s => s.id === socioId) || sociosList[0];
  };

  const togglePermisoGestionVoluntariosSocio = async (socioId) => {
    let nuevoPermiso = false;
    setSociosList(prev => prev.map(s => {
      if (s.id === socioId) {
        nuevoPermiso = !s.permisoGestionVoluntarios;
        return { ...s, permisoGestionVoluntarios: nuevoPermiso };
      }
      return s;
    }));
    
    if (isSupabaseReady()) {
      try {
        await supabase
          .from('socios')
          .update({ permiso_gestion_voluntarios: nuevoPermiso })
          .eq('id', socioId);
      } catch (err) {
        console.error("Error updating permiso_gestion_voluntarios in Supabase", err);
      }
    }
    
    addSecurityLog(`TOGGLE_VOLUNTEER_PERMISSION_${socioId}`, currentUser?.email, "INFO");
  };

  const addDonacion = async (donacionData) => {
    const monto = Number(donacionData.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      throw new Error('El monto de la donación debe ser mayor que cero.');
    }
    if (!donacionData.cuentaId && !donacionData.cuenta_id) {
      throw new Error('Selecciona una cuenta pública receptora antes de registrar la donación.');
    }

    let itemWithId;
    if (isSupabaseReady()) {
      const { data, error } = await supabase.from('donaciones').insert([{
        fecha: donacionData.fecha,
        donante: donacionData.donante,
        rut_donante: donacionData.rutDonante || donacionData.rutODocumentoDonante || donacionData.rut_donante || null,
        monto,
        banco: donacionData.banco || null,
        cuenta_id: donacionData.cuentaId || donacionData.cuenta_id || null,
        numero_comprobante: donacionData.numeroComprobante || donacionData.numero_comprobante || null,
        destino_aporte: donacionData.categoria || donacionData.destinoAporte || 'Aporte libre',
        categoria: donacionData.categoria || donacionData.destinoAporte || 'Aporte libre',
        metodo_pago: donacionData.metodoPago || donacionData.metodo_pago || 'Transferencia',
        codigo_transaccion: donacionData.codigoTransaccion || donacionData.codigo_transaccion || null,
        estado: donacionData.estado || 'Confirmada',
        publico: donacionData.publico ?? true
      }]).select().single();

      if (error) throw error;
      itemWithId = {
        ...donacionData,
        id: data.id,
        fecha: data.fecha,
        monto: data.monto,
        donante: data.donante,
        rutDonante: data.rut_donante,
        rutODocumentoDonante: data.rut_donante,
        banco: data.banco,
        cuentaId: data.cuenta_id,
        numeroComprobante: data.numero_comprobante || data.n_comprobante,
        destinoAporte: data.destino_aporte,
        categoria: data.categoria || data.destino_aporte
      };
    } else {
      itemWithId = {
        ...donacionData,
        id: `don-${Date.now()}`,
        monto,
        categoria: donacionData.categoria || donacionData.destinoAporte || 'Aporte libre'
      };
    }

    setDonacionesList(prev => [itemWithId, ...prev]);
    if (donacionData.publico ?? true) setPublicDonationsList(prev => [toPublicDonation(itemWithId), ...prev]);
    addSecurityLog(`ADD_BANK_DONATION_${monto}`, currentUser?.email, "INFO");
    return itemWithId;
  };

  const deleteDonacion = async (id) => {
    if (isSupabaseReady()) {
      const { error } = await supabase.from('donaciones').delete().eq('id', id);
      if (error) throw error;
    }
    setDonacionesList(prev => prev.filter(d => d.id !== id));
    setPublicDonationsList(prev => prev.filter(d => d.id !== id));
    addSecurityLog(`DELETE_DONATION_${id}`, currentUser?.email, "WARN");
  };

  const updateVoluntarioDisponibilidad = async (volId, disponibilidadData) => {
    let newState = {};
    setVoluntariosList(prev => prev.map(vol => {
      if (vol.id === volId) {
        newState = {
          ...vol,
          disponibilidadRespuesta: disponibilidadData.disponibilidadRespuesta,
          recursosPropios: disponibilidadData.recursosPropios,
          laboresQuePuedeRealizar: disponibilidadData.laboresQuePuedeRealizar,
          ultimaActualizacionDisponibilidad: new Date().toISOString()
        };
        return newState;
      }
      return vol;
    }));
    
    if (isSupabaseReady() && newState.id) {
      try {
        await supabase.from('voluntarios').update({
          disponibilidad_respuesta: newState.disponibilidadRespuesta,
          recursos_propios: newState.recursosPropios,
          labores_que_puede_realizar: newState.laboresQuePuedeRealizar,
          ultima_actualizacion_disponibilidad: newState.ultimaActualizacionDisponibilidad
        }).eq('id', volId);
      } catch (err) { console.error('Error in updateVoluntarioDisponibilidad:', err); }
    }
    addSecurityLog(`UPDATE_VOLUNTEER_AVAILABILITY_${volId}`, currentUser?.email, "INFO");
  };

  const addPostulacion = async (postulacionData) => {
    setPostulacionesList(prev => [postulacionData, ...prev]);
    addSecurityLog(`NEW_SOCIO_APPLICATION_${postulacionData.rut}`, postulacionData.email, "INFO");
    if (isSupabaseReady()) {
      try {
        await supabase.from('postulaciones').insert([{
          id: postulacionData.id,
          nombre_completo: postulacionData.nombreCompleto,
          rut: postulacionData.rut,
          email: postulacionData.email,
          telefono: postulacionData.telefono,
          domicilio: postulacionData.domicilio,
          comuna: postulacionData.comuna,
          profesion: postulacionData.profesion,
          razones_integracion: postulacionData.razonesIntegracion,
          aporte_esperado: postulacionData.aporteEsperado,
          fecha_envio: postulacionData.fechaEnvio,
          estado: postulacionData.estado
        }]);
      } catch (err) {
        console.error('Error guardando postulación en Supabase:', err);
      }
    }
  };

  const updatePostulacionEstado = async (id, nuevoEstado, categoriaAsignada = "Socio Activo") => {
    const post = postulacionesList.find(p => p.id === id);
    setPostulacionesList(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));

    // Persistir en Supabase
    if (isSupabaseReady()) {
      try {
        await supabase.from('postulaciones').update({ estado: nuevoEstado }).eq('id', id);
      } catch (err) {
        console.error('Error actualizando estado postulación en Supabase:', err);
      }
    }

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

      // Insertar nuevo socio en Supabase
      if (isSupabaseReady()) {
        try {
          await supabase.from('socios').insert([{
            rut: newSocio.rut,
            nombre: newSocio.nombre,
            profesion: newSocio.profesion,
            categoria: newSocio.categoria,
            voto: newSocio.voto,
            email: newSocio.email,
            region: newSocio.region,
            fecha_ingreso: newSocio.fechaIngreso,
            estado_cuota: newSocio.estadoCuota,
            monto_cuota_mensual: newSocio.montoCuotaMensual,
            cuota_incorporacion_pagada: newSocio.cuotaIncorporacionPagada,
            monto_cuota_incorporacion: newSocio.montoCuotaIncorporacion,
            meses_adeudados: newSocio.mesesAdeudados,
            ultima_cuota_pagada: newSocio.ultimaCuotaPagada,
            permiso_gestion_voluntarios: newSocio.permisoGestionVoluntarios,
            foto_perfil: ''
          }]);
        } catch (err) {
          console.error('Error insertando nuevo socio en Supabase:', err);
        }
      }
    }
  };

  const solicitarRenunciaSocio = async (socioId, motivoRenuncia) => {
    let newState = {};
    setSociosList(prev => prev.map(socio => {
      if (socio.id === socioId) {
        newState = {
          ...socio,
          estadoCuota: 'Solicitud Renuncia Pendiente Directorio',
          motivoRenuncia: motivoRenuncia,
          fechaSolicitudRenuncia: new Date().toISOString().split('T')[0]
        };
        return newState;
      }
      return socio;
    }));
    if (isSupabaseReady() && newState.id) {
      try {
        await supabase.from('socios').update({
          estado_cuota: newState.estadoCuota,
          motivo_renuncia: newState.motivoRenuncia,
          fecha_solicitud_renuncia: newState.fechaSolicitudRenuncia
        }).eq('id', socioId);
      } catch (err) { console.error('Error in solicitarRenunciaSocio:', err); }
    }
  };

  const aprobarRenunciaDirectorio = async (socioId, numeroActaDirectorio) => {
    let newState = {};
    setSociosList(prev => prev.map(socio => {
      if (socio.id === socioId) {
        newState = {
          ...socio,
          estadoCuota: 'Desvinculado / Retiro Aprobado DL 2757',
          fechaRetiroOficial: new Date().toISOString().split('T')[0],
          actaDirectorioAprobacion: numeroActaDirectorio || 'Acta Directorio N° 2025-08',
          email: 'contacto.anonimizado@pruaned.cl',
          telefono: 'Desvinculado ARCO',
          domicilio: 'Anonimizado por Ley 21.719'
        };
        return newState;
      }
      return socio;
    }));
    if (isSupabaseReady() && newState.id) {
      try {
        await supabase.from('socios').update({
          estado_cuota: newState.estadoCuota,
          fecha_retiro_oficial: newState.fechaRetiroOficial,
          acta_directorio_aprobacion: newState.actaDirectorioAprobacion,
          email: newState.email,
          telefono: newState.telefono,
          domicilio: newState.domicilio
        }).eq('id', socioId);
      } catch (err) { console.error('Error in aprobarRenunciaDirectorio:', err); }
    }
  };

  const updateFinancialSettings = async (newCuotaMensual, newCuotaIncorporacion) => {
    const updated = {
      cuotaMensualActual: Number(newCuotaMensual),
      cuotaIncorporacionActual: Number(newCuotaIncorporacion)
    };
    setFinancialSettings(updated);
    if (isSupabaseReady()) {
      try {
        await supabase.from('parametros_sistema').upsert({ id: 'financial_settings', valor: updated });
      } catch (err) { console.error('Error updating financial settings:', err); }
    }
    setSociosList(prev => prev.map(s => {
      if (s.categoria !== 'Socio Honorario') {
        return { ...s, montoCuotaMensual: Number(newCuotaMensual) };
      }
      return s;
    }));
  };

  const addExpense = async (expenseItem) => {
    const monto = Number(expenseItem.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      throw new Error('El monto del egreso debe ser mayor que cero.');
    }

    if (isSupabaseReady()) {
      const dbItem = {
        fecha: expenseItem.fecha,
        tipo_documento: expenseItem.tipoDocumento,
        numero_documento: expenseItem.numeroDocumento,
        proveedor: expenseItem.proveedor,
        categoria: expenseItem.categoria,
        origen_fondo: expenseItem.origenFondo || 'Fondo Cuotas',
        monto,
        glosa: expenseItem.glosa
      };
      const { data, error } = await supabase.from('egresos').insert([dbItem]).select();
      if (error) throw error;
      if (data && data.length > 0) {
        const d = data[0];
        setExpensesList(prev => [...prev, {
          id: d.id, fecha: d.fecha, tipoDocumento: d.tipo_documento, 
          numeroDocumento: d.numero_documento, proveedor: d.proveedor, 
          categoria: d.categoria, origenFondo: d.origen_fondo, 
          monto: d.monto, glosa: d.glosa
        }]);
      }
    } else {
      const itemWithId = { ...expenseItem, monto, id: `exp-${Date.now()}` };
      setExpensesList(prev => [...prev, itemWithId]);
    }
    addSecurityLog(`ADD_EXPENSE_${expenseItem.origenFondo || 'Fondo Cuotas'}_${monto}`, currentUser?.email, "INFO");
  };

  const deleteExpense = async (id) => {
    if (isSupabaseReady()) {
      const { error } = await supabase.from('egresos').delete().eq('id', id);
      if (error) throw error;
    }
    setExpensesList(prev => prev.filter(e => e.id !== id));
  };

  const addFinancialCategory = async (tipo, nombre) => {
    if (!['donacion_ingreso', 'donacion_egreso'].includes(tipo)) {
      throw new Error('Tipo de categoría financiera no válido.');
    }

    const safeName = nombre.trim().replace(/\s+/g, ' ');
    if (safeName.length < 2) throw new Error('Ingresa un nombre de categoría válido.');
    if (financialCategories.some(category => (
      category.tipo === tipo && category.nombre.trim().toLocaleLowerCase('es-CL') === safeName.toLocaleLowerCase('es-CL')
    ))) {
      throw new Error('Esa categoría ya existe.');
    }

    let category;
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('categorias_financieras')
        .insert({ tipo, nombre: safeName })
        .select()
        .single();
      if (error) throw error;
      category = { id: data.id, tipo: data.tipo, nombre: data.nombre, activo: data.activo };
    } else {
      category = { id: `offline-finance-category-${Date.now()}`, tipo, nombre: safeName, activo: true };
    }

    setFinancialCategories(prev => [...prev, category].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
    addSecurityLog(`ADD_FINANCIAL_CATEGORY_${tipo}`, currentUser?.email, 'INFO');
    return category;
  };

  const archiveFinancialCategory = async (id) => {
    if (isSupabaseReady()) {
      const { error } = await supabase
        .from('categorias_financieras')
        .update({ activo: false })
        .eq('id', id);
      if (error) throw error;
    }
    setFinancialCategories(prev => prev.map(category => (
      category.id === id ? { ...category, activo: false } : category
    )));
    addSecurityLog('ARCHIVE_FINANCIAL_CATEGORY', currentUser?.email, 'WARN');
  };

  const addFinancialAccount = async (accountData) => {
    const nombre = accountData.nombre?.trim().replace(/\s+/g, ' ');
    const banco = accountData.banco?.trim().replace(/\s+/g, ' ');
    const tipoCuenta = accountData.tipoCuenta?.trim();
    const numeroCuenta = accountData.numeroCuenta?.trim().replace(/\s+/g, ' ');
    const titular = accountData.titular?.trim().replace(/\s+/g, ' ');

    if (!nombre || !banco || !tipoCuenta || !numeroCuenta || !titular) {
      throw new Error('Completa nombre público, banco, tipo, número y titular de la cuenta.');
    }

    let account;
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('cuentas_financieras')
        .insert({
          nombre,
          banco,
          tipo_cuenta: tipoCuenta,
          numero_cuenta: numeroCuenta,
          titular,
          publicada: true,
          activa: true
        })
        .select()
        .single();
      if (error) throw error;
      account = {
        id: data.id,
        nombre: data.nombre,
        banco: data.banco,
        tipoCuenta: data.tipo_cuenta,
        numeroCuenta: data.numero_cuenta,
        titular: data.titular,
        publicada: data.publicada,
        activa: data.activa
      };
    } else {
      account = {
        id: `offline-financial-account-${Date.now()}`,
        nombre,
        banco,
        tipoCuenta,
        numeroCuenta,
        titular,
        publicada: true,
        activa: true
      };
    }

    setFinancialAccounts(previous => [...previous, account].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
    addSecurityLog('ADD_PUBLIC_FINANCIAL_ACCOUNT', currentUser?.email, 'INFO');
    return account;
  };

  const removeFinancialAccount = async (id) => {
    if (isSupabaseReady()) {
      const { error } = await supabase
        .from('cuentas_financieras')
        .update({ activa: false, publicada: false })
        .eq('id', id);
      if (error) throw error;
    }
    setFinancialAccounts(previous => previous.filter(account => account.id !== id));
    addSecurityLog('REMOVE_PUBLIC_FINANCIAL_ACCOUNT', currentUser?.email, 'WARN');
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

  const addNews = async (newsItem) => {
    const itemWithId = { ...newsItem, id: `n-${Date.now()}` };
    setNewsList(prev => [itemWithId, ...prev]);
    if (isSupabaseReady()) {
      try {
        await supabase.from('noticias').insert([{
          id: itemWithId.id,
          titulo: newsItem.titulo,
          contenido: newsItem.contenido,
          fecha_publicacion: newsItem.fechaPublicacion || newsItem.fecha_publicacion,
          autor: newsItem.autor,
          categoria: newsItem.categoria,
          imagen_url: newsItem.imagenUrl || newsItem.imagen_url
        }]);
      } catch (err) { console.error('Error addNews Supabase:', err); }
    }
  };

  const deleteNews = async (id) => {
    setNewsList(prev => prev.filter(n => n.id !== id));
    if (isSupabaseReady()) {
      try {
        await supabase.from('noticias').delete().eq('id', id);
      } catch (err) { console.error('Error deleteNews Supabase:', err); }
    }
  };

  const addDocCategory = async (categoryName) => {
    const cat = categoryName.trim();
    if (!docCategories.includes(cat)) {
      let newState = [];
      setDocCategories(prev => {
        newState = [...prev, cat];
        return newState;
      });
      if (isSupabaseReady()) {
        try {
          await supabase.from('parametros_sistema').upsert({ id: 'doc_categories', valor: newState });
        } catch (err) { console.error('Error addDocCategory:', err); }
      }
    }
  };

  const deleteDocCategory = async (categoryName) => {
    let newState = [];
    setDocCategories(prev => {
      newState = prev.filter(c => c !== categoryName);
      return newState;
    });
    if (isSupabaseReady()) {
      try {
        await supabase.from('parametros_sistema').upsert({ id: 'doc_categories', valor: newState });
      } catch (err) { console.error('Error deleteDocCategory:', err); }
    }
  };

  const addDocument = async (docItem) => {
    const itemWithId = { ...docItem, id: `doc-${Date.now()}` };
    setDocumentsList(prev => [itemWithId, ...prev]);
    if (isSupabaseReady()) {
      try {
        await supabase.from('documentos').insert([{
          id: itemWithId.id,
          titulo: docItem.titulo,
          categoria: docItem.categoria,
          fecha_subida: docItem.fechaSubida || docItem.fecha_subida,
          url: docItem.url,
          privado: docItem.privado
        }]);
      } catch (err) { console.error('Error addDocument Supabase:', err); }
    }
  };

  const deleteDocument = async (id) => {
    setDocumentsList(prev => prev.filter(d => d.id !== id));
    if (isSupabaseReady()) {
      try {
        await supabase.from('documentos').delete().eq('id', id);
      } catch (err) { console.error('Error deleteDocument Supabase:', err); }
    }
  };

  const updateVolunteerCert = async (volId, courseId) => {
    let newState = {};
    setVoluntariosList(prev => prev.map(vol => {
      if (vol.id === volId) {
        const cursos = vol.cursosAprobados.includes(courseId) ? vol.cursosAprobados : [...vol.cursosAprobados, courseId];
        newState = {
          ...vol,
          cursosAprobados: cursos,
          horasAcumuladas: vol.horasAcumuladas + 10
        };
        return newState;
      }
      return vol;
    }));
    if (isSupabaseReady() && newState.id) {
      try {
        await supabase.from('voluntarios').update({
          cursos_aprobados: newState.cursosAprobados,
          horas_acumuladas: newState.horasAcumuladas
        }).eq('id', volId);
      } catch (err) { console.error('Error in updateVolunteerCert:', err); }
    }
  };

  const completeLmsModule = async (moduleId, courseId) => {
    if (!moduleId || !courseId) throw new Error('Módulo inválido');

    if (!supabaseReady) {
      const completedAt = new Date().toISOString();
      setLmsModuleProgress((previous) => previous.some((progress) => progress.moduleId === moduleId && progress.userId === lmsProfile?.userId)
        ? previous
        : [...previous, { userId: lmsProfile?.userId || null, moduleId, completedAt }]);
      return { courseId, moduleId, courseStatus: 'en_progreso' };
    }

    const { data, error } = await supabase.rpc('lms_complete_module', { p_module_id: moduleId });
    if (error) throw error;
    const update = Array.isArray(data) ? data[0] : data;
    const completedAt = new Date().toISOString();
    setLmsModuleProgress((previous) => previous.some((progress) => progress.moduleId === moduleId && progress.userId === lmsProfile?.userId)
      ? previous
      : [...previous, { userId: lmsProfile?.userId || null, moduleId, completedAt }]);
    if (update?.course_status) {
      setLmsResults((previous) => {
        const nextResult = {
          userId: lmsProfile?.userId || null,
          courseId,
          status: update.course_status,
          score: previous.find((result) => result.courseId === courseId && result.userId === lmsProfile?.userId)?.score ?? null,
          attempts: previous.find((result) => result.courseId === courseId && result.userId === lmsProfile?.userId)?.attempts || 0,
          completedAt: update.course_status === 'aprobado' ? completedAt : null
        };
        return [...previous.filter((result) => result.courseId !== courseId || result.userId !== lmsProfile?.userId), nextResult];
      });
    }
    return update;
  };

  const getLmsAssessment = async (courseId) => {
    if (!supabaseReady) {
      const course = coursesList.find((item) => item.id === courseId);
      return (course?.examQuestions || []).map((question, index) => ({
        id: `${courseId}-question-${index}`,
        prompt: question.q,
        options: question.options,
        position: index
      }));
    }

    const { data, error } = await supabase.rpc('lms_get_assessment', { p_course_id: courseId });
    if (error) throw error;
    return (data || []).map((question) => ({
      ...question,
      position: question.question_position
    }));
  };

  const submitLmsAssessment = async (courseId, answers) => {
    if (!supabaseReady) {
      const course = coursesList.find((item) => item.id === courseId);
      const questions = course?.examQuestions || [];
      if (!questions.length) throw new Error('Este curso no tiene evaluación publicada');
      const correct = questions.filter((question, index) => Number(answers[`${courseId}-question-${index}`]) === question.correct).length;
      const score = Math.round((correct / questions.length) * 10000) / 100;
      const status = score >= 70 ? 'aprobado' : 'reprobado';
      const completedAt = status === 'aprobado' ? new Date().toISOString() : null;
      setLmsResults((previous) => {
        const oldResult = previous.find((result) => result.courseId === courseId && result.userId === lmsProfile?.userId);
        const nextResult = {
          userId: lmsProfile?.userId || null,
          courseId,
          status,
          score,
          attempts: (oldResult?.attempts || 0) + 1,
          completedAt,
          lastAttemptAt: new Date().toISOString()
        };
        return [...previous.filter((result) => result.courseId !== courseId || result.userId !== lmsProfile?.userId), nextResult];
      });
      return { status, score, attempts: 1, completed_at: completedAt };
    }

    const { data, error } = await supabase.rpc('lms_submit_assessment', {
      p_course_id: courseId,
      p_answers: answers
    });
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    setLmsResults((previous) => {
      const nextResult = {
        userId: lmsProfile?.userId || null,
        courseId,
        status: result.status,
        score: result.score,
        attempts: result.attempts,
        completedAt: result.completed_at,
        lastAttemptAt: new Date().toISOString()
      };
      return [...previous.filter((item) => item.courseId !== courseId || item.userId !== lmsProfile?.userId), nextResult];
    });
    return result;
  };

  const lmsCourses = attachCourseModules(coursesList, lmsModules);

  return (
    <AuthContext.Provider value={{
      currentUser,
      loginStep1_RequestOTP,
      loginStep2_VerifyOTP,
      resetPasswordRequest,
      updatePassword,
      logout,
      is2FAVerified,
      isAuthRestoring,
      setIs2FAVerified,
      activeTab,
      setActiveTab,
      // Firmas Digitales
      firmasOficiales,
      updateFirmaOficial,
      // LMS Management
      addCourse,
      deleteCourse,
      getLmsCourseEditor,
      saveLmsCourseBundle,
      archiveLmsCourse,
      restoreLmsCourse,
      refreshLmsData,
      lmsProfile,
      lmsParticipants,
      lmsCourses,
      lmsModules,
      lmsResults,
      lmsModuleProgress,
      isLmsLoading,
      isLmsManager,
      completeLmsModule,
      getLmsAssessment,
      submitLmsAssessment,
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
      publicDonationsList,
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
      financialCategories,
      addFinancialCategory,
      archiveFinancialCategory,
      financialAccounts,
      addFinancialAccount,
      removeFinancialAccount,
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
