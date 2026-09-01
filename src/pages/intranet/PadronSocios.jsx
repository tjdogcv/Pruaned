import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PrivacyDataPolicy } from '../../components/PrivacyDataPolicy';
import { TarifarioEditor } from '../../components/TarifarioEditor';
import { FondoDonacionesPanel } from '../../components/FondoDonacionesPanel';
import { sendPagoEmail, sendPagoValidadoEmail, sendApprovalEmail, sendRejectionEmail } from '../../lib/emailConfig';
import { compressImage } from '../../lib/imageCompression';
import { 
  Users, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Download, 
  Search, 
  FileText, 
  Receipt, 
  PlusCircle, 
  Trash2, 
  Settings, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  UserPlus,
  Eye,
  Check,
  UserX,
  ShieldCheck,
  Scale,
  FileCheck2,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  User,
  Camera,
  Upload,
  Save,
  Mail,
  Phone,
  MapPin,
  Award,
  Crown,
  PenTool,
  ClipboardList,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Shield
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   AuditoriaPanel — Registro de auditoría institucional
───────────────────────────────────────────────────────────── */
const SEVERITY_CFG = {
  INFO:  { color: 'bg-blue-100 text-blue-800 border-blue-200',    dot: 'bg-blue-500',   label: 'Info' },
  WARN:  { color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500',  label: 'Alerta' },
  ERROR: { color: 'bg-rose-100 text-rose-800 border-rose-200',    dot: 'bg-rose-500',   label: 'Error' },
};

const QUOTA_EXPENSE_CATEGORIES = [
  'Insumos Médicos Veterinarios',
  'Logística Terreno & Combustible',
  'Albergues Temporales & Alimentación',
  'Capacitaciones & Materiales',
  'Gastos Administrativos'
];

const AuditoriaPanel = ({ securityLogs = [] }) => {
  const [auditSearch, setAuditSearch] = useState('');
  const [auditSeverity, setAuditSeverity] = useState('TODAS');
  const [auditUser, setAuditUser] = useState('TODOS');

  const uniqueUsers = [...new Set(securityLogs.map(l => l.user))].sort();

  const filteredLogs = securityLogs.filter(log => {
    const matchSearch = auditSearch.trim() === '' ||
      (log.label || log.event).toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.date.includes(auditSearch);
    const matchSeverity = auditSeverity === 'TODAS' || log.severity === auditSeverity;
    const matchUser = auditUser === 'TODOS' || log.user === auditUser;
    return matchSearch && matchSeverity && matchUser;
  });

  const handleExportCSV = () => {
    const headers = 'Fecha/Hora,Usuario,Acción,Código Técnico,Severidad\n';
    const rows = filteredLogs.map(l =>
      `"${l.date}","${l.user}","${l.label || l.event}","${l.event}","${l.severity}"`
    ).join('\n');
    const el = document.createElement('a');
    el.href = URL.createObjectURL(new Blob([headers + rows], { type: 'text/csv;charset=utf-8' }));
    el.download = `Auditoria_PRUANED_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(el); el.click(); document.body.removeChild(el);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div>
            <span className="px-2.5 py-0.5 bg-violet-100 text-violet-900 font-bold text-[10px] rounded-full uppercase">
              Trazabilidad de Cambios
            </span>
            <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] mt-1 flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-700" />
              Registro de Auditoría Institucional
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historial completo de acciones — quién hizo cada cambio y cuándo.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-violet-900 hover:bg-violet-800 text-white text-xs font-bold rounded-xl shadow transition-colors flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar acción, usuario o fecha..."
              value={auditSearch}
              onChange={e => setAuditSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-violet-400"
            />
          </div>
          <select
            value={auditSeverity}
            onChange={e => setAuditSeverity(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 font-semibold outline-none"
          >
            <option value="TODAS">Todas las severidades</option>
            <option value="INFO">Info</option>
            <option value="WARN">Alerta</option>
            <option value="ERROR">Error</option>
          </select>
          <select
            value={auditUser}
            onChange={e => setAuditUser(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 font-semibold outline-none max-w-[220px]"
          >
            <option value="TODOS">Todos los usuarios</option>
            {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <span className="text-[11px] text-slate-400 font-mono ml-auto">
            {filteredLogs.length} / {securityLogs.length} eventos
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{sev:'INFO',label:'Operaciones',icon:'🔵'},{sev:'WARN',label:'Alertas',icon:'🟡'},{sev:'ERROR',label:'Errores',icon:'🔴'}].map(({sev,label,icon}) => (
          <div key={sev} className={`p-4 rounded-2xl border text-xs font-bold ${SEVERITY_CFG[sev]?.color}`}>
            <div className="text-lg mb-1">{icon}</div>
            <div className="text-2xl font-extrabold font-['Outfit']">{securityLogs.filter(l => l.severity === sev).length}</div>
            <div className="opacity-70">{label}</div>
          </div>
        ))}
        <div className="p-4 rounded-2xl border text-xs font-bold bg-slate-100 text-slate-800 border-slate-200">
          <div className="text-lg mb-1">📋</div>
          <div className="text-2xl font-extrabold font-['Outfit']">{securityLogs.length}</div>
          <div className="opacity-70">Total registros</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Fecha / Hora</th>
                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Acción</th>
                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Severidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400 italic">
                    No se encontraron eventos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const cfg = SEVERITY_CFG[log.severity] || SEVERITY_CFG.INFO;
                  return (
                    <tr key={log.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{log.date}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 truncate max-w-[200px]">{log.user}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{log.label || log.event}</div>
                        {log.label && log.event !== log.label && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{log.event}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredLogs.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Mostrando {filteredLogs.length} evento{filteredLogs.length !== 1 ? 's' : ''}</span>
            <span>Los registros se sincronizan con el historial de auditoría institucional.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function PadronSocios({ initialTab, section = 'socios' }) {
  const { 
    sociosList, 
    updateSocioCuota, 
    updateSocioCategoria,
    updateSocioCuotaIncorporacion,
    financialSettings, 
    updateFinancialSettings,
    expensesList, 
    addExpense, 
    deleteExpense, 
    financialCategories = [],
    postulacionesList,
    updatePostulacionEstado,
    solicitarRenunciaSocio,
    aprobarRenunciaDirectorio,
    togglePermisoGestionVoluntariosSocio,
    updateSocioPerfil,
    directorioCargos,
    updateDirectorioCargo,
    getDirectorioMember,
    firmasOficiales,
    updateFirmaOficial,
    canManageCategoriesAndCargos,
    isMasterUser,
    isDirectiva,
    canManageFinances,
    currentUser,
    securityLogs,
    cobrosList = [],
    addCobrosBatch = () => {}
  } = useAuth();

  const [activeTabLocal, setActiveTabLocal] = useState('padron');

  useEffect(() => {
    if (initialTab != null) setActiveTabLocal(initialTab);
  }, [initialTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('TODOS');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [showHistorico, setShowHistorico] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedEstado, selectedCategory]);

  const currentSocio = isMasterUser 
    ? { nombre: 'Administrador Maestro', email: 'ag.pruaned@gmail.com', rut: 'ADMIN-0', categoria: 'Sistema', profesion: 'Soporte Gremial', fotoPerfil: '' } 
    : (sociosList.find(s => s.email === currentUser?.email) || {});

  const [editEmail, setEditEmail] = useState(currentSocio?.email || currentUser?.email || '');
  const [editTelefono, setEditTelefono] = useState(currentSocio?.telefono || '');
  const [editDomicilio, setEditDomicilio] = useState(currentSocio?.domicilio || '');
  const [editComuna, setEditComuna] = useState(currentSocio?.comuna || '');
  const [editRegion, setEditRegion] = useState(currentSocio?.region || '');
  const [editFechaNacimiento, setEditFechaNacimiento] = useState(currentSocio?.fechaNacimiento || '');
  const [editEstadoCivil, setEditEstadoCivil] = useState(currentSocio?.estadoCivil || '');
  const [editProfesion, setEditProfesion] = useState(currentSocio?.profesion || '');
  const [editFotoPerfil, setEditFotoPerfil] = useState(currentSocio?.fotoPerfil || '');

  const [activePaymentModal, setActivePaymentModal] = useState(null);
  const [activePostulacionModal, setActivePostulacionModal] = useState(null);
  const [activeSocioModal, setActiveSocioModal] = useState(null);
  const [postFilter, setPostFilter] = useState('pendientes');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [comprobanteInput, setComprobanteInput] = useState('');

  // --- Estado modales de renuncia ---
  const [activeApproveRenunciaModal, setActiveApproveRenunciaModal] = useState(null);
  const [activeRequestRenunciaModal, setActiveRequestRenunciaModal] = useState(null);
  const [acuerdoNumero, setAcuerdoNumero] = useState('');
  const [motivoRenunciaInput, setMotivoRenunciaInput] = useState('');
  // Renuncia retroactiva (directiva registra renuncias ocurridas antes del sistema)
  const [showRetroactiveForm, setShowRetroactiveForm] = useState(false);
  const [retroSocioId, setRetroSocioId] = useState('');
  const [retroFechaSolicitud, setRetroFechaSolicitud] = useState('');
  const [retroFechaRetiro, setRetroFechaRetiro] = useState('');
  const [retroMotivo, setRetroMotivo] = useState('');
  const [retroActa, setRetroActa] = useState('');
  const [isRetroSaving, setIsRetroSaving] = useState(false);

  const handleRetroactiveRenuncia = async (e) => {
    e.preventDefault();
    if (!retroSocioId || !retroFechaRetiro || !retroActa) {
      alert('Socio, Fecha de Retiro y Número de Acta son obligatorios.');
      return;
    }
    setIsRetroSaving(true);
    try {
      await solicitarRenunciaSocio(retroSocioId, retroMotivo || 'Renuncia presentada con anterioridad a la implementación del sistema digital PRUANED.');
      await aprobarRenunciaDirectorio(retroSocioId, retroActa);
      alert('✓ Renuncia retroactiva registrada. El socio quedó como Desvinculado.');
      setShowRetroactiveForm(false);
      setRetroSocioId(''); setRetroFechaSolicitud(''); setRetroFechaRetiro('');
      setRetroMotivo(''); setRetroActa('');
    } catch (err) {
      alert('Error al registrar: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsRetroSaving(false);
    }
  };

  const handleApproveRenuncia = async (e) => {
    e.preventDefault();
    if (!acuerdoNumero) { alert('Debe indicar el número de Acta del Directorio.'); return; }
    try {
      await aprobarRenunciaDirectorio(activeApproveRenunciaModal.id, acuerdoNumero);
      setActiveApproveRenunciaModal(null);
      setAcuerdoNumero('');
      alert('Retiro aprobado. El socio quedó como Desvinculado conforme al DL 2.757.');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleRequestRenuncia = async (e) => {
    e.preventDefault();
    if (!motivoRenunciaInput.trim()) { alert('Por favor indica el motivo de la renuncia.'); return; }
    try {
      await solicitarRenunciaSocio(activeRequestRenunciaModal.id, motivoRenunciaInput.trim());
      setActiveRequestRenunciaModal(null);
      setMotivoRenunciaInput('');
      alert('Solicitud de renuncia enviada al Directorio.');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

      const [isCuotaIncorporacionCheck, setIsCuotaIncorporacionCheck] = useState(false);

  useEffect(() => {
    if (!activePaymentModal) return undefined;
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      setActivePaymentModal(null);
      
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [activePaymentModal]);

  const presidente = getDirectorioMember('presidenteId');
  const vicepresidente = getDirectorioMember('vicepresidenteId');
  const secretario = getDirectorioMember('secretarioId');
  const tesorero = getDirectorioMember('tesoreroId');

  const [newExpense, setNewExpense] = useState({
    tipoDocumento: 'Factura',
    numeroDocumento: '',
    proveedor: '',
    monto: '',
    origenFondo: 'Fondo Cuotas',
    categoria: 'Insumos Médicos Veterinarios',
    glosa: ''
  });

  const [newCobro, setNewCobro] = useState({
    tipoCobro: 'Cuota Mensual', // 'Cuota Mensual' | 'Cobro Extraordinario'
    titulo: '',
    monto: '',
    asignacion: 'A todos',
    socioId: '',
    mesesAGenerar: 1
  });

  const donationExpenseCategories = financialCategories
    .filter(category => category.tipo === 'donacion_egreso' && category.activo)
    .map(category => category.nombre);
  const availableExpenseCategories = newExpense.origenFondo === 'Fondo Donaciones'
    ? donationExpenseCategories
    : QUOTA_EXPENSE_CATEGORIES;

  useEffect(() => {
    if (availableExpenseCategories.length && !availableExpenseCategories.includes(newExpense.categoria)) {
      setNewExpense(previous => ({ ...previous, categoria: availableExpenseCategories[0] }));
    }
  }, [newExpense.origenFondo, financialCategories]);

  const postulacionesPendientes = postulacionesList.filter(p => p.estado === 'Pendiente Revisión Directorio').length;
  const renunciasPendientes = sociosList.filter(s => s.estadoCuota === 'Solicitud Renuncia Pendiente Directorio').length;
  const sectionMeta = {
    socios: {
      eyebrow: 'Área personal',
      title: 'Mi cuenta y padrón',
      description: 'Actualiza tu ficha, consulta el padrón y revisa tus solicitudes.'
    },
    directorio: {
      eyebrow: 'Directorio nacional',
      title: 'Cargos y firmas',
      description: 'Gestiona la representación institucional y sus firmas oficiales.'
    },
    finanzas: {
      eyebrow: 'Administración financiera',
      title: 'Finanzas',
      description: 'Consulta el balance y administra cobros, egresos y postulaciones.'
    },
    auditoria: {
      eyebrow: 'Control institucional',
      title: 'Registro de auditoría',
      description: 'Revisa la actividad relevante de la intranet.'
    }
  }[section] || {
    eyebrow: 'Intranet',
    title: 'Gestión de socios',
    description: 'Administra la información gremial.'
  };
  const contextualTabs = {
    socios: [
      { id: 'mi-cuenta', label: 'Mi cuenta', icon: User },
      { id: 'padron', label: 'Padrón y cuotas', icon: Users },
      { id: 'renuncias', label: canManageFinances ? 'Renuncias' : 'Mi renuncia', icon: UserX, badge: canManageFinances ? renunciasPendientes : null }
    ],
    directorio: canManageCategoriesAndCargos ? [
      { id: 'directorio-gestion', label: 'Cargos y firmas', icon: ClipboardList }
    ] : [],
    finanzas: canManageFinances ? [
      { id: 'balance', label: 'Balance', icon: PieChart },
      { id: 'donaciones', label: 'Fondo donaciones', icon: DollarSign },
      { id: 'egresos', label: 'Egresos', icon: Receipt },
      { id: 'cobros-especiales', label: 'Cobros', icon: Wallet },
      { id: 'postulaciones', label: 'Postulaciones', icon: UserPlus, badge: postulacionesPendientes },
      { id: 'renuncias', label: 'Renuncias', icon: UserX, badge: renunciasPendientes }
    ] : [],
    auditoria: (isMasterUser || isDirectiva) ? [
      { id: 'auditoria', label: 'Actividad institucional', icon: ClipboardList }
    ] : []
  }[section] || [];

  const totalIngresos = sociosList.reduce((acc, socio) => {
    const pagosSocio = (socio.historialPagos || []).reduce((pAcc, p) => pAcc + (p.monto || 0), 0);
    return acc + pagosSocio;
  }, 0);

  const totalEgresos = expensesList.reduce((acc, exp) => acc + Number(exp.monto || 0), 0);
  const saldoCaja = totalIngresos - totalEgresos;

  const filteredSocios = sociosList.filter(s => {
    // Ocultar cuenta de sistema
    if (s.email === 'ag.pruaned@gmail.com') return false;

    const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.rut.includes(searchTerm) ||
                          (s.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = selectedEstado === 'TODOS' || s.estadoCuota === selectedEstado;
    const matchesCat = selectedCategory === 'TODAS' || s.categoria === selectedCategory;
    return matchesSearch && matchesEstado && matchesCat;
  });

  const totalPages = Math.max(1, Math.ceil(filteredSocios.length / itemsPerPage));
  const paginatedSocios = filteredSocios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFileUploadFoto = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 400, 0.7);
        setEditFotoPerfil(compressedBase64);
      } catch (err) {
        console.error('Error compressing profile photo', err);
        alert('Hubo un error al procesar la imagen.');
      }
    }
  };

  const handleFileUploadFirma = async (cargoKey, e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 600, 0.8);
        updateFirmaOficial(cargoKey, compressedBase64);
        alert(`¡Firma digitalizada de ${cargoKey === 'presidenteFirma' ? 'Presidente' : 'Secretario'} actualizada en certificados y documentos!`);
      } catch (err) {
        console.error('Error compressing signature', err);
        alert('Hubo un error al procesar la firma.');
      }
    }
  };
  const handleExportarDatosARCO = () => {
    const dataARCO = {
      timestamp_descarga: new Date().toISOString(),
      entidad: 'PRUANED A.G.',
      derechos_arco: 'Derecho de Acceso y Portabilidad (Ley 19.628)',
      socio: currentSocio
    };
    const blob = new Blob([JSON.stringify(dataARCO, null, 2)], { type: 'application/json' });
    const el = document.createElement('a');
    el.href = URL.createObjectURL(blob);
    el.download = `PRUANED_Datos_ARCO_${currentSocio.rut}.json`;
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
    alert('Se ha descargado un archivo JSON con toda tu información en cumplimiento de la Ley 19.628.');
  };

  const handleSaveMiCuentaSubmit = (e) => {
    e.preventDefault();
    updateSocioPerfil(currentSocio.id, {
      email: editEmail.trim(),
      telefono: editTelefono.trim(),
      domicilio: editDomicilio.trim(),
      comuna: editComuna.trim(),
      region: editRegion.trim(),
      fechaNacimiento: editFechaNacimiento,
      estadoCivil: editEstadoCivil.trim(),
      profesion: editProfesion.trim(),
      fotoPerfil: editFotoPerfil
    });
    alert('¡Tus datos de contacto y perfil han sido actualizados!');
  };

  const handleRegisterPayment = (e) => {
    e.preventDefault();
    if (activePaymentModal && canManageFinances) {
      const remainingMonthlyDebt = Math.max(0, Number(activePaymentModal.mesesAdeudados || 0) - 1);
      const nextEstado = isCuotaIncorporacionCheck
        ? activePaymentModal.estadoCuota
        : remainingMonthlyDebt > 0 ? 'En Mora' : 'Al Día';
      updateSocioCuota(
        activePaymentModal.id, 
        nextEstado,
        comprobanteInput.trim() || 'Validado por Tesorería',
        false, 
        isCuotaIncorporacionCheck
      );
      
      const pagoData = {
        monto: isCuotaIncorporacionCheck ? (activePaymentModal.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual) : (activePaymentModal.montoCuotaMensual || financialSettings.cuotaMensualActual),
        referencia: comprobanteInput.trim() || 'Validado por Tesorería'
      };
      sendPagoEmail(pagoData, activePaymentModal);
      sendPagoValidadoEmail(activePaymentModal, pagoData.monto);

      setActivePaymentModal(null);
      setComprobanteInput('');
      setIsCuotaIncorporacionCheck(false);
    }
  };

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (newExpense.numeroDocumento && newExpense.monto && newExpense.categoria) {
      try {
        await addExpense({
        ...newExpense,
        monto: Number(newExpense.monto),
        fecha: new Date().toISOString().split('T')[0]
      });
        setNewExpense({
          tipoDocumento: 'Factura',
          numeroDocumento: '',
          proveedor: '',
          monto: '',
          origenFondo: 'Fondo Cuotas',
          categoria: QUOTA_EXPENSE_CATEGORIES[0],
          glosa: ''
        });
      } catch (error) {
        alert(error.message || 'No fue posible registrar el egreso. Verifica la migración financiera y tu permiso.');
      }
    }
  };

  const handleAddCobroEspecial = (e) => {
    e.preventDefault();
    if (newCobro.titulo && (newCobro.monto || newCobro.tipoCobro === 'Cuota Mensual')) {
      let arrayToBatch = [];
      const numMeses = newCobro.tipoCobro === 'Cuota Mensual' ? parseInt(newCobro.mesesAGenerar || 1, 10) : 1;
      
      const generateForSocio = (s) => {
        let cobrosSocio = [];
        for (let i = 0; i < numMeses; i++) {
          const montoCalculado = newCobro.tipoCobro === 'Cuota Mensual' 
            ? (financialSettings.cuotasPorCategoria?.[s.categoria] ?? financialSettings.cuotaMensualActual) 
            : Number(newCobro.monto);
            
          const suffix = numMeses > 1 ? ` (${i + 1}/${numMeses})` : '';
          
          cobrosSocio.push({
            socioId: s.id,
            titulo: `${newCobro.titulo}${suffix}`,
            monto: montoCalculado,
            fecha: new Date().toISOString().split('T')[0],
            pagado: false
          });
        }
        return cobrosSocio;
      };

      if (newCobro.asignacion === 'A todos') {
        const sociosActivos = sociosList.filter(s => s.estadoCuota !== 'Exento' && !s.estadoCuota.includes('Desvinculado') && s.email !== 'ag.pruaned@gmail.com');
        sociosActivos.forEach(s => {
          arrayToBatch = arrayToBatch.concat(generateForSocio(s));
        });
      } else if (newCobro.socioId) {
        const socio = sociosList.find(s => s.id === newCobro.socioId);
        if (socio) {
          arrayToBatch = arrayToBatch.concat(generateForSocio(socio));
        }
      }

      if (arrayToBatch.length > 0) {
        addCobrosBatch(arrayToBatch);
        setNewCobro({ tipoCobro: 'Cuota Mensual', titulo: '', monto: '', asignacion: 'A todos', socioId: '', mesesAGenerar: 1 });
        alert(`¡Se emitieron ${arrayToBatch.length} cobro(s) exitosamente!`);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = "RUT,Nombre,Categoria,EstadoCuota,MesesAdeudados,DeudaCalculadaCLP,UltimoPago\n";
    const rows = sociosList.map(s => {
      const pendingCobros = cobrosList.filter(c => c.socioId === s.id && !c.pagado).reduce((acc, c) => acc + (c.monto || 0), 0);
      const cuotaIncorpPagadaReal = s.cuotaIncorporacionPagada || (s.fechaIngreso && new Date(s.fechaIngreso).getFullYear() < 2026);
      const cuotaIncorp = cuotaIncorpPagadaReal ? 0 : (s.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual);
      const deuda = (s.estadoCuota === 'Exento' || s.estadoCuota.includes('Desvinculado') || s.categoria === 'Socio Honorario') ? 0 : cuotaIncorp + pendingCobros;

      return `"${s.rut}","${s.nombre}","${s.categoria}","${s.estadoCuota}","${s.mesesAdeudados || 0}","${deuda}","${s.ultimaCuotaPagada}"`;
    }).join("\n");
    
    const element = document.createElement("a");
    const file = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Padron_Deudas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportRegistroSociosCSV = () => {
    const headers = "Nombre Socio,RUT,Fecha Ingreso,Fecha Renuncia/Desvinculación,Motivo Renuncia\n";
    const rows = sociosList.map(s => {
      const fechaIngreso = s.fechaIngreso || 'No registrada';
      const fechaRenuncia = s.fechaRetiroOficial || s.fechaSolicitudRenuncia || 'Activo';
      const motivo = s.motivoRenuncia || (s.estadoCuota.includes('Desvinculado') ? 'Desvinculado' : 'N/A');
      
      return `"${s.nombre}","${s.rut}","${fechaIngreso}","${fechaRenuncia}","${motivo}"`;
    }).join("\n");
    
    const element = document.createElement("a");
    const file = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Registro_Socios_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <section className="min-h-screen bg-slate-50 py-2 text-slate-900 font-['Plus_Jakarta_Sans']">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="border-b border-slate-200 pb-0">
          <div className="max-w-2xl pb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{sectionMeta.eyebrow}</p>
            <h2 className="font-['Outfit'] text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{sectionMeta.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{sectionMeta.description}</p>
          </div>

          {contextualTabs.length > 0 && (
            <nav className="flex gap-1 overflow-x-auto" aria-label={`Opciones de ${sectionMeta.title}`}>
              {contextualTabs.map(({ id, label, icon: Icon, badge }) => {
                const active = activeTabLocal === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTabLocal(id)}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex min-h-11 flex-none items-center gap-2 border-b-2 px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${active ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950'}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                    {badge > 0 && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-900">{badge}</span>}
                  </button>
                );
              })}
            </nav>
          )}
        </header>

        {/* SUBTAB: MI CUENTA */}
        {activeTabLocal === 'padron' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Datos Bancarios */}
            <div className="bg-slate-900 p-6 rounded-3xl shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                  <Wallet className="w-4 h-4" /> Datos de Transferencia Oficial
                </div>
                <h3 className="text-2xl font-extrabold font-['Outfit'] text-white">Cuenta Gremial PRUANED</h3>
                <p className="text-slate-300 text-sm max-w-md">
                  Para estar al día con tus cuotas sociales ($5.000 mensuales desde sept. 2026), realiza el pago a esta cuenta y envía el comprobante a Tesorería.
                </p>
              </div>
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 min-w-[300px] text-xs font-mono space-y-2.5">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Titular:</span>
                  <strong className="text-emerald-400 font-bold">PRUANED</strong>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">RUT:</span>
                  <strong className="text-white">65.272.406-K</strong>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Banco:</span>
                  <strong className="text-white">Mercado Pago</strong>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Tipo:</span>
                  <strong className="text-white">Cuenta Vista</strong>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">N° Cuenta:</span>
                  <strong className="text-amber-400 font-bold text-sm">1046032015</strong>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Email:</span>
                  <strong className="text-blue-300">ag.pruaned@gmail.com</strong>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por RUT, Nombre o Email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHistorico(!showHistorico)}
                    className={`px-3.5 py-1.5 font-bold text-xs rounded-xl shadow flex items-center gap-1.5 ${
                      showHistorico ? 'bg-blue-900 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" /> {showHistorico ? 'Ocultar Histórico' : 'Registro Histórico'}
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" /> Exportar cobros pendientes (CSV)
                  </button>
                  <button
                    onClick={handleExportRegistroSociosCSV}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" /> Libro Registro Socios (CSV)
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                {showHistorico ? (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-5">Socio / RUT</th>
                        <th className="py-3.5 px-5">Fecha Incorporación</th>
                        <th className="py-3.5 px-5">Fecha Desvinculación</th>
                        <th className="py-3.5 px-5">Estado</th>
                        <th className="py-3.5 px-5">Motivo / Acta</th>
                        <th className="py-3.5 px-5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sociosList.filter(s => s.email !== 'ag.pruaned@gmail.com').map(socio => (
                        <tr key={socio.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="font-bold text-slate-900 text-sm font-['Outfit']">{socio.nombre}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{socio.rut}</div>
                          </td>
                          <td className="py-3.5 px-5 font-mono">{socio.fechaIngreso || '-'}</td>
                          <td className="py-3.5 px-5 font-mono">{socio.fechaRetiroOficial || socio.fechaSolicitudRenuncia || '-'}</td>
                          <td className="py-3.5 px-5">
                            <span className="px-2.5 py-0.5 bg-slate-100 rounded-full border border-slate-200 text-slate-700 font-semibold text-[11px]">
                              {socio.estadoCuota}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-xs text-slate-600 max-w-xs truncate">
                            {socio.motivoRenuncia || socio.actaDirectorioAprobacion || (socio.estadoCuota.includes('Desvinculado') ? 'Desvinculado' : '-')}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => setActiveSocioModal(socio)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1 border border-slate-300"
                            >
                              <Eye className="w-3.5 h-3.5" /> Ver Perfil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <>
                    <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-5">Socio / RUT</th>
                        <th className="py-3.5 px-5">Categoría Gremial</th>
                        <th className="py-3.5 px-5">Estado Cuota</th>
                        <th className="py-3.5 px-5">Cuota Incorp.</th>
                        <th className="py-3.5 px-5">Permiso Voluntarios</th>
                        <th className="py-3.5 px-5">Cobros e incorporación pendientes</th>
                        <th className="py-3.5 px-5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {paginatedSocios.map((socio) => {
                      const esAntiguo = socio.fechaIngreso && new Date(socio.fechaIngreso).getFullYear() < 2026;
                      const cuotaIncorpPagadaReal = socio.cuotaIncorporacionPagada || esAntiguo;
                      const cuotaIncorp = cuotaIncorpPagadaReal ? 0 : (socio.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual);
                      
                      const pendingCobros = cobrosList.filter(c => c.socioId === socio.id && !c.pagado).reduce((acc, c) => acc + (c.monto || 0), 0);
                      const deudaCalculada = (socio.estadoCuota === 'Exento' || socio.estadoCuota.includes('Desvinculado') || socio.categoria === 'Socio Honorario') ? 0 : cuotaIncorp + pendingCobros;

                      return (
                        <tr key={socio.id} className="hover:bg-slate-50 transition-colors">
                          
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <img
                                src={socio.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(socio.nombre)}&background=0C2340&color=fff&size=128`}
                                alt={socio.nombre}
                                className="w-8 h-8 rounded-full object-cover border border-slate-300 flex-shrink-0"
                              />
                              <div>
                                <div className="font-bold text-slate-900 text-sm font-['Outfit']">{socio.nombre}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{socio.rut} • {socio.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-5">
                            {canManageCategoriesAndCargos ? (
                              <select
                                value={socio.categoria}
                                onChange={(e) => updateSocioCategoria(socio.id, e.target.value)}
                                className="bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-800 p-1.5 focus:border-blue-900"
                              >
                                <option value="Socio Activo">Socio Activo (Voz y Voto)</option>
                                <option value="Socio Adherente">Socio Adherente (Voz sin Voto)</option>
                                <option value="Socio Honorario">Socio Honorario (Exento Cuota)</option>
                              </select>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-slate-100 rounded-full border border-slate-200 text-slate-700 font-semibold text-[11px]">
                                {socio.categoria}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-5">
                            <span className={`badge-inst ${
                              socio.estadoCuota === 'Al Día' ? 'badge-green' :
                              socio.estadoCuota === 'En Mora' ? 'badge-red' :
                              socio.estadoCuota.includes('Solicitud Renuncia') ? 'badge-amber' :
                              'badge-blue'
                            }`}>
                              {socio.estadoCuota}
                            </span>
                          </td>

                          <td className="py-3.5 px-5">
                            {canManageFinances ? (
                              <button
                                onClick={() => updateSocioCuotaIncorporacion(socio.id, !cuotaIncorpPagadaReal)}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${cuotaIncorpPagadaReal ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}
                              >
                                {cuotaIncorpPagadaReal ? <Check className="w-3 h-3"/> : <X className="w-3 h-3"/>}
                                {cuotaIncorpPagadaReal ? 'Pagada' : 'Pendiente'}
                              </button>
                            ) : (
                              <span className={`text-[10px] font-bold ${cuotaIncorpPagadaReal ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {cuotaIncorpPagadaReal ? 'Pagada' : 'Pendiente'}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-5">
                            {canManageFinances ? (
                              <button
                                onClick={() => togglePermisoGestionVoluntariosSocio(socio.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                                  socio.permisoGestionVoluntarios
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {socio.permisoGestionVoluntarios ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-700" /> Habilitado
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="w-3 h-3 text-slate-400" /> Deshabilitado
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-500">
                                {socio.permisoGestionVoluntarios ? 'Habilitado' : 'Sin permiso'}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 font-mono font-bold">
                            {(canManageFinances || socio.email === currentUser?.email) ? (
                              deudaCalculada > 0 ? (
                                <span className="text-rose-600">
                                  ${deudaCalculada.toLocaleString('es-CL')} CLP
                                </span>
                              ) : (
                                <span className="text-emerald-700">$0 CLP</span>
                              )
                            ) : (
                              <span className="text-slate-400 font-medium">Privado</span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-right space-x-2">
                            {canManageFinances && (
                              <button
                                onClick={() => setActivePaymentModal(socio)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors"
                              >
                                Registrar Pago
                              </button>
                            )}

                            <button
                              onClick={() => setActiveSocioModal(socio)}
                              className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1 border border-blue-200"
                            >
                              <Eye className="w-3.5 h-3.5" /> Ver Perfil
                            </button>

                            
                          </td>

                        </tr>
                      );
                      })}
                    </tbody>
                  </table>

                  {/* BARRA DE PAGINACIÓN */}
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="text-slate-500">
                      Mostrando <strong className="text-slate-900">{Math.min(filteredSocios.length, (currentPage - 1) * itemsPerPage + 1)}</strong> a <strong className="text-slate-900">{Math.min(filteredSocios.length, currentPage * itemsPerPage)}</strong> de <strong className="text-slate-900">{filteredSocios.length}</strong> socios
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-slate-500">Filas por pág:</label>
                      <select
                        value={itemsPerPage}
                        onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-800 font-bold outline-none"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>

                      <div className="flex items-center gap-1 ml-2">
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Página anterior"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 font-bold text-slate-800">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          type="button"
                          disabled={currentPage >= totalPages}
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Página siguiente"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: APROBACIÓN DE RENUNCIAS Y DESVINCULACIÓN */}
        {activeTabLocal === 'renuncias' && (
          <div className="space-y-6 animate-fade-in">
            {canManageFinances ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-amber-600" />
                    Solicitudes de Renuncia &amp; Desvinculación Voluntaria (DL N° 2.757)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowRetroactiveForm(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Registrar renuncia retroactiva
                  </button>
                </div>

                {/* FORMULARIO DE RENUNCIA RETROACTIVA */}
                {showRetroactiveForm && (
                  <form onSubmit={handleRetroactiveRenuncia} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
                    <div className="border-b border-amber-200 pb-3">
                      <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Registrar Renuncia Anterior al Sistema
                      </h4>
                      <p className="text-xs text-amber-800 mt-1">Usa este formulario para registrar retroactivamente la renuncia de socios que se desvincularon antes de la implementación del sistema digital.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-amber-900 mb-1">Socio *</label>
                        <select
                          required
                          value={retroSocioId}
                          onChange={e => setRetroSocioId(e.target.value)}
                          className="w-full text-xs border border-amber-300 rounded-xl px-3 py-2 bg-white text-slate-900 font-semibold outline-none"
                        >
                          <option value="">— Seleccionar socio —</option>
                          {sociosList.filter(s => !s.estadoCuota?.includes('Desvinculado')).sort((a,b) => a.nombre.localeCompare(b.nombre)).map(s => (
                            <option key={s.id} value={s.id}>{s.nombre} ({s.rut})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">Fecha de solicitud de renuncia</label>
                        <input type="date" value={retroFechaSolicitud} onChange={e => setRetroFechaSolicitud(e.target.value)}
                          className="w-full text-xs border border-amber-300 rounded-xl px-3 py-2 bg-white text-slate-900 outline-none" />
                        <p className="text-[10px] text-amber-700 mt-0.5">Si no la tienes, déjala vacía.</p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">Fecha de retiro oficial *</label>
                        <input type="date" required value={retroFechaRetiro} onChange={e => setRetroFechaRetiro(e.target.value)}
                          className="w-full text-xs border border-amber-300 rounded-xl px-3 py-2 bg-white text-slate-900 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">N° Acta Directorio que aprobó *</label>
                        <input type="text" required placeholder="Ej: Acta N° 2024-03" value={retroActa} onChange={e => setRetroActa(e.target.value)}
                          className="w-full text-xs border border-amber-300 rounded-xl px-3 py-2 bg-white text-slate-900 outline-none" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-amber-900 mb-1">Motivo de la renuncia</label>
                        <textarea rows={2} placeholder="Motivo expresado por el socio al momento de renunciar..." value={retroMotivo} onChange={e => setRetroMotivo(e.target.value)}
                          className="w-full text-xs border border-amber-300 rounded-xl px-3 py-2 bg-white text-slate-900 outline-none resize-none" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2 border-t border-amber-200">
                      <button type="button" onClick={() => setShowRetroactiveForm(false)} className="px-4 py-2 text-xs font-bold rounded-xl border border-amber-300 text-amber-900 hover:bg-amber-100">Cancelar</button>
                      <button type="submit" disabled={isRetroSaving} className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 flex items-center gap-1.5">
                        {isRetroSaving ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        {isRetroSaving ? 'Registrando...' : 'Registrar desvinculación'}
                      </button>
                    </div>
                  </form>
                )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sociosList.filter(s => s.estadoCuota.includes('Renuncia') || s.estadoCuota.includes('Desvinculado')).length ? sociosList.filter(s => s.estadoCuota.includes('Renuncia') || s.estadoCuota.includes('Desvinculado')).map((soc) => (
                  <div key={soc.id} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2.5 py-0.5 bg-slate-200 text-slate-800 font-bold text-[10px] rounded-full font-mono">
                          {soc.id}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base font-['Outfit'] mt-1">
                          {soc.nombre}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">{soc.rut} • {soc.email}</p>
                      </div>
                      <span className={`badge-inst ${
                        soc.estadoCuota.includes('Aprobado') ? 'badge-green' : 'badge-amber'
                      }`}>
                        {soc.estadoCuota}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                      <div>• <strong>Fecha Solicitud:</strong> {soc.fechaSolicitudRenuncia || 'Sin fecha registrada'}</div>
                      <div>• <strong>Motivo Expresado:</strong> {soc.motivoRenuncia || 'Sin motivo registrado'}</div>
                      {soc.actaDirectorioAprobacion && (
                        <div>• <strong>Acta Aprobación Directorio:</strong> <span className="font-bold text-emerald-800">{soc.actaDirectorioAprobacion}</span></div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-end">
                      {soc.estadoCuota === 'Solicitud Renuncia Pendiente Directorio' && (
                        <button
                          onClick={() => setActiveApproveRenunciaModal(soc)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Revisar y aprobar
                        </button>
                      )}
                    </div>
                  </div>
                )) : <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">No hay solicitudes de renuncia ni desvinculaciones registradas.</div>}
              </div>
            </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto">
                <h3 className="text-2xl font-bold text-slate-900 font-['Outfit'] mb-4 flex justify-center items-center gap-2">
                  <FileCheck2 className="w-6 h-6 text-rose-600" />
                  Solicitar Mi Renuncia
                </h3>
                <p className="text-slate-600 mb-6">
                  Si deseas desvincularte de PRUANED A.G. conforme a los estatutos, puedes enviar una solicitud formal de renuncia.
                  Esta será revisada y ratificada por el Directorio Nacional.
                </p>
                {currentSocio.estadoCuota === 'Solicitud Renuncia Pendiente Directorio' ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-950">
                    <p className="font-bold">Solicitud enviada al Directorio</p>
                    <p className="mt-1">Fecha: {currentSocio.fechaSolicitudRenuncia || 'Sin fecha registrada'}</p>
                    <p className="mt-1">Motivo: {currentSocio.motivoRenuncia || 'Sin motivo registrado'}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveRequestRenunciaModal(currentSocio)}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition-colors"
                  >
                    Solicitar Renuncia Gremial
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: POSTULACIONES */}
        {activeTabLocal === 'auditoria' && (isMasterUser || isDirectiva) && (
          <AuditoriaPanel securityLogs={securityLogs || []} />
        )}

      </div>

      {/* POSTULACION MODAL */}
      {activePostulacionModal && (() => {
        const socioVinculado = activePostulacionModal.estado === 'Aceptada / Incorporado'
          ? sociosList.find(s => s.rut === activePostulacionModal.rut || s.email === activePostulacionModal.email)
          : null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-['Outfit']">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setActivePostulacionModal(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-900" />
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Ficha de Postulación</h3>
                    <p className="text-xs text-slate-400 font-mono">{activePostulacionModal.id} — Enviada el {activePostulacionModal.fechaEnvio}</p>
                  </div>
                </div>
                <span className={`mt-3 inline-block text-xs font-bold px-3 py-1 rounded-full border ${
                  activePostulacionModal.estado === 'Aceptada / Incorporado' ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : activePostulacionModal.estado === 'Rechazada' ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>{activePostulacionModal.estado}</span>
              </div>

              {socioVinculado && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-sm text-emerald-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Socio Incorporado Vinculado</p>
                    <p className="text-xs text-emerald-600">{socioVinculado.nombre} — {socioVinculado.categoria} — Ingreso: {socioVinculado.fechaIngreso}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 text-sm text-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-bold text-slate-400 text-xs uppercase block">Nombre Completo</span>{activePostulacionModal.nombreCompleto}</div>
                  <div><span className="font-bold text-slate-400 text-xs uppercase block">RUT</span>{activePostulacionModal.rut}</div>
                  <div><span className="font-bold text-slate-400 text-xs uppercase block">Email</span>{activePostulacionModal.email}</div>
                  <div><span className="font-bold text-slate-400 text-xs uppercase block">Teléfono</span>{activePostulacionModal.telefono || '-'}</div>
                  <div><span className="font-bold text-slate-400 text-xs uppercase block">Profesión</span>{activePostulacionModal.profesion}</div>
                  <div><span className="font-bold text-slate-400 text-xs uppercase block">Comuna</span>{activePostulacionModal.comuna}</div>
                </div>
                {activePostulacionModal.razonesIntegracion && (
                  <div><span className="font-bold text-slate-400 text-xs uppercase block">Razones de Integración</span><p className="mt-1 p-3 bg-slate-50 rounded-lg text-xs leading-relaxed border border-slate-200">{activePostulacionModal.razonesIntegracion}</p></div>
                )}
                {activePostulacionModal.aporteEsperado && (
                  <div><span className="font-bold text-slate-400 text-xs uppercase block">Aporte Esperado</span><p className="mt-1 p-3 bg-slate-50 rounded-lg text-xs leading-relaxed border border-slate-200">{activePostulacionModal.aporteEsperado}</p></div>
                )}
                {activePostulacionModal.experienciaPrevia && (
                  <div><span className="font-bold text-slate-400 text-xs uppercase block">Experiencia Previa</span><p className="mt-1 p-3 bg-slate-50 rounded-lg text-xs leading-relaxed border border-slate-200">{activePostulacionModal.experienciaPrevia}</p></div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  onClick={() => setActivePostulacionModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cerrar
                </button>
                {activePostulacionModal.estado === 'Pendiente Revisión Directorio' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { handleRejectApplicant(activePostulacionModal.id); }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg"
                    >
                      <X className="w-4 h-4" /> Rechazar
                    </button>
                    <button
                      onClick={() => { handleApproveApplicant(activePostulacionModal.id, 'Socio Activo'); }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg"
                    >
                      <Check className="w-4 h-4" /> Aprobar e Incorporar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {activePaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="payment-dialog-title" aria-describedby="payment-dialog-description" className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Tesorería</p>
                <h3 id="payment-dialog-title" className="mt-1 font-['Outfit'] text-xl font-extrabold text-slate-950">Registrar pago</h3>
              </div>
              <button type="button" onClick={() => { setActivePaymentModal(null); setComprobanteInput(''); setIsCuotaIncorporacionCheck(false); }} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700" aria-label="Cerrar registro de pago"><X className="h-5 w-5" aria-hidden="true" /></button>
            </div>
            <form onSubmit={handleRegisterPayment} className="space-y-5 pt-5">
              <p id="payment-dialog-description" className="text-sm leading-6 text-slate-600">Registra un pago para <strong className="text-slate-900">{activePaymentModal.nombre}</strong>. El estado sólo cambiará a “Al Día” si no quedan meses registrados en mora.</p>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="flex justify-between gap-3"><span className="text-slate-600">Cuota mensual</span><strong>${(activePaymentModal.montoCuotaMensual || financialSettings.cuotaMensualActual).toLocaleString('es-CL')} CLP</strong></div>
                <div className="mt-2 flex justify-between gap-3"><span className="text-slate-600">Meses en mora</span><strong>{activePaymentModal.mesesAdeudados || 0}</strong></div>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
                <input type="checkbox" checked={isCuotaIncorporacionCheck} onChange={event => setIsCuotaIncorporacionCheck(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-700" />
                <span><span className="block font-bold text-slate-900">Corresponde a cuota de incorporación</span><span className="mt-1 block text-xs text-slate-600">Monto: ${(activePaymentModal.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual).toLocaleString('es-CL')} CLP.</span></span>
              </label>
              <label className="block text-sm font-bold text-slate-800" htmlFor="payment-reference">Comprobante o referencia <span className="font-normal text-slate-500">(opcional)</span></label>
              <input id="payment-reference" autoFocus value={comprobanteInput} onChange={event => setComprobanteInput(event.target.value)} placeholder="Ej. transferencia N.º 1234" className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => { setActivePaymentModal(null); setComprobanteInput(''); setIsCuotaIncorporacionCheck(false); }} className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700">Cancelar</button>
                <button type="submit" className="min-h-11 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Confirmar pago</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* SOCIO PERFIL MODAL */}
      {activeSocioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-['Outfit']">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveSocioModal(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              {activeSocioModal.fotoPerfil ? (
                <img src={activeSocioModal.fotoPerfil} alt={activeSocioModal.nombre} className="w-16 h-16 rounded-full object-cover shadow-sm border border-slate-200" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-2xl font-bold shadow-sm">
                  {activeSocioModal.nombre.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{activeSocioModal.nombre}</h3>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-200">{activeSocioModal.categoria}</span>
              </div>
            </div>
            
            <div className="space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-bold text-slate-400 text-xs uppercase block">RUT</span>{activeSocioModal.rut}</div>
                <div><span className="font-bold text-slate-400 text-xs uppercase block">Email</span>{activeSocioModal.email}</div>
                <div><span className="font-bold text-slate-400 text-xs uppercase block">Teléfono</span>{activeSocioModal.telefono || '-'}</div>
                <div><span className="font-bold text-slate-400 text-xs uppercase block">Profesión</span>{activeSocioModal.profesion}</div>
                <div><span className="font-bold text-slate-400 text-xs uppercase block">Región</span>{activeSocioModal.region || '-'}</div>
                <div><span className="font-bold text-slate-400 text-xs uppercase block">Fecha Ingreso</span>{activeSocioModal.fechaIngreso || '-'}</div>
                <div className="col-span-2"><span className="font-bold text-slate-400 text-xs uppercase block">Domicilio</span>{activeSocioModal.domicilio || '-'} {activeSocioModal.comuna || ''}</div>
              </div>
              
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2 flex items-center gap-2"><Wallet className="w-4 h-4 text-blue-800"/> Estado Financiero</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-bold text-slate-500 text-xs block">Estado Cuota</span>
                    <span className={`font-bold ${activeSocioModal.estadoCuota.includes('Mora') ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {activeSocioModal.estadoCuota}
                    </span>
                  </div>
                  <div><span className="font-bold text-slate-500 text-xs block">Meses Adeudados</span>{activeSocioModal.mesesAdeudados || 0} meses</div>
                  <div><span className="font-bold text-slate-500 text-xs block">Cuota Mensual Pactada</span>${(activeSocioModal.montoCuotaMensual || financialSettings.cuotaMensualActual).toLocaleString('es-CL')}</div>
                  <div><span className="font-bold text-slate-500 text-xs block">Cuota Incorporación</span>
                    {activeSocioModal.cuotaIncorporacionPagada || (activeSocioModal.fechaIngreso && new Date(activeSocioModal.fechaIngreso).getFullYear() < 2026) ? (
                      <span className="text-emerald-600 font-bold"><Check className="w-3 h-3 inline"/> Pagada</span>
                    ) : (
                      <span className="text-rose-600 font-bold"><X className="w-3 h-3 inline"/> Pendiente (${(activeSocioModal.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual).toLocaleString('es-CL')})</span>
                    )}
                  </div>
                </div>
              </div>

              {(activeSocioModal.estadoCuota.includes('Desvinculado') || activeSocioModal.fechaSolicitudRenuncia) && (
                <div className="mt-4 p-4 bg-rose-50 rounded-xl border border-rose-200">
                  <h4 className="font-bold text-rose-900 mb-2 border-b border-rose-200 pb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Historial de Desvinculación</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="font-bold text-rose-700 text-xs block">Fecha Solicitud / Retiro</span>{activeSocioModal.fechaRetiroOficial || activeSocioModal.fechaSolicitudRenuncia || '-'}</div>
                    <div className="col-span-2"><span className="font-bold text-rose-700 text-xs block">Motivo / Acta de Directorio</span>{activeSocioModal.actaDirectorioAprobacion || activeSocioModal.motivoRenuncia || '-'}</div>
                  </div>
                </div>
              )}

              {(canManageFinances || activeSocioModal.email === currentUser?.email) && cobrosList.filter(c => c.socioId === activeSocioModal.id && !c.pagado).length > 0 && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h4 className="font-bold text-amber-900 mb-2 border-b border-amber-200 pb-2 flex items-center gap-2"><DollarSign className="w-4 h-4"/> Deudas Pendientes (Cuotas y Especiales)</h4>
                  <ul className="space-y-2">
                    {cobrosList.filter(c => c.socioId === activeSocioModal.id && !c.pagado).map((cobro, idx) => (
                      <li key={idx} className="flex justify-between text-xs text-amber-800">
                        <span>{cobro.titulo}</span>
                        <span className="font-bold">${cobro.monto.toLocaleString('es-CL')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => setActiveSocioModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
              >
                Cerrar Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Aprobar Renuncia (Directiva) */}
      {activeApproveRenunciaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <form onSubmit={handleApproveRenuncia} className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full space-y-5 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-600" /> Aprobar Retiro — {activeApproveRenunciaModal.nombre}
            </h3>
            <p className="text-xs text-slate-600">Confirma el Número de Acta del Directorio en que se aprobó esta renuncia (conforme al DL N° 2.757). Esto desvinculará al socio definitivamente y anonimizará sus datos de contacto.</p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">N° Acta del Directorio *</label>
              <input type="text" required placeholder="Ej: Acta Directorio N° 2024-03" value={acuerdoNumero} onChange={e => setAcuerdoNumero(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500" />
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button type="button" onClick={() => { setActiveApproveRenunciaModal(null); setAcuerdoNumero(''); }} className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Aprobar desvinculación definitiva
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Solicitar Renuncia (Socio) */}
      {activeRequestRenunciaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <form onSubmit={handleRequestRenuncia} className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full space-y-5 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
              <UserX className="w-5 h-5 text-rose-600" /> Solicitar Renuncia Gremial
            </h3>
            <p className="text-xs text-slate-600">Tu solicitud será enviada al Directorio Nacional para su ratificación formal conforme a los Estatutos de PRUANED A.G. y el DL N° 2.757.</p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Motivo de la renuncia *</label>
              <textarea rows={3} required placeholder="Indica brevemente el motivo por el cual solicitas tu desvinculación..." value={motivoRenunciaInput} onChange={e => setMotivoRenunciaInput(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-rose-400 resize-none" />
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button type="button" onClick={() => { setActiveRequestRenunciaModal(null); setMotivoRenunciaInput(''); }} className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5" /> Enviar solicitud al Directorio
              </button>
            </div>
          </form>
        </div>
      )}

    </section>
  );
};
