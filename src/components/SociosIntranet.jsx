import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
  ShieldCheck
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
    currentUser 
  } = useAuth();

  const [activeTab, setActiveTab] = useState('padron'); // padron, egresos, balance, configuracion
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('TODOS');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');

  // Modales
  const [activePaymentModal, setActivePaymentModal] = useState(null);
  const [activeSuspensionModal, setActiveSuspensionModal] = useState(null);
  const [comprobanteInput, setComprobanteInput] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isCuotaIncorporacionCheck, setIsCuotaIncorporacionCheck] = useState(false);

  // Formulario Egresos (Tesorería)
  const [newExpense, setNewExpense] = useState({
    tipoDocumento: 'Factura',
    numeroDocumento: '',
    proveedor: '',
    monto: '',
    categoria: 'Insumos Médicos Veterinarios',
    glosa: ''
  });

  // Formulario Configuración Cuotas
  const [editCuotaMensual, setEditCuotaMensual] = useState(financialSettings.cuotaMensualActual);
  const [editCuotaIncorporacion, setEditCuotaIncorporacion] = useState(financialSettings.cuotaIncorporacionActual);

  // Cálculos Financieros
  const totalSocios = sociosList.length;
  const sociosAlDia = sociosList.filter(s => s.estadoCuota === 'Al Día').length;
  const sociosEnMora = sociosList.filter(s => s.estadoCuota === 'En Mora').length;
  
  // Total Ingresos Recaudados (Sumatoria de todos los historialPagos)
  const totalIngresos = sociosList.reduce((acc, socio) => {
    const pagosSocio = socio.historialPagos.reduce((pAcc, p) => pAcc + (p.monto || 0), 0);
    return acc + pagosSocio;
  }, 0);

  // Total Deuda Pendiente en el Padrón
  const totalDeudaPendiente = sociosList.reduce((acc, socio) => {
    if (socio.estadoCuota === 'Exento') return acc;
    const cuotaMensual = socio.montoCuotaMensual || financialSettings.cuotaMensualActual;
    const cuotaIncorp = socio.cuotaIncorporacionPagada ? 0 : (socio.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual);
    const deudaMensual = (socio.mesesAdeudados || 0) * cuotaMensual;
    return acc + deudaMensual + cuotaIncorp;
  }, 0);

  // Total Egresos Realizados
  const totalEgresos = expensesList.reduce((acc, exp) => acc + Number(exp.monto || 0), 0);

  // Saldo Disponible en Caja
  const saldoCaja = totalIngresos - totalEgresos;

  const filteredSocios = sociosList.filter(s => {
    const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.rut.includes(searchTerm) ||
                          s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = selectedEstado === 'TODOS' || s.estadoCuota === selectedEstado;
    const matchesCat = selectedCategory === 'TODAS' || s.categoria === selectedCategory;
    return matchesSearch && matchesEstado && matchesCat;
  });

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

  const handleRequestSuspension = (e) => {
    e.preventDefault();
    if (activeSuspensionModal && suspensionReason.trim()) {
      updateSocioCuota(activeSuspensionModal.id, 'Suspensión Art. 42', null, true);
      setActiveSuspensionModal(null);
      setSuspensionReason('');
    }
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
      alert('¡Gasto registrado exitosamente en el libro de Tesorería!');
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateFinancialSettings(editCuotaMensual, editCuotaIncorporacion);
    alert('¡Valores de cuotas sociales actualizados en el sistema!');
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
    <section className="py-12 bg-slate-50 text-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" /> Intranet de Tesorería & Directorio
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit']">
              Gestión de Cuotas, Egresos & Balance General
            </h2>
            <p className="text-slate-600 text-xs mt-1">
              Control de morosidad, incorporación, registro de gastos y balance en tiempo real.
            </p>
          </div>

          {/* Subtabs Navigation */}
          <div className="flex bg-slate-200 p-1 rounded-xl border border-slate-300 gap-1">
            <button
              onClick={() => setActiveTab('padron')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'padron' ? 'bg-blue-900 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              Padrón & Cuotas
            </button>
            <button
              onClick={() => setActiveTab('egresos')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'egresos' ? 'bg-blue-900 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              Registro Egresos
            </button>
            <button
              onClick={() => setActiveTab('balance')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'balance' ? 'bg-blue-900 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              Balance General
            </button>
            <button
              onClick={() => setActiveTab('configuracion')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'configuracion' ? 'bg-blue-900 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              Configurar Cuotas
            </button>
          </div>
        </div>

        {/* Global Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
              <span>Recaudación Cuotas</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 font-['Outfit']">
              ${totalIngresos.toLocaleString('es-CL')} CLP
            </div>
            <p className="text-[11px] text-slate-500">Ingresos totales percibidos</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
              <span>Egresos / Gastos</span>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-extrabold text-rose-600 font-['Outfit']">
              ${totalEgresos.toLocaleString('es-CL')} CLP
            </div>
            <p className="text-[11px] text-slate-500">{expensesList.length} documentos rendidos</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
              <span>Saldo en Caja</span>
              <Wallet className="w-4 h-4 text-blue-900" />
            </div>
            <div className="text-2xl font-extrabold text-blue-900 font-['Outfit']">
              ${saldoCaja.toLocaleString('es-CL')} CLP
            </div>
            <p className="text-[11px] text-slate-500">Disponible neto en cuenta bancaria</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
              <span>Deuda Total Pendiente</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600 font-['Outfit']">
              ${totalDeudaPendiente.toLocaleString('es-CL')} CLP
            </div>
            <p className="text-[11px] text-slate-500">Cuotas sociales por cobrar</p>
          </div>
        </div>

        {/* TAB 1: PADRÓN & CONTROL DE DEUDAS */}
        {activeTab === 'padron' && (
          <div className="space-y-6 animate-fade-in">
            {/* Filter Bar */}
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

            {/* Socio Table with Dues Calculation */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-5">Socio / RUT</th>
                      <th className="py-3.5 px-5">Categoría</th>
                      <th className="py-3.5 px-5">Estado Cuota</th>
                      <th className="py-3.5 px-5">Cuota Incorporación</th>
                      <th className="py-3.5 px-5">Monto Adeudado</th>
                      <th className="py-3.5 px-5 text-right">Acción Tesorería</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSocios.map((socio) => {
                      const cuotaMensual = socio.montoCuotaMensual || financialSettings.cuotaMensualActual;
                      const cuotaIncorp = socio.cuotaIncorporacionPagada ? 0 : (socio.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual);
                      const deudaCalculada = socio.estadoCuota === 'Exento' ? 0 : ((socio.mesesAdeudados || 0) * cuotaMensual) + cuotaIncorp;

                      return (
                        <tr key={socio.id} className="hover:bg-slate-50 transition-colors">
                          
                          <td className="py-3.5 px-5">
                            <div className="font-bold text-slate-900 text-sm font-['Outfit']">{socio.nombre}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{socio.rut} • {socio.email}</div>
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
                              socio.estadoCuota === 'Suspensión Art. 42' ? 'badge-amber' :
                              'badge-blue'
                            }`}>
                              {socio.estadoCuota}
                            </span>
                          </td>

                          <td className="py-3.5 px-5">
                            {socio.cuotaIncorporacionPagada ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Pagada
                              </span>
                            ) : (
                              <span className="text-rose-600 font-bold">
                                Pendiente (${(socio.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual).toLocaleString('es-CL')})
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 font-mono font-bold">
                            {deudaCalculada > 0 ? (
                              <span className="text-rose-600">
                                ${deudaCalculada.toLocaleString('es-CL')} CLP ({socio.mesesAdeudados || 0} meses)
                              </span>
                            ) : (
                              <span className="text-emerald-700">$0 CLP (Al Día)</span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-right space-x-2">
                            <button
                              onClick={() => setActivePaymentModal(socio)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors"
                            >
                              Registrar Pago
                            </button>

                            <button
                              onClick={() => setActiveSuspensionModal(socio)}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg transition-colors"
                              title="Suspensión Art. 42"
                            >
                              Art. 42
                            </button>
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

        {/* TAB 2: REGISTRO DE EGRESOS (TESORERÍA) */}
        {activeTab === 'egresos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {/* Left: Add Expense Form */}
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:border-blue-900"
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
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:border-blue-900"
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
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:border-blue-900"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría del Gasto</label>
                  <select
                    value={newExpense.categoria}
                    onChange={(e) => setNewExpense({...newExpense, categoria: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:border-blue-900"
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
                    placeholder="Detalle del gasto o compra realizada..."
                    value={newExpense.glosa}
                    onChange={(e) => setNewExpense({...newExpense, glosa: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:border-blue-900"
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

            {/* Right: Expenses Table */}
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

        {/* TAB 3: BALANCE GENERAL PARA DIRECTORIO */}
        {activeTab === 'balance' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                    <PieChart className="w-6 h-6 text-blue-900" />
                    Balance General Financiero (Directorio Nacional)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Vista consolidada de rendición de cuentas pública activa (Art. 45 Estatutos).
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 font-bold block uppercase">Estado de Caja</span>
                  <span className="text-2xl font-extrabold text-emerald-700 font-['Outfit']">
                    ${saldoCaja.toLocaleString('es-CL')} CLP
                  </span>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Ingresos Breakdown */}
                <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 space-y-3 text-xs">
                  <h4 className="font-bold text-emerald-900 text-sm uppercase tracking-wider flex items-center justify-between">
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

                {/* Egresos Breakdown */}
                <div className="bg-rose-50 p-5 rounded-xl border border-rose-200 space-y-3 text-xs">
                  <h4 className="font-bold text-rose-900 text-sm uppercase tracking-wider flex items-center justify-between">
                    <span>Egresos Realizados</span>
                    <TrendingDown className="w-4 h-4 text-rose-700" />
                  </h4>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between border-b border-rose-200 pb-1">
                      <span>Gastos Operativos & Insumos:</span>
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

        {/* TAB 4: CONFIGURACIÓN DE CUOTAS */}
        {activeTab === 'configuracion' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-900" />
                  Configurar Valores de Cuotas Sociales
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Los nuevos valores aplicarán a las futuras cuotas emitidas en la asociación.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Valor de la Cuota Social Mensual ($ CLP)
                  </label>
                  <input
                    type="number"
                    required
                    value={editCuotaMensual}
                    onChange={(e) => setEditCuotaMensual(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:border-blue-900 font-bold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Valor actual en sistema: ${financialSettings.cuotaMensualActual.toLocaleString('es-CL')} CLP</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Valor Cuota de Incorporación ($ CLP)
                  </label>
                  <input
                    type="number"
                    required
                    value={editCuotaIncorporacion}
                    onChange={(e) => setEditCuotaIncorporacion(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:border-blue-900 font-bold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Valor actual incorporación: ${financialSettings.cuotaIncorporacionActual.toLocaleString('es-CL')} CLP</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow"
                >
                  Guardar Nuevos Valores
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Registrar Pago */}
        {activePaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white text-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 relative border border-slate-200">
              <button
                onClick={() => setActivePaymentModal(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>

              <div>
                <h3 className="text-lg font-bold font-['Outfit']">Registrar Pago de Cuota</h3>
                <p className="text-xs text-slate-500">Socio: <strong className="text-slate-900">{activePaymentModal.nombre}</strong></p>
              </div>

              <form onSubmit={handleRegisterPayment} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Concepto de Pago</label>
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCuotaIncorporacionCheck}
                      onChange={(e) => setIsCuotaIncorporacionCheck(e.target.checked)}
                      className="accent-emerald-600"
                    />
                    <span>Incluir Pago de Cuota de Incorporación (${(activePaymentModal.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual).toLocaleString('es-CL')} CLP)</span>
                  </label>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">N° Comprobante / Transferencia (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: TRF-99182 (dejar en blanco para validación directa por Tesorería)"
                    value={comprobanteInput}
                    onChange={(e) => setComprobanteInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePaymentModal(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow"
                  >
                    Confirmar Pago
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
