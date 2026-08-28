import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PrivacyDataPolicy } from '../../components/PrivacyDataPolicy';
import { TarifarioEditor } from '../../components/TarifarioEditor';
import { FondoDonacionesPanel } from '../../components/FondoDonacionesPanel';
import { sendPagoEmail, sendApprovalEmail, sendRejectionEmail } from '../../lib/emailConfig';
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
  X,
  Shield
} from 'lucide-react';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   AuditoriaPanel â€” Registro de auditorÃ­a institucional
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const SEVERITY_CFG = {
  INFO:  { color: 'bg-blue-100 text-blue-800 border-blue-200',    dot: 'bg-blue-500',   label: 'Info' },
  WARN:  { color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500',  label: 'Alerta' },
  ERROR: { color: 'bg-rose-100 text-rose-800 border-rose-200',    dot: 'bg-rose-500',   label: 'Error' },
};

const QUOTA_EXPENSE_CATEGORIES = [
  'Insumos MÃ©dicos Veterinarios',
  'LogÃ­stica Terreno & Combustible',
  'Albergues Temporales & AlimentaciÃ³n',
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
    const headers = 'Fecha/Hora,Usuario,AcciÃ³n,CÃ³digo TÃ©cnico,Severidad\n';
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
              Registro de AuditorÃ­a Institucional
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historial completo de acciones â€” quiÃ©n hizo cada cambio y cuÃ¡ndo.
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
              placeholder="Buscar acciÃ³n, usuario o fecha..."
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
        {[{sev:'INFO',label:'Operaciones',icon:'ðŸ”µ'},{sev:'WARN',label:'Alertas',icon:'ðŸŸ¡'},{sev:'ERROR',label:'Errores',icon:'ðŸ”´'}].map(({sev,label,icon}) => (
          <div key={sev} className={`p-4 rounded-2xl border text-xs font-bold ${SEVERITY_CFG[sev]?.color}`}>
            <div className="text-lg mb-1">{icon}</div>
            <div className="text-2xl font-extrabold font-['Outfit']">{securityLogs.filter(l => l.severity === sev).length}</div>
            <div className="opacity-70">{label}</div>
          </div>
        ))}
        <div className="p-4 rounded-2xl border text-xs font-bold bg-slate-100 text-slate-800 border-slate-200">
          <div className="text-lg mb-1">ðŸ“‹</div>
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
                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">AcciÃ³n</th>
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
            <span>Los registros se sincronizan con el historial de auditorÃ­a institucional.</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Permite escribir nombre, RUT o email para filtrar socios.
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const SocioSearchSelect = ({ sociosList, selectedId, onSelect, label }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = sociosList.find(s => s.id === selectedId);

  const filtered = query.trim() === ''
    ? sociosList
    : sociosList.filter(s =>
        s.nombre.toLowerCase().includes(query.toLowerCase()) ||
        s.rut.includes(query) ||
        (s.email || '').toLowerCase().includes(query.toLowerCase())
      );

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (socio) => {
    onSelect(socio.id);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{label}</label>
      )}
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 hover:border-blue-500 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selected?.fotoPerfil && (
            <img src={selected.fotoPerfil} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
          )}
          <span className="truncate">
            {selected ? `${selected.nombre} (${selected.rut})` : 'Seleccionar socio...'}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por nombre, RUT o email..."
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          {/* Options list */}
          <ul className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-xs text-slate-400 italic text-center">Sin resultados para "{query}"</li>
            ) : (
              filtered.map(s => (
                <li
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer text-xs transition-colors ${
                    s.id === selectedId
                      ? 'bg-blue-50 text-blue-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <img src={s.fotoPerfil} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{s.nombre}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{s.rut} â€¢ {s.categoria}</div>
                  </div>
                  {s.id === selectedId && <Check className="w-3.5 h-3.5 text-blue-600 ml-auto flex-shrink-0" />}
                </li>
              ))
            )}
          </ul>
          <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400">
            {filtered.length} de {sociosList.length} socios
          </div>
        </div>
      )}
    </div>
  );
};

export default function SociosDirectory({ initialTab, section = 'socios' }) {
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

  const [activeTabLocal, setActiveTabLocal] = useState(initialTab ?? (isMasterUser ? 'padron' : 'mi-cuenta'));

  useEffect(() => {
    if (initialTab != null) setActiveTabLocal(initialTab);
  }, [initialTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('TODOS');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [showHistorico, setShowHistorico] = useState(false);

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
    categoria: 'Insumos MÃ©dicos Veterinarios',
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

  const postulacionesPendientes = postulacionesList.filter(p => p.estado === 'Pendiente RevisiÃ³n Directorio').length;
  const renunciasPendientes = sociosList.filter(s => s.estadoCuota === 'Solicitud Renuncia Pendiente Directorio').length;
  const sectionMeta = {
    socios: {
      eyebrow: 'Ãrea personal',
      title: 'Mi cuenta y padrÃ³n',
      description: 'Actualiza tu ficha, consulta el padrÃ³n y revisa tus solicitudes.'
    },
    directorio: {
      eyebrow: 'Directorio nacional',
      title: 'Cargos y firmas',
      description: 'Gestiona la representaciÃ³n institucional y sus firmas oficiales.'
    },
    finanzas: {
      eyebrow: 'AdministraciÃ³n financiera',
      title: 'Finanzas',
      description: 'Consulta el balance y administra cobros, egresos y postulaciones.'
    },
    auditoria: {
      eyebrow: 'Control institucional',
      title: 'Registro de auditorÃ­a',
      description: 'Revisa la actividad relevante de la intranet.'
    }
  }[section] || {
    eyebrow: 'Intranet',
    title: 'GestiÃ³n de socios',
    description: 'Administra la informaciÃ³n gremial.'
  };
  const contextualTabs = {
    socios: [
      { id: 'mi-cuenta', label: 'Mi cuenta', icon: User },
      { id: 'padron', label: 'PadrÃ³n y cuotas', icon: Users },
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

  const handleFileUploadFoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFotoPerfil(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUploadFirma = (cargoKey, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFirmaOficial(cargoKey, reader.result);
        alert(`Â¡Firma digitalizada de ${cargoKey === 'presidenteFirma' ? 'Presidente' : 'Secretario'} actualizada en certificados y documentos!`);
      };
      reader.readAsDataURL(file);
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
    alert('Â¡Tus datos de contacto y perfil han sido actualizados!');
  };

  const handleRegisterPayment = (e) => {
    e.preventDefault();
    if (activePaymentModal && canManageFinances) {
      const remainingMonthlyDebt = Math.max(0, Number(activePaymentModal.mesesAdeudados || 0) - 1);
      const nextEstado = isCuotaIncorporacionCheck
        ? activePaymentModal.estadoCuota
        : remainingMonthlyDebt > 0 ? 'En Mora' : 'Al DÃ­a';
      updateSocioCuota(
        activePaymentModal.id, 
        nextEstado,
        comprobanteInput.trim() || 'Validado por TesorerÃ­a', 
        false, 
        isCuotaIncorporacionCheck
      );
      
      const pagoData = {
        monto: isCuotaIncorporacionCheck ? (activePaymentModal.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual) : (activePaymentModal.montoCuotaMensual || financialSettings.cuotaMensualActual),
        referencia: comprobanteInput.trim() || 'Validado por TesorerÃ­a'
      };
      sendPagoEmail(pagoData, activePaymentModal);

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
        alert(error.message || 'No fue posible registrar el egreso. Verifica la migraciÃ³n financiera y tu permiso.');
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
        alert(`Â¡Se emitieron ${arrayToBatch.length} cobro(s) exitosamente!`);
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
    const headers = "Nombre Socio,RUT,Fecha Ingreso,Fecha Renuncia/DesvinculaciÃ³n,Motivo Renuncia\n";
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
        {activeTabLocal === 'mi-cuenta' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
              
              <div className="border-b border-slate-100 pb-4">
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded-full uppercase">
                  Ficha de Miembro Gremial
                </span>
                <h3 className="text-2xl font-bold text-slate-900 font-['Outfit'] mt-1 flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-900" />
                  Mi Cuenta & Datos Personales
                </h3>
              </div>

              <form onSubmit={handleSaveMiCuentaSubmit} className="space-y-6 text-xs">
                
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="relative group flex-shrink-0">
                    <img
                      src={editFotoPerfil}
                      alt={currentSocio.nombre}
                      className="w-24 h-24 rounded-full object-cover border-4 border-blue-900 shadow-lg"
                    />
                    <label className="absolute bottom-0 right-0 bg-blue-900 text-white p-2 rounded-full cursor-pointer hover:bg-blue-800 shadow transition-transform hover:scale-110">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUploadFoto}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-lg font-bold text-slate-900 font-['Outfit']">
                      {currentSocio.nombre}
                    </h4>
                    <div className="text-xs text-blue-900 font-semibold">{currentSocio.profesion}</div>
                    <div className="text-[11px] text-slate-500 font-mono">RUT: {currentSocio.rut} â€¢ CategorÃ­a: {currentSocio.categoria}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Correo ElectrÃ³nico *</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">TelÃ©fono MÃ³vil *</label>
                    <input
                      type="tel"
                      required
                      value={editTelefono}
                      onChange={(e) => setEditTelefono(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fecha de Nacimiento *</label>
                    <input
                      type="date"
                      required
                      value={editFechaNacimiento}
                      onChange={(e) => setEditFechaNacimiento(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Estado Civil *</label>
                    <select
                      required
                      value={editEstadoCivil}
                      onChange={(e) => setEditEstadoCivil(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Soltero">Soltero/a</option>
                      <option value="Casado">Casado/a</option>
                      <option value="Conviviente Civil">Conviviente Civil</option>
                      <option value="Divorciado">Divorciado/a</option>
                      <option value="Viudo">Viudo/a</option>
                      <option value="Separado">Separado/a</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ProfesiÃ³n *</label>
                    <input
                      type="text"
                      required
                      value={editProfesion}
                      onChange={(e) => setEditProfesion(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">RegiÃ³n *</label>
                    <input
                      type="text"
                      required
                      value={editRegion}
                      onChange={(e) => setEditRegion(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Comuna / Ciudad *</label>
                    <input
                      type="text"
                      required
                      value={editComuna}
                      onChange={(e) => setEditComuna(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">DirecciÃ³n Completa *</label>
                    <input
                      type="text"
                      required
                      value={editDomicilio}
                      onChange={(e) => setEditDomicilio(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl text-xs shadow flex items-center gap-2"
                  >
                    <Save className="w-4 h-4 text-emerald-400" /> Guardar Cambios en Mi Cuenta
                  </button>
                </div>

              </form>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-bold text-[10px] rounded-full uppercase">
                      Ley 19.628
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] mt-1 flex items-center gap-2">
                      <Scale className="w-5 h-5 text-emerald-600" />
                      Derechos ARCO y Privacidad
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  En cumplimiento de la Ley sobre Protección de la Vida Privada (Ley 19.628) y la nueva Ley de Datos de Chile, tienes derecho a solicitar una copia de toda la información personal y financiera que PRUANED almacena sobre ti (Derecho de Acceso y Portabilidad).
                </p>
                <div className="flex justify-start pt-2">
                  <button
                    type="button"
                    onClick={handleExportarDatosARCO}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-extrabold rounded-xl text-xs shadow flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-emerald-400" /> Descargar mis datos (Formato JSON)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: PADRÃ“N & CONTROL DE DEUDAS */}
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
                  Para estar al dÃ­a con tus cuotas sociales ($5.000 mensuales desde sept. 2026), realiza el pago a esta cuenta y envÃ­a el comprobante a TesorerÃ­a.
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
                  <span className="text-slate-400">NÂ° Cuenta:</span>
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
                    <ClipboardList className="w-3.5 h-3.5" /> {showHistorico ? 'Ocultar HistÃ³rico' : 'Registro HistÃ³rico'}
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
                        <th className="py-3.5 px-5">Fecha IncorporaciÃ³n</th>
                        <th className="py-3.5 px-5">Fecha DesvinculaciÃ³n</th>
                        <th className="py-3.5 px-5">Estado</th>
                        <th className="py-3.5 px-5">Motivo / Acta</th>
                        <th className="py-3.5 px-5 text-right">AcciÃ³n</th>
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
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-5">Socio / RUT</th>
                        <th className="py-3.5 px-5">CategorÃ­a Gremial</th>
                        <th className="py-3.5 px-5">Estado Cuota</th>
                        <th className="py-3.5 px-5">Cuota Incorp.</th>
                        <th className="py-3.5 px-5">Permiso Voluntarios</th>
                        <th className="py-3.5 px-5">Cobros e incorporaciÃ³n pendientes</th>
                        <th className="py-3.5 px-5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {filteredSocios.map((socio) => {
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
                                <div className="text-[11px] text-slate-500 font-mono">{socio.rut} â€¢ {socio.email}</div>
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
                              socio.estadoCuota === 'Al DÃ­a' ? 'badge-green' :
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
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: APROBACIÃ“N DE RENUNCIAS Y DESVINCULACIÃ“N */}
        {activeTabLocal === 'renuncias' && (
          <div className="space-y-6 animate-fade-in">
            {canManageFinances ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-amber-600" />
                  Solicitudes de Renuncia & DesvinculaciÃ³n Voluntaria (DL NÂ° 2.757)
                </h3>

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
                        <p className="text-xs text-slate-500 font-mono">{soc.rut} â€¢ {soc.email}</p>
                      </div>
                      <span className={`badge-inst ${
                        soc.estadoCuota.includes('Aprobado') ? 'badge-green' : 'badge-amber'
                      }`}>
                        {soc.estadoCuota}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                      <div>â€¢ <strong>Fecha Solicitud:</strong> {soc.fechaSolicitudRenuncia || 'Sin fecha registrada'}</div>
                      <div>â€¢ <strong>Motivo Expresado:</strong> {soc.motivoRenuncia || 'Sin motivo registrado'}</div>
                      {soc.actaDirectorioAprobacion && (
                        <div>â€¢ <strong>Acta AprobaciÃ³n Directorio:</strong> <span className="font-bold text-emerald-800">{soc.actaDirectorioAprobacion}</span></div>
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
                  Esta serÃ¡ revisada y ratificada por el Directorio Nacional.
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
        {activeTabLocal === 'postulaciones' && canManageFinances && (() => {
          const pendientes = postulacionesList.filter(p => p.estado === 'Pendiente Revisi\u00f3n Directorio');
          const aprobadas  = postulacionesList.filter(p => p.estado === 'Aceptada / Incorporado');
          const rechazadas = postulacionesList.filter(p => p.estado === 'Rechazada');
          const listaFiltrada = postFilter === 'pendientes' ? pendientes
            : postFilter === 'aprobadas' ? aprobadas
            : rechazadas;

          return (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-900" />
                    Archivo de Postulaciones
                  </h3>
                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
                    <button
                      onClick={() => setPostFilter('pendientes')}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${ postFilter === 'pendientes' ? 'bg-amber-500 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
                    >
                      Pendientes
                      {pendientes.length > 0 && <span className="bg-white text-amber-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{pendientes.length}</span>}
                    </button>
                    <button
                      onClick={() => setPostFilter('aprobadas')}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${ postFilter === 'aprobadas' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
                    >
                      Aprobadas
                      {aprobadas.length > 0 && <span className="bg-white text-emerald-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{aprobadas.length}</span>}
                    </button>
                    <button
                      onClick={() => setPostFilter('rechazadas')}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${ postFilter === 'rechazadas' ? 'bg-rose-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
                    >
                      Rechazadas
                      {rechazadas.length > 0 && <span className="bg-white text-rose-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{rechazadas.length}</span>}
                    </button>
                  </div>
                </div>

                {listaFiltrada.length === 0 ? (
                  <p className="text-center text-slate-400 py-8 text-sm">No hay postulaciones en esta categor\u00eda.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {listaFiltrada.map((post) => {
                      const socioVinculado = post.estado === 'Aceptada / Incorporado'
                        ? sociosList.find(s => s.rut === post.rut || s.email === post.email)
                        : null;
                      return (
                        <div key={post.id} className={`p-5 rounded-xl border space-y-3 ${
                          post.estado === 'Aceptada / Incorporado' ? 'bg-emerald-50 border-emerald-200'
                          : post.estado === 'Rechazada' ? 'bg-rose-50 border-rose-200'
                          : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded-full">{post.id}</span>
                              <h4 className="font-bold text-slate-900 text-base font-['Outfit'] mt-1">{post.nombreCompleto}</h4>
                              <p className="text-xs text-slate-500 font-mono">{post.rut} \u2022 {post.email}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">Enviada: {post.fechaEnvio}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              post.estado === 'Aceptada / Incorporado' ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : post.estado === 'Rechazada' ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}>{post.estado}</span>
                          </div>

                          {socioVinculado && (
                            <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-100 rounded-lg px-3 py-1.5 border border-emerald-200">
                              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Socio incorporado: <strong>{socioVinculado.nombre}</strong> \u2014 {socioVinculado.categoria}</span>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-200">
                            <button
                              onClick={() => setActivePostulacionModal(post)}
                              className="px-3 py-1.5 bg-blue-900 text-white font-bold text-xs rounded-lg flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Ver Ficha Completa
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {activeTabLocal === 'donaciones' && canManageFinances && <FondoDonacionesPanel />}

        {/* TAB 4: REGISTRO DE EGRESOS */}
        {activeTabLocal === 'egresos' && canManageFinances && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-600" />
                Ingresar Nuevo Gasto / Egreso
              </h3>

              <form onSubmit={handleAddExpenseSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fondo que financia el egreso</label>
                  <select
                    value={newExpense.origenFondo}
                    onChange={(e) => setNewExpense({ ...newExpense, origenFondo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                  >
                    <option value="Fondo Cuotas">Fondo de cuotas sociales</option>
                    <option value="Fondo Donaciones">Fondo de donaciones</option>
                  </select>
                  {newExpense.origenFondo === 'Fondo Donaciones' && (
                    <p className="mt-1.5 rounded-lg bg-emerald-50 px-2.5 py-2 text-[11px] font-medium text-emerald-800">
                      Este movimiento descontarÃ¡ exclusivamente el saldo del Fondo de Donaciones.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Documento</label>
                  <select
                    value={newExpense.tipoDocumento}
                    onChange={(e) => setNewExpense({...newExpense, tipoDocumento: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                  >
                    <option value="Factura">Factura de Compra</option>
                    <option value="Boleta">Boleta de Venta / Servicio</option>
                    <option value="Comprobante">Comprobante de Transferencia</option>
                    <option value="Vale">Vale de Caja Chica</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">NÂ° Documento</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: FAC-1092"
                      value={newExpense.numeroDocumento}
                      onChange={(e) => setNewExpense({...newExpense, numeroDocumento: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Monto ($ CLP)</label>
                    <input
                      type="number"
                      required
                      placeholder="Ej: 45000"
                      value={newExpense.monto}
                      onChange={(e) => setNewExpense({...newExpense, monto: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proveedor / Entidad</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Copec / DroguerÃ­a Veterinaria"
                    value={newExpense.proveedor}
                    onChange={(e) => setNewExpense({...newExpense, proveedor: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {newExpense.origenFondo === 'Fondo Donaciones' ? 'CategorÃ­a del egreso del fondo' : 'CategorÃ­a del gasto'}
                  </label>
                  <select
                    value={newExpense.categoria}
                    onChange={(e) => setNewExpense({...newExpense, categoria: e.target.value})}
                    disabled={!availableExpenseCategories.length}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {!availableExpenseCategories.length && <option value="">Crea una categorÃ­a en Fondo donaciones</option>}
                    {availableExpenseCategories.map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                  {newExpense.origenFondo === 'Fondo Donaciones' && (
                    <p className="mt-1 text-[10px] text-slate-500">Administra estas categorÃ­as en la pestaÃ±a <span className="font-bold">Fondo donaciones</span>.</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">DescripciÃ³n / Glosa</label>
                  <textarea
                    rows={3}
                    placeholder="Detalle del gasto..."
                    value={newExpense.glosa}
                    onChange={(e) => setNewExpense({...newExpense, glosa: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newExpense.categoria}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60 text-white font-bold rounded-xl text-xs shadow"
                >
                  {newExpense.origenFondo === 'Fondo Donaciones' ? 'Registrar egreso del fondo' : 'Registrar egreso en libro'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                Libro de Egresos Registrados ({expensesList.length})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase">
                      <th className="py-2.5 px-3">Fecha / Doc</th>
                      <th className="py-2.5 px-3">Proveedor / Fondo / CategorÃ­a</th>
                      <th className="py-2.5 px-3">Monto</th>
                      <th className="py-2.5 px-3 text-right">AcciÃ³n</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expensesList.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{exp.tipoDocumento} {exp.numeroDocumento}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{exp.fecha}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{exp.proveedor}</div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${exp.origenFondo === 'Fondo Donaciones' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                              {exp.origenFondo || 'Fondo Cuotas'}
                            </span>
                            <span className="text-[10px] text-rose-600 font-bold">{exp.categoria}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-600">
                          -${Number(exp.monto).toLocaleString('es-CL')} CLP
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => deleteExpense(exp.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            title="Eliminar registro de gasto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BALANCE GENERAL */}
        {activeTabLocal === 'balance' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                    <PieChart className="w-6 h-6 text-blue-900" />
                    Balance General Financiero (Directorio Nacional)
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 font-bold block uppercase">Estado de Caja</span>
                  <span className="text-2xl font-extrabold text-emerald-700 font-['Outfit']">
                    ${saldoCaja.toLocaleString('es-CL')} CLP
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 space-y-3">
                  <h4 className="font-bold text-emerald-900 text-sm uppercase flex items-center justify-between">
                    <span>Ingresos Recaudados</span>
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                  </h4>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between border-b border-emerald-200 pb-1">
                      <span>Cuotas Mensuales Socios:</span>
                      <strong className="font-mono text-emerald-800">${totalIngresos.toLocaleString('es-CL')} CLP</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-rose-50 p-5 rounded-xl border border-rose-200 space-y-3">
                  <h4 className="font-bold text-rose-900 text-sm uppercase flex items-center justify-between">
                    <span>Egresos Realizados</span>
                    <TrendingDown className="w-4 h-4 text-rose-700" />
                  </h4>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between border-b border-rose-200 pb-1">
                      <span>Gastos Rendidos:</span>
                      <strong className="font-mono text-rose-800">${totalEgresos.toLocaleString('es-CL')} CLP</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: COBROS ESPECIALES */}
        {activeTabLocal === 'cobros-especiales' && canManageFinances && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-600" />
                EmisiÃ³n de Cobros (Masiva o Individual)
              </h3>
              
              <form onSubmit={handleAddCobroEspecial} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipo de Cobro</label>
                    <select
                      value={newCobro.tipoCobro}
                      onChange={(e) => setNewCobro({...newCobro, tipoCobro: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                    >
                      <option value="Cuota Mensual">Cuota Mensual (Usa Tarifario por CategorÃ­a)</option>
                      <option value="Cobro Extraordinario">Cobro Extraordinario (Monto Fijo Manual)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">TÃ­tulo del Cobro</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Cuota Septiembre 2026"
                      value={newCobro.titulo}
                      onChange={(e) => setNewCobro({...newCobro, titulo: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {newCobro.tipoCobro === 'Cuota Mensual' ? (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Cantidad de Meses a Emitir (1, 2, 3...)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newCobro.mesesAGenerar}
                        onChange={(e) => setNewCobro({...newCobro, mesesAGenerar: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Monto Fijo ($ CLP)</label>
                      <input
                        type="number"
                        required
                        placeholder="Ej. 10000"
                        value={newCobro.monto}
                        onChange={(e) => setNewCobro({...newCobro, monto: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">AsignaciÃ³n</label>
                    <select
                      value={newCobro.asignacion}
                      onChange={(e) => setNewCobro({...newCobro, asignacion: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                    >
                      <option value="A todos">A todos los socios activos / morosos</option>
                      <option value="Individual">Individual (Seleccionar socio)</option>
                    </select>
                  </div>
                </div>

                {newCobro.asignacion === 'Individual' && (
                  <SocioSearchSelect
                    sociosList={sociosList}
                    selectedId={newCobro.socioId}
                    onSelect={(id) => setNewCobro({...newCobro, socioId: id})}
                    label="Seleccionar Socio:"
                  />
                )}

                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow flex items-center gap-1"
                >
                  <PlusCircle className="w-4 h-4" /> Generar Cobro(s)
                </button>
              </form>
            </div>

            <TarifarioEditor 
              financialSettings={financialSettings} 
              onSave={updateFinancialSettings} 
              isMasterUser={isMasterUser} 
              canManageCategoriesAndCargos={canManageCategoriesAndCargos} 
            />
          </div>
        )}

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
                    <h3 className="text-2xl font-bold text-slate-900">Ficha de PostulaciÃ³n</h3>
                    <p className="text-xs text-slate-400 font-mono">{activePostulacionModal.id} â€” Enviada el {activePostulacionModal.fechaEnvio}</p>
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
                    <p className="text-xs text-emerald-600">{socioVinculado.nombre} â€” {socioVinculado.categoria} â€” Ingreso: {socioVinculado.fechaIngreso}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 text-sm text-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-bold text-slate-400 text-xs uppercase block">Nombre Completo</span>{activePostulacionModal.nombreCompleto}</div>
                  <div><span className="font-bold text-slate-400 text-xs uppercase block">RUT</span>{activePostulacionModal.rut}</div>
                  <div><span className="font-bold text-slate-400 text-xs uppercase block">Email</span>{activePostulacionModal.email}</div>
                  <div><span className="font-bold text-slate-400 text-xs uppercase block">TelÃ©fono</span>{activePostulacionModal.telefono || '-'}</div>
                  <div><span className="font-bold text-slate-400 text-xs uppercase block">ProfesiÃ³n</span>{activePostulacionModal.profesion}</div>
                  <div><span className="font-bold text-slate-400 text-xs uppercase block">Comuna</span>{activePostulacionModal.comuna}</div>
                </div>
                {activePostulacionModal.razonesIntegracion && (
                  <div><span className="font-bold text-slate-400 text-xs uppercase block">Razones de IntegraciÃ³n</span><p className="mt-1 p-3 bg-slate-50 rounded-lg text-xs leading-relaxed border border-slate-200">{activePostulacionModal.razonesIntegracion}</p></div>
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
                {activePostulacionModal.estado === 'Pendiente RevisiÃ³n Directorio' && (
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
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">TesorerÃ­a</p>
                <h3 id="payment-dialog-title" className="mt-1 font-['Outfit'] text-xl font-extrabold text-slate-950">Registrar pago</h3>
              </div>
              <button type="button" onClick={() => { setActivePaymentModal(null); setComprobanteInput(''); setIsCuotaIncorporacionCheck(false); }} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700" aria-label="Cerrar registro de pago"><X className="h-5 w-5" aria-hidden="true" /></button>
            </div>
            <form onSubmit={handleRegisterPayment} className="space-y-5 pt-5">
              <p id="payment-dialog-description" className="text-sm leading-6 text-slate-600">Registra un pago para <strong className="text-slate-900">{activePaymentModal.nombre}</strong>. El estado sÃ³lo cambiarÃ¡ a â€œAl DÃ­aâ€ si no quedan meses registrados en mora.</p>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="flex justify-between gap-3"><span className="text-slate-600">Cuota mensual</span><strong>${(activePaymentModal.montoCuotaMensual || financialSettings.cuotaMensualActual).toLocaleString('es-CL')} CLP</strong></div>
                <div className="mt-2 flex justify-between gap-3"><span className="text-slate-600">Meses en mora</span><strong>{activePaymentModal.mesesAdeudados || 0}</strong></div>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
                <input type="checkbox" checked={isCuotaIncorporacionCheck} onChange={event => setIsCuotaIncorporacionCheck(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-700" />
                <span><span className="block font-bold text-slate-900">Corresponde a cuota de incorporaciÃ³n</span><span className="mt-1 block text-xs text-slate-600">Monto: ${(activePaymentModal.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual).toLocaleString('es-CL')} CLP.</span></span>
              </label>
              <label className="block text-sm font-bold text-slate-800" htmlFor="payment-reference">Comprobante o referencia <span className="font-normal text-slate-500">(opcional)</span></label>
              <input id="payment-reference" autoFocus value={comprobanteInput} onChange={event => setComprobanteInput(event.target.value)} placeholder="Ej. transferencia N.Âº 1234" className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
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
                <div><span className="font-bold text-slate-400 text-xs uppercase block">TelÃ©fono</span>{activeSocioModal.telefono || '-'}</div>
                <div><span className="font-bold text-slate-400 text-xs uppercase block">ProfesiÃ³n</span>{activeSocioModal.profesion}</div>
                <div><span className="font-bold text-slate-400 text-xs uppercase block">RegiÃ³n</span>{activeSocioModal.region || '-'}</div>
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
                  <div><span className="font-bold text-slate-500 text-xs block">Cuota IncorporaciÃ³n</span>
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
                  <h4 className="font-bold text-rose-900 mb-2 border-b border-rose-200 pb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Historial de DesvinculaciÃ³n</h4>
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

    </section>
  );
};


