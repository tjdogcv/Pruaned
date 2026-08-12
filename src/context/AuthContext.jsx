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
  INITIAL_EXPENSES
} from '../data/initialData';
import { logSecurityEvent } from '../utils/security';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [is2FAVerified, setIs2FAVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Postulaciones Nuevos Socios State
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
        autorizacionDatos: "Sí"
      }
    ];
  });

  const [financialSettings, setFinancialSettings] = useState(() => {
    const saved = localStorage.getItem('pruaned_financial_settings');
    return saved ? JSON.parse(saved) : INITIAL_FINANCIAL_SETTINGS;
  });

  const [expensesList, setExpensesList] = useState(() => {
    const saved = localStorage.getItem('pruaned_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

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

  const [securityLogs, setSecurityLogs] = useState(() => {
    const saved = localStorage.getItem('pruaned_security_logs');
    return saved ? JSON.parse(saved) : INITIAL_SECURITY_LOGS;
  });

  // Sync localStorage
  useEffect(() => {
    localStorage.setItem('pruaned_postulaciones', JSON.stringify(postulacionesList));
  }, [postulacionesList]);

  useEffect(() => {
    localStorage.setItem('pruaned_financial_settings', JSON.stringify(financialSettings));
  }, [financialSettings]);

  useEffect(() => {
    localStorage.setItem('pruaned_expenses', JSON.stringify(expensesList));
  }, [expensesList]);

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
    localStorage.setItem('pruaned_security_logs', JSON.stringify(securityLogs));
  }, [securityLogs]);

  // Handlers
  const login = (userData) => {
    setCurrentUser(userData);
    setIs2FAVerified(true);
    setSecurityLogs(prev => logSecurityEvent(prev, `AUTH_SUCCESS_ROLE_${userData.role.toUpperCase()}`, userData.email, "INFO"));
  };

  const logout = () => {
    if (currentUser) {
      setSecurityLogs(prev => logSecurityEvent(prev, "USER_LOGOUT", currentUser.email, "INFO"));
    }
    setCurrentUser(null);
    setIs2FAVerified(false);
    setActiveTab('home');
  };

  // Postulaciones Handler
  const addPostulacion = (postulacionData) => {
    setPostulacionesList(prev => [postulacionData, ...prev]);
    setSecurityLogs(prev => logSecurityEvent(prev, `NEW_SOCIO_APPLICATION_${postulacionData.rut}`, postulacionData.email, "INFO"));
  };

  const updatePostulacionEstado = (id, nuevoEstado, categoriaAsignada = "Socio Activo") => {
    const post = postulacionesList.find(p => p.id === id);
    setPostulacionesList(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));

    if (nuevoEstado === 'Aceptada / Incorporado' && post) {
      // Create official Socio
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
        estadoCuota: 'En Mora', // Pendiente primera cuotas e incorporación
        montoCuotaMensual: financialSettings.cuotaMensualActual,
        cuotaIncorporacionPagada: false,
        montoCuotaIncorporacion: financialSettings.cuotaIncorporacionActual,
        mesesAdeudados: 1,
        ultimaCuotaPagada: 'Pendiente Pago Incorporación',
        historialPagos: []
      };
      setSociosList(prev => [newSocio, ...prev]);
      setSecurityLogs(prev => logSecurityEvent(prev, `SOCIO_APPLICATION_APPROVED_${post.rut}`, currentUser?.email, "INFO"));
    }
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

  const addExpense = (expenseItem) => {
    const itemWithId = { ...expenseItem, id: `exp-${Date.now()}` };
    setExpensesList(prev => [itemWithId, ...prev]);
  };

  const deleteExpense = (id) => {
    setExpensesList(prev => prev.filter(e => e.id !== id));
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
      login,
      logout,
      is2FAVerified,
      setIs2FAVerified,
      activeTab,
      setActiveTab,
      postulacionesList,
      addPostulacion,
      updatePostulacionEstado,
      financialSettings,
      updateFinancialSettings,
      expensesList,
      addExpense,
      deleteExpense,
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
      coursesList,
      securityLogs
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
