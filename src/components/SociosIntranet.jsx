import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PrivacyDataPolicy } from './PrivacyDataPolicy';
import { sendPagoEmail } from '../lib/emailConfig';
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
  GraduationCap,
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

/* ─────────────────────────────────────────────────────────────
   AuditoriaPanel — Registro de auditoría institucional
───────────────────────────────────────────────────────────── */
const SEVERITY_CFG = {
  INFO:  { color: 'bg-blue-100 text-blue-800 border-blue-200',    dot: 'bg-blue-500',   label: 'Info' },
  WARN:  { color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500',  label: 'Alerta' },
  ERROR: { color: 'bg-rose-100 text-rose-800 border-rose-200',    dot: 'bg-rose-500',   label: 'Error' },
};

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
            <span>Los registros se almacenan localmente — se resetean al limpiar caché del navegador.</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Permite escribir nombre, RUT o email para filtrar socios.
───────────────────────────────────────────────────────────── */
const SocioSearchSelect = ({ sociosList, selectedId, onSelect, label }) => {
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
                    <div className="text-[10px] text-slate-400 font-mono">{s.rut} • {s.categoria}</div>
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

export const SociosIntranet = () => {
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
    canManageVoluntarios,
    canManageFinances,
    canPublishCMS,
    currentUser,
    setActiveTab,
    securityLogs,
    cobrosList = [],
    addCobrosBatch = () => {}
  } = useAuth();

  const [activeTabLocal, setActiveTabLocal] = useState(isMasterUser ? 'padron' : 'mi-cuenta');
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
  const [editFotoPerfil, setEditFotoPerfil] = useState(currentSocio?.fotoPerfil || '');

  const [activePaymentModal, setActivePaymentModal] = useState(null);
  const [activePostulacionModal, setActivePostulacionModal] = useState(null);
  const [activeSocioModal, setActiveSocioModal] = useState(null);
  const [activeRequestRenunciaModal, setActiveRequestRenunciaModal] = useState(null);
  const [activeApproveRenunciaModal, setActiveApproveRenunciaModal] = useState(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const [comprobanteInput, setComprobanteInput] = useState('');
  const [motivoRenunciaInput, setMotivoRenunciaInput] = useState('');
  const [actaDirectorioInput, setActaDirectorioInput] = useState('');
  const [isCuotaIncorporacionCheck, setIsCuotaIncorporacionCheck] = useState(false);

  const presidente = getDirectorioMember('presidenteId');
  const vicepresidente = getDirectorioMember('vicepresidenteId');
  const secretario = getDirectorioMember('secretarioId');
  const tesorero = getDirectorioMember('tesoreroId');

  const [newExpense, setNewExpense] = useState({
    tipoDocumento: 'Factura',
    numeroDocumento: '',
    proveedor: '',
    monto: '',
    categoria: 'Insumos Médicos Veterinarios',
    glosa: ''
  });

  const [newCobro, setNewCobro] = useState({
    titulo: '',
    monto: '',
    asignacion: 'A todos',
    socioId: ''
  });

  const postulacionesPendientes = postulacionesList.filter(p => p.estado === 'Pendiente Revisión Directorio').length;
  const renunciasPendientes = sociosList.filter(s => s.estadoCuota === 'Solicitud Renuncia Pendiente Directorio').length;

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
        alert(`¡Firma digitalizada de ${cargoKey === 'presidenteFirma' ? 'Presidente' : 'Secretario'} actualizada en certificados y documentos!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMiCuentaSubmit = (e) => {
    e.preventDefault();
    updateSocioPerfil(currentSocio.id, {
      email: editEmail.trim(),
      telefono: editTelefono.trim(),
      domicilio: editDomicilio.trim(),
      comuna: editComuna.trim(),
      fotoPerfil: editFotoPerfil
    });
    alert('¡Tus datos de contacto y foto de perfil han sido actualizados!');
  };

  const handleRegisterPayment = (e) => {
    e.preventDefault();
    if (activePaymentModal) {
      updateSocioCuota(
        activePaymentModal.id, 
        'Al Día', 
        comprobanteInput.trim() || 'Validado por Tesorería', 
        false, 
        isCuotaIncorporacionCheck
      );
      
      const pagoData = {
        monto: isCuotaIncorporacionCheck ? (activePaymentModal.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual) : (activePaymentModal.montoCuotaMensual || financialSettings.cuotaMensualActual),
        referencia: comprobanteInput.trim() || 'Validado por Tesorería'
      };
      sendPagoEmail(pagoData, activePaymentModal);

      setActivePaymentModal(null);
      setComprobanteInput('');
      setIsCuotaIncorporacionCheck(false);
    }
  };

  const handleSolicitarRenunciaSubmit = (e) => {
    e.preventDefault();
    if (activeRequestRenunciaModal && motivoRenunciaInput.trim()) {
      solicitarRenunciaSocio(activeRequestRenunciaModal.id, motivoRenunciaInput.trim());
      setActiveRequestRenunciaModal(null);
      setMotivoRenunciaInput('');
      alert('¡Solicitud de renuncia enviada al Directorio Nacional!');
    }
  };

  const handleAprobarRenunciaSubmit = (e) => {
    e.preventDefault();
    if (activeApproveRenunciaModal) {
      aprobarRenunciaDirectorio(activeApproveRenunciaModal.id, actaDirectorioInput.trim() || 'Acta N° 2025-08');
      setActiveApproveRenunciaModal(null);
      setActaDirectorioInput('');
      alert('¡Renuncia aprobada formalmente por el Directorio Nacional!');
    }
  };

  const handleApproveApplicant = (postId, categoriaAsignada) => {
    updatePostulacionEstado(postId, 'Aceptada / Incorporado', categoriaAsignada);
    setActivePostulacionModal(null);
    alert('¡Postulante incorporado exitosamente al Padrón Oficial de Socios!');
  };

  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    if (newExpense.numeroDocumento && newExpense.monto) {
      addExpense({
        ...newExpense,
        monto: Number(newExpense.monto),
        fecha: new Date().toISOString().split('T')[0]
      });
      setNewExpense({
        tipoDocumento: 'Factura',
        numeroDocumento: '',
        proveedor: '',
        monto: '',
        categoria: 'Insumos Médicos Veterinarios',
        glosa: ''
      });
    }
  };

  const handleAddCobroEspecial = (e) => {
    e.preventDefault();
    if (newCobro.titulo && newCobro.monto) {
      let arrayToBatch = [];
      if (newCobro.asignacion === 'A todos') {
        arrayToBatch = sociosList
          .filter(s => s.estadoCuota !== 'Exento' && !s.estadoCuota.includes('Desvinculado') && s.email !== 'ag.pruaned@gmail.com')
          .map(s => ({
            socioId: s.id,
            titulo: newCobro.titulo,
            monto: Number(newCobro.monto),
            fecha: new Date().toISOString().split('T')[0],
            pagado: false
          }));
      } else if (newCobro.socioId) {
        arrayToBatch = [{
          socioId: newCobro.socioId,
          titulo: newCobro.titulo,
          monto: Number(newCobro.monto),
          fecha: new Date().toISOString().split('T')[0],
          pagado: false
        }];
      }

      if (arrayToBatch.length > 0) {
        addCobrosBatch(arrayToBatch);
        setNewCobro({ titulo: '', monto: '', asignacion: 'A todos', socioId: '' });
        alert(`¡Cobro especial aplicado a ${arrayToBatch.length} socio(s)!`);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = "RUT,Nombre,Categoria,EstadoCuota,MesesAdeudados,DeudaCalculadaCLP,UltimoPago\n";
    const rows = sociosList.map(s => {
      const isFeeActive = new Date() >= new Date('2026-09-01');
      const pendingCobros = cobrosList.filter(c => c.socioId === s.id && !c.pagado).reduce((acc, c) => acc + (c.monto || 0), 0);
      const cuotaIncorpPagadaReal = s.cuotaIncorporacionPagada || (s.fechaIngreso && new Date(s.fechaIngreso).getFullYear() < 2026);
      const cuotaIncorp = cuotaIncorpPagadaReal ? 0 : (s.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual);
      const deuda = (s.estadoCuota === 'Exento' || s.estadoCuota.includes('Desvinculado') || s.categoria === 'Socio Honorario') ? 0 : (isFeeActive ? (s.mesesAdeudados || 0) * (s.montoCuotaMensual || financialSettings.cuotaMensualActual) : 0) + cuotaIncorp + pendingCobros;

      return `"${s.rut}","${s.nombre}","${s.categoria}","${s.estadoCuota}","${s.mesesAdeudados || 0}","${deuda}","${s.ultimaCuotaPagada}"`;
    }).join("\n");
    
    const element = document.createElement("a");
    const file = new Blob([headers + rows], { type: 'text/csv;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Padron_Socios_Deudas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <section className="py-12 bg-slate-50 text-slate-900 min-h-screen font-['Plus_Jakarta_Sans']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" /> Intranet de Socios, Directiva & Maestro
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit']">
              Portal de Socios, Padrón & Mi Cuenta
            </h2>
            <p className="text-slate-600 text-xs mt-1">
              Usuario Conectado: <strong className="text-slate-900">{currentUser?.name}</strong> ({currentUser?.email}) • Rol: <span className="uppercase font-bold text-blue-900">{currentUser?.role}</span>
            </p>
          </div>

          <div className="flex flex-wrap bg-slate-200 p-1 rounded-xl border border-slate-300 gap-1">
            <button
              onClick={() => setActiveTabLocal('mi-cuenta')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTabLocal === 'mi-cuenta' ? 'bg-blue-900 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              👤 Mi Cuenta
            </button>

            <button
              onClick={() => setActiveTabLocal('padron')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTabLocal === 'padron' ? 'bg-blue-900 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              Padrón & Cuotas
            </button>

            {canManageCategoriesAndCargos && (
              <button
                onClick={() => setActiveTabLocal('directorio-gestion')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTabLocal === 'directorio-gestion' ? 'bg-blue-900 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
                }`}
              >
                🏛️ Gestión Cargos & Firmas
              </button>
            )}

            {canManageFinances && (
              <>
                <button
                  onClick={() => setActiveTabLocal('renuncias')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all relative ${
                    activeTabLocal === 'renuncias' ? 'bg-blue-900 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
                  }`}
                >
                  Aprobación Renuncias
                  {renunciasPendientes > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-bold">
                      {renunciasPendientes}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTabLocal('postulaciones')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all relative ${
                    activeTabLocal === 'postulaciones' ? 'bg-blue-900 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
                  }`}
                >
                  Postulaciones Socios
                  {postulacionesPendientes > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] rounded-full font-bold">
                      {postulacionesPendientes}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTabLocal('egresos')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTabLocal === 'egresos' ? 'bg-blue-900 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
                  }`}
                >
                  Registro Egresos
                </button>

                <button
                  onClick={() => setActiveTabLocal('cobros-especiales')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTabLocal === 'cobros-especiales' ? 'bg-blue-900 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
                  }`}
                >
                  Cobros Especiales
                </button>

                <button
                  onClick={() => setActiveTabLocal('balance')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTabLocal === 'balance' ? 'bg-blue-900 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
                  }`}
                >
                  Balance General
                </button>
              </>
            )}

            {canManageVoluntarios && (
              <button
                onClick={() => setActiveTab('voluntarios')}
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow flex items-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5" /> Ir a Gestión Voluntarios
              </button>
            )}

            {(isMasterUser || isDirectiva) && (
              <button
                onClick={() => setActiveTabLocal('auditoria')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTabLocal === 'auditoria' ? 'bg-violet-900 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" /> Registro Auditoría
              </button>
            )}
          </div>
        </div>

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
                    <div className="text-[11px] text-slate-500 font-mono">RUT: {currentSocio.rut} • Categoría: {currentSocio.categoria}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Teléfono Móvil *</label>
                    <input
                      type="tel"
                      required
                      value={editTelefono}
                      onChange={(e) => setEditTelefono(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Domicilio Particular *</label>
                    <input
                      type="text"
                      required
                      value={editDomicilio}
                      onChange={(e) => setEditDomicilio(e.target.value)}
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
            </div>
          </div>
        )}

        {/* SUBTAB: GESTIÓN DE CARGOS Y DIGITALIZACIÓN DE FIRMAS (PRESIDENTE & SECRETARIO) */}
        {activeTabLocal === 'directorio-gestion' && canManageCategoriesAndCargos && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            
            {/* Panel 1: Cargos Directivos */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-full uppercase">
                  Atribución Presidente / Secretario (Fe Pública)
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] mt-1 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-600" />
                  Asignación Oficial de Cargos del Directorio Nacional
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 uppercase">Presidente / a</span>
                    <Crown className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={presidente?.fotoPerfil} alt={presidente?.nombre} className="w-12 h-12 rounded-full object-cover border-2 border-blue-900" />
                    <div>
                      <div className="font-bold text-slate-900">{presidente?.nombre}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{presidente?.email}</div>
                    </div>
                  </div>
                  <SocioSearchSelect
                    sociosList={sociosList}
                    selectedId={presidente?.id}
                    onSelect={(id) => updateDirectorioCargo('presidenteId', id)}
                    label="Reasignar Cargo a Socio:"
                  />
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 uppercase">Vicepresidente / a</span>
                    <Award className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={vicepresidente?.fotoPerfil} alt={vicepresidente?.nombre} className="w-12 h-12 rounded-full object-cover border-2 border-blue-900" />
                    <div>
                      <div className="font-bold text-slate-900">{vicepresidente?.nombre}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{vicepresidente?.email}</div>
                    </div>
                  </div>
                  <SocioSearchSelect
                    sociosList={sociosList}
                    selectedId={vicepresidente?.id}
                    onSelect={(id) => updateDirectorioCargo('vicepresidenteId', id)}
                    label="Reasignar Cargo a Socio:"
                  />
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 uppercase">Secretario / a</span>
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={secretario?.fotoPerfil} alt={secretario?.nombre} className="w-12 h-12 rounded-full object-cover border-2 border-blue-900" />
                    <div>
                      <div className="font-bold text-slate-900">{secretario?.nombre}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{secretario?.email}</div>
                    </div>
                  </div>
                  <SocioSearchSelect
                    sociosList={sociosList}
                    selectedId={secretario?.id}
                    onSelect={(id) => updateDirectorioCargo('secretarioId', id)}
                    label="Reasignar Cargo a Socio:"
                  />
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 uppercase">Tesorero / a</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={tesorero?.fotoPerfil} alt={tesorero?.nombre} className="w-12 h-12 rounded-full object-cover border-2 border-blue-900" />
                    <div>
                      <div className="font-bold text-slate-900">{tesorero?.nombre}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{tesorero?.email}</div>
                    </div>
                  </div>
                  <SocioSearchSelect
                    sociosList={sociosList}
                    selectedId={tesorero?.id}
                    onSelect={(id) => updateDirectorioCargo('tesoreroId', id)}
                    label="Reasignar Cargo a Socio:"
                  />
                </div>

              </div>
            </div>

            {/* Panel 2: Digitalización de Firmas Escaneadas */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded-full uppercase">
                  Acreditación de Documentos & Certificados
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] mt-1 flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-blue-900" />
                  Digitalización y Carga de Firmas Escaneadas (PNG Transparente)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Suba los archivos de firma digitalizada del Presidente/a y Secretario/a. Se estamparán automáticamente en los Certificados QR y actas institucionales.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                
                {/* Firma Presidente */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900">Firma Digital Presidente/a</div>
                  <div className="h-20 bg-white border border-dashed border-slate-300 rounded-xl flex items-center justify-center p-2">
                    {firmasOficiales?.presidenteFirma ? (
                      <img src={firmasOficiales.presidenteFirma} alt="Firma Presidente" className="max-h-16 object-contain" />
                    ) : (
                      <span className="text-slate-400 text-xs italic">Sin firma digitalizada</span>
                    )}
                  </div>
                  <label className="block bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 px-3 rounded-xl text-center cursor-pointer shadow">
                    <span>Subir Imagen de Firma (PNG / JPG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUploadFirma('presidenteFirma', e)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Firma Secretario */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900">Firma Digital Secretario/a</div>
                  <div className="h-20 bg-white border border-dashed border-slate-300 rounded-xl flex items-center justify-center p-2">
                    {firmasOficiales?.secretarioFirma ? (
                      <img src={firmasOficiales.secretarioFirma} alt="Firma Secretario" className="max-h-16 object-contain" />
                    ) : (
                      <span className="text-slate-400 text-xs italic">Sin firma digitalizada</span>
                    )}
                  </div>
                  <label className="block bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 px-3 rounded-xl text-center cursor-pointer shadow">
                    <span>Subir Imagen de Firma (PNG / JPG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUploadFirma('secretarioFirma', e)}
                      className="hidden"
                    />
                  </label>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 1: PADRÓN & CONTROL DE DEUDAS */}
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
                    <Download className="w-3.5 h-3.5 text-emerald-400" /> Exportar Deudas (CSV)
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
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-5">Socio / RUT</th>
                        <th className="py-3.5 px-5">Categoría Gremial</th>
                        <th className="py-3.5 px-5">Estado Cuota</th>
                        <th className="py-3.5 px-5">Cuota Incorp.</th>
                        <th className="py-3.5 px-5">Permiso Voluntarios</th>
                        <th className="py-3.5 px-5">Monto Adeudado</th>
                        <th className="py-3.5 px-5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {filteredSocios.map((socio) => {
                      const cuotaMensual = socio.montoCuotaMensual || financialSettings.cuotaMensualActual;
                      const esAntiguo = socio.fechaIngreso && new Date(socio.fechaIngreso).getFullYear() < 2026;
                      const cuotaIncorpPagadaReal = socio.cuotaIncorporacionPagada || esAntiguo;
                      const cuotaIncorp = cuotaIncorpPagadaReal ? 0 : (socio.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual);
                      
                      const currentDate = new Date();
                      const feeStartDate = new Date('2026-09-01');
                      const isFeeActive = currentDate >= feeStartDate;
                      const pendingCobros = cobrosList.filter(c => c.socioId === socio.id && !c.pagado).reduce((acc, c) => acc + (c.monto || 0), 0);
                      const deudaCalculada = (socio.estadoCuota === 'Exento' || socio.estadoCuota.includes('Desvinculado') || socio.categoria === 'Socio Honorario') ? 0 : (isFeeActive ? (socio.mesesAdeudados || 0) * cuotaMensual : 0) + cuotaIncorp + pendingCobros;

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
                            {deudaCalculada > 0 ? (
                              <span className="text-rose-600">
                                ${deudaCalculada.toLocaleString('es-CL')} CLP
                              </span>
                            ) : (
                              <span className="text-emerald-700">$0 CLP</span>
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

                            {socio.estadoCuota === 'Solicitud Renuncia Pendiente Directorio' ? (
                              <button
                                onClick={() => setActiveApproveRenunciaModal(socio)}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg transition-colors"
                              >
                                Evaluando Directorio
                              </button>
                            ) : (
                              <button
                                onClick={() => setActiveRequestRenunciaModal(socio)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-lg transition-colors"
                                title="Solicitar Renuncia al Directorio"
                              >
                                Solicitar Renuncia
                              </button>
                            )}
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

        {/* TAB 2: APROBACIÓN DE RENUNCIAS Y DESVINCULACIÓN */}
        {activeTabLocal === 'renuncias' && canManageFinances && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-600" />
                Solicitudes de Renuncia & Desvinculación Voluntaria (DL N° 2.757)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sociosList.filter(s => s.estadoCuota.includes('Renuncia') || s.estadoCuota.includes('Desvinculado')).map((soc) => (
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
                      <div>• <strong>Fecha Solicitud:</strong> {soc.fechaSolicitudRenuncia || '2026-08-12'}</div>
                      <div>• <strong>Motivo Expresado:</strong> {soc.motivoRenuncia || 'Razones personales'}</div>
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
                          <Check className="w-4 h-4" /> Aprobar Renuncia en Acta de Directorio
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: POSTULACIONES PENDIENTES */}
        {activeTabLocal === 'postulaciones' && canManageFinances && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-900" />
                Postulaciones de Nuevos Socios ({postulacionesList.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {postulacionesList.map((post) => (
                  <div key={post.id} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded-full">
                          {post.id}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base font-['Outfit'] mt-1">
                          {post.nombreCompleto}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">{post.rut} • {post.email}</p>
                      </div>
                      <span className={`badge-inst ${
                        post.estado === 'Aceptada / Incorporado' ? 'badge-green' : 'badge-amber'
                      }`}>
                        {post.estado}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <button
                        onClick={() => setActivePostulacionModal(post)}
                        className="px-3 py-1.5 bg-blue-900 text-white font-bold text-xs rounded-lg flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Revisar Formulario Completo
                      </button>

                      {post.estado === 'Pendiente Revisión Directorio' && (
                        <button
                          onClick={() => handleApproveApplicant(post.id, 'Socio Activo')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Aprobar e Incorporar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
                    <label className="block font-bold text-slate-700 mb-1">N° Documento</label>
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
                    placeholder="Ej: Copec / Droguería Veterinaria"
                    value={newExpense.proveedor}
                    onChange={(e) => setNewExpense({...newExpense, proveedor: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría del Gasto</label>
                  <select
                    value={newExpense.categoria}
                    onChange={(e) => setNewExpense({...newExpense, categoria: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                  >
                    <option value="Insumos Médicos Veterinarios">Insumos Médicos Veterinarios</option>
                    <option value="Logística Terreno & Combustible">Logística Terreno & Combustible</option>
                    <option value="Albergues Temporales & Alimentación">Albergues Temporales & Alimentación</option>
                    <option value="Capacitaciones & Materiales">Capacitaciones & Materiales</option>
                    <option value="Gastos Administrativos">Gastos Administrativos</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Descripción / Glosa</label>
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
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow"
                >
                  Registrar Egreso en Libro
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
                      <th className="py-2.5 px-3">Proveedor / Categoría</th>
                      <th className="py-2.5 px-3">Monto</th>
                      <th className="py-2.5 px-3 text-right">Acción</th>
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
                          <span className="text-[10px] text-rose-600 font-bold">{exp.categoria}</span>
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
        {activeTabLocal === 'balance' && canManageFinances && (
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
                Asignación de Cobros Especiales
              </h3>
              
              <form onSubmit={handleAddCobroEspecial} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Título del Cobro</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Cuota Extraordinaria Asamblea"
                      value={newCobro.titulo}
                      onChange={(e) => setNewCobro({...newCobro, titulo: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Monto ($ CLP)</label>
                    <input
                      type="number"
                      required
                      placeholder="Ej. 10000"
                      value={newCobro.monto}
                      onChange={(e) => setNewCobro({...newCobro, monto: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asignación</label>
                  <select
                    value={newCobro.asignacion}
                    onChange={(e) => setNewCobro({...newCobro, asignacion: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                  >
                    <option value="A todos">A todos los socios activos / morosos</option>
                    <option value="Individual">Individual (Seleccionar socio)</option>
                  </select>
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
          </div>
        )}

        {activeTabLocal === 'auditoria' && (isMasterUser || isDirectiva) && (
          <AuditoriaPanel securityLogs={securityLogs || []} />
        )}

      </div>

      {/* POSTULACION MODAL */}
      {activePostulacionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-['Outfit']">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActivePostulacionModal(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2"><FileText className="w-6 h-6 text-blue-900"/> Detalle de Postulación</h3>
            
            <div className="space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-bold text-slate-400 text-xs uppercase block">Nombre Completo</span>{activePostulacionModal.nombreCompleto}</div>
                <div><span className="font-bold text-slate-400 text-xs uppercase block">RUT</span>{activePostulacionModal.rut}</div>
                <div><span className="font-bold text-slate-400 text-xs uppercase block">Email</span>{activePostulacionModal.email}</div>
                <div><span className="font-bold text-slate-400 text-xs uppercase block">Teléfono</span>{activePostulacionModal.telefono || '-'}</div>
                <div><span className="font-bold text-slate-400 text-xs uppercase block">Profesión</span>{activePostulacionModal.profesion}</div>
                <div><span className="font-bold text-slate-400 text-xs uppercase block">Comuna</span>{activePostulacionModal.comuna}</div>
              </div>
              <div><span className="font-bold text-slate-400 text-xs uppercase block">Motivación</span><p className="mt-1 p-3 bg-slate-50 rounded-lg text-xs leading-relaxed border border-slate-200">{activePostulacionModal.motivacion}</p></div>
              <div><span className="font-bold text-slate-400 text-xs uppercase block">Experiencia</span><p className="mt-1 p-3 bg-slate-50 rounded-lg text-xs leading-relaxed border border-slate-200">{activePostulacionModal.experiencia}</p></div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => setActivePostulacionModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Cerrar
              </button>
              {activePostulacionModal.estado === 'Pendiente Revisión Directorio' && (
                <button
                  onClick={() => {
                    handleApproveApplicant(activePostulacionModal.id, 'Socio Activo');
                    setActivePostulacionModal(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg"
                >
                  <Check className="w-4 h-4" /> Aprobar e Incorporar
                </button>
              )}
            </div>
          </div>
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

              {cobrosList.filter(c => c.socioId === activeSocioModal.id && !c.pagado).length > 0 && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h4 className="font-bold text-amber-900 mb-2 border-b border-amber-200 pb-2 flex items-center gap-2"><DollarSign className="w-4 h-4"/> Cobros Especiales Pendientes</h4>
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

export default SociosIntranet;
