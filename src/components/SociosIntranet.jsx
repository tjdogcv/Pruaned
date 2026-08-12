import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PrivacyDataPolicy } from './PrivacyDataPolicy';
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
  MapPin
} from 'lucide-react';

export const SociosIntranet = () => {
  const { 
    sociosList, 
    updateSocioCuota, 
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
    isMasterUser,
    isDirectiva,
    canManageVoluntarios,
    canManageFinances,
    canPublishCMS,
    currentUser,
    setActiveTab
  } = useAuth();

  const [activeTabLocal, setActiveTabLocal] = useState('mi-cuenta'); // mi-cuenta, padron, renuncias, postulaciones, egresos, balance
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('TODOS');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');

  // Active logged in Socio data
  const currentSocio = sociosList.find(s => s.email === currentUser?.email) || sociosList[0];

  // Mi Cuenta Edit State
  const [editEmail, setEditEmail] = useState(currentSocio.email || currentUser?.email || '');
  const [editTelefono, setEditTelefono] = useState(currentSocio.telefono || '+56 9 9876 5432');
  const [editDomicilio, setEditDomicilio] = useState(currentSocio.domicilio || 'Av. Bernardo O\'Higgins 1204');
  const [editComuna, setEditComuna] = useState(currentSocio.comuna || 'San Fabián');
  const [editFotoPerfil, setEditFotoPerfil] = useState(currentSocio.fotoPerfil || 'https://images.unsplash.com/photo-1594824813566-7885a3964670?auto=format&fit=crop&w=400&q=80');

  // Modales
  const [activePaymentModal, setActivePaymentModal] = useState(null);
  const [activePostulacionModal, setActivePostulacionModal] = useState(null);
  const [activeRequestRenunciaModal, setActiveRequestRenunciaModal] = useState(null);
  const [activeApproveRenunciaModal, setActiveApproveRenunciaModal] = useState(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const [comprobanteInput, setComprobanteInput] = useState('');
  const [motivoRenunciaInput, setMotivoRenunciaInput] = useState('');
  const [actaDirectorioInput, setActaDirectorioInput] = useState('');
  const [isCuotaIncorporacionCheck, setIsCuotaIncorporacionCheck] = useState(false);

  // Formulario Egresos
  const [newExpense, setNewExpense] = useState({
    tipoDocumento: 'Factura',
    numeroDocumento: '',
    proveedor: '',
    monto: '',
    categoria: 'Insumos Médicos Veterinarios',
    glosa: ''
  });

  // Cálculos Financieros
  const postulacionesPendientes = postulacionesList.filter(p => p.estado === 'Pendiente Revisión Directorio').length;
  const renunciasPendientes = sociosList.filter(s => s.estadoCuota === 'Solicitud Renuncia Pendiente Directorio').length;

  const totalIngresos = sociosList.reduce((acc, socio) => {
    const pagosSocio = socio.historialPagos.reduce((pAcc, p) => pAcc + (p.monto || 0), 0);
    return acc + pagosSocio;
  }, 0);

  const totalEgresos = expensesList.reduce((acc, exp) => acc + Number(exp.monto || 0), 0);
  const saldoCaja = totalIngresos - totalEgresos;

  const filteredSocios = sociosList.filter(s => {
    const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.rut.includes(searchTerm) ||
                          s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = selectedEstado === 'TODOS' || s.estadoCuota === selectedEstado;
    const matchesCat = selectedCategory === 'TODAS' || s.categoria === selectedCategory;
    return matchesSearch && matchesEstado && matchesCat;
  });

  // Handlers
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

  const handleSaveMiCuentaSubmit = (e) => {
    e.preventDefault();
    updateSocioPerfil(currentSocio.id, {
      email: editEmail.trim(),
      telefono: editTelefono.trim(),
      domicilio: editDomicilio.trim(),
      comuna: editComuna.trim(),
      fotoPerfil: editFotoPerfil
    });
    alert('¡Tus datos de contacto y foto de perfil han sido actualizados! Si perteneces al Directorio Nacional, el cambio de foto se reflejó automáticamente en toda la web.');
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
      alert('¡Solicitud de renuncia enviada al Directorio Nacional para su evaluación y acuerdo de acta!');
    }
  };

  const handleAprobarRenunciaSubmit = (e) => {
    e.preventDefault();
    if (activeApproveRenunciaModal) {
      aprobarRenunciaDirectorio(activeApproveRenunciaModal.id, actaDirectorioInput.trim() || 'Acta N° 2025-08');
      setActiveApproveRenunciaModal(null);
      setActaDirectorioInput('');
      alert('¡Renuncia aprobada formalmente por el Directorio Nacional! Se registró en el Padrón Histórico (DL 2757) y se suprimieron los datos personales bajo Ley 21.719.');
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

  const handleExportCSV = () => {
    const headers = "RUT,Nombre,Categoria,EstadoCuota,MesesAdeudados,DeudaCalculadaCLP,UltimoPago\n";
    const rows = sociosList.map(s => {
      const deuda = (s.mesesAdeudados || 0) * (s.montoCuotaMensual || financialSettings.cuotaMensualActual);
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

          {/* Subtabs Navigation */}
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
          </div>
        </div>

        {/* SUBTAB: MI CUENTA (PERFIL DEL SOCIO & EDICIÓN DE FOTO) */}
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
                <p className="text-xs text-slate-500 mt-1">
                  Actualiza tus datos de contacto y tu foto de perfil. Si eres integrante del Directorio Nacional, el cambio de foto se reflejará automáticamente en la web pública.
                </p>
              </div>

              <form onSubmit={handleSaveMiCuentaSubmit} className="space-y-6 text-xs">
                
                {/* Header Foto Perfil & Preview */}
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
                    <div className="pt-1">
                      <span className={`badge-inst ${
                        currentSocio.estadoCuota === 'Al Día' ? 'badge-green' : 'badge-amber'
                      }`}>
                        Estado Cuota: {currentSocio.estadoCuota}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-900" /> Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-900" /> Teléfono Móvil *
                    </label>
                    <input
                      type="tel"
                      required
                      value={editTelefono}
                      onChange={(e) => setEditTelefono(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-900" /> Domicilio Particular *
                    </label>
                    <input
                      type="text"
                      required
                      value={editDomicilio}
                      onChange={(e) => setEditDomicilio(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-900" /> Comuna / Ciudad *
                    </label>
                    <input
                      type="text"
                      required
                      value={editComuna}
                      onChange={(e) => setEditComuna(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                    />
                  </div>

                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    URL Directa de Foto de Perfil (Opcional si usó subir archivo)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editFotoPerfil.startsWith('data:') ? '' : editFotoPerfil}
                    onChange={(e) => {
                      if (e.target.value.trim()) setEditFotoPerfil(e.target.value.trim());
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 text-xs"
                  />
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

        {/* TAB 1: PADRÓN & CONTROL DE DEUDAS */}
        {activeTabLocal === 'padron' && (
          <div className="space-y-6 animate-fade-in">
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
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-5">Socio / RUT</th>
                      <th className="py-3.5 px-5">Categoría</th>
                      <th className="py-3.5 px-5">Estado Cuota</th>
                      <th className="py-3.5 px-5">Permiso Voluntarios</th>
                      <th className="py-3.5 px-5">Monto Adeudado</th>
                      <th className="py-3.5 px-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSocios.map((socio) => {
                      const cuotaMensual = socio.montoCuotaMensual || financialSettings.cuotaMensualActual;
                      const cuotaIncorp = socio.cuotaIncorporacionPagada ? 0 : (socio.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual);
                      const deudaCalculada = (socio.estadoCuota === 'Exento' || socio.estadoCuota.includes('Desvinculado')) ? 0 : ((socio.mesesAdeudados || 0) * cuotaMensual) + cuotaIncorp;

                      return (
                        <tr key={socio.id} className="hover:bg-slate-50 transition-colors">
                          
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <img
                                src={socio.fotoPerfil || "https://images.unsplash.com/photo-1594824813566-7885a3964670?auto=format&fit=crop&w=400&q=80"}
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
                            <span className="px-2.5 py-0.5 bg-slate-100 rounded-full border border-slate-200 text-slate-700 font-semibold text-[11px]">
                              {socio.categoria}
                            </span>
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
                  <p className="text-xs text-slate-500 mt-1">
                    Vista de rendición de cuentas de la Asociación Gremial PRUANED A.G.
                  </p>
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
                    <div className="flex justify-between font-bold text-slate-900 pt-1">
                      <span>TOTAL INGRESOS:</span>
                      <strong className="font-mono text-emerald-900">${totalIngresos.toLocaleString('es-CL')} CLP</strong>
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
                    <div className="flex justify-between font-bold text-slate-900 pt-1">
                      <span>TOTAL EGRESOS:</span>
                      <strong className="font-mono text-rose-900">${totalEgresos.toLocaleString('es-CL')} CLP</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Solicitar Renuncia */}
        {activeRequestRenunciaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white text-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 relative border border-slate-200">
              <button
                onClick={() => setActiveRequestRenunciaModal(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>

              <div className="space-y-1">
                <h3 className="text-lg font-bold font-['Outfit'] text-slate-900 flex items-center gap-2">
                  <UserX className="w-5 h-5 text-amber-600" />
                  Solicitar Renuncia Voluntaria al Directorio
                </h3>
                <p className="text-xs text-slate-500">Socio: <strong className="text-slate-900">{activeRequestRenunciaModal.nombre}</strong></p>
              </div>

              <form onSubmit={handleSolicitarRenunciaSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Motivo de la Renuncia *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Exponga las razones de su solicitud de renuncia voluntaria..."
                    value={motivoRenunciaInput}
                    onChange={(e) => setMotivoRenunciaInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveRequestRenunciaModal(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow"
                  >
                    Ingresar Solicitud a Tabla Directorio
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Privacy Policy Modal */}
        {isPrivacyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
            <PrivacyDataPolicy onClose={() => setIsPrivacyModalOpen(false)} />
          </div>
        )}

      </div>
    </section>
  );
};
